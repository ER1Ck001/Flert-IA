import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/navigation", () => ({ usePathname: () => "/profile" }));
const signOut = vi.fn();
vi.mock("next-auth/react", () => ({ signOut: (...a: unknown[]) => signOut(...a) }));

import { AccountSheet } from "@/components/app/AccountSheet";

describe("AccountSheet", () => {
  it("preserva suporte, Seja Premium e Sair; fecha com Esc", async () => {
    const onOpenChange = vi.fn();
    render(<AccountSheet open onOpenChange={onOpenChange} user={{ id: "u1", name: "Ana Lima", email: "a@b.c" }} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Perfil/ })).toHaveAttribute("href", "/profile");
    expect(screen.getByRole("link", { name: /Configurações/ })).toHaveAttribute("href", "/settings");
    expect(screen.getByRole("link", { name: /Suporte/ })).toHaveAttribute(
      "href",
      "https://mail.google.com/mail/?view=cm&to=erickdev@flertia.com.br&su=Suporte%20Flert%20IA"
    );
    expect(screen.getByRole("link", { name: /Seja Premium/ })).toHaveAttribute("href", "/pricing");
    // Todos os planos têm os mesmos recursos; só o Vitalício tem análises ilimitadas.
    expect(screen.queryByText(/Recursos ilimitados/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Sair" }));
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: "/" });

    await userEvent.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
