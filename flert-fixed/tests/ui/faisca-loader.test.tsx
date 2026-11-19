import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FaiscaLoader } from "@/components/ui/faisca-loader";

describe("FaiscaLoader", () => {
  it("anuncia o estado com role=status e texto acessível", () => {
    render(<FaiscaLoader />);
    expect(screen.getByRole("status")).toHaveTextContent("A IA está pensando…");
  });

  it("mostra a primeira etapa", () => {
    render(<FaiscaLoader />);
    expect(screen.getByText("Lendo a conversa")).toBeInTheDocument();
  });
});
