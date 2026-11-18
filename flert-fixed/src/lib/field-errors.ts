import type { ZodIssue } from "zod";

export type FieldErrors = Partial<Record<string, string>>;

/** Primeira mensagem de cada campo (path[0]) — para exibir inline no <Field error>. */
export function toFieldErrors(issues: readonly ZodIssue[]): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

/** Foca o primeiro campo com erro, na ordem do formulário (ids dos controles). */
export function focusFirstError(errors: FieldErrors, order: readonly string[]): void {
  const first = order.find((id) => errors[id]);
  if (first && typeof document !== "undefined") document.getElementById(first)?.focus();
}
