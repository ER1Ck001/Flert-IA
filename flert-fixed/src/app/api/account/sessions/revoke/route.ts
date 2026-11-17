import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin, errorMessage, tooMany } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { SESSION_VERSION_BUMP } from "@/lib/session-version";

// "Sair de todos os dispositivos": incrementa a versão de sessão e invalida todos os JWT do usuário.
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const crossSite = assertSameOrigin(request);
    if (crossSite) return crossSite;

    const limit = await rateLimit("sessions:revoke", session.user.id, 5, 3600, { onError: "allow" });
    if (!limit.allowed) return tooMany(limit.retryAfterSec);

    await prisma.user.update({
      where: { id: session.user.id },
      data: SESSION_VERSION_BUMP,
      select: { id: true },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Revoke sessions error:", errorMessage(error));
    return NextResponse.json({ error: "Erro ao encerrar as sessões" }, { status: 500 });
  }
}
