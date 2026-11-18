import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createMailTransport } from "@/lib/email/transport";
import { isAdminUser } from "@/lib/admin";
import { assertSameOrigin, errorMessage, parseJsonBody } from "@/lib/http";
import { adminEmailSchema } from "@/lib/validation/admin";
import { customEmail, expiringEmail, freeUpsellEmail } from "@/lib/email/templates";

export const maxDuration = 60; // seconds — allows sending to large user lists

const transporter = createMailTransport();

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
      try {
        let mail;
        if (template === "free_upsell") {
          mail = freeUpsellEmail({ name: target.name });
        } else if (template === "expiring") {
          const days = target.expiresAt
            ? Math.max(1, Math.ceil((new Date(target.expiresAt).getTime() - Date.now()) / 86400000))
            : 1;
          mail = expiringEmail({ name: target.name, days });
        } else {
          mail = customEmail({ name: target.name, subject: customSubject, body: customBody });
        }

        await transporter.sendMail({ from: process.env.SMTP_FROM, to: target.email, subject: mail.subject, html: mail.html });
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
