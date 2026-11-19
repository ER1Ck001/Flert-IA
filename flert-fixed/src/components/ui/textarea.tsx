"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { fieldControlClass } from "./input";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
  /** Mostra contador "n/maxLength" (aria-live polite). Requer maxLength. */
  showCount?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, showCount, maxLength, value, defaultValue, onChange, "aria-invalid": ariaInvalid, ...props }, ref) => {
    const isControlled = value !== undefined;
    const [inner, setInner] = React.useState(() => String(defaultValue ?? ""));
    const length = isControlled ? String(value ?? "").length : inner.length;
    const counterId = React.useId();
    const withCount = showCount && typeof maxLength === "number";

    const describedBy = [props["aria-describedby"], withCount ? counterId : undefined].filter(Boolean).join(" ") || undefined;

    const field = (
      <textarea
        ref={ref}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        aria-invalid={invalid || ariaInvalid || undefined}
        onChange={(e) => {
          if (!isControlled) setInner(e.target.value);
          onChange?.(e);
        }}
        className={cn(fieldControlClass, "flex min-h-[120px] py-3 leading-relaxed", className)}
        {...props}
        aria-describedby={describedBy}
      />
    );

    if (!withCount) return field;

    const near = length >= maxLength! * 0.9;
    const remaining = Math.max(0, maxLength! - length);
    return (
      <div className="relative w-full">
        {field}
        {/* Contador visível (lido via aria-describedby ao focar); não é região viva para não anunciar cada tecla. */}
        <span
          id={counterId}
          className={cn(
            "pointer-events-none mt-1.5 block text-right text-xs tabular-nums",
            near ? "text-warning" : "text-text-2"
          )}
        >
          {length}/{maxLength}
        </span>
        {/* Só perto do limite: anuncia quantos caracteres restam. */}
        <span data-testid="textarea-count-live" aria-live="polite" className="sr-only">
          {near ? (remaining === 1 ? "Resta 1 caractere" : `Restam ${remaining} caracteres`) : null}
        </span>
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
