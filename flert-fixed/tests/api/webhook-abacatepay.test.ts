import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { prismaMock, sendMail } = vi.hoisted(() => {
  const prismaMock = {
    user: { findUnique: vi.fn() },
    subscriptionStatus: { findUnique: vi.fn(), upsert: vi.fn(), update: vi.fn() },
    processedPayment: { findUnique: vi.fn(), create: vi.fn() },
    $executeRaw: vi.fn(),
    $transaction: vi.fn(),
  };
  return { prismaMock, sendMail: vi.fn() };
});

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("nodemailer", () => ({ default: { createTransport: () => ({ sendMail }) } }));

import { POST } from "@/app/api/webhooks/abacatepay/route";

const SECRET = "w".repeat(40);
const DAY = 24 * 60 * 60 * 1000;

function payload(event = "checkout.completed", checkout: Record<string, unknown> = {}) {
  return {
    id: "log_1",
    event,
    apiVersion: 2,
    devMode: false,
    data: {
      checkout: {
        id: "bill_1",
        status: "PAID",
        externalId: "fia:user_1:monthly:1",
        items: [{ id: "prod_monthly", quantity: 1 }],
        metadata: { userId: "user_1", plan: "PREMIUM" },
        ...checkout,
      },
    },
  };
}

function req(body: unknown, opts: { secret?: string | null; query?: string } = {}) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  const secret = opts.secret === undefined ? SECRET : opts.secret;
  if (secret) headers["x-webhook-secret"] = secret;
  return new NextRequest(`http://localhost/api/webhooks/abacatepay${opts.query ?? ""}`, {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.stubEnv("ABACATEPAY_WEBHOOK_SECRET", SECRET);
  vi.stubEnv("ABACATEPAY_PUBLIC_KEY", "");
  vi.stubEnv("ABACATEPAY_PRODUCT_ID_MONTHLY", "prod_monthly");
  vi.stubEnv("ABACATEPAY_PRODUCT_ID_ANNUAL", "prod_annual");
  vi.stubEnv("ABACATEPAY_PRODUCT_ID_LIFETIME", "prod_lifetime");

  prismaMock.user.findUnique.mockResolvedValue({ id: "user_1", email: "u@example.com", name: "Ana Souza" });
  prismaMock.subscriptionStatus.findUnique.mockResolvedValue(null);
  prismaMock.subscriptionStatus.upsert.mockResolvedValue({});
  prismaMock.subscriptionStatus.update.mockResolvedValue({});
  prismaMock.processedPayment.findUnique.mockResolvedValue(null);
  prismaMock.processedPayment.create.mockResolvedValue({});
  prismaMock.$executeRaw.mockResolvedValue(1);
  prismaMock.$transaction.mockImplementation((fn: (tx: typeof prismaMock) => unknown) => fn(prismaMock));
  sendMail.mockResolvedValue({});
});

describe("POST /api/webhooks/abacatepay", () => {
  it("500 quando o secret não está configurado — nada é ativado", async () => {
    vi.stubEnv("ABACATEPAY_WEBHOOK_SECRET", "");
    const res = await POST(req(payload()));
    expect(res.status).toBe(500);
    expect(prismaMock.subscriptionStatus.upsert).not.toHaveBeenCalled();
  });

  it("401 sem secret na requisição (ataque do payload forjado)", async () => {
    const res = await POST(req(payload("checkout.completed", { items: [{ id: "prod_lifetime", quantity: 1 }] }), { secret: null }));
    expect(res.status).toBe(401);
    expect(prismaMock.subscriptionStatus.upsert).not.toHaveBeenCalled();
  });

  it("401 com secret errado", async () => {
    const res = await POST(req(payload(), { secret: "errado" }));
    expect(res.status).toBe(401);
    expect(prismaMock.subscriptionStatus.upsert).not.toHaveBeenCalled();
  });

  it("aceita o secret via query ?webhookSecret", async () => {
    const res = await POST(req(payload(), { secret: null, query: `?webhookSecret=${SECRET}` }));
    expect(res.status).toBe(200);
    expect(prismaMock.subscriptionStatus.upsert).toHaveBeenCalledOnce();
  });

  it("400 com JSON inválido autenticado", async () => {
    const res = await POST(req("{not json"));
    expect(res.status).toBe(400);
  });

  it("ativa PREMIUM por 30 dias e envia e-mail de boas-vindas", async () => {
    const before = Date.now();
    const res = await POST(req(payload()));
    expect(res.status).toBe(200);

    expect(prismaMock.$executeRaw).toHaveBeenCalled(); // lock por usuário
    const args = prismaMock.subscriptionStatus.upsert.mock.calls[0][0];
    expect(args.where).toEqual({ userId: "user_1" });
    expect(args.update.status).toBe("PREMIUM");
    expect(args.update.paymentId).toBe("bill_1");
    const exp = (args.update.expiresAt as Date).getTime();
    expect(exp).toBeGreaterThanOrEqual(before + 30 * DAY);
    expect(exp).toBeLessThanOrEqual(Date.now() + 30 * DAY);
    expect(sendMail).toHaveBeenCalledOnce();
  });

  it("o plano é o do produto pago, mesmo com metadata dizendo LIFETIME", async () => {
    await POST(req(payload("checkout.completed", { metadata: { userId: "user_1", plan: "LIFETIME" } })));
    expect(prismaMock.subscriptionStatus.upsert.mock.calls[0][0].update.status).toBe("PREMIUM");
  });

  it("reprocessar o mesmo checkout é idempotente (sem upsert e sem e-mail)", async () => {
    prismaMock.subscriptionStatus.findUnique.mockResolvedValue({
      status: "PREMIUM",
      paymentId: "bill_1",
      expiresAt: new Date(Date.now() + DAY),
    });
    const res = await POST(req(payload()));
    expect(res.status).toBe(200);
    expect(prismaMock.subscriptionStatus.upsert).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("não rebaixa LIFETIME", async () => {
    prismaMock.subscriptionStatus.findUnique.mockResolvedValue({ status: "LIFETIME", paymentId: "bill_0", expiresAt: null });
    const res = await POST(req(payload()));
    expect(res.status).toBe(200);
    expect(prismaMock.subscriptionStatus.upsert).not.toHaveBeenCalled();
  });

  it("usuário inexistente → 200 sem ativar (evita retry infinito)", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const res = await POST(req(payload()));
    expect(res.status).toBe(200);
    expect(prismaMock.subscriptionStatus.upsert).not.toHaveBeenCalled();
  });

  it("evento legado billing.paid é ignorado", async () => {
    const res = await POST(req(payload("billing.paid")));
    expect(res.status).toBe(200);
    expect(prismaMock.subscriptionStatus.upsert).not.toHaveBeenCalled();
  });

  it("produto desconhecido → 500 (AbacatePay reenvia após corrigir o .env) sem ativar", async () => {
    const res = await POST(req(payload("checkout.completed", { items: [{ id: "prod_x", quantity: 1 }] })));
    expect(res.status).toBe(500);
    expect(prismaMock.subscriptionStatus.upsert).not.toHaveBeenCalled();
  });

  it("registra o checkout processado na mesma transação da ativação", async () => {
    await POST(req(payload()));
    expect(prismaMock.processedPayment.create).toHaveBeenCalledWith({
      data: { checkoutId: "bill_1", userId: "user_1", plan: "PREMIUM" },
    });
  });

  it("o lock por usuário é obtido antes de ler a assinatura", async () => {
    await POST(req(payload()));
    const lockOrder = prismaMock.$executeRaw.mock.invocationCallOrder[0];
    const readOrder = prismaMock.subscriptionStatus.findUnique.mock.invocationCallOrder[0];
    expect(lockOrder).toBeLessThan(readOrder);
  });

  it("reenvio fora de ordem de um checkout antigo já processado é ignorado", async () => {
    // A (bill_1) já foi aplicado; depois B (bill_2) virou o pagamento vigente; A chega de novo.
    prismaMock.processedPayment.findUnique.mockResolvedValue({ checkoutId: "bill_1" });
    prismaMock.subscriptionStatus.findUnique.mockResolvedValue({
      status: "ANNUAL",
      paymentId: "bill_2",
      expiresAt: new Date(Date.now() + 300 * DAY),
    });
    const res = await POST(req(payload()));
    expect(res.status).toBe(200);
    expect(prismaMock.subscriptionStatus.upsert).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("413 para corpo acima de 64 KB, sem processar", async () => {
    const res = await POST(req("x".repeat(70 * 1024)));
    expect(res.status).toBe(413);
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("em produção sem ABACATEPAY_PUBLIC_KEY → 500 sem ativar", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const res = await POST(req(payload()));
    expect(res.status).toBe(500);
    expect(prismaMock.subscriptionStatus.upsert).not.toHaveBeenCalled();
  });

  it("falha no e-mail não derruba o webhook", async () => {
    sendMail.mockRejectedValue(new Error("smtp down"));
    const res = await POST(req(payload()));
    expect(res.status).toBe(200);
    expect(prismaMock.subscriptionStatus.upsert).toHaveBeenCalledOnce();
  });

  it("checkout.refunded do pagamento vigente revoga para FREE", async () => {
    prismaMock.subscriptionStatus.findUnique.mockResolvedValue({ status: "PREMIUM", paymentId: "bill_1", expiresAt: new Date(Date.now() + DAY) });
    const res = await POST(req(payload("checkout.refunded", { status: "REFUNDED" })));
    expect(res.status).toBe(200);
    expect(prismaMock.subscriptionStatus.update).toHaveBeenCalledWith({
      where: { userId: "user_1" },
      data: { status: "FREE", expiresAt: null },
    });
  });
});
