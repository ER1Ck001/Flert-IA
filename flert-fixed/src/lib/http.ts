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

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : "unknown");
