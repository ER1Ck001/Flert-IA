"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusScreen } from "@/components/ui/status-screen";

/** Erro inesperado fora da área logada. Nunca mostra a mensagem técnica ao usuário. */
export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Erro na página:", error.digest ?? error.message);
  }, [error]);

  return (
    <main id="main" tabIndex={-1} className="flex min-h-dvh items-center bg-bg bg-aurora px-4 py-10 focus:outline-none sm:px-6">
      <StatusScreen
        role="alert"
        tone="danger"
        icon={AlertTriangle}
        title="Algo deu errado"
        description="Não conseguimos carregar esta página agora. Tente novamente em instantes."
        actions={
          <>
            <Button variant="signal" size="lg" leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />} onClick={reset}>
              Tentar novamente
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/">Voltar ao início</Link>
            </Button>
          </>
        }
      />
    </main>
  );
}
