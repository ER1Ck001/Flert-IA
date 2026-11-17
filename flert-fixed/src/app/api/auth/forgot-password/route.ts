import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import crypto from "node:crypto";
import { checkRateLimit, getIp } from "@/lib/rate-limit";
import { errorMessage, parseJsonBody } from "@/lib/http";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { findUserByEmail } from "@/lib/users";
import { escapeHtml } from "@/lib/email/escape";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora
const RESEND_COOLDOWN_MS = 60 * 1000; // 1 e-mail por minuto por conta

// Resposta sempre igual — não revela se o e-mail tem conta.
const OK = () => NextResponse.json({ success: true });

const hashResetToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

export async function POST(request: NextRequest) {
  try {
    const { allowed } = checkRateLimit(`forgot:${getIp(request)}`, 3, 3600);
    if (!allowed) {
      return NextResponse.json({ error: "Muitas tentativas. Aguarde 1 hora." }, { status: 429 });
    }

    const parsed = await parseJsonBody(request, forgotPasswordSchema);
    if (!parsed.ok) return parsed.response;

    const user = await findUserByEmail(parsed.data.email);
    if (!user?.email || !user.password) return OK();

    const now = Date.now();
    const recent = await prisma.passwordResetToken.findFirst({
      where: { userId: user.id, createdAt: { gt: new Date(now - RESEND_COOLDOWN_MS) } },
    });
    if (recent) return OK();

    // O banco guarda só o hash; o token em claro vai apenas no e-mail.
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
      prisma.passwordResetToken.create({
        data: { userId: user.id, token: hashResetToken(token), expires: new Date(now + TOKEN_TTL_MS) },
      }),
    ]);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://flertia.com.br";
    const resetUrl = escapeHtml(`${appUrl}/auth/reset-password?token=${token}`);

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: user.email,
        subject: "Recuperar senha — Flert IA",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0a0a0a;color:#fff;border-radius:16px">
            <h2 style="color:#ff2d95;margin:0 0 8px">Flert IA</h2>
            <p style="color:#aaa;margin:0 0 24px">Recuperação de senha</p>
            <p style="margin:0 0 24px">Clique no botão abaixo para criar uma nova senha. O link expira em <strong>1 hora</strong> e só pode ser usado uma vez.</p>
            <a href="${resetUrl}" style="display:inline-block;background:#ff2d95;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px">Redefinir senha</a>
            <p style="color:#666;font-size:12px;margin-top:32px">Se você não solicitou isso, ignore este email.</p>
          </div>
        `,
      });
    } catch (err) {
      console.error("Forgot password email error:", errorMessage(err));
    }

    return OK();
  } catch (error) {
    console.error("Forgot password error:", errorMessage(error));
    return NextResponse.json({ error: "Erro ao processar a solicitação" }, { status: 500 });
  }
}
