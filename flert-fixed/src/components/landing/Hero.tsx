import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/** Mock puramente visual (CSS/SVG): bolhas abstratas + faísca + 3 cartões de sugestão. */
function HeroMock() {
  return (
    <div
      role="img"
      aria-label="Ilustração: uma conversa e três sugestões de resposta"
      className="relative mx-auto w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-2"
    >
      <Badge variant="neutral" className="absolute right-4 top-4">
        Ilustração
      </Badge>

      <div aria-hidden className="space-y-2.5 pt-6">
        <div className="w-[72%] rounded-2xl rounded-bl-md bg-surface-2 px-4 py-3">
          <div className="h-2 w-full rounded-full bg-text-2/30" />
          <div className="mt-2 h-2 w-2/3 rounded-full bg-text-2/30" />
        </div>
        <div className="w-[48%] rounded-2xl rounded-bl-md bg-surface-2 px-4 py-3">
          <div className="h-2 w-full rounded-full bg-text-2/30" />
        </div>
      </div>

      <div aria-hidden className="my-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" className="motion-safe:animate-spark">
          <defs>
            <linearGradient id="hero-spark" x1="6" y1="6" x2="26" y2="26" gradientUnits="userSpaceOnUse">
              <stop stopColor="#8B5CF6" />
              <stop offset=".55" stopColor="#FF3D8B" />
              <stop offset="1" stopColor="#FF7A59" />
            </linearGradient>
          </defs>
          <path d="M16 4 L19 13 L28 16 L19 19 L16 28 L13 19 L4 16 L13 13 Z" fill="url(#hero-spark)" />
        </svg>
        <span className="h-px flex-1 bg-border" />
      </div>

      <ol aria-hidden className="space-y-2.5">
        {[0.9, 0.75, 0.6].map((w, i) => (
          <li
            key={w}
            className={
              i === 0
                ? "border-signal flex items-center gap-3 rounded-lg px-3 py-3"
                : "flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-3"
            }
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-caption text-violet-400">
              {i + 1}
            </span>
            <span className="h-2 rounded-full bg-text-2/30" style={{ width: `${w * 100}%` }} />
          </li>
        ))}
      </ol>
    </div>
  );
}

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
        <HeroMock />
      </div>
    </section>
  );
}
