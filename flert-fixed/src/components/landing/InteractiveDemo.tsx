"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Camera, Check, Copy, Info, MessageSquareText } from "lucide-react";
import { cn } from "@/lib/utils";
import { stagger, suggestionIn, useMotionSafe } from "@/lib/motion";
import { ToneChipGroup, type ToneOption } from "@/components/ui/tone-chip";
import { FaiscaLoader } from "@/components/ui/faisca-loader";
import {
  DEMO_LABEL,
  DEMO_LOADING_MS,
  DEMO_SCENARIOS,
  DEMO_TONES,
  type DemoScenarioId,
  type DemoToneValue,
} from "./demo-data";

const SCENARIO_OPTIONS: readonly ToneOption<DemoScenarioId>[] = [
  { value: "conversa", label: "Conversa", icon: MessageSquareText },
  { value: "story", label: "Story", icon: Camera },
];

function getScenario(id: DemoScenarioId) {
  return DEMO_SCENARIOS.find((s) => s.id === id) ?? DEMO_SCENARIOS[0];
}

/** Demonstração interativa com dados estáticos — não chama a API. */
export function InteractiveDemo() {
  const prefersReduced = useReducedMotion();
  const [scenarioId, setScenarioId] = React.useState<DemoScenarioId>("conversa");
  const [tone, setTone] = React.useState<DemoToneValue>("flirty");
  const [loading, setLoading] = React.useState(false);
  const [copied, setCopied] = React.useState<number | null>(null);
  const loadTimer = React.useRef<number | undefined>(undefined);
  const copyTimer = React.useRef<number | undefined>(undefined);

  const listVariants = useMotionSafe(stagger(0.06));
  const itemVariants = useMotionSafe(suggestionIn);

  React.useEffect(
    () => () => {
      window.clearTimeout(loadTimer.current);
      window.clearTimeout(copyTimer.current);
    },
    []
  );

  const scenario = getScenario(scenarioId);
  const toneOptions = DEMO_TONES.filter((t) => scenario.suggestions[t.value]);
  const suggestions = scenario.suggestions[tone] ?? scenario.suggestions.flirty ?? [];

  const simulate = () => {
    setCopied(null);
    window.clearTimeout(loadTimer.current);
    const ms = prefersReduced ? 0 : DEMO_LOADING_MS;
    if (ms === 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    loadTimer.current = window.setTimeout(() => setLoading(false), ms);
  };

  const onScenario = (id: DemoScenarioId) => {
    const next = getScenario(id);
    setScenarioId(id);
    if (!next.suggestions[tone]) setTone("flirty");
    simulate();
  };

  const onTone = (value: DemoToneValue) => {
    setTone(value);
    simulate();
  };

  const copy = async (text: string, index: number) => {
    try {
      if (!navigator.clipboard?.writeText) return;
      await navigator.clipboard.writeText(text);
      setCopied(index);
      window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(null), 2000);
    } catch {
      // Fallback silencioso: sem permissão de clipboard, o texto continua visível para copiar à mão.
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-8">
      {/* Contexto do exemplo */}
      <div className="rounded-xl border border-border bg-surface p-4 shadow-1 sm:p-5">
        <p className="text-caption uppercase text-text-2">{scenario.context}</p>
        {scenario.id === "story" ? (
          <div
            aria-hidden
            className="mt-4 flex aspect-[4/5] max-h-72 w-full items-end overflow-hidden rounded-lg bg-[linear-gradient(180deg,#2A1B4D_0%,#7C3AED_45%,#FF7A59_80%,#FFB37A_100%)] p-4"
          >
            <span className="rounded-full bg-black/45 px-3 py-1 text-sm font-medium text-white">
              {scenario.messages[0]?.text}
            </span>
          </div>
        ) : (
          <ul className="mt-4 space-y-2" aria-label="Mensagens recebidas no exemplo">
            {scenario.messages.map((m) => (
              <li
                key={m.text}
                className="max-w-[85%] rounded-2xl rounded-bl-md bg-surface-2 px-4 py-2.5 text-sm text-text"
              >
                {m.text}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Controles + resultado */}
      <div className="min-w-0 space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-text">
            Cenário
          </p>
          <ToneChipGroup label="Cenário do exemplo" options={SCENARIO_OPTIONS} value={scenarioId} onChange={onScenario} />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-text">Tom da resposta</p>
          <ToneChipGroup label="Tom da resposta" options={toneOptions} value={tone} onChange={onTone} />
        </div>

        <div aria-live="polite" className="min-h-[15rem]">
          {loading ? (
            <FaiscaLoader stepMs={300} />
          ) : (
            <motion.ol
              key={`${scenarioId}-${tone}`}
              aria-label="Sugestões de exemplo"
              className="space-y-3"
              variants={listVariants}
              initial="hidden"
              animate="show"
            >
              {suggestions.map((text, i) => {
                const n = i + 1;
                const isCopied = copied === i;
                return (
                  <motion.li
                    key={text}
                    variants={itemVariants}
                    className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4"
                  >
                    <span
                      aria-hidden
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-caption text-violet-400"
                    >
                      {n}
                    </span>
                    <p className="min-w-0 flex-1 text-body text-text">{text}</p>
                    <button
                      type="button"
                      onClick={() => copy(text, i)}
                      aria-label={isCopied ? `Sugestão ${n} copiada` : `Copiar sugestão ${n}`}
                      className={cn(
                        "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm font-medium",
                        "transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
                        isCopied ? "text-success" : "text-text-2 hover:bg-surface-2 hover:text-text"
                      )}
                    >
                      {isCopied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
                      <span className="hidden sm:inline">{isCopied ? "Copiado" : "Copiar"}</span>
                    </button>
                  </motion.li>
                );
              })}
            </motion.ol>
          )}
        </div>

        <p className="flex items-start gap-2 text-sm text-text-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{DEMO_LABEL}</span>
        </p>
      </div>
    </div>
  );
}
