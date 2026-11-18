"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import { ChevronRight, LifeBuoy, LogOut, Zap } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname } from "next/navigation";
import { ACCOUNT_NAV, PREMIUM_HREF, SUPPORT_EMAIL, SUPPORT_URL, initials, isActivePath } from "./nav-items";

export interface AccountSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: Session["user"] | null;
}

const rowClass =
  "flex min-h-[48px] items-center gap-3 rounded-md px-3 text-sm font-medium text-text transition-colors hover:bg-surface-2 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400";

/** Folha "Conta" (mobile): Perfil, Configurações, Suporte, Seja Premium e Sair. */
export function AccountSheet({ open, onOpenChange, user }: AccountSheetProps) {
  const close = () => onOpenChange(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Conta" hideTitle>
      <div className="mb-3 flex items-center gap-3 rounded-md border border-border bg-surface-2 px-3 py-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={user?.image || undefined} alt="" />
          <AvatarFallback className="bg-violet-500/15 text-sm font-semibold text-violet-400">
            {initials(user?.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text">{user?.name?.split(" ")[0] || "Usuário"}</p>
          <p className="truncate text-sm text-text-2">{user?.email || ""}</p>
        </div>
      </div>

      <nav aria-label="Conta" className="flex flex-col gap-1">
        {ACCOUNT_NAV.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
              className={rowClass}
            >
              <Icon className="h-5 w-5 text-text-2" aria-hidden />
              <span className="flex-1">{item.name}</span>
              <ChevronRight className="h-4 w-4 text-text-3" aria-hidden />
            </Link>
          );
        })}

        <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className={rowClass}>
          <LifeBuoy className="h-5 w-5 text-text-2" aria-hidden />
          <span className="flex-1">
            Suporte
            <span className="block text-xs font-normal text-text-2">{SUPPORT_EMAIL}</span>
          </span>
          <span className="sr-only">(abre em nova aba)</span>
        </a>

        <Link
          href={PREMIUM_HREF}
          onClick={close}
          className="border-signal mt-2 flex min-h-[48px] items-center gap-3 rounded-md px-3 text-sm font-semibold text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          <Zap className="h-5 w-5 text-pink-400" aria-hidden />
          <span className="flex-1">
            Seja Premium
            <span className="block text-xs font-normal text-text-2">Compare planos e limites</span>
          </span>
        </Link>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className={`${rowClass} mt-2 text-danger hover:bg-danger/10`}
        >
          <LogOut className="h-5 w-5" aria-hidden />
          <span className="flex-1 text-left">Sair</span>
        </button>
      </nav>
    </Sheet>
  );
}
