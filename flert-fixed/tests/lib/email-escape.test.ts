import { describe, expect, it } from "vitest";
import { emailFirstName, escapeHtml, sanitizeHeader } from "@/lib/email/escape";

describe("escapeHtml", () => {
  it.each([
    ["<", "&lt;"],
    [">", "&gt;"],
    ["&", "&amp;"],
    ['"', "&quot;"],
    ["'", "&#39;"],
  ])("%s → %s", (input, out) => expect(escapeHtml(input)).toBe(out));

  it("escapa & primeiro (sem escape duplo incorreto)", () => {
    expect(escapeHtml("&lt;")).toBe("&amp;lt;");
  });

  it("neutraliza HTML injetado", () => {
    expect(escapeHtml("<img src=x onerror=alert(1)>")).not.toContain("<img");
  });

  it("valores vazios viram string vazia; unicode intacto", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
    expect(escapeHtml("José 💘")).toBe("José 💘");
  });
});

describe("emailFirstName", () => {
  it("primeiro nome escapado", () => {
    expect(emailFirstName("Ana Souza")).toBe("Ana");
    expect(emailFirstName("<b>x</b> Souza")).toBe("&lt;b&gt;x&lt;/b&gt;");
  });

  it("padrão 'você' e limite de 30 caracteres", () => {
    expect(emailFirstName(null)).toBe("você");
    expect(emailFirstName("   ")).toBe("você");
    expect(emailFirstName("a".repeat(50))).toBe("a".repeat(30));
  });
});

describe("sanitizeHeader", () => {
  it("remove quebras de linha e caracteres de controle", () => {
    expect(sanitizeHeader("Olá\r\nBcc: x@y.com")).toBe("Olá Bcc: x@y.com");
    expect(sanitizeHeader("a\u0000b")).toBe("ab");
  });
});
