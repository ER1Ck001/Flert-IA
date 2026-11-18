// Revogação de sessões JWT: o token carrega a versão de sessão do usuário (sv). Trocar a senha,
// redefinir a senha ou "sair de todos os dispositivos" incrementa User.sessionVersion e invalida
// os tokens antigos. A conferência no banco é feita no máximo a cada minuto por sessão.
import { prisma } from "@/lib/prisma";

export const SESSION_CHECK_INTERVAL_MS = 60_000;

export type SessionToken = { id?: string; sv?: number; svCheckedAt?: number; adult?: boolean };

export async function checkSessionVersion(token: SessionToken, now: number = Date.now()): Promise<"ok" | "revoked"> {
  if (!token.id) return "ok";
  if (token.svCheckedAt && now - token.svCheckedAt < SESSION_CHECK_INTERVAL_MS) return "ok";

  const user = await prisma.user.findUnique({
    where: { id: token.id },
    select: { sessionVersion: true, adultConfirmedAt: true },
  });
  if (!user || user.sessionVersion !== (token.sv ?? 0)) return "revoked";

  token.svCheckedAt = now;
  // Mesma consulta: mantém o claim de 18+ em dia (confirmação feita em outro dispositivo).
  token.adult = Boolean(user.adultConfirmedAt);
  return "ok";
}

export const SESSION_VERSION_BUMP = { sessionVersion: { increment: 1 } } as const;
