import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEntitlement } from "@/lib/subscription";
import { getUsageCount } from "@/lib/usage";
import { nextResetAt } from "@/lib/time";
import { errorMessage } from "@/lib/http";

// Depende da sessão: nunca pode ser pré-renderizada no build.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [total, thisWeek, today, entitlement] = await Promise.all([
      prisma.conversation.count({ where: { userId } }),
      prisma.conversation.count({ where: { userId, createdAt: { gte: weekAgo } } }),
      getUsageCount(userId, now),
      getEntitlement(userId, now),
    ]);

    return NextResponse.json({
      total,
      thisWeek,
      today,
      plan: entitlement.plan,
      isPaid: entitlement.isPaid,
      isExpired: entitlement.isExpired,
      isLifetime: entitlement.plan === "LIFETIME",
      dailyLimit: entitlement.dailyLimit,
      expiresAt: entitlement.expiresAt,
      resetsAt: nextResetAt(now).toISOString(),
    });
  } catch (error) {
    console.error("Stats error:", errorMessage(error));
    return NextResponse.json({ error: "Erro ao carregar estatísticas" }, { status: 500 });
  }
}
