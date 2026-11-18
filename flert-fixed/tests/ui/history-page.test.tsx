import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({ toastError: vi.fn(), toastSuccess: vi.fn() }));

vi.mock("react-hot-toast", () => ({
  default: { error: mocks.toastError, success: mocks.toastSuccess },
}));

import HistoryPage from "@/app/(dashboard)/history/page";

const CONVERSATIONS = [
  {
    id: "c1",
    title: "Análise flirty - 10/11/2026",
    createdAt: "2026-11-10T12:00:00.000Z",
    messages: [
      { role: "user", content: "print" },
      { role: "assistant", content: "Sugestão número um" },
      { role: "assistant", content: "Sugestão número dois" },
    ],
  },
  {
    id: "c2",
    title: "Análise funny - 09/11/2026",
    createdAt: "2026-11-09T12:00:00.000Z",
    messages: [{ role: "assistant", content: "Outra sugestão" }],
  },
];

function mockFetch(conversations: unknown[]) {
  const fn = vi.fn(async (url: string, init?: RequestInit) => {
    // Tarefa 9: o cliente agora pede a 1ª página (?limit=20); sem próxima página aqui.
    if (url === "/api/history?limit=20" && !init?.method) {
      return { ok: true, status: 200, json: async () => ({ conversations, nextCursor: null }) } as Response;
    }
    if (url.startsWith("/api/history?id=") && init?.method === "DELETE") {
      return { ok: true, status: 200, json: async () => ({ success: true }) } as Response;
    }
    throw new Error(`rota não mockada: ${init?.method ?? "GET"} ${url}`);
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("History page", () => {
  it("renderiza a lista com sugestões, tom legível e botões de ícone acessíveis", async () => {
    mockFetch(CONVERSATIONS);
    render(<HistoryPage />);

    expect(await screen.findByText("Sugestão número um")).toBeInTheDocument();
    expect(screen.getByText("Sugestão número dois")).toBeInTheDocument();
    expect(screen.getByText("Outra sugestão")).toBeInTheDocument();
    // Rótulo do tom via tones.ts (chave da API → rótulo).
    expect(screen.getAllByText("Flertando").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Engraçado").length).toBeGreaterThan(0);

    expect(screen.getByRole("heading", { level: 1, name: "Histórico" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Copiar sugestão \d$/ })).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Copiar sugestão 2" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Remover análise" })).toHaveLength(2);
    expect(screen.getByRole("searchbox", { name: /Buscar/ })).toBeInTheDocument();
  });

  it("vazio mostra o EmptyState com CTA para analisar", async () => {
    mockFetch([]);
    render(<HistoryPage />);

    expect(await screen.findByRole("heading", { name: "Nenhuma análise ainda" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Fazer análise/ })).toHaveAttribute("href", "/analyze");
  });

  it("remover chama DELETE /api/history?id=… e tira o item da lista", async () => {
    const fetchMock = mockFetch(CONVERSATIONS);
    render(<HistoryPage />);
    await screen.findByText("Sugestão número um");

    const user = userEvent.setup();
    await user.click(screen.getAllByRole("button", { name: "Remover análise" })[0]);
    // Ação irreversível: pede confirmação antes de chamar a API.
    const dialog = await screen.findByRole("alertdialog");
    expect(fetchMock).not.toHaveBeenCalledWith("/api/history?id=c1", { method: "DELETE" });
    await user.click(within(dialog).getByRole("button", { name: "Remover" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/history?id=c1", { method: "DELETE" })
    );
    await waitFor(() => expect(screen.queryByText("Sugestão número um")).not.toBeInTheDocument());
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Análise removida");
  });

  it("cancelar a remoção não chama a API e devolve o foco ao botão", async () => {
    const fetchMock = mockFetch(CONVERSATIONS);
    render(<HistoryPage />);
    await screen.findByText("Sugestão número um");
    const user = userEvent.setup();
    const trigger = screen.getAllByRole("button", { name: "Remover análise" })[0];
    await user.click(trigger);
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("erro ao carregar mostra alerta com 'Tentar novamente' (não o estado vazio)", async () => {
    let fail = true;
    const fn = vi.fn(async () =>
      fail
        ? ({ ok: false, status: 500, json: async () => ({}) } as Response)
        : ({ ok: true, status: 200, json: async () => ({ conversations: CONVERSATIONS }) } as Response)
    );
    vi.stubGlobal("fetch", fn);
    render(<HistoryPage />);
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/Não foi possível carregar o histórico/);
    expect(screen.queryByText("Nenhuma análise ainda")).not.toBeInTheDocument();
    fail = false;
    await userEvent.click(within(alert).getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText("Sugestão número um")).toBeInTheDocument();
  });

  it("busca também encontra pelo rótulo do tom e anuncia o total", async () => {
    mockFetch(CONVERSATIONS);
    render(<HistoryPage />);
    await screen.findByText("Sugestão número um");
    await userEvent.type(screen.getByRole("searchbox", { name: /Buscar/ }), "Engraçado");
    await waitFor(() => expect(screen.queryByText("Sugestão número um")).not.toBeInTheDocument());
    expect(screen.getByText("Outra sugestão")).toBeInTheDocument();
    expect(screen.getByText("1 análise encontrada")).toHaveAttribute("aria-live", "polite");
  });

  describe("paginação (Carregar mais)", () => {
    const OLDER = {
      id: "c3",
      title: "Análise casual - 01/11/2026",
      createdAt: "2026-11-01T12:00:00.000Z",
      messages: [{ role: "assistant", content: "Sugestão antiga" }],
    };

    function mockPaged(opts: { failSecond?: boolean } = {}) {
      let releaseSecond: () => void = () => {};
      const secondGate = new Promise<void>((r) => (releaseSecond = r));
      const fn = vi.fn(async (url: string, init?: RequestInit) => {
        if (url === "/api/history?limit=20" && !init?.method) {
          return { ok: true, status: 200, json: async () => ({ conversations: CONVERSATIONS, nextCursor: "c2" }) } as Response;
        }
        if (url === "/api/history?limit=20&cursor=c2" && !init?.method) {
          await secondGate;
          if (opts.failSecond) return { ok: false, status: 500, json: async () => ({}) } as Response;
          return { ok: true, status: 200, json: async () => ({ conversations: [OLDER], nextCursor: null }) } as Response;
        }
        throw new Error(`rota não mockada: ${init?.method ?? "GET"} ${url}`);
      });
      vi.stubGlobal("fetch", fn);
      return { fn, releaseSecond };
    }

    it("sem próxima página não mostra o botão", async () => {
      mockFetch(CONVERSATIONS);
      render(<HistoryPage />);
      await screen.findByText("Sugestão número um");
      expect(screen.queryByRole("button", { name: /Carregar mais/ })).not.toBeInTheDocument();
    });

    it("carrega a próxima página pelo cursor, com estado de carregamento acessível, e acrescenta à lista", async () => {
      const { fn, releaseSecond } = mockPaged();
      render(<HistoryPage />);
      await screen.findByText("Sugestão número um");

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: "Carregar mais" }));
      const busy = await screen.findByRole("button", { name: /Carregando/ });
      expect(busy).toBeDisabled();
      expect(busy).toHaveAttribute("aria-busy", "true");
      expect(fn).toHaveBeenCalledWith("/api/history?limit=20&cursor=c2");

      releaseSecond();
      expect(await screen.findByText("Sugestão antiga")).toBeInTheDocument();
      expect(screen.getByText("Sugestão número um")).toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: "Remover análise" })).toHaveLength(3);
      // Última página: o botão some.
      await waitFor(() => expect(screen.queryByRole("button", { name: /Carregar mais|Carregando/ })).not.toBeInTheDocument());
    });

    it("falha ao carregar mais mantém a lista e avisa", async () => {
      const { releaseSecond } = mockPaged({ failSecond: true });
      render(<HistoryPage />);
      await screen.findByText("Sugestão número um");
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: "Carregar mais" }));
      releaseSecond();
      await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith("Erro ao carregar mais análises"));
      expect(screen.getByText("Sugestão número um")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Carregar mais" })).toBeEnabled();
    });

    it("busca com mais páginas por carregar avisa que considera só as análises carregadas", async () => {
      mockPaged();
      render(<HistoryPage />);
      await screen.findByText("Sugestão número um");
      await userEvent.type(screen.getByRole("searchbox", { name: /Buscar/ }), "Engraçado");
      expect(await screen.findByText(/A busca considera só as análises já carregadas/)).toBeInTheDocument();
    });
  });
});
