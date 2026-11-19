import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { ChatMock } from "@/components/landing/ChatMock";

const messages = [
  { from: "them" as const, text: "Passei o fim de semana tentando aprender a fazer pão em casa" },
  { from: "them" as const, text: "Saiu meio torto, mas comestível" },
];

// Cena ilustrativa do cenário "Conversa" da demo: interface genérica de chat (sem marca de app).
describe("ChatMock", () => {
  it("é uma figura acessível que descreve a conversa de exemplo com as mensagens", () => {
    render(<ChatMock messages={messages} />);
    const fig = screen.getByRole("img", { name: /exemplo ilustrativo.*conversa.*fazer pão.*meio torto/i });
    expect(fig).toBeInTheDocument();
  });

  it("mostra o contato fictício, as mensagens e o campo de digitação", () => {
    render(<ChatMock messages={messages} />);
    const fig = screen.getByRole("img");
    expect(within(fig).getByText("Alex")).toBeInTheDocument();
    for (const m of messages) expect(within(fig).getByText(m.text)).toBeInTheDocument();
    expect(within(fig).getByText(/mensagem…/i)).toBeInTheDocument();
  });

  it("desenha a foto do pão em SVG e marca cada balão recebido", () => {
    const { container } = render(<ChatMock messages={messages} />);
    expect(container.querySelector("svg[data-scene='bread']")).not.toBeNull();
    expect(container.querySelectorAll("[data-chat-bubble]").length).toBe(messages.length);
  });

  it("não cita nem imita marcas de apps de mensagem", () => {
    const { container } = render(<ChatMock messages={messages} />);
    expect(container.textContent ?? "").not.toMatch(/instagram|tiktok|whatsapp|telegram|tinder|facebook/i);
  });
});
