"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Hourglass, Lock, Timer, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fadeUp, useMotionSafe } from "@/lib/motion";
import { PLAN_LABELS, PLANS_IN_ORDER } from "@/lib/plans";

const PAID_PLAN_NAMES = PLANS_IN_ORDER.map(p => p.label).join(", ").replace(/, ([^,]*)$/, " e $1");

export type AnalyzeGateKind = "error" | "no-plan" | "expired" | "limit";

export interface AnalyzeGateProps {
  kind: AnalyzeGateKind;
  /** Usado no texto do gate de limite. */
  dailyLimit?: number | null;
  /** "Tentar novamente" (error) ou ir para /pricing (demais). */
  onAction: () => void;
}

const CONTENT: Record<AnalyzeGateKind, { icon: LucideIcon; title: string; action: string }> = {
  error: { icon: AlertTriangle, title: "Não foi possível carregar seu plano", action: "Tentar novamente" },
  "no-plan": { icon: Lock, title: "Recurso exclusivo para assinantes", action: "Ver planos" },
  expired: { icon: Hourglass, title: "Seu plano expirou", action: "Renovar plano" },
  limit: { icon: Timer, title: "Limite diário atingido", action: `Ver plano ${PLAN_LABELS.LIFETIME}` },
};

function description(kind: AnalyzeGateKind, dailyLimit?: number | null) {
  switch (kind) {
    case "error":
      return "Verifique sua conexão e tente novamente.";
    case "expired":
      return "Renove seu plano para voltar a usar as análises. Seu histórico continua salvo.";
    case "no-plan":
      return `As análises com IA estão disponíveis nos planos ${PAID_PLAN_NAMES}.`;
    case "limit":
      return `Você já fez ${dailyLimit} análises hoje. O limite reinicia à meia-noite (horário de Brasília). No plano ${PLAN_LABELS.LIFETIME} as análises são ilimitadas.`;
  }
}

/** Telas de bloqueio do /analyze: erro de carga, sem plano, plano expirado e limite diário. */
export function AnalyzeGate({ kind, dailyLimit, onAction }: AnalyzeGateProps) {
  const variants = useMotionSafe(fadeUp);
  const { icon: Icon, title, action } = CONTENT[kind];
  const isError = kind === "error";

  return (
    <motion.div
      role={isError ? "alert" : undefined}
      variants={variants}
      initial="hidden"
      animate="show"
      className="mx-auto mt-10 flex max-w-md flex-col items-center gap-4 rounded-xl border border-border bg-surface px-6 py-10 text-center shadow-1 sm:mt-16"
    >
      <span
        aria-hidden
        className={
          isError
            ? "flex h-14 w-14 items-center justify-center rounded-full bg-danger/15 text-danger"
            : "flex h-14 w-14 items-center justify-center rounded-full bg-violet-500/15 text-violet-400"
        }
      >
        <Icon className="h-7 w-7" />
      </span>
      <h2 className="font-display text-h2 text-text">{title}</h2>
      <p className="text-body text-text-2">{description(kind, dailyLimit)}</p>
      <Button variant={isError ? "secondary" : "signal"} size="lg" className="mt-2 w-full sm:w-auto" onClick={onAction}>
        {action}
      </Button>
    </motion.div>
  );
}
