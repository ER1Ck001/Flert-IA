"use client";

import { OPEN_CONSENT_EVENT } from "@/components/consent/ConsentBanner";
import { cn } from "@/lib/utils";

/** Reabre o banner de consentimento de cookies (LGPD). */
export function CookiePrefsButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}
      className={cn(
        "rounded-sm text-sm text-text-2 underline-offset-4 hover:text-text hover:underline",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        className
      )}
    >
      Preferências de cookies
    </button>
  );
}
