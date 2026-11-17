import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getEntitlement: vi.fn(),
  getUsageCount: vi.fn(),
  count: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: m.getServerSession }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/subscription", () => ({ getEntitlement: m.getEntitlement }));
vi.mock("@/lib/usage", () => ({ getUsageCount: m.getUsageCount }));
vi.mock("@/lib/prisma", () => ({ prisma: { conversation: { count: m.count } } }));

import { GET } from "@/app/api/stats/route";

beforeEach(() => {
  m.getServerSession.mockResolvedValue({ user: { id: "u1" } });
  m.count.mockResolvedValue(12);
  m.getUsageCount.mockResolvedValue(4);
});

describe("GET /api/stats", () => {
  it("401 sem sessão", async () => {
    m.getServerSession.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
  });

  it.each([
    ["FREE", false, false, 0, false],
    ["PREMIUM", true, false, 30, false],
    ["ANNUAL", true, false, 50, false],
    ["LIFETIME", true, false, null, true],
  ])("plano %s → isPaid %s, dailyLimit coerente", async (plan, isPaid, isExpired, dailyLimit, isLifetime) => {
    m.getEntitlement.mockResolvedValue({ plan, isPaid, isExpired, dailyLimit });
    const data = await (await GET()).json();
    expect(data).toMatchObject({ plan, isPaid, isExpired, dailyLimit, isLifetime, today: 4, total: 12 });
    expect(typeof data.resetsAt).toBe("string");
  });

  it("plano expirado aparece como expirado, sem limite", async () => {
    m.getEntitlement.mockResolvedValue({ plan: "FREE", isPaid: false, isExpired: true, dailyLimit: 0 });
    expect(await (await GET()).json()).toMatchObject({ isPaid: false, isExpired: true, dailyLimit: 0 });
  });

  it("erro interno → 500 (não esconde a falha com zeros)", async () => {
    m.getEntitlement.mockRejectedValue(new Error("db down"));
    expect((await GET()).status).toBe(500);
  });
});
