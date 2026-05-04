import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { imageUrl, style, context } = body;

    // Verificar se o usuário tem plano pago
    const subscription = await prisma.subscriptionStatus.findUnique({
      where: { userId: session.user.id },
    });

    const isPaid =
      subscription?.status === "PREMIUM" || subscription?.status === "LIFETIME";

    if (!isPaid) {
      return NextResponse.json(
        { error: "Acesso restrito. Assine um plano para usar as análises." },
        { status: 403 }
      );
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Imagem é obrigatória" },
        { status: 400 }
      );
    }

    const stylePrompts: Record<string, string> = {
      flirty:  "flertantes, com insinuação leve e charme natural",
      funny:   "engraçadas, usando humor inteligente e leveza",
      casual:  "casuais e naturais, sem forçar nada",
      witty:   "afiadas e inteligentes, com resposta rápida e sagacidade",
      serious: "sérias e sinceras, diretas ao ponto",
      pickup:  "cantadas criativas e originais, com impacto imediato e sem vergonha",
      stories: "respostas para stories do Instagram: curtas, descontraídas, com gancho para continuar a conversa",
    };

    const stylePrompt = stylePrompts[style] || stylePrompts.flirty;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Você é um especialista em conversas, flertes e conquista. Analise a imagem da conversa e gere EXATAMENTE 3 sugestões de resposta ${stylePrompt}.

REGRAS OBRIGATÓRIAS:
- Retorne APENAS as 3 respostas, uma por linha, sem numeração, sem prefixos, sem introduções
- Não escreva "Claro!", "Aqui estão", "Sugestão 1:", "1.", "•" ou qualquer texto antes/depois das respostas
- Cada resposta deve ser independente e pronta para copiar e enviar
- Máximo 2 frases por resposta
- Português brasileiro natural, como uma pessoa real escreveria
- Emojis só quando soarem naturais, não forçados
- Nunca repita a mesma ideia nas 3 opções — cada uma deve ter abordagem diferente`,
        },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: imageUrl } },
            {
              type: "text",
              text: context
                ? `Contexto: ${context}\n\nGere 3 respostas ${stylePrompt}.`
                : `Gere 3 respostas ${stylePrompt} para esta conversa.`,
            },
          ],
        },
      ],
      max_tokens: 600,
    });

    const raw = response.choices[0]?.message?.content || "";
    const suggestions = raw
      .split("\n")
      .map((line) => line.replace(/^[\d\.\-\*•]\s*/, "").replace(/^\*\*.*?\*\*:?\s*/, "").trim())
      .filter((line) => line.length > 4)
      .slice(0, 3);

    const fallback = [
      "Que interessante! Me conta mais sobre isso? 😊",
      "Haha, adorei! Você sempre tem as melhores histórias ✨",
      "Isso me lembra uma coisa... melhor te contar depois 😉",
    ];

    const finalSuggestions = suggestions.length >= 3 ? suggestions : fallback;

    await prisma.conversation.create({
      data: {
        userId: session.user.id,
        title: `Análise ${style} - ${new Date().toLocaleDateString("pt-BR")}`,
        messages: {
          create: finalSuggestions.map((suggestion) => ({
            role: "assistant",
            content: suggestion,
          })),
        },
      },
    });

    return NextResponse.json({ suggestions: finalSuggestions });
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json(
      { error: "Erro ao analisar conversa" },
      { status: 500 }
    );
  }
}
