"use client";

import { useState, ReactNode } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Home,
  Sparkles,
  History,
  User,
  Settings,
  LogOut,
  Heart,
  CreditCard,
  Zap,
  LifeBuoy,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Início",        href: "/dashboard", icon: Home },
  { name: "Analisar",      href: "/analyze",   icon: Sparkles },
  { name: "Histórico",     href: "/history",   icon: History },
  { name: "Planos",        href: "/pricing",   icon: CreditCard },
  { name: "Perfil",        href: "/profile",   icon: User },
  { name: "Configurações", href: "/settings",  icon: Settings },
];

function SidebarInner({
  pathname,
  session,
  onClose,
}: {
  pathname: string;
  session: ReturnType<typeof useSession>["data"];
  onClose: () => void;
}) {
  const initials = (name?: string | null) =>
    name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "U";

  return (
    <>
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-border/40 flex-shrink-0">
        <Link href="/" className="flex items-center gap-2.5">
          <motion.div
            whileHover={{ scale: 1.2, rotate: -10 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <Heart className="h-5 w-5 text-brand-500 fill-brand-500 flex-shrink-0" />
          </motion.div>
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            Flert<span className="text-brand-500">.</span>IA
          </span>
        </Link>
        <motion.button
          whileTap={{ rotate: 90, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="ml-auto lg:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </motion.button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navigation.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.name} href={item.href} onClick={onClose}>
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "text-foreground bg-accent/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-brand-500 rounded-r-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <item.icon
                  className={cn(
                    "h-4 w-4 flex-shrink-0 transition-colors",
                    active ? "text-brand-500" : "text-muted-foreground/50"
                  )}
                />
                {item.name}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Support */}
      <div className="px-2 pb-2">
        <a href="https://mail.google.com/mail/?view=cm&to=erickdev@flertia.com.br&su=Suporte Flert IA" target="_blank" rel="noopener noreferrer">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-border/30 hover:border-border/60 hover:bg-accent/20 transition-colors mb-1"
          >
            <div className="h-6 w-6 rounded-md bg-muted/80 flex items-center justify-center flex-shrink-0">
              <LifeBuoy className="h-3 w-3 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground leading-tight">Suporte</p>
              <p className="text-xs text-muted-foreground leading-tight">erickdev@flertia.com.br</p>
            </div>
          </motion.div>
        </a>
      </div>

      {/* Upgrade nudge */}
      <div className="px-2 pb-2">
        <Link href="/pricing">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-brand-500/15 bg-brand-500/5 hover:bg-brand-500/10 hover:border-brand-500/25 transition-colors"
          >
            <div className="h-6 w-6 rounded-md bg-brand-500/15 flex items-center justify-center flex-shrink-0">
              <Zap className="h-3 w-3 text-brand-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-brand-400 leading-tight">Seja Premium</p>
              <p className="text-xs text-muted-foreground leading-tight">Recursos ilimitados</p>
            </div>
          </motion.div>
        </Link>
      </div>

      {/* User */}
      <div className="px-2 pb-3 pt-2 border-t border-border/40 flex-shrink-0">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <Avatar className="h-7 w-7 flex-shrink-0">
            <AvatarImage src={session?.user?.image || undefined} />
            <AvatarFallback className="bg-brand-500/15 text-brand-400 text-xs font-semibold">
              {initials(session?.user?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate leading-tight">
              {session?.user?.name?.split(" ")[0] || "Usuário"}
            </p>
            <p className="text-xs text-muted-foreground/60 truncate leading-tight">
              {session?.user?.email || ""}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.88, rotate: 12 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            onClick={() => signOut({ callbackUrl: "/" })}
            title="Sair da conta"
            className="p-1.5 rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
          >
            <LogOut className="h-3.5 w-3.5" />
          </motion.button>
        </div>
      </div>
    </>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">

      {/* Mobile backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar — desktop (always visible via CSS) ── */}
      <aside className="fixed top-0 left-0 z-50 h-screen w-60 flex-col border-r border-border/40 bg-background/98 backdrop-blur-xl hidden lg:flex">
        <SidebarInner
          pathname={pathname}
          session={session}
          onClose={() => setSidebarOpen(false)}
        />
      </aside>

      {/* ── Sidebar — mobile (spring slide-in) ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            key="mobile-sidebar"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="fixed top-0 left-0 z-50 h-screen w-60 flex flex-col border-r border-border/40 bg-background/98 backdrop-blur-xl lg:hidden"
          >
            <SidebarInner
              pathname={pathname}
              session={session}
              onClose={() => setSidebarOpen(false)}
            />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Main ── */}
      <div className="lg:pl-60">
        {/* Mobile header */}
        <header className="h-14 border-b border-border/40 bg-background/95 backdrop-blur-xl sticky top-0 z-30 px-4 flex items-center justify-between lg:hidden">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-1 rounded-lg hover:bg-accent transition-colors"
          >
            <Menu className="h-4 w-4" />
          </motion.button>
          <Link href="/" className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-brand-500 fill-brand-500" />
            <span className="font-display text-base font-bold tracking-tight">
              Flert<span className="text-brand-500">.</span>IA
            </span>
          </Link>
          <div className="w-8" />
        </header>

        <main className="p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
