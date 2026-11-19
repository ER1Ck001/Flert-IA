import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// Tarefa 10: com LEGAL_PUBLISHED = true, o cadastro também registra o aceite dos Termos (versão + data).
const m = vi.hoisted(() => ({ create: vi.fn(), sendMail: vi.fn() }));

vi.mock("@/content/legal/config", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/content/legal/config")>()),
  LEGAL_PUBLISHED: true,
  LEGAL_VERSION: "v-teste",
}));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { create: m.create } } }));
vi.mock("@/lib/users", () => ({ findUserByEmail: vi.fn(async () => null) }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn(async () => ({ allowed: true })), getIp: () => "1.1.1.1" }));
vi.mock("nodemailer", () => ({ default: { createTransport: () => ({ sendMail: m.sendMail }) } }));
vi.mock("bcryptjs", () => ({ default: { hash: vi.fn(async () => "hash"), compare: vi.fn() } }));

import { POST as register } from "@/app/api/auth/register/route";

const req = (body: unknown) =>
  new NextRequest("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  m.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: "u1", ...data }));
  m.sendMail.mockResolvedValue({});
});

describe("POST /api/auth/register com documentos publicados", () => {
  it("400 sem aceitar, com mensagem citando os Termos", async () => {
    const res = await register(req({ name: "Ana Lima", email: "a@x.com", password: "segredo123" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Termos de Uso/);
  });

  it("grava termsAcceptedAt e termsVersion junto com adultConfirmedAt", async () => {
    const res = await register(req({ name: "Ana Lima", email: "a@x.com", password: "segredo123", adultConfirmed: true }));
    expect(res.status).toBe(201);
    const data = m.create.mock.calls[0][0].data;
    expect(data.adultConfirmedAt).toBeInstanceOf(Date);
    expect(data.termsAcceptedAt).toBeInstanceOf(Date);
    expect(data.termsVersion).toBe("v-teste");
  });
});
