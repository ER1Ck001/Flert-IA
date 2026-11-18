import { CreditCard, History, Home, Settings, Sparkles, User, type LucideIcon } from "lucide-react";

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

/** Destinos da área logada (mesmos do layout anterior). */
export const APP_NAV: readonly NavItem[] = [
  { name: "Início", href: "/dashboard", icon: Home },
  { name: "Analisar", href: "/analyze", icon: Sparkles },
  { name: "Histórico", href: "/history", icon: History },
  { name: "Planos", href: "/pricing", icon: CreditCard },
  { name: "Perfil", href: "/profile", icon: User },
  { name: "Configurações", href: "/settings", icon: Settings },
];

/** Itens que abrem pela folha "Conta" no mobile. */
export const ACCOUNT_NAV: readonly NavItem[] = APP_NAV.filter((i) => i.href === "/profile" || i.href === "/settings");

export const navItem = (href: string): NavItem => APP_NAV.find((i) => i.href === href)!;

/** Link de suporte (mesma URL do layout anterior; trocar por mailto: é decisão do dono — auditoria P15). */
export const SUPPORT_URL = "https://mail.google.com/mail/?view=cm&to=erickdev@flertia.com.br&su=Suporte%20Flert%20IA";
export { SUPPORT_EMAIL } from "@/lib/support";

export const PREMIUM_HREF = "/pricing";

/** Ativo se for a rota exata ou uma sub-rota dela. */
export function isActivePath(pathname: string | null | undefined, href: string): boolean {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function initials(name?: string | null): string {
  return name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";
}
