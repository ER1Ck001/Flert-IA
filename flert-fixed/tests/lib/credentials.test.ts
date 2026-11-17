import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ findUserByEmail: vi.fn(), compare: vi.fn() }));
vi.mock("@/lib/users", () => ({ findUserByEmail: m.findUserByEmail }));
vi.mock("bcryptjs", () => ({ default: { compare: m.compare } }));

import { authorizeCredentials } from "@/lib/auth-credentials";

const USER = { id: "u1", email: "ana@x.com", name: "Ana", image: null, password: "hash" };

beforeEach(() => {
  m.findUserByEmail.mockResolvedValue(USER);
  m.compare.mockResolvedValue(true);
});

describe("authorizeCredentials", () => {
  it.each([undefined, {}, { email: "ana@x.com" }, { password: "x" }])("credenciais incompletas (%o) → erro, sem banco", async (c) => {
    await expect(authorizeCredentials(c as never)).rejects.toThrow(/obrigatórios/);
    expect(m.findUserByEmail).not.toHaveBeenCalled();
  });

  it("e-mail digitado com espaços/maiúsculas encontra a conta", async () => {
    const r = await authorizeCredentials({ email: "  ANA@X.com ", password: "segredo" });
    expect(m.findUserByEmail).toHaveBeenCalledWith("ana@x.com");
    expect(r).toEqual({ id: "u1", email: "ana@x.com", name: "Ana", image: null });
    expect(r).not.toHaveProperty("password");
  });

  it("e-mail inválido → erro genérico sem consultar o banco", async () => {
    await expect(authorizeCredentials({ email: "nao-e-email", password: "x" })).rejects.toThrow("Email ou senha inválidos");
    expect(m.findUserByEmail).not.toHaveBeenCalled();
  });

  it("senha gigante é rejeitada sem rodar bcrypt", async () => {
    await expect(authorizeCredentials({ email: "ana@x.com", password: "x".repeat(300) })).rejects.toThrow("Email ou senha inválidos");
    expect(m.compare).not.toHaveBeenCalled();
  });

  it("usuário inexistente ainda roda bcrypt (contra hash fictício) — tempo não revela se a conta existe", async () => {
    m.findUserByEmail.mockResolvedValueOnce(null);
    m.compare.mockResolvedValueOnce(false);
    await expect(authorizeCredentials({ email: "ninguem@x.com", password: "qualquer" })).rejects.toThrow("Email ou senha inválidos");
    expect(m.compare).toHaveBeenCalledTimes(1);
    expect(m.compare.mock.calls[0][1]).toMatch(/^\$2[aby]\$12\$/);
  });

  it("usuário inexistente, conta Google (sem senha) e senha errada → mesma mensagem genérica", async () => {
    m.findUserByEmail.mockResolvedValueOnce(null);
    await expect(authorizeCredentials({ email: "ana@x.com", password: "x" })).rejects.toThrow("Email ou senha inválidos");
    m.findUserByEmail.mockResolvedValueOnce({ ...USER, password: null });
    await expect(authorizeCredentials({ email: "ana@x.com", password: "x" })).rejects.toThrow("Email ou senha inválidos");
    m.compare.mockResolvedValueOnce(false);
    await expect(authorizeCredentials({ email: "ana@x.com", password: "x" })).rejects.toThrow("Email ou senha inválidos");
  });
});
