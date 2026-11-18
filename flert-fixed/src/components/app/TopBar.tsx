"use client";

import Link from "next/link";
import type { Session } from "next-auth";
import { Logo } from "@/components/brand/Logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "./nav-items";

export interface TopBarProps {
  user?: Session["user"] | null;
  onOpenAccount: () => void;
  accountOpen?: boolean;
}

/** Barra superior (< lg): logo + atalho da conta. */
export function TopBar({ user, onOpenAccount, accountOpen = false }: TopBarProps) {
  return (
    <header className="glass sticky top-0 z-30 border-b border-border pt-[env(safe-area-inset-top)] lg:hidden">
      <div className="flex h-topbar items-center justify-between px-4">
        <Link
          href="/"
          aria-label="Flert IA — página inicial"
          className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          <Logo size={26} />
        </Link>
        <button
          type="button"
          onClick={onOpenAccount}
          aria-label="Abrir menu da conta"
          aria-haspopup="dialog"
          aria-expanded={accountOpen}
          className="-mr-1.5 flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.image || undefined} alt="" />
            <AvatarFallback className="bg-violet-500/15 text-xs font-semibold text-violet-400">
              {initials(user?.name)}
            </AvatarFallback>
          </Avatar>
        </button>
      </div>
    </header>
  );
}
