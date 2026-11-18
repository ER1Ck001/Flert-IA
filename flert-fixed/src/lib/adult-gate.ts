// Decisão do middleware sobre a confirmação de 18+ (pura, roda no Edge).
import { safeCallbackUrl } from "@/lib/safe-redirect";

export const ADULT_CONFIRM_PATH = "/auth/confirmar-idade";

/** Páginas do app que exigem a confirmação. Admin, auth, APIs e webhooks ficam de fora. */
export const ADULT_GATED_PREFIXES = ["/dashboard", "/analyze", "/history", "/pricing", "/profile", "/settings"] as const;

const isGated = (pathname: string) =>
  ADULT_GATED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

/**
 * Para onde redirecionar (ou null para seguir). Sem token não decide: o withAuth cuida do login.
 * Sem confirmação (inclui tokens antigos sem o claim), página do app → confirmação com callbackUrl.
 * Já confirmado na página de confirmação → volta ao callbackUrl (só caminhos internos).
 */
export function adultGateRedirect(
  token: Record<string, unknown> | null | undefined,
  pathname: string,
  search: string
): string | null {
  if (!token) return null;
  const adult = token.adult === true;

  if (pathname === ADULT_CONFIRM_PATH) {
    if (!adult) return null;
    const target = safeCallbackUrl(new URLSearchParams(search).get("callbackUrl"));
    // Nunca volta para a própria confirmação (evita ida e volta).
    return target.startsWith(ADULT_CONFIRM_PATH) ? "/dashboard" : target;
  }

  if (!adult && isGated(pathname)) {
    const callbackUrl = safeCallbackUrl(`${pathname}${search}`);
    return `${ADULT_CONFIRM_PATH}?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  }
  return null;
}
