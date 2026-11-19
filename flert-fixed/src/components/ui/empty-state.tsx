import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 text-center",
        className
      )}
    >
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/15 text-violet-400">
          <Icon className="h-6 w-6" aria-hidden />
        </div>
      )}
      <h3 className="font-display text-h3 text-text">{title}</h3>
      {description && <p className="max-w-sm text-sm text-text-2">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
