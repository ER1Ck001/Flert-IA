import * as React from "react";
import { cn } from "@/lib/utils";

/** Placeholder de carregamento com shimmer (fica estático com prefers-reduced-motion). */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn(
        "rounded-md bg-surface-2 bg-[length:200%_100%] motion-safe:animate-shimmer",
        "bg-[linear-gradient(90deg,rgb(var(--surface-2))_0%,rgb(var(--surface-3))_50%,rgb(var(--surface-2))_100%)]",
        className
      )}
      {...props}
    />
  );
}
