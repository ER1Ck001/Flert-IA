import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: { $queryRaw: vi.fn(), $executeRaw: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { MAX_REFUNDS_PER_DAY, getUsageCount, refundDailyUsage, releaseDailyUsage, reserveDailyUsage } from "@/lib/usage";

const NOW = new Date("2026-01-10T02:30:00Z"); // dia 2026-01-09 em São Paulo

/** Junta as partes de um tagged template do Prisma para inspecionar o SQL. */
const sqlOf = (call: unknown[]) => (call[0] as TemplateStringsArray).join("?");

beforeEach(() => {
  prismaMock.$queryRaw.mockReset();
  prismaMock.$executeRaw.mockReset();
});

describe("reserveDailyUsage", () => {
  it("reserva quando abaixo do limite, usando o dia de São Paulo", async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ count: 5 }]);
    const r = await reserveDailyUsage("u1", 30, NOW);
    expect(r).toEqual({ ok: true, dayKey: "2026-01-09", used: 5 });

    const call = prismaMock.$queryRaw.mock.calls[0];
    expect(sqlOf(call)).toMatch(/INSERT INTO "daily_usage"/);
    expect(sqlOf(call)).toMatch(/ON CONFLICT/);
    expect(sqlOf(call)).toMatch(/WHERE "daily_usage"\."count" </); // condição atômica
    expect(call.slice(1)).toEqual(expect.arrayContaining(["u1", "2026-01-09", 30]));
  });

  it("limite atingido: o UPSERT condicional não retorna linha → ok false", async () => {
    prismaMock.$queryRaw.mockResolvedValue([]);
    expect(await reserveDailyUsage("u1", 30, NOW)).toEqual({ ok: false, dayKey: "2026-01-09", used: 30 });
  });

  it("ilimitado (LIFETIME): incrementa sem condição de limite", async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ count: 999 }]);
    const r = await reserveDailyUsage("u1", null, NOW);
    expect(r).toEqual({ ok: true, dayKey: "2026-01-09", used: 999 });
    expect(sqlOf(prismaMock.$queryRaw.mock.calls[0])).not.toMatch(/WHERE "daily_usage"\."count" </);
  });

  it("limite 0 nunca reserva e nem toca no banco", async () => {
    expect(await reserveDailyUsage("u1", 0, NOW)).toEqual({ ok: false, dayKey: "2026-01-09", used: 0 });
    expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
  });
});

describe("releaseDailyUsage / getUsageCount", () => {
  it("release decrementa sem ficar negativo, no dia da reserva", async () => {
    prismaMock.$executeRaw.mockResolvedValue(1);
    await releaseDailyUsage("u1", "2026-01-09");
    const call = prismaMock.$executeRaw.mock.calls[0];
    expect(sqlOf(call)).toMatch(/GREATEST\("count" - 1, 0\)/);
    expect(call.slice(1)).toEqual(["u1", "2026-01-09"]);
  });

  it("refundDailyUsage só devolve até o teto diário de devoluções (anti-abuso)", async () => {
    expect(MAX_REFUNDS_PER_DAY).toBe(3);
    prismaMock.$queryRaw.mockResolvedValue([{ count: 4 }]);
    expect(await refundDailyUsage("u1", "2026-01-09")).toBe(true);
    const call = prismaMock.$queryRaw.mock.calls[0];
    expect(sqlOf(call)).toMatch(/"refunds" = "refunds" \+ 1/);
    expect(sqlOf(call)).toMatch(/"refunds" </);
    expect(call.slice(1)).toEqual(["u1", "2026-01-09", 3]);

    prismaMock.$queryRaw.mockResolvedValue([]); // teto atingido
    expect(await refundDailyUsage("u1", "2026-01-09")).toBe(false);
  });

  it("getUsageCount devolve 0 quando não há linha", async () => {
    prismaMock.$queryRaw.mockResolvedValue([]);
    expect(await getUsageCount("u1", NOW)).toBe(0);
    prismaMock.$queryRaw.mockResolvedValue([{ count: 7 }]);
    expect(await getUsageCount("u1", NOW)).toBe(7);
  });
});
