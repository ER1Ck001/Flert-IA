"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  History,
  TrendingUp,
  MessageCircle,
  Clock,
  CreditCard,
  CircleCheck,
  Hourglass,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { fadeUp, stagger, useMotionSafe } from "@/lib/motion";

function getGreeting(name?: string | null) {
  const h = new Date().getHours();
  const first = name?.split(" ")[0] || "você";
  if (h < 12) return `Bom dia, ${first}`;
  if (h < 18) return `Boa tarde, ${first}`;
  return `Boa noite, ${first}`;
}


const quickLinks = [
  { label: "Histórico",  href: "/history", icon: History },
  { label: "Ver planos", href: "/pricing", icon: CreditCard },
];

const steps = [
  { n: "01", t: "Envie o print",   d: "Mande o print da conversa ou descreva a situação." },
  { n: "02", t: "Escolha o tom",   d: "Flertando, engraçado, casual, afiado, cantada, stories e mais." },
  { n: "03", t: "Use a sugestão",  d: "3 opções para copiar, editar ou descartar." },
];

type StatsState = "loading" | "ok" | "error";

/** Aviso ao voltar do checkout (?payment=success). A URL de retorno é a mesma com ou sem pagamento
 *  concluído, então o texto se baseia no plano que /api/stats informa agora. */
function PaymentNotice({ isPaid }: { isPaid: boolean | null }) {
  if (isPaid === null) return null;
  return isPaid ? (
    <div role="status" className="flex items-start gap-3 rounded-lg border border-success/30 bg-success/10 p-4">
      <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden />
      <div className="min-w-0 text-sm">
        <p className="font-semibold text-text">Seu plano está ativo.</p>
        <p className="mt-0.5 text-text-2">Você já pode usar as análises.</p>
      </div>
    </div>
  ) : (
    <div role="status" className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4">
      <Hourglass className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden />
      <div className="min-w-0 text-sm">
        <p className="font-semibold text-text">Ainda não recebemos a confirmação do pagamento.</p>
        <p className="mt-0.5 text-text-2">
          Se você concluiu o pagamento, a ativação pode levar alguns minutos — recarregue esta página daqui a
          pouco. Se não concluiu, você pode tentar de novo em{" "}
          <Link href="/pricing" className="font-medium text-violet-400 underline underline-offset-4">Planos</Link>.
        </p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({ total: 0, thisWeek: 0 });
  const [statsState, setStatsState] = useState<StatsState>("loading");
  const [isPaid, setIsPaid] = useState<boolean | null>(null);
  const [fromCheckout, setFromCheckout] = useState(false);

  // Retorno do checkout: lido do window (evita exigir Suspense para useSearchParams).
  useEffect(() => {
    setFromCheckout(new URLSearchParams(window.location.search).get("payment") === "success");
  }, []);
  const container = useMotionSafe(stagger(0.06));
  const item = useMotionSafe(fadeUp);

  useEffect(() => {
    setMounted(true);
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/stats")
        .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
        .then((d) => {
          setStats({ total: d.total ?? 0, thisWeek: d.thisWeek ?? 0 });
          setIsPaid(Boolean(d.isPaid));
          setStatsState("ok");
        })
        .catch(() => setStatsState("error"));
    }
  }, [status]);

  if (!mounted || status === "loading") {
    return (
      <div role="status" className="flex items-center justify-center min-h-[60vh] text-violet-400">
        <Spinner size="lg" />
        <span className="sr-only">Carregando…</span>
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-3xl space-y-8"
      variants={container}
      initial="hidden"
      animate="show"
    >

      {/* ── Greeting ── */}
      <motion.div variants={item}>
        <PageHeader
          className="mb-0"
          eyebrow="Início"
          title={getGreeting(session?.user?.name)}
          description="O que você quer responder hoje?"
        />
      </motion.div>

      {fromCheckout && (
        <motion.div variants={item}>
          <PaymentNotice isPaid={isPaid} />
        </motion.div>
      )}

      {/* ── Primary CTA ── */}
      <motion.div variants={item}>
        <Link
          href="/analyze"
          className="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          <Card className="border-signal border-transparent relative overflow-hidden p-5 shadow-glow-violet transition-shadow duration-200 group-hover:shadow-glow-pink sm:p-6">
            {/* brilho ambiente (gradiente, sem blur) */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[radial-gradient(closest-side,rgb(var(--pink-500)/.18),transparent)]"
            />
            <div className="relative flex items-center gap-4">
              <span
                aria-hidden
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-cta text-white"
              >
                <Sparkles className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-caption uppercase text-violet-400">Ação principal</p>
                <h2 className="font-display text-h3 text-text">Analisar conversa</h2>
                <p className="mt-0.5 text-sm text-text-2">
                  Envie um print ou descreva a situação e receba 3 sugestões
                </p>
              </div>
              <ArrowRight
                aria-hidden
                className="h-5 w-5 shrink-0 text-text-2 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-text motion-reduce:transition-none"
              />
            </div>
          </Card>
        </Link>
      </motion.div>

      {/* ── Stats ── */}
      <motion.section variants={item} aria-labelledby="dash-stats">
        <h2 id="dash-stats" className="mb-3 text-caption uppercase text-text-2">
          Seus números
        </h2>
        {statsState === "error" && (
          <p className="mb-3 text-sm text-text-2">Não foi possível carregar seus números agora.</p>
        )}
        <ul className="grid grid-cols-3 gap-2 sm:gap-3" aria-busy={statsState === "loading" || undefined}>
          {[
            { label: "Análises",           value: stats.total,         icon: MessageCircle },
            { label: "Esta semana",        value: stats.thisWeek,      icon: Clock },
            { label: "Sugestões geradas",  value: stats.total * 3,     icon: TrendingUp },
          ].map((stat) => (
            <li key={stat.label} className="min-w-0">
              <Card className="flex h-full flex-col gap-1 px-3 py-4 sm:px-4">
                <stat.icon className="h-4 w-4 text-violet-400" aria-hidden />
                <p className="font-display text-h2 tabular-nums text-text">
                  {statsState === "ok" ? stat.value : <><span aria-hidden>—</span><span className="sr-only">{statsState === "loading" ? "carregando" : "indisponível"}</span></>}
                </p>
                <p className="text-xs leading-tight text-text-2 sm:text-sm">{stat.label}</p>
              </Card>
            </li>
          ))}
        </ul>
      </motion.section>

      {/* ── Quick links ── */}
      <motion.section variants={item} aria-labelledby="dash-links">
        <h2 id="dash-links" className="mb-3 text-caption uppercase text-text-2">
          Acesso rápido
        </h2>
        <div className="flex flex-wrap gap-2">
          {quickLinks.map((link) => (
            <Button key={link.href} asChild variant="secondary" leftIcon={<link.icon className="h-4 w-4" aria-hidden />}>
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </div>
      </motion.section>

      {/* ── How it works ── */}
      <motion.section variants={item} aria-labelledby="dash-how">
        <Card variant="outline" className="p-5">
          <h2 id="dash-how" className="mb-4 text-caption uppercase text-text-2">
            Como funciona
          </h2>
          <ol className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {steps.map((step) => (
              <li key={step.n} className="flex gap-3 sm:flex-col sm:gap-1">
                <span className="text-sm font-bold text-violet-400" aria-hidden>{step.n}</span>
                <div>
                  <p className="text-sm font-semibold text-text">{step.t}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-text-2">{step.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </motion.section>

    </motion.div>
  );
}
