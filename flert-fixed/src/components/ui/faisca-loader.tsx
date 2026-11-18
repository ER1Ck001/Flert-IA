"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const FAISCA_STEPS = ["Lendo a conversa", "Ajustando o tom", "Escrevendo 3 opções"] as const;

export interface FaiscaLoaderProps {
  className?: string;
  /** Intervalo entre etapas, em ms. */
  stepMs?: number;
}

/** Loader da marca: duas mini-bolhas + estrela com "spark" e etapas rotativas. */
export function FaiscaLoader({ className, stepMs = 1400 }: FaiscaLoaderProps) {
  const [step, setStep] = React.useState(0);
  const gradId = `faisca-${React.useId().replace(/:/g, "")}`;

  React.useEffect(() => {
    const t = window.setInterval(() => setStep((s) => (s + 1) % FAISCA_STEPS.length), stepMs);
    return () => window.clearInterval(t);
  }, [stepMs]);

  return (
    <div role="status" className={cn("flex flex-col items-center gap-3 py-6 text-center", className)}>
      <svg width="56" height="56" viewBox="0 0 32 32" fill="none" aria-hidden focusable="false">
        <defs>
          <linearGradient id={gradId} x1="11" y1="11" x2="21" y2="21" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8B5CF6" />
            <stop offset=".55" stopColor="#FF3D8B" />
            <stop offset="1" stopColor="#FF7A59" />
          </linearGradient>
        </defs>
        <g className="motion-safe:animate-pulse">
          <rect x="4" y="6" width="11" height="9" rx="4" stroke="#A78BFA" strokeWidth="1.5" />
        </g>
        <g className="motion-safe:animate-pulse [animation-delay:300ms]">
          <rect x="17" y="17" width="11" height="9" rx="4" stroke="#FF5FA0" strokeWidth="1.5" />
        </g>
        <path
          className="origin-center motion-safe:animate-spark [transform-box:fill-box]"
          d="M16 11.5 L17.3 14.7 L20.5 16 L17.3 17.3 L16 20.5 L14.7 17.3 L11.5 16 L14.7 14.7 Z"
          fill={`url(#${gradId})`}
        />
      </svg>
      <p className="text-sm font-semibold text-text">A IA está pensando…</p>
      <p className="text-sm text-text-2" aria-live="off">
        {FAISCA_STEPS[step]}
      </p>
    </div>
  );
}
