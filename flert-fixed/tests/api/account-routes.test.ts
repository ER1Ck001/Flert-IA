import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const m = vi.hoisted(() => {
  const prisma = {
    user: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    conversation: { findMany: vi.fn(), deleteMany: vi.fn() },
  };
  return {
    prisma,
    getServerSession: vi.fn(),
    findUserByEmail: vi.fn(),
    sendMail: vi.fn(),
    compare: vi.fn(),
    hash: vi.fn(),
    rateLimit: vi.fn(),
  };
});

vi.mock("next-auth", () => ({ getServerSession: m.getServerSession }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({ prisma: m.prisma }));
vi.mock("@/lib/users", () => ({ findUserByEmail: m.findUserByEmail }));
vi.mock("nodemailer", () => ({ default: { createTransport: () => ({ sendMail: m.sendMail }) } }));
vi.mock("bcryptjs", () => ({ default: { compare: m.compare, hash: m.hash } }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: m.rateLimit }));

import { DELETE as deleteAccount, GET as getProfile, PUT as putProfile } from "@/app/api/profile/route";
import { DELETE as deleteHistory } from "@/app/api/history/route";
import { POST as revokeSessions } from "@/app/api/account/sessions/revoke/route";

const del = (body: unknown) =>
  new NextRequest("http://localhost/api/profile", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const put = (body: unknown) =>
  new NextRequest("http://localhost/api/profile", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

const ME = { id: "u1", name: "Ana", email: "ana@x.com", password: "hash-atual", image: null, subscriptionStatus: null, profile: null };

beforeEach(() => {
  m.getServerSession.mockResolvedValue({ user: { id: "u1" } });
  m.prisma.user.findUnique.mockResolvedValue(ME);
  m.prisma.user.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ ...ME, ...data, subscriptionStatus: null }));
  m.prisma.user.delete.mockResolvedValue(ME);
  m.findUserByEmail.mockResolvedValue(null);
  m.compare.mockResolvedValue(true);
  m.hash.mockImplementation(async (p: string) => `hash:${p}`);
  m.sendMail.mockResolvedValue({});
  m.prisma.conversation.deleteMany.mockResolvedValue({ count: 1 });
  m.rateLimit.mockResolvedValue({ allowed: true, remaining: 1, retryAfterSec: 0 });
});

// ─────────────────────────────────────────────────────────────
describe("GET /api/profile", () => {
  it("informa se a conta tem senha, sem nunca devolver o hash", async () => {
    const data = await (await getProfile(new NextRequest("http://localhost/api/profile"))).json();
    expect(data.user.hasPassword).toBe(true);
    expect(JSON.stringify(data)).not.toContain("hash-atual");
  });
});

describe("PUT /api/profile", () => {
  it("401 sem sessão; 400 com JSON inválido", async () => {
    m.getServerSession.mockResolvedValueOnce(null);
    expect((await putProfile(put({ name: "Ana", email: "ana@x.com" }))).status).toBe(401);
    expect((await putProfile(put("{x"))).status).toBe(400);
  });

  it("trocar só o nome não exige senha; e-mail em outra caixa não conta como troca", async () => {
    const res = await putProfile(put({ name: "  Ana   Maria ", email: "ANA@X.com" }));
    expect(res.status).toBe(200);
    const data = m.prisma.user.update.mock.calls[0][0].data;
    expect(data).toEqual({ name: "Ana Maria" });
    expect(m.compare).not.toHaveBeenCalled();
  });

  it("troca de e-mail sem a senha atual → 400 e nada muda", async () => {
    expect((await putProfile(put({ name: "Ana", email: "nova@x.com" }))).status).toBe(400);
    expect(m.prisma.user.update).not.toHaveBeenCalled();
  });

  it("troca de e-mail com senha errada → 400", async () => {
    m.compare.mockResolvedValue(false);
    expect((await putProfile(put({ name: "Ana", email: "nova@x.com", currentPassword: "errada1" }))).status).toBe(400);
    expect(m.prisma.user.update).not.toHaveBeenCalled();
  });

  it("troca de e-mail válida: normaliza e zera a verificação", async () => {
    const res = await putProfile(put({ name: "Ana", email: " NOVA@X.com ", currentPassword: "certa123" }));
    expect(res.status).toBe(200);
    expect(m.prisma.user.update.mock.calls[0][0].data).toEqual({
      name: "Ana",
      email: "nova@x.com",
      emailVerified: null,
      sessionVersion: { increment: 1 }, // derruba sessões em outros dispositivos
    });
  });

  it("e-mail de outra conta (em qualquer caixa) → 400", async () => {
    m.findUserByEmail.mockResolvedValue({ id: "outro" });
    expect((await putProfile(put({ name: "Ana", email: "Outro@X.com", currentPassword: "certa123" }))).status).toBe(400);
    expect(m.prisma.user.update).not.toHaveBeenCalled();
  });

  it("não é possível trocar o e-mail para o e-mail reservado do admin", async () => {
    vi.stubEnv("ADMIN_EMAIL", "admin@flertia.com.br");
    const res = await putProfile(put({ name: "Ana", email: "Admin@Flertia.com.br", currentPassword: "certa123" }));
    expect(res.status).toBe(400);
    expect(m.prisma.user.update).not.toHaveBeenCalled();
  });

  it("corrida P2002 → 400 (não 500)", async () => {
    m.prisma.user.update.mockRejectedValue(Object.assign(new Error("dup"), { code: "P2002" }));
    expect((await putProfile(put({ name: "Ana", email: "nova@x.com", currentPassword: "certa123" }))).status).toBe(400);
  });

  it("nova senha sem a atual → 400 (antes era ignorada em silêncio)", async () => {
    expect((await putProfile(put({ name: "Ana", email: "ana@x.com", newPassword: "novaSenha1" }))).status).toBe(400);
    expect(m.prisma.user.update).not.toHaveBeenCalled();
  });

  it("nova senha válida com a atual correta → grava o hash", async () => {
    const res = await putProfile(put({ name: "Ana", email: "ana@x.com", currentPassword: "certa123", newPassword: "novaSenha1" }));
    expect(res.status).toBe(200);
    expect(m.prisma.user.update.mock.calls[0][0].data.password).toBe("hash:novaSenha1");
    expect(m.prisma.user.update.mock.calls[0][0].data.sessionVersion).toEqual({ increment: 1 });
    expect(JSON.stringify(await res.json())).not.toContain("hash:");
  });

  it("conta Google (sem senha) não troca e-mail nem senha → 400", async () => {
    m.prisma.user.findUnique.mockResolvedValue({ ...ME, password: null });
    expect((await putProfile(put({ name: "Ana", email: "nova@x.com", currentPassword: "x" }))).status).toBe(400);
    expect((await putProfile(put({ name: "Ana", email: "ana@x.com", currentPassword: "x", newPassword: "novaSenha1" }))).status).toBe(400);
    expect(m.prisma.user.update).not.toHaveBeenCalled();
  });

  it("campos extras (image, subscriptionStatus, id) não chegam ao banco", async () => {
    await putProfile(put({ name: "Ana", email: "ana@x.com", image: "https://evil", id: "x", subscriptionStatus: "LIFETIME" }));
    expect(m.prisma.user.update.mock.calls[0][0].data).toEqual({ name: "Ana" });
  });

  it("nome com HTML → 400", async () => {
    expect((await putProfile(put({ name: "<b>Ana</b>", email: "ana@x.com" }))).status).toBe(400);
  });
});

describe("DELETE /api/profile", () => {
  it.each([{}, { confirm: "excluir" }, { confirm: "SIM" }])("400 sem a confirmação EXCLUIR (%o)", async (b) => {
    expect((await deleteAccount(del(b))).status).toBe(400);
    expect(m.prisma.user.delete).not.toHaveBeenCalled();
  });

  it("conta com senha exige a senha correta", async () => {
    expect((await deleteAccount(del({ confirm: "EXCLUIR" }))).status).toBe(400);
    m.compare.mockResolvedValueOnce(false);
    expect((await deleteAccount(del({ confirm: "EXCLUIR", password: "errada1" }))).status).toBe(400);
    expect(m.prisma.user.delete).not.toHaveBeenCalled();
  });

  it("conta Google exclui só com EXCLUIR", async () => {
    m.prisma.user.findUnique.mockResolvedValue({ ...ME, password: null });
    expect((await deleteAccount(del({ confirm: "EXCLUIR" }))).status).toBe(200);
    expect(m.prisma.user.delete).toHaveBeenCalledWith({ where: { id: "u1" } });
  });

  it("403 com Origin de outro site (CSRF)", async () => {
    const r = new NextRequest("http://localhost/api/profile", {
      method: "DELETE",
      headers: { "content-type": "application/json", origin: "https://evil.com" },
      body: JSON.stringify({ confirm: "EXCLUIR", password: "certa123" }),
    });
    expect((await deleteAccount(r)).status).toBe(403);
  });

  it("nome legado com HTML é escapado no e-mail de exclusão", async () => {
    m.prisma.user.findUnique.mockResolvedValue({ ...ME, name: "<img src=x onerror=1> Ana" });
    expect((await deleteAccount(del({ confirm: "EXCLUIR", password: "certa123" }))).status).toBe(200);
    const { html } = m.sendMail.mock.calls[0][0];
    expect(html).toContain("&lt;img");
    expect(html).not.toContain("<img src=x");
  });
});

// ─────────────────────────────────────────────────────────────
describe("DELETE /api/history", () => {
  const del = (qs: string) => deleteHistory(new NextRequest(`http://localhost/api/history${qs}`, { method: "DELETE" }));

  it("401 sem sessão", async () => {
    m.getServerSession.mockResolvedValue(null);
    expect((await del("?id=clh1x2y3z0000abcd1234efgh")).status).toBe(401);
  });

  it.each(["", "?id=", "?id=../x", "?id=a%27%20OR%201%3D1"])("400 com id inválido (%s), sem tocar no banco", async (qs) => {
    expect((await del(qs)).status).toBe(400);
    expect(m.prisma.conversation.deleteMany).not.toHaveBeenCalled();
  });

  it("apaga só se for do usuário da sessão (userId da query é ignorado)", async () => {
    const res = await del("?id=clh1x2y3z0000abcd1234efgh&userId=outro");
    expect(res.status).toBe(200);
    expect(m.prisma.conversation.deleteMany).toHaveBeenCalledWith({
      where: { id: "clh1x2y3z0000abcd1234efgh", userId: "u1" },
    });
  });

  it("inexistente ou de outro usuário → 404 (antes era 500)", async () => {
    m.prisma.conversation.deleteMany.mockResolvedValue({ count: 0 });
    expect((await del("?id=clh1x2y3z0000abcd1234efgh")).status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────
describe("POST /api/account/sessions/revoke (sair de todos os dispositivos)", () => {
  const post = (headers: Record<string, string> = {}) =>
    new NextRequest("http://localhost/api/account/sessions/revoke", { method: "POST", headers });

  it("401 sem sessão", async () => {
    m.getServerSession.mockResolvedValue(null);
    expect((await revokeSessions(post())).status).toBe(401);
  });

  it("incrementa sessionVersion do usuário da sessão", async () => {
    const res = await revokeSessions(post());
    expect(res.status).toBe(200);
    expect(m.prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { sessionVersion: { increment: 1 } },
      select: { id: true },
    });
  });

  it("403 com Origin de outro site", async () => {
    expect((await revokeSessions(post({ origin: "https://evil.com" }))).status).toBe(403);
    expect(m.prisma.user.update).not.toHaveBeenCalled();
  });

  it("429 quando o limite estoura", async () => {
    m.rateLimit.mockResolvedValue({ allowed: false, remaining: 0, retryAfterSec: 60 });
    expect((await revokeSessions(post())).status).toBe(429);
  });
});
