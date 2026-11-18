import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createMailTransport } from "@/lib/email/transport";
import { getIp, rateLimit } from "@/lib/rate-limit";
import { errorMessage, isPrismaError, parseJsonBody, tooMany } from "@/lib/http";
import { registerSchema } from "@/lib/validation/auth";
import { findUserByEmail } from "@/lib/users";
import { emailFirstName, escapeHtml, subjectFirstName } from "@/lib/email/escape";
import { isReservedAdminEmail } from "@/lib/admin";

const transporter = createMailTransport();

const DUPLICATE = "Email já cadastrado";

export async function POST(request: NextRequest) {
  try {
    const limit = await rateLimit("register:ip", getIp(request), 5, 900, { onError: "allow" });
    if (!limit.allowed) return tooMany(limit.retryAfterSec, "Muitas tentativas. Aguarde 15 minutos.");

    const parsed = await parseJsonBody(request, registerSchema);
    if (!parsed.ok) return parsed.response;
    const { name, email, password } = parsed.data;

    // E-mail do admin é reservado (só o login Google, que comprova posse, pode criá-lo).
    if (isReservedAdminEmail(email) || (await findUserByEmail(email))) {
      return NextResponse.json({ error: DUPLICATE }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    let user;
    try {
      user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          subscriptionStatus: { create: { status: "FREE" } },
        },
      });
    } catch (error) {
      if (isPrismaError(error, "P2002")) return NextResponse.json({ error: DUPLICATE }, { status: 400 });
      throw error;
    }

    const firstName = emailFirstName(user.name);
    const appUrl = escapeHtml(process.env.NEXT_PUBLIC_APP_URL || "https://flertia.com.br");

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: `Bem-vindo ao Flert IA, ${subjectFirstName(user.name)}! Sua vida amorosa nunca mais será a mesma 💘`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8" /></head>
        <body style="margin:0;padding:0;background:#080608;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
          <div style="max-width:520px;margin:40px auto;padding:0 16px">

            <div style="text-align:center;padding:40px 32px 32px;background:#0f090d;border-radius:20px 20px 0 0;border:1px solid rgba(201,168,76,0.15);border-bottom:none">
              <div style="font-size:32px;margin-bottom:12px">💘</div>
              <h1 style="margin:0;font-size:26px;font-weight:800;color:#F2EDE8;letter-spacing:-0.5px">
                Flert<span style="color:#ff2d95">.</span>IA
              </h1>
              <p style="margin:8px 0 0;font-size:13px;color:#9E8E7E;letter-spacing:0.15em;text-transform:uppercase;font-weight:600">
                Conta criada com sucesso
              </p>
            </div>

            <div style="background:#110c0e;padding:32px;border:1px solid rgba(201,168,76,0.15);border-top:none;border-bottom:none">
              <p style="margin:0 0 20px;font-size:17px;color:#F2EDE8;line-height:1.6">
                E aí, <strong>${firstName}</strong>! 👋
              </p>
              <p style="margin:0 0 20px;font-size:15px;color:#C8B89A;line-height:1.7">
                Sua conta no <strong style="color:#ff2d95">Flert IA</strong> foi criada. A partir de agora você tem acesso a uma IA treinada pra te ajudar a se sair bem em qualquer conversa — do primeiro contato até marcar o encontro.
              </p>
              <p style="margin:0 0 20px;font-size:15px;color:#C8B89A;line-height:1.7">
                Chega de travar na hora de responder, de deixar a conversa esfriar ou de mandar mensagem e se arrepender depois. A IA lê o contexto e sugere respostas com o tom que você escolher.
              </p>

              <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,0.2),transparent);margin:24px 0"></div>

              <p style="margin:0 0 16px;font-size:13px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#9E8E7E">
                Escolha seu plano para começar
              </p>
              <ul style="margin:0 0 28px;padding:0;list-style:none;font-size:14px;color:#C8B89A;line-height:1.7">
                <li style="margin:0 0 8px;padding-left:8px">✦ Até <strong style="color:#F2EDE8">50 análises por dia</strong> no Anual — ilimitadas no Vitalício</li>
                <li style="margin:0 0 8px;padding-left:8px">✦ <strong style="color:#F2EDE8">7 tons diferentes</strong> — flerte, humor, direto, cantada, stories e mais</li>
                <li style="margin:0 0 8px;padding-left:8px">✦ Análise de prints, ideias para começar conversas e ajuda em situações difíceis</li>
                <li style="margin:0 0 8px;padding-left:8px">✦ Plano <strong style="color:#FF5FA0">Vitalício</strong> disponível — pagamento único, sem mensalidade</li>
              </ul>

              <div style="text-align:center;margin:0 0 12px">
                <a href="${appUrl}/auth/login?callbackUrl=%2Fpricing"
                  style="display:inline-block;background:linear-gradient(135deg,#cc2277,#ff2d95);color:#fff;text-decoration:none;padding:14px 36px;border-radius:12px;font-weight:700;font-size:15px;letter-spacing:0.02em;box-shadow:0 4px 24px rgba(255,45,149,0.3)">
                  Escolher meu plano agora →
                </a>
              </div>
            </div>

            <div style="background:#0a0608;padding:24px 32px;border-radius:0 0 20px 20px;border:1px solid rgba(201,168,76,0.15);border-top:1px solid rgba(201,168,76,0.08)">
              <p style="margin:0 0 8px;font-size:12px;color:#5C4A52;line-height:1.6">
                Dúvidas? Fala com a gente pelo
                <a href="mailto:erickdev@flertia.com.br" style="color:#ff2d95;text-decoration:none"> erickdev@flertia.com.br</a> — respondemos rápido.
              </p>
              <p style="margin:0;font-size:11px;color:#3d2d35">
                Flert IA · flertia.com.br · Você recebeu este email porque uma conta foi criada com este endereço.
              </p>
            </div>

          </div>
        </body>
        </html>
      `,
    }).catch((err) => console.error("Welcome email error:", errorMessage(err)));

    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } }, { status: 201 });
  } catch (error) {
    console.error("Register error:", errorMessage(error));
    return NextResponse.json({ error: "Erro ao criar conta" }, { status: 500 });
  }
}
