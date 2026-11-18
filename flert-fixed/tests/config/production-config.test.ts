import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

// Tarefa 6: produção e performance.
const root = path.resolve(__dirname, "../..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");
const require = createRequire(import.meta.url);
const nextConfig = require("../../next.config.js");

describe("índices do banco", () => {
  const schema = read("prisma/schema.prisma");
  const migrationsDir = path.join(root, "prisma/migrations");
  const dir = readdirSync(migrationsDir).find((d) => d.endsWith("_perf_indexes"));

  const INDEXES: Array<[model: string, schemaLine: RegExp, sql: RegExp]> = [
    ["Conversation", /@@index\(\[userId, createdAt\]\)/, /"Conversation_userId_createdAt_idx" ON "Conversation"\("userId", "createdAt"\)/],
    ["Message", /@@index\(\[conversationId, createdAt\]\)/, /"Message_conversationId_createdAt_idx" ON "Message"\("conversationId", "createdAt"\)/],
    ["Account", /@@index\(\[userId\]\)/, /"Account_userId_idx" ON "Account"\("userId"\)/],
    ["Session", /@@index\(\[userId\]\)/, /"Session_userId_idx" ON "Session"\("userId"\)/],
    ["PasswordResetToken", /@@index\(\[userId\]\)/, /"PasswordResetToken_userId_idx" ON "PasswordResetToken"\("userId"\)/],
  ];

  const modelBlock = (name: string) => schema.match(new RegExp(`model ${name} \\{[\\s\\S]*?\\n\\}`))?.[0] ?? "";

  it("existe uma migration nova *_perf_indexes", () => {
    expect(dir).toBeDefined();
    expect(existsSync(path.join(migrationsDir, dir!, "migration.sql"))).toBe(true);
  });

  it.each(INDEXES)("%s: índice no schema e na migration", (model, schemaLine, sql) => {
    expect(modelBlock(model)).toMatch(schemaLine);
    expect(read(`prisma/migrations/${dir}/migration.sql`)).toMatch(sql);
  });

  it("migration é só aditiva e idempotente (CREATE INDEX IF NOT EXISTS)", () => {
    const sql = read(`prisma/migrations/${dir}/migration.sql`).replace(/--.*$/gm, "");
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
    expect(statements).toHaveLength(INDEXES.length);
    for (const s of statements) expect(s).toMatch(/^CREATE INDEX IF NOT EXISTS /);
    expect(sql).not.toMatch(/\b(DROP|ALTER|DELETE|UPDATE|TRUNCATE)\b/i);
  });
});

describe("next.config.js", () => {
  it("Image Optimizer desligado (só avatares do admin usavam; menor superfície de ataque)", () => {
    expect(nextConfig.images.unoptimized).toBe(true);
  });
  it("instrumentation estável no Next 15: sem a flag experimental (que só gera aviso no 15)", () => {
    expect(nextConfig.experimental?.instrumentationHook).toBeUndefined();
    expect(existsSync(path.join(root, "src/instrumentation.ts"))).toBe(true);
  });
  it("pacotes externos do servidor com a chave estável do Next 15", () => {
    expect(nextConfig.serverExternalPackages).toEqual(expect.arrayContaining(["@prisma/client", "bcryptjs"]));
    expect(nextConfig.experimental?.serverComponentsExternalPackages).toBeUndefined();
  });
});

describe("instrumentation", () => {
  it("valida o ambiente só no runtime Node", () => {
    const src = read("src/instrumentation.ts");
    expect(src).toMatch(/export async function register/);
    expect(src).toMatch(/NEXT_RUNTIME === "nodejs"/);
    expect(src).toMatch(/assertServerEnv/);
  });
});

describe("e-mail", () => {
  it("nenhum módulo cria transporte SMTP próprio (todos usam lib/email/transport)", () => {
    const files = [
      "src/lib/auth.ts",
      "src/app/api/admin/email/route.ts",
      "src/app/api/auth/forgot-password/route.ts",
      "src/app/api/auth/register/route.ts",
      "src/app/api/profile/route.ts",
      "src/app/api/webhooks/abacatepay/route.ts",
    ];
    for (const f of files) {
      const src = read(f);
      expect(src, f).not.toMatch(/nodemailer\.createTransport/);
      expect(src, f).toMatch(/createMailTransport\(\)/);
    }
  });
});

describe("limites de tempo das funções", () => {
  it.each([
    ["src/app/api/webhooks/abacatepay/route.ts"],
    ["src/app/api/payment/route.ts"],
  ])("%s declara maxDuration", (f) => {
    expect(read(f)).toMatch(/export const maxDuration = \d+;/);
  });
});
