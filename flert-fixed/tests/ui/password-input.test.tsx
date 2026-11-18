import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PasswordInput } from "@/components/ui/password-input";

describe("PasswordInput", () => {
  it("alterna visibilidade com botão focável e rotulado", async () => {
    render(<PasswordInput aria-label="Senha" autoComplete="current-password" />);
    const input = screen.getByLabelText("Senha");
    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveAttribute("autocomplete", "current-password");

    const toggle = screen.getByRole("button", { name: "Mostrar senha" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(toggle).not.toHaveAttribute("tabindex", "-1");
    expect(toggle).toHaveAttribute("type", "button");

    await userEvent.click(toggle);
    expect(input).toHaveAttribute("type", "text");
    const hide = screen.getByRole("button", { name: "Ocultar senha" });
    expect(hide).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(hide);
    expect(input).toHaveAttribute("type", "password");
  });

  it("alcançável por Tab a partir do campo", async () => {
    render(<PasswordInput aria-label="Senha" />);
    await userEvent.tab();
    expect(screen.getByLabelText("Senha")).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Mostrar senha" })).toHaveFocus();
  });
});
