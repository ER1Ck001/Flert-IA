"use client";

import * as React from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Button } from "./button";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** "danger" para ações irreversíveis. */
  tone?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
}

/**
 * Confirmação para ações destrutivas (Radix AlertDialog: role=alertdialog, prende o foco,
 * Esc cancela). Ao fechar, devolve o foco ao elemento que estava focado ao abrir
 * (ou ao `#main` se ele saiu da página, ex.: item removido).
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  tone = "danger",
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  const returnTo = React.useRef<HTMLElement | null>(null);
  if (open && returnTo.current === null && typeof document !== "undefined") {
    returnTo.current = document.activeElement as HTMLElement | null;
  }

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[60] bg-black/60 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <AlertDialog.Content
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            const el = returnTo.current;
            returnTo.current = null;
            if (el && el.isConnected) el.focus();
            else document.getElementById("main")?.focus();
          }}
          className="fixed inset-x-4 top-1/2 z-[61] mx-auto w-auto max-w-md -translate-y-1/2 rounded-xl border border-border-strong bg-surface p-6 text-text shadow-2 focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <AlertDialog.Title className="font-display text-h3 text-text">{title}</AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-text-2">{description}</AlertDialog.Description>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel asChild>
              <Button variant="secondary" disabled={loading}>
                {cancelLabel}
              </Button>
            </AlertDialog.Cancel>
            <Button
              variant={tone === "danger" ? "danger" : "primary"}
              loading={loading}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
