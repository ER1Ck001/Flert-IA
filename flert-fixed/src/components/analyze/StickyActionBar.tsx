"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface StickyActionBarProps {
  label: string;
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
  className?: string;
}

/**
 * Único botão "Gerar" da view. Abaixo de lg fica fixo acima da nav inferior (.glass,
 * `bottom: var(--bottom-ui)`); em lg+ volta ao fluxo normal no lugar onde foi colocado.
 * Quem usa deve reservar espaço no fim da view no mobile (ex.: `pb-24 lg:pb-0`).
 */
export function StickyActionBar({ label, onClick, disabled, loading, className }: StickyActionBarProps) {
  return (
    <div
      className={cn(
        "glass fixed inset-x-0 bottom-[var(--bottom-ui)] z-30 border-t border-border px-4 py-3",
        "lg:static lg:z-auto lg:border-0 lg:bg-transparent lg:p-0 lg:[-webkit-backdrop-filter:none] lg:[backdrop-filter:none]",
        className
      )}
    >
      <Button
        variant="signal"
        size="lg"
        className="w-full"
        disabled={disabled}
        loading={loading}
        leftIcon={<Sparkles className="h-4 w-4" aria-hidden />}
        onClick={onClick}
      >
        {loading ? "Gerando..." : label}
      </Button>
    </div>
  );
}
