import * as React from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  annualSavingsCents,
  formatBRL,
  getPlanBenefits,
  methodsLabel,
  type PaidPlan,
  type PlanConfig,
} from "@/lib/plans";

/** Descrição curta de cada plano — só fatos derivados de plans.ts. */
export function planDescription(id: PaidPlan): string {
  switch (id) {
    case "PREMIUM":
      return "Para começar";
    case "ANNUAL":
      return `Economize ${formatBRL(annualSavingsCents())} em relação a 12 meses do Mensal`;
    case "LIFETIME":
      return "Pague uma vez, use sem mensalidade";
  }
}

export interface PlanCardProps {
  plan: PlanConfig;
  /** Substitui o CTA padrão (link "Criar conta" → /auth/register). */
  action?: React.ReactNode;
  ctaHref?: string;
  ctaLabel?: string;
  headingLevel?: "h2" | "h3";
  className?: string;
}

/** Card de plano reutilizável (landing e /pricing). Preço, benefícios e selo vêm de plans.ts. */
export function PlanCard({
  plan,
  action,
  ctaHref = "/auth/register",
  ctaLabel = "Criar conta",
  headingLevel = "h3",
  className,
}: PlanCardProps) {
  const Heading = headingLevel;
  const highlighted = Boolean(plan.badge);
  const benefits = getPlanBenefits(plan.id);
  const titleId = `plan-${plan.id.toLowerCase()}-title`;

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        "relative flex h-full flex-col rounded-lg p-6 shadow-1",
        highlighted ? "border-signal shadow-glow-pink" : "border border-border bg-surface",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <Heading id={titleId} className="font-display text-h3 text-text">
          {plan.label}
        </Heading>
        {plan.badge && (
          <Badge variant="signal" data-testid="plan-badge">
            {plan.badge}
          </Badge>
        )}
      </div>
      <p className="mt-1 text-sm text-text-2">{planDescription(plan.id)}</p>

      <p className="mt-5 flex flex-wrap items-baseline gap-x-2">
        <span className="font-display text-[2rem] font-extrabold leading-none tracking-tight text-text">
          {formatBRL(plan.priceCents)}
        </span>
        <span className="text-sm text-text-2">{plan.periodLabel}</span>
      </p>
      <p className="mt-2 text-sm text-text-2">Pagamento: {methodsLabel(plan.methods)}</p>

      <ul className="mt-5 flex-1 space-y-2.5" aria-label={`Benefícios do plano ${plan.label}`}>
        {benefits.map((b) => (
          <li key={b} className="flex items-start gap-2.5 text-sm text-text">
            <Check className="mt-0.5 h-4 w-4 text-success" aria-hidden />
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        {action ?? (
          <Button asChild variant={highlighted ? "signal" : "secondary"} size="lg" className="w-full">
            <Link href={ctaHref} aria-label={`${ctaLabel} — plano ${plan.label}`}>
              {ctaLabel}
            </Link>
          </Button>
        )}
      </div>
    </article>
  );
}
