"use client";

import * as React from "react";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { cardVariants } from "@/components/ui/card";

export interface ModeCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  className?: string;
}

/** Cartão clicável de escolha de modo (hub do /analyze e sub-opções). */
export function ModeCard({ icon: Icon, title, description, onClick, className }: ModeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        cardVariants({ variant: "interactive" }),
        "group flex h-full min-h-[44px] w-full flex-col items-start gap-3 p-5 text-left active:scale-[.99]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        className
      )}
    >
      <span
        aria-hidden
        className="flex h-11 w-11 items-center justify-center rounded-md bg-violet-500/15 text-violet-400"
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="font-display text-h3 text-text">{title}</span>
      <span className="flex-1 text-sm text-text-2">{description}</span>
      <ArrowRight
        aria-hidden
        className="h-4 w-4 text-text-2 transition-transform duration-200 ease-out group-hover:translate-x-1 group-hover:text-violet-400 motion-reduce:transition-none"
      />
    </button>
  );
}
