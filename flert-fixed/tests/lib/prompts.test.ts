import { describe, expect, it } from "vitest";
import {
  IMAGE_STYLE_INSTRUCTIONS,
  IMAGE_SYSTEM_PROMPT,
  TEXT_MODES,
  TEXT_STYLE_INSTRUCTIONS,
  TEXT_SYSTEM_PROMPT,
  buildImageUserText,
  buildTextUserContent,
} from "@/lib/ai/prompts";
import { IMAGE_META_PATTERNS, TEXT_META_PATTERNS, parseSuggestions } from "@/lib/ai/parse-suggestions";

const TONE_KEYS = ["flirty", "funny", "casual", "witty", "serious", "pickup", "stories"];
const SYSTEM_PROMPTS = { imagem: IMAGE_SYSTEM_PROMPT, texto: TEXT_SYSTEM_PROMPT };

// Tudo o que vai para o modelo, em todas as combinações de modo e tom.
const allPrompts = (): string[] => [
  IMAGE_SYSTEM_PROMPT,
  TEXT_SYSTEM_PROMPT,
  ...TONE_KEYS.flatMap((t) => [
    buildImageUserText(t),
    buildImageUserText(t, "contexto"),
    ...TEXT_MODES.map((m) => buildTextUserContent(m, t, "contexto")),
  ]),
];

describe("persona neutra (Tarefa 8)", () => {
  const BANNED: readonly RegExp[] = [
    /homem brasileiro/i,
    /bem-sucedido com mulheres/i,
    /\bmulheres\b/i,
    /tem opções/i,
    /não está precisando/i,
    /não é uma IA/i,
    /pessoa real que viveu/i,
    /quebre o personagem/i,
    /invente uma abordagem/i,
    /psicologia da atração/i,
    /\bcerteir[ao]s?\b/i,
    /situação de flerte/i,
  ];

  it.each(BANNED.map((re) => [re.source, re] as const))("nenhum prompt contém /%s/", (_s, re) => {
    expect(allPrompts().filter((p) => re.test(p))).toEqual([]);
  });

  it("a outra pessoa não tem gênero fixo nas instruções", () => {
    expect(allPrompts().filter((p) => /\b(ela|dela|ele|dele)\b/i.test(p))).toEqual([]);
  });

  it.each(Object.entries(SYSTEM_PROMPTS))("persona (%s): coach de conversa para qualquer gênero e orientação", (_k, p) => {
    expect(p).toMatch(/coach de conversa brasileiro/i);
    expect(p).toMatch(/qualquer gênero e orientação/i);
    expect(p).toMatch(/respeito/i);
    // O usuário é o autor: a IA sugere, ele escolhe, edita e envia.
    expect(p).toMatch(/escolhe, edita e envia/i);
  });

  it("imagem difícil de ler: usa o que está visível e o contexto, sem inventar nem fingir reconhecer", () => {
    expect(IMAGE_SYSTEM_PROMPT).toMatch(/o que dá para ver/i);
    expect(IMAGE_SYSTEM_PROMPT).toMatch(/não invente/i);
    expect(IMAGE_SYSTEM_PROMPT).toMatch(/não finja reconhecer/i);
    // Comentários sobre a imagem ("no print", "na foto") são descartados pelo parser.
    expect(IMAGE_SYSTEM_PROMPT).toMatch(/não comente a imagem/i);
  });
});

describe("formato e tons preservados", () => {
  it.each(Object.entries(SYSTEM_PROMPTS))("formato de saída (%s) intacto para o parser", (_k, p) => {
    expect(p).toContain("3 linhas. Só as respostas. Sem numeração, sem título, sem explicação.");
    expect(p).toContain("Cada resposta: máximo 2 frases. Na dúvida, 1 frase é melhor.");
    expect(p).toContain("As 3 devem ter abordagens completamente diferentes entre si.");
    expect(p).toMatch(/REGRAS DE SEGURANÇA/);
  });

  it.each([
    ["imagem", IMAGE_STYLE_INSTRUCTIONS],
    ["texto", TEXT_STYLE_INSTRUCTIONS],
  ] as const)("tabela de tons (%s) tem as 7 chaves, na ordem, cada uma começando com \"Tom:\"", (_k, table) => {
    expect(Object.keys(table)).toEqual(TONE_KEYS);
    for (const v of Object.values(table)) expect(v).toMatch(/^Tom: /);
    expect(table.flirty).toMatch(/^Tom: flertando com leveza/);
    expect(table.pickup).toMatch(/^Tom: cantada/);
    expect(table.stories).toMatch(/^Tom: resposta para story/);
  });

  it("cada tom pedido entra na mensagem do usuário", () => {
    for (const t of TONE_KEYS) {
      expect(buildImageUserText(t)).toContain(IMAGE_STYLE_INSTRUCTIONS[t]);
      for (const m of TEXT_MODES) expect(buildTextUserContent(m, t, "x")).toContain(TEXT_STYLE_INSTRUCTIONS[t]);
    }
  });

  it("saída no formato pedido (3 linhas, sem comentar a imagem) é aceita pelo parser", () => {
    const sample = "Esse café tem cara de domingo\nQual foi o melhor lugar da viagem?\nVocê sempre escolhe a mesa da janela?";
    expect(parseSuggestions(sample, IMAGE_META_PATTERNS)).toHaveLength(3);
    expect(parseSuggestions(sample, TEXT_META_PATTERNS)).toHaveLength(3);
  });
});
