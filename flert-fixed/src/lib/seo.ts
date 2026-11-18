import type { Metadata } from "next";

/** Páginas de conta, auth e admin: não aparecem em buscadores. */
export const PRIVATE_ROBOTS: Metadata["robots"] = { index: false, follow: false };
