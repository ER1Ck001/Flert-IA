import { describe, expect, it, vi } from "vitest";
import { assertServerEnv, checkEnv, CRITICAL_ENV, RECOMMENDED_ENV } from "@/lib/env";

const FULL: Record<string, string> = {
  DATABASE_URL: "postgresql://u:p@host/db?sslmode=require",
  NEXTAUTH_SECRET: "x".repeat(40),
  NEXTAUTH_URL: "https://flertia.com.br",
  OPENAI_API_KEY: "sk-test",
  ABACATEPAY_API_KEY: "k",
  ABACATEPAY_BASE_URL: "https://api.abacatepay.com/v2",
  ABACATEPAY_WEBHOOK_SECRET: "s".repeat(40),
  ABACATEPAY_PRODUCT_ID_MONTHLY: "a",
  ABACATEPAY_PRODUCT_ID_ANNUAL: "b",
  ABACATEPAY_PRODUCT_ID_LIFETIME: "c",
  SMTP_HOST: "smtp.example.com",
  SMTP_USER: "u",
  SMTP_PASSWORD: "p",
  SMTP_FROM: "Flert IA <noreply@example.com>",
  NEXT_PUBLIC_APP_URL: "https://flertia.com.br",
  ADMIN_EMAIL: "admin@example.com",
};

describe("checkEnv", () => {
  it("tudo configurado → nada faltando", () => {
    expect(checkEnv(FULL)).toEqual({ missingCritical: [], invalid: [], missingRecommended: [], warnings: [] });
  });

  it("lista só os NOMES das variáveis críticas ausentes", () => {
    const r = checkEnv({ ...FULL, DATABASE_URL: "", NEXTAUTH_SECRET: undefined as unknown as string });
    expect(r.missingCritical).toEqual(["DATABASE_URL", "NEXTAUTH_SECRET"]);
  });

  it("DATABASE_URL que não é Postgres é inválida", () => {
    expect(checkEnv({ ...FULL, DATABASE_URL: "mysql://x" }).invalid).toEqual(["DATABASE_URL"]);
  });

  it("variáveis recomendadas ausentes não são críticas", () => {
    const r = checkEnv({ ...FULL, OPENAI_API_KEY: "", SMTP_HOST: "  " });
    expect(r.missingCritical).toEqual([]);
    expect(r.missingRecommended).toEqual(expect.arrayContaining(["OPENAI_API_KEY", "SMTP_HOST"]));
  });

  it("avisa (sem derrubar) segredo curto e URL pública mal formada", () => {
    const r = checkEnv({ ...FULL, NEXTAUTH_SECRET: "curto", NEXT_PUBLIC_APP_URL: "flertia" });
    expect(r.missingCritical).toEqual([]);
    expect(r.invalid).toEqual([]);
    expect(r.warnings.join(" ")).toMatch(/NEXTAUTH_SECRET/);
    expect(r.warnings.join(" ")).toMatch(/NEXT_PUBLIC_APP_URL/);
  });

  it("críticas e recomendadas não se sobrepõem", () => {
    for (const name of CRITICAL_ENV) expect(RECOMMENDED_ENV).not.toContain(name);
  });
});

describe("assertServerEnv", () => {
  it("lança com os nomes (nunca os valores) quando falta variável crítica", () => {
    const env = { ...FULL, NODE_ENV: "production", DATABASE_URL: "" };
    expect(() => assertServerEnv(env)).toThrow(/DATABASE_URL/);
    try {
      assertServerEnv({ ...env, NEXTAUTH_SECRET: "segredo-que-nao-pode-vazar" });
    } catch (e) {
      expect(String(e)).not.toContain("segredo-que-nao-pode-vazar");
    }
  });

  it("não valida durante o `next build` (CI sem variáveis)", () => {
    expect(() => assertServerEnv({ NEXT_PHASE: "phase-production-build" })).not.toThrow();
  });

  it("recomendadas ausentes só geram aviso com nomes", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => assertServerEnv({ ...FULL, OPENAI_API_KEY: "" })).not.toThrow();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("OPENAI_API_KEY"));
    expect(warn.mock.calls.flat().join(" ")).not.toContain("sk-test");
  });

  it("configuração completa não lança nem avisa", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => assertServerEnv(FULL)).not.toThrow();
    expect(warn).not.toHaveBeenCalled();
  });
});
