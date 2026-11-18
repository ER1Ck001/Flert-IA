import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renderiza como botão clicável por padrão", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Salvar</Button>);
    const btn = screen.getByRole("button", { name: "Salvar" });
    expect(btn).toBeEnabled();
    expect(btn).not.toHaveAttribute("aria-busy");
    await userEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("loading: fica desabilitado, aria-busy e não dispara onClick", async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Salvar
      </Button>
    );
    const btn = screen.getByRole("button", { name: /Salvar/ });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("aria-busy", "true");
    expect(btn.querySelector("svg")).not.toBeNull();
    await userEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renderiza as variantes primary/signal/danger (aliases legados removidos na 4.5)", () => {
    render(
      <>
        <Button variant="primary">A</Button>
        <Button variant="signal">B</Button>
        <Button variant="danger">C</Button>
      </>
    );
    const [a, b, c] = screen.getAllByRole("button");
    expect(a.className).toMatch(/bg-violet-600/);
    expect(b.className).toMatch(/bg-cta/);
    expect(c.className).toMatch(/bg-destructive/);
  });
});
