"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface LogoMarkProps extends React.SVGAttributes<SVGSVGElement> {
  size?: number;
  /** Texto acessível; sem ele o símbolo é decorativo. */
  title?: string;
}

/** Símbolo "Faísca": duas bolhas de conversa e uma estrela de 4 pontas no vão. */
export function LogoMark({ size = 28, title, className, ...props }: LogoMarkProps) {
  const gradId = `faisca-signal-${React.useId().replace(/:/g, "")}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={cn("shrink-0", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      {...props}
    >
      <defs>
        <linearGradient id={gradId} x1="11.5" y1="11.5" x2="20.5" y2="20.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B5CF6" />
          <stop offset=".55" stopColor="#FF3D8B" />
          <stop offset="1" stopColor="#FF7A59" />
        </linearGradient>
      </defs>
      {/* Bolha esquerda + rabicho inferior esquerdo */}
      <rect x="4" y="6" width="13" height="11" rx="5" stroke="#A78BFA" strokeWidth="1.75" />
      <path d="M7.5 16.6 L5.2 20.4 L10.6 17" stroke="#A78BFA" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      {/* Bolha direita + rabicho inferior direito */}
      <rect x="15" y="15" width="13" height="11" rx="5" stroke="#FF5FA0" strokeWidth="1.75" />
      <path d="M24.5 25.6 L26.8 29.4 L21.4 26" stroke="#FF5FA0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      {/* Estrela de 4 pontas (centro 16,16 · r 4.5) */}
      <path
        d="M16 11.5 L17.35 14.65 L20.5 16 L17.35 17.35 L16 20.5 L14.65 17.35 L11.5 16 L14.65 14.65 Z"
        fill={`url(#${gradId})`}
        stroke="#0B0814"
        strokeWidth="1.25"
        strokeLinejoin="round"
        paintOrder="stroke"
      />
    </svg>
  );
}

export interface LogoProps {
  variant?: "full" | "mark";
  size?: number;
  className?: string;
}

/** Logo completo (símbolo + "Flert IA") ou só o símbolo. */
export function Logo({ variant = "full", size = 28, className }: LogoProps) {
  if (variant === "mark") return <LogoMark size={size} title="Flert IA" className={className} />;
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark size={size} />
      <span className="font-display text-lg font-extrabold leading-none tracking-tight text-text">
        Flert <span className="text-signal">IA</span>
      </span>
    </span>
  );
}
