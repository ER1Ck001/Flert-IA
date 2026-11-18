import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/analyze",
}));

vi.mock("react-hot-toast", () => ({
  default: { error: mocks.toastError, success: mocks.toastSuccess },
}));

import AnalyzePage from "@/app/(dashboard)/analyze/page";

type Reply = { status?: number; body: unknown };

const PAID_STATS = { isPaid: true, isExpired: false, isLifetime: false, today: 1, dailyLimit: 10 };
const SUGGESTIONS = ["Primeira sugestão", "Segunda sugestão", "Terceira sugestão"];

function mockFetch(routes: Record<string, Reply | (() => Reply)>) {
  const fn = vi.fn(async (url: string, _init?: RequestInit) => {
    const r = routes[url];
    if (!r) throw new Error(`rota não mockada: ${url}`);
    const { status = 200, body } = typeof r === "function" ? r() : r;
    return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

const T = { timeout: 3000 };

async function openSituation() {
  const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: /Situação estranha/ }, T));
  const box = await screen.findByLabelText("O que está acontecendo?", undefined, T);
  await user.type(box, "Ela parou de responder");
  await user.click(screen.getByRole("radio", { name: "Engraçado" }));
  await user.click(screen.getByRole("button", { name: /Resolver situação/ }));
  return user;
}

describe("Analyze page", () => {
  beforeEach(() => {
    mocks.push.mockReset();
  });

  it("mostra Spinner enquanto carrega e depois o hub com 3 modos", async () => {
    mockFetch({ "/api/stats": { body: PAID_STATS } });
    render(<AnalyzePage />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: /Analisar conversa/ }, T)).toBeInTheDocument();
    for (const name of [/Sugestões de respostas/, /Inicie uma conversa/, /Situação estranha/]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
    expect(screen.queryByText(/MAIS USADO/i)).not.toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
  });

  it("fluxo 'situation': envia {context, style, mode} e mostra 3 SuggestionCard", async () => {
    const fetchMock = mockFetch({
      "/api/stats": { body: PAID_STATS },
      "/api/analyze/text": { body: { suggestions: SUGGESTIONS } },
    });
    render(<AnalyzePage />);
    await openSituation();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/analyze/text", expect.anything()));
    const call = fetchMock.mock.calls.find((c) => c[0] === "/api/analyze/text")!;
    const init = call[1]!;
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ "Content-Type": "application/json" });
    expect(init.body).toBe(JSON.stringify({ context: "Ela parou de responder", style: "funny", mode: "situation" }));

    const list = await screen.findByRole("list", { name: /Sugestões/ }, T);
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
    for (let n = 1; n <= 3; n++) {
      expect(within(list).getByRole("button", { name: `Copiar sugestão ${n}` })).toBeInTheDocument();
    }
    // Contador incrementa após sucesso.
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "2");
  });

  it("há um único botão de gerar na view", async () => {
    mockFetch({ "/api/stats": { body: PAID_STATS } });
    render(<AnalyzePage />);
    await userEvent.setup().click(await screen.findByRole("button", { name: /Situação estranha/ }, T));
    await screen.findByLabelText("O que está acontecendo?", undefined, T);
    expect(screen.getAllByRole("button", { name: /Resolver situação/ })).toHaveLength(1);
    expect(screen.getByRole("button", { name: /Resolver situação/ })).toBeDisabled();
  });

  it("resposta 403 mostra o gate de assinatura", async () => {
    mockFetch({
      "/api/stats": { body: PAID_STATS },
      "/api/analyze/text": { status: 403, body: { error: "Plano necessário" } },
    });
    render(<AnalyzePage />);
    await openSituation();
    expect(await screen.findByRole("heading", { name: "Recurso exclusivo para assinantes" }, T)).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "Ver planos" }));
    expect(mocks.push).toHaveBeenCalledWith("/pricing");
  });

  it("resposta 403 com expired mostra 'Seu plano expirou'", async () => {
    mockFetch({
      "/api/stats": { body: PAID_STATS },
      "/api/analyze/text": { status: 403, body: { expired: true } },
    });
    render(<AnalyzePage />);
    await openSituation();
    expect(await screen.findByRole("heading", { name: "Seu plano expirou" }, T)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Renovar plano" })).toBeInTheDocument();
  });

  it("resposta 429 com limitReached mostra o gate de limite", async () => {
    mockFetch({
      "/api/stats": { body: PAID_STATS },
      "/api/analyze/text": { status: 429, body: { limitReached: true, todayCount: 10, error: "Limite atingido" } },
    });
    render(<AnalyzePage />);
    await openSituation();
    expect(await screen.findByRole("heading", { name: "Limite diário atingido" }, T)).toBeInTheDocument();
    expect(screen.getByText(/Você já fez 10 análises hoje/)).toBeInTheDocument();
    expect(mocks.toastError).toHaveBeenCalledWith("Limite atingido");
  });

  it("sem plano na carga mostra o gate", async () => {
    mockFetch({ "/api/stats": { body: { isPaid: false, today: 0, dailyLimit: null } } });
    render(<AnalyzePage />);
    expect(await screen.findByRole("heading", { name: "Recurso exclusivo para assinantes" }, T)).toBeInTheDocument();
  });

  it("erro ao carregar o plano mostra 'Tentar novamente' que recarrega", async () => {
    let fail = true;
    const fetchMock = mockFetch({
      "/api/stats": () => (fail ? { status: 500, body: {} } : { body: PAID_STATS }),
    });
    render(<AnalyzePage />);
    const alert = await screen.findByRole("alert", undefined, T);
    expect(within(alert).getByText("Não foi possível carregar seu plano")).toBeInTheDocument();
    fail = false;
    await userEvent.setup().click(within(alert).getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByRole("heading", { name: /Analisar conversa/ }, T)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("view 'start' > foto mostra o tom Stories; 'analyze' não", async () => {
    mockFetch({ "/api/stats": { body: PAID_STATS } });
    render(<AnalyzePage />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /Sugestões de respostas/ }, T));
    await screen.findByRole("radiogroup", undefined, T);
    expect(screen.queryByRole("radio", { name: "Stories" })).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Arraste o print|Enviar print|selecionar/i)).toHaveAttribute("type", "file");

    await user.click(screen.getByRole("button", { name: /Voltar/ }));
    await user.click(await screen.findByRole("button", { name: /Inicie uma conversa/ }, T));
    await user.click(await screen.findByRole("button", { name: /Enviar foto/ }, T));
    expect(await screen.findByRole("radio", { name: "Stories" }, T)).toBeInTheDocument();
  });
});
