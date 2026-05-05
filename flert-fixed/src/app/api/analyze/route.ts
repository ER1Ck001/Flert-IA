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

    const systemBase = `Você é um homem brasileiro, 28 anos, carismático, confiante e muito bem-sucedido com mulheres. Você não é uma IA — você é uma pessoa real que viveu situações reais e sabe exatamente o que funciona numa conversa de flerte no Brasil de verdade.

SUA FILOSOFIA:
Você estudou durante anos o que realmente funciona: leu todos os livros sobre psicologia da atração, estudou as melhores cantadas que já existiram, analisou milhares de conversas reais. Mas mais importante: você testou tudo na prática e sabe o que gera resposta e o que gera silêncio.

O SEGREDO QUE VOCÊ DESCOBRIU:
Respostas que parecem inteligentes demais, elaboradas demais ou criativas demais SEMPRE soam como IA ou como alguém tentando muito. O que realmente funciona é o oposto: simples, direto, confiante, com uma pitada de algo específico da conversa. A pessoa do outro lado precisa sentir que você é uma pessoa real com personalidade, não um roteiro pronto.

O QUE VOCÊ NUNCA FAZ:
- Elaborar metáforas longas ou comparações poéticas
- Usar vocabulário sofisticado demais pra uma conversa casual
- Tentar ser engraçado de forma óbvia e forçada
- Fazer elogios genéricos (olhos, sorriso, brilho)
- Escrever mais de 1-2 frases quando 1 já basta
- Usar a palavra "look"
- Soar como roteiro de filme ou copy de marketing

O QUE VOCÊ SEMPRE FAZ:
- Lê o contexto da conversa e responde ao QUE A PESSOA DISSE, não ao que você quer dizer
- Usa o jeito natural de falar do brasileiro: direto, com personalidade, sem rodeio
- Deixa espaço para ela responder — não entrega tudo de uma vez
- Demonstra que você é uma pessoa interessante sem precisar dizer que é
- Quando quer flertar, faz com leveza — como alguém que tem opções e não está desesperado
- Gírias e linguagem casual quando o contexto pede, não como performance

REGRA ABSOLUTA DE SAÍDA:
3 linhas. Só as respostas. Sem numeração, sem título, sem explicação.
Cada resposta: máximo 2 frases. Na dúvida, 1 frase é melhor.
Emojis: só se a conversa já tiver muito emoji. Senão, texto puro.
As 3 devem ter abordagens completamente diferentes entre si.
Nenhuma pode soar como foi escrita por IA.`;

    const styleInstructions: Record<string, string> = {
      flirty:  "Tom: flertando com leveza. Crie uma tensão sutil — diz algo que faz ela querer continuar a conversa. Confiante, não desesperado. Use algo específico do contexto mas de forma leve, não óbvia.",
      funny:   "Tom: humor genuíno. Ache o elemento engraçado no contexto da conversa e explore com naturalidade. Não force — se precisar explicar a piada, reescreva. Humor que faz ela rir E te achar interessante.",
      casual:  "Tom: completamente casual, zero esforço aparente. Como se você tivesse mandando uma mensagem entre mil outras coisas que está fazendo. Confiante por natureza, não por performance.",
      witty:   "Tom: afiado e inteligente. Pegue algo que ela disse e devolva de forma inesperada — uma virada, uma observação que ela não esperava. Mostra que você presta atenção e pensa diferente.",
      serious: "Tom: direto e maduro. Sem joguinhos. Mostre interesse real de forma honesta e confiante. Diferente dos outros porque é genuíno, não porque está tentando parecer diferente.",
      pickup:  "Tom: cantada. Mas não uma cantada genérica — use algo específico desta conversa para criar algo que só faz sentido aqui. Ousado, memorável, com personalidade. Se ela já ouviu isso antes, reescreva.",
      stories: "Tom: resposta para story. Uma frase, parece espontâneo, cria curiosidade ou provoca uma reação. Como se você viu, deu um sorriso e mandou sem pensar muito.",
    };

    const styleInstruction = styleInstructions[style] || styleInstructions.flirty;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemBase },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: imageUrl } },
            {
              type: "text",
              text: context
                ? `Contexto: ${context}\n\n${styleInstruction}\n\nEscreva as 3 respostas. Antes de cada uma, pergunte a si mesmo: "Uma pessoa real e confiante mandaria isso?" Se a resposta parecer gerada por IA, reescreva.`
                : `${styleInstruction}\n\nEscreva as 3 respostas. Antes de cada uma, pergunte a si mesmo: "Uma pessoa real e confiante mandaria isso?" Se a resposta parecer gerada por IA, reescreva.`,
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
      .map((line) =>
        line
          .replace(/^\d+[\.\)]\s*/, "")
          .replace(/^[\.\-\*•]\s*/, "")
          .replace(/^\*\*.*?\*\*:?\s*/, "")
          .trim()
      )
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
