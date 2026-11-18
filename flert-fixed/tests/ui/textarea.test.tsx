import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Textarea } from "@/components/ui/textarea";

describe("Textarea showCount", () => {
  it("mostra contador aria-live que acompanha a digitação", async () => {
    render(<Textarea aria-label="Contexto" showCount maxLength={100} />);
    const counter = screen.getByText("0/100");
    expect(counter).toHaveAttribute("aria-live", "polite");
    await userEvent.type(screen.getByRole("textbox", { name: "Contexto" }), "olá!");
    expect(screen.getByText("4/100")).toBeInTheDocument();
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
