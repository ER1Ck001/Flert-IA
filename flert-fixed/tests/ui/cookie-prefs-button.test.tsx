import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { CookiePrefsButton } from "@/components/landing/CookiePrefsButton";
import { OPEN_CONSENT_EVENT } from "@/components/consent/ConsentBanner";

describe("CookiePrefsButton", () => {
  it("é um botão type=button que dispara OPEN_CONSENT_EVENT", () => {
    const listener = vi.fn();
    window.addEventListener(OPEN_CONSENT_EVENT, listener);
    render(<CookiePrefsButton />);
    const btn = screen.getByRole("button", { name: "Preferências de cookies" });
    expect(btn).toHaveAttribute("type", "button");
    fireEvent.click(btn);
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(OPEN_CONSENT_EVENT, listener);
  });
});
