"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { stagger, useMotionSafe } from "@/lib/motion";
import { FaiscaLoader } from "@/components/ui/faisca-loader";
import { Skeleton } from "@/components/ui/skeleton";
import { SuggestionCard } from "./SuggestionCard";

export interface ResultsPanelProps {
  loading: boolean;
  suggestions: string[];
  copiedIndex: number | null;
  onCopy: (text: string, index: number) => void;
  className?: string;
}

/** Área de resultado: loader enquanto gera, depois as 3 sugestões. Região aria-live sempre montada. */
export function ResultsPanel({ loading, suggestions, copiedIndex, onCopy, className }: ResultsPanelProps) {
  const ref = React.useRef<HTMLElement>(null);
  const prefersReduced = useReducedMotion();
  const listVariants = useMotionSafe(stagger(0.06));
  const hasResults = suggestions.length > 0;

  React.useEffect(() => {
    if (!loading && !hasResults) return;
    ref.current?.scrollIntoView?.({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
  }, [loading, hasResults, prefersReduced]);

  return (
    <section
      ref={ref}
      aria-live="polite"
      aria-busy={loading || undefined}
      aria-label="Resultado"
      className={cn("scroll-mt-24", (loading || hasResults) && "border-t border-border pt-6", className)}
    >
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
          <motion.ol
            aria-label="Sugestões geradas"
            className="space-y-3"
            variants={listVariants}
            initial="hidden"
            animate="show"
          >
            {suggestions.map((s, i) => (
              <SuggestionCard key={i} index={i} text={s} copied={copiedIndex === i} onCopy={() => onCopy(s, i)} />
            ))}
          </motion.ol>
        </>
      ) : null}
    </section>
  );
}
