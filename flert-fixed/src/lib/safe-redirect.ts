// Evita open redirect: só aceita caminhos internos da própria aplicação.
export function safeCallbackUrl(raw: string | null | undefined, fallback = "/dashboard"): string {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  if (/\p{Cc}|\\/u.test(raw)) return fallback;
  try {
    const url = new URL(raw, "http://flertia.local");
    if (url.origin !== "http://flertia.local") return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
