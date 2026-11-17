import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runAnalysis, validateContext, validateImageDataUrl } from "@/lib/ai/run-analysis";

// Tempo para a chamada à OpenAI (timeout 30s + 1 retry) sem a plataforma matar a função.
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const imageUrl = body?.imageUrl;
    const style = typeof body?.style === "string" ? body.style : undefined;
    const context = typeof body?.context === "string" && body.context.trim() ? body.context.trim() : undefined;

    if (typeof imageUrl !== "string" || !imageUrl) {
      return NextResponse.json({ error: "Imagem é obrigatória" }, { status: 400 });
    }
    const invalid = validateImageDataUrl(imageUrl) ?? (context ? validateContext(context) : null);
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

    return await runAnalysis(
      session.user.id,
      { kind: "image", imageUrl, style, context },
      `Análise ${style ?? "flirty"} - ${new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}`
    );
  } catch (error) {
    console.error("Analyze error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Erro ao analisar conversa" }, { status: 500 });
  }
}
