"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import { LifeBuoy, LogOut, Zap } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { APP_NAV, PREMIUM_HREF, SUPPORT_EMAIL, SUPPORT_URL, initials, isActivePath } from "./nav-items";

/** Barra lateral (lg+). Sem backdrop-filter: fundo surface/60 sólido. */
export function AppSidebar({ user }: { user?: Session["user"] | null }) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-surface/60 lg:flex">
      <div className="flex h-16 shrink-0 items-center px-5">
        <Link
          href="/"
          aria-label="Flert IA — página inicial"
          className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          <Logo />
        </Link>
      </div>

      <nav aria-label="Navegação principal" className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {APP_NAV.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex min-h-[44px] items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400",
                    active ? "bg-violet-500/15 text-text" : "text-text-2 hover:bg-surface-2 hover:text-text"
                  )}
                >
                  {active && (
                    <span aria-hidden className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-signal" />
                  )}
                  <Icon className={cn("h-5 w-5", active ? "text-violet-400" : "text-text-3")} aria-hidden />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="space-y-2 px-3 pb-3">
        <a
          href={SUPPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 items-center gap-3 rounded-md border border-border px-3 py-2.5 transition-colors hover:border-border-strong hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          <LifeBuoy className="h-4 w-4 text-text-2" aria-hidden />
          <span className="min-w-0">
            <span className="block text-sm font-semibold leading-tight text-text">Suporte</span>
            <span className="block truncate text-xs leading-tight text-text-2">{SUPPORT_EMAIL}</span>
          </span>
          <span className="sr-only">(abre em nova aba)</span>
        </a>

        <Link
          href={PREMIUM_HREF}
          className="border-signal flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 transition-shadow hover:shadow-glow-pink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          <Zap className="h-4 w-4 text-pink-400" aria-hidden />
          <span className="min-w-0">
            <span className="block text-sm font-semibold leading-tight text-text">Ver planos</span>
            <span className="block text-xs leading-tight text-text-2">Compare planos e limites</span>
          </span>
        </Link>
      </div>

      <div className="flex shrink-0 items-center gap-3 border-t border-border px-4 py-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.image || undefined} alt="" />
          <AvatarFallback className="bg-violet-500/15 text-xs font-semibold text-violet-400">
            {initials(user?.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight text-text">
            {user?.name?.split(" ")[0] || "Usuário"}
          </p>
          <p className="truncate text-xs leading-tight text-text-2">{user?.email || ""}</p>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          aria-label="Sair da conta"
          title="Sair da conta"
          className="flex h-11 w-11 items-center justify-center rounded-md text-text-2 transition-colors hover:bg-danger/10 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          <LogOut className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </aside>
  );
}
