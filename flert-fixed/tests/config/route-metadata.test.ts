import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

// Tarefa 5: cada rota tem <title> próprio (as páginas são client components,
// então o metadata fica num layout.tsx server do segmento).
const root = path.resolve(__dirname, "../..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

const ROUTES: Array<[string, RegExp]> = [
  ["src/app/auth/login/layout.tsx", /Entrar/],
  ["src/app/auth/register/layout.tsx", /Criar conta/],
  ["src/app/auth/forgot-password/layout.tsx", /Recuperar senha/],
  ["src/app/auth/reset-password/layout.tsx", /Nova senha/],
  ["src/app/(dashboard)/dashboard/layout.tsx", /Início/],
  ["src/app/(dashboard)/analyze/layout.tsx", /Analisar/],
  ["src/app/(dashboard)/history/layout.tsx", /Histórico/],
  ["src/app/(dashboard)/pricing/layout.tsx", /Planos/],
  ["src/app/(dashboard)/profile/layout.tsx", /Perfil/],
  ["src/app/(dashboard)/settings/layout.tsx", /Configurações/],
  ["src/app/admin/layout.tsx", /Admin/],
];

describe("metadata por rota", () => {
  it("layout raiz usa title.template com o nome do produto", () => {
    const layout = read("src/app/layout.tsx");
    expect(layout).toMatch(/template:\s*"%s · Flert IA"/);
  });

  it.each(ROUTES)("%s exporta metadata com title", (file, title) => {
    expect(existsSync(path.join(root, file)), file).toBe(true);
    const src = read(file);
    expect(src).toMatch(/export const metadata/);
    expect(src).toMatch(new RegExp(`title:\\s*"[^"]*${title.source}`));
  });

  it("área logada, auth e admin não são indexadas", () => {
    expect(read("src/lib/seo.ts")).toMatch(/index:\s*false/);
    for (const [file] of ROUTES) {
      expect(read(file), file).toMatch(/robots:\s*PRIVATE_ROBOTS/);
    }
  });
});
