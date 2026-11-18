import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  push: vi.fn(),
  params: new URLSearchParams(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  signIn: mocks.signIn,
  useSession: () => ({ status: "unauthenticated", data: null }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => mocks.params,
}));
vi.mock("react-hot-toast", () => ({ default: { error: mocks.toastError, success: mocks.toastSuccess } }));

import RegisterPage from "@/app/auth/register/page";
import ForgotPasswordPage from "@/app/auth/forgot-password/page";
import ResetPasswordPage from "@/app/auth/reset-password/page";
import LoginPage from "@/app/auth/login/page";

const VALID_TOKEN = "a".repeat(64);

describe("Formulários de auth — validação inline e foco", () => {
  beforeEach(() => {
    mocks.params = new URLSearchParams();
  });

  it("cadastro: senha fraca mostra erro no campo, marca aria-invalid, foca e não chama a API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<RegisterPage />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Nome completo"), "Ana Lima");
    await user.type(screen.getByLabelText("Email"), "ana@exemplo.com");
    await user.type(screen.getByLabelText("Senha"), "fraquinha");
    await user.click(screen.getByRole("button", { name: "Criar conta" }));

    const pwd = screen.getByLabelText("Senha");
    await waitFor(() => expect(pwd).toHaveAttribute("aria-invalid", "true"));
    expect(pwd).toHaveFocus();
    const errId = pwd.getAttribute("aria-describedby")!.split(" ").find((id) => id.endsWith("-error"))!;
    expect(document.getElementById(errId)).toHaveAttribute("role", "alert");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("cadastro: corrigir o campo limpa o erro", async () => {
    vi.stubGlobal("fetch", vi.fn());
    render(<RegisterPage />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Nome completo"), "A");
    await user.type(screen.getByLabelText("Email"), "ana@exemplo.com");
    await user.type(screen.getByLabelText("Senha"), "SenhaForte1!");
    await user.click(screen.getByRole("button", { name: "Criar conta" }));
    const name = screen.getByLabelText("Nome completo");
    await waitFor(() => expect(name).toHaveAttribute("aria-invalid", "true"));
    await user.type(name, "na");
    expect(name).not.toHaveAttribute("aria-invalid");
  });

  it("esqueci a senha: após enviar, o foco vai para a confirmação", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 200, json: async () => ({}) }) as Response));
    render(<ForgotPasswordPage />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Email"), "ana@exemplo.com");
    await user.click(screen.getByRole("button", { name: /Enviar link/ }));
    const heading = await screen.findByRole("heading", { name: "Email enviado." });
    await waitFor(() => expect(heading).toHaveFocus());
  });

  it("nova senha: confirmação diferente mostra erro no campo Confirmar", async () => {
    mocks.params = new URLSearchParams({ token: VALID_TOKEN });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<ResetPasswordPage />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Nova senha"), "SenhaForte1!");
    await user.type(screen.getByLabelText("Confirmar senha"), "OutraSenha1!");
    await user.click(screen.getByRole("button", { name: "Redefinir senha" }));
    const confirm = screen.getByLabelText("Confirmar senha");
    await waitFor(() => expect(confirm).toHaveAttribute("aria-invalid", "true"));
    expect(confirm).toHaveFocus();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("login: ?error= do NextAuth (Google) vira mensagem visível", () => {
    mocks.params = new URLSearchParams({ error: "OAuthAccountNotLinked" });
    render(<LoginPage />);
    expect(screen.getByRole("alert")).toHaveTextContent(/já está cadastrado/);
  });

  it("login: erro genérico do Google também é explicado", () => {
    mocks.params = new URLSearchParams({ error: "OAuthCallback" });
    render(<LoginPage />);
    expect(screen.getByRole("alert")).toHaveTextContent(/Não foi possível entrar/);
  });

  it("login: sem ?error não há alerta", () => {
    render(<LoginPage />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
