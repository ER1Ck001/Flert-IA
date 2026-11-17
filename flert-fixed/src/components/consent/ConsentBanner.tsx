"use client";

import { useEffect, useState } from "react";
import { CONSENT_EVENT, readConsent, writeConsent } from "@/lib/consent";

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
      className="fixed inset-x-3 bottom-3 z-[9999] mx-auto max-w-xl rounded-2xl border border-white/10 bg-[#120b10]/95 p-4 text-sm text-[#F2EDE8] shadow-2xl backdrop-blur-md sm:inset-x-6"
    >
      <p className="leading-relaxed text-[#F2EDE8]/85">
        Usamos cookies essenciais para o login funcionar. Com sua permissão, também usamos o Pixel da Meta
        para medir nossos anúncios. Você pode mudar isso depois em Configurações.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => choose(false)}
          className="flex-1 rounded-xl border border-white/15 px-4 py-2.5 font-semibold transition hover:bg-white/10"
        >
          Recusar
        </button>
        <button
          type="button"
          onClick={() => choose(true)}
          className="flex-1 rounded-xl border border-white/15 px-4 py-2.5 font-semibold transition hover:bg-white/10"
        >
          Aceitar
        </button>
      </div>
    </div>
  );
}
