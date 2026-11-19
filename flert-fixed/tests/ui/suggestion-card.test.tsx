import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SuggestionCard } from "@/components/analyze/SuggestionCard";

function Controlled({ onCopy }: { onCopy: (text: string) => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <ol>
      <SuggestionCard
        index={1}
        text="Oi, tudo bem?"
        copied={copied}
        onCopy={(t) => {
          onCopy(t);
          setCopied(true);
        }}
      />
    </ol>
  );
}

describe("SuggestionCard", () => {
  it("mostra número e texto; botão 'Copiar sugestão N' chama onCopy e vira 'Copiado'", async () => {
    const onCopy = vi.fn();
    render(<Controlled onCopy={onCopy} />);
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Oi, tudo bem?")).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole("button", { name: "Copiar sugestão 2" }));
    expect(onCopy).toHaveBeenCalledWith("Oi, tudo bem?");
    expect(screen.getByText("Copiado")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Copiado/ })).toBeInTheDocument();
  });

  it("sem onCopy, copia para o clipboard e mostra 'Copiado'", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(
      <ol>
        <SuggestionCard index={0} text="Bora tomar um café?" />
      </ol>
    );
    await user.click(screen.getByRole("button", { name: "Copiar sugestão 1" }));
    expect(writeText).toHaveBeenCalledWith("Bora tomar um café?");
    await waitFor(() => expect(screen.getByText("Copiado")).toBeInTheDocument());
  });
});
