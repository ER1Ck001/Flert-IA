// Fonte única das regras de plano. Isomórfico: pode ser importado no cliente e no servidor
// (não importa @prisma/client em runtime).

export const PAID_PLANS = ["PREMIUM", "ANNUAL", "LIFETIME"] as const;

export type PaidPlan = (typeof PAID_PLANS)[number];
export type PlanId = "FREE" | PaidPlan;

const DAY_MS = 24 * 60 * 60 * 1000;

const DURATION_DAYS: Record<PaidPlan, number | null> = {
  PREMIUM: 30,
  ANNUAL: 365,
  LIFETIME: null,
};

export function isPaidPlan(value: unknown): value is PaidPlan {
  return typeof value === "string" && (PAID_PLANS as readonly string[]).includes(value);
}

/** Data de expiração de um plano contratado em `from`. LIFETIME nunca expira. */
export function computeExpiresAt(plan: PaidPlan, from: Date): Date | null {
  const days = DURATION_DAYS[plan];
  return days === null ? null : new Date(from.getTime() + days * DAY_MS);
}
