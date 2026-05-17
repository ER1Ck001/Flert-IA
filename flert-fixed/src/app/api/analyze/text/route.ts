import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { context, style, mode } = body;

    if (!context?.trim()) {
      return NextResponse.json({ error: "Contexto é obrigatório" }, { status: 400 });
    }
    if (!mode || !["start", "situation"].includes(mode)) {
      return NextResponse.json({ error: "Modo inválido" }, { status: 400 });
    }

    const subscription = await prisma.subscriptionStatus.findUnique({
      where: { userId: session.user.id },
    });

    const status = subscription?.status;
    const isPaid = status === "PREMIUM" || status === "ANNUAL" || status === "LIFETIME";

    if (!isPaid) {
      return NextResponse.json(
        { error: "Acesso restrito. Assine um plano para usar as análises." },
        { status: 403 }
      );
    }

    const isLifetime = status === "LIFETIME";
    const dailyLimit = status === "ANNUAL" ? 50 : 30;

    if (!isLifetime) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayCount = await prisma.conversation.count({
        where: { userId: session.user.id, createdAt: { gte: todayStart } },
      });

      if (todayCount >= dailyLimit) {
        return NextResponse.json(
          {
            error: `Limite diário atingido. Você já fez ${dailyLimit} análises hoje.`,
            limitReached: true,
            todayCount,
          },
          { status: 429 }
        );
      }
    }

    const systemBase = `Você é um homem brasileiro, 28 anos, carismático, confiante e muito bem-sucedido com mulheres. Você não é uma IA — você é uma pessoa real que viveu situações reais e sabe exatamente o que funciona numa conversa de flerte no Brasil de verdade.

SUA FILOSOFIA:
Você estudou durante anos o que realmente funciona: leu todos os livros sobre psicologia da atração, estudou as melhores cantadas que já existiram, analisou milhares de conversas reais. Mas mais importante: você testou tudo na prática e sabe o que gera resposta e o que gera silêncio.

O SEGREDO QUE VOCÊ DESCOBRIU:
Respostas que parecem inteligentes demais, elaboradas demais ou criativas demais SEMPRE soam como IA ou como alguém tentando muito. O que realmente funciona é o oposto: simples, direto, confiante, com uma pitada de algo específico da conversa. A pessoa do outro lado precisa sentir que você é uma pessoa real com personalidade, não um roteiro pronto.

O QUE VOCÊ NUNCA FAZ:
- Elaborar metáforas longas ou comparações poéticas
- Usar vocabulário sofisticado demais pra uma conversa casual
- Tentar ser engraçado de forma óbvia e forçada
- Fazer elogios genéricos: sorriso, olhos, charme, arte, obra de arte, brilho, incrível
- Escrever mais de 1-2 frases quando 1 já basta
- Usar a palavra "look"
- Soar como roteiro de filme ou copy de marketing
- Perguntas óbvias como "você sempre arrasa?" ou "qual o segredo?" — isso soa como script

O QUE VOCÊ SEMPRE FAZ:
- Lê o contexto e responde ao que está realmente acontecendo na conversa ou no story
- Fala como um brasileiro normal fala no dia a dia — sem performance
- Deixa espaço para ela responder — não entrega tudo de uma vez
- Demonstra personalidade sem precisar explicar que tem personalidade
- Quando flertar, faz com leveza — como alguém que tem opções e não está precisando
- Às vezes uma resposta afiada, inesperada ou até levemente desafiadora funciona muito melhor que um elogio

REGRA ABSOLUTA DE SAÍDA:
3 linhas. Só as respostas. Sem numeração, sem título, sem explicação.
Cada resposta: máximo 2 frases. Na dúvida, 1 frase é melhor.
Emojis: só se o contexto dado já tiver muito emoji. Senão, texto puro.
As 3 devem ter abordagens completamente diferentes entre si.
Nenhuma pode soar como foi escrita por IA.`;

    const styleInstructions: Record<string, string> = {
      flirty:  "Tom: flertando com leveza. Crie uma tensão sutil — diz algo que faz ela querer continuar a conversa. Confiante, não desesperado.",
      funny:   "Tom: humor genuíno. Ache o elemento engraçado no contexto e explore com naturalidade. Não force — se precisar explicar a piada, reescreva.",
      casual:  "Tom: completamente casual, zero esforço aparente. Como se você estivesse mandando uma mensagem entre mil outras coisas que está fazendo.",
      witty:   "Tom: afiado e inteligente. Pegue algo do contexto e devolva de forma inesperada — uma virada, uma observação que ela não esperava.",
      serious: "Tom: direto e maduro. Sem joguinhos. Mostre interesse real de forma honesta e confiante.",
      pickup:  "Tom: cantada. Mas não uma cantada genérica — use algo específico do contexto para criar algo que só faz sentido aqui. Ousado, memorável, com personalidade.",
      stories: "Tom: resposta para story. Uma frase, parece espontâneo, cria curiosidade ou provoca uma reação. Como se você viu, deu um sorriso e mandou sem pensar muito.",
    };

    const modePrompts: Record<string, string> = {
      start:
        `Você quer iniciar uma conversa com essa pessoa. Baseado no contexto abaixo, crie 3 primeiras mensagens diferentes para começar. Cada uma deve parecer espontânea e natural, não ensaiada. NÃO use introduções genéricas.\n\nContexto: ${context}`,
      situation:
        `O usuário está numa situação de flerte e precisa saber o que responder ou fazer. Analise a situação descrita e gere 3 respostas/ações diferentes e certeiras.\n\nSituação: ${context}`,
    };

    const styleInstruction = styleInstructions[style] || styleInstructions.flirty;
    const modePrompt = modePrompts[mode];

    const userContent = `${modePrompt}\n\n${styleInstruction}\n\nEscreva as 3 respostas. Antes de cada uma, pergunte a si mesmo: "Uma pessoa real e confiante mandaria isso?" Se a resposta parecer gerada por IA, reescreva.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemBase },
        { role: "user",   content: userContent },
      ],
      max_tokens: 700,
      temperature: 0.9,
    });

    const metaPatterns = [
      /não sei quem/i, /não consigo identificar/i, /não posso identificar/i,
      /aqui estão/i, /aqui vão/i, /segue(m)? (as|três)/i,
      /sugestões de resposta/i, /com prazer/i,
      /baseado (na|no|nessa|neste)/i, /analisando/i, /veja (as|os)/i,
      /^\d+\.\s*(opção|sugestão)/i,
      /mas vamos lá/i, /dito isso/i, /sendo assim/i,
      /claro[!,]?\s/i, /certamente/i, /entendido/i,
      /posso (tentar|sugerir|ajudar)/i, /vou (tentar|sugerir)/i,
    ];
    const endsWithColon = (line: string) => line.trimEnd().endsWith(":");

    const raw = response.choices[0]?.message?.content || "";
    const suggestions = raw
      .split("\n")
      .map(line =>
        line
          .replace(/^\d+[\.\)]\s*/, "")
          .replace(/^[\.\-\*•]\s*/, "")
          .replace(/^\*\*.*?\*\*:?\s*/, "")
          .trim()
      )
      .filter(line => line.length > 4)
      .filter(line => !metaPatterns.some(p => p.test(line)))
      .filter(line => !endsWithColon(line))
      .slice(0, 3);

    const fallback = [
      "Interessante, me conta mais.",
      "Não esperava isso — mas faz sentido.",
      "Depende de como você quer jogar isso.",
    ];
    const finalSuggestions = suggestions.length >= 3 ? suggestions : fallback;

    const modeLabel = mode === "start" ? "Abertura" : "Situação";
    await prisma.conversation.create({
      data: {
        userId: session.user.id,
        title: `${modeLabel} ${style} - ${new Date().toLocaleDateString("pt-BR")}`,
        messages: {
          create: finalSuggestions.map(suggestion => ({
            role: "assistant",
            content: suggestion,
          })),
        },
      },
    });

    return NextResponse.json({ suggestions: finalSuggestions });
  } catch (error) {
    console.error("Analyze text error:", error);
    return NextResponse.json({ error: "Erro ao gerar sugestões" }, { status: 500 });
  }
}
