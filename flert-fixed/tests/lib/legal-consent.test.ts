import { beforeEach, describe, expect, it, vi } from "vitest";

// Tarefa 10: cadastro com 18+ e opt-in, link de descadastro assinado, e-mails promocionais
// com List-Unsubscribe, claim `adult` no JWT e Pixel fora da página de descadastro.
const m = vi.hoisted(() => ({ findUnique: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: m.findUnique } } }));

import { buildRegisterSchema, registerSchema } from "@/lib/validation/auth";
import { unsubscribeLinks, unsubscribeToken, verifyUnsubscribeToken } from "@/lib/email/unsubscribe";
import {
  customEmail,
  expiringEmail,
  freeUpsellEmail,
  planActivatedEmail,
  welcomeEmail,
  UNSUBSCRIBE_LABEL,
} from "@/lib/email/templates";
import { checkSessionVersion } from "@/lib/session-version";
import { shouldLoadPixel } from "@/lib/consent";
import { adultGateRedirect, ADULT_CONFIRM_PATH } from "@/lib/adult-gate";

const base = { name: "Ana Lima", email: "ana@x.com", password: "segredo123" };

describe("registerSchema (18+ e opt-in)", () => {
  it("exige adultConfirmed === true com mensagem no campo", () => {
    for (const adultConfirmed of [undefined, false, "true", 1]) {
      const r = registerSchema.safeParse({ ...base, adultConfirmed });
      expect(r.success).toBe(false);
      if (!r.success) {
        const issue = r.error.issues.find((i) => i.path[0] === "adultConfirmed");
        expect(issue?.message).toMatch(/18 anos/);
      }
    }
  });

  it("opt-in de marketing é opcional e começa desligado", () => {
    const r = registerSchema.parse({ ...base, adultConfirmed: true });
    expect(r.marketingOptIn).toBe(false);
    expect(registerSchema.parse({ ...base, adultConfirmed: true, marketingOptIn: true }).marketingOptIn).toBe(true);
    expect(registerSchema.safeParse({ ...base, adultConfirmed: true, marketingOptIn: "sim" }).success).toBe(false);
  });

  it("com os documentos publicados, a mesma caixa também aceita os Termos (mensagem cita os Termos)", () => {
    const published = buildRegisterSchema(true);
    const r = published.safeParse({ ...base });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.find((i) => i.path[0] === "adultConfirmed")?.message).toMatch(/Termos de Uso/);
    expect(published.safeParse({ ...base, adultConfirmed: true }).success).toBe(true);
  });
});

describe("link de descadastro (HMAC-SHA256 do userId)", () => {
  it("token determinístico, hex de 64 e verificável só para o mesmo usuário", () => {
    const t = unsubscribeToken("user_1");
    expect(t).toMatch(/^[a-f0-9]{64}$/);
    expect(unsubscribeToken("user_1")).toBe(t);
    expect(verifyUnsubscribeToken("user_1", t)).toBe(true);
    expect(verifyUnsubscribeToken("user_2", t)).toBe(false);
  });

  it.each([undefined, null, "", "abc", "z".repeat(64), "A".repeat(64), `${"a".repeat(64)}x`])(
    "rejeita token malformado %s sem lançar",
    (bad) => {
      expect(verifyUnsubscribeToken("user_1", bad as string)).toBe(false);
    }
  );

  it("rejeita userId malformado", () => {
    expect(verifyUnsubscribeToken("../x", unsubscribeToken("../x"))).toBe(false);
    expect(verifyUnsubscribeToken("", unsubscribeToken(""))).toBe(false);
  });

  it("muda com o segredo (assinatura depende de NEXTAUTH_SECRET)", () => {
    const t = unsubscribeToken("user_1");
    vi.stubEnv("NEXTAUTH_SECRET", "outro-segredo");
    expect(verifyUnsubscribeToken("user_1", t)).toBe(false);
  });

  it("em produção sem NEXTAUTH_SECRET não usa segredo padrão", () => {
    vi.stubEnv("NEXTAUTH_SECRET", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(() => unsubscribeToken("user_1")).toThrow();
  });

  it("links: página de confirmação (GET) e one-click (POST) com u e t", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.test");
    const { pageUrl, oneClickUrl } = unsubscribeLinks("user_1");
    const t = unsubscribeToken("user_1");
    expect(pageUrl).toBe(`https://app.test/descadastrar?u=user_1&t=${t}`);
    expect(oneClickUrl).toBe(`https://app.test/api/email/unsubscribe?u=user_1&t=${t}`);
  });
});

describe("templates: promocionais têm descadastro; transacionais não", () => {
  const links = { pageUrl: "https://app.test/descadastrar?u=u1&t=abc", oneClickUrl: "https://app.test/api/email/unsubscribe?u=u1&t=abc" };
  const promos = [
    ["freeUpsell", freeUpsellEmail({ name: "Ana", unsubscribe: links })],
    ["expiring", expiringEmail({ name: "Ana", days: 3, unsubscribe: links })],
    ["custom", customEmail({ name: "Ana", subject: "Oi", body: "Texto", unsubscribe: links })],
  ] as const;

  it.each(promos)("%s: link visível e cabeçalhos RFC 8058", (_n, mail) => {
    expect(UNSUBSCRIBE_LABEL).toBe("Não quero mais receber");
    expect(mail.html).toContain(UNSUBSCRIBE_LABEL);
    expect(mail.html).toContain('href="https://app.test/descadastrar?u=u1&amp;t=abc"');
    expect(mail.headers).toEqual({
      "List-Unsubscribe": "<https://app.test/api/email/unsubscribe?u=u1&t=abc>",
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    });
  });

  it("boas-vindas e plano ativo seguem sem descadastro (transacionais)", () => {
    for (const mail of [welcomeEmail({ name: "Ana" }), planActivatedEmail({ name: "Ana", plan: "PREMIUM", expiresAt: null })]) {
      expect(mail.html).not.toContain(UNSUBSCRIBE_LABEL);
      expect(mail.headers).toBeUndefined();
    }
  });
});

describe("checkSessionVersion atualiza o claim adult a partir do banco", () => {
  beforeEach(() => m.findUnique.mockReset());

  it("na conferência periódica, adult reflete adultConfirmedAt", async () => {
    const now = Date.now();
    m.findUnique.mockResolvedValue({ sessionVersion: 0, adultConfirmedAt: new Date() });
    const token: Record<string, unknown> = { id: "u1", sv: 0, svCheckedAt: 0, adult: false };
    expect(await checkSessionVersion(token, now)).toBe("ok");
    expect(token.adult).toBe(true);

    m.findUnique.mockResolvedValue({ sessionVersion: 0, adultConfirmedAt: null });
    const t2: Record<string, unknown> = { id: "u1", sv: 0, svCheckedAt: 0, adult: true };
    await checkSessionVersion(t2, now);
    expect(t2.adult).toBe(false);
  });
});

describe("Pixel nunca carrega na página de descadastro (token na URL)", () => {
  it("shouldLoadPixel é false em /descadastrar mesmo com aceite", () => {
    const consent = { v: 1, marketing: true, at: 0 };
    expect(shouldLoadPixel(consent, "/descadastrar")).toBe(false);
    expect(shouldLoadPixel(consent, "/")).toBe(true);
  });
});

describe("adultGateRedirect (middleware)", () => {
  const adult = { id: "u1", adult: true };
  const minor = { id: "u1", adult: false };
  const legacy = { id: "u1" }; // token emitido antes da Tarefa 10

  it.each(["/dashboard", "/analyze", "/history", "/pricing", "/profile", "/settings", "/settings/x"])(
    "sem confirmação, %s vai para a confirmação com callbackUrl",
    (p) => {
      const to = adultGateRedirect(minor, p, "");
      expect(to).toBe(`${ADULT_CONFIRM_PATH}?callbackUrl=${encodeURIComponent(p)}`);
      expect(adultGateRedirect(legacy, p, "")).toBe(to);
    }
  );

  it("preserva a querystring no callbackUrl", () => {
    expect(adultGateRedirect(minor, "/dashboard", "?payment=success")).toBe(
      `${ADULT_CONFIRM_PATH}?callbackUrl=${encodeURIComponent("/dashboard?payment=success")}`
    );
  });

  it.each(["/admin", "/auth/login", "/", "/api/analyze", "/dashboardx", ADULT_CONFIRM_PATH])(
    "não mexe em %s",
    (p) => {
      expect(adultGateRedirect(minor, p, "")).toBeNull();
    }
  );

  it("confirmado: deixa passar e, na página de confirmação, volta para o callbackUrl seguro", () => {
    expect(adultGateRedirect(adult, "/dashboard", "")).toBeNull();
    expect(adultGateRedirect(adult, ADULT_CONFIRM_PATH, "?callbackUrl=%2Fanalyze")).toBe("/analyze");
    expect(adultGateRedirect(adult, ADULT_CONFIRM_PATH, "?callbackUrl=https%3A%2F%2Fevil.com")).toBe("/dashboard");
    expect(adultGateRedirect(adult, ADULT_CONFIRM_PATH, "?callbackUrl=%2F%2Fevil.com")).toBe("/dashboard");
    expect(adultGateRedirect(adult, ADULT_CONFIRM_PATH, `?callbackUrl=${encodeURIComponent(ADULT_CONFIRM_PATH)}`)).toBe("/dashboard");
  });

  it("sem token não decide (o withAuth manda para o login)", () => {
    expect(adultGateRedirect(null, "/dashboard", "")).toBeNull();
  });
});
