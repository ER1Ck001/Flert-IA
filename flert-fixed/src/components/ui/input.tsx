import * as React from "react";
import { cn } from "@/lib/utils";

export const fieldControlClass =
  "w-full rounded-md border border-border bg-surface-2 px-4 text-base text-text placeholder:text-text-3 " +
  "transition-[border-color,box-shadow] duration-200 ease-out hover:border-border-strong " +
  "focus-visible:outline-none focus-visible:border-violet-400 focus-visible:ring-2 focus-visible:ring-violet-400/40 " +
  "disabled:cursor-not-allowed disabled:opacity-50 " +
  "aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:ring-danger/40";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Marca o campo como inválido (aria-invalid + borda danger). */
  invalid?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, invalid, "aria-invalid": ariaInvalid, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      aria-invalid={invalid || ariaInvalid || undefined}
      className={cn(
        fieldControlClass,
        "flex h-12 py-2 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
