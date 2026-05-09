import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubscriptionPlan } from "@prisma/client";

const ADMIN_EMAIL = "erickrochas230@gmail.com";

function isAdmin(email?: string | null) {
  return email?.toLowerCase() === ADMIN_EMAIL;
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session?.user?.email)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    if (params.id === session?.user?.id) {
      return NextResponse.json(
        { error: "Não é possível excluir sua própria conta pelo painel" },
        { status: 400 }
      );
    }

    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin DELETE user error:", error);
    return NextResponse.json({ error: "Erro ao excluir usuário" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session?.user?.email)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { subscription } = await req.json();
    const valid: SubscriptionPlan[] = ["FREE", "PREMIUM", "ANNUAL", "LIFETIME"];
    if (!valid.includes(subscription)) {
      return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
    }

    const expiresAt =
      subscription === "LIFETIME" || subscription === "FREE"
        ? null
        : subscription === "ANNUAL"
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.subscriptionStatus.upsert({
      where: { userId: params.id },
      create: {
        userId: params.id,
        status: subscription,
        activatedAt: subscription !== "FREE" ? new Date() : null,
        expiresAt,
      },
      update: {
        status: subscription,
        activatedAt: subscription !== "FREE" ? new Date() : null,
        expiresAt,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin PATCH user error:", error);
    return NextResponse.json({ error: "Erro ao atualizar plano" }, { status: 500 });
  }
}
