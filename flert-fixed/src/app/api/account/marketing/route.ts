import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin, errorMessage, isPrismaError, parseJsonBody, tooMany } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { marketingPreferenceSchema } from "@/lib/validation/auth";

// Opt-in de e-mails promocionais (Configurações). Só o próprio usuário, mesma origem.
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const crossSite = assertSameOrigin(request);
    if (crossSite) return crossSite;

    const limit = await rateLimit("account:marketing", session.user.id, 30, 900, { onError: "allow" });
    if (!limit.allowed) return tooMany(limit.retryAfterSec);

    const parsed = await parseJsonBody(request, marketingPreferenceSchema);
    if (!parsed.ok) return parsed.response;
    const { optIn } = parsed.data;

    try {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { marketingOptIn: optIn, marketingOptInAt: optIn ? new Date() : null },
        select: { id: true },
      });
    } catch (error) {
      if (isPrismaError(error, "P2025")) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
      throw error;
    }
    return NextResponse.json({ marketingOptIn: optIn });
  } catch (error) {
    console.error("Marketing preference error:", errorMessage(error));
    return NextResponse.json({ error: "Erro ao salvar a preferência" }, { status: 500 });
  }
}
