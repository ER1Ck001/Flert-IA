import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createMailTransport } from "@/lib/email/transport";
import { isAdminUser } from "@/lib/admin";
import { assertSameOrigin, errorMessage, parseJsonBody } from "@/lib/http";
import { adminEmailSchema } from "@/lib/validation/admin";
import { emailFirstName, escapeHtml, sanitizeHeader } from "@/lib/email/escape";

export const maxDuration = 60; // seconds — allows sending to large user lists

const APP_URL = escapeHtml(process.env.NEXT_PUBLIC_APP_URL || "https://flertia.com.br");

const transporter = createMailTransport();

function baseWrapper(content: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#080608;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <div style="max-width:520px;margin:40px auto;padding:0 16px">
    <div style="text-align:center;padding:32px 32px 24px;background:#0f090d;border-radius:20px 20px 0 0;border:1px solid rgba(201,168,76,0.15);border-bottom:none">
      <div style="font-size:28px;margin-bottom:10px">💘</div>
      <h1 style="margin:0;font-size:24px;font-weight:800;color:#F2EDE8;letter-spacing:-0.5px">
        Flert<span style="color:#ff2d95">.</span>IA
      </h1>
    </div>
    <div style="background:#110c0e;padding:32px;border:1px solid rgba(201,168,76,0.15);border-top:none;border-bottom:none">
      ${content}
    </div>
    <div style="background:#0a0608;padding:20px 32px;border-radius:0 0 20px 20px;border:1px solid rgba(201,168,76,0.15);border-top:1px solid rgba(201,168,76,0.08)">
      <p style="margin:0 0 6px;font-size:12px;color:#5C4A52;line-height:1.6">
        Dúvidas? <a href="mailto:erickdev@flertia.com.br" style="color:#ff2d95;text-decoration:none">erickdev@flertia.com.br</a>
      </p>
      <p style="margin:0;font-size:11px;color:#3d2d35">Flert IA · flertia.com.br</p>
    </div>
  </div>
</body>
</html>`;
}

function freeUpsellHtml(firstName: string) {
  return baseWrapper(`
    <p style="margin:0 0 20px;font-size:17px;color:#F2EDE8;line-height:1.6">
      E aí, <strong>${firstName}</strong>! 👋
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#C8B89A;line-height:1.7">
      Vi que você criou sua conta no <strong style="color:#ff2d95">Flert IA</strong> mas ainda não escolheu um plano. Não acha que está na hora de destravar suas conversas?
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#C8B89A;line-height:1.7">
      Enquanto você está sem responder, alguém mais está usando a IA pra sair na frente. Não deixa a conversa esfriar.
    </p>
    <ul style="margin:0 0 28px;padding:0;list-style:none;font-size:14px;color:#C8B89A;line-height:1.7">
      <li style="margin:0 0 8px;padding-left:8px">✦ Análise de conversas e stories com IA</li>
      <li style="margin:0 0 8px;padding-left:8px">✦ 7 tons diferentes — do flerte ao direto ao ponto</li>
      <li style="margin:0 0 8px;padding-left:8px">✦ Respostas que parecem suas, não de IA</li>
    </ul>
    <div style="text-align:center;margin:0 0 12px">
      <a href="${APP_URL}/auth/login?callbackUrl=%2Fpricing"
        style="display:inline-block;background:linear-gradient(135deg,#cc2277,#ff2d95);color:#fff;text-decoration:none;padding:14px 36px;border-radius:12px;font-weight:700;font-size:15px;letter-spacing:0.02em;box-shadow:0 4px 24px rgba(255,45,149,0.3)">
        Ver planos agora →
      </a>
    </div>
    <p style="text-align:center;margin:0;font-size:12px;color:#5C4A52">
      Planos a partir de <span style="color:#ff2d95">R$ 29,90/mês</span>
    </p>
  `);
}

function expiringHtml(firstName: string, days: number) {
  return baseWrapper(`
    <p style="margin:0 0 20px;font-size:17px;color:#F2EDE8;line-height:1.6">
      Olá, <strong>${firstName}</strong>! ⚡
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#C8B89A;line-height:1.7">
      Seu plano no <strong style="color:#ff2d95">Flert IA</strong> expira em <strong style="color:#F2EDE8">${days} dia${days !== 1 ? "s" : ""}</strong>.
    </p>
    <p style="margin:0 0 28px;font-size:15px;color:#C8B89A;line-height:1.7">
      Renove agora e continue tendo as respostas certas na hora certa. Não deixa suas conversas voltarem pro modo tentativa e erro.
    </p>
    <div style="text-align:center;margin:0 0 12px">
      <a href="${APP_URL}/auth/login?callbackUrl=%2Fpricing"
        style="display:inline-block;background:linear-gradient(135deg,#cc2277,#ff2d95);color:#fff;text-decoration:none;padding:14px 36px;border-radius:12px;font-weight:700;font-size:15px;letter-spacing:0.02em;box-shadow:0 4px 24px rgba(255,45,149,0.3)">
        Renovar meu plano →
      </a>
    </div>
  `);
}

function customHtml(firstName: string, body: string) {
  const escaped = escapeHtml(body);
  const paragraphs = escaped
    .split("\n")
    .filter(l => l.trim())
    .map(p => `<p style="margin:0 0 16px;font-size:15px;color:#C8B89A;line-height:1.7">${p}</p>`)
    .join("");
  return baseWrapper(`
    <p style="margin:0 0 20px;font-size:17px;color:#F2EDE8;line-height:1.6">
      Olá, <strong>${firstName}</strong>! 👋
    </p>
    ${paragraphs}
    <div style="text-align:center;margin-top:28px">
      <a href="${APP_URL}/auth/login?callbackUrl=%2Fdashboard"
        style="display:inline-block;background:linear-gradient(135deg,#cc2277,#ff2d95);color:#fff;text-decoration:none;padding:14px 36px;border-radius:12px;font-weight:700;font-size:15px;letter-spacing:0.02em;box-shadow:0 4px 24px rgba(255,45,149,0.3)">
        Acessar Flert IA →
      </a>
    </div>
  `);
}

export async function POST(request: NextRequest) {
  try {
    const crossSite = assertSameOrigin(request);
    if (crossSite) return crossSite;
    const session = await getServerSession(authOptions);
    if (!(await isAdminUser(session?.user?.id))) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const parsed = await parseJsonBody(request, adminEmailSchema);
    if (!parsed.ok) return parsed.response;
    const { template, customSubject, customBody, targetPlan, userId } = parsed.data;

    type Target = { email: string | null; name: string | null; expiresAt?: Date | null };
    let targets: Target[] = [];

    if (userId) {
      const u = await prisma.user.findUnique({
        where:  { id: userId },
        select: { email: true, name: true, subscriptionStatus: { select: { expiresAt: true } } },
      });
      if (!u?.email) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
      targets = [{ email: u.email, name: u.name, expiresAt: u.subscriptionStatus?.expiresAt }];
    } else if (template === "free_upsell") {
      targets = await prisma.user.findMany({
        where: { subscriptionStatus: { status: "FREE" } },
        select: { email: true, name: true },
      });
    } else if (template === "expiring") {
      const in7days = new Date(Date.now() + 7 * 86400000);
      const subs = await prisma.subscriptionStatus.findMany({
        where: { status: { in: ["PREMIUM", "ANNUAL"] }, expiresAt: { lte: in7days, gte: new Date() } },
        include: { user: { select: { email: true, name: true } } },
      });
      targets = subs.map(s => ({ email: s.user.email, name: s.user.name, expiresAt: s.expiresAt }));
    } else {
      const where = targetPlan !== "ALL" ? { subscriptionStatus: { status: targetPlan } } : {};
      targets = await prisma.user.findMany({ where, select: { email: true, name: true } });
    }

    let sent = 0;
    let failed = 0;

    for (const target of targets) {
      if (!target.email) continue;
      const firstName = emailFirstName(target.name);
      try {
        let subject: string;
        let html: string;

        if (template === "free_upsell") {
          subject = "Não acha que está na hora de destravar suas conversas? 💘";
          html = freeUpsellHtml(firstName);
        } else if (template === "expiring") {
          const days = target.expiresAt
            ? Math.max(1, Math.ceil((new Date(target.expiresAt).getTime() - Date.now()) / 86400000))
            : 1;
          subject = `Seu plano expira em ${days} dia${days !== 1 ? "s" : ""} ⚡`;
          html = expiringHtml(firstName, days);
        } else {
          subject = sanitizeHeader(customSubject || "Novidades no Flert IA");
          html = customHtml(firstName, customBody || "");
        }

        await transporter.sendMail({ from: process.env.SMTP_FROM, to: target.email, subject, html });
        sent++;
      } catch (err) {
        // Sem o e-mail do destinatário no log (dado pessoal).
        console.error("Admin email send failed:", errorMessage(err));
        failed++;
      }
    }

    return NextResponse.json({ sent, failed, total: targets.length });
  } catch (error) {
    console.error("Admin email error:", errorMessage(error));
    return NextResponse.json({ error: "Erro ao enviar e-mails" }, { status: 500 });
  }
}
