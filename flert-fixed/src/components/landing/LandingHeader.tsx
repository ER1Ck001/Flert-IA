import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#demo", label: "Exemplo" },
  { href: "#planos", label: "Planos" },
  { href: "#faq", label: "Dúvidas" },
] as const;

export function LandingHeader() {
  return (
    <header className="glass sticky top-0 z-40 border-b border-border/60">
      <div className="mx-auto flex h-topbar max-w-site items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          aria-label="Flert IA — início"
          className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          <Logo />
        </Link>
        <nav aria-label="Seções da página" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="rounded-sm px-3 py-2 text-sm text-text-2 transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/auth/login">Entrar</Link>
          </Button>
          <Button asChild variant="primary" size="sm">
            <Link href="/auth/register">Criar conta</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
