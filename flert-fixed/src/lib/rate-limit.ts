// Rate limit persistente (Postgres) — funciona entre instâncias serverless.
// Janela fixa por chave, com um único UPSERT atômico. A chave é um HMAC do escopo + identificador:
// a tabela nunca guarda e-mail ou IP em claro.
import crypto from "node:crypto";
import { isIPv6 } from "node:net";
import { prisma } from "@/lib/prisma";
import { errorMessage } from "@/lib/http";

export type RateLimitResult = { allowed: boolean; remaining: number; retryAfterSec: number };

export function rateKey(scope: string, id: string): string {
  // Em produção nunca usa um segredo padrão (o repositório é público).
  const secret =
    process.env.NEXTAUTH_SECRET ||
    (process.env.NODE_ENV === "production" ? undefined : "flertia-dev-rate-limit");
  if (!secret) throw new Error("NEXTAUTH_SECRET não configurado");
  return crypto.createHmac("sha256", secret).update(`${scope}:${id}`).digest("hex");
}

export async function rateLimit(
  scope: string,
  id: string,
  limit: number,
  windowSec: number,
  opts: { onError?: "allow" | "deny" } = {}
): Promise<RateLimitResult> {
  const key = rateKey(scope, id);
  try {
    const rows: { count: number; resetAt: Date }[] = await prisma.$queryRaw`
      INSERT INTO "rate_limits" ("key", "count", "resetAt")
      VALUES (${key}, 1, (now() AT TIME ZONE 'UTC') + make_interval(secs => ${windowSec}))
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "rate_limits"."resetAt" <= (now() AT TIME ZONE 'UTC') THEN 1 ELSE "rate_limits"."count" + 1 END,
        "resetAt" = CASE WHEN "rate_limits"."resetAt" <= (now() AT TIME ZONE 'UTC') THEN EXCLUDED."resetAt" ELSE "rate_limits"."resetAt" END
      RETURNING "count", "resetAt"`;

    // Limpeza oportunista de janelas vencidas (~1% das chamadas).
    if (Math.random() < 0.01) {
      prisma.$executeRaw`DELETE FROM "rate_limits" WHERE "resetAt" < (now() AT TIME ZONE 'UTC') - interval '1 day'`.catch(() => {});
    }

    const count = Number(rows[0]?.count ?? 1);
    const resetAt = new Date(rows[0]?.resetAt ?? Date.now());
    const retryAfterSec = Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000));
    return { allowed: count <= limit, remaining: Math.max(0, limit - count), retryAfterSec };
  } catch (error) {
    console.error("Rate limit error:", errorMessage(error));
    const allowed = (opts.onError ?? "allow") === "allow";
    return { allowed, remaining: 0, retryAfterSec: 60 };
  }
}

/** Prefixo /64 de um IPv6, com "::" expandido (senão os bits de host vazariam para a chave). */
function ipv6Prefix64(ip: string): string | null {
  if (!isIPv6(ip)) return null;
  const [head, tail] = ip.toLowerCase().split("::");
  const left = head ? head.split(":") : [];
  const right = tail !== undefined && tail !== "" ? tail.split(":") : [];
  const groups = tail === undefined ? left : [...left, ...Array(8 - left.length - right.length).fill("0"), ...right];
  return `${groups.slice(0, 4).map((g) => g.replace(/^0+(?=.)/, "")).join(":")}::/64`;
}

/**
 * IP do cliente. Na Vercel, `x-vercel-forwarded-for` / `x-real-ip` são definidos pela plataforma.
 * Fora dela, só confia no header indicado em TRUSTED_IP_HEADER (definido pelo seu proxy).
 * Nunca usa o primeiro item de `x-forwarded-for` (o cliente controla). IPv6 é agrupado por /64.
 */
export function getClientIp(get: (name: string) => string | null | undefined): string {
  const first = (v: string | null | undefined) => v?.split(",")[0]?.trim() || undefined;
  const trusted = process.env.TRUSTED_IP_HEADER?.trim().toLowerCase();
  const ip =
    (process.env.VERCEL === "1" ? first(get("x-vercel-forwarded-for")) || first(get("x-real-ip")) : undefined) ||
    (trusted ? first(get(trusted)) : undefined) ||
    "local";
  return ipv6Prefix64(ip) ?? ip;
}

export const getIp = (req: Request) => getClientIp((name) => req.headers.get(name));
