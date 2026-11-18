import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

// Tarefa 9 (M6): prazo total da OpenAI abaixo do maxDuration das rotas de análise.
const { create, ctorOptions } = vi.hoisted(() => ({ create: vi.fn(), ctorOptions: [] as unknown[] }));
vi.mock("openai", () => ({
  default: class {
    constructor(opts: unknown) {
      ctorOptions.push(opts);
    }
    chat = { completions: { create } };
  },
}));

import {
  OPENAI_DEADLINE_MS,
  OPENAI_MAX_RETRIES,
  OPENAI_REQUEST_TIMEOUT_MS,
  generateSuggestions,
} from "@/lib/ai/generate";

const VALID = { choices: [{ message: { content: "resposta boa um\nresposta boa dois\nresposta boa três" } }] };
const INVALID = { choices: [{ message: { content: "só uma" } }] };
const input = { kind: "text", mode: "start", style: "flirty", context: "x" } as const;

/** Simula uma chamada travada: só termina quando o signal aborta (como o SDK faz). */
const hangUntilAborted = (_body: unknown, opts?: { signal?: AbortSignal }) =>
  new Promise((_, reject) => {
    opts?.signal?.addEventListener("abort", () => reject(new Error("Request was aborted.")));
  });

const root = path.resolve(__dirname, "../..");
const maxDurationOf = (route: string) =>
  Number(readFileSync(path.join(root, route), "utf8").match(/export const maxDuration = (\d+)/)?.[1]);

beforeEach(() => {
  create.mockReset();
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("prazo total da OpenAI", () => {
  it("o prazo cabe no maxDuration das duas rotas, com folga para banco e resposta", () => {
    for (const route of ["src/app/api/analyze/route.ts", "src/app/api/analyze/text/route.ts"]) {
      const seconds = maxDurationOf(route);
      expect(seconds).toBe(60);
      expect(OPENAI_DEADLINE_MS + 10_000).toBeLessThanOrEqual(seconds * 1000);
    }
    expect(OPENAI_REQUEST_TIMEOUT_MS).toBeLessThanOrEqual(OPENAI_DEADLINE_MS);
  });

  it("o cliente mantém o timeout por requisição e 1 retry do SDK", async () => {
    create.mockResolvedValue(VALID);
    await generateSuggestions(input);
    expect(ctorOptions.at(-1)).toMatchObject({ timeout: OPENAI_REQUEST_TIMEOUT_MS, maxRetries: OPENAI_MAX_RETRIES });
    expect(OPENAI_MAX_RETRIES).toBe(1);
  });

  it("cada chamada recebe um AbortSignal compartilhado e timeout ≤ tempo restante", async () => {
    create.mockResolvedValue(VALID);
    await generateSuggestions(input);
    const opts = create.mock.calls[0][1];
    expect(opts.signal).toBeInstanceOf(AbortSignal);
    expect(opts.timeout).toBeLessThanOrEqual(OPENAI_REQUEST_TIMEOUT_MS);
  });

  it("OpenAI travada (incluindo os retries do SDK) → openai_error ao atingir o prazo, sem esperar o maxDuration", async () => {
    create.mockImplementation(hangUntilAborted);
    const p = generateSuggestions(input);
    let settled = false;
    void p.then(() => (settled = true));

    await vi.advanceTimersByTimeAsync(OPENAI_DEADLINE_MS - 1);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await p).toEqual({ ok: false, reason: "openai_error" });
  });

  it("mesmo que o cliente ignore o signal, a função retorna no prazo", async () => {
    create.mockImplementation(() => new Promise(() => {})); // nunca resolve
    const p = generateSuggestions(input);
    await vi.advanceTimersByTimeAsync(OPENAI_DEADLINE_MS);
    expect(await p).toEqual({ ok: false, reason: "openai_error" });
  });

  it("o prazo vale para as duas tentativas somadas: a 2ª tentativa aborta no prazo total", async () => {
    create.mockImplementationOnce(async () => {
      await new Promise((r) => setTimeout(r, OPENAI_DEADLINE_MS - 1000));
      return INVALID;
    });
    create.mockImplementationOnce(hangUntilAborted);
    const p = generateSuggestions(input);
    await vi.advanceTimersByTimeAsync(OPENAI_DEADLINE_MS - 1000);
    // 2ª tentativa recebe só o tempo que sobra.
    expect(create).toHaveBeenCalledTimes(2);
    expect(create.mock.calls[1][1].timeout).toBeLessThanOrEqual(1000);
    await vi.advanceTimersByTimeAsync(1000);
    expect(await p).toEqual({ ok: false, reason: "openai_error" });
  });

  it("1ª chamada que passa do prazo é abortada → openai_error, sem 2ª chamada", async () => {
    create.mockImplementationOnce(async () => {
      await new Promise((r) => setTimeout(r, OPENAI_DEADLINE_MS + 5));
      return INVALID;
    });
    const p = generateSuggestions(input);
    await vi.advanceTimersByTimeAsync(OPENAI_DEADLINE_MS + 5);
    // A 1ª chamada estourou o prazo: vira openai_error (abortada), sem 2ª chamada.
    expect(await p).toEqual({ ok: false, reason: "openai_error" });
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("sucesso não deixa timer pendente", async () => {
    create.mockResolvedValue(VALID);
    await generateSuggestions(input);
    expect(vi.getTimerCount()).toBe(0);
  });
});
