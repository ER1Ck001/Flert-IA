import * as React from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

const primary = "bg-violet-600 text-white hover:bg-[#6D28D9] shadow-1";
const signal = "bg-cta text-white shadow-glow-pink hover:brightness-110";
const danger = "bg-destructive text-destructive-foreground hover:bg-destructive/90";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold select-none " +
    "transition-[transform,background-color,border-color,color,box-shadow,filter] duration-200 ease-out " +
    "active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 " +
    "focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50 " +
    "aria-busy:cursor-progress [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary,
        signal,
        secondary: "bg-surface-2 text-text border border-border hover:bg-surface-3 hover:border-border-strong",
        outline: "border border-border-strong bg-transparent text-text hover:bg-surface-2",
        ghost: "bg-transparent text-text-2 hover:text-text hover:bg-surface-2",
        danger,
        link: "h-auto px-0 text-violet-400 underline-offset-4 hover:underline",
        // Aliases legados (remover na 4.5).
        default: primary,
        brand: signal,
        destructive: danger,
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-4",
        lg: "h-12 px-6 text-base",
        icon: "h-11 w-11 p-0",
        // Alias legado.
        default: "h-11 px-4",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Mostra Spinner, desabilita e marca aria-busy. */
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading = false, leftIcon, rightIcon, disabled, children, type, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        type={asChild ? undefined : type}
        disabled={asChild ? undefined : disabled || loading}
        aria-disabled={asChild && (disabled || loading) ? true : undefined}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? <Spinner size="sm" /> : leftIcon}
        <Slottable>{children}</Slottable>
        {!loading && rightIcon}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
