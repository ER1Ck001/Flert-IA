import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { name: "Ana Lima", email: "ana@example.com" } }, status: "authenticated" }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/dashboard",
}));

import DashboardPage from "@/app/(dashboard)/dashboard/page";

function mockStats(reply: { status?: number; body: unknown }) {
  const fn = vi.fn(async () => {
    const status = reply.status ?? 200;
    return { ok: status < 300, status, json: async () => reply.body } as Response;
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

const T = { timeout: 3000 };

describe("Dashboard page", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("copy sem promessa de resultado", async () => {
    mockStats({ body: { total: 2, thisWeek: 1, isPaid: true } });
    const { container } = render(<DashboardPage />);
    await screen.findByRole("heading", { level: 1 }, T);
    expect(container.textContent).not.toMatch(/conquist/i);
  });

  it("mostra os números quando /api/stats responde", async () => {
    mockStats({ body: { total: 4, thisWeek: 2, isPaid: true } });
    render(<DashboardPage />);
    expect(await screen.findByText("12", undefined, T)).toBeInTheDocument(); // 4 × 3 sugestões
  });

  it("erro em /api/stats não mostra zeros falsos", async () => {
    mockStats({ status: 500, body: { error: "x" } });
    render(<DashboardPage />);
    expect(await screen.findByText(/Não foi possível carregar seus números/, undefined, T)).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("retorno do checkout com plano já ativo confirma a ativação", async () => {
    window.history.replaceState(null, "", "/dashboard?payment=success");
    mockStats({ body: { total: 0, thisWeek: 0, isPaid: true } });
    render(<DashboardPage />);
    const status = await screen.findByText(/Seu plano está ativo/, undefined, T);
    expect(status.closest("[role=status]")).not.toBeNull();
    expect(screen.getByRole("link", { name: /Analisar conversa/ })).toHaveAttribute("href", "/analyze");
  });

  it("retorno do checkout sem confirmação ainda explica com honestidade", async () => {
    window.history.replaceState(null, "", "/dashboard?payment=success");
    mockStats({ body: { total: 0, thisWeek: 0, isPaid: false } });
    render(<DashboardPage />);
    expect(await screen.findByText(/ainda não recebemos a confirmação/i, undefined, T)).toBeInTheDocument();
  });

  it("sem ?payment não mostra aviso de pagamento", async () => {
    mockStats({ body: { total: 0, thisWeek: 0, isPaid: true } });
    render(<DashboardPage />);
    await screen.findByRole("heading", { level: 1 }, T);
    expect(screen.queryByText(/Seu plano está ativo/)).not.toBeInTheDocument();
  });
});
