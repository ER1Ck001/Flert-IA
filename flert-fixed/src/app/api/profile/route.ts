import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createMailTransport } from "@/lib/email/transport";
import { getEffectivePlan, isPlanExpired } from "@/lib/plans";
import { assertSameOrigin, errorMessage, isPrismaError, parseJsonBody, tooMany } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { SESSION_VERSION_BUMP } from "@/lib/session-version";
import { deleteAccountSchema, normalizeEmail, profileUpdateSchema } from "@/lib/validation/auth";
import { findUserByEmail } from "@/lib/users";
import { emailFirstName, escapeHtml } from "@/lib/email/escape";
import { isReservedAdminEmail } from "@/lib/admin";

const transporter = createMailTransport();

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

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const crossSite = assertSameOrigin(request);
    if (crossSite) return crossSite;

    const limit = await rateLimit("account:delete", session.user.id, 5, 3600, { onError: "allow" });
    if (!limit.allowed) return tooMany(limit.retryAfterSec);

    // Confirmação explícita: digitar EXCLUIR e, se a conta tem senha, informá-la.
    const parsed = await parseJsonBody(request, deleteAccountSchema);
    if (!parsed.ok) return parsed.response;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, password: true },
    });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    if (user.password) {
      if (!parsed.data.password) return bad("Informe sua senha para excluir a conta.");
      if (!(await bcrypt.compare(parsed.data.password, user.password))) return bad("Senha incorreta");
    }

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
              Sua conta no <strong style="color:#fff">Flert IA</strong> foi excluída com sucesso. Seus dados — histórico de análises, perfil e registros de assinatura — foram removidos da nossa base de dados. Registros mantidos pelos nossos processadores (como a AbacatePay, para pagamentos) seguem as políticas deles e as obrigações legais aplicáveis.
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
    const crossSite = assertSameOrigin(request);
    if (crossSite) return crossSite;

    // A senha atual pode ser testada aqui: limita para não virar força bruta com sessão roubada.
    const limit = await rateLimit("profile:update", userId, 20, 900, { onError: "allow" });
    if (!limit.allowed) return tooMany(limit.retryAfterSec);

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
          // Troca de senha ou de e-mail derruba as sessões abertas em outros dispositivos.
          ...(emailChanged || newPassword ? SESSION_VERSION_BUMP : {}),
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
