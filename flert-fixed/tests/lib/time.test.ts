import { describe, expect, it } from "vitest";
import { getDayKey, nextResetAt, startOfDay } from "@/lib/time";

describe("time (America/Sao_Paulo)", () => {
  it("02:30Z ainda é o dia anterior em São Paulo (UTC-3)", () => {
    expect(getDayKey(new Date("2026-01-10T02:30:00Z"))).toBe("2026-01-09");
  });

  it("03:00Z é a virada do dia em São Paulo", () => {
    expect(getDayKey(new Date("2026-01-10T02:59:59.999Z"))).toBe("2026-01-09");
    expect(getDayKey(new Date("2026-01-10T03:00:00Z"))).toBe("2026-01-10");
  });

  it("startOfDay devolve a meia-noite local como instante UTC", () => {
    expect(startOfDay(new Date("2026-01-10T02:30:00Z")).toISOString()).toBe("2026-01-09T03:00:00.000Z");
    expect(startOfDay(new Date("2026-01-10T15:00:00Z")).toISOString()).toBe("2026-01-10T03:00:00.000Z");
  });

  it("nextResetAt é a próxima meia-noite local", () => {
    expect(nextResetAt(new Date("2026-01-10T15:00:00Z")).toISOString()).toBe("2026-01-11T03:00:00.000Z");
  });

  it("não depende do fuso do servidor", () => {
    const original = process.env.TZ;
    try {
      for (const tz of ["UTC", "Asia/Tokyo", "America/Los_Angeles"]) {
        process.env.TZ = tz;
        expect(getDayKey(new Date("2026-01-10T02:30:00Z"))).toBe("2026-01-09");
        expect(startOfDay(new Date("2026-01-10T02:30:00Z")).toISOString()).toBe("2026-01-09T03:00:00.000Z");
      }
    } finally {
      process.env.TZ = original;
    }
  });
});
