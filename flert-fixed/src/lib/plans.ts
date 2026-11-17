// Fonte única das regras de plano. Isomórfico: pode ser importado no cliente e no servidor
// (não importa @prisma/client em runtime).

export const PAID_PLANS = ["PREMIUM", "ANNUAL", "LIFETIME"] as const;

export type PaidPlan = (typeof PAID_PLANS)[number];
export type PlanId = "FREE" | PaidPlan;
export type CheckoutKey = "monthly" | "annual" | "lifetime";
export type PaymentMethod = "PIX" | "CARD";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface PlanConfig {
  id: PaidPlan;
  checkoutKey: CheckoutKey;
  label: string;
  priceCents: number;
  periodLabel: string;
  durationDays: number | null;
  /** Análises por dia; null = ilimitado. */
  dailyLimit: number | null;
  methods: readonly PaymentMethod[];
  cta: string;
  /** Selo factual exibido no card (nunca alegações sem dados, como "mais popular"). */
  badge?: string;
}

export const PLAN_CONFIG: Record<PaidPlan, PlanConfig> = {
  PREMIUM: {
    id: "PREMIUM",
    checkoutKey: "monthly",
    label: "Mensal",
    priceCents: 2990,
    periodLabel: "/mês",
    durationDays: 30,
    dailyLimit: 30,
    methods: ["CARD"],
    cta: "Assinar Mensal",
  },
  ANNUAL: {
    id: "ANNUAL",
    checkoutKey: "annual",
    label: "Anual",
    priceCents: 14700,
    periodLabel: "/ano",
    durationDays: 365,
    dailyLimit: 50,
    methods: ["CARD"],
    cta: "Assinar Anual",
  },
  LIFETIME: {
    id: "LIFETIME",
    checkoutKey: "lifetime",
    label: "Vitalício",
    priceCents: 29700,
    periodLabel: "pagamento único",
    durationDays: null,
    dailyLimit: null,
    methods: ["PIX", "CARD"],
    cta: "Comprar Vitalício",
    badge: "Pagamento único",
  },
};

export const PLANS_IN_ORDER: readonly PlanConfig[] = PAID_PLANS.map((p) => PLAN_CONFIG[p]);

export const PLAN_LABELS: Record<PlanId, string> = {
  FREE: "Sem plano",
  PREMIUM: PLAN_CONFIG.PREMIUM.label,
  ANNUAL: PLAN_CONFIG.ANNUAL.label,
  LIFETIME: PLAN_CONFIG.LIFETIME.label,
};

/** Recursos que existem de fato e valem para todos os planos pagos. */
export const COMMON_BENEFITS: readonly string[] = [
  "Análise de prints de conversas e stories",
  "Ideias para começar uma conversa",
  "Ajuda para responder situações específicas",
  "7 tons de resposta",
  "3 sugestões por análise",
  "Histórico das suas análises",
  "Suporte por e-mail",
];

export function isPaidPlan(value: unknown): value is PaidPlan {
  return typeof value === "string" && (PAID_PLANS as readonly string[]).includes(value);
}

export function planFromCheckoutKey(key: unknown): PaidPlan | null {
  return PLANS_IN_ORDER.find((p) => p.checkoutKey === key)?.id ?? null;
}

/** Data de expiração de um plano contratado em `from`. LIFETIME nunca expira. */
export function computeExpiresAt(plan: PaidPlan, from: Date): Date | null {
  const days = PLAN_CONFIG[plan].durationDays;
  return days === null ? null : new Date(from.getTime() + days * DAY_MS);
}

type StoredSubscription = { status: string; expiresAt: Date | string | null } | null | undefined;

/**
 * Plano que vale agora. PREMIUM/ANNUAL vencidos — ou sem data de expiração — viram FREE
 * (falha fechada). LIFETIME nunca expira. Calculado na leitura; o banco guarda o histórico.
 */
export function getEffectivePlan(sub: StoredSubscription, now: Date = new Date()): PlanId {
  if (!sub || !isPaidPlan(sub.status)) return "FREE";
  if (sub.status === "LIFETIME") return "LIFETIME";
  if (!sub.expiresAt) return "FREE";
  return new Date(sub.expiresAt).getTime() > now.getTime() ? sub.status : "FREE";
}

/** true quando havia um plano pago com prazo e ele venceu. */
export function isPlanExpired(sub: StoredSubscription, now: Date = new Date()): boolean {
  return !!sub && isPaidPlan(sub.status) && getEffectivePlan(sub, now) === "FREE";
}

/** Análises por dia; 0 sem plano, null = ilimitado. */
export function getDailyLimit(plan: PlanId): number | null {
  return plan === "FREE" ? 0 : PLAN_CONFIG[plan].dailyLimit;
}

export function getPlanBenefits(plan: PaidPlan): string[] {
  const limit = PLAN_CONFIG[plan].dailyLimit;
  const head = limit === null ? "Análises ilimitadas" : `${limit} análises por dia`;
  const extra = plan === "LIFETIME" ? ["Pagamento único, sem mensalidade"] : [];
  return [head, ...COMMON_BENEFITS, ...extra];
}

export function formatBRL(cents: number): string {
  const [int, dec] = (cents / 100).toFixed(2).split(".");
  return `R$ ${int.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${dec}`;
}

/** Economia do Anual em relação a 12 meses do Mensal. */
export function annualSavingsCents(): number {
  return 12 * PLAN_CONFIG.PREMIUM.priceCents - PLAN_CONFIG.ANNUAL.priceCents;
}

export function methodsLabel(methods: readonly PaymentMethod[]): string {
  const names = methods.map((m) => (m === "PIX" ? "PIX" : "cartão de crédito"));
  return names.join(" ou ");
}
