"use client";

import { m, useReducedMotion, type Variants } from "framer-motion";
import { Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getToneLabel } from "@/components/analyze/tones";
import { DEMO_SCENARIOS } from "./demo-data";

// Prévia do hero: a mesma conversa FICTÍCIA da demonstração interativa, o tom escolhido e as
// 3 sugestões desse tom. Tudo estático (demo-data.ts) — nada vem da IA nem de usuários reais.
const scenario = DEMO_SCENARIOS.find((s) => s.id === "conversa") ?? DEMO_SCENARIOS[0];
const TONE = "funny" as const;
const suggestions = scenario.suggestions[TONE] ?? [];

const ease = [0.16, 1, 0.3, 1] as const;

export function HeroPreview() {
  const reduce = useReducedMotion();
  // Sequência: mensagens → faísca + tom → sugestões. Com "reduzir movimento", só opacidade.
  const rise = (delay: number): Variants => ({
    hidden: { opacity: 0, y: reduce ? 0 : 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease, delay } },
  });

  return (
    <m.div
      role="img"
      aria-label="Exemplo ilustrativo: uma conversa, o tom Engraçado escolhido e três sugestões de resposta"
      initial="hidden"
      animate="show"
      className="relative mx-auto w-full max-w-sm"
    >
      {/* Halo suave atrás do cartão */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[40px] bg-signal opacity-20 blur-3xl"
      />

      <div aria-hidden className="rounded-2xl border border-border bg-surface p-4 shadow-2 sm:p-5">
        {/* Cabeçalho do "print" */}
        <div className="flex items-center gap-3 border-b border-border pb-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/40 to-pink-500/40 text-sm font-semibold text-text">
            A
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-text">Alex</p>
            <p className="truncate text-caption text-text-2">{scenario.label}</p>
          </div>
          <Badge variant="neutral" className="shrink-0 px-2 py-0.5 text-[11px] font-medium leading-4">
            Exemplo ilustrativo
          </Badge>
        </div>

        {/* Mensagens recebidas */}
        <div className="space-y-2 pt-4">
          {scenario.messages.map((msg, i) => (
            <m.p
              key={msg.text}
              variants={rise(0.15 + i * 0.25)}
              className="w-fit max-w-[85%] rounded-2xl rounded-bl-md bg-surface-2 px-3.5 py-2.5 text-sm leading-snug text-text"
            >
              {msg.text}
            </m.p>
          ))}
        </div>

        {/* Faísca + tom escolhido */}
        <m.div variants={rise(0.75)} className="my-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/40 bg-violet-500/10 py-1 pl-1.5 pr-3 text-caption text-text">
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none" className="motion-safe:animate-spark">
              <defs>
                <linearGradient id="hero-preview-spark" x1="6" y1="6" x2="26" y2="26" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#8B5CF6" />
                  <stop offset=".55" stopColor="#FF3D8B" />
                  <stop offset="1" stopColor="#FF7A59" />
                </linearGradient>
              </defs>
              <path d="M16 4 L19 13 L28 16 L19 19 L16 28 L13 19 L4 16 L13 13 Z" fill="url(#hero-preview-spark)" />
            </svg>
            <span className="text-text-2">Tom:</span>
            <span className="font-semibold">{getToneLabel(TONE)}</span>
          </span>
          <span className="h-px flex-1 bg-border" />
        </m.div>

        {/* 3 sugestões */}
        <ol className="space-y-2">
          {suggestions.map((text, i) => (
            <m.li
              key={text}
              variants={rise(1 + i * 0.18)}
              className={
                i === 0
                  ? "border-signal flex items-start gap-3 rounded-lg px-3 py-3"
                  : "flex items-start gap-3 rounded-lg border border-border bg-surface px-3 py-3"
              }
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-caption text-violet-400">
                {i + 1}
              </span>
              <span className="flex-1 text-sm leading-snug text-text">{text}</span>
              <Copy className={i === 0 ? "mt-0.5 h-4 w-4 shrink-0 text-pink-400" : "mt-0.5 h-4 w-4 shrink-0 text-text-3"} />
            </m.li>
          ))}
        </ol>
      </div>
    </m.div>
  );
}
