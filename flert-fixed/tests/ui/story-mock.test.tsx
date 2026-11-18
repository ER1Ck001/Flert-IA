import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { StoryMock } from "@/components/landing/StoryMock";

// Cena ilustrativa do cenário "Story" da demo: interface genérica de story (sem marca de rede social).
describe("StoryMock", () => {
  it("é uma figura acessível que descreve o story de exemplo", () => {
    render(<StoryMock caption="fim de tarde merecido" />);
    const fig = screen.getByRole("img", { name: /story.*pôr do sol.*fim de tarde merecido/i });
    expect(fig).toBeInTheDocument();
  });

  it("mostra a legenda como adesivo, o autor fictício e o campo de resposta", () => {
    render(<StoryMock caption="fim de tarde merecido" />);
    const fig = screen.getByRole("img");
    expect(within(fig).getByText("fim de tarde merecido")).toBeInTheDocument();
    expect(within(fig).getByText("Jordan")).toBeInTheDocument();
    expect(within(fig).getByText(/responder ao story/i)).toBeInTheDocument();
  });

  it("desenha a cena em SVG (não é mais só um degradê) e tem barras de progresso", () => {
    const { container } = render(<StoryMock caption="fim de tarde merecido" />);
    expect(container.querySelector("svg[data-scene='sunset'] circle")).not.toBeNull();
    expect(container.querySelectorAll("[data-story-progress]").length).toBe(3);
  });

  it("não cita nem imita marcas de redes sociais", () => {
    const { container } = render(<StoryMock caption="fim de tarde merecido" />);
    expect(container.textContent ?? "").not.toMatch(/instagram|tiktok|whatsapp|facebook/i);
  });
});
