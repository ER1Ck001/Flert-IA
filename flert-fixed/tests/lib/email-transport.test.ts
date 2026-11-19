import { describe, expect, it, vi } from "vitest";

const { createTransport } = vi.hoisted(() => ({ createTransport: vi.fn(() => ({ sendMail: vi.fn() })) }));
vi.mock("nodemailer", () => ({ default: { createTransport } }));

import { createMailTransport, smtpOptions } from "@/lib/email/transport";

describe("transporte SMTP compartilhado", () => {
  it("lê host/porta/credenciais do ambiente (porta padrão 587, sem TLS implícito)", () => {
    vi.stubEnv("SMTP_HOST", "smtp.example.com");
    vi.stubEnv("SMTP_PORT", "");
    vi.stubEnv("SMTP_USER", "user");
    vi.stubEnv("SMTP_PASSWORD", "pass");
    const o = smtpOptions();
    expect(o).toMatchObject({ host: "smtp.example.com", port: 587, secure: false, auth: { user: "user", pass: "pass" } });
  });

  it("tem timeouts curtos: um SMTP lento não pode segurar a função serverless até o limite", () => {
    const o = smtpOptions();
    for (const k of ["connectionTimeout", "greetingTimeout", "socketTimeout"] as const) {
      expect(o[k]).toBeGreaterThan(0);
      expect(o[k]).toBeLessThanOrEqual(20_000);
    }
  });

  it("createMailTransport usa essas opções", () => {
    vi.stubEnv("SMTP_PORT", "2525");
    createMailTransport();
    expect(createTransport).toHaveBeenCalledWith(expect.objectContaining({ port: 2525, socketTimeout: expect.any(Number) }));
  });
});
