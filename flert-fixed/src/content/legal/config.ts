// rascunho — revisar com advogado antes de publicar.
// Estado de publicação dos Termos de Uso e da Política de Privacidade (Tarefa 10).
// Para publicar: preencher todos os campos entre colchetes em termos.ts e privacidade.ts,
// revisar com advogado, atualizar LEGAL_VERSION/LAST_UPDATED e trocar LEGAL_PUBLISHED para true.
// O teste tests/config/legal-docs.test.ts falha se LEGAL_PUBLISHED = true com placeholders pendentes.

/** false: /termos e /privacidade dão 404 em produção e os links ficam escondidos. */
export const LEGAL_PUBLISHED = false;

/** Versão gravada em User.termsVersion quando o usuário aceita os documentos publicados. */
export const LEGAL_VERSION = "2026-11-18-rascunho";

/** Data da última revisão (AAAA-MM-DD). */
export const LAST_UPDATED = "2026-11-18";

export type LegalBlock = string | { list: readonly string[] };

export interface LegalSection {
  id: string;
  title: string;
  body: readonly LegalBlock[];
}

export interface LegalDoc {
  title: string;
  description: string;
  intro: readonly string[];
  sections: readonly LegalSection[];
}

/** Renderiza a página? Sem publicar, só fora de produção (com o banner de rascunho). */
export function shouldRenderLegalPage(
  published: boolean = LEGAL_PUBLISHED,
  nodeEnv: string | undefined = process.env.NODE_ENV
): boolean {
  return published || nodeEnv !== "production";
}

const PLACEHOLDER = /\[[A-ZÀ-Ý0-9][A-ZÀ-Ý0-9/ \-]*\]/g;

/** Campos entre colchetes ainda não preenchidos (ex.: "[CPF/CNPJ]"), sem repetição. */
export function findPlaceholders(doc: unknown): string[] {
  const found = JSON.stringify(doc).match(PLACEHOLDER) ?? [];
  return [...new Set(found)];
}

/** Dados do controlador: placeholders visíveis até o dono preencher. */
export const CONTROLLER = {
  name: "[NOME/RAZÃO SOCIAL]",
  document: "[CPF/CNPJ]",
  address: "[ENDEREÇO]",
  dpoEmail: "[E-MAIL DO ENCARREGADO]",
} as const;
