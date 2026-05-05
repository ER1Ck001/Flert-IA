import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
      status: subscription?.status || "FREE",
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

    if (!session?.user?.id || !session.user.email || !session.user.name) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { plan } = body;

    const apiKey = process.env.ABACATEPAY_API_KEY;
    const baseUrl = process.env.ABACATEPAY_BASE_URL;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const productMap: Record<string, { externalId: string; name: string; price: number; status: string }> = {
      monthly:  { externalId: "monthly",  name: "Flertia Premium Mensal",   price: 2990,  status: "PREMIUM"  },
      annual:   { externalId: "annual",   name: "Flertia Premium Anual",    price: 14700, status: "PREMIUM"  },
      lifetime: { externalId: "lifetime", name: "Flertia Acesso Vitalício", price: 29700, status: "LIFETIME" },
    };

    const selected = productMap[plan];

    if (!apiKey || !baseUrl || !selected) {
      console.error("AbacatePay: configuração incompleta", { apiKey: !!apiKey, baseUrl, plan });
      return NextResponse.json(
        { error: "Configuração de pagamento incompleta" },
        { status: 500 }
      );
    }

    const requestBody = {
      frequency: "ONE_TIME",
      methods: ["PIX"],
      products: [
        {
          externalId: selected.externalId,
          name: selected.name,
          quantity: 1,
          price: selected.price,
        },
      ],
      returnUrl: `${appUrl}/dashboard?payment=success`,
      completionUrl: `${appUrl}/dashboard?payment=success`,
      customer: {
        metadata: {
          name: session.user.name,
          email: session.user.email,
          cellphone: "11999999999",
          taxId: "000.000.000-00",
        },
      },
      metadata: {
        userId: session.user.id,
        plan: selected.status,
      },
    };

    console.log("AbacatePay request:", JSON.stringify(requestBody));

    const abacateResponse = await fetch(`${baseUrl}/billing/create`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!abacateResponse.ok) {
      const errorText = await abacateResponse.text();
      console.error("AbacatePay API error:", abacateResponse.status, errorText);
      return NextResponse.json(
        { error: "Erro ao criar cobrança no gateway de pagamento" },
        { status: 502 }
      );
    }

    const abacateData = await abacateResponse.json();
    const checkoutUrl = abacateData?.data?.url || abacateData?.url;

    if (!checkoutUrl) {
      console.error("AbacatePay: URL de checkout não retornada", abacateData);
      return NextResponse.json(
        { error: "Gateway não retornou URL de pagamento" },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error("Payment create error:", error);
    return NextResponse.json(
      { error: "Erro ao criar pagamento" },
      { status: 500 }
    );
  }
}
