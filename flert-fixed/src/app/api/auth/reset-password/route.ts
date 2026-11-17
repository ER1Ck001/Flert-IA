import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { getIp, rateLimit } from "@/lib/rate-limit";
import { SESSION_VERSION_BUMP } from "@/lib/session-version";
import { errorMessage, parseJsonBody, tooMany } from "@/lib/http";
import { resetPasswordSchema } from "@/lib/validation/auth";

const INVALID_LINK = "Link expirado ou inválido. Solicite um novo.";

export async function POST(request: NextRequest) {
  try {
    const limit = await rateLimit("reset:ip", getIp(request), 10, 900, { onError: "allow" });
    if (!limit.allowed) return tooMany(limit.retryAfterSec);

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

      // Nova senha + derruba todas as sessões abertas (inclusive a de quem roubou a senha antiga).
      await tx.user.update({ where: { id: record.userId }, data: { password: hashed, ...SESSION_VERSION_BUMP } });
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
