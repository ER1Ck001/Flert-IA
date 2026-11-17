import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { getEffectivePlan, isPlanExpired } from "@/lib/plans";
import { errorMessage, isPrismaError, parseJsonBody } from "@/lib/http";
import { normalizeEmail, profileUpdateSchema } from "@/lib/validation/auth";
import { findUserByEmail } from "@/lib/users";
import { emailFirstName, escapeHtml } from "@/lib/email/escape";
import { isReservedAdminEmail } from "@/lib/admin";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const bad = (error: string) => NextResponse.json({ error }, { status: 400 });

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscriptionStatus: true, profile: true },
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
        // Contas criadas pelo Google não têm senha: o front esconde troca de senha/e-mail.
        hasPassword: Boolean(user.password),
        subscriptionStatus: getEffectivePlan(user.subscriptionStatus),
        isExpired: isPlanExpired(user.subscriptionStatus),
        expiresAt: user.subscriptionStatus?.expiresAt ?? null,
        profile: user.profile,
      },
    });
  } catch (error) {
    console.error("Profile GET error:", errorMessage(error));
    return NextResponse.json({ error: "Erro ao buscar perfil" }, { status: 500 });
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

    try {
      await prisma.user.delete({ where: { id: session.user.id } });
    } catch (error) {
      if (isPrismaError(error, "P2025")) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
      throw error;
    }

    if (user?.email) {
      const firstName = emailFirstName(user.name);
      const appUrl = escapeHtml(process.env.NEXT_PUBLIC_APP_URL || "https://flertia.com.br");
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

            <a href="${appUrl}" style="display:inline-block;background:#ff2d95;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px">
              Criar nova conta
            </a>

            <p style="color:#555;font-size:12px;margin-top:32px;line-height:1.6">
              Se você não solicitou a exclusão da conta, entre em contato imediatamente pelo
              <a href="mailto:erickdev@flertia.com.br" style="color:#ff2d95">erickdev@flertia.com.br</a>.
            </p>
          </div>
        `,
      }).catch((err) => console.error("Delete account email error:", errorMessage(err)));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile DELETE error:", errorMessage(error));
    return NextResponse.json({ error: "Erro ao excluir conta" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const userId = session.user.id;

    const parsed = await parseJsonBody(request, profileUpdateSchema);
    if (!parsed.ok) return parsed.response;
    const { name, email, currentPassword, newPassword } = parsed.data;

    const current = await prisma.user.findUnique({ where: { id: userId } });
    if (!current) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Diferença só de caixa/espaços não é troca de e-mail.
    const emailChanged = email !== normalizeEmail(current.email ?? "");

    if (emailChanged || newPassword) {
      if (!current.password) {
        return bad(
          emailChanged
            ? "Contas criadas com Google não podem alterar o e-mail."
            : "Sua conta usa login com Google e não possui senha."
        );
      }
      if (!currentPassword) return bad("Informe a senha atual para alterar o e-mail.");
      if (!(await bcrypt.compare(currentPassword, current.password))) return bad("Senha atual inválida");
    }

    if (emailChanged) {
      if (isReservedAdminEmail(email)) return bad("Email já cadastrado");
      const other = await findUserByEmail(email);
      if (other && other.id !== userId) return bad("Email já cadastrado");
    }

    let updated;
    try {
      updated = await prisma.user.update({
        where: { id: userId },
        data: {
          name,
          // Novo e-mail precisa ser verificado de novo.
          ...(emailChanged ? { email, emailVerified: null } : {}),
          ...(newPassword ? { password: await bcrypt.hash(newPassword, 12) } : {}),
        },
        include: { subscriptionStatus: true },
      });
    } catch (error) {
      if (isPrismaError(error, "P2002")) return bad("Email já cadastrado");
      throw error;
    }

    return NextResponse.json({
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        image: updated.image,
        subscriptionStatus: getEffectivePlan(updated.subscriptionStatus),
        isExpired: isPlanExpired(updated.subscriptionStatus),
      },
    });
  } catch (error) {
    console.error("Profile PUT error:", errorMessage(error));
    return NextResponse.json({ error: "Erro ao atualizar perfil" }, { status: 500 });
  }
}
