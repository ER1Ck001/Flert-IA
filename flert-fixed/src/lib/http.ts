// Utilitários de rotas (somente servidor).
import { NextResponse } from "next/server";
import type { z } from "zod";

export type ParseResult<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

/** Lê o corpo JSON e valida. JSON quebrado ou inválido → 400 (nunca 500). */
export async function parseJsonBody<S extends z.ZodTypeAny>(req: Request, schema: S): Promise<ParseResult<z.output<S>>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { ok: false, response: NextResponse.json({ error: "JSON inválido" }, { status: 400 }) };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const message = issue && issue.path.length > 0 ? issue.message : "Requisição inválida";
    return { ok: false, response: NextResponse.json({ error: message }, { status: 400 }) };
  }
  return { ok: true, data: parsed.data };
}

export const isPrismaError = (e: unknown, code: "P2002" | "P2003" | "P2025") =>
  typeof e === "object" && e !== null && (e as { code?: unknown }).code === code;

/**
 * Texto seguro para log. Erros do Prisma viram só "Nome:código": a mensagem deles inclui a
 * invocação com valores (e-mail, hash de senha).
 */
export const errorMessage = (e: unknown): string => {
  if (!(e instanceof Error)) return "unknown";
  const code = (e as { code?: unknown }).code;
  if (typeof code === "string" && /^P\d{4}$/.test(code)) return `${e.name}:${code}`;
  if (e.name.startsWith("PrismaClient")) return e.name;
  return e.message;
};

/** 429 com Retry-After. */
export const tooMany = (retryAfterSec: number, error = "Muitas tentativas. Aguarde alguns minutos.") =>
  NextResponse.json({ error }, { status: 429, headers: { "Retry-After": String(retryAfterSec) } });

/**
 * Defesa contra CSRF em rotas que mudam estado com cookie de sessão: rejeita requisições
 * de outra origem. Sem Origin e sem Sec-Fetch-Site cross-site, permite (clientes antigos).
 * Retorna a resposta 403 ou null quando está tudo certo.
 */
export function assertSameOrigin(req: Request): NextResponse | null {
  const origin = req.headers.get("origin");
  const fetchSite = req.headers.get("sec-fetch-site");
  const forbidden = () => NextResponse.json({ error: "Origem não permitida" }, { status: 403 });

  if (!origin) return fetchSite === "cross-site" ? forbidden() : null;

  const allowed = new Set<string>([new URL(req.url).origin]);
  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      allowed.add(new URL(process.env.NEXT_PUBLIC_APP_URL).origin);
    } catch {
      /* variável mal formada: vale só a origem da própria requisição */
    }
  }
  return allowed.has(origin) ? null : forbidden();
}
