import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Área logada, admin, auth e API não são conteúdo público (as páginas também têm noindex).
        disallow: ["/api/", "/admin", "/dashboard", "/analyze", "/history", "/profile", "/settings", "/pricing", "/auth/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
