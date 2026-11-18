"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface CheckboxFieldProps {
  id: string;
  label: React.ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  error?: React.ReactNode;
  required?: boolean;
  className?: string;
}

/** Caixa de seleção nativa com rótulo clicável (alvo ≥44px) e erro ligado por aria-describedby. */
export const CheckboxField = React.forwardRef<HTMLInputElement, CheckboxFieldProps>(
  ({ id, label, checked, onCheckedChange, error, required, className }, ref) => {
    const errorId = error ? `${id}-error` : undefined;
    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        <div className="flex min-h-11 items-start gap-3">
          <input
            ref={ref}
            id={id}
            type="checkbox"
            checked={checked}
            onChange={(e) => onCheckedChange(e.target.checked)}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
            className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-border bg-surface-2 accent-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          />
          <label htmlFor={id} className="cursor-pointer text-sm leading-relaxed text-text-2">
            {label}
          </label>
        </div>
        {error && (
          <p id={errorId} role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        )}
      </div>
    );
  }
);
CheckboxField.displayName = "CheckboxField";
