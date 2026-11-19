import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { idSchema } from "@/lib/validation/common";
import { HISTORY_DEFAULT_LIMIT, historyPageQuerySchema } from "@/lib/validation/history";
import { assertSameOrigin, errorMessage } from "@/lib/http";

const withMessages = { messages: { orderBy: { createdAt: "asc" as const } } };

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const params = new URL(request.url).searchParams;
    const parsed = historyPageQuerySchema.safeParse({
      cursor: params.get("cursor") ?? undefined,
      limit: params.get("limit") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Parâmetros de paginação inválidos" }, { status: 400 });
    }
    const { cursor, limit } = parsed.data;
    const where = { userId: session.user.id };

    // Sem cursor e sem limit: lista completa, como antes (cliente antigo ainda em cache durante o
    // rollout). O cliente novo sempre manda ?limit=.
    if (cursor === undefined && limit === undefined) {
      const conversations = await prisma.conversation.findMany({
        where,
        include: withMessages,
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ conversations, nextCursor: null });
    }

    // Paginação por cursor (índice Conversation(userId, createdAt)); id desempata datas iguais.
    // take = limit + 1 só para saber se há próxima página.
    const take = limit ?? HISTORY_DEFAULT_LIMIT;
    const rows = await prisma.conversation.findMany({
      where,
      include: withMessages,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = rows.length > take;
    const conversations = hasMore ? rows.slice(0, take) : rows;
    const nextCursor = hasMore ? conversations[conversations.length - 1].id : null;

    return NextResponse.json({ conversations, nextCursor });
  } catch (error) {
    console.error("History error:", errorMessage(error));
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

    const crossSite = assertSameOrigin(request);
    if (crossSite) return crossSite;

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
    console.error("Delete conversation error:", errorMessage(error));
    return NextResponse.json(
      { error: "Erro ao excluir conversa" },
      { status: 500 }
    );
  }
}
