// Templates de e-mail (Tarefa 8). Um layout só, na voz de docs/marketing/brand-voice.md:
// sem emoji, sem promessa de resultado, preços e limites sempre de src/lib/plans.ts.
import {
  PLANS_IN_ORDER,
  PLAN_CONFIG,
  PLAN_LABELS,
  formatBRL,
  getPlanBenefits,
  type PaidPlan,
  type PlanConfig,
} from "@/lib/plans";
import { SITE_URL } from "@/lib/seo";
import { SUPPORT_EMAIL } from "@/lib/support";
import { APP_TIMEZONE } from "@/lib/time";
import { emailFirstName, escapeHtml, sanitizeHeader, subjectFirstName } from "./escape";

export interface EmailContent {
  subject: string;
  html: string;
}

const appUrl = () => escapeHtml(process.env.NEXT_PUBLIC_APP_URL || SITE_URL);

const P = "margin:0 0 16px;font-size:15px;color:#C8B89A;line-height:1.7";
const EYEBROW = "margin:0 0 16px;font-size:13px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#9E8E7E";
const LIST = "margin:0 0 28px;padding:0;list-style:none;font-size:14px;color:#C8B89A;line-height:1.7";
const BORDER = "border:1px solid rgba(201,168,76,0.15)";

const p = (text: string) => `<p style="${P}">${text}</p>`;
const greeting = (firstName: string) =>
  `<p style="margin:0 0 20px;font-size:17px;color:#F2EDE8;line-height:1.6">Olá, <strong>${firstName}</strong>.</p>`;
const list = (items: readonly string[]) =>
  `<ul style="${LIST}">${items.map((i) => `<li style="margin:0 0 8px;padding-left:8px">✦ ${i}</li>`).join("")}</ul>`;
const cta = (href: string, label: string) => `<div style="text-align:center;margin:0 0 12px">
  <a href="${href}" style="display:inline-block;background:linear-gradient(135deg,#cc2277,#ff2d95);color:#fff;text-decoration:none;padding:14px 36px;border-radius:12px;font-weight:700;font-size:15px;letter-spacing:0.02em;box-shadow:0 4px 24px rgba(255,45,149,0.3)">${label} →</a>
</div>`;

function layout({ eyebrow, body, footerNote }: { eyebrow?: string; body: string; footerNote: string }): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#080608;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <div style="max-width:520px;margin:40px auto;padding:0 16px">
    <div style="text-align:center;padding:36px 32px 28px;background:#0f090d;border-radius:20px 20px 0 0;${BORDER};border-bottom:none">
      <h1 style="margin:0;font-size:26px;font-weight:800;color:#F2EDE8;letter-spacing:-0.5px">Flert <span style="color:#ff2d95">IA</span></h1>
      ${eyebrow ? `<p style="margin:8px 0 0;font-size:13px;color:#9E8E7E;letter-spacing:0.15em;text-transform:uppercase;font-weight:600">${eyebrow}</p>` : ""}
    </div>
    <div style="background:#110c0e;padding:32px;${BORDER};border-top:none;border-bottom:none">
      ${body}
    </div>
    <div style="background:#0a0608;padding:24px 32px;border-radius:0 0 20px 20px;${BORDER};border-top:1px solid rgba(201,168,76,0.08)">
      <p style="margin:0 0 8px;font-size:12px;color:#5C4A52;line-height:1.6">Dúvidas? Fale com a gente em <a href="mailto:${SUPPORT_EMAIL}" style="color:#ff2d95;text-decoration:none">${SUPPORT_EMAIL}</a>.</p>
      <p style="margin:0;font-size:11px;color:#3d2d35">Flert IA · flertia.com.br · ${footerNote}</p>
    </div>
  </div>
</body>
</html>`;
}

/** Preço com o período: "/mês", "/ano" ou "(pagamento único)" no Vitalício. */
function priceText(plan: PlanConfig): string {
  const price = formatBRL(plan.priceCents);
  return plan.durationDays === null ? `${price} (${plan.periodLabel})` : `${price}${plan.periodLabel}`;
}

function limitText(plan: PlanConfig): string {
  return plan.dailyLimit === null ? "análises ilimitadas" : `${plan.dailyLimit} análises por dia`;
}

const formatDate = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: APP_TIMEZONE, day: "2-digit", month: "2-digit", year: "numeric" }).format(d);

// ── Boas-vindas (cadastro por e-mail e Google) ──────────────
export function welcomeEmail({ name }: { name: string | null | undefined }): EmailContent {
  const url = appUrl();
  return {
    subject: `Boas-vindas ao Flert IA, ${subjectFirstName(name)}`,
    html: layout({
      eyebrow: "Conta criada",
      footerNote: "Você recebeu este e-mail porque uma conta foi criada com este endereço.",
      body: [
        greeting(emailFirstName(name)),
        p(`Sua conta no <strong style="color:#ff2d95">Flert IA</strong> foi criada. Com um plano ativo, você envia o print ou descreve a situação, escolhe o tom e recebe 3 sugestões para copiar ou editar.`),
        p("Quando travar na hora de responder, envie o print e veja 3 sugestões no tom que você escolher. Você decide o que usar: copie, edite ou descarte."),
        `<p style="${EYEBROW}">Escolha seu plano para começar</p>`,
        list([
          ...PLANS_IN_ORDER.map((pl) => `<strong style="color:#F2EDE8">${pl.label}</strong>: ${priceText(pl)} · ${limitText(pl)}`),
          "Em todos os planos: 7 tons e 3 sugestões por análise",
        ]),
        cta(`${url}/auth/login?callbackUrl=%2Fpricing`, "Escolher meu plano"),
      ].join("\n"),
    }),
  };
}

// ── Pagamento confirmado (webhook) ──────────────────────────
export function planActivatedEmail({
  name,
  plan,
  expiresAt,
}: {
  name: string | null | undefined;
  plan: PaidPlan;
  expiresAt: Date | null;
}): EmailContent {
  const label = PLAN_LABELS[plan];
  const config = PLAN_CONFIG[plan];
  const access =
    config.durationDays === null
      ? "Seu acesso é ilimitado e não tem data de expiração."
      : `${expiresAt ? `Seu acesso vale até ${formatDate(expiresAt)}.` : `Seu acesso vale por ${config.durationDays} dias.`} Não há renovação automática.`;
  return {
    subject: `Plano ${label} ativo no Flert IA`,
    html: layout({
      eyebrow: `Plano ${label} ativo`,
      footerNote: "Você recebeu este e-mail porque fez uma compra no Flert IA.",
      body: [
        greeting(emailFirstName(name)),
        p(`Sua compra foi confirmada e o plano <strong style="color:#ff2d95">${label}</strong> já está ativo na sua conta. ${access}`),
        `<p style="${EYEBROW}">O que está incluso no seu plano</p>`,
        list(getPlanBenefits(plan)),
        p("Para começar, abra “Analisar”, envie um print ou descreva a situação e escolha o tom. A IA sugere 3 respostas: você decide qual usar e pode editar antes de mandar."),
        cta(`${appUrl()}/analyze`, "Começar a usar"),
      ].join("\n"),
    }),
  };
}

// ── Campanhas do admin ──────────────────────────────────────
const CAMPAIGN_FOOTER = "Você recebeu este e-mail porque tem uma conta no Flert IA.";

export const FREE_UPSELL_SUBJECT = "Seu Flert IA está pronto, falta escolher um plano";

export function freeUpsellEmail({ name }: { name: string | null | undefined }): EmailContent {
  return {
    subject: FREE_UPSELL_SUBJECT,
    html: layout({
      footerNote: CAMPAIGN_FOOTER,
      body: [
        greeting(emailFirstName(name)),
        p("Você criou sua conta no Flert IA, mas ainda não escolheu um plano. As análises começam assim que você escolher."),
        p("Quando bater a dúvida sobre o que responder, envie o print e veja 3 sugestões no tom que você escolher."),
        list([
          "Análise de prints de conversas e stories",
          "7 tons, do flerte ao direto ao ponto",
          "Você escolhe, edita e manda do seu jeito",
        ]),
        cta(`${appUrl()}/auth/login?callbackUrl=%2Fpricing`, "Ver planos"),
        `<p style="text-align:center;margin:0;font-size:12px;color:#5C4A52">${PLANS_IN_ORDER.map((pl) => `${pl.label} ${priceText(pl)}`).join(" · ")}</p>`,
      ].join("\n"),
    }),
  };
}

const daysText = (days: number) => `${days} dia${days !== 1 ? "s" : ""}`;

export const expiringSubject = (days: number) => `Seu plano Flert IA vence em ${daysText(days)}`;

export function expiringEmail({ name, days }: { name: string | null | undefined; days: number }): EmailContent {
  return {
    subject: expiringSubject(days),
    html: layout({
      footerNote: CAMPAIGN_FOOTER,
      body: [
        greeting(emailFirstName(name)),
        p(`Seu plano no <strong style="color:#ff2d95">Flert IA</strong> vence em <strong style="color:#F2EDE8">${daysText(days)}</strong>.`),
        p("Para continuar usando as análises, renove antes do fim: os dias que restam são somados ao novo período. Não há renovação automática."),
        cta(`${appUrl()}/auth/login?callbackUrl=%2Fpricing`, "Renovar meu plano"),
      ].join("\n"),
    }),
  };
}

export function customEmail({
  name,
  subject,
  body,
}: {
  name: string | null | undefined;
  subject: string | null | undefined;
  body: string | null | undefined;
}): EmailContent {
  const paragraphs = escapeHtml(body ?? "")
    .split("\n")
    .filter((l) => l.trim())
    .map(p)
    .join("");
  return {
    subject: sanitizeHeader(subject || "Novidades no Flert IA"),
    html: layout({
      footerNote: CAMPAIGN_FOOTER,
      body: [greeting(emailFirstName(name)), paragraphs, cta(`${appUrl()}/auth/login?callbackUrl=%2Fdashboard`, "Acessar o Flert IA")].join("\n"),
    }),
  };
}
