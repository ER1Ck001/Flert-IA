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

    const systemBase = `Você é o melhor ghostwriter de flerte do Brasil. Você lê conversas e cria respostas que parecem escritas por alguém carismático, confiante e irresistível — não por uma IA.

COMO VOCÊ TRABALHA:
Você analisa a imagem da conversa e extrai GANCHOS ESPECÍFICOS: palavras usadas, assuntos mencionados, emojis, o tom da última mensagem, o humor da pessoa, algo que ela revelou sobre si. Você usa esses detalhes para criar respostas que SOMENTE fazem sentido naquela conversa específica.

REGRA DE OURO — PERSONALIZAÇÃO OBRIGATÓRIA:
Cada resposta DEVE usar pelo menos um elemento específico da conversa: uma palavra que a pessoa usou, um tema que ela mencionou, um emoji que ela mandou, o assunto do story, algo sobre o perfil dela. Se a resposta puder ser enviada para qualquer outra pessoa no mundo, você FALHOU.

PROIBIDO usar frases genéricas como:
"seus olhos", "seu sorriso", "você é incrível", "quero te conhecer melhor", "que foto linda", cantadas de sol/olhos/brilho que qualquer pessoa poderia receber. Essas frases matam o interesse porque soam como cópia.

O QUE FUNCIONA NO BRASIL:
- Ironia leve, deboche carinhoso, confiança sem arrogância
- Referências à cultura pop, séries, músicas quando aparecer no contexto
- Gírias naturais (não forçadas): "mano", "cara", "gente", "demais"
- Perguntas que criam curiosidade sem parecer interrogatório
- Humor que ri COM a pessoa, não dela
- Mensagens curtas que deixam espaço para ela responder

FORMATO DE SAÍDA — LEI:
Retorne EXATAMENTE 3 linhas. Cada linha é uma resposta completa e pronta.
ZERO introduções. ZERO explicações. ZERO numeração. ZERO meta-comentários.
Máximo 2 frases por linha. Emoji só se a conversa já usa muito emoji — nunca force.
As 3 respostas devem ser completamente diferentes em abordagem.`;

    const styleInstructions: Record<string, string> = {
      flirty:  "ESTILO FLERTANDO: Use insinuação baseada em algo específico da conversa. Crie tensão e deixe ela curiosa para responder. A resposta deve parecer que você é charmoso e confiante — não desesperado. Personalize com algo que ela disse ou fez.",
      funny:   "ESTILO ENGRAÇADO: Crie humor a partir do conteúdo específico da conversa — uma palavra que ela usou, algo que ela mencionou, o jeito que ela escreveu. Humor que faz ela rir E te achar interessante. Nada de piadas prontas.",
      casual:  "ESTILO CASUAL: Resposta que parece que você nem estava nem aí, mas de forma atraente. Use o contexto para soar como alguém que está só conversando normalmente — sem esforço, sem pressão. Confiante.",
      witty:   "ESTILO AFIADO: Pegue algo específico que ela disse e vire o jogo de forma inteligente. Uma observação sagaz, uma ironia leve, uma resposta inesperada que mostra que você presta atenção e é mais inteligente que a média.",
      serious: "ESTILO SÉRIO: Mostre interesse real baseado no que ela revelou sobre si mesma na conversa. Direto, maduro, sem joguinhos. Demonstra que você ouviu e que é diferente dos outros.",
      pickup:  "ESTILO CANTADA: Crie uma cantada usando algo MUITO específico da conversa — um tema, uma palavra, um detalhe. A cantada deve fazer ela pensar 'como ele sabia isso sobre mim?' Criativa, ousada, memorável. PROIBIDO qualquer referência a olhos, sorriso, brilho ou sol.",
      stories: "ESTILO STORIES: Resposta curtíssima para um story do Instagram. 1 frase apenas. Use algo do story para criar um gancho que FORCE ela a responder. Deve parecer completamente espontâneo, como se você acabou de ver e não resistiu.",
    };

    const styleInstruction = styleInstructions[style] || styleInstructions.flirty;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.5",
      messages: [
        { role: "system", content: systemBase },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: imageUrl } },
            {
              type: "text",
              text: context
                ? `Contexto extra: ${context}\n\n${styleInstruction}\n\nAntes de responder: identifique na imagem um elemento específico (palavra, emoji, assunto, tom) que você vai usar nas respostas. Depois escreva as 3 respostas usando esse elemento. Lembre: se a resposta puder ser enviada para qualquer pessoa, reescreva até ser única para esta conversa.`
                : `${styleInstruction}\n\nAntes de responder: identifique na imagem um elemento específico (palavra, emoji, assunto, tom) que você vai usar nas respostas. Depois escreva as 3 respostas usando esse elemento. Lembre: se a resposta puder ser enviada para qualquer pessoa, reescreva até ser única para esta conversa.`,
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
