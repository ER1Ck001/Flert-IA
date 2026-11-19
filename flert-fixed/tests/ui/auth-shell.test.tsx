import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthShell } from "@/components/auth/AuthShell";

describe("AuthShell", () => {
  it("renderiza main#main (alvo do skip link), logo e children", () => {
    const { container } = render(
      <AuthShell title="Entrar" description="Acesse sua conta.">
        <p>conteúdo do formulário</p>
      </AuthShell>
    );

    const main = container.querySelector("main#main");
    expect(main).not.toBeNull();
    expect(screen.getByRole("main")).toBe(main);

    expect(screen.getByRole("heading", { level: 1, name: "Entrar" })).toBeInTheDocument();
    expect(screen.getByText("Acesse sua conta.")).toBeInTheDocument();
    expect(screen.getByText("conteúdo do formulário")).toBeInTheDocument();

    // Logo linkando para a home (pelo menos um, com nome acessível).
    const homeLinks = screen.getAllByRole("link", { name: /Flert IA/i });
    expect(homeLinks.length).toBeGreaterThan(0);
    expect(homeLinks[0]).toHaveAttribute("href", "/");
  });

  it("copy do painel de marca é neutra (sem 'conquistar' nem promessas)", () => {
    const { container } = render(
      <AuthShell title="Entrar">
        <span />
      </AuthShell>
    );
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/conquist/i);
    expect(text).not.toMatch(/garant/i);
  });
});
