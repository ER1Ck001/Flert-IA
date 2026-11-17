// Fluxo comum das rotas de análise: rate limit → plano → cota → IA → histórico.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { getEntitlement } from "@/lib/subscription";
import { refundDailyUsage, releaseDailyUsage, reserveDailyUsage } from "@/lib/usage";
import { generateSuggestions, type GenerateInput } from "@/lib/ai/generate";

// ── Limites de entrada (custo e abuso) ─────────────────────────
export const MAX_CONTEXT_CHARS = 2000;
/** ~10 MB de imagem em base64 (o front limita o arquivo a 10 MB). */
export const MAX_IMAGE_DATA_URL_CHARS = 14_000_000;
/** Só imagens enviadas pelo próprio usuário em base64 — nunca URLs externas (a OpenAI as buscaria). */
export const IMAGE_DATA_URL_RE = /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/;

export function validateContext(context: string): string | null {
  return context.length > MAX_CONTEXT_CHARS
    ? `O contexto pode ter no máximo ${MAX_CONTEXT_CHARS} caracteres.`
    : null;
}

export function validateImageDataUrl(imageUrl: string): string | null {
  if (imageUrl.length > MAX_IMAGE_DATA_URL_CHARS) return "Imagem muito grande. Envie uma imagem de até 10 MB.";
  if (!IMAGE_DATA_URL_RE.test(imageUrl)) return "Formato de imagem inválido. Envie PNG, JPG, WEBP ou GIF.";
  return null;
}

// ── Fluxo ──────────────────────────────────────────────────────

/** Devolver cota nunca pode derrubar a resposta ao usuário. */
async function safely(action: () => Promise<unknown>, label: string): Promise<void> {
  try {
    await action();
  } catch (error) {
    console.error(`${label}:`, error instanceof Error ? error.message : "unknown");
  }
}

const NOT_CHARGED =
  "A IA não conseguiu gerar sugestões agora. Tente novamente — esta tentativa não foi descontada do seu limite.";
const CHARGED =
  "A IA não conseguiu gerar sugestões válidas para este conteúdo. Esta tentativa foi descontada do seu limite, pois o número diário de tentativas devolvidas já foi atingido.";

export async function runAnalysis(userId: string, input: GenerateInput, title: string): Promise<NextResponse> {
  // Rate limit de rajada (por instância; o limite diário persistente é a cota abaixo).
  // Rajada; o limite diário persistente é a cota abaixo.
  if (!(await rateLimit("analyze", userId, 10, 60, { onError: "allow" })).allowed) {
    return NextResponse.json(
      { error: "Muitas análises em sequência. Aguarde um minuto e tente de novo." },
      { status: 429 }
    );
  }

  const entitlement = await getEntitlement(userId);
  if (!entitlement.isPaid) {
    return NextResponse.json(
      {
        error: entitlement.isExpired
          ? "Seu plano expirou. Renove para continuar usando as análises."
          : "Acesso restrito. Assine um plano para usar as análises.",
        expired: entitlement.isExpired,
      },
      { status: 403 }
    );
  }

  const reservation = await reserveDailyUsage(userId, entitlement.dailyLimit);
  if (!reservation.ok) {
    return NextResponse.json(
      {
        error: `Limite diário atingido. Você já fez ${entitlement.dailyLimit} análises hoje. O limite reinicia à meia-noite (horário de Brasília).`,
        limitReached: true,
        todayCount: reservation.used,
        dailyLimit: entitlement.dailyLimit,
      },
      { status: 429 }
    );
  }

  const release = () => safely(() => releaseDailyUsage(userId, reservation.dayKey), "Usage release error");

  let result: Awaited<ReturnType<typeof generateSuggestions>>;
  try {
    result = await generateSuggestions(input);
  } catch (error) {
    await release();
    throw error;
  }

  if (!result.ok) {
    let refunded = true;
    if (result.reason === "openai_error") {
      await release();
    } else {
      // Saída inválida: a OpenAI já cobrou — devolução limitada por dia (anti-abuso).
      try {
        refunded = await refundDailyUsage(userId, reservation.dayKey);
      } catch (error) {
        console.error("Usage refund error:", error instanceof Error ? error.message : "unknown");
      }
    }
    return NextResponse.json(
      { error: refunded ? NOT_CHARGED : CHARGED, retryable: true },
      { status: 502 }
    );
  }

  try {
    await prisma.conversation.create({
      data: {
        userId,
        title,
        messages: { create: result.suggestions.map((content) => ({ role: "assistant", content })) },
      },
    });
  } catch (error) {
    await release();
    console.error("Analysis save error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Erro ao salvar a análise. Tente novamente." }, { status: 500 });
  }

  return NextResponse.json({ suggestions: result.suggestions });
}
