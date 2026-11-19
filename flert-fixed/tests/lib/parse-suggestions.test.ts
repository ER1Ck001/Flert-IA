import { describe, expect, it } from "vitest";
import { IMAGE_META_PATTERNS, TEXT_META_PATTERNS, parseSuggestions } from "@/lib/ai/parse-suggestions";

const P = IMAGE_META_PATTERNS;

describe("parseSuggestions", () => {
  it("resposta limpa com 3 linhas → as 3, na ordem", () => {
    expect(parseSuggestions("primeira resposta\nsegunda resposta\nterceira resposta", P)).toEqual([
      "primeira resposta",
      "segunda resposta",
      "terceira resposta",
    ]);
  });

  it("remove numeração, bullets e títulos em negrito", () => {
    const raw = "1. resposta um aqui\n2) resposta dois aqui\n- resposta três aqui";
    expect(parseSuggestions(raw, P)).toEqual(["resposta um aqui", "resposta dois aqui", "resposta três aqui"]);
    expect(parseSuggestions("**Opção A:** texto bom um\n• texto bom dois\n* texto bom três", P)).toEqual([
      "texto bom um",
      "texto bom dois",
      "texto bom três",
    ]);
  });

  it("filtra linhas de introdução do modelo e linhas terminadas em ':'", () => {
    const raw = "Aqui estão 3 sugestões:\nClaro, posso ajudar\nresposta boa um\nresposta boa dois\nVeja abaixo:\nresposta boa três";
    expect(parseSuggestions(raw, P)).toEqual(["resposta boa um", "resposta boa dois", "resposta boa três"]);
  });

  it("limita a 3 sugestões", () => {
    expect(parseSuggestions("aaaaa1\naaaaa2\naaaaa3\naaaaa4\naaaaa5", P)).toHaveLength(3);
  });

  it("menos de 3 sugestões válidas → null (sem respostas inventadas)", () => {
    expect(parseSuggestions("só uma resposta\nAqui estão:", P)).toBeNull();
    expect(parseSuggestions("", P)).toBeNull();
    expect(parseSuggestions(null, P)).toBeNull();
    expect(parseSuggestions(undefined, P)).toBeNull();
  });

  it("ignora linhas curtas, vazias e CRLF; preserva acentos e emojis", () => {
    const raw = "ok\r\n\r\nvocê é demais 😏\r\ncoração na mão ✨\r\nação e reação 🔥";
    expect(parseSuggestions(raw, P)).toEqual(["você é demais 😏", "coração na mão ✨", "ação e reação 🔥"]);
  });

  it("padrões não usam a flag /g (test() sem estado entre chamadas)", () => {
    for (const p of [...IMAGE_META_PATTERNS, ...TEXT_META_PATTERNS]) expect(p.flags).not.toContain("g");
    const raw = "Aqui estão:\nresposta boa um\nresposta boa dois\nresposta boa três";
    expect(parseSuggestions(raw, TEXT_META_PATTERNS)).toEqual(parseSuggestions(raw, TEXT_META_PATTERNS));
  });
});
