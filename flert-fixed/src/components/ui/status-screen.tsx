import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatusScreenProps {
  icon: LucideIcon;
  /** "danger" para erros; "neutral" para 404 e avisos. */
  tone?: "neutral" | "danger";
  title: string;
  description: React.ReactNode;
  actions: React.ReactNode;
  /** role="alert" para erros inesperados (anuncia ao montar). */
  role?: "alert" | "status";
  className?: string;
}

/** Bloco central de 404/erro: ícone, h1, descrição e ações. Usado por not-found e error. */
export function StatusScreen({ icon: Icon, tone = "neutral", title, description, actions, role, className }: StatusScreenProps) {
  return (
    <div
      role={role}
      className={cn(
        "mx-auto flex w-full max-w-md flex-col items-center gap-4 rounded-xl border border-border bg-surface px-6 py-10 text-center shadow-1",
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full",
          tone === "danger" ? "bg-danger/15 text-danger" : "bg-violet-500/15 text-violet-400"
        )}
      >
        <Icon className="h-7 w-7" />
      </span>
      <h1 className="font-display text-h2 text-text">{title}</h1>
      <p className="text-body text-text-2">{description}</p>
      <div className="mt-2 flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-center">{actions}</div>
    </div>
  );
}
