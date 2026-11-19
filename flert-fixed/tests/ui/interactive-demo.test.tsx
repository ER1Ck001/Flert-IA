import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { InteractiveDemo } from "@/components/landing/InteractiveDemo";
import { DEMO_SCENARIOS, DEMO_TONES } from "@/components/landing/demo-data";

const API_TONES = ["flirty", "funny", "casual", "witty", "serious", "pickup", "stories"];

function suggestions() {
  return within(screen.getByRole("list", { name: /Sugestões de exemplo/i })).getAllByRole("listitem");
}

describe("demo-data", () => {
  it("usa somente os values de tom da API", () => {
    expect(DEMO_TONES.map((t) => t.value)).toEqual(API_TONES);
  });

  it("Conversa tem 6 tons (sem stories) e Story tem 7, todos com 3 sugestões", () => {
    const conversa = DEMO_SCENARIOS.find((s) => s.id === "conversa")!;
    const story = DEMO_SCENARIOS.find((s) => s.id === "story")!;
    expect(Object.keys(conversa.suggestions).sort()).toEqual(API_TONES.filter((t) => t !== "stories").sort());
    expect(Object.keys(story.suggestions).sort()).toEqual([...API_TONES].sort());
    for (const s of DEMO_SCENARIOS) {
      for (const list of Object.values(s.suggestions)) expect(list).toHaveLength(3);
    }
  });
});

describe("InteractiveDemo", () => {
  let writeText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("mostra o rótulo de exemplo ilustrativo", () => {
    render(<InteractiveDemo />);
    expect(
      screen.getByText("Exemplo ilustrativo — no app, as sugestões são geradas a partir da sua conversa.")
    ).toBeInTheDocument();
  });

  it("começa com 3 sugestões e sem loader", () => {
    render(<InteractiveDemo />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(suggestions()).toHaveLength(3);
  });

  it("troca de tom mostra o loader e depois 3 sugestões do novo tom", () => {
    render(<InteractiveDemo />);
    fireEvent.click(screen.getByRole("radio", { name: "Engraçado" }));
    expect(screen.getByRole("status")).toHaveTextContent("A IA está pensando…");
    expect(screen.queryByRole("list", { name: /Sugestões de exemplo/i })).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(900);
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    const items = suggestions();
    expect(items).toHaveLength(3);
    const conversa = DEMO_SCENARIOS.find((s) => s.id === "conversa")!;
    expect(items[0]).toHaveTextContent(conversa.suggestions.funny![0]);
  });

  it("tom stories só aparece no cenário Story", () => {
    render(<InteractiveDemo />);
    expect(screen.queryByRole("radio", { name: "Stories" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "Story" }));
    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(screen.getByRole("radio", { name: "Stories" })).toBeInTheDocument();
  });

  it("copiar chama navigator.clipboard.writeText com o texto da sugestão", async () => {
    render(<InteractiveDemo />);
    const conversa = DEMO_SCENARIOS.find((s) => s.id === "conversa")!;
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copiar sugestão 1" }));
    });
    expect(writeText).toHaveBeenCalledWith(conversa.suggestions.flirty![0]);
    expect(screen.getByRole("button", { name: "Sugestão 1 copiada" })).toBeInTheDocument();
  });

  it("falha do clipboard é silenciosa", async () => {
    writeText.mockRejectedValue(new Error("negado"));
    render(<InteractiveDemo />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copiar sugestão 2" }));
    });
    expect(writeText).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Copiar sugestão 2" })).toBeInTheDocument();
  });
});
