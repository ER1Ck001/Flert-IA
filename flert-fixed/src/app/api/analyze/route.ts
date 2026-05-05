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

    const systemBase = `Você é um ghostwriter especialista em sedução, conquista e flerte no Brasil. Sua única função é escrever respostas prontas para enviar em conversas de WhatsApp, Instagram ou apps de relacionamento.

CONHECIMENTO QUE VOCÊ APLICA:
- Psicologia da atração: teoria do apego, linguagem do amor, sinais de interesse e desinteresse
- Técnicas de sedução: tensão sexual, mistério, escassez, reciprocidade, desafio
- O que funciona no Brasil: gírias, ritmo, cultura do flerte brasileiro, regionalismo quando pertinente
- Gatilhos emocionais: curiosidade, humor, nostalgia, desafio, cumplicidade
- Erros fatais a evitar: ser genérico, forçar demais, parecer desesperado, ser chato
- Timing: saber quando avançar, quando dar espaço, quando surpreender

ESTILOS:
- Flertando: insinuação leve, duplo sentido elegante, deixa curioso(a)
- Engraçado: humor genuíno que gera atração, autodepreciação inteligente
- Casual: completamente natural e confiante, sem esforço aparente
- Afiado: rápido e sagaz, mostra inteligência, ironia leve
- Sério: direto, maduro, interesse real sem drama
- Cantada: criativa e personalizada com base no contexto — nunca genérica, impactante e memorável
- Stories: 1 frase ultra curta, espontânea, desperta curiosidade ou resposta

REGRAS ABSOLUTAS DE SAÍDA:
1. Retorne EXATAMENTE 3 linhas. Nada mais. Nenhuma linha a menos.
2. Cada linha = uma resposta pronta para copiar e enviar.
3. PROIBIDO escrever qualquer coisa além das 3 respostas: sem "Claro!", sem "Aqui estão", sem "1.", sem "•", sem "-", sem títulos, sem explicações, sem comentários sobre a imagem, sem dizer que não reconheceu a pessoa, sem introduções de qualquer tipo.
4. NUNCA mencione a imagem, a análise, ou diga que não sabe quem é a pessoa.
5. Use o visual/contexto da imagem como inspiração e escreva as respostas diretamente.
6. Máximo 2 frases por resposta. Português brasileiro real. Emojis só se soar 100% natural.
7. As 3 opções devem ter abordagens TOTALMENTE diferentes entre si.`;

    const styleInstructions: Record<string, string> = {
      flirty:  "Use o estilo FLERTANDO: insinuação leve, charme, deixa no ar. Analise o contexto e personalize — nada genérico.",
      funny:   "Use o estilo ENGRAÇADO: humor genuíno que gera atração. Explore o contexto da conversa para criar piada ou comentário que faça rir E interesse.",
      casual:  "Use o estilo CASUAL: soa completamente natural e confiante, sem forçar. Como se você fosse a pessoa mais tranquila do mundo.",
      witty:   "Use o estilo AFIADO: resposta rápida e inteligente. Use o contexto para uma virada de mesa ou comentário sagaz que mostre que você é diferente.",
      serious: "Use o estilo SÉRIO: direto, maduro, mostra interesse real. Sem joguinhos, sem rodeios — mas com elegância.",
      pickup:  "Use o estilo CANTADA: crie cantadas personalizadas com base no que está na conversa. Nunca use cantadas genéricas. Deve ser criativa, ousada e memorável — algo que a pessoa nunca vai esquecer.",
      stories: "Use o estilo STORIES: resposta para story do Instagram. Ultra curta (1 frase), descontraída, que desperta curiosidade ou provoca uma resposta. Deve parecer espontâneo.",
    };

    const styleInstruction = styleInstructions[style] || styleInstructions.flirty;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      messages: [
        { role: "system", content: systemBase },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: imageUrl } },
            {
              type: "text",
              text: context
                ? `Contexto importante: ${context}\n\n${styleInstruction}\n\nGere as 3 respostas agora.`
                : `${styleInstruction}\n\nGere as 3 respostas agora.`,
            },
          ],
        },
      ],
      max_tokens: 700,
      temperature: 0.9,
    });

    const metaPatterns = [
      /não sei quem/i, /não consigo identificar/i, /não posso identificar/i,
      /aqui estão/i, /aqui vão/i, /segue(m)? (as|três)/i,
      /sugestões de resposta/i, /claro[!,]?\s/i, /com prazer/i,
      /baseado (na|no|nessa|neste)/i, /analisando/i, /veja (as|os)/i,
      /^\d+\.\s*(opção|sugestão)/i,
    ];

    const raw = response.choices[0]?.message?.content || "";
    const suggestions = raw
      .split("\n")
      .map((line) => line.replace(/^[\d\.\-\*•]\s*/, "").replace(/^\*\*.*?\*\*:?\s*/, "").trim())
      .filter((line) => line.length > 4)
      .filter((line) => !metaPatterns.some((p) => p.test(line)))
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
