import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { checkRateLimit, getIp } from "@/lib/rate-limit";
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

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export async function POST(request: NextRequest) {
  try {
    const { allowed } = checkRateLimit(`register:${getIp(request)}`, 5, 900);
    if (!allowed) {
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde 15 minutos." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, email, password } = registerSchema.parse(body);

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email já cadastrado" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        subscriptionStatus: {
          create: { status: "FREE" },
        },
      },
      include: { subscriptionStatus: true },
    });

    const firstName = (user.name ?? "").split(" ")[0] || "você";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://flertia.com.br";

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: user.email!,
      subject: `Bem-vindo ao Flert IA, ${firstName}! Sua vida amorosa nunca mais será a mesma 💘`,
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
                Chega de travar na hora de responder, de deixar a conversa esfriar ou de mandar mensagem e se arrepender depois. A IA lê o contexto e gera exatamente o que você precisa dizer — com o tom certo, na hora certa.
              </p>

              <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,0.2),transparent);margin:24px 0"></div>

              <p style="margin:0 0 16px;font-size:13px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#9E8E7E">
                Desbloqueie o potencial completo
              </p>
              <ul style="margin:0 0 28px;padding:0;list-style:none;font-size:14px;color:#C8B89A;line-height:1.7">
                <li style="margin:0 0 8px;padding-left:8px">✦ Até <strong style="color:#F2EDE8">50 análises por dia</strong> com IA avançada</li>
                <li style="margin:0 0 8px;padding-left:8px">✦ <strong style="color:#F2EDE8">7 tons diferentes</strong> — flerte, humor, direto, cantada, stories e mais</li>
                <li style="margin:0 0 8px;padding-left:8px">✦ Respostas que <strong style="color:#F2EDE8">parecem humanas</strong>, não geradas por IA</li>
                <li style="margin:0 0 8px;padding-left:8px">✦ Plano <strong style="color:#C9A84C">Vitalício</strong> disponível — pague uma vez, use para sempre</li>
              </ul>

              <div style="text-align:center;margin:0 0 12px">
                <a href="${appUrl}/auth/login?callbackUrl=%2Fpricing"
                  style="display:inline-block;background:linear-gradient(135deg,#cc2277,#ff2d95);color:#fff;text-decoration:none;padding:14px 36px;border-radius:12px;font-weight:700;font-size:15px;letter-spacing:0.02em;box-shadow:0 4px 24px rgba(255,45,149,0.3)">
                  Escolher meu plano agora →
                </a>
              </div>
              <p style="text-align:center;margin:0;font-size:12px;color:#5C4A52">
                Ou acesse direto em <a href="${appUrl}/auth/login?callbackUrl=%2Fanalyze" style="color:#ff2d95;text-decoration:none">flertia.com.br/analyze</a>
              </p>
            </div>

            <div style="background:#0a0608;padding:24px 32px;border-radius:0 0 20px 20px;border:1px solid rgba(201,168,76,0.15);border-top:1px solid rgba(201,168,76,0.08)">
              <p style="margin:0 0 8px;font-size:12px;color:#5C4A52;line-height:1.6">
                Dúvidas? Fala com a gente pelo
                <a href="mailto:erickdev@flertia.com.br" style="color:#ff2d95;text-decoration:none"> erickdev@flertia.com.br</a> — respondemos rápido.
              </p>
              <p style="margin:0;font-size:11px;color:#3d2d35">
                Flert IA · flertia.com.br · Você recebeu este email porque criou uma conta.
              </p>
            </div>

          </div>
        </body>
        </html>
      `,
    }).catch((err) => console.error("Welcome email error:", err));

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Erro ao criar conta" },
      { status: 500 }
    );
  }
}
