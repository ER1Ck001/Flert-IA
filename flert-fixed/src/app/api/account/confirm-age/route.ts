import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin, errorMessage, isPrismaError, parseJsonBody, tooMany } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { confirmAgeSchema } from "@/lib/validation/auth";
import { LEGAL_PUBLISHED, LEGAL_VERSION } from "@/content/legal/config";

// Confirmação de 18+ para contas Google e contas antigas (/auth/confirmar-idade).
// Só grava a confirmação (e o aceite dos Termos, quando publicados); não mexe na sessão:
// o cliente chama update() do NextAuth em seguida e o jwt callback relê o banco.
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const crossSite = assertSameOrigin(request);
    if (crossSite) return crossSite;

    const limit = await rateLimit("account:confirm-age", session.user.id, 20, 900, { onError: "allow" });
    if (!limit.allowed) return tooMany(limit.retryAfterSec);

    const parsed = await parseJsonBody(request, confirmAgeSchema);
    if (!parsed.ok) return parsed.response;

    const now = new Date();
    try {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          adultConfirmedAt: now,
          ...(LEGAL_PUBLISHED ? { termsAcceptedAt: now, termsVersion: LEGAL_VERSION } : {}),
        },
        select: { id: true },
      });
    } catch (error) {
      if (isPrismaError(error, "P2025")) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
      throw error;
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Confirm age error:", errorMessage(error));
    return NextResponse.json({ error: "Erro ao salvar a confirmação" }, { status: 500 });
  }
}
