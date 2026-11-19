// Geração de sugestões com a OpenAI (somente servidor).

import OpenAI from "openai";
import { IMAGE_META_PATTERNS, TEXT_META_PATTERNS, parseSuggestions } from "@/lib/ai/parse-suggestions";
import { errorMessage } from "@/lib/http";
import {
  IMAGE_SYSTEM_PROMPT,
  TEXT_SYSTEM_PROMPT,
  buildImageUserText,
  buildTextUserContent,
  type TextMode,
} from "@/lib/ai/prompts";

/** Timeout de cada requisição ao SDK (o SDK aplica de novo a cada retry). */
export const OPENAI_REQUEST_TIMEOUT_MS = 30_000;
/** Retries automáticos do SDK (cada retry pode ser cobrado). */
export const OPENAI_MAX_RETRIES = 1;
/**
 * Prazo total da geração, somando tentativas e retries do SDK. As rotas de análise têm
 * maxDuration = 60 s: 45 s de IA deixam ~15 s para sessão, plano, cota e gravação, e a rota
 * sempre responde (e libera a cota) antes de a plataforma matar a função.
 */
export const OPENAI_DEADLINE_MS = 45_000;

let client: OpenAI | null = null;

/** Criado sob demanda: importar o módulo não exige OPENAI_API_KEY (o build não quebra). */
function getOpenAI(): OpenAI {
  // timeout curto e 1 retry: cada retry pode ser cobrado, e a função serverless tem tempo limitado.
  client ??= new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: OPENAI_REQUEST_TIMEOUT_MS,
    maxRetries: OPENAI_MAX_RETRIES,
  });
  return client;
}

class DeadlineExceeded extends Error {
  constructor() {
    super("OpenAI deadline exceeded");
    this.name = "DeadlineExceeded";
  }
}

export function getModel(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o";
}

export type GenerateInput =
  | { kind: "image"; imageUrl: string; style?: string; context?: string }
  | { kind: "text"; mode: TextMode; style?: string; context: string };

export type GenerateResult =
  | { ok: true; suggestions: string[] }
  | { ok: false; reason: "openai_error" | "invalid_output" };

export async function generateSuggestions(input: GenerateInput): Promise<GenerateResult> {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] =
    input.kind === "image"
      ? [
          { role: "system", content: IMAGE_SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: input.imageUrl } },
              { type: "text", text: buildImageUserText(input.style, input.context) },
            ],
          },
        ]
      : [
          { role: "system", content: TEXT_SYSTEM_PROMPT },
          { role: "user", content: buildTextUserContent(input.mode, input.style, input.context) },
        ];

  const patterns = input.kind === "image" ? IMAGE_META_PATTERNS : TEXT_META_PATTERNS;

  // Prazo único para todas as tentativas: o signal cancela a requisição no SDK (sem novo retry),
  // e a corrida com `expired` garante o retorno mesmo se o cliente não respeitar o signal.
  // Estourar o prazo é tratado como erro da OpenAI (openai_error → a rota libera a cota).
  const startedAt = Date.now();
  const controller = new AbortController();
  let rejectExpired: (reason: Error) => void = () => {};
  const expired = new Promise<never>((_, reject) => {
    rejectExpired = reject;
  });
  expired.catch(() => {}); // evita "unhandled rejection" quando ninguém está aguardando
  const timer = setTimeout(() => {
    controller.abort();
    rejectExpired(new DeadlineExceeded());
  }, OPENAI_DEADLINE_MS);

  try {
    // Com temperature 0.9 a saída varia: uma nova tentativa costuma resolver saídas mal formatadas.
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const remaining = OPENAI_DEADLINE_MS - (Date.now() - startedAt);
      if (remaining <= 0) break; // sem tempo para outra tentativa: mesmo resultado de saída inválida

      let raw: string | null | undefined;
      try {
        const response = await Promise.race([
          getOpenAI().chat.completions.create(
            { model: getModel(), messages, max_tokens: 700, temperature: 0.9 },
            { signal: controller.signal, timeout: Math.min(OPENAI_REQUEST_TIMEOUT_MS, remaining) }
          ),
          expired,
        ]);
        raw = response.choices[0]?.message?.content;
      } catch (error) {
        console.error("OpenAI error:", errorMessage(error));
        return { ok: false, reason: "openai_error" };
      }

      const suggestions = parseSuggestions(raw, patterns);
      if (suggestions) return { ok: true, suggestions };
    }
  } finally {
    clearTimeout(timer);
  }

  console.warn("OpenAI: saída sem 3 sugestões válidas após nova tentativa");
  return { ok: false, reason: "invalid_output" };
}

const MAX_ATTEMPTS = 2;
