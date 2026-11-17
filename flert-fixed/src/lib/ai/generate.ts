// Geração de sugestões com a OpenAI (somente servidor).

import OpenAI from "openai";
import { IMAGE_META_PATTERNS, TEXT_META_PATTERNS, parseSuggestions } from "@/lib/ai/parse-suggestions";
import {
  IMAGE_SYSTEM_PROMPT,
  TEXT_SYSTEM_PROMPT,
  buildImageUserText,
  buildTextUserContent,
  type TextMode,
} from "@/lib/ai/prompts";

let client: OpenAI | null = null;

/** Criado sob demanda: importar o módulo não exige OPENAI_API_KEY (o build não quebra). */
function getOpenAI(): OpenAI {
  // timeout curto e 1 retry: cada retry pode ser cobrado, e a função serverless tem tempo limitado.
  client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 30_000, maxRetries: 1 });
  return client;
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

  // Com temperature 0.9 a saída varia: uma nova tentativa costuma resolver saídas mal formatadas.
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let raw: string | null | undefined;
    try {
      const response = await getOpenAI().chat.completions.create({
        model: getModel(),
        messages,
        max_tokens: 700,
        temperature: 0.9,
      });
      raw = response.choices[0]?.message?.content;
    } catch (error) {
      console.error("OpenAI error:", error instanceof Error ? error.message : "unknown");
      return { ok: false, reason: "openai_error" };
    }

    const suggestions = parseSuggestions(raw, patterns);
    if (suggestions) return { ok: true, suggestions };
  }

  console.warn("OpenAI: saída sem 3 sugestões válidas após nova tentativa");
  return { ok: false, reason: "invalid_output" };
}

const MAX_ATTEMPTS = 2;
