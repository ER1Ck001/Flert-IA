// Descadastro de e-mails promocionais (LGPD): link sem estado, assinado por usuário.
// Token = HMAC-SHA256(NEXTAUTH_SECRET, "unsubscribe:v1:<userId>"). Não expira: o link de um
// e-mail antigo continua funcionando. Trocar NEXTAUTH_SECRET invalida os links já enviados.
import { hmacHex, safeEqualHex } from "@/lib/signing";
import { idSchema } from "@/lib/validation/common";
import { SITE_URL } from "@/lib/seo";

const SCOPE = "unsubscribe:v1";
export const UNSUBSCRIBE_PAGE_PATH = "/descadastrar";
export const UNSUBSCRIBE_API_PATH = "/api/email/unsubscribe";

export function unsubscribeToken(userId: string): string {
  return hmacHex(SCOPE, userId);
}

export function verifyUnsubscribeToken(userId: unknown, token: unknown): boolean {
  if (!idSchema.safeParse(userId).success) return false;
  try {
    return safeEqualHex(unsubscribeToken(userId as string), token);
  } catch {
    return false;
  }
}

export interface UnsubscribeLinks {
  /** Link visível no e-mail: página que pede confirmação (GET não altera nada). */
  pageUrl: string;
  /** Alvo do List-Unsubscribe (POST one-click, RFC 8058). */
  oneClickUrl: string;
}

export function unsubscribeLinks(userId: string): UnsubscribeLinks {
  const base = (process.env.NEXT_PUBLIC_APP_URL || SITE_URL).replace(/\/+$/, "");
  const qs = `u=${encodeURIComponent(userId)}&t=${unsubscribeToken(userId)}`;
  return { pageUrl: `${base}${UNSUBSCRIBE_PAGE_PATH}?${qs}`, oneClickUrl: `${base}${UNSUBSCRIBE_API_PATH}?${qs}` };
}
