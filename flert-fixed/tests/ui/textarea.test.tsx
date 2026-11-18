import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Textarea } from "@/components/ui/textarea";

describe("Textarea showCount", () => {
  it("mostra contador que acompanha a digitação sem anunciar cada tecla", async () => {
    render(<Textarea aria-label="Contexto" showCount maxLength={100} />);
    const counter = screen.getByText("0/100");
    // O contador visível não é uma região viva (leitores de tela anunciariam cada tecla).
    expect(counter.closest("[aria-live]:not([aria-live=off])")).toBeNull();
    await userEvent.type(screen.getByRole("textbox", { name: "Contexto" }), "olá!");
    expect(screen.getByText("4/100")).toBeInTheDocument();
  });

  it("perto do limite anuncia os caracteres restantes numa região polite", async () => {
    render(<Textarea aria-label="Contexto" showCount maxLength={10} />);
    const live = screen.getByTestId("textarea-count-live");
    expect(live).toHaveAttribute("aria-live", "polite");
    expect(live).toBeEmptyDOMElement();
    await userEvent.type(screen.getByRole("textbox", { name: "Contexto" }), "123456789");
    expect(live).toHaveTextContent("Resta 1 caractere");
  });

  it("funciona controlado (value externo)", () => {
    render(<Textarea aria-label="C" showCount maxLength={50} value="abc" onChange={() => {}} />);
    expect(screen.getByText("3/50")).toBeInTheDocument();
  });

  it("sem showCount não renderiza contador", () => {
    render(<Textarea aria-label="C" maxLength={50} />);
    expect(screen.queryByText("0/50")).toBeNull();
  });

  it("invalid marca aria-invalid", () => {
    render(<Textarea aria-label="C" invalid />);
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });
});
