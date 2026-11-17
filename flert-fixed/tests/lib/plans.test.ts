import { describe, expect, it } from "vitest";
import { PAID_PLANS, computeExpiresAt, isPaidPlan } from "@/lib/plans";

const NOW = new Date("2026-03-10T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

describe("plans", () => {
  it("lista somente os planos pagos", () => {
    expect(PAID_PLANS).toEqual(["PREMIUM", "ANNUAL", "LIFETIME"]);
  });

  it.each(["PREMIUM", "ANNUAL", "LIFETIME"])("isPaidPlan(%s) é true", (p) => {
    expect(isPaidPlan(p)).toBe(true);
  });

  it.each(["FREE", "premium", "HACK", "", null, undefined, 1, {}])(
    "isPaidPlan(%s) é false",
    (p) => {
      expect(isPaidPlan(p)).toBe(false);
    }
  );

  it("PREMIUM expira em 30 dias", () => {
    expect(computeExpiresAt("PREMIUM", NOW)?.getTime()).toBe(NOW.getTime() + 30 * DAY);
  });

  it("ANNUAL expira em 365 dias", () => {
    expect(computeExpiresAt("ANNUAL", NOW)?.getTime()).toBe(NOW.getTime() + 365 * DAY);
  });

  it("LIFETIME não expira", () => {
    expect(computeExpiresAt("LIFETIME", NOW)).toBeNull();
  });
});
