import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { LEGAL_PUBLISHED } from "@/content/legal/config";

/** Só páginas públicas indexáveis: a landing e, depois de publicados, Termos e Privacidade. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    ...(LEGAL_PUBLISHED
      ? (["/termos", "/privacidade"] as const).map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: "yearly" as const, priority: 0.3 }))
      : []),
  ];
}
