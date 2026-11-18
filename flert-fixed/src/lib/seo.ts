import type { Metadata } from "next";

/** URL canônica do site (metadataBase, robots e sitemap). */
export const SITE_URL = "https://flertia.com.br";

/** Páginas de conta, auth e admin: não aparecem em buscadores. */
export const PRIVATE_ROBOTS: Metadata["robots"] = { index: false, follow: false };
