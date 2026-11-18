"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Check, Zap, Crown, Star } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import {
  PLANS_IN_ORDER,
  annualSavingsCents,
  formatBRL,
  getPlanBenefits,
  type CheckoutKey,
  type PaidPlan,
} from "@/lib/plans";
import { FAQ_ITEMS } from "@/content/faq";

type Plan = {
  id: CheckoutKey;
  planId: PaidPlan;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  icon: React.ElementType;
  featured: boolean;
  badge?: string;
};

const ICONS: Record<PaidPlan, React.ElementType> = { PREMIUM: Zap, ANNUAL: Star, LIFETIME: Crown };
const DESCRIPTIONS: Record<PaidPlan, string> = {
  PREMIUM: "Para começar",
  ANNUAL: `Economize ${formatBRL(annualSavingsCents())} em relação a 12 meses do Mensal`,
  LIFETIME: "Pague uma vez, use sem mensalidade",
};

// Tudo derivado da fonte única de planos — preços, limites e benefícios reais.
const plans: Plan[] = PLANS_IN_ORDER.map((p) => ({
  id: p.checkoutKey,
  planId: p.id,
  name: p.label,
  price: formatBRL(p.priceCents),
  period: p.periodLabel,
  description: DESCRIPTIONS[p.id],
  features: getPlanBenefits(p.id),
  cta: p.cta,
  icon: ICONS[p.id],
  featured: Boolean(p.badge),
  badge: p.badge,
}));

const faqs = FAQ_ITEMS;

const RANK: Record<string, number> = { FREE: 0, PREMIUM: 1, ANNUAL: 2, LIFETIME: 3 };

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<string>("FREE");

  useEffect(() => {
    fetch("/api/payment")
      .then((r) => r.json())
      .then((d) => setUserStatus(d.status || "FREE"))
      .catch(() => {});
  }, []);

  // Esconde planos inferiores ao vigente (ninguém é rebaixado).
  const visiblePlans = plans.filter((p) => RANK[p.planId] >= (RANK[userStatus] ?? 0));

  const isActivePlan = (planId: PaidPlan) => userStatus === planId;
  // Renovar o plano vigente é permitido (o período é somado); só o Vitalício não tem o que renovar.
  const isBlocked = (p: Plan) => isActivePlan(p.planId) && p.planId === "LIFETIME";

  const handleSubscribe = async (plan: string) => {
    if (!session) { router.push("/auth/login"); return; }
    setLoading(plan);
    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok)  { toast.error(data.error || "Erro ao processar");       return; }
      if (!data.url){ toast.error("URL de pagamento não recebida");         return; }
      toast.success("Redirecionando...");
      window.location.href = data.url;
    } catch {
      toast.error("Erro ao processar. Tente novamente.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-3xl space-y-10">

      {/* ── Header ── */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
          Planos
        </p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Escolha seu plano
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Todos os planos incluem os mesmos recursos — muda só o limite diário de análises.
        </p>
      </div>

      {/* ── Plans grid ── */}
      <div className={cn("grid gap-4 max-w-3xl mx-auto w-full", visiblePlans.length === 1 ? "max-w-sm" : visiblePlans.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3")}>
        {visiblePlans.map((plan) => {
          const Icon = plan.icon;
          const isLoading = loading === plan.id;

          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-2xl border p-5 transition-all duration-200",
                plan.featured
                  ? "border-brand-500/35 bg-brand-500/[0.04] shadow-lg shadow-brand-500/[0.08]"
                  : "border-border/50 bg-card/20 hover:border-border/80"
              )}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-brand-500 text-white text-[11px] font-bold shadow-md shadow-brand-500/30">
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan info */}
              <div className="mb-5">
                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center mb-3.5",
                  plan.featured ? "bg-brand-500/15" : "bg-muted/80"
                )}>
                  <Icon className={cn(
                    "h-4 w-4",
                    plan.featured ? "text-brand-400" : "text-muted-foreground"
                  )} />
                </div>

                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-1 mb-0.5">
                  <span className="font-display text-2xl font-bold tracking-tight text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-xs text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-xs text-muted-foreground">{plan.description}</p>
              </div>

              {/* Features */}
              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <div className={cn(
                      "h-3.5 w-3.5 rounded-full flex items-center justify-center flex-shrink-0",
                      plan.featured ? "bg-brand-500/20" : "bg-muted"
                    )}>
                      <Check className={cn(
                        "h-2 w-2",
                        plan.featured ? "text-brand-400" : "text-muted-foreground/60"
                      )} />
                    </div>
                    <span className={plan.featured ? "text-foreground/90" : "text-muted-foreground"}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                disabled={isLoading || isBlocked(plan)}
                onClick={() => !isBlocked(plan) && handleSubscribe(plan.id)}
                className={cn(
                  "w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-150",
                  isBlocked(plan)
                    ? "bg-brand-500/10 border border-brand-500/30 text-brand-400 cursor-default"
                    : plan.featured
                    ? "bg-brand-500 hover:bg-brand-600 text-white shadow-sm shadow-brand-500/20 hover:shadow-brand-500/35"
                    : "border border-border/60 hover:border-brand-500/25 hover:bg-brand-500/5 text-foreground",
                  isLoading && "opacity-60 cursor-wait"
                )}
              >
                {isBlocked(plan) ? (
                  <span className="flex items-center justify-center gap-2">
                    <Check className="h-3.5 w-3.5" />
                    Plano ativo
                  </span>
                ) : isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-3 w-3 rounded-full border-[1.5px] border-current border-t-transparent animate-spin" />
                    Processando...
                  </span>
                ) : isActivePlan(plan.planId) ? (
                  "Plano ativo · Renovar"
                ) : (
                  plan.cta
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* ── FAQ ── */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
          Dúvidas frequentes
        </p>
        <div className="grid md:grid-cols-2 gap-3">
          {faqs.map((item, i) => (
            <div key={i} className="p-4 rounded-xl border border-border/40 bg-card/20">
              <p className="text-sm font-medium text-foreground mb-1">{item.q}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Refund policy notice ── */}
      <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl border border-border/30 bg-card/10">
        <div className="h-5 w-5 rounded-full bg-muted/60 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-[10px]">ℹ</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground/70">Política de reembolso: </span>
          O reembolso é disponível exclusivamente para usuários que realizaram <strong className="text-foreground/70">no máximo 1 análise</strong> e solicitaram dentro de <strong className="text-foreground/70">12 horas</strong> após a compra. Fora dessas condições, não haverá reembolso. Para solicitar, entre em contato pelo{" "}
          <a
            href="https://mail.google.com/mail/?view=cm&to=erickdev@flertia.com.br&su=Solicita%C3%A7%C3%A3o%20de%20Reembolso"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-400 hover:text-brand-300 transition-colors"
          >
            suporte
          </a>.
        </p>
      </div>

    </div>
  );
}
