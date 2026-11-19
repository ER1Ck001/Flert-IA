"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, m } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DUR, EASE, scaleIn, sheetUp, useMotionSafe } from "@/lib/motion";

function useIsDesktop(query = "(min-width: 768px)") {
  const [match, setMatch] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(query);
    const update = () => setMatch(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, [query]);
  return match;
}

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Esconde o título visualmente (continua acessível). */
  hideTitle?: boolean;
  children: React.ReactNode;
  className?: string;
}

const overlay = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DUR.base, ease: EASE.out } },
  exit: { opacity: 0, transition: { duration: DUR.fast } },
};

/**
 * Folha modal (Radix Dialog): no mobile é bottom sheet (sheetUp, rounded-t-xl, alça);
 * em md+ fica centralizada. Prende o foco e fecha com Esc.
 */
export function Sheet({ open, onOpenChange, title, description, hideTitle, children, className }: SheetProps) {
  const isDesktop = useIsDesktop();
  const content = useMotionSafe(isDesktop ? { ...scaleIn, exit: { opacity: 0, scale: 0.96 } } : sheetUp);
  const backdrop = useMotionSafe(overlay);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <m.div
                className="fixed inset-0 z-[60] bg-black/60"
                variants={backdrop}
                initial="hidden"
                animate="show"
                exit="exit"
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content
              asChild
              forceMount
              {...(description ? {} : { "aria-describedby": undefined })}
            >
              <m.div
                variants={content}
                initial="hidden"
                animate="show"
                exit="exit"
                className={cn(
                  "glass fixed z-[61] flex max-h-[85dvh] flex-col overflow-y-auto border border-border shadow-2 focus:outline-none",
                  "inset-x-0 bottom-0 rounded-t-xl px-4 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))]",
                  // Centralizado sem translate (o framer-motion controla `transform`).
                  "md:inset-0 md:m-auto md:h-fit md:w-[calc(100%-2rem)] md:max-w-md md:rounded-xl md:p-6",
                  className
                )}
              >
                <div aria-hidden className="mx-auto mb-3 h-1.5 w-10 shrink-0 rounded-full bg-surface-3 md:hidden" />
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <DialogPrimitive.Title className={cn("font-display text-h3 text-text", hideTitle && "sr-only")}>
                      {title}
                    </DialogPrimitive.Title>
                    {description && (
                      <DialogPrimitive.Description className="mt-1 text-sm text-text-2">
                        {description}
                      </DialogPrimitive.Description>
                    )}
                  </div>
                  <DialogPrimitive.Close
                    aria-label="Fechar"
                    className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-text-2 transition-colors hover:bg-surface-2 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                  >
                    <X className="h-5 w-5" aria-hidden />
                  </DialogPrimitive.Close>
                </div>
                {children}
              </m.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
