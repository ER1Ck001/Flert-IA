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

    // Prompt para a OpenAI
    const stylePrompts: Record<string, string> = {
      funny: "engraçadas e bem-humoradas",
      flirty: "flertantes e atraentes",
      serious: "sérias e sinceras",
      casual: "casuais e naturais",
      witty: "engeniosas e inteligentes",
    };

    const stylePrompt = stylePrompts[style] || "flertantes e atraentes";

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Você é um assistente especializado em análise de conversas e flertes.
          Sua tarefa é analisar imagens de conversas e sugerir 3 respostas ${stylePrompt}.
          As respostas devem ser curtas (máximo 2 frases), naturais e em português brasileiro.
          Use emojis de forma moderada e apropriada.`,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
            {
              type: "text",
              text: context
                ? `Contexto adicional: ${context}. Gere 3 sugestões de resposta ${stylePrompt}.`
                : `Gere 3 sugestões de resposta ${stylePrompt} para esta conversa.`,
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    const suggestions = response.choices[0]?.message?.content
      ?.split("\n")
      .filter((line) => line.trim())
      .map((line) => line.replace(/^[-*•]\s*/, "").trim())
      .slice(0, 3) || [
      "Que interessante! Me conta mais sobre isso? 😊",
      "Haha, adorei! Você sempre tem as melhores histórias ✨",
      "Isso me lembra uma coisa... quer saber, melhor te contar depois 😉",
    ];

    // Salvar no histórico
    await prisma.conversation.create({
      data: {
        userId: session.user.id,
        title: `Análise ${style} - ${new Date().toLocaleDateString("pt-BR")}`,
        messages: {
          create: suggestions.map((suggestion) => ({
            role: "assistant",
            content: suggestion,
          })),
        },
      },
    });

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json(
      { error: "Erro ao analisar conversa" },
      { status: 500 }
    );
  }
}
