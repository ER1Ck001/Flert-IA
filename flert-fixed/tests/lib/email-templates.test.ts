import { describe, expect, it } from "vitest";
import {
  FREE_UPSELL_SUBJECT,
  customEmail,
  expiringEmail,
  expiringSubject,
  freeUpsellEmail,
  planActivatedEmail,
  welcomeEmail,
} from "@/lib/email/templates";
import { PLANS_IN_ORDER, PLAN_CONFIG, formatBRL, getPlanBenefits } from "@/lib/plans";
import { SUPPORT_EMAIL } from "@/lib/support";

const EMOJI = /(?![©®™])\p{Extended_Pictographic}/gu;
const emojiCount = (s: string) => (s.match(EMOJI) ?? []).length;

const BANNED = [
  /Flert\.IA/i,
  /Flerte IA/i,
  /IA treinada/i,
  /IA avançada/i,
  /parecem (humanas|suas)/i,
  /não de IA/i,
  /marcar o encontro/i,
  /vida amorosa/i,
  /conexão real/i,
  /sair na frente/i,
  /destravar/i,
  /exatamente o que você precisa/i,
  /para sempre/i,
  /nunca mais/i,
  /respondemos rápido/i,
  /a partir de/i,
  /Bem-vind[oa]/i,
  /Chega de/i,
];

const all = () => [
  welcomeEmail({ name: "Ana Lima" }),
  ...PLANS_IN_ORDER.map((p) => planActivatedEmail({ name: "Ana", plan: p.id, expiresAt: new Date("2026-12-18T15:00:00Z") })),
  freeUpsellEmail({ name: "Ana" }),
  expiringEmail({ name: "Ana", days: 3 }),
  customEmail({ name: "Ana", subject: "Novidades no Flert IA", body: "Linha 1\nLinha 2" }),
];

describe("templates de e-mail — regras da voz", () => {
  it.each(BANNED.map((re) => [re.source, re] as const))("nenhum e-mail contém /%s/", (_s, re) => {
    const offenders = all().filter((m) => re.test(m.subject) || re.test(m.html));
    expect(offenders.map((m) => m.subject)).toEqual([]);
  });

  it("assunto com no máximo 1 emoji e corpo sem emoji", () => {
    for (const m of all()) {
      expect(emojiCount(m.subject)).toBeLessThanOrEqual(1);
      expect(emojiCount(m.html)).toBe(0);
    }
  });

  it("marca \"Flert IA\" com IA em destaque e e-mail de suporte central", () => {
    for (const m of all()) {
      expect(m.html).toMatch(/Flert <span[^>]*>IA<\/span>/);
      expect(m.html).toContain(`mailto:${SUPPORT_EMAIL}`);
      expect(m.html).toMatch(/e-mail/);
      expect(m.html).not.toMatch(/\bemail\b/);
    }
  });
});

describe("welcomeEmail", () => {
  it("assunto neutro em gênero, com o nome em texto puro", () => {
    expect(welcomeEmail({ name: "Ana Lima" }).subject).toBe("Boas-vindas ao Flert IA, Ana");
    expect(welcomeEmail({ name: "O'Brien\r\nBcc: x" }).subject).not.toMatch(/[\r\n]/);
    expect(welcomeEmail({ name: null }).subject).toBe("Boas-vindas ao Flert IA, você");
  });

  it("explica o mecanismo e lista os planos com preço e limite de plans.ts", () => {
    const { html } = welcomeEmail({ name: "Ana" });
    expect(html).toContain("3 sugestões");
    for (const p of PLANS_IN_ORDER) {
      expect(html).toContain(p.label);
      expect(html).toContain(formatBRL(p.priceCents));
      expect(html).toContain(p.dailyLimit === null ? "análises ilimitadas" : `${p.dailyLimit} análises por dia`);
    }
  });

  it("escapa o nome no HTML", () => {
    const { html } = welcomeEmail({ name: "<b>Ana" });
    expect(html).toContain("&lt;b&gt;Ana");
    expect(html).not.toContain("<b>Ana");
  });
});

describe("planActivatedEmail", () => {
  const expiresAt = new Date("2026-12-18T15:00:00Z");

  it.each(PLANS_IN_ORDER.map((p) => [p.label, p.id] as const))("assunto do plano %s", (label, plan) => {
    expect(planActivatedEmail({ name: "Ana", plan, expiresAt }).subject).toBe(`Plano ${label} ativo no Flert IA`);
  });

  it("Mensal/Anual: data de fim (horário de Brasília) e aviso de que não renova sozinho", () => {
    for (const plan of ["PREMIUM", "ANNUAL"] as const) {
      const { html } = planActivatedEmail({ name: "Ana", plan, expiresAt });
      expect(html).toContain("Seu acesso vale até 18/12/2026.");
      expect(html).toContain("Não há renovação automática.");
    }
  });

  it("Vitalício: ilimitado, sem data de expiração e sem prometer ausência total de limites", () => {
    const { html } = planActivatedEmail({ name: "Ana", plan: "LIFETIME", expiresAt: null });
    expect(html).toContain("Seu acesso é ilimitado e não tem data de expiração.");
    expect(html).not.toMatch(/vale até/);
  });

  it("lista os benefícios de getPlanBenefits", () => {
    const { html } = planActivatedEmail({ name: "Ana", plan: "ANNUAL", expiresAt });
    for (const b of getPlanBenefits("ANNUAL")) expect(html).toContain(b);
  });
});

describe("campanhas do admin", () => {
  it("free_upsell: assunto factual e todos os preços vindos de plans.ts", () => {
    const m = freeUpsellEmail({ name: "Ana" });
    expect(m.subject).toBe(FREE_UPSELL_SUBJECT);
    expect(m.subject).toBe("Seu Flert IA está pronto, falta escolher um plano");
    for (const p of PLANS_IN_ORDER) expect(m.html).toContain(`${p.label} ${formatBRL(p.priceCents)}`);
    expect(m.html).toContain(formatBRL(PLAN_CONFIG.LIFETIME.priceCents));
  });

  it("expiring: assunto sem emoji, singular e plural", () => {
    expect(expiringSubject(1)).toBe("Seu plano Flert IA vence em 1 dia");
    expect(expiringSubject(3)).toBe("Seu plano Flert IA vence em 3 dias");
    expect(expiringEmail({ name: "Ana", days: 3 }).html).toContain("os dias que restam são somados ao novo período");
  });

  it("custom: escapa o corpo e limpa o assunto", () => {
    const m = customEmail({ name: "Ana", subject: "Oi\r\nBcc: a@b.c", body: "<script>x</script>\nSegunda" });
    expect(m.subject).not.toMatch(/[\r\n]/);
    expect(m.html).toContain("&lt;script&gt;");
    expect(m.html).not.toContain("<script>");
    expect(m.html).toContain("Segunda");
  });
});
