import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Superfície de vidro — use SOMENTE em camadas flutuantes (topbar, nav, sheet, barra fixa).
 * backdrop-filter é caro: no máximo 2 simultâneos na tela.
 */
const GlassCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("glass rounded-lg border border-border shadow-2", className)} {...props} />
  )
);
GlassCard.displayName = "GlassCard";

export { GlassCard };
