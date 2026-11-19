import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const pathname = vi.hoisted(() => ({ value: "/dashboard" }));
vi.mock("next/navigation", () => ({
  usePathname: () => pathname.value,
}));

import { BottomNav } from "@/components/app/BottomNav";

describe("BottomNav", () => {
  beforeEach(() => {
    pathname.value = "/dashboard";
  });

  it("tem 5 alvos e marca data-bottom-nav", () => {
    const { container } = render(<BottomNav onOpenAccount={() => {}} />);
    expect(container.querySelector("[data-bottom-nav]")).not.toBeNull();
    expect(screen.getByRole("navigation", { name: /principal/i })).toBeInTheDocument();
    for (const name of ["Início", "Histórico", "Analisar", "Planos"]) {
      expect(screen.getByRole("link", { name })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: "Conta" })).toBeInTheDocument();
  });

  it("destinos preservados", () => {
    render(<BottomNav onOpenAccount={() => {}} />);
    expect(screen.getByRole("link", { name: "Início" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: "Histórico" })).toHaveAttribute("href", "/history");
    expect(screen.getByRole("link", { name: "Analisar" })).toHaveAttribute("href", "/analyze");
    expect(screen.getByRole("link", { name: "Planos" })).toHaveAttribute("href", "/pricing");
  });

  it("aria-current=page só no item da rota atual", () => {
    pathname.value = "/history";
    render(<BottomNav onOpenAccount={() => {}} />);
    expect(screen.getByRole("link", { name: "Histórico" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Início" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Analisar" })).not.toHaveAttribute("aria-current");
  });

  it("subrotas contam como ativas (startsWith)", () => {
    pathname.value = "/analyze/qualquer";
    render(<BottomNav onOpenAccount={() => {}} />);
    expect(screen.getByRole("link", { name: "Analisar" })).toHaveAttribute("aria-current", "page");
  });

  it("Conta abre a folha da conta", async () => {
    const onOpenAccount = vi.fn();
    render(<BottomNav onOpenAccount={onOpenAccount} />);
    await userEvent.click(screen.getByRole("button", { name: "Conta" }));
    expect(onOpenAccount).toHaveBeenCalledTimes(1);
  });
});
