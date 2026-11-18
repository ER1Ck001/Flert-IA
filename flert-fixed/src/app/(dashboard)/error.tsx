"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusScreen } from "@/components/ui/status-screen";

/**
 * Erro inesperado numa página da área logada. Renderiza dentro do (dashboard)/layout,
 * então a navegação (sidebar/nav inferior) continua disponível.
 */
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Erro na página:", error.digest ?? error.message);
  }, [error]);

  return (
    <StatusScreen
      role="alert"
      tone="danger"
      icon={AlertTriangle}
      className="mt-10 sm:mt-16"
      title="Não foi possível carregar esta página"
      description="Verifique sua conexão e tente novamente. Se o problema continuar, fale com o suporte."
      actions={
        <>
          <Button variant="signal" size="lg" leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />} onClick={reset}>
            Tentar novamente
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/dashboard">Ir para o início</Link>
          </Button>
        </>
      }
    />
  );
}
