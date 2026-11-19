import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// Tarefa 10: rotas de consentimento (18+, opt-in de marketing, descadastro) e bloqueios 18+.
const m = vi.hoisted(() => {
  const prisma = {
    user: { create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), findUnique: vi.fn(), findMany: vi.fn() },
    subscriptionStatus: { findMany: vi.fn() },
  };
  return {
    prisma,
    getServerSession: vi.fn(),
    isAdminUser: vi.fn(),
    sendMail: vi.fn(),
    findUserByEmail: vi.fn(),
    rateLimit: vi.fn(),
    hash: vi.fn(),
  };
});

vi.mock("next-auth", () => ({ getServerSession: m.getServerSession }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({ prisma: m.prisma }));
vi.mock("@/lib/admin", () => ({ isAdminUser: m.isAdminUser, isReservedAdminEmail: () => false }));
vi.mock("@/lib/users", () => ({ findUserByEmail: m.findUserByEmail }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: m.rateLimit, getIp: () => "1.1.1.1" }));
vi.mock("nodemailer", () => ({ default: { createTransport: () => ({ sendMail: m.sendMail }) } }));
vi.mock("bcryptjs", () => ({ default: { hash: m.hash, compare: vi.fn() } }));

import { POST as register } from "@/app/api/auth/register/route";
import { PUT as putMarketing } from "@/app/api/account/marketing/route";
import { POST as confirmAge } from "@/app/api/account/confirm-age/route";
import { GET as unsubGet, POST as unsubPost } from "@/app/api/email/unsubscribe/route";
import { POST as adminEmail } from "@/app/api/admin/email/route";
import { POST as payment } from "@/app/api/payment/route";
import { requireAdultConfirmed, ADULT_REQUIRED_ERROR } from "@/lib/adult";
import { unsubscribeToken } from "@/lib/email/unsubscribe";

const json = (url: string, method: string, body: unknown, headers: Record<string, string> = {}) =>
  new NextRequest(`http://localhost${url}`, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

const ID = "clh1x2y3z0000abcd1234efgh";

beforeEach(() => {
  m.rateLimit.mockResolvedValue({ allowed: true, remaining: 1, retryAfterSec: 0 });
  m.findUserByEmail.mockResolvedValue(null);
  m.hash.mockImplementation(async (p: string) => `hash:${p}`);
  m.sendMail.mockResolvedValue({});
  m.prisma.user.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: "u1", ...data }));
  m.prisma.user.update.mockResolvedValue({});
  m.prisma.user.updateMany.mockResolvedValue({ count: 1 });
  m.prisma.user.findMany.mockResolvedValue([]);
  m.prisma.subscriptionStatus.findMany.mockResolvedValue([]);
  m.getServerSession.mockResolvedValue({ user: { id: "u1" } });
  m.isAdminUser.mockResolvedValue(true);
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.test");
});

// ─────────────────────────────────────────────────────────────
describe("POST /api/auth/register — 18+ e opt-in", () => {
  const body = { name: "Ana Souza", email: "ana@x.com", password: "segredo123" };

  it("400 sem confirmar 18+ (não cria conta)", async () => {
    const res = await register(json("/api/auth/register", "POST", body));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/18 anos/);
    expect(m.prisma.user.create).not.toHaveBeenCalled();
  });

  it("grava adultConfirmedAt; opt-in desligado por padrão; sem Termos enquanto não publicados", async () => {
    const res = await register(json("/api/auth/register", "POST", { ...body, adultConfirmed: true }));
    expect(res.status).toBe(201);
    const data = m.prisma.user.create.mock.calls[0][0].data;
    expect(data.adultConfirmedAt).toBeInstanceOf(Date);
    expect(data.marketingOptIn).toBe(false);
    expect(data.marketingOptInAt).toBeNull();
    expect(data).not.toHaveProperty("termsAcceptedAt");
    expect(data).not.toHaveProperty("termsVersion");
  });

  it("opt-in marcado grava marketingOptIn e a data", async () => {
    await register(json("/api/auth/register", "POST", { ...body, adultConfirmed: true, marketingOptIn: true }));
    const data = m.prisma.user.create.mock.calls[0][0].data;
    expect(data.marketingOptIn).toBe(true);
    expect(data.marketingOptInAt).toBeInstanceOf(Date);
  });
});

// ─────────────────────────────────────────────────────────────
describe("PUT /api/account/marketing", () => {
  it("401 sem sessão", async () => {
    m.getServerSession.mockResolvedValue(null);
    expect((await putMarketing(json("/api/account/marketing", "PUT", { optIn: true }))).status).toBe(401);
  });

  it("403 de outra origem (CSRF)", async () => {
    const res = await putMarketing(json("/api/account/marketing", "PUT", { optIn: true }, { origin: "https://evil.com" }));
    expect(res.status).toBe(403);
    expect(m.prisma.user.update).not.toHaveBeenCalled();
  });

  it.each(["{x", { optIn: "sim" }, {}, { optIn: true, marketingOptIn: true, sessionVersion: 0 }])("400 com corpo inválido %o", async (b) => {
    expect((await putMarketing(json("/api/account/marketing", "PUT", b))).status).toBe(400);
    expect(m.prisma.user.update).not.toHaveBeenCalled();
  });

  it("liga com data e desliga limpando a data; só o próprio usuário", async () => {
    let res = await putMarketing(json("/api/account/marketing", "PUT", { optIn: true }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ marketingOptIn: true });
    let call = m.prisma.user.update.mock.calls[0][0];
    expect(call.where).toEqual({ id: "u1" });
    expect(call.data.marketingOptIn).toBe(true);
    expect(call.data.marketingOptInAt).toBeInstanceOf(Date);
    expect(Object.keys(call.data).sort()).toEqual(["marketingOptIn", "marketingOptInAt"]);

    res = await putMarketing(json("/api/account/marketing", "PUT", { optIn: false }));
    call = m.prisma.user.update.mock.calls[1][0];
    expect(call.data).toEqual({ marketingOptIn: false, marketingOptInAt: null });
  });
});

// ─────────────────────────────────────────────────────────────
describe("POST /api/account/confirm-age", () => {
  it("401 sem sessão", async () => {
    m.getServerSession.mockResolvedValue(null);
    expect((await confirmAge(json("/api/account/confirm-age", "POST", { adultConfirmed: true }))).status).toBe(401);
  });

  it("403 de outra origem (CSRF)", async () => {
    const res = await confirmAge(json("/api/account/confirm-age", "POST", { adultConfirmed: true }, { origin: "https://evil.com" }));
    expect(res.status).toBe(403);
  });

  it.each([{}, { adultConfirmed: false }, { adultConfirmed: "true" }])("400 sem a confirmação %o", async (b) => {
    const res = await confirmAge(json("/api/account/confirm-age", "POST", b));
    expect(res.status).toBe(400);
    expect(m.prisma.user.update).not.toHaveBeenCalled();
  });

  it("grava adultConfirmedAt e não mexe em mais nada (nem sessionVersion)", async () => {
    const res = await confirmAge(json("/api/account/confirm-age", "POST", { adultConfirmed: true }));
    expect(res.status).toBe(200);
    const call = m.prisma.user.update.mock.calls[0][0];
    expect(call.where).toEqual({ id: "u1" });
    expect(Object.keys(call.data)).toEqual(["adultConfirmedAt"]);
    expect(call.data.adultConfirmedAt).toBeInstanceOf(Date);
  });

  it("404 se a conta não existe mais", async () => {
    m.prisma.user.update.mockRejectedValue(Object.assign(new Error("x"), { code: "P2025" }));
    expect((await confirmAge(json("/api/account/confirm-age", "POST", { adultConfirmed: true }))).status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────
describe("/api/email/unsubscribe (link assinado, sem login)", () => {
  const url = (u: string, t: string) => `/api/email/unsubscribe?u=${encodeURIComponent(u)}&t=${encodeURIComponent(t)}`;
  const oneClick = (u: string, t: string, origin?: string) =>
    new NextRequest(`http://localhost${url(u, t)}`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", ...(origin ? { origin } : {}) },
      body: "List-Unsubscribe=One-Click",
    });
  const form = (u: string, t: string) =>
    new NextRequest(`http://localhost${url(u, t)}`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", origin: "http://localhost" },
      body: "",
    });

  it("one-click (RFC 8058) com token válido: 200 e desliga o opt-in (aceita POST de outra origem)", async () => {
    const res = await unsubPost(oneClick(ID, unsubscribeToken(ID), "https://mail.google.com"));
    expect(res.status).toBe(200);
    expect(m.prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: ID },
      data: { marketingOptIn: false, marketingOptInAt: null },
    });
  });

  it("formulário da página: 303 para a confirmação", async () => {
    const res = await unsubPost(form(ID, unsubscribeToken(ID)));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("http://localhost/descadastrar?status=ok");
    expect(m.prisma.user.updateMany).toHaveBeenCalledTimes(1);
  });

  it("token inválido: não altera nada", async () => {
    let res = await unsubPost(oneClick(ID, "a".repeat(64)));
    expect(res.status).toBe(400);
    res = await unsubPost(form(ID, "a".repeat(64)));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("http://localhost/descadastrar?status=invalid");
    res = await unsubPost(oneClick("../x", unsubscribeToken("../x")));
    expect(res.status).toBe(400);
    expect(m.prisma.user.updateMany).not.toHaveBeenCalled();
  });

  it("conta já excluída: mesma resposta de sucesso (não revela se o usuário existe)", async () => {
    m.prisma.user.updateMany.mockResolvedValue({ count: 0 });
    const res = await unsubPost(oneClick(ID, unsubscribeToken(ID)));
    expect(res.status).toBe(200);
  });

  it("GET não altera nada: redireciona para a página de confirmação", async () => {
    const t = unsubscribeToken(ID);
    const res = await unsubGet(new NextRequest(`http://localhost${url(ID, t)}`));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe(`http://localhost/descadastrar?u=${ID}&t=${t}`);
    expect(m.prisma.user.updateMany).not.toHaveBeenCalled();
  });

  it("429 quando estoura o limite por IP", async () => {
    m.rateLimit.mockResolvedValue({ allowed: false, remaining: 0, retryAfterSec: 60 });
    expect((await unsubPost(oneClick(ID, unsubscribeToken(ID)))).status).toBe(429);
    expect(m.prisma.user.updateMany).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────
describe("POST /api/admin/email — promocionais só para quem aceitou (opt-in)", () => {
  it("seleções promocionais filtram marketingOptIn = true; aviso de vencimento (transacional) não", async () => {
    await adminEmail(json("/api/admin/email", "POST", { template: "free_upsell" }));
    expect(m.prisma.user.findMany.mock.calls[0][0].where).toEqual({ subscriptionStatus: { status: "FREE" }, marketingOptIn: true });
    await adminEmail(json("/api/admin/email", "POST", { template: "custom", targetPlan: "ALL", customSubject: "a", customBody: "b" }));
    expect(m.prisma.user.findMany.mock.calls[1][0].where).toEqual({ marketingOptIn: true });
    await adminEmail(json("/api/admin/email", "POST", { template: "expiring" }));
    expect(m.prisma.subscriptionStatus.findMany.mock.calls[0][0].where.user).toBeUndefined();
  });

  it("aviso de vencimento individual vai mesmo sem opt-in, sem descadastro", async () => {
    m.prisma.user.findUnique.mockResolvedValue({
      email: "u@x.com",
      name: "Ana",
      marketingOptIn: false,
      subscriptionStatus: { status: "PREMIUM", expiresAt: new Date(Date.now() + 3 * 86400000) },
    });
    const res = await adminEmail(json("/api/admin/email", "POST", { template: "expiring", userId: ID }));
    expect(res.status).toBe(200);
    const mail = m.sendMail.mock.calls[0][0];
    expect(mail.headers).toBeUndefined();
    expect(mail.html).not.toContain("Não quero mais receber");
  });

  it.each([
    ["sem assinatura", null],
    ["plano gratuito", { status: "FREE", expiresAt: null }],
    ["vitalício", { status: "LIFETIME", expiresAt: null }],
    ["plano já vencido", { status: "PREMIUM", expiresAt: new Date(Date.now() - 86400000) }],
  ])("aviso de vencimento individual: 409 quando %s, sem enviar", async (_n, sub) => {
    m.prisma.user.findUnique.mockResolvedValue({ email: "u@x.com", name: "Ana", marketingOptIn: true, subscriptionStatus: sub });
    const res = await adminEmail(json("/api/admin/email", "POST", { template: "expiring", userId: ID }));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/plano/);
    expect(m.sendMail).not.toHaveBeenCalled();
  });

  it("envio individual para quem não aceitou: 409 e nada enviado", async () => {
    m.prisma.user.findUnique.mockResolvedValue({ email: "u@x.com", name: "Ana", marketingOptIn: false, subscriptionStatus: null });
    const res = await adminEmail(json("/api/admin/email", "POST", { template: "free_upsell", userId: ID }));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/não aceitou/);
    expect(m.sendMail).not.toHaveBeenCalled();
  });

  it("envia com List-Unsubscribe do próprio destinatário e link visível", async () => {
    m.prisma.user.findMany.mockResolvedValue([{ id: ID, email: "u@x.com", name: "Ana" }]);
    const res = await adminEmail(json("/api/admin/email", "POST", { template: "free_upsell" }));
    expect(res.status).toBe(200);
    const mail = m.sendMail.mock.calls[0][0];
    const t = unsubscribeToken(ID);
    expect(mail.headers).toEqual({
      "List-Unsubscribe": `<https://app.test/api/email/unsubscribe?u=${ID}&t=${t}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    });
    expect(mail.html).toContain("Não quero mais receber");
    expect(mail.html).toContain(`https://app.test/descadastrar?u=${ID}&amp;t=${t}`);
  });
});

// ─────────────────────────────────────────────────────────────
describe("bloqueio 18+ no servidor (fonte da verdade = banco)", () => {
  it("requireAdultConfirmed: null quando confirmado; 403 claro quando não", async () => {
    m.prisma.user.findUnique.mockResolvedValue({ adultConfirmedAt: new Date() });
    expect(await requireAdultConfirmed("u1")).toBeNull();
    expect(m.prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: "u1" }, select: { adultConfirmedAt: true } });

    m.prisma.user.findUnique.mockResolvedValue({ adultConfirmedAt: null });
    const res = await requireAdultConfirmed("u1");
    expect(res?.status).toBe(403);
    const body = await res!.json();
    expect(body).toEqual({ error: ADULT_REQUIRED_ERROR, adultRequired: true });
    expect(ADULT_REQUIRED_ERROR).toMatch(/18 anos/);

    m.prisma.user.findUnique.mockResolvedValue(null);
    expect((await requireAdultConfirmed("u1"))?.status).toBe(403);
  });

  it("POST /api/payment: 403 sem confirmação, sem chamar o gateway", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    m.prisma.user.findUnique.mockResolvedValue({ adultConfirmedAt: null });
    const res = await payment(json("/api/payment", "POST", { plan: "monthly" }));
    expect(res.status).toBe(403);
    expect((await res.json()).adultRequired).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
