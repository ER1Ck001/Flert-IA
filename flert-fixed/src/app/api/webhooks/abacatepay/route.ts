import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SubscriptionPlan } from "@prisma/client";
import crypto from "crypto";
import nodemailer from "nodemailer";

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
  const firstName = name.split(" ")[0];
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
    const body = await request.text();

    const secret    = process.env.ABACATEPAY_WEBHOOK_SECRET;
    const signature = request.headers.get("x-abacatepay-signature") || "";

    if (secret && signature) {
      const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
      if (signature !== expected) {
        return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
      }
    }

    const payload = JSON.parse(body);
    const { event, data } = payload;

    if (event === "billing.paid" || event === "payment.completed" || event === "charge.paid") {
      const userId = data?.metadata?.userId || data?.customerId;
      const plan   = (data?.metadata?.plan || "PREMIUM") as SubscriptionPlan;

      if (!userId) {
        console.warn("Webhook recebido sem userId:", payload);
        return NextResponse.json({ received: true });
      }

      const isLifetime = plan === "LIFETIME";
      const isAnnual   = plan === "ANNUAL";
      const expiresAt  = isLifetime
        ? null
        : isAnnual
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 30  * 24 * 60 * 60 * 1000);

      await prisma.subscriptionStatus.upsert({
        where:  { userId },
        create: { userId, status: plan, activatedAt: new Date(), expiresAt, paymentId: data?.id || null },
        update: { status: plan, activatedAt: new Date(), expiresAt, paymentId: data?.id || null },
      });

      console.log(`Subscription ${plan} ativada para usuário: ${userId}`);

      // Enviar email de boas-vindas
      const user = await prisma.user.findUnique({
        where:  { id: userId },
        select: { email: true, name: true },
      });

      if (user?.email) {
        sendWelcomeEmail(user.email, user.name ?? "você", plan)
          .catch(err => console.error("Welcome email error:", err));
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Erro ao processar webhook" }, { status: 500 });
  }
}
