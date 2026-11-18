// Assinatura HMAC-SHA256 com o segredo da aplicação (somente servidor).
import crypto from "node:crypto";

function appSecret(): string {
  // Em produção nunca usa um segredo padrão (o repositório é público) — mesma regra do rate limit.
  const secret =
    process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV === "production" ? undefined : "flertia-dev-signing");
  if (!secret) throw new Error("NEXTAUTH_SECRET não configurado");
  return secret;
}

/** HMAC-SHA256 (hex) de `scope:data`. O escopo separa usos diferentes do mesmo segredo. */
export function hmacHex(scope: string, data: string): string {
  return crypto.createHmac("sha256", appSecret()).update(`${scope}:${data}`).digest("hex");
}

/** Comparação em tempo constante de dois hex de mesmo tamanho; qualquer outra entrada → false. */
export function safeEqualHex(expected: string, received: unknown): boolean {
  if (typeof received !== "string" || !/^[a-f0-9]+$/.test(received) || received.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(received, "hex"));
}
