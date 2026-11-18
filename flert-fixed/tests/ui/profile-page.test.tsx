import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({ toastError: vi.fn(), toastSuccess: vi.fn(), update: vi.fn() }));

const session = { user: { id: "u1", name: "Ana Lima", email: "ana@example.com", image: null } };
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: session, status: "authenticated", update: mocks.update }),
  signOut: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("react-hot-toast", () => ({ default: { error: mocks.toastError, success: mocks.toastSuccess } }));

import ProfilePage from "@/app/(dashboard)/profile/page";

function mockFetch() {
  const fn = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === "/api/profile" && !init?.method) {
      return {
        ok: true, status: 200,
        json: async () => ({ user: { name: "Ana Lima", email: "ana@example.com", subscriptionStatus: "PREMIUM", hasPassword: true } }),
      } as Response;
    }
    throw new Error(`rota não mockada: ${init?.method ?? "GET"} ${url}`);
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("Profile page — validação inline", () => {
  it("nova senha sem a atual mostra o erro em 'Senha atual' e foca o campo", async () => {
    const fetchMock = mockFetch();
    render(<ProfilePage />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Nova senha"), "SenhaForte1!");
    await user.click(screen.getByRole("button", { name: /Salvar alterações/ }));

    const current = screen.getByLabelText("Senha atual");
    await waitFor(() => expect(current).toHaveAttribute("aria-invalid", "true"));
    expect(current).toHaveFocus();
    expect(screen.getByText("Informe a senha atual para definir uma nova senha")).toHaveAttribute("role", "alert");
    expect(fetchMock).not.toHaveBeenCalledWith("/api/profile", expect.objectContaining({ method: "PUT" }));
  });

  it("trocar o e-mail sem a senha atual também aponta o campo", async () => {
    mockFetch();
    render(<ProfilePage />);
    const user = userEvent.setup();
    const email = screen.getByLabelText("E-mail");
    await waitFor(() => expect(email).toHaveValue("ana@example.com"));
    await user.clear(email);
    await user.type(email, "nova@example.com");
    await user.click(screen.getByRole("button", { name: /Salvar alterações/ }));
    const current = screen.getByLabelText("Senha atual");
    await waitFor(() => expect(current).toHaveAttribute("aria-invalid", "true"));
    expect(screen.getByText("Informe a senha atual para alterar o e-mail.")).toBeInTheDocument();
  });
});
