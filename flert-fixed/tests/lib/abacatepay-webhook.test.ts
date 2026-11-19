import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  authenticateWebhook,
  decideActivation,
  decideRevocation,
  parseWebhookEvent,
  type ProductPlanMap,
} from "@/lib/payments/abacatepay-webhook";

const SECRET = "s".repeat(40);
const PUBLIC_KEY = "public-key-for-tests";
const NOW = new Date("2026-03-10T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

const PRODUCTS: ProductPlanMap = {
  prod_monthly: "PREMIUM",
  prod_annual: "ANNUAL",
  prod_lifetime: "LIFETIME",
};

const sign = (body: string, key = PUBLIC_KEY) =>
  crypto.createHmac("sha256", key).update(body).digest("base64");

function paidPayload(overrides: Record<string, unknown> = {}) {
  return {
    id: "log_1",
    event: "checkout.completed",
    apiVersion: 2,
    devMode: false,
    data: {
      checkout: {
        id: "bill_1",
        status: "PAID",
        externalId: "fia:user_1:monthly:123",
        items: [{ id: "prod_monthly", quantity: 1 }],
        metadata: { userId: "user_1", plan: "PREMIUM" },
        ...overrides,
      },
      customer: { id: "cust_1", email: "x@example.com" },
    },
  };
}

// ─────────────────────────────────────────────────────────────
describe("authenticateWebhook", () => {
  const body = JSON.stringify(paidPayload());

  it("falha fechado (500) quando o secret não está configurado", () => {
    const r = authenticateWebhook({ rawBody: body, headerSecret: SECRET, querySecret: null, signature: null, secret: undefined, publicKey: undefined });
    expect(r).toEqual({ ok: false, status: 500, reason: "not_configured" });
  });

  it("rejeita (401) sem secret na requisição", () => {
    const r = authenticateWebhook({ rawBody: body, headerSecret: null, querySecret: null, signature: null, secret: SECRET, publicKey: undefined });
    expect(r).toMatchObject({ ok: false, status: 401 });
  });

  it("rejeita (401) secret errado, inclusive de tamanho diferente", () => {
    for (const wrong of ["x".repeat(40), "curto"]) {
      const r = authenticateWebhook({ rawBody: body, headerSecret: wrong, querySecret: null, signature: null, secret: SECRET, publicKey: undefined });
      expect(r).toMatchObject({ ok: false, status: 401 });
    }
  });

  it("aceita secret pelo header X-Webhook-Secret", () => {
    const r = authenticateWebhook({ rawBody: body, headerSecret: SECRET, querySecret: null, signature: null, secret: SECRET, publicKey: undefined });
    expect(r).toEqual({ ok: true });
  });

  it("aceita secret pela query ?webhookSecret", () => {
    const r = authenticateWebhook({ rawBody: body, headerSecret: null, querySecret: SECRET, signature: null, secret: SECRET, publicKey: undefined });
    expect(r).toEqual({ ok: true });
  });

  it("em produção, sem chave pública configurada → 500 (falha fechado)", () => {
    const r = authenticateWebhook({ rawBody: body, headerSecret: SECRET, querySecret: null, signature: null, secret: SECRET, publicKey: undefined, requireSignature: true });
    expect(r).toEqual({ ok: false, status: 500, reason: "not_configured" });
  });

  it("com chave pública configurada, exige assinatura", () => {
    const r = authenticateWebhook({ rawBody: body, headerSecret: SECRET, querySecret: null, signature: null, secret: SECRET, publicKey: PUBLIC_KEY });
    expect(r).toMatchObject({ ok: false, status: 401 });
  });

  it("com chave pública configurada, rejeita assinatura inválida ou de outro corpo", () => {
    for (const sig of [sign("outro corpo"), "lixo", sign(body, "outra-chave")]) {
      const r = authenticateWebhook({ rawBody: body, headerSecret: SECRET, querySecret: null, signature: sig, secret: SECRET, publicKey: PUBLIC_KEY });
      expect(r).toMatchObject({ ok: false, status: 401 });
    }
  });

  it("com chave pública configurada, aceita assinatura HMAC-SHA256 base64 do corpo cru", () => {
    const r = authenticateWebhook({ rawBody: body, headerSecret: SECRET, querySecret: null, signature: sign(body), secret: SECRET, publicKey: PUBLIC_KEY });
    expect(r).toEqual({ ok: true });
  });
});

// ─────────────────────────────────────────────────────────────
describe("parseWebhookEvent", () => {
  it("checkout.completed pago → ativação com plano derivado do produto", () => {
    expect(parseWebhookEvent(paidPayload(), PRODUCTS)).toEqual({
      kind: "paid",
      userId: "user_1",
      plan: "PREMIUM",
      checkoutId: "bill_1",
    });
  });

  it("o plano vem do produto pago, não do metadata (metadata adulterado é ignorado)", () => {
    const p = paidPayload({ metadata: { userId: "user_1", plan: "LIFETIME" } });
    expect(parseWebhookEvent(p, PRODUCTS)).toMatchObject({ kind: "paid", plan: "PREMIUM" });
  });

  it("identifica o usuário pelo externalId quando metadata vem null", () => {
    const p = paidPayload({ metadata: null, externalId: "fia:user_9:annual:555", items: [{ id: "prod_annual", quantity: 1 }] });
    expect(parseWebhookEvent(p, PRODUCTS)).toEqual({ kind: "paid", userId: "user_9", plan: "ANNUAL", checkoutId: "bill_1" });
  });

  it("metadata.userId divergente do externalId → inválido (dado corrompido)", () => {
    const p = paidPayload({ metadata: { userId: "user_2" }, externalId: "fia:user_1:monthly:1" });
    expect(parseWebhookEvent(p, PRODUCTS)).toMatchObject({ kind: "invalid", reason: "user_mismatch" });
  });

  it("produto desconhecido sinaliza unknown_product (pago sem ativação)", () => {
    const p = paidPayload({ items: [{ id: "prod_novo", quantity: 1 }] });
    expect(parseWebhookEvent(p, PRODUCTS)).toEqual({ kind: "invalid", reason: "unknown_product" });
  });

  it("nunca usa customerId da AbacatePay como userId", () => {
    const p = paidPayload({ metadata: null, externalId: null });
    expect(parseWebhookEvent(p, PRODUCTS)).toMatchObject({ kind: "invalid" });
  });

  it("produto desconhecido → inválido", () => {
    const p = paidPayload({ items: [{ id: "prod_x", quantity: 1 }] });
    expect(parseWebhookEvent(p, PRODUCTS)).toMatchObject({ kind: "invalid" });
  });

  it("status diferente de PAID → ignorado", () => {
    expect(parseWebhookEvent(paidPayload({ status: "PENDING" }), PRODUCTS)).toMatchObject({ kind: "ignored" });
  });

  it("checkout.id ausente → inválido", () => {
    expect(parseWebhookEvent(paidPayload({ id: undefined }), PRODUCTS)).toMatchObject({ kind: "invalid" });
  });

  it("eventos legados/irrelevantes são ignorados", () => {
    for (const event of ["billing.paid", "charge.paid", "subscription.renewed", "payout.completed"]) {
      expect(parseWebhookEvent({ ...paidPayload(), event }, PRODUCTS)).toMatchObject({ kind: "ignored" });
    }
  });

  it.each(["checkout.refunded", "checkout.disputed"])("%s → revogação", (event) => {
    expect(parseWebhookEvent({ ...paidPayload({ status: "REFUNDED" }), event }, PRODUCTS)).toEqual({
      kind: "revoke",
      userId: "user_1",
      checkoutId: "bill_1",
    });
  });

  it.each([null, "texto", 42, [], { event: "checkout.completed" }])("payload malformado (%s) → inválido ou ignorado, sem lançar", (p) => {
    expect(() => parseWebhookEvent(p, PRODUCTS)).not.toThrow();
    expect(["invalid", "ignored"]).toContain(parseWebhookEvent(p, PRODUCTS).kind);
  });
});

// ─────────────────────────────────────────────────────────────
describe("decideActivation", () => {
  const incoming = { plan: "PREMIUM" as const, checkoutId: "bill_2" };

  it("sem assinatura prévia → aplica com 30 dias", () => {
    expect(decideActivation(null, incoming, NOW)).toEqual({
      action: "apply",
      status: "PREMIUM",
      activatedAt: NOW,
      expiresAt: new Date(NOW.getTime() + 30 * DAY),
    });
  });

  it("mesmo checkout já processado → ignora (idempotente)", () => {
    const current = { status: "PREMIUM" as const, paymentId: "bill_2", expiresAt: new Date(NOW.getTime() + DAY) };
    expect(decideActivation(current, incoming, NOW)).toEqual({ action: "skip", reason: "duplicate" });
  });

  it("nunca rebaixa um LIFETIME", () => {
    const current = { status: "LIFETIME" as const, paymentId: "bill_old", expiresAt: null };
    expect(decideActivation(current, incoming, NOW)).toEqual({ action: "skip", reason: "lifetime_kept" });
  });

  it("renovação do mesmo plano ainda ativo soma ao prazo restante", () => {
    const remaining = new Date(NOW.getTime() + 10 * DAY);
    const current = { status: "PREMIUM" as const, paymentId: "bill_old", expiresAt: remaining };
    const r = decideActivation(current, incoming, NOW);
    expect(r).toMatchObject({ action: "apply", expiresAt: new Date(remaining.getTime() + 30 * DAY) });
  });

  it("plano expirado renova a partir de agora", () => {
    const current = { status: "PREMIUM" as const, paymentId: "bill_old", expiresAt: new Date(NOW.getTime() - DAY) };
    expect(decideActivation(current, incoming, NOW)).toMatchObject({ expiresAt: new Date(NOW.getTime() + 30 * DAY) });
  });

  it("ANNUAL vigente comprando PREMIUM: mantém ANNUAL e soma 30 dias (não perde tempo pago)", () => {
    const remaining = new Date(NOW.getTime() + 100 * DAY);
    const current = { status: "ANNUAL" as const, paymentId: "bill_old", expiresAt: remaining };
    expect(decideActivation(current, incoming, NOW)).toMatchObject({
      action: "apply",
      status: "ANNUAL",
      expiresAt: new Date(remaining.getTime() + 30 * DAY),
    });
  });

  it("PREMIUM vigente comprando ANNUAL: vira ANNUAL somando o prazo restante", () => {
    const remaining = new Date(NOW.getTime() + 10 * DAY);
    const current = { status: "PREMIUM" as const, paymentId: "bill_old", expiresAt: remaining };
    expect(decideActivation(current, { plan: "ANNUAL", checkoutId: "bill_9" }, NOW)).toMatchObject({
      action: "apply",
      status: "ANNUAL",
      expiresAt: new Date(remaining.getTime() + 365 * DAY),
    });
  });

  it("ANNUAL expirado comprando PREMIUM: vira PREMIUM a partir de agora", () => {
    const current = { status: "ANNUAL" as const, paymentId: "bill_old", expiresAt: new Date(NOW.getTime() - DAY) };
    expect(decideActivation(current, incoming, NOW)).toMatchObject({
      status: "PREMIUM",
      expiresAt: new Date(NOW.getTime() + 30 * DAY),
    });
  });

  it("LIFETIME comprando LIFETIME de novo não altera nada", () => {
    const current = { status: "LIFETIME" as const, paymentId: "bill_old", expiresAt: null };
    expect(decideActivation(current, { plan: "LIFETIME", checkoutId: "bill_new" }, NOW)).toEqual({
      action: "skip",
      reason: "lifetime_kept",
    });
  });

  it("upgrade para LIFETIME aplica sem expiração", () => {
    const current = { status: "PREMIUM" as const, paymentId: "bill_old", expiresAt: new Date(NOW.getTime() + DAY) };
    expect(decideActivation(current, { plan: "LIFETIME", checkoutId: "bill_3" }, NOW)).toMatchObject({
      action: "apply",
      status: "LIFETIME",
      expiresAt: null,
    });
  });
});

// ─────────────────────────────────────────────────────────────
describe("decideRevocation", () => {
  it("revoga quando o reembolso é do pagamento vigente", () => {
    const current = { status: "ANNUAL" as const, paymentId: "bill_1", expiresAt: new Date(NOW.getTime() + DAY) };
    expect(decideRevocation(current, "bill_1")).toEqual({ action: "revoke" });
  });

  it("não mexe quando o reembolso é de outro pagamento", () => {
    const current = { status: "ANNUAL" as const, paymentId: "bill_novo", expiresAt: null };
    expect(decideRevocation(current, "bill_antigo")).toEqual({ action: "skip" });
  });

  it("sem assinatura → nada a fazer", () => {
    expect(decideRevocation(null, "bill_1")).toEqual({ action: "skip" });
  });
});
