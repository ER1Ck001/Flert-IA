// Extração das sugestões da resposta do modelo. Padrões copiados literalmente das rotas originais.

export const IMAGE_META_PATTERNS: readonly RegExp[] = [
  // Identificação de imagem
  /não sei quem/i, /não consigo identificar/i, /não posso identificar/i,
  /não conheço quem/i, /não tenho como (saber|identificar)/i,
  /sem (mais )?contexto/i, /pela imagem/i, /na (foto|imagem|foto)/i,
  /no print/i, /vejo (na|uma|um)/i,
  // Introduções de lista
  /aqui estão/i, /aqui vão/i, /segue(m)? (as|três)/i,
  /sugestões de resposta/i, /com prazer/i,
  /baseado (na|no|nessa|neste)/i, /analisando/i, /veja (as|os)/i,
  /^\d+\.\s*(opção|sugestão)/i,
  // Frases de transição do GPT
  /mas vamos lá/i, /dito isso/i, /sendo assim/i, /nesse caso/i,
  /claro[!,]?\s/i, /certamente/i, /entendido/i,
  /posso (tentar|sugerir|ajudar)/i, /vou (tentar|sugerir)/i,
];

export const TEXT_META_PATTERNS: readonly RegExp[] = [
  /não sei quem/i, /não consigo identificar/i, /não posso identificar/i,
  /aqui estão/i, /aqui vão/i, /segue(m)? (as|três)/i,
  /sugestões de resposta/i, /com prazer/i,
  /baseado (na|no|nessa|neste)/i, /analisando/i, /veja (as|os)/i,
  /^\d+\.\s*(opção|sugestão)/i,
  /mas vamos lá/i, /dito isso/i, /sendo assim/i,
  /claro[!,]?\s/i, /certamente/i, /entendido/i,
  /posso (tentar|sugerir|ajudar)/i, /vou (tentar|sugerir)/i,
];

// Linhas que terminam com ":" são sempre introduções do modelo.
const endsWithColon = (line: string) => line.trimEnd().endsWith(":");

/**
 * Devolve exatamente 3 sugestões, ou null se o modelo não produziu 3 linhas válidas.
 * Nunca completa com respostas prontas: quem chama decide como tratar a falha.
 */
export function parseSuggestions(raw: string | null | undefined, metaPatterns: readonly RegExp[]): string[] | null {
  if (!raw) return null;
  const suggestions = raw
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/^\d+[\.\)]\s*/, "")
        // título em negrito antes dos bullets — senão o "*" do bullet quebra o "**...**"
        .replace(/^\*\*.*?\*\*:?\s*/, "")
        .replace(/^[\.\-\*•]\s*/, "")
        .trim()
    )
    .filter((line) => line.length > 4)
    .filter((line) => !metaPatterns.some((p) => p.test(line)))
    .filter((line) => !endsWithColon(line))
    .slice(0, 3);
  return suggestions.length === 3 ? suggestions : null;
}
