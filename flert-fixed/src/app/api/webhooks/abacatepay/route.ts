import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, SubscriptionPlan } from "@prisma/client";
import nodemailer from "nodemailer";
import {
  authenticateWebhook,
  decideActivation,
  decideRevocation,
  parseWebhookEvent,
  productPlanMapFromEnv,
} from "@/lib/payments/abacatepay-webhook";
import type { PaidPlan } from "@/lib/plans";

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const planLabels: Record<SubscriptionPlan, string> = {
  FREE:     "Grátis",
  PREMIUM:  "Mensal",
  ANNUAL:   "Anual",
  LIFETIME: "Vitalício",
};

const planPerks: Record<SubscriptionPlan, string[]> = {
  FREE:     [],
  PREMIUM:  ["30 análises por dia", "Respostas personalizadas com IA", "7 tons de resposta diferentes", "Suporte via email"],
  ANNUAL:   ["50 análises por dia", "Respostas personalizadas com IA", "7 tons de resposta diferentes", "Suporte prioritário", "2 meses grátis inclusos"],
  LIFETIME: ["Análises ilimitadas para sempre", "Respostas personalizadas com IA", "7 tons de resposta diferentes", "Suporte VIP", "Todos os updates futuros inclusos"],
};

async function sendWelcomeEmail(email: string, name: string, plan: SubscriptionPlan) {
  const firstName = escapeHtml(name.split(" ")[0] || "você");
  const label     = planLabels[plan];
  const perks     = planPerks[plan];
  const appUrl    = process.env.NEXT_PUBLIC_APP_URL || "https://flertia.com.br";

  const isLifetime = plan === "LIFETIME";

  const perksHtml = perks
    .map(p => `<li style="margin:0 0 8px;padding-left:8px">✦ ${p}</li>`)
    .join("");

  await transporter.sendMail({
    from:    process.env.SMTP_FROM,
    to:      email,
    subject: `Bem-vindo ao Flert IA ${label}! Sua vida amorosa nunca mais será a mesma 💘`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8" /></head>
      <body style="margin:0;padding:0;background:#080608;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
        <div style="max-width:520px;margin:40px auto;padding:0 16px">

          <!-- Header -->
          <div style="text-align:center;padding:40px 32px 32px;background:#0f090d;border-radius:20px 20px 0 0;border:1px solid rgba(201,168,76,0.15);border-bottom:none">
            <div style="font-size:32px;margin-bottom:12px">💘</div>
            <h1 style="margin:0;font-size:26px;font-weight:800;color:#F2EDE8;letter-spacing:-0.5px">
              Flert<span style="color:#ff2d95">.</span>IA
            </h1>
            <p style="margin:8px 0 0;font-size:13px;color:#9E8E7E;letter-spacing:0.15em;text-transform:uppercase;font-weight:600">
              Plano ${label} ativado
            </p>
          </div>

          <!-- Body -->
          <div style="background:#110c0e;padding:32px;border:1px solid rgba(201,168,76,0.15);border-top:none;border-bottom:none">

            <p style="margin:0 0 20px;font-size:17px;color:#F2EDE8;line-height:1.6">
              Olá, <strong>${firstName}</strong>! 🎉
            </p>

            <p style="margin:0 0 20px;font-size:15px;color:#C8B89A;line-height:1.7">
              Sua compra foi confirmada e o plano <strong style="color:#ff2d95">${label}</strong> já está ativo na sua conta.
              ${isLifetime
                ? "Você agora tem acesso <strong style=\"color:#C9A84C\">vitalício e ilimitado</strong> — nunca mais se preocupe com limites."
                : "A partir de agora você tem tudo que precisa para transformar qualquer conversa em conexão real."
              }
            </p>

            <p style="margin:0 0 16px;font-size:13px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#9E8E7E">
              O que está incluso no seu plano
            </p>

            <ul style="margin:0 0 28px;padding:0;list-style:none;font-size:14px;color:#C8B89A;line-height:1.7">
              ${perksHtml}
            </ul>

            <p style="margin:0 0 28px;font-size:15px;color:#C8B89A;line-height:1.7">
              Chega de ficar sem resposta, de deixar a conversa esfriar ou de mandar mensagem e se arrepender. A IA vai analisar o contexto e gerar exatamente o que você precisa dizer — com o tom certo, na hora certa.
            </p>

            <!-- CTA -->
            <div style="text-align:center;margin:0 0 12px">
              <a href="${appUrl}/analyze"
                style="display:inline-block;background:linear-gradient(135deg,#cc2277,#ff2d95);color:#fff;text-decoration:none;padding:14px 36px;border-radius:12px;font-weight:700;font-size:15px;letter-spacing:0.02em;box-shadow:0 4px 24px rgba(255,45,149,0.3)">
                Começar a usar agora →
              </a>
            </div>
            <p style="text-align:center;margin:0;font-size:12px;color:#5C4A52">
              Acesse em <a href="${appUrl}" style="color:#ff2d95;text-decoration:none">flertia.com.br</a>
            </p>
          </div>

          <!-- Footer -->
          <div style="background:#0a0608;padding:24px 32px;border-radius:0 0 20px 20px;border:1px solid rgba(201,168,76,0.15);border-top:1px solid rgba(201,168,76,0.08)">
            <p style="margin:0 0 8px;font-size:12px;color:#5C4A52;line-height:1.6">
              Dúvidas? Fala com a gente pelo
              <a href="mailto:erickdev@flertia.com.br" style="color:#ff2d95;text-decoration:none"> erickdev@flertia.com.br</a> — respondemos rápido.
            </p>
            <p style="margin:0;font-size:11px;color:#3d2d35">
              Flert IA · flertia.com.br · Você recebeu este email porque realizou uma compra.
            </p>
          </div>

        </div>
      </body>
      </html>
    `,
  });
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
    console.error("Webhook error:", error instanceof Error ? error.message : "unknown");
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
  const appliedPlan = await prisma.$transaction(async (tx: Tx): Promise<PaidPlan | null> => {
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
    return decision.status;
  });

  if (appliedPlan && user.email) {
    try {
      await sendWelcomeEmail(user.email, user.name ?? "você", appliedPlan);
    } catch (emailErr) {
      console.error("Welcome email error:", emailErr instanceof Error ? emailErr.message : "unknown");
    }
  }

  return NextResponse.json({ received: true, applied: appliedPlan !== null });
}
