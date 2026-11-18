import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  params: new URLSearchParams(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  signIn: mocks.signIn,
  useSession: () => ({ status: "unauthenticated", data: null }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace, refresh: mocks.refresh }),
  useSearchParams: () => mocks.params,
}));

vi.mock("react-hot-toast", () => ({
  default: { error: mocks.toastError, success: mocks.toastSuccess },
}));

import LoginPage from "@/app/auth/login/page";

async function fillAndSubmit() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Email"), "ana@exemplo.com");
  await user.type(screen.getByLabelText("Senha"), "SenhaForte1!");
  await user.click(screen.getByRole("button", { name: "Entrar" }));
}

describe("Login page", () => {
  beforeEach(() => {
    mocks.params = new URLSearchParams();
  });

  it("tem main#main, campos rotulados e botão Google", () => {
    const { container } = render(<LoginPage />);
    expect(container.querySelector("main#main")).not.toBeNull();
    expect(screen.getByLabelText("Email")).toHaveAttribute("autocomplete", "email");
    expect(screen.getByLabelText("Senha")).toHaveAttribute("autocomplete", "current-password");
    expect(screen.getByRole("button", { name: "Mostrar senha" })).not.toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("button", { name: /Google/ })).toBeInTheDocument();
  });

  it("enviar o formulário chama signIn('credentials', { email, password, redirect: false })", async () => {
    mocks.signIn.mockResolvedValue({ ok: true, error: undefined });
    render(<LoginPage />);
    await fillAndSubmit();
    await waitFor(() =>
      expect(mocks.signIn).toHaveBeenCalledWith("credentials", {
        email: "ana@exemplo.com",
        password: "SenhaForte1!",
        redirect: false,
      })
    );
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/dashboard"));
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Bem-vindo de volta.");
  });

  it("erro RATE_LIMITED mostra a mensagem de muitas tentativas", async () => {
    mocks.signIn.mockResolvedValue({ ok: false, error: "RATE_LIMITED" });
    render(<LoginPage />);
    await fillAndSubmit();
    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith("Muitas tentativas. Aguarde alguns minutos e tente de novo.")
    );
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("credencial inválida mostra a mensagem genérica", async () => {
    mocks.signIn.mockResolvedValue({ ok: false, error: "CredentialsSignin" });
    render(<LoginPage />);
    await fillAndSubmit();
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith("Email ou senha inválidos"));
  });

  it("callbackUrl externo é ignorado — router.push recebe /dashboard", async () => {
    mocks.params = new URLSearchParams({ callbackUrl: "https://site-malicioso.com/x" });
    mocks.signIn.mockResolvedValue({ ok: true, error: undefined });
    render(<LoginPage />);
    await fillAndSubmit();
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/dashboard"));
    expect(mocks.push).not.toHaveBeenCalledWith(expect.stringContaining("malicioso"));
  });

  it("Google usa o callbackUrl seguro", async () => {
    mocks.params = new URLSearchParams({ callbackUrl: "/history" });
    mocks.signIn.mockResolvedValue(undefined);
    render(<LoginPage />);
    await userEvent.click(screen.getByRole("button", { name: /Google/ }));
    expect(mocks.signIn).toHaveBeenCalledWith("google", { callbackUrl: "/history" });
  });
});
