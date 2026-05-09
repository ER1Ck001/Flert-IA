import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [total, thisWeek, today, subscription] = await Promise.all([
      prisma.conversation.count({ where: { userId } }),
      prisma.conversation.count({ where: { userId, createdAt: { gte: weekAgo } } }),
      prisma.conversation.count({ where: { userId, createdAt: { gte: todayStart } } }),
      prisma.subscriptionStatus.findUnique({ where: { userId } }),
    ]);

    const status     = subscription?.status;
    const isLifetime = status === "LIFETIME";
    const dailyLimit = isLifetime ? null : status === "ANNUAL" ? 50 : 30;

    return NextResponse.json({
      total,
      thisWeek,
      today,
      dailyLimit,
      isLifetime,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ total: 0, thisWeek: 0 });
  }
}
