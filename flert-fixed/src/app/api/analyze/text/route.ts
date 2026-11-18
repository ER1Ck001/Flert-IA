import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { assertSameOrigin, errorMessage } from "@/lib/http";
import { runAnalysis, validateContext } from "@/lib/ai/run-analysis";
import { TEXT_MODES, type TextMode } from "@/lib/ai/prompts";

// Tempo para a chamada à OpenAI (timeout 30s + 1 retry) sem a plataforma matar a função.
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const crossSite = assertSameOrigin(request);
    if (crossSite) return crossSite;

    const body = await request.json().catch(() => null);
    const context = typeof body?.context === "string" ? body.context.trim() : "";
    const mode = body?.mode;
    const style = typeof body?.style === "string" ? body.style : undefined;

    if (!context) {
      return NextResponse.json({ error: "Contexto é obrigatório" }, { status: 400 });
    }
    const tooLong = validateContext(context);
    if (tooLong) return NextResponse.json({ error: tooLong }, { status: 400 });
    if (!(TEXT_MODES as readonly unknown[]).includes(mode)) {
      return NextResponse.json({ error: "Modo inválido" }, { status: 400 });
    }

    const modeLabel = mode === "start" ? "Abertura" : "Situação";
    return await runAnalysis(
      session.user.id,
      { kind: "text", mode: mode as TextMode, style, context },
      `${modeLabel} ${style ?? "flirty"} - ${new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}`
    );
  } catch (error) {
    console.error("Analyze text error:", errorMessage(error));
    return NextResponse.json({ error: "Erro ao gerar sugestões" }, { status: 500 });
  }
}
