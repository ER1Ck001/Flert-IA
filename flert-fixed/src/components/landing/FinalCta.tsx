import Link from "next/link";
import { Button } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section
      aria-labelledby="final-cta-title"
      className="py-16 [contain-intrinsic-size:auto_360px] [content-visibility:auto] sm:py-20"
    >
      <div className="mx-auto max-w-site px-4 sm:px-6">
        <div className="border-signal rounded-xl px-6 py-10 text-center shadow-glow-violet sm:px-10 sm:py-14">
          <h2 id="final-cta-title" className="font-display text-h2 text-text">
            Pronto para responder no tom certo?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-body text-text-2">
            Crie sua conta, escolha um plano e receba 3 sugestões para a sua próxima conversa.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild variant="signal" size="lg">
              <Link href="/auth/register">Criar conta</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/auth/login">Já tenho conta</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
