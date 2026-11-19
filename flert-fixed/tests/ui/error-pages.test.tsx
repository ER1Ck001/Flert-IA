import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import NotFound from "@/app/not-found";
import RootError from "@/app/error";
import DashboardError from "@/app/(dashboard)/error";

describe("Páginas de erro (Tarefa 5)", () => {
  it("not-found em pt-BR com h1 e caminho de volta para a home", () => {
    render(<NotFound />);
    expect(screen.getByRole("heading", { level: 1, name: /Página não encontrada/ })).toBeInTheDocument();
    const home = screen.getByRole("link", { name: /Voltar ao início/ });
    expect(home).toHaveAttribute("href", "/");
    expect(screen.getByRole("main")).toHaveAttribute("id", "main");
  });

  it("error.tsx raiz anuncia o erro e 'Tentar novamente' chama reset()", async () => {
    const reset = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<RootError error={new Error("boom")} reset={reset} />);
    expect(screen.getByRole("alert")).toHaveTextContent(/Algo deu errado/);
    // Nunca vaza a mensagem técnica para o usuário.
    expect(screen.queryByText(/boom/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(reset).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: /Voltar ao início/ })).toHaveAttribute("href", "/");
  });

  it("error.tsx da área logada oferece tentar de novo e voltar ao painel", async () => {
    const reset = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<DashboardError error={new Error("x")} reset={reset} />);
    expect(screen.getByRole("alert")).toHaveTextContent(/Não foi possível carregar esta página/);
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(reset).toHaveBeenCalled();
    expect(screen.getByRole("link", { name: /Ir para o início/ })).toHaveAttribute("href", "/dashboard");
  });
});
