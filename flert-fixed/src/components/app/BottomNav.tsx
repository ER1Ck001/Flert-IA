"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCOUNT_NAV, isActivePath, navItem } from "./nav-items";

const ITEMS = [navItem("/dashboard"), navItem("/history"), navItem("/analyze"), navItem("/pricing")];

export interface BottomNavProps {
  onOpenAccount: () => void;
  accountOpen?: boolean;
}

const itemBase =
  "flex min-h-[44px] min-w-[44px] w-full flex-col items-center justify-center gap-1 rounded-md text-[11px] font-medium leading-none " +
  "transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400";

/** Navegação inferior (< lg): 5 alvos ≥44px, "Analisar" em destaque no centro. */
export function BottomNav({ onOpenAccount, accountOpen = false }: BottomNavProps) {
  const pathname = usePathname();
  const accountActive = ACCOUNT_NAV.some((i) => isActivePath(pathname, i.href));
  const [home, history, analyze, plans] = ITEMS;

  const renderLink = (item: (typeof ITEMS)[number]) => {
    const active = isActivePath(pathname, item.href);
    const Icon = item.icon;
    return (
      <li key={item.href} className="flex">
        <Link
          href={item.href}
          aria-current={active ? "page" : undefined}
          className={cn(itemBase, active ? "text-violet-400" : "text-text-2 hover:text-text")}
        >
          <Icon className="h-5 w-5" aria-hidden />
          <span>{item.name}</span>
        </Link>
      </li>
    );
  };

  const analyzeActive = isActivePath(pathname, analyze.href);
  const AnalyzeIcon = analyze.icon;

  return (
    <nav
      aria-label="Navegação principal"
      data-bottom-nav
      className="glass fixed inset-x-0 bottom-0 z-40 border-t border-border pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto grid h-nav max-w-md grid-cols-5 items-center gap-1 px-2">
        {renderLink(home)}
        {renderLink(history)}
        <li className="flex justify-center">
          <Link
            href={analyze.href}
            aria-current={analyzeActive ? "page" : undefined}
            className={cn(itemBase, "group", analyzeActive ? "text-text" : "text-text-2 hover:text-text")}
          >
            <span
              className={cn(
                "-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-cta text-white shadow-glow-pink ring-4 ring-bg",
                "transition-transform duration-200 ease-out group-active:scale-95"
              )}
            >
              <AnalyzeIcon className="h-5 w-5" aria-hidden />
            </span>
            <span>{analyze.name}</span>
          </Link>
        </li>
        {renderLink(plans)}
        <li className="flex">
          <button
            type="button"
            onClick={onOpenAccount}
            aria-haspopup="dialog"
            aria-expanded={accountOpen}
            className={cn(itemBase, accountActive || accountOpen ? "text-violet-400" : "text-text-2 hover:text-text")}
          >
            <UserRound className="h-5 w-5" aria-hidden />
            <span>Conta</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
