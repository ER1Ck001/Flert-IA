// Lógica pura do webhook da AbacatePay (API v2). Sem acesso a banco — testável isoladamente.
//
// Segurança (https://docs.abacatepay.com/pages/webhooks/security.md):
//  1. Secret do webhook, enviado no header X-Webhook-Secret e/ou na query ?webhookSecret.
//     Obrigatório: sem ele configurado o endpoint falha fechado.
//  2. Assinatura HMAC-SHA256 (base64) do corpo cru no header X-Webhook-Signature, calculada
//     com a chave pública da AbacatePay. Verificada sempre que ABACATEPAY_PUBLIC_KEY estiver definida.

import crypto from "node:crypto";
import { computeExpiresAt, isPaidPlan, type PaidPlan, type PlanId } from "@/lib/plans";

export type ProductPlanMap = Record<string, PaidPlan>;

/** Prefixo do externalId enviado na criação do checkout: `fia:<userId>:<checkoutKey>:<nonce>`. */
export const EXTERNAL_ID_PREFIX = "fia";

function safeEqual(a: string, b: string): boolean {
  const A = Buffer.from(a, "utf8");
  const B = Buffer.from(b, "utf8");
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}

// ─────────────────────────────────────────────────────────────
// Autenticação
// ─────────────────────────────────────────────────────────────

export type AuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 500; reason: "not_configured" | "bad_secret" | "bad_signature" };

export function authenticateWebhook(input: {
  rawBody: string;
  headerSecret: string | null;
  querySecret: string | null;
  signature: string | null;
  secret: string | undefined;
  publicKey: string | undefined;
  /** Em produção a assinatura HMAC é obrigatória: sem chave pública configurada, falha fechado. */
  requireSignature?: boolean;
}): AuthResult {
  const { rawBody, headerSecret, querySecret, signature, secret, publicKey, requireSignature } = input;

  if (!secret) return { ok: false, status: 500, reason: "not_configured" };
  if (requireSignature && !publicKey) return { ok: false, status: 500, reason: "not_configured" };

  const provided = headerSecret || querySecret || "";
  if (!provided || !safeEqual(provided, secret)) {
    return { ok: false, status: 401, reason: "bad_secret" };
  }

  if (publicKey) {
    if (!signature) return { ok: false, status: 401, reason: "bad_signature" };
    const expected = crypto.createHmac("sha256", publicKey).update(rawBody).digest("base64");
    if (!safeEqual(signature.trim(), expected)) {
      return { ok: false, status: 401, reason: "bad_signature" };
    }
  }

  return { ok: true };
}

// ─────────────────────────────────────────────────────────────
// Interpretação do evento
// ─────────────────────────────────────────────────────────────

export type ParsedEvent =
  | { kind: "paid"; userId: string; plan: PaidPlan; checkoutId: string }
  | { kind: "revoke"; userId: string; checkoutId: string }
  | { kind: "ignored"; event?: string }
  | { kind: "invalid"; reason: string };

const REVOKE_EVENTS = new Set(["checkout.refunded", "checkout.disputed"]);

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const nonEmpty = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

/**
 * userId do nosso banco, a partir do metadata.userId e/ou do externalId que geramos no checkout.
 * Ambos são gerados no servidor; se vierem divergentes o evento é tratado como corrompido.
 */
function resolveUserId(checkout: Record<string, unknown>): string | "mismatch" | null {
  const metadata = checkout.metadata;
  const fromMetadata = isRecord(metadata) && nonEmpty(metadata.userId) ? metadata.userId : null;

  let fromExternalId: string | null = null;
  const externalId = checkout.externalId;
  if (nonEmpty(externalId)) {
    const [prefix, userId] = externalId.split(":");
    if (prefix === EXTERNAL_ID_PREFIX && nonEmpty(userId)) fromExternalId = userId;
  }

  if (fromMetadata && fromExternalId && fromMetadata !== fromExternalId) return "mismatch";
  return fromMetadata ?? fromExternalId;
}

/** O plano é deduzido do produto efetivamente pago — nunca de metadados. */
function resolvePlan(checkout: Record<string, unknown>, products: ProductPlanMap): PaidPlan | null {
  const items = checkout.items;
  if (!Array.isArray(items)) return null;
  for (const item of items) {
    if (isRecord(item) && nonEmpty(item.id)) {
      const plan = Object.prototype.hasOwnProperty.call(products, item.id) ? products[item.id] : undefined;
      if (isPaidPlan(plan)) return plan;
    }
  }
  return null;
}

export function parseWebhookEvent(payload: unknown, products: ProductPlanMap): ParsedEvent {
  if (!isRecord(payload)) return { kind: "invalid", reason: "payload_not_object" };

  const event = typeof payload.event === "string" ? payload.event : undefined;
  const isPaidEvent = event === "checkout.completed";
  const isRevokeEvent = event !== undefined && REVOKE_EVENTS.has(event);
  if (!isPaidEvent && !isRevokeEvent) return { kind: "ignored", event };

  const data = payload.data;
  const checkout = isRecord(data) ? data.checkout : undefined;
  if (!isRecord(checkout)) return { kind: "invalid", reason: "missing_checkout" };

  const checkoutId = checkout.id;
  if (!nonEmpty(checkoutId)) return { kind: "invalid", reason: "missing_checkout_id" };

  const userId = resolveUserId(checkout);
  if (userId === "mismatch") return { kind: "invalid", reason: "user_mismatch" };
  if (!userId) return { kind: "invalid", reason: "missing_user" };

  if (isRevokeEvent) return { kind: "revoke", userId, checkoutId };

  if (checkout.status !== "PAID") return { kind: "ignored", event };

  const plan = resolvePlan(checkout, products);
  if (!plan) return { kind: "invalid", reason: "unknown_product" };

  return { kind: "paid", userId, plan, checkoutId };
}

// ─────────────────────────────────────────────────────────────
// Decisões sobre a assinatura atual
// ─────────────────────────────────────────────────────────────

export type CurrentSubscription = {
  status: PlanId;
  paymentId: string | null;
  expiresAt: Date | null;
} | null;

export type ActivationDecision =
  | { action: "skip"; reason: "duplicate" | "lifetime_kept" }
  | { action: "apply"; status: PaidPlan; activatedAt: Date; expiresAt: Date | null };

const PLAN_RANK: Record<PlanId, number> = { FREE: 0, PREMIUM: 1, ANNUAL: 2, LIFETIME: 3 };

/**
 * Política de ativação — o cliente nunca perde tempo já pago:
 *  - checkout repetido → ignora;
 *  - LIFETIME vigente → nada muda;
 *  - plano com prazo ainda vigente → o novo período é somado ao restante,
 *    e o status final é o de maior nível entre o vigente e o comprado.
 */
export function decideActivation(
  current: CurrentSubscription,
  incoming: { plan: PaidPlan; checkoutId: string },
  now: Date
): ActivationDecision {
  if (current?.paymentId === incoming.checkoutId) return { action: "skip", reason: "duplicate" };
  if (current?.status === "LIFETIME") return { action: "skip", reason: "lifetime_kept" };

  const active =
    current !== null &&
    current.status !== "FREE" &&
    current.expiresAt !== null &&
    current.expiresAt > now;

  const status: PaidPlan =
    active && PLAN_RANK[current!.status] > PLAN_RANK[incoming.plan]
      ? (current!.status as PaidPlan)
      : incoming.plan;

  return {
    action: "apply",
    status,
    activatedAt: now,
    expiresAt: computeExpiresAt(incoming.plan, active ? current!.expiresAt! : now),
  };
}

export function decideRevocation(
  current: CurrentSubscription,
  checkoutId: string
): { action: "revoke" | "skip" } {
  return current?.paymentId === checkoutId ? { action: "revoke" } : { action: "skip" };
}

/** Mapa produto → plano a partir das variáveis de ambiente (somente servidor). */
export function productPlanMapFromEnv(env: NodeJS.ProcessEnv = process.env): ProductPlanMap {
  const map: ProductPlanMap = {};
  const entries: [string | undefined, PaidPlan][] = [
    [env.ABACATEPAY_PRODUCT_ID_MONTHLY, "PREMIUM"],
    [env.ABACATEPAY_PRODUCT_ID_ANNUAL, "ANNUAL"],
    [env.ABACATEPAY_PRODUCT_ID_LIFETIME, "LIFETIME"],
  ];
  for (const [id, plan] of entries) if (id) map[id] = plan;
  return map;
}
