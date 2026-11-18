import { describe, expect, it } from "vitest";
import {
  MAX_IMAGE_SIDE,
  MAX_UPLOAD_DATA_URL_CHARS,
  fitWithin,
  needsShrink,
  shrinkImageDataUrl,
} from "@/lib/image-compress";
import { MAX_IMAGE_DATA_URL_CHARS } from "@/lib/ai/run-analysis";

describe("fitWithin", () => {
  it("mantém imagens que já cabem", () => {
    expect(fitWithin(800, 600, 2048)).toEqual({ width: 800, height: 600 });
  });
  it("reduz o maior lado preservando a proporção", () => {
    expect(fitWithin(4096, 2048, 2048)).toEqual({ width: 2048, height: 1024 });
    expect(fitWithin(1170, 2532, 2048)).toEqual({ width: 946, height: 2048 });
  });
});

describe("limites", () => {
  // Vercel rejeita corpos de requisição acima de 4,5 MB (413) antes de chegar à rota.
  it("o alvo do cliente cabe no limite de corpo da Vercel com folga para o JSON", () => {
    expect(MAX_UPLOAD_DATA_URL_CHARS).toBeLessThan(4_500_000 - 10_000);
  });
  it("o alvo do cliente nunca passa do limite validado no servidor", () => {
    expect(MAX_UPLOAD_DATA_URL_CHARS).toBeLessThan(MAX_IMAGE_DATA_URL_CHARS);
  });
  it("lado máximo compatível com o que a OpenAI usa em visão (2048px)", () => {
    expect(MAX_IMAGE_SIDE).toBe(2048);
  });
  it("needsShrink só para data URLs grandes", () => {
    expect(needsShrink("data:image/png;base64,AAAA")).toBe(false);
    expect(needsShrink("data:image/png;base64," + "A".repeat(MAX_UPLOAD_DATA_URL_CHARS))).toBe(true);
  });
});

describe("shrinkImageDataUrl (sem DOM)", () => {
  it("devolve a imagem original quando já é pequena", async () => {
    const small = "data:image/png;base64,AAAA";
    await expect(shrinkImageDataUrl(small)).resolves.toBe(small);
  });
  it("sem canvas disponível devolve a original (o servidor decide)", async () => {
    const big = "data:image/png;base64," + "A".repeat(MAX_UPLOAD_DATA_URL_CHARS + 10);
    await expect(shrinkImageDataUrl(big)).resolves.toBe(big);
  });
});
