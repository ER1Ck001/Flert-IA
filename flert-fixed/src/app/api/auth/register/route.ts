import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createMailTransport } from "@/lib/email/transport";
import { getIp, rateLimit } from "@/lib/rate-limit";
import { errorMessage, isPrismaError, parseJsonBody, tooMany } from "@/lib/http";
import { registerSchema } from "@/lib/validation/auth";
import { findUserByEmail } from "@/lib/users";
import { welcomeEmail } from "@/lib/email/templates";
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

    const welcome = welcomeEmail({ name: user.name });
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: welcome.subject,
      html: welcome.html,
    }).catch((err) => console.error("Welcome email error:", errorMessage(err)));

    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } }, { status: 201 });
  } catch (error) {
    console.error("Register error:", errorMessage(error));
    return NextResponse.json({ error: "Erro ao criar conta" }, { status: 500 });
  }
}
