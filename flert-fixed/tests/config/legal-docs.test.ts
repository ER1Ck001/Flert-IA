import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { LAST_UPDATED, LEGAL_PUBLISHED, LEGAL_VERSION, findPlaceholders, shouldRenderLegalPage } from "@/content/legal/config";
import { TERMOS } from "@/content/legal/termos";
import { PRIVACIDADE } from "@/content/legal/privacidade";
import { FAQ_ITEMS } from "@/content/faq";

// Tarefa 10: Termos e Política de Privacidade como rascunho, reembolso de 7 dias e migration aditiva.
const root = path.resolve(__dirname, "../..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");
const docText = (doc: typeof TERMOS) => JSON.stringify(doc);

describe("documentos legais — publicação", () => {
  it("NÃO pode publicar com placeholders [..] pendentes", () => {
    const pending = [...findPlaceholders(TERMOS), ...findPlaceholders(PRIVACIDADE)];
    // Se LEGAL_PUBLISHED = true, todos os [NOME/RAZÃO SOCIAL], [CPF/CNPJ]... precisam estar preenchidos.
    expect(LEGAL_PUBLISHED && pending.length > 0, `placeholders pendentes: ${pending.join(", ")}`).toBe(false);
  });

  it("findPlaceholders encontra os campos do controlador", () => {
    const found = findPlaceholders(PRIVACIDADE);
    if (!LEGAL_PUBLISHED) {
      expect(found).toEqual(
        expect.arrayContaining(["[NOME/RAZÃO SOCIAL]", "[CPF/CNPJ]", "[ENDEREÇO]", "[E-MAIL DO ENCARREGADO]"])
      );
    }
    expect(findPlaceholders({ a: ["sem nada", "texto [X Y]"] })).toEqual(["[X Y]"]);
  });

  it("versão e data definidas", () => {
    expect(LEGAL_VERSION).toMatch(/\S/);
    expect(LAST_UPDATED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("sem publicar: 404 em produção, renderiza em dev", () => {
    expect(shouldRenderLegalPage(false, "production")).toBe(false);
    expect(shouldRenderLegalPage(false, "development")).toBe(true);
    expect(shouldRenderLegalPage(false, "test")).toBe(true);
    expect(shouldRenderLegalPage(true, "production")).toBe(true);
  });

  it.each(["src/app/termos/page.tsx", "src/app/privacidade/page.tsx"])("%s usa notFound, banner de rascunho e metadata", (f) => {
    const src = read(f);
    expect(src).toMatch(/notFound\(\)/);
    expect(src).toMatch(/shouldRenderLegalPage/);
    expect(src).toMatch(/export const metadata/);
    expect(read("src/components/legal/LegalDocument.tsx")).toMatch(/Rascunho — não publicado/);
  });

  it.each(["src/content/legal/termos.ts", "src/content/legal/privacidade.ts", "src/content/legal/config.ts"])(
    "%s começa com o aviso de rascunho",
    (f) => {
      expect(read(f).slice(0, 300)).toMatch(/rascunho — revisar com advogado antes de publicar/);
    }
  );

  it("README tem a nota de rascunho e como publicar", () => {
    const readme = read("README.md");
    expect(readme).toMatch(/rascunho — revisar com advogado antes de publicar/);
    expect(readme).toMatch(/LEGAL_PUBLISHED/);
  });

  it("links para os documentos ficam escondidos enquanto não publicados", () => {
    for (const f of ["src/components/landing/LandingFooter.tsx", "src/app/auth/register/page.tsx"]) {
      const src = read(f);
      expect(src, f).toMatch(/LEGAL_PUBLISHED/);
    }
    const sitemap = read("src/app/sitemap.ts");
    expect(sitemap).toMatch(/LEGAL_PUBLISHED/);
  });
});

describe("documentos legais — conteúdo verificado no código", () => {
  const privacy = docText(PRIVACIDADE);
  const terms = docText(TERMOS);

  it.each([
    "OpenAI",
    "Vercel",
    "Neon",
    "AbacatePay",
    "Google",
    "Meta",
    "localStorage",
    "art. 18",
    "18 anos",
    "transferência internacional",
    "[E-MAIL DO ENCARREGADO]",
  ])("Política de Privacidade menciona %s", (needle) => {
    if (needle.startsWith("[") && LEGAL_PUBLISHED) return;
    expect(privacy.toLowerCase()).toContain(needle.toLowerCase());
  });

  it("diz que imagens e contexto NÃO ficam salvos, mas são enviados à OpenAI", () => {
    expect(privacy).toMatch(/não fica(m)? salv[ao]s?/i);
    expect(privacy).toMatch(/hash/i); // senha e IP (rate limit) só como hash
  });

  it.each(["7 dias", "18 anos", "renovação automática", "OpenAI", "assédio"])("Termos mencionam %s", (needle) => {
    expect(terms.toLowerCase()).toContain(needle.toLowerCase());
  });

  it("não alega certificações nem medidas que o código não tem", () => {
    for (const text of [privacy, terms]) {
      expect(text).not.toMatch(/ISO ?27001|SOC ?2|PCI|certificad|criptografia de ponta|criptografia em repouso|100% segur/i);
    }
  });
});

describe("reembolso de 7 dias em todo lugar (CDC art. 49)", () => {
  const walk = (dir: string): string[] =>
    existsSync(dir)
      ? readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
          const full = path.join(dir, e.name);
          if (e.isDirectory()) return walk(full);
          return /\.(tsx?|md)$/.test(e.name) ? [path.relative(root, full).split(path.sep).join("/")] : [];
        })
      : [];
  const files = [...walk(path.join(root, "src")), ...walk(path.join(root, "docs"))];

  it("nenhum arquivo mantém a regra antiga (12 horas / no máximo 1 análise)", () => {
    const offenders = files.filter((f) => /12 horas|12 ?h\b|no máximo 1 análise/i.test(read(f)));
    expect(offenders).toEqual([]);
  });

  it("FAQ e pricing: reembolso integral em até 7 dias, pedido por e-mail, sem prometer automático", () => {
    const refund = FAQ_ITEMS.find((i) => /reembolso/i.test(i.q))?.a ?? "";
    expect(refund).toMatch(/7 dias/);
    expect(refund).toMatch(/integral/);
    expect(refund).toMatch(/e-mail/);
    expect(refund).not.toMatch(/automátic[oa] (e|na hora)|reembolso automático/i);
    const pricing = read("src/app/(dashboard)/pricing/page.tsx");
    expect(pricing).toMatch(/7 dias/);
    expect(pricing).not.toMatch(/12 horas/);
  });
});

describe("migration legal_consent", () => {
  const dir = readdirSync(path.join(root, "prisma/migrations")).filter((d) => d.endsWith("_legal_consent"));

  it("existe uma só, depois das anteriores, aditiva e idempotente", () => {
    expect(dir).toHaveLength(1);
    const all = readdirSync(path.join(root, "prisma/migrations")).filter((d) => /^\d+_/.test(d)).sort();
    expect(all[all.length - 1]).toBe(dir[0]);
    const sql = read(`prisma/migrations/${dir[0]}/migration.sql`);
    for (const col of ["marketingOptIn", "marketingOptInAt", "adultConfirmedAt", "termsAcceptedAt", "termsVersion"]) {
      expect(sql).toMatch(new RegExp(`ADD COLUMN IF NOT EXISTS "${col}"`));
    }
    expect(sql).toMatch(/"marketingOptIn" BOOLEAN NOT NULL DEFAULT false/);
    expect(sql).not.toMatch(/DROP|UPDATE|DELETE|ALTER COLUMN|RENAME/i);
  });

  it("schema.prisma declara os campos no User", () => {
    const schema = read("prisma/schema.prisma");
    expect(schema).toMatch(/marketingOptIn\s+Boolean\s+@default\(false\)/);
    expect(schema).toMatch(/marketingOptInAt\s+DateTime\?/);
    expect(schema).toMatch(/adultConfirmedAt\s+DateTime\?/);
    expect(schema).toMatch(/termsAcceptedAt\s+DateTime\?/);
    expect(schema).toMatch(/termsVersion\s+String\?/);
  });
});
