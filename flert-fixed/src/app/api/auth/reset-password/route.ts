import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { checkRateLimit, getIp } from "@/lib/rate-limit";
import { errorMessage, parseJsonBody } from "@/lib/http";
import { resetPasswordSchema } from "@/lib/validation/auth";

const INVALID_LINK = "Link expirado ou inválido. Solicite um novo.";

export async function POST(request: NextRequest) {
  try {
    const { allowed } = checkRateLimit(`reset:${getIp(request)}`, 10, 900);
    if (!allowed) {
      return NextResponse.json({ error: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 });
    }

    const parsed = await parseJsonBody(request, resetPasswordSchema);
    if (!parsed.ok) return parsed.response;
    const { token, password } = parsed.data;

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const hashed = await bcrypt.hash(password, 12);

    const changed = await prisma.$transaction(async (tx) => {
      // Consumo condicional e atômico: duas requisições com o mesmo token → só uma vence.
      const consumed = await tx.passwordResetToken.updateMany({
        where: { token: tokenHash, used: false, expires: { gt: new Date() } },
        data: { used: true },
      });
      if (consumed.count !== 1) return false;

      const record = await tx.passwordResetToken.findUnique({ where: { token: tokenHash } });
      if (!record) return false;

      await tx.user.update({ where: { id: record.userId }, data: { password: hashed } });
      await tx.passwordResetToken.deleteMany({ where: { userId: record.userId } });
      return true;
    });

    if (!changed) return NextResponse.json({ error: INVALID_LINK }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", errorMessage(error));
    return NextResponse.json({ error: "Erro ao redefinir senha" }, { status: 500 });
  }
}
