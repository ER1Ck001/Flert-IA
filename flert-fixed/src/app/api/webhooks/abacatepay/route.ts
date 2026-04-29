import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SubscriptionPlan } from "@prisma/client";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    const secret = process.env.ABACATEPAY_WEBHOOK_SECRET;
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
      const plan = (data?.metadata?.plan || "PREMIUM") as SubscriptionPlan;

      if (!userId) {
        console.warn("Webhook recebido sem userId:", payload);
        return NextResponse.json({ received: true });
      }

      const isLifetime = plan === "LIFETIME";
      const expiresAt = isLifetime
        ? null
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 dias

      await prisma.subscriptionStatus.upsert({
        where: { userId },
        create: {
          userId,
          status: plan,
          activatedAt: new Date(),
          expiresAt,
          paymentId: data?.id || null,
        },
        update: {
          status: plan,
          activatedAt: new Date(),
          expiresAt,
          paymentId: data?.id || null,
        },
      });

      console.log(`Subscription ${plan} ativada para usuário: ${userId}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Erro ao processar webhook" }, { status: 500 });
  }
}
