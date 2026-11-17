import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const m = vi.hoisted(() => {
  const prisma = {
    user: { create: vi.fn(), update: vi.fn() },
    passwordResetToken: { findFirst: vi.fn(), deleteMany: vi.fn(), create: vi.fn(), updateMany: vi.fn(), findUnique: vi.fn() },
    $transaction: vi.fn(),
  };
  return {
    prisma,
    sendMail: vi.fn(),
    findUserByEmail: vi.fn(),
    checkRateLimit: vi.fn(),
    hash: vi.fn(),
  };
});

vi.mock("@/lib/prisma", () => ({ prisma: m.prisma }));
vi.mock("@/lib/users", () => ({ findUserByEmail: m.findUserByEmail }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: m.checkRateLimit, getIp: () => "1.1.1.1" }));
vi.mock("nodemailer", () => ({ default: { createTransport: () => ({ sendMail: m.sendMail }) } }));
vi.mock("bcryptjs", () => ({ default: { hash: m.hash, compare: vi.fn() } }));

import { POST as register } from "@/app/api/auth/register/route";
import { POST as forgot } from "@/app/api/auth/forgot-password/route";
import { POST as reset } from "@/app/api/auth/reset-password/route";

const req = (path: string, body: unknown) =>
  new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

beforeEach(() => {
  m.checkRateLimit.mockReturnValue({ allowed: true, remaining: 1 });
  m.findUserByEmail.mockResolvedValue(null);
  m.hash.mockImplementation(async (p: string) => `hash:${p}`);
  m.sendMail.mockResolvedValue({});
  m.prisma.user.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: "u1", ...data }));
  m.prisma.passwordResetToken.findFirst.mockResolvedValue(null);
  m.prisma.$transaction.mockImplementation(async (arg: unknown) =>
    typeof arg === "function" ? (arg as (tx: typeof m.prisma) => unknown)(m.prisma) : Promise.all(arg as unknown[])
  );
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.test");
});

// ─────────────────────────────────────────────────────────────
describe("POST /api/auth/register", () => {
  const body = { name: "  Ana   Souza ", email: " ANA@X.com ", password: "segredo123" };

  it("201: grava e-mail/nome normalizados e não devolve a senha", async () => {
    const res = await register(req("/api/auth/register", body));
    expect(res.status).toBe(201);
    const data = m.prisma.user.create.mock.calls[0][0].data;
    expect(data.email).toBe("ana@x.com");
    expect(data.name).toBe("Ana Souza");
    expect(data.password).toBe("hash:segredo123");
    expect(JSON.stringify(await res.json())).not.toContain("segredo123");
    expect(m.sendMail.mock.calls[0][0].to).toBe("ana@x.com");
  });

  it("400 quando o e-mail já existe em outra caixa (sem criar)", async () => {
    m.findUserByEmail.mockResolvedValue({ id: "old" });
    const res = await register(req("/api/auth/register", body));
    expect(res.status).toBe(400);
    expect(m.findUserByEmail).toHaveBeenCalledWith("ana@x.com");
    expect(m.prisma.user.create).not.toHaveBeenCalled();
  });

  it("e-mail reservado do admin não pode ser cadastrado por senha (mesma resposta de duplicado)", async () => {
    vi.stubEnv("ADMIN_EMAIL", "admin@flertia.com.br");
    const res = await register(req("/api/auth/register", { ...body, email: "ADMIN@flertia.com.br" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Email já cadastrado");
    expect(m.prisma.user.create).not.toHaveBeenCalled();
  });

  it("assunto do e-mail usa o nome em texto puro (sem entidades HTML)", async () => {
    await register(req("/api/auth/register", { ...body, name: "O'Brien Silva" }));
    expect(m.sendMail.mock.calls[0][0].subject).toContain("O'Brien");
  });

  it("400 (não 500) na corrida de unicidade P2002", async () => {
    m.prisma.user.create.mockRejectedValue(Object.assign(new Error("dup"), { code: "P2002" }));
    expect((await register(req("/api/auth/register", body))).status).toBe(400);
  });

  it.each(["{oops", "null", "[]", '"x"'])("400 com corpo inválido %s", async (raw) => {
    expect((await register(req("/api/auth/register", raw))).status).toBe(400);
    expect(m.prisma.user.create).not.toHaveBeenCalled();
  });

  it.each([
    { ...body, password: "1234567" },
    { ...body, password: "somenteletras" },
    { ...body, name: "<script>x</script>" },
    { ...body, email: "nao-email" },
  ])("400 com dado inválido %o", async (b) => {
    expect((await register(req("/api/auth/register", b))).status).toBe(400);
    expect(m.hash).not.toHaveBeenCalled();
  });

  it("campos extras não chegam ao banco (mass assignment)", async () => {
    await register(req("/api/auth/register", { ...body, isAdmin: true, emailVerified: "2020-01-01" }));
    const data = m.prisma.user.create.mock.calls[0][0].data;
    expect(data).not.toHaveProperty("isAdmin");
    expect(data).not.toHaveProperty("emailVerified");
  });

  it("nome com apóstrofo é escapado no HTML do e-mail", async () => {
    await register(req("/api/auth/register", { ...body, name: "O'Brien Silva" }));
    const { html, subject } = m.sendMail.mock.calls[0][0];
    expect(html).toContain("O&#39;Brien");
    expect(subject).not.toMatch(/[\r\n]/);
  });

  it("falha no e-mail ainda responde 201", async () => {
    m.sendMail.mockRejectedValue(new Error("smtp"));
    expect((await register(req("/api/auth/register", body))).status).toBe(201);
  });

  it("429 sem tocar no banco", async () => {
    m.checkRateLimit.mockReturnValue({ allowed: false, remaining: 0 });
    expect((await register(req("/api/auth/register", body))).status).toBe(429);
    expect(m.findUserByEmail).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────
describe("POST /api/auth/forgot-password", () => {
  const USER = { id: "u1", email: "ana@x.com", password: "hash" };

  it("400 com JSON inválido ou e-mail inválido", async () => {
    expect((await forgot(req("/api/auth/forgot-password", "{x"))).status).toBe(400);
    expect((await forgot(req("/api/auth/forgot-password", { email: 123 }))).status).toBe(400);
    expect(m.findUserByEmail).not.toHaveBeenCalled();
  });

  it("e-mail inexistente ou conta Google → 200 idêntico, sem token e sem e-mail", async () => {
    const r1 = await forgot(req("/api/auth/forgot-password", { email: "ninguem@x.com" }));
    m.findUserByEmail.mockResolvedValue({ ...USER, password: null });
    const r2 = await forgot(req("/api/auth/forgot-password", { email: "google@x.com" }));
    expect([r1.status, r2.status]).toEqual([200, 200]);
    expect(await r1.json()).toEqual({ success: true });
    expect(m.prisma.passwordResetToken.create).not.toHaveBeenCalled();
    expect(m.sendMail).not.toHaveBeenCalled();
  });

  it("invalida tokens anteriores, grava só o hash e envia o token em claro para o e-mail do banco", async () => {
    m.findUserByEmail.mockResolvedValue(USER);
    const res = await forgot(req("/api/auth/forgot-password", { email: "  ANA@X.com " }));
    expect(res.status).toBe(200);
    expect(m.findUserByEmail).toHaveBeenCalledWith("ana@x.com");

    expect(m.prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({ where: { userId: "u1" } });
    const stored = m.prisma.passwordResetToken.create.mock.calls[0][0].data;
    const mail = m.sendMail.mock.calls[0][0];
    expect(mail.to).toBe("ana@x.com");
    const raw = /token=([a-f0-9]{64})/.exec(mail.html)?.[1];
    expect(raw).toBeDefined();
    expect(stored.token).toBe(sha256(raw!));
    expect(stored.token).not.toBe(raw);
    expect(mail.html).toContain("https://app.test/auth/reset-password?token=");
  });

  it("não reenvia dentro de 60 s (anti-spam), mas responde 200", async () => {
    m.findUserByEmail.mockResolvedValue(USER);
    m.prisma.passwordResetToken.findFirst.mockResolvedValue({ id: "t" });
    expect((await forgot(req("/api/auth/forgot-password", { email: "ana@x.com" }))).status).toBe(200);
    expect(m.sendMail).not.toHaveBeenCalled();
  });

  it("falha no SMTP responde 200 (não revela se a conta existe)", async () => {
    m.findUserByEmail.mockResolvedValue(USER);
    m.sendMail.mockRejectedValue(new Error("smtp"));
    expect((await forgot(req("/api/auth/forgot-password", { email: "ana@x.com" }))).status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────
describe("POST /api/auth/reset-password", () => {
  const TOKEN = "b".repeat(64);

  beforeEach(() => {
    m.prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 1 });
    m.prisma.passwordResetToken.findUnique.mockResolvedValue({ userId: "u1" });
  });

  it.each(["", "abc", "g".repeat(64), null, 123, { $ne: 1 }])("400 com token mal formado %s, sem tocar no banco", async (token) => {
    expect((await reset(req("/api/auth/reset-password", { token, password: "novaSenha1" }))).status).toBe(400);
    expect(m.prisma.$transaction).not.toHaveBeenCalled();
  });

  it.each(["curta1", "somenteletras", 12345678])("400 com senha fraca %s", async (password) => {
    expect((await reset(req("/api/auth/reset-password", { token: TOKEN, password }))).status).toBe(400);
    expect(m.hash).not.toHaveBeenCalled();
  });

  it("400 com JSON inválido", async () => {
    expect((await reset(req("/api/auth/reset-password", "{x"))).status).toBe(400);
  });

  it("consome o token de forma atômica pelo hash, troca a senha e apaga todos os tokens do usuário", async () => {
    const res = await reset(req("/api/auth/reset-password", { token: TOKEN, password: "novaSenha1" }));
    expect(res.status).toBe(200);
    const where = m.prisma.passwordResetToken.updateMany.mock.calls[0][0].where;
    expect(where.token).toBe(sha256(TOKEN));
    expect(where.used).toBe(false);
    expect(where.expires.gt).toBeInstanceOf(Date);
    expect(m.prisma.user.update).toHaveBeenCalledWith({ where: { id: "u1" }, data: { password: "hash:novaSenha1" } });
    expect(m.prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({ where: { userId: "u1" } });
  });

  it("token expirado, usado ou reutilizado (count 0) → 400 e senha intacta", async () => {
    m.prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
    expect((await reset(req("/api/auth/reset-password", { token: TOKEN, password: "novaSenha1" }))).status).toBe(400);
    expect(m.prisma.user.update).not.toHaveBeenCalled();
  });

  it("erro do banco → 500 sem vazar detalhes", async () => {
    m.prisma.$transaction.mockRejectedValue(new Error("db down: senha=xyz"));
    const res = await reset(req("/api/auth/reset-password", { token: TOKEN, password: "novaSenha1" }));
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("xyz");
  });
});
