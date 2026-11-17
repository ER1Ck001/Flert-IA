// Consentimento de cookies de marketing (LGPD). Isomórfico/puro; a persistência é no navegador.
export const CONSENT_KEY = "flert-consent";
export const CONSENT_VERSION = 1;
export const CONSENT_EVENT = "flert-consent-change";

export type Consent = { v: number; marketing: boolean; at: number };

/** O Pixel só carrega com aceite explícito e nunca em /auth/* (o link de redefinição leva token na URL). */
export function shouldLoadPixel(consent: Consent | null, pathname: string): boolean {
  return consent?.v === CONSENT_VERSION && consent.marketing === true && !pathname.startsWith("/auth");
}

export function readConsent(storage: Pick<Storage, "getItem"> | undefined): Consent | null {
  try {
    const raw = storage?.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Consent;
    return parsed?.v === CONSENT_VERSION && typeof parsed.marketing === "boolean" ? parsed : null;
  } catch {
    return null;
  }
}

export function writeConsent(storage: Pick<Storage, "setItem"> | undefined, marketing: boolean): Consent {
  const consent: Consent = { v: CONSENT_VERSION, marketing, at: Date.now() };
  try {
    storage?.setItem(CONSENT_KEY, JSON.stringify(consent));
  } catch {
    /* modo privado / armazenamento bloqueado: vale só para esta página */
  }
  return consent;
}
