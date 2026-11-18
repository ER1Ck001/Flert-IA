import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createMailTransport } from "@/lib/email/transport";
import { isAdminUser } from "@/lib/admin";
import { assertSameOrigin, errorMessage, parseJsonBody } from "@/lib/http";
import { adminEmailSchema } from "@/lib/validation/admin";
import { customEmail, expiringEmail, freeUpsellEmail } from "@/lib/email/templates";
import { EMAIL_CONCURRENCY, EMAIL_SEND_DEADLINE_MS, EMAIL_START_CUTOFF_MS } from "@/lib/email/bulk";
import { unsubscribeLinks } from "@/lib/email/unsubscribe";

// Campanhas do admin são e-mails promocionais (LGPD): só para quem deu opt-in
// (User.marketingOptIn = true), sempre com link e cabeçalhos de descadastro.
const OPTED_IN = { marketingOptIn: true } as const;
const NOT_OPTED_IN = "Este usuário não aceitou receber e-mails promocionais.";

// Envio em lotes (ver lib/email/bulk.ts): responde antes deste limite e devolve o que falta.
export const maxDuration = 60; // seconds

const transporter = createMailTransport();

class SendDeadlineExceeded extends Error {
  constructor() {
    super("Tempo de envio esgotado");
    this.name = "SendDeadlineExceeded";
  }
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
    const { template, customSubject, customBody, targetPlan, userId, cursor } = parsed.data;

    // `id` (do usuário) só ordena os envios e serve de cursor. Filtros de antes + opt-in.
    type Target = { id: string; email: string | null; name: string | null; expiresAt?: Date | null };
    let targets: Target[] = [];

    if (userId) {
      const u = await prisma.user.findUnique({
        where:  { id: userId },
        select: { email: true, name: true, marketingOptIn: true, subscriptionStatus: { select: { expiresAt: true } } },
      });
      if (!u?.email) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
      if (!u.marketingOptIn) return NextResponse.json({ error: NOT_OPTED_IN }, { status: 409 });
      targets = [{ id: userId, email: u.email, name: u.name, expiresAt: u.subscriptionStatus?.expiresAt }];
    } else if (template === "free_upsell") {
      targets = await prisma.user.findMany({
        where: { subscriptionStatus: { status: "FREE" }, ...OPTED_IN },
        select: { id: true, email: true, name: true },
      });
    } else if (template === "expiring") {
      const in7days = new Date(Date.now() + 7 * 86400000);
      const subs = await prisma.subscriptionStatus.findMany({
        where: { status: { in: ["PREMIUM", "ANNUAL"] }, expiresAt: { lte: in7days, gte: new Date() }, user: OPTED_IN },
        include: { user: { select: { id: true, email: true, name: true } } },
      });
      targets = subs.map(s => ({ id: s.user.id, email: s.user.email, name: s.user.name, expiresAt: s.expiresAt }));
    } else {
      const where = targetPlan !== "ALL" ? { subscriptionStatus: { status: targetPlan }, ...OPTED_IN } : { ...OPTED_IN };
      targets = await prisma.user.findMany({ where, select: { id: true, email: true, name: true } });
    }

    // Ordem estável por id: a próxima chamada (com `cursor`) retoma de onde esta parou, sem repetir.
    targets.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    const pending = cursor ? targets.filter(t => t.id > cursor) : targets;

    const buildMail = (target: Target) => {
      const unsubscribe = unsubscribeLinks(target.id);
      if (template === "free_upsell") return freeUpsellEmail({ name: target.name, unsubscribe });
      if (template === "expiring") {
        const days = target.expiresAt
          ? Math.max(1, Math.ceil((new Date(target.expiresAt).getTime() - Date.now()) / 86400000))
          : 1;
        return expiringEmail({ name: target.name, days, unsubscribe });
      }
      return customEmail({ name: target.name, subject: customSubject, body: customBody, unsubscribe });
    };

    const startedAt = Date.now();
    let deadlineTimer: ReturnType<typeof setTimeout> | undefined;
    const deadline = new Promise<never>((_, reject) => {
      deadlineTimer = setTimeout(() => reject(new SendDeadlineExceeded()), EMAIL_SEND_DEADLINE_MS);
    });
    deadline.catch(() => {}); // sem "unhandled rejection" quando nenhum envio está aguardando

    let sent = 0;
    let failed = 0;
    let processed = 0;

    const sendOne = async (target: Target) => {
      if (!target.email) return; // sem e-mail: pulado, como antes (não conta como falha)
      try {
        const mail = buildMail(target);
        await Promise.race([
          transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: target.email,
            subject: mail.subject,
            html: mail.html,
            headers: mail.headers,
          }),
          deadline,
        ]);
        sent++;
      } catch (err) {
        // Sem o e-mail do destinatário no log (dado pessoal).
        console.error("Admin email send failed:", errorMessage(err));
        failed++;
      }
    };

    try {
      while (processed < pending.length && Date.now() - startedAt < EMAIL_START_CUTOFF_MS) {
        const batch = pending.slice(processed, processed + EMAIL_CONCURRENCY);
        await Promise.all(batch.map(sendOne));
        processed += batch.length;
      }
    } finally {
      clearTimeout(deadlineTimer);
    }

    const remaining = pending.length - processed;
    const nextCursor = remaining > 0 ? pending[processed - 1]?.id ?? cursor ?? null : null;

    return NextResponse.json({ sent, failed, total: targets.length, processed, remaining, nextCursor });
  } catch (error) {
    console.error("Admin email error:", errorMessage(error));
    return NextResponse.json({ error: "Erro ao enviar e-mails" }, { status: 500 });
  }
}
