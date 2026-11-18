import { PLANS_IN_ORDER } from "@/lib/plans";
import { PlanCard } from "@/components/plans/PlanCard";
import { Section } from "./Section";

export function PlansSection() {
  return (
    <Section
      id="planos"
      eyebrow="Planos"
      title="Escolha seu plano"
      description="Crie sua conta e escolha o plano que faz sentido para você. Valores em reais, sem cobrança automática."
    >
      <ul className="grid gap-4 md:grid-cols-3">
        {PLANS_IN_ORDER.map((plan) => (
          <li key={plan.id}>
            <PlanCard plan={plan} />
          </li>
        ))}
      </ul>
    </Section>
  );
}
