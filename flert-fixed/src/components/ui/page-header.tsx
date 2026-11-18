"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  /** Foca o h1 ao montar (troca de tela sem mudar de rota, para o foco não se perder). */
  autoFocusTitle?: boolean;
}

export function PageHeader({ eyebrow, title, description, actions, className, autoFocusTitle }: PageHeaderProps) {
  const titleRef = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => {
    if (autoFocusTitle) titleRef.current?.focus({ preventScroll: false });
    // Só na montagem.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <header className={cn("mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-caption uppercase text-violet-400">{eyebrow}</p>}
        <h1
          ref={titleRef}
          tabIndex={autoFocusTitle ? -1 : undefined}
          className="font-display text-h1 text-text focus:outline-none"
        >
          {title}
        </h1>
        {description && <p className="mt-2 max-w-prose text-body text-text-2">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
