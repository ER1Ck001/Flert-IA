import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const profileSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        subscriptionStatus: true,
        profile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        subscriptionStatus: user.subscriptionStatus?.status || "FREE",
        profile: user.profile,
      },
    });
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar perfil" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    });

    await prisma.user.delete({ where: { id: session.user.id } });

    if (user?.email) {
      const firstName = user.name?.split(" ")[0] || "você";
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: user.email,
        subject: "Sua conta no Flert IA foi excluída",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0a0a0a;color:#fff;border-radius:16px">
            <h2 style="color:#ff2d95;margin:0 0 4px">Flert IA</h2>
            <p style="color:#aaa;margin:0 0 28px;font-size:13px">Confirmação de exclusão de conta</p>

            <p style="margin:0 0 16px">Olá, <strong>${firstName}</strong>.</p>
            <p style="margin:0 0 16px;color:#ccc;line-height:1.6">
              Sua conta no <strong style="color:#fff">Flert IA</strong> foi excluída com sucesso. Todos os seus dados — histórico de análises, perfil e informações de pagamento — foram removidos permanentemente dos nossos servidores.
            </p>
            <p style="margin:0 0 28px;color:#ccc;line-height:1.6">
              Se isso foi um engano ou se mudar de ideia, você pode criar uma nova conta a qualquer momento.
            </p>

            <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="display:inline-block;background:#ff2d95;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px">
              Criar nova conta
            </a>

            <p style="color:#555;font-size:12px;margin-top:32px;line-height:1.6">
              Se você não solicitou a exclusão da conta, entre em contato imediatamente pelo
              <a href="mailto:erickdev@flertia.com.br" style="color:#ff2d95">erickdev@flertia.com.br</a>.
            </p>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile DELETE error:", error);
    return NextResponse.json({ error: "Erro ao excluir conta" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, currentPassword, newPassword } = profileSchema.parse(body);

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && existingUser.id !== session.user.id) {
      return NextResponse.json(
        { error: "Email já cadastrado" },
        { status: 400 }
      );
    }

    // Update password if requested
    let passwordUpdate = {};
    if (newPassword && currentPassword) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });

      if (!user?.password) {
        return NextResponse.json(
          { error: "Senha atual não definida" },
          { status: 400 }
        );
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Senha atual inválida" },
          { status: 400 }
        );
      }

      passwordUpdate = { password: await bcrypt.hash(newPassword, 12) };
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        email,
        ...passwordUpdate,
      },
      include: {
        subscriptionStatus: true,
      },
    });

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.image,
        subscriptionStatus: updatedUser.subscriptionStatus?.status || "FREE",
      },
    });
  } catch (error) {
    console.error("Profile PUT error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Erro ao atualizar perfil" },
      { status: 500 }
    );
  }
}
