import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { StatusScreen } from "@/components/ui/status-screen";

export const metadata: Metadata = {
  title: "Página não encontrada",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg bg-aurora">
      <div className="px-4 pt-4 sm:px-6 sm:pt-6">
        <Link
          href="/"
          aria-label="Flert IA — página inicial"
          className="inline-flex min-h-11 items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          <Logo size={28} />
        </Link>
      </div>
      <main id="main" tabIndex={-1} className="flex flex-1 items-center px-4 py-10 focus:outline-none sm:px-6">
        <StatusScreen
          icon={Compass}
          title="Página não encontrada"
          description="O endereço pode estar errado ou a página não existe mais."
          actions={
            <>
              <Button asChild variant="signal" size="lg" leftIcon={<ArrowLeft className="h-4 w-4" aria-hidden />}>
                <Link href="/">Voltar ao início</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/dashboard">Ir para a minha conta</Link>
              </Button>
            </>
          }
        />
      </main>
    </div>
  );
}
