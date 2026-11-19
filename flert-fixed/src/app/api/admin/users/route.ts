import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminUser } from "@/lib/admin";
import { errorMessage } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!(await isAdminUser(session?.user?.id))) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const [users, totalAnalyses] = await Promise.all([
      prisma.user.findMany({
        include: {
          subscriptionStatus: true,
          _count: { select: { conversations: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.conversation.count(),
    ]);

    const stats = {
      total: users.length,
      free: users.filter(u => !u.subscriptionStatus || u.subscriptionStatus.status === "FREE").length,
      premium: users.filter(u => u.subscriptionStatus?.status === "PREMIUM").length,
      annual: users.filter(u => u.subscriptionStatus?.status === "ANNUAL").length,
      lifetime: users.filter(u => u.subscriptionStatus?.status === "LIFETIME").length,
      totalAnalyses,
    };

    const formatted = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      image: u.image,
      createdAt: u.createdAt,
      loginMethod: u.password ? "email" : "google",
      subscription: u.subscriptionStatus?.status ?? "FREE",
      activatedAt: u.subscriptionStatus?.activatedAt ?? null,
      expiresAt: u.subscriptionStatus?.expiresAt ?? null,
      analysisCount: u._count.conversations,
      marketingOptIn: u.marketingOptIn,
    }));

    return NextResponse.json({ users: formatted, stats });
  } catch (error) {
    console.error("Admin users GET error:", errorMessage(error));
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
