import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ConsentBanner } from "@/components/consent/ConsentBanner";
import { FacebookPixel } from "@/components/consent/FacebookPixel";
import { Toaster } from "@/components/ui/toaster";
import { SITE_URL } from "@/lib/seo";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Flert IA — Assistente de conversa com IA",
    template: "%s · Flert IA",
  },
  description:
    "Envie o print da conversa ou descreva a situação. A IA sugere 3 respostas em 7 tons — você escolhe e copia.",
  keywords: ["assistente de conversa", "responder mensagem", "responder story", "flerte", "IA"],
  authors: [{ name: "Flert IA" }],
  openGraph: {
    title: "Flert IA — Assistente de conversa com IA",
    description: "A IA sugere 3 respostas em 7 tons para a sua conversa — você escolhe e copia.",
    url: "https://flertia.com.br",
    siteName: "Flert IA",
    type: "website",
    locale: "pt_BR",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0B0814",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`dark ${inter.variable}`} style={{ colorScheme: "dark" }}>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@500,700,800&display=swap"
        />
      </head>
      <body className="font-sans bg-bg text-text antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[10000] focus:rounded-md focus:bg-violet-600 focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-white focus:shadow-2"
        >
          Pular para o conteúdo
        </a>
        <Providers>
          {children}
          <Toaster />
        </Providers>
        {/* Pixel da Meta só com consentimento (LGPD) e nunca em /auth/* */}
        <FacebookPixel />
        <ConsentBanner />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
