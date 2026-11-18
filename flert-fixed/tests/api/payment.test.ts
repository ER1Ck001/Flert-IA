import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getServerSession, rateLimit } = vi.hoisted(() => ({ getServerSession: vi.fn(), rateLimit: vi.fn() }));

vi.mock("next-auth", () => ({ getServerSession }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit }));
vi.mock("@/lib/prisma", () => ({ prisma: { subscriptionStatus: { findUnique: vi.fn() } } }));

import { POST } from "@/app/api/payment/route";

const fetchMock = vi.fn();
let userSeq = 0;

function req(body: unknown) {
  return new NextRequest("http://localhost/api/payment", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  rateLimit.mockResolvedValue({ allowed: true, remaining: 9, retryAfterSec: 0 });
  vi.stubEnv("ABACATEPAY_API_KEY", "key");
  vi.stubEnv("ABACATEPAY_BASE_URL", "https://api.abacatepay.com/v2");
  vi.stubEnv("ABACATEPAY_PRODUCT_ID_MONTHLY", "prod_monthly");
  vi.stubEnv("ABACATEPAY_PRODUCT_ID_ANNUAL", "prod_annual");
  vi.stubEnv("ABACATEPAY_PRODUCT_ID_LIFETIME", "prod_lifetime");
  // usuário novo por teste para não esbarrar no rate limit em memória
  getServerSession.mockResolvedValue({ user: { id: `user_${++userSeq}`, email: "u@example.com", name: null } });
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify({ data: { id: "bill_1", url: "https://app.abacatepay.com/pay/bill_1" } }), { status: 200 })
  );
});

describe("POST /api/payment", () => {
  it("401 sem sessão", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await POST(req({ plan: "monthly" }))).status).toBe(401);
  });

  it.each(["constructor", "__proto__", "toString", "LIFETIME", 1, null])("400 para plano inválido (%s)", async (plan) => {
    const res = await POST(req({ plan }));
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("500 quando o ID do produto não está configurado", async () => {
    vi.stubEnv("ABACATEPAY_PRODUCT_ID_ANNUAL", "");
    const res = await POST(req({ plan: "annual" }));
    expect(res.status).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("cria checkout com o produto certo e externalId do usuário (usuário Google sem nome também pode pagar)", async () => {
    const res = await POST(req({ plan: "lifetime" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: "https://app.abacatepay.com/pay/bill_1" });

    const sent = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sent.items).toEqual([{ id: "prod_lifetime", quantity: 1 }]);
    expect(sent.methods).toEqual(["PIX", "CARD"]);
    expect(sent.externalId).toMatch(new RegExp(`^fia:user_${userSeq}:lifetime:[0-9a-f-]{36}$`));
  });

  it("429 quando o rate limit (persistente) do usuário estoura", async () => {
    rateLimit.mockResolvedValue({ allowed: false, remaining: 0, retryAfterSec: 120 });
    const res = await POST(req({ plan: "monthly" }));
    expect(res.status).toBe(429);
    expect(rateLimit).toHaveBeenCalledWith("payment", `user_${userSeq}`, 10, 3600, { onError: "allow" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("403 com Origin de outro site (CSRF)", async () => {
    const r = new NextRequest("http://localhost/api/payment", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://evil.com" },
      body: JSON.stringify({ plan: "monthly" }),
    });
    expect((await POST(r)).status).toBe(403);
  });

  it("chamada ao gateway tem timeout (não segura a função até o limite da plataforma)", async () => {
    await POST(req({ plan: "monthly" }));
    expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });

  it("500 (erro tratado) quando o gateway não responde a tempo", async () => {
    fetchMock.mockRejectedValue(Object.assign(new Error("The operation was aborted due to timeout"), { name: "TimeoutError" }));
    const res = await POST(req({ plan: "monthly" }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Erro ao criar pagamento" });
  });

  it("502 quando o gateway falha", async () => {
    fetchMock.mockResolvedValue(new Response("boom", { status: 500 }));
    expect((await POST(req({ plan: "monthly" }))).status).toBe(502);
  });
});
