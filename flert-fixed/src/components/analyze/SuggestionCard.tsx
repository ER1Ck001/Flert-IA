"use client";

import * as React from "react";
import { m, useReducedMotion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { suggestionIn, useMotionSafe } from "@/lib/motion";

export interface SuggestionCardProps {
  /** Índice 0-based; exibido como N = index + 1. */
  index: number;
  text: string;
  /** Controlado pelo pai. Se omitido, o card controla o "Copiado" sozinho. */
  copied?: boolean;
  /** Se omitido, o card copia `text` para a área de transferência. */
  onCopy?: (text: string) => void;
  className?: string;
}

/** Sugestão numerada com botão de copiar. Deve ficar dentro de um <ol>/<ul>. */
export function SuggestionCard({ index, text, copied, onCopy, className }: SuggestionCardProps) {
  const n = index + 1;
  const prefersReduced = useReducedMotion();
  const variants = useMotionSafe(suggestionIn);
  const [localCopied, setLocalCopied] = React.useState(false);
  const timer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  const isCopied = copied ?? localCopied;

  const handleClick = async () => {
    if (onCopy) {
      onCopy(text);
    } else {
      try {
        if (!navigator.clipboard?.writeText) return;
        await navigator.clipboard.writeText(text);
      } catch {
        return; // Sem permissão: o texto continua visível para copiar à mão.
      }
    }
    if (copied === undefined) {
      setLocalCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setLocalCopied(false), 2000);
    }
  };

  return (
    <m.li
      variants={variants}
      className={cn("relative flex items-start gap-3 rounded-lg border border-border bg-surface p-4 shadow-1", className)}
    >
      {/* Borda signal que aparece uma vez (600ms) ao chegar a sugestão. */}
      {!prefersReduced && (
        <m.span
          aria-hidden
          className="border-signal pointer-events-none absolute -inset-px rounded-lg"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.2 + index * 0.06, ease: "easeOut" }}
        />
      )}
      <span
        aria-hidden
        className="relative mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-sm font-semibold text-violet-400"
      >
        {n}
      </span>
      <p className="relative min-w-0 flex-1 break-words text-body text-text">{text}</p>
      <button
        type="button"
        onClick={handleClick}
        aria-label={isCopied ? `Copiado (sugestão ${n})` : `Copiar sugestão ${n}`}
        className={cn(
          "relative inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium",
          "transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
          isCopied ? "text-success" : "text-text-2 hover:bg-surface-2 hover:text-text"
        )}
      >
        {isCopied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
        <span className="hidden sm:inline">{isCopied ? "Copiado" : "Copiar"}</span>
      </button>
    </m.li>
  );
}
