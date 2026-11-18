import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PLANS_IN_ORDER, formatBRL } from "@/lib/plans";
import { FAQ_ITEMS } from "@/content/faq";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { name: "Ana", email: "ana@example.com" } }, status: "authenticated" }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/pricing",
}));

vi.mock("react-hot-toast", () => ({
  default: { error: mocks.toastError, success: mocks.toastSuccess },
}));

import PricingPage from "@/app/(dashboard)/pricing/page";

function mockFetch(status = "FREE") {
  const fn = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === "/api/payment" && init?.method === "POST") {
      // Só muda o hash: o jsdom não implementa navegação completa.
      return { ok: true, status: 200, json: async () => ({ url: "http://localhost:3000/#checkout" }) } as Response;
    }
    if (url === "/api/payment") {
      return { ok: true, status: 200, json: async () => ({ status }) } as Response;
    }
    throw new Error(`rota não mockada: ${url}`);
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("Pricing page", () => {
  it("renderiza os 3 planos via PlanCard com os preços de plans.ts e o FAQ compartilhado", async () => {
    mockFetch();
    render(<PricingPage />);

    for (const plan of PLANS_IN_ORDER) {
      const card = document.getElementById(`plan-${plan.id.toLowerCase()}-title`)?.closest("article");
      expect(card, `card do plano ${plan.id}`).toBeTruthy();
      expect(within(card as HTMLElement).getByText(formatBRL(plan.priceCents))).toBeInTheDocument();
      expect(within(card as HTMLElement).getByRole("button", { name: new RegExp(plan.cta) })).toBeInTheDocument();
    }
    for (const item of FAQ_ITEMS) {
      expect(screen.getByText(item.q)).toBeInTheDocument();
    }
    expect(screen.getByText(/Política de reembolso/)).toBeInTheDocument();
  });

  it("assinar chama POST /api/payment com {plan:\"annual\"} e redireciona", async () => {
    const fetchMock = mockFetch();
    render(<PricingPage />);

    await userEvent.click(screen.getByRole("button", { name: /Assinar Anual/ }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "annual" }),
      })
    );
    await waitFor(() => expect(window.location.hash).toBe("#checkout"));
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Redirecionando...");
  });

  it("esconde planos inferiores ao vigente e bloqueia o Vitalício ativo", async () => {
    mockFetch("LIFETIME");
    render(<PricingPage />);

    await waitFor(() => expect(document.getElementById("plan-premium-title")).toBeNull());
    expect(document.getElementById("plan-annual-title")).toBeNull();
    expect(screen.getByRole("button", { name: /Plano ativo/ })).toBeDisabled();
  });
});
