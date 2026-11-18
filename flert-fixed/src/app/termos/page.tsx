import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { LEGAL_PUBLISHED, shouldRenderLegalPage } from "@/content/legal/config";
import { TERMOS } from "@/content/legal/termos";
import { PRIVATE_ROBOTS } from "@/lib/seo";

// Rascunho enquanto LEGAL_PUBLISHED = false: 404 em produção, visível em dev com banner.
export const metadata: Metadata = {
  title: TERMOS.title,
  description: TERMOS.description,
  ...(LEGAL_PUBLISHED ? { alternates: { canonical: "/termos" } } : { robots: PRIVATE_ROBOTS }),
};

export default function TermosPage() {
  if (!shouldRenderLegalPage()) notFound();
  return <LegalDocument doc={TERMOS} published={LEGAL_PUBLISHED} />;
}
