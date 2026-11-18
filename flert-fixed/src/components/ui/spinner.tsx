import * as React from "react";
import { cn } from "@/lib/utils";

const SIZES = { sm: 16, md: 20, lg: 28 } as const;

export interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> {
  size?: keyof typeof SIZES;
  /** Texto para leitores de tela. Sem ele, o spinner é decorativo (aria-hidden). */
  label?: string;
}

export function Spinner({ size = "md", label, className, ...props }: SpinnerProps) {
  const px = SIZES[size];
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("animate-spin shrink-0", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      {...props}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
