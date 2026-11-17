import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: { user: { findUnique: vi.fn(), findFirst: vi.fn() } },
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { findUserByEmail } from "@/lib/users";
import { isAdminUser, isReservedAdminEmail } from "@/lib/admin";

beforeEach(() => {
  prismaMock.user.findUnique.mockReset();
  prismaMock.user.findFirst.mockReset();
});

describe("findUserByEmail", () => {
  it("busca pelo e-mail normalizado", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "u1" });
    expect(await findUserByEmail("  Foo@X.COM ")).toEqual({ id: "u1" });
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { email: "foo@x.com" } });
    expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
  });

  it("compatível com contas antigas gravadas em caixa mista", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.findFirst.mockResolvedValue({ id: "legado" });
    expect(await findUserByEmail("foo@x.com")).toEqual({ id: "legado" });
    expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
      where: { email: { equals: "foo@x.com", mode: "insensitive" } },
      orderBy: { createdAt: "asc" },
    });
  });
});

describe("isAdminUser", () => {
  beforeEach(() => vi.stubEnv("ADMIN_EMAIL", "admin@flertia.com.br"));

  it("admin é decidido pelo e-mail EXATO gravado no banco, buscado pelo id da sessão", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ email: "admin@flertia.com.br" });
    expect(await isAdminUser("u-admin")).toBe(true);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { id: "u-admin" }, select: { email: true } });
  });

  it("conta com variação de caixa do e-mail do admin NÃO é admin (escalada de privilégio)", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ email: "ADMIN@flertia.com.br" });
    expect(await isAdminUser("atacante")).toBe(false);
  });

  it("ADMIN_EMAIL do ambiente é normalizado (banco só guarda minúsculas)", async () => {
    vi.stubEnv("ADMIN_EMAIL", "  Admin@Flertia.com.br ");
    prismaMock.user.findUnique.mockResolvedValue({ email: "admin@flertia.com.br" });
    expect(await isAdminUser("u-admin")).toBe(true);
  });

  it("e-mail do admin é reservado: cadastro/troca por senha não pode reivindicá-lo", () => {
    expect(isReservedAdminEmail(" ADMIN@flertia.com.br ")).toBe(true);
    expect(isReservedAdminEmail("outra@flertia.com.br")).toBe(false);
  });

  it("sem sessão ou usuário inexistente → false", async () => {
    expect(await isAdminUser(undefined)).toBe(false);
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    prismaMock.user.findUnique.mockResolvedValue(null);
    expect(await isAdminUser("sumiu")).toBe(false);
  });
});
