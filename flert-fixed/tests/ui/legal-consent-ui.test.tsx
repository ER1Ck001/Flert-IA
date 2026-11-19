import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Tarefa 10: caixas de 18+ e opt-in no cadastro, interruptor de e-mails em Configurações,
// etapa de confirmação de idade e páginas legais em rascunho.
const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  update: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  params: new URLSearchParams(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  signIn: mocks.signIn,
  signOut: mocks.signOut,
  useSession: () => ({ status: "authenticated", data: { user: { id: "u1" } }, update: mocks.update }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace, refresh: vi.fn() }),
  useSearchParams: () => mocks.params,
  usePathname: () => "/",
}));
vi.mock("react-hot-toast", () => ({ default: { error: mocks.toastError, success: mocks.toastSuccess } }));

import RegisterPage from "@/app/auth/register/page";
import SettingsPage from "@/app/(dashboard)/settings/page";
import ConfirmAgePage from "@/app/auth/confirmar-idade/page";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { TERMOS } from "@/content/legal/termos";

beforeEach(() => {
  mocks.params = new URLSearchParams();
  mocks.update.mockResolvedValue({});
});

describe("Cadastro — 18+ obrigatório e opt-in opcional", () => {
  async function fill() {
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Nome completo"), "Ana Lima");
    await user.type(screen.getByLabelText("E-mail"), "ana@exemplo.com");
    await user.type(screen.getByLabelText("Senha"), "SenhaForte1");
    return user;
  }

  it("caixas começam desmarcadas; sem os Termos publicados, não há links para eles", () => {
    vi.stubGlobal("fetch", vi.fn());
    render(<RegisterPage />);
    expect(screen.getByRole("checkbox", { name: /Tenho 18 anos ou mais/ })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: /novidades e ofertas/ })).not.toBeChecked();
    expect(screen.queryByRole("link", { name: /Termos de Uso/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Política de Privacidade/ })).not.toBeInTheDocument();
  });

  it("sem marcar 18+: erro no campo, foco nele e nenhuma chamada à API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<RegisterPage />);
    const user = await fill();
    await user.click(screen.getByRole("button", { name: "Criar conta" }));
    const box = screen.getByRole("checkbox", { name: /Tenho 18 anos ou mais/ });
    await waitFor(() => expect(box).toHaveAttribute("aria-invalid", "true"));
    expect(box).toHaveFocus();
    expect(screen.getByRole("alert")).toHaveTextContent(/18 anos/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("envia adultConfirmed e marketingOptIn ao criar a conta", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, status: 201, json: async () => ({ user: { id: "u1" } }) }) as Response);
    vi.stubGlobal("fetch", fetchMock);
    render(<RegisterPage />);
    const user = await fill();
    await user.click(screen.getByRole("checkbox", { name: /Tenho 18 anos ou mais/ }));
    await user.click(screen.getByRole("button", { name: "Criar conta" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body = JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    expect(body).toMatchObject({ adultConfirmed: true, marketingOptIn: false });

    fetchMock.mockClear();
    await user.click(screen.getByRole("checkbox", { name: /novidades e ofertas/ }));
    await user.click(screen.getByRole("button", { name: "Criar conta" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body2 = JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    expect(body2.marketingOptIn).toBe(true);
  });
});

describe("Configurações — e-mails de novidades e ofertas", () => {
  function mockFetch(marketingOptIn: boolean) {
    const fn = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === "/api/profile" && !init?.method) {
        return { ok: true, status: 200, json: async () => ({ user: { hasPassword: true, marketingOptIn } }) } as Response;
      }
      if (url === "/api/account/marketing" && init?.method === "PUT") {
        const { optIn } = JSON.parse(String(init.body));
        return { ok: true, status: 200, json: async () => ({ marketingOptIn: optIn }) } as Response;
      }
      throw new Error(`rota não mockada: ${init?.method ?? "GET"} ${url}`);
    });
    vi.stubGlobal("fetch", fn);
    return fn;
  }

  it("interruptor acessível reflete o perfil e salva pela API", async () => {
    const fetchMock = mockFetch(false);
    render(<SettingsPage />);
    const sw = await screen.findByRole("switch", { name: /E-mails de novidades e ofertas/ });
    await waitFor(() => expect(sw).toHaveAttribute("aria-checked", "false"));
    await waitFor(() => expect(sw).not.toBeDisabled());
    await userEvent.setup().click(sw);
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/account/marketing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optIn: true }),
      })
    );
    await waitFor(() => expect(sw).toHaveAttribute("aria-checked", "true"));
  });

  it("copy honesta: e-mails da conta continuam chegando", async () => {
    mockFetch(true);
    render(<SettingsPage />);
    expect(await screen.findByText(/continuam chegando/)).toBeInTheDocument();
  });
});

describe("Confirmação de idade (/auth/confirmar-idade)", () => {
  it("exige a caixa, grava pela API, atualiza a sessão e volta ao callbackUrl seguro", async () => {
    mocks.params = new URLSearchParams({ callbackUrl: "/analyze" });
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: true }) }) as Response);
    vi.stubGlobal("fetch", fetchMock);
    render(<ConfirmAgePage />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Confirmar e continuar" }));
    const box = screen.getByRole("checkbox", { name: /Tenho 18 anos ou mais/ });
    await waitFor(() => expect(box).toHaveAttribute("aria-invalid", "true"));
    expect(fetchMock).not.toHaveBeenCalled();

    await user.click(box);
    await user.click(screen.getByRole("button", { name: "Confirmar e continuar" }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/account/confirm-age", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adultConfirmed: true }),
      })
    );
    await waitFor(() => expect(mocks.update).toHaveBeenCalled());
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/analyze"));
  });

  it("callbackUrl externo cai no /dashboard (sem open redirect)", async () => {
    mocks.params = new URLSearchParams({ callbackUrl: "https://evil.com" });
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 200, json: async () => ({}) }) as Response));
    render(<ConfirmAgePage />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("checkbox", { name: /Tenho 18 anos ou mais/ }));
    await user.click(screen.getByRole("button", { name: "Confirmar e continuar" }));
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/dashboard"));
  });

  it("quem não confirma pode sair e vê como excluir a conta", async () => {
    vi.stubGlobal("fetch", vi.fn());
    render(<ConfirmAgePage />);
    expect(screen.getByText(/excluir a sua conta/i)).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "Sair" }));
    expect(mocks.signOut).toHaveBeenCalledWith({ callbackUrl: "/" });
  });
});

describe("Documentos legais e rodapé", () => {
  it("rascunho mostra o banner e as seções", () => {
    render(<LegalDocument doc={TERMOS} published={false} />);
    expect(screen.getByRole("heading", { level: 1, name: TERMOS.title })).toBeInTheDocument();
    expect(screen.getByText(/Rascunho — não publicado/)).toBeInTheDocument();
    for (const s of TERMOS.sections) {
      expect(screen.getByRole("heading", { level: 2, name: s.title })).toBeInTheDocument();
    }
  });

  it("publicado não mostra o banner", () => {
    render(<LegalDocument doc={TERMOS} published />);
    expect(screen.queryByText(/Rascunho — não publicado/)).not.toBeInTheDocument();
  });

  it("rodapé não linka Termos/Privacidade enquanto não publicados", () => {
    render(<LandingFooter />);
    expect(screen.queryByRole("link", { name: /Termos/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Privacidade/ })).not.toBeInTheDocument();
  });
});
