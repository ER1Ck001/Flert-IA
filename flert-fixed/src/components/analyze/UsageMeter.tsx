import * as React from "react";
import { cn } from "@/lib/utils";

export interface UsageMeterProps {
  todayCount: number;
  dailyLimit: number | null;
  isLifetime: boolean;
  className?: string;
}

/** Uso diário de análises. Oculto no Vitalício ou quando não há limite. */
export function UsageMeter({ todayCount, dailyLimit, isLifetime, className }: UsageMeterProps) {
  const labelId = React.useId();
  if (isLifetime || dailyLimit === null) return null;

  const warn = todayCount >= dailyLimit - 2;
  const remaining = Math.max(0, dailyLimit - todayCount);
  const pct = dailyLimit > 0 ? Math.min(100, Math.round((todayCount / dailyLimit) * 100)) : 100;

  return (
    <div
      className={cn(
        "w-full min-w-[10rem] rounded-md border bg-surface px-3 py-2.5 sm:w-48",
        warn ? "border-warning/40" : "border-border",
        className
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span id={labelId} className="text-sm text-text-2">
          Análises hoje
        </span>
        <span className={cn("text-sm font-semibold tabular-nums", warn ? "text-warning" : "text-text")}>
          {todayCount}/{dailyLimit}
        </span>
      </div>
      <div
        role="progressbar"
        aria-labelledby={labelId}
        aria-valuemin={0}
        aria-valuemax={dailyLimit}
        aria-valuenow={todayCount}
        aria-valuetext={`${todayCount} de ${dailyLimit} análises usadas hoje`}
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3"
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-300 ease-out", warn ? "bg-warning" : "bg-violet-500")}
          style={{ width: `${pct}%` }}
        />
      </div>
      {warn && (
        <p className="mt-1.5 text-xs font-medium text-warning">
          {remaining === 1 ? "Resta 1 análise hoje" : `Restam ${remaining} análises hoje`}
        </p>
      )}
    </div>
  );
}
