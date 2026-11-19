import { describe, expect, it } from "vitest";
import {
  emailSchema,
  loginSchema,
  nameSchema,
  newPasswordSchema,
  normalizeEmail,
  profileUpdateSchema,
  registerSchema,
  resetPasswordFormSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";
import { idSchema } from "@/lib/validation/common";
import { adminEmailSchema, adminPatchUserSchema } from "@/lib/validation/admin";

const ok = (schema: { safeParse: (v: unknown) => { success: boolean } }, v: unknown) => schema.safeParse(v).success;

describe("emailSchema", () => {
  it("normaliza espaços e caixa", () => {
    expect(emailSchema.parse("  Foo@Example.COM  ")).toBe("foo@example.com");
    expect(normalizeEmail("  Foo@Example.COM ")).toBe("foo@example.com");
  });

  it.each(["a b@x.com", "foo@", "@x.com", "foo", "", "a@@x.com", "a@x.com\nBcc: y@z.com", null, 123, {}, []])(
    "rejeita %s",
    (v) => expect(ok(emailSchema, v)).toBe(false)
  );

  it("limita a 254 caracteres", () => {
    const at254 = `${"a".repeat(64)}@${"b".repeat(185)}.com`;
    expect(at254.length).toBe(254);
    expect(ok(emailSchema, at254)).toBe(true);
    expect(ok(emailSchema, "c" + at254)).toBe(false);
  });
});

describe("newPasswordSchema", () => {
  it.each([
    ["7 caracteres", "abc1234", false],
    ["8 caracteres", "abcdefg1", true],
    ["só letras", "abcdefgh", false],
    ["só números", "12345678", false],
    ["com símbolos", "abc!@#12", true],
    ["letras acentuadas", "ábcdéfg1", true],
    ["72 caracteres", "a1".repeat(36), true],
    ["73 caracteres", "a1".repeat(36) + "x", false],
    ["vazia", "", false],
    ["não-string", 12345678, false],
  ])("%s → %s", (_l, v, expected) => {
    expect(ok(newPasswordSchema, v)).toBe(expected);
  });

  it("limita a 72 bytes UTF-8 (bcrypt trunca o resto)", () => {
    expect(ok(newPasswordSchema, "a1" + "😀".repeat(18))).toBe(false); // 2 + 72 bytes
  });

  it("login aceita senha legada curta (sem regra de força)", () => {
    expect(ok(loginSchema, { email: "a@b.co", password: "abc123" })).toBe(true);
    expect(ok(loginSchema, { email: "a@b.co", password: "" })).toBe(false);
    expect(ok(loginSchema, { email: "a@b.co", password: "x".repeat(257) })).toBe(false);
  });
});

describe("nameSchema", () => {
  it("apara e colapsa espaços", () => {
    expect(nameSchema.parse("  José   da   Silva  ")).toBe("José da Silva");
  });

  it.each(["José da Silva", "Zoë", "李雷", "O'Brien", "Ana-Maria", "Al"])("aceita %s", (v) => {
    expect(ok(nameSchema, v)).toBe(true);
  });

  it.each([
    "<script>alert(1)</script>",
    "a<b",
    "a>b",
    "   ",
    "A",
    "x".repeat(61),
    "Jo\u0000hn",
    "Jo\nhn",
    "Ganhe dinheiro em https://golpe.com",
    "visite www.golpe.com",
    null,
  ])("rejeita %s", (v) => {
    expect(ok(nameSchema, v)).toBe(false);
  });

  it("o limite vale após colapsar espaços", () => {
    expect(ok(nameSchema, "  " + "a".repeat(30) + "     " + "b".repeat(29) + "  ")).toBe(true); // 60 após colapsar
  });
});

describe("registerSchema", () => {
  it("normaliza e remove campos extras (mass assignment)", () => {
    const r = registerSchema.parse({
      name: "  Ana  Souza ",
      email: " ANA@X.com ",
      password: "segredo123",
      adultConfirmed: true, // Tarefa 10: confirmação 18+ obrigatória
      isAdmin: true,
      subscriptionStatus: "LIFETIME",
    });
    expect(r).toEqual({ name: "Ana Souza", email: "ana@x.com", password: "segredo123", adultConfirmed: true, marketingOptIn: false });
  });

  it("mensagens de erro em português", () => {
    const r = registerSchema.safeParse({ name: "Ana", email: "ana@x.com", password: "123" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toMatch(/senha/i);
  });
});

describe("resetPassword", () => {
  const token = "a".repeat(64);

  it("aceita token hex de 64 caracteres", () => {
    expect(ok(resetPasswordSchema, { token, password: "novaSenha1" })).toBe(true);
  });

  it.each(["", "abc", "g".repeat(64), "a".repeat(63), "a".repeat(65), "' OR 1=1", "A".repeat(64), null, 123, { $ne: null }])(
    "rejeita token %s",
    (t) => expect(ok(resetPasswordSchema, { token: t, password: "novaSenha1" })).toBe(false)
  );

  it("exige senha forte", () => {
    expect(ok(resetPasswordSchema, { token, password: "fraca" })).toBe(false);
  });

  it("formulário exige confirmação igual", () => {
    expect(ok(resetPasswordFormSchema, { token, password: "novaSenha1", confirm: "novaSenha1" })).toBe(true);
    const r = resetPasswordFormSchema.safeParse({ token, password: "novaSenha1", confirm: "outra1234" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].path).toEqual(["confirm"]);
  });
});

describe("profileUpdateSchema", () => {
  const base = { name: "Ana", email: "ana@x.com" };

  it("só nome e e-mail é válido; strings vazias viram undefined", () => {
    expect(profileUpdateSchema.parse({ ...base, currentPassword: "", newPassword: "" })).toEqual(base);
  });

  it("nova senha exige a senha atual", () => {
    const r = profileUpdateSchema.safeParse({ ...base, newPassword: "novaSenha1" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].path).toEqual(["currentPassword"]);
  });

  it("nova senha fraca é rejeitada mesmo com a atual", () => {
    expect(ok(profileUpdateSchema, { ...base, currentPassword: "velha123", newPassword: "abc" })).toBe(false);
  });

  it("nova senha forte com a atual é válida", () => {
    expect(ok(profileUpdateSchema, { ...base, currentPassword: "velha123", newPassword: "novaSenha1" })).toBe(true);
  });
});

describe("idSchema", () => {
  it.each(["clh1x2y3z0000abcd1234efgh", "abc_123-XYZ"])("aceita %s", (v) => expect(ok(idSchema, v)).toBe(true));
  it.each(["", "../etc", "id' OR '1'='1", "a".repeat(65), null, "a b"])("rejeita %s", (v) =>
    expect(ok(idSchema, v)).toBe(false)
  );
});

describe("admin schemas", () => {
  it("template e plano precisam ser conhecidos", () => {
    expect(ok(adminEmailSchema, { template: "free_upsell" })).toBe(true);
    expect(ok(adminEmailSchema, { template: "hack" })).toBe(false);
    expect(ok(adminEmailSchema, { template: "custom", customSubject: "Oi", customBody: "x", targetPlan: "VIP" })).toBe(false);
  });

  it("custom exige assunto e corpo dentro dos limites, sem quebra de linha no assunto", () => {
    expect(ok(adminEmailSchema, { template: "custom", customSubject: "Oi", customBody: "Olá" })).toBe(true);
    expect(ok(adminEmailSchema, { template: "custom", customBody: "Olá" })).toBe(false);
    expect(ok(adminEmailSchema, { template: "custom", customSubject: "Oi", customBody: "" })).toBe(false);
    expect(ok(adminEmailSchema, { template: "custom", customSubject: "x".repeat(151), customBody: "a" })).toBe(false);
    expect(ok(adminEmailSchema, { template: "custom", customSubject: "Oi", customBody: "a".repeat(10001) })).toBe(false);
    expect(ok(adminEmailSchema, { template: "custom", customSubject: "Oi\r\nBcc: x@y.com", customBody: "a" })).toBe(false);
  });

  it("PATCH de usuário aceita só planos válidos", () => {
    expect(ok(adminPatchUserSchema, { subscription: "ANNUAL" })).toBe(true);
    expect(ok(adminPatchUserSchema, { subscription: "GOD" })).toBe(false);
  });
});
