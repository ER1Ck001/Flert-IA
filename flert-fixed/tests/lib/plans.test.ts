import { describe, expect, it } from "vitest";
import {
  PAID_PLANS,
  PLAN_CONFIG,
  PLAN_LABELS,
  annualSavingsCents,
  computeExpiresAt,
  formatBRL,
  getDailyLimit,
  getEffectivePlan,
  getPlanBenefits,
  isPaidPlan,
  isPlanExpired,
  planFromCheckoutKey,
} from "@/lib/plans";

const NOW = new Date("2026-03-10T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;
const future = new Date(NOW.getTime() + DAY);
const past = new Date(NOW.getTime() - DAY);

describe("plans — básicos", () => {
  it("lista somente os planos pagos", () => {
    expect(PAID_PLANS).toEqual(["PREMIUM", "ANNUAL", "LIFETIME"]);
  });

  it.each(["PREMIUM", "ANNUAL", "LIFETIME"])("isPaidPlan(%s) é true", (p) => {
    expect(isPaidPlan(p)).toBe(true);
  });

  it.each(["FREE", "premium", "HACK", "", null, undefined, 1, {}])("isPaidPlan(%s) é false", (p) => {
    expect(isPaidPlan(p)).toBe(false);
  });

  it("PREMIUM expira em 30 dias, ANNUAL em 365, LIFETIME nunca", () => {
    expect(computeExpiresAt("PREMIUM", NOW)?.getTime()).toBe(NOW.getTime() + 30 * DAY);
    expect(computeExpiresAt("ANNUAL", NOW)?.getTime()).toBe(NOW.getTime() + 365 * DAY);
    expect(computeExpiresAt("LIFETIME", NOW)).toBeNull();
  });
});

describe("getEffectivePlan", () => {
  it("sem assinatura → FREE", () => {
    expect(getEffectivePlan(null, NOW)).toBe("FREE");
    expect(getEffectivePlan(undefined, NOW)).toBe("FREE");
  });

  it("PREMIUM/ANNUAL vigentes continuam valendo", () => {
    expect(getEffectivePlan({ status: "PREMIUM", expiresAt: future }, NOW)).toBe("PREMIUM");
    expect(getEffectivePlan({ status: "ANNUAL", expiresAt: future.toISOString() }, NOW)).toBe("ANNUAL");
  });

  it("PREMIUM/ANNUAL expirados viram FREE", () => {
    expect(getEffectivePlan({ status: "PREMIUM", expiresAt: past }, NOW)).toBe("FREE");
    expect(getEffectivePlan({ status: "ANNUAL", expiresAt: past }, NOW)).toBe("FREE");
  });

  it("expiresAt exatamente agora conta como expirado", () => {
    expect(getEffectivePlan({ status: "PREMIUM", expiresAt: NOW }, NOW)).toBe("FREE");
  });

  it("PREMIUM/ANNUAL sem data de expiração falham fechado (FREE)", () => {
    expect(getEffectivePlan({ status: "PREMIUM", expiresAt: null }, NOW)).toBe("FREE");
  });

  it("LIFETIME nunca expira", () => {
    expect(getEffectivePlan({ status: "LIFETIME", expiresAt: null }, NOW)).toBe("LIFETIME");
    expect(getEffectivePlan({ status: "LIFETIME", expiresAt: past }, NOW)).toBe("LIFETIME");
  });

  it("status desconhecido → FREE", () => {
    expect(getEffectivePlan({ status: "HACK", expiresAt: future }, NOW)).toBe("FREE");
  });

  it("isPlanExpired só é true para plano pago vencido", () => {
    expect(isPlanExpired({ status: "PREMIUM", expiresAt: past }, NOW)).toBe(true);
    expect(isPlanExpired({ status: "PREMIUM", expiresAt: future }, NOW)).toBe(false);
    expect(isPlanExpired({ status: "FREE", expiresAt: null }, NOW)).toBe(false);
    expect(isPlanExpired(null, NOW)).toBe(false);
  });
});

describe("limites, rótulos e benefícios", () => {
  it("limite diário por plano", () => {
    expect(getDailyLimit("FREE")).toBe(0);
    expect(getDailyLimit("PREMIUM")).toBe(30);
    expect(getDailyLimit("ANNUAL")).toBe(50);
    expect(getDailyLimit("LIFETIME")).toBeNull();
  });

  it("rótulos cobrem todos os planos, inclusive ANNUAL", () => {
    expect(PLAN_LABELS).toEqual({ FREE: "Sem plano", PREMIUM: "Mensal", ANNUAL: "Anual", LIFETIME: "Vitalício" });
  });

  it("benefícios começam pelo limite real do plano", () => {
    expect(getPlanBenefits("PREMIUM")[0]).toBe("30 análises por dia");
    expect(getPlanBenefits("ANNUAL")[0]).toBe("50 análises por dia");
    expect(getPlanBenefits("LIFETIME")[0]).toBe("Análises ilimitadas");
  });

  it("benefícios não prometem recursos inexistentes", () => {
    const all = PAID_PLANS.flatMap(getPlanBenefits).join(" | ").toLowerCase();
    for (const fake of ["análise de perfil", "alertas", "badge", "modo personalizado", "boleto", "vip", "antecipado", "uploads ilimitados", "updates futuros"]) {
      expect(all).not.toContain(fake);
    }
  });

  it("checkout keys mapeiam para os planos", () => {
    expect(planFromCheckoutKey("monthly")).toBe("PREMIUM");
    expect(planFromCheckoutKey("annual")).toBe("ANNUAL");
    expect(planFromCheckoutKey("lifetime")).toBe("LIFETIME");
    expect(planFromCheckoutKey("constructor")).toBeNull();
    expect(planFromCheckoutKey(undefined)).toBeNull();
  });

  it("preços e economia anual são derivados da configuração", () => {
    expect(PLAN_CONFIG.PREMIUM.priceCents).toBe(2990);
    expect(PLAN_CONFIG.ANNUAL.priceCents).toBe(14700);
    expect(PLAN_CONFIG.LIFETIME.priceCents).toBe(29700);
    expect(annualSavingsCents()).toBe(12 * 2990 - 14700);
    expect(formatBRL(2990)).toBe("R$ 29,90");
    expect(formatBRL(annualSavingsCents())).toBe("R$ 211,80");
    expect(formatBRL(29700)).toBe("R$ 297,00");
  });
});
