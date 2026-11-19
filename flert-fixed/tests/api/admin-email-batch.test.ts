import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// Tarefa 9 (M8): envio em massa limitado (concorrência + orçamento de tempo) e retomável por cursor.
const m = vi.hoisted(() => {
  const prisma = {
    user: { findUnique: vi.fn(), findMany: vi.fn() },
    subscriptionStatus: { findMany: vi.fn() },
  };
  return { prisma, getServerSession: vi.fn(), isAdminUser: vi.fn(), sendMail: vi.fn() };
});

vi.mock("next-auth", () => ({ getServerSession: m.getServerSession }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({ prisma: m.prisma }));
vi.mock("@/lib/admin", () => ({ isAdminUser: m.isAdminUser }));
vi.mock("nodemailer", () => ({ default: { createTransport: () => ({ sendMail: m.sendMail }) } }));

import { POST, maxDuration } from "@/app/api/admin/email/route";
import { EMAIL_CONCURRENCY, EMAIL_SEND_DEADLINE_MS, EMAIL_START_CUTOFF_MS } from "@/lib/email/bulk";

const post = (body: unknown, headers: Record<string, string> = {}) =>
  POST(
    new NextRequest("http://localhost/api/admin/email", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
    })
  );

// ids em ordem não alfabética de propósito: a ordem de envio é por id.
const users = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: `u${String(n - i).padStart(4, "0")}`, email: `u${i}@x.com`, name: `U${i}` }));

const sendTakes = (ms: number) =>
  m.sendMail.mockImplementation(() => new Promise((r) => setTimeout(() => r({}), ms)));

beforeEach(() => {
  vi.useFakeTimers();
  m.getServerSession.mockResolvedValue({ user: { id: "admin" } });
  m.isAdminUser.mockResolvedValue(true);
  m.prisma.user.findMany.mockResolvedValue([]);
  m.prisma.subscriptionStatus.findMany.mockResolvedValue([]);
  m.sendMail.mockResolvedValue({});
});
afterEach(() => {
  vi.useRealTimers();
});

async function run(body: unknown) {
  const pending = post(body);
  await vi.advanceTimersByTimeAsync(EMAIL_SEND_DEADLINE_MS + 1000);
  const res = await pending;
  return { res, json: await res.json() };
}

describe("POST /api/admin/email em lotes", () => {
  it("limites coerentes com o maxDuration", () => {
    expect(maxDuration).toBe(60);
    expect(EMAIL_CONCURRENCY).toBe(5);
    expect(EMAIL_START_CUTOFF_MS).toBeLessThan(EMAIL_SEND_DEADLINE_MS);
    expect(EMAIL_SEND_DEADLINE_MS + 10_000).toBeLessThanOrEqual(maxDuration * 1000);
  });

  it("lista pequena: envia tudo, remaining 0 e nextCursor null (mesmos campos de antes + novos)", async () => {
    m.prisma.user.findMany.mockResolvedValue(users(7));
    const { res, json } = await run({ template: "free_upsell" });
    expect(res.status).toBe(200);
    expect(json).toEqual({ sent: 7, failed: 0, total: 7, processed: 7, remaining: 0, nextCursor: null });
    expect(m.sendMail).toHaveBeenCalledTimes(7);
  });

  it("seleção de destinatários idêntica (mesmos filtros)", async () => {
    await run({ template: "free_upsell" });
    // Tarefa 10: mesmos filtros de antes + opt-in de marketing (LGPD).
    expect(m.prisma.user.findMany.mock.calls[0][0].where).toEqual({ subscriptionStatus: { status: "FREE" }, marketingOptIn: true });
    await run({ template: "custom", targetPlan: "PREMIUM", customSubject: "a", customBody: "b" });
    expect(m.prisma.user.findMany.mock.calls[1][0].where).toEqual({ subscriptionStatus: { status: "PREMIUM" }, marketingOptIn: true });
    await run({ template: "custom", targetPlan: "ALL", customSubject: "a", customBody: "b" });
    expect(m.prisma.user.findMany.mock.calls[2][0].where).toEqual({ marketingOptIn: true });
    await run({ template: "expiring" });
    const where = m.prisma.subscriptionStatus.findMany.mock.calls[0][0].where;
    expect(where.status).toEqual({ in: ["PREMIUM", "ANNUAL"] });
    expect(Object.keys(where.expiresAt).sort()).toEqual(["gte", "lte"]);
    // Aviso de plano vencendo é transacional: todos com plano vencendo, sem exigir opt-in.
    expect(where.user).toBeUndefined();
  });

  it("expiring em massa: sem cabeçalhos de descadastro", async () => {
    m.prisma.subscriptionStatus.findMany.mockResolvedValue([
      { expiresAt: new Date(Date.now() + 3 * 86400000), user: { id: "a", email: "a@x.com", name: "A" } },
    ]);
    const { json } = await run({ template: "expiring" });
    expect(json.sent).toBe(1);
    expect(m.sendMail.mock.calls[0][0].headers).toBeUndefined();
  });

  it("no máximo 5 envios simultâneos", async () => {
    m.prisma.user.findMany.mockResolvedValue(users(23));
    let inFlight = 0;
    let peak = 0;
    m.sendMail.mockImplementation(async () => {
      inFlight++;
      peak = Math.max(peak, inFlight);
      await new Promise((r) => setTimeout(r, 100));
      inFlight--;
      return {};
    });
    const { json } = await run({ template: "free_upsell" });
    expect(json.sent).toBe(23);
    expect(peak).toBe(EMAIL_CONCURRENCY);
  });

  it("lista grande: para de iniciar envios no corte de tempo e devolve o que falta + cursor; a 2ª chamada continua sem repetir", async () => {
    const list = users(400);
    m.prisma.user.findMany.mockResolvedValue(list);
    sendTakes(1000); // 1 s por e-mail, 5 em paralelo → ~5/s
    const first = await run({ template: "free_upsell" });
    expect(first.json.total).toBe(400);
    expect(first.json.sent).toBeGreaterThan(0);
    expect(first.json.sent).toBeLessThan(400);
    expect(first.json.processed).toBe(first.json.sent);
    expect(first.json.remaining).toBe(400 - first.json.processed);
    const sortedIds = list.map((u) => u.id).sort();
    expect(first.json.nextCursor).toBe(sortedIds[first.json.processed - 1]);
    const firstRecipients = m.sendMail.mock.calls.map((c) => c[0].to);

    m.sendMail.mockClear();
    m.sendMail.mockResolvedValue({});
    const second = await run({ template: "free_upsell", cursor: first.json.nextCursor });
    expect(second.json.sent).toBe(first.json.remaining);
    expect(second.json.remaining).toBe(0);
    expect(second.json.nextCursor).toBeNull();
    const secondRecipients = m.sendMail.mock.calls.map((c) => c[0].to);
    expect(secondRecipients.filter((to) => firstRecipients.includes(to))).toEqual([]);
    expect(new Set([...firstRecipients, ...secondRecipients]).size).toBe(400);
  });

  it("SMTP travado: responde antes do maxDuration, conta como falha e não reenvia esses destinatários", async () => {
    m.prisma.user.findMany.mockResolvedValue(users(12));
    m.sendMail.mockImplementation(() => new Promise(() => {}));
    const pending = post({ template: "free_upsell" });
    let done = false;
    void pending.then(() => (done = true));
    await vi.advanceTimersByTimeAsync(EMAIL_SEND_DEADLINE_MS);
    expect(done).toBe(true);
    const json = await (await pending).json();
    expect(json.sent).toBe(0);
    expect(json.failed).toBe(EMAIL_CONCURRENCY);
    expect(json.processed).toBe(EMAIL_CONCURRENCY);
    expect(json.remaining).toBe(12 - EMAIL_CONCURRENCY);
  });

  it("e-mail nulo é pulado sem contar como falha (como antes)", async () => {
    m.prisma.user.findMany.mockResolvedValue([{ id: "a", email: null, name: null }, { id: "b", email: "b@x.com", name: "B" }]);
    const { json } = await run({ template: "free_upsell" });
    expect(json).toMatchObject({ sent: 1, failed: 0, total: 2, remaining: 0 });
  });

  it("cursor inválido → 400 sem enviar", async () => {
    const res = await post({ template: "free_upsell", cursor: "../x" });
    expect(res.status).toBe(400);
    expect(m.sendMail).not.toHaveBeenCalled();
  });

  it("checagens de origem e admin continuam antes de tudo", async () => {
    const cross = await post({ template: "free_upsell" }, { origin: "https://evil.example", "sec-fetch-site": "cross-site" });
    expect(cross.status).toBe(403);
    m.isAdminUser.mockResolvedValue(false);
    expect((await post({ template: "free_upsell" })).status).toBe(401);
    expect(m.prisma.user.findMany).not.toHaveBeenCalled();
  });
});
