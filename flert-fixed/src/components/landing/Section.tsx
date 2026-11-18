import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionProps {
  id: string;
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/** Seção abaixo da dobra: heading h2 + content-visibility:auto para adiar a renderização. */
export function Section({ id, eyebrow, title, description, children, className }: SectionProps) {
  const titleId = `${id}-title`;
  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className={cn(
        "scroll-mt-20 py-16 [contain-intrinsic-size:auto_720px] [content-visibility:auto] sm:py-20",
        className
      )}
    >
      <div className="mx-auto max-w-site px-4 sm:px-6">
        <div className="mb-8 max-w-2xl sm:mb-10">
          {eyebrow && <p className="mb-2 text-caption uppercase text-violet-400">{eyebrow}</p>}
          <h2 id={titleId} className="font-display text-h2 text-text">
            {title}
          </h2>
          {description && <p className="mt-3 text-body text-text-2">{description}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}
