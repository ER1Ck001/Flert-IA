import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard" }));
vi.mock("next-auth/react", () => ({ signOut: vi.fn() }));

import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { AuthShell, AuthDivider } from "@/components/auth/AuthShell";
import { AppSidebar } from "@/components/app/AppSidebar";

// jsdom não calcula layout: checamos as classes que garantem altura mínima de 44px.
const TALL = /\b(min-h-11|h-11|min-h-\[44px\]|h-12|min-h-\[48px\])\b/;

describe("Alvos de toque ≥44px e contraste (Tarefa 5)", () => {
  it("botões Entrar/Criar conta do header da landing têm ≥44px", () => {
    render(<LandingHeader />);
    for (const name of ["Entrar", "Criar conta"]) {
      expect(screen.getByRole("link", { name }).className).toMatch(TALL);
    }
  });

  it("links do rodapé da landing têm ≥44px", () => {
    render(<LandingFooter />);
    expect(screen.getByRole("link", { name: /Suporte/ }).className).toMatch(TALL);
    expect(screen.getByRole("button", { name: /Preferências de cookies/ }).className).toMatch(TALL);
  });

  it("AuthShell: main é focável pelo skip link e não usa text-3 em texto de 12px", () => {
    const { container } = render(
      <AuthShell title="Entrar">
        <AuthDivider label="ou" />
      </AuthShell>
    );
    expect(container.querySelector("main#main")).toHaveAttribute("tabindex", "-1");
    const offenders = Array.from(container.querySelectorAll(".text-caption.text-text-3"));
    expect(offenders).toHaveLength(0);
  });

  it("sidebar não promete 'Recursos ilimitados'", () => {
    render(<AppSidebar user={{ id: "u", name: "Ana", email: "a@b.c" }} />);
    expect(screen.queryByText(/Recursos ilimitados/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Suporte/ }).className).toMatch(TALL);
  });
});
