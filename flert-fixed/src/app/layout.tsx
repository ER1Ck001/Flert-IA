import type { Metadata } from "next";
import { Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Providers } from "./providers";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://flertia.com.br"),
  title: "Flert IA — Seu Assistente de Conversas",
  description: "Transforme suas conversas com o poder da Inteligência Artificial. Respostas inteligentes, envolventes e conexões reais.",
  keywords: ["flert", "IA", "conversas", "dating", "inteligência artificial", "chat"],
  authors: [{ name: "Flert IA" }],
  openGraph: {
    title: "Flert IA — Seu Assistente de Conversas",
    description: "Transforme suas conversas com o poder da Inteligência Artificial.",
    url: "https://flertia.com.br",
    siteName: "Flert IA",
    type: "website",
    locale: "pt_BR",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={cormorant.variable}>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@800,700,500,400,300&display=swap"
        />
      </head>
      <body className="font-cabinet antialiased">
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#160E11',
                color: '#F2EDE8',
                border: '1px solid rgba(201,168,76,0.2)',
                borderRadius: '2px',
                fontFamily: "'Cabinet Grotesk', sans-serif",
                fontSize: '14px',
              },
              success: {
                iconTheme: { primary: '#C9A84C', secondary: '#160E11' },
              },
              error: {
                iconTheme: { primary: '#8B0A2A', secondary: '#F2EDE8' },
              },
            }}
          />
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
