import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { HeroPreview } from "@/components/landing/HeroPreview";
import { DEMO_SCENARIOS } from "@/components/landing/demo-data";
import { getToneLabel } from "@/components/analyze/tones";

// Prévia do hero: conversa fictícia + tom + 3 sugestões reais da demo (dados estáticos, nada da IA).
describe("HeroPreview", () => {
  const scenario = DEMO_SCENARIOS.find((s) => s.id === "conversa")!;
  const suggestions = scenario.suggestions.funny!;

  it("é uma figura acessível com rótulo descritivo e selo de exemplo ilustrativo", () => {
    render(<HeroPreview />);
    const fig = screen.getByRole("img", { name: /exemplo ilustrativo/i });
    expect(fig).toBeInTheDocument();
    expect(within(fig).getByText("Exemplo ilustrativo")).toBeInTheDocument();
  });

  it("mostra as mensagens fictícias da conversa da demo", () => {
    render(<HeroPreview />);
    for (const msg of scenario.messages) expect(screen.getByText(msg.text)).toBeInTheDocument();
  });

  it("mostra o tom escolhido e as 3 sugestões desse tom", () => {
    render(<HeroPreview />);
    expect(screen.getByText(getToneLabel("funny"))).toBeInTheDocument();
    for (const s of suggestions) expect(screen.getByText(s)).toBeInTheDocument();
  });

  it("não usa mais barras de placeholder (skeleton) no lugar do texto", () => {
    const { container } = render(<HeroPreview />);
    expect(container.querySelectorAll(".rounded-full.bg-text-2\\/30").length).toBe(0);
  });
});
