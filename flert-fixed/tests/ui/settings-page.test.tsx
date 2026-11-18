import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({ signOut: vi.fn(), toastError: vi.fn(), toastSuccess: vi.fn() }));

vi.mock("next-auth/react", () => ({ signOut: mocks.signOut }));
vi.mock("react-hot-toast", () => ({ default: { error: mocks.toastError, success: mocks.toastSuccess } }));

import SettingsPage from "@/app/(dashboard)/settings/page";

function mockFetch() {
  const fn = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === "/api/profile" && !init?.method) {
      return { ok: true, status: 200, json: async () => ({ user: { hasPassword: true } }) } as Response;
    }
    if (url === "/api/account/sessions/revoke") {
      return { ok: true, status: 200, json: async () => ({ ok: true }) } as Response;
    }
    throw new Error(`rota não mockada: ${init?.method ?? "GET"} ${url}`);
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("Settings page", () => {
  it("'Sair de tudo' pede confirmação antes de encerrar as sessões", async () => {
    const fetchMock = mockFetch();
    render(<SettingsPage />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Sair de tudo/ }));

    const dialog = await screen.findByRole("alertdialog");
    expect(fetchMock).not.toHaveBeenCalledWith("/api/account/sessions/revoke", expect.anything());
    await user.click(within(dialog).getByRole("button", { name: "Sair de todos os dispositivos" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/account/sessions/revoke", { method: "POST" })
    );
    await waitFor(() => expect(mocks.signOut).toHaveBeenCalledWith({ callbackUrl: "/auth/login" }));
  });

  it("cancelar 'Sair de tudo' não chama a API", async () => {
    const fetchMock = mockFetch();
    render(<SettingsPage />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Sair de tudo/ }));
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(fetchMock).not.toHaveBeenCalledWith("/api/account/sessions/revoke", expect.anything());
  });

  it("abrir 'Excluir conta' foca a confirmação; cancelar devolve o foco ao botão", async () => {
    mockFetch();
    render(<SettingsPage />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Excluir conta" }));
    const input = await screen.findByLabelText(/para confirmar/);
    await waitFor(() => expect(input).toHaveFocus());

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    const trigger = await screen.findByRole("button", { name: "Excluir conta" });
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
