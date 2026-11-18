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

  it("aceita aliases legados de variante sem quebrar", () => {
    render(
      <>
        <Button variant="brand">A</Button>
        <Button variant="destructive">B</Button>
        <Button variant="default">C</Button>
      </>
    );
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });
});
