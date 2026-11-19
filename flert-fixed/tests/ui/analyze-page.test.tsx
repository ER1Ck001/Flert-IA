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
  await user.click(screen.getByRole("button", { name: /Gerar sugestões/ }));
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
    expect(screen.getAllByRole("button", { name: /Gerar sugestões/ })).toHaveLength(1);
    expect(screen.getByRole("button", { name: /Gerar sugestões/ })).toBeDisabled();
  });

  it("resposta 403 mostra o gate de assinatura", async () => {
    mockFetch({
      "/api/stats": { body: PAID_STATS },
      "/api/analyze/text": { status: 403, body: { error: "Plano necessário" } },
    });
    render(<AnalyzePage />);
    await openSituation();
    expect(await screen.findByRole("heading", { name: "As análises fazem parte dos planos" }, T)).toBeInTheDocument();
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
    expect(await screen.findByRole("heading", { name: "As análises fazem parte dos planos" }, T)).toBeInTheDocument();
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

  it("erro da IA (502) fica visível no resultado com 'Tentar novamente' que reenvia o mesmo pedido", async () => {
    let fail = true;
    const msg = "A IA não conseguiu gerar sugestões agora. Tente novamente — esta tentativa não foi descontada do seu limite.";
    const fetchMock = mockFetch({
      "/api/stats": { body: PAID_STATS },
      "/api/analyze/text": () => (fail ? { status: 502, body: { error: msg, retryable: true } } : { body: { suggestions: SUGGESTIONS } }),
    });
    render(<AnalyzePage />);
    const user = await openSituation();

    const alert = await screen.findByRole("alert", undefined, T);
    expect(alert).toHaveTextContent(msg);
    // Contador não muda quando a IA falha.
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");

    fail = false;
    await user.click(within(alert).getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByRole("list", { name: /Sugestões/ }, T)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    const bodies = fetchMock.mock.calls.filter((c) => c[0] === "/api/analyze/text").map((c) => c[1]!.body);
    expect(bodies).toHaveLength(2);
    expect(bodies[1]).toBe(bodies[0]);
  });

  it("resposta sem JSON (ex.: 413/504 da plataforma) mostra a mensagem padrão, não um erro de parse", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url === "/api/stats") return { ok: true, status: 200, json: async () => PAID_STATS } as Response;
        return {
          ok: false,
          status: 504,
          json: async () => { throw new SyntaxError("Unexpected token 'A', \"An error o\"... is not valid JSON"); },
        } as unknown as Response;
      })
    );
    render(<AnalyzePage />);
    await openSituation();
    expect(await screen.findByText("Erro ao gerar", { exact: false }, T)).toBeInTheDocument();
    expect(screen.queryByText(/not valid JSON|Unexpected token/)).not.toBeInTheDocument();
  });

  it("falha ao copiar avisa o usuário e não mostra 'Copiado'", async () => {
    mockFetch({
      "/api/stats": { body: PAID_STATS },
      "/api/analyze/text": { body: { suggestions: SUGGESTIONS } },
    });
    render(<AnalyzePage />);
    const user = await openSituation();
    const list = await screen.findByRole("list", { name: /Sugestões/ }, T);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    await user.click(within(list).getByRole("button", { name: "Copiar sugestão 1" }));
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith(expect.stringMatching(/Não foi possível copiar/)));
    expect(mocks.toastSuccess).not.toHaveBeenCalledWith("Copiado!");
    expect(within(list).queryByRole("button", { name: /Copiado/ })).not.toBeInTheDocument();
  });

  it("ao trocar de view o foco vai para o título da nova tela", async () => {
    mockFetch({ "/api/stats": { body: PAID_STATS } });
    render(<AnalyzePage />);
    await userEvent.setup().click(await screen.findByRole("button", { name: /Sugestões de respostas/ }, T));
    const h1 = await screen.findByRole("heading", { level: 1, name: /Analisar print/ }, T);
    await waitFor(() => expect(h1).toHaveFocus());
  });

  it("copy sem promessa de resultado ('perfeita', 'certeiras')", async () => {
    mockFetch({ "/api/stats": { body: PAID_STATS } });
    const { container } = render(<AnalyzePage />);
    await screen.findByRole("heading", { name: /Analisar conversa/ }, T);
    expect(container.textContent).not.toMatch(/perfeita|certeira/i);
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
