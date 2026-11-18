import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { LEGAL_PUBLISHED, shouldRenderLegalPage } from "@/content/legal/config";
import { PRIVACIDADE } from "@/content/legal/privacidade";
import { PRIVATE_ROBOTS } from "@/lib/seo";

// Rascunho enquanto LEGAL_PUBLISHED = false: 404 em produção, visível em dev com banner.
export const metadata: Metadata = {
  title: PRIVACIDADE.title,
  description: PRIVACIDADE.description,
  ...(LEGAL_PUBLISHED ? { alternates: { canonical: "/privacidade" } } : { robots: PRIVATE_ROBOTS }),
};

export default function PrivacidadePage() {
  if (!shouldRenderLegalPage()) notFound();
  return <LegalDocument doc={PRIVACIDADE} published={LEGAL_PUBLISHED} />;
}
