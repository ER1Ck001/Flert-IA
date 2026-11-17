import { beforeEach, describe, expect, it, vi } from "vitest";

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("openai", () => ({
  default: class {
    chat = { completions: { create } };
  },
}));

import { generateSuggestions } from "@/lib/ai/generate";
import { IMAGE_SYSTEM_PROMPT, TEXT_SYSTEM_PROMPT } from "@/lib/ai/prompts";

const reply = (content: string | null) => create.mockResolvedValue({ choices: [{ message: { content } }] });

beforeEach(() => {
  create.mockReset();
  vi.stubEnv("OPENAI_MODEL", "");
});

describe("generateSuggestions", () => {
  it("usa OPENAI_MODEL quando definido e gpt-4o como padrão", async () => {
    reply("resposta boa um\nresposta boa dois\nresposta boa três");
    await generateSuggestions({ kind: "text", mode: "start", style: "funny", context: "ela gosta de café" });
    expect(create.mock.calls[0][0].model).toBe("gpt-4o");

    vi.stubEnv("OPENAI_MODEL", "gpt-test");
    await generateSuggestions({ kind: "text", mode: "start", style: "funny", context: "ela gosta de café" });
    expect(create.mock.calls[1][0].model).toBe("gpt-test");
  });

  it("imagem: envia a imagem e o prompt de sistema de imagem", async () => {
    reply("resposta boa um\nresposta boa dois\nresposta boa três");
    const r = await generateSuggestions({ kind: "image", imageUrl: "data:image/png;base64,AAA", style: "witty" });
    expect(r).toEqual({ ok: true, suggestions: ["resposta boa um", "resposta boa dois", "resposta boa três"] });

    const { messages, max_tokens, temperature } = create.mock.calls[0][0];
    expect(messages[0]).toEqual({ role: "system", content: IMAGE_SYSTEM_PROMPT });
    expect(messages[1].content[0]).toEqual({ type: "image_url", image_url: { url: "data:image/png;base64,AAA" } });
    expect(max_tokens).toBe(700);
    expect(temperature).toBe(0.9);
  });

  it("texto: usa o prompt de texto e inclui o contexto", async () => {
    reply("resposta boa um\nresposta boa dois\nresposta boa três");
    await generateSuggestions({ kind: "text", mode: "situation", style: "serious", context: "ela sumiu há 2 dias" });
    const { messages } = create.mock.calls[0][0];
    expect(messages[0]).toEqual({ role: "system", content: TEXT_SYSTEM_PROMPT });
    expect(messages[1].content).toContain("ela sumiu há 2 dias");
  });

  it("estilo desconhecido cai em 'flirty'", async () => {
    reply("resposta boa um\nresposta boa dois\nresposta boa três");
    await generateSuggestions({ kind: "text", mode: "start", style: "hack", context: "x" });
    expect(create.mock.calls[0][0].messages[1].content).toContain("Tom: flertando com leveza");
  });

  it("saída inválida → tenta de novo 1 vez; persistindo → invalid_output (nunca respostas inventadas)", async () => {
    reply("Aqui estão:\nsó uma");
    expect(await generateSuggestions({ kind: "text", mode: "start", style: "flirty", context: "x" })).toEqual({
      ok: false,
      reason: "invalid_output",
    });
    expect(create).toHaveBeenCalledTimes(2);

    create.mockReset();
    reply(null);
    expect(await generateSuggestions({ kind: "text", mode: "start", style: "flirty", context: "x" })).toMatchObject({
      reason: "invalid_output",
    });
  });

  it("saída inválida na 1ª e válida na 2ª → sucesso", async () => {
    create
      .mockResolvedValueOnce({ choices: [{ message: { content: "Claro, aqui vão:" } }] })
      .mockResolvedValueOnce({ choices: [{ message: { content: "resposta boa um\nresposta boa dois\nresposta boa três" } }] });
    const r = await generateSuggestions({ kind: "text", mode: "start", style: "flirty", context: "x" });
    expect(r).toEqual({ ok: true, suggestions: ["resposta boa um", "resposta boa dois", "resposta boa três"] });
  });

  it("erro da OpenAI → openai_error, sem lançar e sem retry manual (o SDK já tem maxRetries)", async () => {
    create.mockRejectedValue(new Error("timeout"));
    expect(await generateSuggestions({ kind: "image", imageUrl: "data:image/png;base64,AAA", style: "flirty" })).toEqual({
      ok: false,
      reason: "openai_error",
    });
    expect(create).toHaveBeenCalledTimes(1);
  });
});
