import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "node:crypto";
import { EXTERNAL_ID_PREFIX } from "@/lib/payments/abacatepay-webhook";
import { rateLimit } from "@/lib/rate-limit";
import { assertSameOrigin, tooMany } from "@/lib/http";
import {
  PLAN_CONFIG,
  getEffectivePlan,
  isPlanExpired,
  planFromCheckoutKey,
  type PaidPlan,
} from "@/lib/plans";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const subscription = await prisma.subscriptionStatus.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json({
      // Plano que vale agora (expirado → FREE); o registro original segue em storedStatus.
      status: getEffectivePlan(subscription),
      storedStatus: subscription?.status ?? "FREE",
      isExpired: isPlanExpired(subscription),
      activatedAt: subscription?.activatedAt,
      expiresAt: subscription?.expiresAt,
    });
  } catch (error) {
    console.error("Payment status error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar status do pagamento" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const crossSite = assertSameOrigin(request);
    if (crossSite) return crossSite;

    const limit = await rateLimit("payment", session.user.id, 10, 3600, { onError: "allow" });
    if (!limit.allowed) return tooMany(limit.retryAfterSec, "Muitas tentativas de pagamento. Aguarde alguns minutos.");

    const body = await request.json().catch(() => null);
    const plan: unknown = body?.plan;

    const paidPlan = planFromCheckoutKey(plan);
    if (!paidPlan) {
      return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
    }

    const productIds: Record<PaidPlan, string | undefined> = {
      PREMIUM: process.env.ABACATEPAY_PRODUCT_ID_MONTHLY,
      ANNUAL: process.env.ABACATEPAY_PRODUCT_ID_ANNUAL,
      LIFETIME: process.env.ABACATEPAY_PRODUCT_ID_LIFETIME,
    };
    const selected = { id: productIds[paidPlan], methods: [...PLAN_CONFIG[paidPlan].methods], status: paidPlan };
    const apiKey = process.env.ABACATEPAY_API_KEY;
    const baseUrl = process.env.ABACATEPAY_BASE_URL;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (!apiKey || !baseUrl || !selected.id) {
      console.error("AbacatePay: configuração incompleta", { apiKey: !!apiKey, baseUrl: !!baseUrl, productId: !!selected.id });
      return NextResponse.json(
        { error: "Configuração de pagamento incompleta" },
        { status: 500 }
      );
    }

    // externalId único por tentativa (a AbacatePay devolve o checkout existente se repetir)
    // e identifica o usuário no webhook mesmo que o metadata não seja reenviado.
    const externalId = `${EXTERNAL_ID_PREFIX}:${session.user.id}:${plan}:${crypto.randomUUID()}`;

    const requestBody = {
      items: [{ id: selected.id, quantity: 1 }],
      methods: selected.methods,
      externalId,
      returnUrl: `${appUrl}/dashboard?payment=success`,
      completionUrl: `${appUrl}/dashboard?payment=success`,
      metadata: {
        userId: session.user.id,
        plan: selected.status,
      },
    };

    const abacateResponse = await fetch(`${baseUrl}/checkouts/create`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!abacateResponse.ok) {
      // Só o status: o corpo de erro do gateway pode conter dados do cliente.
      console.error("AbacatePay API error:", abacateResponse.status);
      return NextResponse.json(
        { error: "Erro ao criar cobrança no gateway de pagamento" },
        { status: 502 }
      );
    }

    const abacateData = await abacateResponse.json();
    const checkoutUrl = abacateData?.data?.url || abacateData?.url;

    if (!checkoutUrl) {
      console.error("AbacatePay: URL de checkout não retornada");
      return NextResponse.json(
        { error: "Gateway não retornou URL de pagamento" },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error("Payment create error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json(
      { error: "Erro ao criar pagamento" },
      { status: 500 }
    );
  }
}
