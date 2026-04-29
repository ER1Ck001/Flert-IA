"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  History,
  TrendingUp,
  MessageCircle,
  Clock,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

function getGreeting(name?: string | null) {
  const h = new Date().getHours();
  const first = name?.split(" ")[0] || "você";
  if (h < 12) return `Bom dia, ${first}`;
  if (h < 18) return `Boa tarde, ${first}`;
  return `Boa noite, ${first}`;
}

const stats = [
  { label: "Análises",       value: "12",  icon: MessageCircle },
  { label: "Esta semana",    value: "5",   icon: Clock },
  { label: "Taxa de sucesso", value: "95%", icon: TrendingUp },
];

const quickLinks = [
  { label: "Histórico",     href: "/history", icon: History },
  { label: "Ver planos",    href: "/pricing", icon: CreditCard },
];

const steps = [
  { n: "01", t: "Upload do print",   d: "Envie a screenshot da conversa" },
  { n: "02", t: "Escolha o tom",     d: "Flertando, engraçado, casual..." },
  { n: "03", t: "Use a sugestão",    d: "3 opções prontas para copiar" },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);

  if (!mounted || status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-7 w-7 rounded-full border-2 border-brand-500/20 border-t-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-10">

      {/* ── Greeting ── */}
      <div className="animate-fade-in">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          {getGreeting(session?.user?.name)}
        </h1>
        <p className="text-muted-foreground text-sm mt-1.5">
          Pronto para conquistar mais conversas hoje?
        </p>
      </div>

      {/* ── Primary CTA ── */}
      <Link href="/analyze" className="block group">
        <div className="relative overflow-hidden rounded-2xl border border-brand-500/20 bg-brand-500/[0.04] p-6 hover:border-brand-500/35 hover:bg-brand-500/[0.07] transition-all duration-200">
          {/* ambient glow */}
          <div className="absolute -top-20 -right-20 w-56 h-56 bg-brand-500/[0.08] rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex items-center gap-5">
            <div className="h-12 w-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5 text-brand-400" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest text-brand-400/70 mb-0.5">
                Ação principal
              </p>
              <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
                Analisar conversa
              </h2>
              <p className="text-muted-foreground text-sm mt-0.5">
                Envie um print e receba sugestões personalizadas com IA
              </p>
            </div>

            <ArrowRight className="h-5 w-5 text-brand-400/50 group-hover:text-brand-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
          </div>
        </div>
      </Link>

      {/* ── Stats ── */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
          Seus números
        </p>
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border/50 bg-card/40 px-4 py-4 hover:border-border/80 transition-colors"
            >
              <div className="font-display text-2xl font-bold tracking-tight text-foreground">
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5 leading-tight">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick links ── */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
          Acesso rápido
        </p>
        <div className="flex flex-wrap gap-2">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <div className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-full border text-sm font-medium",
                "border-border/50 bg-card/30 text-muted-foreground",
                "hover:text-foreground hover:border-border hover:bg-accent/40 transition-all duration-150"
              )}>
                <link.icon className="h-3.5 w-3.5" />
                {link.label}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <div className="rounded-2xl border border-border/40 bg-card/20 p-5">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
          Como funciona
        </p>
        <div className="grid grid-cols-3 gap-4">
          {steps.map((step) => (
            <div key={step.n}>
              <span className="text-xs font-bold text-brand-500/50">{step.n}</span>
              <p className="text-sm font-semibold text-foreground mt-0.5">{step.t}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.d}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
