"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { CONSENT_EVENT, readConsent, shouldLoadPixel, type Consent } from "@/lib/consent";

const PIXEL_ID = "1546365726869734";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/** Carrega o Pixel só após aceite de marketing e nunca em /auth/* (ver src/lib/consent.ts). */
export function FacebookPixel() {
  const pathname = usePathname() ?? "/";
  const [consent, setConsent] = useState<Consent | null>(null);

  useEffect(() => {
    const sync = () => setConsent(readConsent(typeof window !== "undefined" ? window.localStorage : undefined));
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, []);

  const enabled = shouldLoadPixel(consent, pathname);

  // Revogou o consentimento depois de o Pixel já ter carregado: o script não descarrega sozinho,
  // então recarrega a página sem ele (LGPD).
  useEffect(() => {
    if (consent?.marketing === false && typeof window.fbq === "function") window.location.reload();
  }, [consent]);

  // PageView a cada navegação (sem querystring — nunca envia tokens ou parâmetros).
  useEffect(() => {
    if (enabled) window.fbq?.("track", "PageView", { page_path: pathname });
  }, [enabled, pathname]);

  if (!enabled) return null;

  return (
    <Script id="facebook-pixel" strategy="afterInteractive">{`
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
      document,'script','https://connect.facebook.net/en_US/fbevents.js');
      fbq('set','autoConfig',false,'${PIXEL_ID}');
      fbq('init','${PIXEL_ID}');
      fbq('track','PageView');
    `}</Script>
  );
}
