"use client";

import * as React from "react";
import { m, useReducedMotion } from "framer-motion";
import { AlertTriangle, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { stagger, useMotionSafe } from "@/lib/motion";
import { FaiscaLoader } from "@/components/ui/faisca-loader";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { SuggestionCard } from "./SuggestionCard";

export interface ResultsPanelProps {
  loading: boolean;
  suggestions: string[];
  copiedIndex: number | null;
  onCopy: (text: string, index: number) => void;
  /** Mensagem de erro da última geração (ex.: falha da IA — já diz se a cota foi descontada). */
  error?: string | null;
  /** Repete a última geração com os mesmos dados. */
  onRetry?: () => void;
  className?: string;
}

/** Área de resultado: loader enquanto gera, depois as 3 sugestões. Região aria-live sempre montada. */
export function ResultsPanel({ loading, suggestions, copiedIndex, onCopy, error, onRetry, className }: ResultsPanelProps) {
  const ref = React.useRef<HTMLElement>(null);
  const prefersReduced = useReducedMotion();
  const listVariants = useMotionSafe(stagger(0.06));
  const hasResults = suggestions.length > 0;

  React.useEffect(() => {
    if (!loading && !hasResults && !error) return;
    ref.current?.scrollIntoView?.({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
  }, [loading, hasResults, error, prefersReduced]);

  return (
    <section
      ref={ref}
      aria-live="polite"
      aria-busy={loading || undefined}
      aria-label="Resultado"
      className={cn("scroll-mt-24", (loading || hasResults || error) && "border-t border-border pt-6", className)}
    >
      {!loading && error && (
        <div role="alert" className="flex flex-col gap-3 rounded-lg border border-danger/30 bg-danger/10 p-4 sm:flex-row sm:items-start">
          <AlertTriangle className="h-5 w-5 shrink-0 text-danger" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-text">Não foi possível gerar as sugestões</p>
            <p className="mt-1 text-sm text-text-2">{error}</p>
          </div>
          {onRetry && (
            <Button
              variant="secondary"
              className="shrink-0"
              leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />}
              onClick={onRetry}
            >
              Tentar novamente
            </Button>
          )}
        </div>
      )}
      {loading ? (
        <div className="space-y-3">
          <FaiscaLoader />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : hasResults ? (
        <>
          <div className="mb-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <Sparkles className="h-4 w-4 self-center text-pink-400" aria-hidden />
            <h2 className="font-display text-h3 text-text">Sugestões</h2>
            <p className="text-sm text-text-2">escolha uma ou adapte</p>
          </div>
          <m.ol
            aria-label="Sugestões geradas"
            className="space-y-3"
            variants={listVariants}
            initial="hidden"
            animate="show"
          >
            {suggestions.map((s, i) => (
              <SuggestionCard key={i} index={i} text={s} copied={copiedIndex === i} onCopy={() => onCopy(s, i)} />
            ))}
          </m.ol>
        </>
      ) : null}
    </section>
  );
}
