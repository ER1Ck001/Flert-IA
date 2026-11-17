import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeExpiresAt, isPaidPlan } from "@/lib/plans";
import { isAdminUser } from "@/lib/admin";
import { assertSameOrigin, errorMessage, isPrismaError, parseJsonBody } from "@/lib/http";
import { idSchema } from "@/lib/validation/common";
import { adminPatchUserSchema } from "@/lib/validation/admin";

type Ctx = { params: { id: string } };

const forbidden = () => NextResponse.json({ error: "Acesso negado" }, { status: 403 });
const notFound = () => NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    const crossSite = assertSameOrigin(req);
    if (crossSite) return crossSite;
    const session = await getServerSession(authOptions);
    if (!(await isAdminUser(session?.user?.id))) return forbidden();

    const id = idSchema.safeParse(params.id);
    if (!id.success) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    if (id.data === session?.user?.id) {
      return NextResponse.json({ error: "Não é possível excluir sua própria conta pelo painel" }, { status: 400 });
    }

    try {
      await prisma.user.delete({ where: { id: id.data } });
    } catch (error) {
      if (isPrismaError(error, "P2025")) return notFound();
      throw error;
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin DELETE user error:", errorMessage(error));
    return NextResponse.json({ error: "Erro ao excluir usuário" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const crossSite = assertSameOrigin(req);
    if (crossSite) return crossSite;
    const session = await getServerSession(authOptions);
    if (!(await isAdminUser(session?.user?.id))) return forbidden();

    const id = idSchema.safeParse(params.id);
    if (!id.success) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const parsed = await parseJsonBody(req, adminPatchUserSchema);
    if (!parsed.ok) return parsed.response;
    const { subscription } = parsed.data;

    // Sem esta checagem o upsert falha por FK (500) para usuário inexistente.
    const target = await prisma.user.findUnique({ where: { id: id.data }, select: { id: true } });
    if (!target) return notFound();

    const now = new Date();
    const data = {
      status: subscription,
      activatedAt: subscription !== "FREE" ? now : null,
      expiresAt: isPaidPlan(subscription) ? computeExpiresAt(subscription, now) : null,
    };
    await prisma.subscriptionStatus.upsert({
      where: { userId: id.data },
      create: { userId: id.data, ...data },
      update: data,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin PATCH user error:", errorMessage(error));
    return NextResponse.json({ error: "Erro ao atualizar plano" }, { status: 500 });
  }
}
