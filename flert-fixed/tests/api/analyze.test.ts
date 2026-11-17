import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const m = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getEntitlement: vi.fn(),
  reserveDailyUsage: vi.fn(),
  releaseDailyUsage: vi.fn(),
  refundDailyUsage: vi.fn(),
  checkRateLimit: vi.fn(),
  generateSuggestions: vi.fn(),
  conversationCreate: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: m.getServerSession }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/subscription", () => ({ getEntitlement: m.getEntitlement }));
vi.mock("@/lib/usage", () => ({
  reserveDailyUsage: m.reserveDailyUsage,
  releaseDailyUsage: m.releaseDailyUsage,
  refundDailyUsage: m.refundDailyUsage,
}));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: m.checkRateLimit }));
vi.mock("@/lib/ai/generate", () => ({ generateSuggestions: m.generateSuggestions }));
vi.mock("@/lib/prisma", () => ({ prisma: { conversation: { create: m.conversationCreate } } }));

import { POST as postImage } from "@/app/api/analyze/route";
import { POST as postText } from "@/app/api/analyze/text/route";

const SUGS = ["resposta um", "resposta dois", "resposta três"];
const paid = (plan = "PREMIUM", dailyLimit: number | null = 30) => ({ plan, isPaid: true, isExpired: false, dailyLimit });

const req = (url: string, body: unknown) =>
  new NextRequest(`http://localhost${url}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

const routes = [
  { name: "/api/analyze", post: postImage, url: "/api/analyze", body: { imageUrl: "data:image/png;base64,AAA", style: "flirty" } },
  { name: "/api/analyze/text", post: postText, url: "/api/analyze/text", body: { context: "ela curte trilha", mode: "start", style: "flirty" } },
];

beforeEach(() => {
  m.getServerSession.mockResolvedValue({ user: { id: "u1" } });
  m.getEntitlement.mockResolvedValue(paid());
  m.reserveDailyUsage.mockResolvedValue({ ok: true, dayKey: "2026-01-09", used: 1 });
  m.releaseDailyUsage.mockResolvedValue(undefined);
  m.refundDailyUsage.mockResolvedValue(true);
  m.checkRateLimit.mockReturnValue({ allowed: true, remaining: 9 });
  m.generateSuggestions.mockResolvedValue({ ok: true, suggestions: SUGS });
  m.conversationCreate.mockResolvedValue({ id: "c1" });
});

describe.each(routes)("$name", ({ post, url, body }) => {
  it("401 sem sessão, sem tocar em cota nem IA", async () => {
    m.getServerSession.mockResolvedValue(null);
    expect((await post(req(url, body))).status).toBe(401);
    expect(m.reserveDailyUsage).not.toHaveBeenCalled();
    expect(m.generateSuggestions).not.toHaveBeenCalled();
  });

  it("400 com JSON inválido", async () => {
    expect((await post(req(url, "{oops"))).status).toBe(400);
  });

  it("403 sem plano pago", async () => {
    m.getEntitlement.mockResolvedValue({ plan: "FREE", isPaid: false, isExpired: false, dailyLimit: 0 });
    const res = await post(req(url, body));
    expect(res.status).toBe(403);
    expect(m.reserveDailyUsage).not.toHaveBeenCalled();
  });

  it("403 com mensagem própria quando o plano expirou", async () => {
    m.getEntitlement.mockResolvedValue({ plan: "FREE", isPaid: false, isExpired: true, dailyLimit: 0 });
    const res = await post(req(url, body));
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.expired).toBe(true);
    expect(data.error).toMatch(/expirou/i);
  });

  it("429 quando a cota diária está esgotada", async () => {
    m.reserveDailyUsage.mockResolvedValue({ ok: false, dayKey: "2026-01-09", used: 30 });
    const res = await post(req(url, body));
    expect(res.status).toBe(429);
    expect(await res.json()).toMatchObject({ limitReached: true, todayCount: 30, dailyLimit: 30 });
    expect(m.generateSuggestions).not.toHaveBeenCalled();
  });

  it("reserva a cota com o limite do plano efetivo", async () => {
    m.getEntitlement.mockResolvedValue(paid("ANNUAL", 50));
    await post(req(url, body));
    expect(m.reserveDailyUsage).toHaveBeenCalledWith("u1", 50);
  });

  it("429 quando excede o rate limit por minuto (antes de consumir cota)", async () => {
    m.checkRateLimit.mockReturnValue({ allowed: false, remaining: 0 });
    const res = await post(req(url, body));
    expect(res.status).toBe(429);
    expect(m.reserveDailyUsage).not.toHaveBeenCalled();
    expect(m.checkRateLimit).toHaveBeenCalledWith("analyze:u1", 10, 60);
  });

  it("502 por erro da OpenAI: sempre devolve a cota e não grava histórico", async () => {
    m.generateSuggestions.mockResolvedValue({ ok: false, reason: "openai_error" });
    const res = await post(req(url, body));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toMatch(/não foi descontada/i);
    expect(m.releaseDailyUsage).toHaveBeenCalledWith("u1", "2026-01-09");
    expect(m.conversationCreate).not.toHaveBeenCalled();
  });

  it("502 por saída inválida: devolve a cota dentro do teto diário", async () => {
    m.generateSuggestions.mockResolvedValue({ ok: false, reason: "invalid_output" });
    const res = await post(req(url, body));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toMatch(/não foi descontada/i);
    expect(m.refundDailyUsage).toHaveBeenCalledWith("u1", "2026-01-09");
    expect(m.conversationCreate).not.toHaveBeenCalled();
  });

  it("502 por saída inválida acima do teto: avisa com honestidade que foi descontada", async () => {
    m.generateSuggestions.mockResolvedValue({ ok: false, reason: "invalid_output" });
    m.refundDailyUsage.mockResolvedValue(false);
    const res = await post(req(url, body));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toMatch(/foi descontada/i);
    expect((await post(req(url, body)).then((r) => r.json())).error).not.toMatch(/não foi descontada/i);
  });

  it("falha ao devolver a cota não derruba a resposta", async () => {
    m.generateSuggestions.mockResolvedValue({ ok: false, reason: "openai_error" });
    m.releaseDailyUsage.mockRejectedValue(new Error("db down"));
    expect((await post(req(url, body))).status).toBe(502);
  });

  it("exceção inesperada na IA também devolve a cota", async () => {
    m.generateSuggestions.mockRejectedValue(new Error("boom"));
    const res = await post(req(url, body));
    expect(res.status).toBe(500);
    expect(m.releaseDailyUsage).toHaveBeenCalledWith("u1", "2026-01-09");
  });

  it("500 quando o banco falha ao gravar: libera a cota", async () => {
    m.conversationCreate.mockRejectedValue(new Error("db down"));
    const res = await post(req(url, body));
    expect(res.status).toBe(500);
    expect(m.releaseDailyUsage).toHaveBeenCalledWith("u1", "2026-01-09");
  });

  it("200: grava a análise com as 3 sugestões e não libera a cota", async () => {
    const res = await post(req(url, body));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ suggestions: SUGS });
    const args = m.conversationCreate.mock.calls[0][0];
    expect(args.data.userId).toBe("u1");
    expect(args.data.messages.create).toEqual(SUGS.map((content) => ({ role: "assistant", content })));
    expect(m.releaseDailyUsage).not.toHaveBeenCalled();
  });

  it("o userId vem sempre da sessão, nunca do corpo", async () => {
    await post(req(url, { ...body, userId: "atacante" }));
    expect(m.conversationCreate.mock.calls[0][0].data.userId).toBe("u1");
  });
});

describe("/api/analyze — validação específica", () => {
  it.each([
    ["URL externa (proxy/SSRF via OpenAI)", "https://evil.example/x.png"],
    ["data URI que não é imagem", "data:text/html;base64,PGgxPg=="],
    ["SVG", "data:image/svg+xml;base64,PHN2Zz4="],
    ["imagem acima de ~10 MB", "data:image/png;base64," + "A".repeat(14_000_001)],
  ])("400 para %s, sem consumir cota", async (_label, imageUrl) => {
    expect((await postImage(req("/api/analyze", { imageUrl }))).status).toBe(400);
    expect(m.reserveDailyUsage).not.toHaveBeenCalled();
  });

  it("400 para contexto acima de 2000 caracteres", async () => {
    const res = await postImage(req("/api/analyze", { imageUrl: "data:image/png;base64,AAA", context: "x".repeat(2001) }));
    expect(res.status).toBe(400);
  });

  it("400 sem imageUrl (antes de consumir cota)", async () => {
    expect((await postImage(req("/api/analyze", { style: "flirty" }))).status).toBe(400);
    expect(m.reserveDailyUsage).not.toHaveBeenCalled();
  });

  it("envia imagem, estilo e contexto para a IA", async () => {
    await postImage(req("/api/analyze", { imageUrl: "data:image/jpeg;base64,AAA", style: "funny", context: "ela respondeu rindo" }));
    expect(m.generateSuggestions).toHaveBeenCalledWith({
      kind: "image",
      imageUrl: "data:image/jpeg;base64,AAA",
      style: "funny",
      context: "ela respondeu rindo",
    });
  });
});

describe("/api/analyze/text — validação específica", () => {
  it.each([{ context: "", mode: "start" }, { context: "   ", mode: "start" }, { mode: "start" }])(
    "400 sem contexto (%o)",
    async (b) => {
      expect((await postText(req("/api/analyze/text", b))).status).toBe(400);
      expect(m.reserveDailyUsage).not.toHaveBeenCalled();
    }
  );

  it("400 para contexto acima de 2000 caracteres", async () => {
    expect((await postText(req("/api/analyze/text", { context: "x".repeat(2001), mode: "start" }))).status).toBe(400);
    expect(m.reserveDailyUsage).not.toHaveBeenCalled();
  });

  it.each(["", "hack", undefined])("400 com modo inválido (%s)", async (mode) => {
    expect((await postText(req("/api/analyze/text", { context: "oi", mode }))).status).toBe(400);
  });

  it("envia modo, estilo e contexto aparado para a IA", async () => {
    await postText(req("/api/analyze/text", { context: "  ela sumiu  ", mode: "situation", style: "serious" }));
    expect(m.generateSuggestions).toHaveBeenCalledWith({
      kind: "text",
      mode: "situation",
      style: "serious",
      context: "ela sumiu",
    });
  });
});
