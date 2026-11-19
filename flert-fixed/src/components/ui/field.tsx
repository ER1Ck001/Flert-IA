"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface FieldControlProps {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
}

export interface FieldProps {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  /** id do controle; gerado se omitido. */
  id?: string;
  className?: string;
  /** Recebe as props de acessibilidade a aplicar no controle (Input, Textarea, PasswordInput…). */
  children: (control: FieldControlProps) => React.ReactNode;
}

/** Rótulo + dica + erro, ligados ao controle por htmlFor/aria-describedby. */
export function Field({ label, hint, error, id, className, children }: FieldProps) {
  const auto = React.useId();
  const controlId = id ?? `field-${auto}`;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={controlId} className="text-sm font-medium text-text">
        {label}
      </label>
      {children({ id: controlId, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {hint && !error && (
        <p id={hintId} className="text-sm text-text-2">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
