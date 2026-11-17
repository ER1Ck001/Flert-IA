// Cota diária de análises (somente servidor).
//
// Reserva ANTES de chamar a IA com um único UPSERT condicional — atômico, sem lock e sem
// segurar transação durante a chamada à OpenAI. Se a IA falhar, a reserva é devolvida.
// O contador é independente do histórico: apagar análises não libera cota.

import { prisma } from "@/lib/prisma";
import { getDayKey } from "@/lib/time";

export type Reservation = { ok: boolean; dayKey: string; used: number };

export async function reserveDailyUsage(
  userId: string,
  limit: number | null,
  now: Date = new Date()
): Promise<Reservation> {
  const dayKey = getDayKey(now);
  if (limit !== null && limit <= 0) return { ok: false, dayKey, used: 0 };

  const rows: { count: number }[] =
    limit === null
      ? await prisma.$queryRaw`
          INSERT INTO "daily_usage" ("userId", "day", "count", "updatedAt")
          VALUES (${userId}, ${dayKey}, 1, now())
          ON CONFLICT ("userId", "day")
          DO UPDATE SET "count" = "daily_usage"."count" + 1, "updatedAt" = now()
          RETURNING "count"`
      : await prisma.$queryRaw`
          INSERT INTO "daily_usage" ("userId", "day", "count", "updatedAt")
          VALUES (${userId}, ${dayKey}, 1, now())
          ON CONFLICT ("userId", "day")
          DO UPDATE SET "count" = "daily_usage"."count" + 1, "updatedAt" = now()
          WHERE "daily_usage"."count" < ${limit}
          RETURNING "count"`;

  if (rows.length === 0) return { ok: false, dayKey, used: limit ?? 0 };
  return { ok: true, dayKey, used: Number(rows[0].count) };
}

/**
 * Devoluções por saída inválida da IA são limitadas por dia: a OpenAI já cobrou os tokens,
 * e sem teto um usuário poderia induzir falhas de propósito para gerar chamadas grátis.
 */
export const MAX_REFUNDS_PER_DAY = 3;

/** Devolve a reserva se ainda houver devoluções no dia. Retorna se devolveu. */
export async function refundDailyUsage(userId: string, dayKey: string): Promise<boolean> {
  const rows: { count: number }[] = await prisma.$queryRaw`
    UPDATE "daily_usage"
    SET "count" = GREATEST("count" - 1, 0), "refunds" = "refunds" + 1, "updatedAt" = now()
    WHERE "userId" = ${userId} AND "day" = ${dayKey} AND "refunds" < ${MAX_REFUNDS_PER_DAY}
    RETURNING "count"`;
  return rows.length > 0;
}

/** Devolve uma reserva sem teto (falha de rede/OpenAI ou do banco). Usa o dia da reserva. */
export async function releaseDailyUsage(userId: string, dayKey: string): Promise<void> {
  await prisma.$executeRaw`
    UPDATE "daily_usage" SET "count" = GREATEST("count" - 1, 0), "updatedAt" = now()
    WHERE "userId" = ${userId} AND "day" = ${dayKey}`;
}

export async function getUsageCount(userId: string, now: Date = new Date()): Promise<number> {
  const rows: { count: number }[] = await prisma.$queryRaw`
    SELECT "count" FROM "daily_usage" WHERE "userId" = ${userId} AND "day" = ${getDayKey(now)}`;
  return rows.length ? Number(rows[0].count) : 0;
}
