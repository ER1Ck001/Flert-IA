"use client";

import * as React from "react";
import { LazyMotion, m } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { SPRING } from "@/lib/motion";

// layoutId (indicador deslizante) precisa das features de layout (domMax). Elas vêm sob demanda,
// fora do bundle inicial; até carregarem, o indicador aparece sem animar a troca.
const loadDomMax = () => import("@/components/motion/dom-max").then((mod) => mod.default);

export interface ToneOption<V extends string = string> {
  value: V;
  label: string;
  icon?: LucideIcon;
}

export interface ToneChipGroupProps<V extends string = string> {
  value: V;
  onChange: (value: V) => void;
  options: readonly ToneOption<V>[];
  /** Rótulo acessível do grupo. */
  label: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Grupo de chips de tom com semântica de radiogroup:
 * roving tabindex, setas/Home/End selecionam e movem o foco.
 * `onChange` recebe exatamente o `value` da opção (chave da API).
 */
export function ToneChipGroup<V extends string = string>({
  value,
  onChange,
  options,
  label,
  className,
  disabled,
}: ToneChipGroupProps<V>) {
  const indicatorId = React.useId();
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = options.findIndex((o) => o.value === value);
  const focusIndex = selectedIndex >= 0 ? selectedIndex : 0;

  const select = (index: number) => {
    const opt = options[index];
    if (!opt) return;
    refs.current[index]?.focus();
    refs.current[index]?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    if (opt.value !== value) onChange(opt.value);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = options.length - 1;
    let next: number | null = null;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = index === last ? 0 : index + 1;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        next = index === 0 ? last : index - 1;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = last;
        break;
    }
    if (next !== null) {
      e.preventDefault();
      select(next);
    }
  };

  return (
    <div
      className={cn(
        "relative -mx-4 sm:mx-0",
        // Fade nas bordas quando há rolagem horizontal no mobile.
        "[mask-image:linear-gradient(to_right,transparent,#000_16px,#000_calc(100%-16px),transparent)] sm:[mask-image:none]",
        className
      )}
    >
      <LazyMotion features={loadDomMax}>
        <div
          role="radiogroup"
          aria-label={label}
          aria-disabled={disabled || undefined}
          className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {options.map((opt, i) => {
            const checked = opt.value === value;
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                type="button"
                role="radio"
                aria-checked={checked}
                tabIndex={i === focusIndex ? 0 : -1}
                disabled={disabled}
                onClick={() => select(i)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className={cn(
                  "relative inline-flex h-11 shrink-0 snap-start items-center gap-2 rounded-full border px-4 text-sm font-medium",
                  "transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  checked
                    ? "border-transparent text-text"
                    : "border-border bg-surface-2 text-text-2 hover:border-border-strong hover:text-text"
                )}
              >
                {checked && (
                  <m.span
                    layoutId={`tone-indicator-${indicatorId}`}
                    transition={SPRING}
                    aria-hidden
                    className="border-signal absolute inset-0 rounded-full shadow-glow-violet"
                  />
                )}
                {Icon && <Icon className="relative h-4 w-4" aria-hidden />}
                <span className="relative">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </LazyMotion>
    </div>
  );
}
