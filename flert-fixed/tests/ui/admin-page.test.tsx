import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({ signOut: vi.fn(), toastError: vi.fn(), toastSuccess: vi.fn() }));
vi.mock("next-auth/react", () => ({ signOut: mocks.signOut }));
vi.mock("react-hot-toast", () => ({ default: { error: mocks.toastError, success: mocks.toastSuccess } }));

import AdminPage from "@/app/admin/page";

const USERS = [
  {
    id: "u1", name: "Ana Lima", email: "ana@example.com", image: null, createdAt: "2026-11-01T12:00:00.000Z",
    loginMethod: "email", subscription: "PREMIUM", activatedAt: "2026-11-01T12:00:00.000Z",
    expiresAt: "2026-12-01T12:00:00.000Z", analysisCount: 12,
  },
  {
    id: "u2", name: "Bruno", email: "bruno@example.com", image: null, createdAt: "2026-10-01T12:00:00.000Z",
    loginMethod: "google", subscription: "FREE", activatedAt: null, expiresAt: null, analysisCount: 0,
  },
];
const STATS = { total: 2, free: 1, premium: 1, annual: 0, lifetime: 0, totalAnalyses: 12 };

function mockFetch() {
  const fn = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === "/api/admin/users") {
      return { ok: true, status: 200, json: async () => ({ users: USERS, stats: STATS }) } as Response;
    }
    if (url.startsWith("/api/admin/users/") && init?.method === "DELETE") {
      return { ok: true, status: 200, json: async () => ({ ok: true }) } as Response;
    }
    throw new Error(`rota não mockada: ${init?.method ?? "GET"} ${url}`);
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

const TALL = /\b(h-11|min-h-11|min-h-\[44px\])\b/;

describe("Admin page — layout mobile e acessibilidade", () => {
  it("botões de ícone do header têm aria-label e ≥44px", async () => {
    mockFetch();
    render(<AdminPage />);
    const header = screen.getByRole("banner");
    for (const name of ["Recarregar", "Ir para o painel", "Sair"]) {
      const el = within(header).getByRole(name === "Ir para o painel" ? "link" : "button", { name });
      expect(el.className).toMatch(TALL);
    }
    expect(within(header).getByRole("button", { name: /Exportar CSV/ }).className).toMatch(TALL);
  });

  it("tem lista em cartões para telas pequenas, com ações sempre visíveis", async () => {
    mockFetch();
    render(<AdminPage />);
    const list = await screen.findByRole("list", { name: "Usuários" });
    const cards = within(list).getAllByRole("listitem");
    expect(cards).toHaveLength(2);
    const del = within(cards[0]).getByRole("button", { name: "Excluir usuário Ana Lima" });
    expect(del.className).toMatch(TALL);
    // Nada de ações escondidas até o hover (inacessível no toque e no teclado).
    expect(del.closest(".opacity-0")).toBeNull();
    expect(within(cards[0]).getByRole("button", { name: "Enviar email para Ana Lima" }).className).toMatch(TALL);
  });

  it("tabela (md+) fica num contêiner com rolagem horizontal e cabeçalhos ordenáveis por teclado", async () => {
    mockFetch();
    render(<AdminPage />);
    const table = await screen.findByRole("table");
    expect(table.closest(".overflow-x-auto")).not.toBeNull();
    const sortBtn = within(table).getByRole("button", { name: /Usuário/ });
    const th = sortBtn.closest("th")!;
    expect(th).toHaveAttribute("aria-sort", "none");
    await userEvent.click(sortBtn);
    expect(th).toHaveAttribute("aria-sort", "ascending");
    // Expandir detalhes é um botão com aria-expanded (não um <td onClick>).
    const expand = within(table).getAllByRole("button", { name: /Detalhes de Ana Lima/ })[0];
    expect(expand).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(expand);
    expect(expand).toHaveAttribute("aria-expanded", "true");
  });

  it("filtros de plano expõem o estado (aria-pressed) e a busca tem rótulo", async () => {
    mockFetch();
    render(<AdminPage />);
    await screen.findByRole("list", { name: "Usuários" });
    expect(screen.getByRole("searchbox", { name: /Buscar usuários/ })).toBeInTheDocument();
    const all = screen.getByRole("button", { name: /^Todos/ });
    expect(all).toHaveAttribute("aria-pressed", "true");
    expect(all.className).toMatch(TALL);
  });

  it("abas usam role=tab com aria-selected", async () => {
    mockFetch();
    render(<AdminPage />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(2);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    await userEvent.click(tabs[1]);
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByLabelText("Assunto")).toBeInTheDocument();
    expect(screen.getByLabelText(/Mensagem/)).toBeInTheDocument();
    expect(screen.getByLabelText("Destinatários")).toBeInTheDocument();
  });

  it("modal de email é um dialog acessível que fecha com Esc", async () => {
    mockFetch();
    render(<AdminPage />);
    const list = await screen.findByRole("list", { name: "Usuários" });
    const user = userEvent.setup();
    await user.click(within(list).getByRole("button", { name: "Enviar email para Ana Lima" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("ana@example.com")).toBeInTheDocument();
    const opt = within(dialog).getByRole("button", { name: /Mensagem personalizada/ });
    expect(opt).toHaveAttribute("aria-pressed", "false");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("excluir pede confirmação e chama DELETE só ao confirmar", async () => {
    const fetchMock = mockFetch();
    render(<AdminPage />);
    const list = await screen.findByRole("list", { name: "Usuários" });
    const user = userEvent.setup();
    await user.click(within(list).getByRole("button", { name: "Excluir usuário Ana Lima" }));
    expect(fetchMock).not.toHaveBeenCalledWith("/api/admin/users/u1", { method: "DELETE" });
    await user.click(within(list).getByRole("button", { name: "Confirmar exclusão de Ana Lima" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/admin/users/u1", { method: "DELETE" }));
  });
});

// Tarefa 9 (M8): envio em massa em lotes — o painel mostra enviados/restantes e permite continuar.
describe("Admin page — campanhas em lotes", () => {
  function mockCampaign(responses: unknown[]) {
    const bodies: Record<string, unknown>[] = [];
    const fn = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === "/api/admin/users") {
        return { ok: true, status: 200, json: async () => ({ users: USERS, stats: STATS }) } as Response;
      }
      if (url === "/api/admin/email" && init?.method === "POST") {
        bodies.push(JSON.parse(String(init.body)));
        const next = responses.shift();
        return { ok: true, status: 200, json: async () => next } as Response;
      }
      throw new Error(`rota não mockada: ${init?.method ?? "GET"} ${url}`);
    });
    vi.stubGlobal("fetch", fn);
    return bodies;
  }

  it("mostra enviados e restantes e continua do cursor até terminar", async () => {
    const bodies = mockCampaign([
      { sent: 5, failed: 0, total: 12, processed: 5, remaining: 7, nextCursor: "u0005" },
      { sent: 6, failed: 1, total: 12, processed: 7, remaining: 0, nextCursor: null },
    ]);
    render(<AdminPage />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("tab", { name: /Campanhas de email/ }));
    // O 1º é o card "Sem plano" (free_upsell); o personalizado tem o mesmo rótulo.
    await user.click((await screen.findAllByRole("button", { name: /Enviar para 1 usuário/ }))[0]);
    await user.click(screen.getByRole("button", { name: "Confirmar envio" }));

    const status = await screen.findByRole("status", { name: "Progresso do envio" });
    await waitFor(() => expect(status).toHaveTextContent("5 enviados · 0 falharam · 7 restantes (de 12)"));
    expect(bodies[0]).toEqual({ template: "free_upsell" });

    await user.click(within(status).getByRole("button", { name: "Continuar envio (7 restantes)" }));
    await waitFor(() => expect(bodies[1]).toEqual({ template: "free_upsell", cursor: "u0005" }));
    await waitFor(() => expect(status).toHaveTextContent("Envio concluído: 11 enviados · 1 falharam (de 12)"));
    expect(within(status).queryByRole("button", { name: /Continuar envio/ })).not.toBeInTheDocument();
  });

  it("lista que cabe em uma chamada: só o resumo, sem botão de continuar", async () => {
    mockCampaign([{ sent: 1, failed: 0, total: 1, processed: 1, remaining: 0, nextCursor: null }]);
    render(<AdminPage />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("tab", { name: /Campanhas de email/ }));
    // O 1º é o card "Sem plano" (free_upsell); o personalizado tem o mesmo rótulo.
    await user.click((await screen.findAllByRole("button", { name: /Enviar para 1 usuário/ }))[0]);
    await user.click(screen.getByRole("button", { name: "Confirmar envio" }));
    const status = await screen.findByRole("status", { name: "Progresso do envio" });
    await waitFor(() => expect(status).toHaveTextContent("Envio concluído: 1 enviados · 0 falharam (de 1)"));
    expect(within(status).queryByRole("button", { name: /Continuar envio/ })).not.toBeInTheDocument();
  });
});
