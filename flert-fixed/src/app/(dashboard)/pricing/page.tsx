"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Info } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { PLANS_IN_ORDER, type CheckoutKey, type PaidPlan, type PlanConfig } from "@/lib/plans";
import { FAQ_ITEMS } from "@/content/faq";
import { PlanCard } from "@/components/plans/PlanCard";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

type Plan = {
  id: CheckoutKey;
  planId: PaidPlan;
  cta: string;
  featured: boolean;
  config: PlanConfig;
};

// Tudo derivado da fonte única de planos — preços, limites e benefícios reais (renderizados pelo PlanCard).
const plans: Plan[] = PLANS_IN_ORDER.map((p) => ({
  id: p.checkoutKey,
  planId: p.id,
  cta: p.cta,
  featured: Boolean(p.badge),
  config: p,
}));

const faqs = FAQ_ITEMS;

const RANK: Record<string, number> = { FREE: 0, PREMIUM: 1, ANNUAL: 2, LIFETIME: 3 };

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  // Após receber a URL do checkout o navegador ainda leva um instante para sair da página:
  // mantém o botão ocupado e os demais desativados para não criar um segundo checkout.
  const [redirecting, setRedirecting] = useState<string | null>(null);

  // Voltou do checkout pelo botão "voltar" (página restaurada do bfcache): libera os botões.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => { if (e.persisted) setRedirecting(null); };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);
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
      setRedirecting(plan);
      window.location.href = data.url;
    } catch {
      toast.error("Erro ao processar. Tente novamente.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-app space-y-10">
      <PageHeader
        eyebrow="Planos"
        title="Escolha seu plano"
        description="Todos os planos têm os mesmos recursos. Mudam o limite diário, a duração e as formas de pagamento."
        className="mb-0"
      />

      {/* ── Planos ── */}
      <div
        className={cn(
          "mx-auto grid w-full gap-4",
          visiblePlans.length === 1 ? "max-w-sm" : visiblePlans.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"
        )}
      >
        {visiblePlans.map((plan) => {
          const isRedirecting = redirecting === plan.id;
          const isLoading = loading === plan.id || isRedirecting;
          const blocked = isBlocked(plan);

          return (
            <PlanCard
              key={plan.id}
              plan={plan.config}
              headingLevel="h2"
              action={
                <Button
                  variant={blocked ? "secondary" : plan.featured ? "signal" : "secondary"}
                  size="lg"
                  className="w-full"
                  loading={isLoading}
                  disabled={blocked || (redirecting !== null && !isRedirecting)}
                  leftIcon={blocked ? <Check className="h-4 w-4" aria-hidden /> : undefined}
                  onClick={() => !isBlocked(plan) && handleSubscribe(plan.id)}
                >
                  {blocked
                    ? "Plano ativo"
                    : isRedirecting
                    ? "Redirecionando..."
                    : isLoading
                    ? "Processando..."
                    : isActivePlan(plan.planId)
                    ? "Plano ativo · Renovar"
                    : plan.cta}
                </Button>
              }
            />
          );
        })}
      </div>

      {/* ── FAQ ── */}
      <section aria-labelledby="pricing-faq-title">
        <h2 id="pricing-faq-title" className="mb-4 font-display text-h2 text-text">
          Dúvidas frequentes
        </h2>
        <div className="space-y-3">
          {faqs.map((item) => (
            <details key={item.q} className="group rounded-lg border border-border bg-surface">
              <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 rounded-lg px-5 py-4 text-left text-body font-medium text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 [&::-webkit-details-marker]:hidden">
                <span>{item.q}</span>
                <ChevronDown
                  className="h-5 w-5 shrink-0 text-text-2 transition-transform duration-200 group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <p className="px-5 pb-5 text-sm text-text-2">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Política de reembolso ── */}
      <div className="flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-violet-400" aria-hidden />
        <p className="text-sm leading-relaxed text-text-2">
          <span className="font-semibold text-text">Política de reembolso: </span>
          você pode pedir o reembolso <strong className="text-text">integral</strong> em até <strong className="text-text">7 dias</strong> após a compra (direito de arrependimento, art. 49 do CDC). O pedido é feito por e-mail e atendido manualmente; o estorno segue o prazo do meio de pagamento. Para pedir, fale com o{" "}
          <a
            href="https://mail.google.com/mail/?view=cm&to=erickdev@flertia.com.br&su=Solicita%C3%A7%C3%A3o%20de%20Reembolso"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm font-medium text-violet-400 underline underline-offset-4 transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            suporte
          </a>.
        </p>
      </div>
    </div>
  );
}
