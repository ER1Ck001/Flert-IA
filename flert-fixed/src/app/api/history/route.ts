import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { idSchema } from "@/lib/validation/common";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const conversations = await prisma.conversation.findMany({
      where: { userId: session.user.id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("History error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json(
      { error: "Erro ao buscar histórico" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const parsedId = idSchema.safeParse(new URL(request.url).searchParams.get("id"));
    if (!parsedId.success) {
      return NextResponse.json({ error: "ID da conversa inválido" }, { status: 400 });
    }

    // deleteMany com userId da sessão: inexistente ou de outro usuário → 404 (sem revelar qual).
    const { count } = await prisma.conversation.deleteMany({
      where: { id: parsedId.data, userId: session.user.id },
    });
    if (count === 0) {
      return NextResponse.json({ error: "Análise não encontrada" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete conversation error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json(
      { error: "Erro ao excluir conversa" },
      { status: 500 }
    );
  }
}
