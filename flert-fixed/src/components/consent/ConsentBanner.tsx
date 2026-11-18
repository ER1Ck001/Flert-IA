"use client";

import { useEffect, useState } from "react";
import { CONSENT_EVENT, readConsent, writeConsent } from "@/lib/consent";
import { Button } from "@/components/ui/button";

export const OPEN_CONSENT_EVENT = "flert-open-consent";

/** Banner de cookies (LGPD): "Aceitar" e "Recusar" com o mesmo peso; sem escolha, nada carrega. */
export function ConsentBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(readConsent(window.localStorage) === null);
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, []);

  const choose = (marketing: boolean) => {
    writeConsent(window.localStorage, marketing);
    window.dispatchEvent(new Event(CONSENT_EVENT));
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Preferências de cookies"
      style={{ bottom: "calc(12px + var(--bottom-ui))" }}
      className="glass fixed inset-x-3 z-50 mx-auto max-w-xl rounded-lg border border-border-strong p-4 text-sm text-text shadow-2 sm:inset-x-6"
    >
      <p className="leading-relaxed text-text-2">
        Usamos cookies essenciais para o login funcionar. Com sua permissão, também usamos o Pixel da Meta
        para medir nossos anúncios. Você pode mudar isso depois em Configurações.
      </p>
      <div className="mt-3 flex gap-2">
        <Button type="button" variant="secondary" onClick={() => choose(false)} className="flex-1">
          Recusar
        </Button>
        <Button type="button" variant="secondary" onClick={() => choose(true)} className="flex-1">
          Aceitar
        </Button>
      </div>
    </div>
  );
}
