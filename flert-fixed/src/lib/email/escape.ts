// Escape para conteúdo dinâmico em e-mails HTML.

const ENTITIES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[&<>"']/g, (c) => ENTITIES[c]);
}

/** Primeiro nome, já escapado e com tamanho limitado — pronto para HTML e assunto. */
export function emailFirstName(name: string | null | undefined): string {
  const first = (name ?? "").trim().split(/\s+/)[0]?.slice(0, 30) ?? "";
  return first ? escapeHtml(first) : "você";
}

/** Primeiro nome em texto puro para o ASSUNTO (cabeçalho não interpreta HTML). */
export function subjectFirstName(name: string | null | undefined): string {
  const first = sanitizeHeader((name ?? "").trim().split(/\s+/)[0] ?? "").slice(0, 30);
  return first || "você";
}

/** Remove quebras de linha e caracteres de controle (evita injeção em cabeçalhos). */
export function sanitizeHeader(value: string): string {
  return value.replace(/[\r\n]+/g, " ").replace(/\p{Cc}/gu, "");
}
