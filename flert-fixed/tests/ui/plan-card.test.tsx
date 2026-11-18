import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlanCard } from "@/components/plans/PlanCard";
import { PLAN_CONFIG, PLANS_IN_ORDER, formatBRL, getPlanBenefits } from "@/lib/plans";

describe("PlanCard", () => {
  it.each(PLANS_IN_ORDER.map((p) => [p.id, p] as const))("%s mostra o preço de plans.ts", (_id, plan) => {
    render(<PlanCard plan={plan} />);
    expect(screen.getByText(formatBRL(PLAN_CONFIG[plan.id].priceCents))).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: plan.label })).toBeInTheDocument();
  });

  it("lista os benefícios de getPlanBenefits", () => {
    render(<PlanCard plan={PLAN_CONFIG.PREMIUM} />);
    for (const b of getPlanBenefits("PREMIUM")) {
      expect(screen.getByText(b)).toBeInTheDocument();
    }
  });

  it("mostra o selo só quando o plano tem badge", () => {
    const { unmount } = render(<PlanCard plan={PLAN_CONFIG.PREMIUM} />);
    expect(screen.queryByTestId("plan-badge")).not.toBeInTheDocument();
    unmount();
    render(<PlanCard plan={PLAN_CONFIG.LIFETIME} />);
    expect(screen.getByTestId("plan-badge")).toHaveTextContent(PLAN_CONFIG.LIFETIME.badge!);
  });

  it("CTA padrão leva para /auth/register", () => {
    render(<PlanCard plan={PLAN_CONFIG.ANNUAL} />);
    expect(screen.getByRole("link", { name: /Criar conta/i })).toHaveAttribute("href", "/auth/register");
  });

  it("não usa alegações sem dados", () => {
    const { container } = render(
      <>
        {PLANS_IN_ORDER.map((p) => (
          <PlanCard key={p.id} plan={p} />
        ))}
      </>
    );
    expect(container.textContent).not.toMatch(/mais popular|melhor escolha/i);
  });
});
