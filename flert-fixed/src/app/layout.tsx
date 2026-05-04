import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Providers } from "./providers";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://flertia.com"),
  title: "Flert IA - Seu Assistente de Conversas",
  description: "Transforme suas conversas com o poder da Inteligência Artificial. Respostas inteligentes, envolventes e conexões reais.",
  keywords: ["flert", "IA", "conversas", "dating", "inteligência artificial", "chat"],
  authors: [{ name: "Flert IA Team" }],
  openGraph: {
    title: "Flert IA - Seu Assistente de Conversas",
    description: "Transforme suas conversas com o poder da Inteligência Artificial.",
    url: "https://flertia.com",
    siteName: "Flert IA",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--background)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
              },
              success: {
                iconTheme: {
                  primary: '#ff2d95',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
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
