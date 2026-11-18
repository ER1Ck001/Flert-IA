/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== "production";

// 'unsafe-inline' ainda é necessário: scripts inline do Next 15, next-themes e o snippet do
// Pixel; estilos inline do framer-motion e <style> das páginas. CSP com nonce fica para depois.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://connect.facebook.net`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob: https://www.facebook.com https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://res.cloudinary.com",
  "media-src 'self'",
  "connect-src 'self' https://www.facebook.com https://connect.facebook.net https://vitals.vercel-insights.com",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://accounts.google.com",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

const nextConfig = {
  poweredByHeader: false,
  // Next 15: era experimental.serverComponentsExternalPackages.
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  // src/instrumentation.ts (validação do ambiente na subida) é estável no Next 15 e não precisa
  // mais de experimental.instrumentationHook.
  images: {
    // Image Optimizer (/_next/image) segue desligado. O Next 15.5.29 já tem o patch das CVEs dele,
    // mas só os avatares do /admin o usavam (previews em data: já eram não otimizados): religar só
    // aumentaria a superfície de ataque e o custo de otimização na Vercel, sem ganho real.
    // Ver docs/producao-performance.md (A1 e "Upgrade do Next").
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // O link de redefinição leva o token na URL: nunca enviar Referer a partir dessa página.
      { source: "/auth/reset-password", headers: [{ key: "Referrer-Policy", value: "no-referrer" }] },
    ];
  },
};

module.exports = nextConfig;
