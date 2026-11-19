import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createMailTransport } from "@/lib/email/transport";
import {
  authenticateWebhook,
  decideActivation,
  decideRevocation,
  parseWebhookEvent,
  productPlanMapFromEnv,
} from "@/lib/payments/abacatepay-webhook";
import { type PaidPlan } from "@/lib/plans";
import { planActivatedEmail } from "@/lib/email/templates";
import { errorMessage } from "@/lib/http";

// Transação + e-mail de boas-vindas (SMTP com timeouts em lib/email/transport; pior caso ~40 s).
export const maxDuration = 60;

const transporter = createMailTransport();

async function sendWelcomeEmail(email: string, name: string, plan: PaidPlan, expiresAt: Date | null) {
  const { subject, html } = planActivatedEmail({ name, plan, expiresAt });
  await transporter.sendMail({ from: process.env.SMTP_FROM, to: email, subject, html });
}

export async function POST(request: NextRequest) {
  try {
    // Rejeita corpos grandes antes de ler (requisição ainda não autenticada).
    const declared = Number(request.headers.get("content-length") ?? 0);
    if (declared > MAX_BODY_BYTES) return tooLarge();

    // Corpo cru: a assinatura HMAC é calculada sobre os bytes exatos recebidos.
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) return tooLarge();

    return await handle(request, rawBody);
  } catch (error) {
    console.error("Webhook error:", errorMessage(error));
    return NextResponse.json({ error: "Erro ao processar webhook" }, { status: 500 });
  }
}

const MAX_BODY_BYTES = 64 * 1024;
const tooLarge = () => NextResponse.json({ error: "Payload muito grande" }, { status: 413 });

type Tx = Prisma.TransactionClient;

/** Serializa eventos do mesmo usuário (retries e upsells chegam em paralelo). */
const lockUser = (tx: Tx, userId: string) =>
  tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;

const subscriptionSelect = { status: true, paymentId: true, expiresAt: true } as const;

async function handle(request: NextRequest, rawBody: string): Promise<NextResponse> {
  // 1. Autenticação — falha fechado.
  const auth = authenticateWebhook({
    rawBody,
    headerSecret: request.headers.get("x-webhook-secret"),
    querySecret: request.nextUrl.searchParams.get("webhookSecret"),
    signature: request.headers.get("x-webhook-signature"),
    secret: process.env.ABACATEPAY_WEBHOOK_SECRET,
    publicKey: process.env.ABACATEPAY_PUBLIC_KEY || undefined,
    requireSignature: process.env.NODE_ENV === "production",
  });
  if (!auth.ok) {
    if (auth.reason === "not_configured") {
      console.error("AbacatePay webhook: configure ABACATEPAY_WEBHOOK_SECRET e ABACATEPAY_PUBLIC_KEY");
    } else {
      console.warn(`AbacatePay webhook rejeitado: ${auth.reason}`);
    }
    return NextResponse.json({ error: "Não autorizado" }, { status: auth.status });
  }

  // 2. Interpretação do evento.
  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = parseWebhookEvent(payload, productPlanMapFromEnv());
  if (parsed.kind === "ignored") return NextResponse.json({ received: true, ignored: true });
  if (parsed.kind === "invalid") {
    if (parsed.reason === "unknown_product") {
      // Pagamento confirmado de um produto que não está mapeado no .env: 500 faz a AbacatePay
      // reenviar (~18h), dando tempo de corrigir ABACATEPAY_PRODUCT_ID_* sem perder a venda.
      console.error("AbacatePay webhook: pagamento de produto não mapeado — confira ABACATEPAY_PRODUCT_ID_*");
      return NextResponse.json({ error: "Produto não configurado" }, { status: 500 });
    }
    console.error(`AbacatePay webhook inválido: ${parsed.reason}`);
    return NextResponse.json({ error: "Evento inválido" }, { status: 400 });
  }

  const { userId, checkoutId } = parsed;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });
  if (!user) {
    // 200 para a AbacatePay não reenviar indefinidamente; fica registrado para conferência manual.
    console.warn(`AbacatePay webhook: usuário inexistente para checkout ${checkoutId}`);
    return NextResponse.json({ received: true });
  }

  // 3a. Reembolso / disputa → revoga somente se for o pagamento vigente.
  if (parsed.kind === "revoke") {
    const revoked = await prisma.$transaction(async (tx: Tx) => {
      await lockUser(tx, userId);
      const current = await tx.subscriptionStatus.findUnique({ where: { userId }, select: subscriptionSelect });
      if (decideRevocation(current, checkoutId).action !== "revoke") {
        // Reembolso de um checkout que não é o vigente (ex.: renovação já sobreposta):
        // o prazo dele foi somado ao atual — requer ajuste manual.
        console.error(`AbacatePay webhook: reembolso/disputa de checkout não vigente ${checkoutId} — revisar manualmente`);
        return false;
      }
      await tx.subscriptionStatus.update({ where: { userId }, data: { status: "FREE", expiresAt: null } });
      return true;
    });
    return NextResponse.json({ received: true, revoked });
  }

  // 3b. Pagamento confirmado → ativa (idempotente, sem rebaixar LIFETIME).
  const applied = await prisma.$transaction(async (tx: Tx): Promise<{ plan: PaidPlan; expiresAt: Date | null } | null> => {
    await lockUser(tx, userId);
    const current = await tx.subscriptionStatus.findUnique({ where: { userId }, select: subscriptionSelect });

    // Checkout já aplicado alguma vez (inclusive reenvio fora de ordem) → nada a fazer.
    const alreadyProcessed = await tx.processedPayment.findUnique({ where: { checkoutId } });
    if (alreadyProcessed) return null;

    const decision = decideActivation(current, { plan: parsed.plan, checkoutId }, new Date());
    await tx.processedPayment.create({ data: { checkoutId, userId, plan: parsed.plan } });
    if (decision.action === "skip") return null;

    const data = {
      status: decision.status,
      activatedAt: decision.activatedAt,
      expiresAt: decision.expiresAt,
      paymentId: checkoutId,
    };
    await tx.subscriptionStatus.upsert({ where: { userId }, create: { userId, ...data }, update: data });
    return { plan: decision.status, expiresAt: decision.expiresAt };
  });

  if (applied && user.email) {
    try {
      await sendWelcomeEmail(user.email, user.name ?? "você", applied.plan, applied.expiresAt);
    } catch (emailErr) {
      console.error("Welcome email error:", errorMessage(emailErr));
    }
  }

  return NextResponse.json({ received: true, applied: applied !== null });
}
