import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroPreview } from "./HeroPreview";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="bg-aurora">
      <div className="mx-auto grid max-w-site items-center gap-10 px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-2 lg:gap-12 lg:pb-24 lg:pt-24">
        <div className="min-w-0">
          <h1 id="hero-title" className="font-display text-display text-text">
            A resposta certa, <span className="text-signal">no tom certo.</span>
          </h1>
          <p className="mt-5 max-w-xl text-body text-text-2 sm:text-lg">
            Envie o print ou descreva a situação. A IA sugere 3 respostas em 7 tons — você escolhe e copia.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="signal" size="lg" rightIcon={<ArrowRight className="h-4 w-4" aria-hidden />}>
              <Link href="/auth/register">Criar conta</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/auth/login">Entrar</Link>
            </Button>
          </div>
        </div>
        <HeroPreview />
      </div>
    </section>
  );
}
