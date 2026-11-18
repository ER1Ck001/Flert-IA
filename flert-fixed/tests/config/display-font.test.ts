import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

// Fonte de display com licença aberta (SIL OFL), servida pela própria origem via next/font.
// A Cabinet Grotesk (Fontshare, ITF FFL) foi removida: a licença proíbe distribuir os arquivos
// em repositório público, e o CSS externo bloqueava o render.
const root = path.resolve(__dirname, "../..");
const read = (f: string) => readFileSync(path.join(root, f), "utf8");

describe("fonte de display (Bricolage Grotesque, OFL)", () => {
  it("layout carrega Bricolage Grotesque via next/font/local com variável --font-display", () => {
    const layout = read("src/app/layout.tsx");
    expect(layout).toMatch(/from "next\/font\/local"/);
    expect(layout).toMatch(/bricolage-grotesque-latin-800-normal\.woff2/);
    expect(layout).toMatch(/variable:\s*"--font-display"/);
    expect(layout).toMatch(/display:\s*"swap"/);
  });

  it("os arquivos da fonte (woff2) e a licença OFL estão no repositório", () => {
    for (const w of ["500", "700", "800"]) {
      const buf = readFileSync(path.join(root, `src/fonts/bricolage/bricolage-grotesque-latin-${w}-normal.woff2`));
      expect(buf.subarray(0, 4).toString("latin1")).toBe("wOF2");
    }
    expect(read("src/fonts/bricolage/OFL.txt")).toMatch(/SIL Open Font License, Version 1\.1/);
  });

  it("não há mais referência à Fontshare nem à Cabinet Grotesk no código", () => {
    for (const f of ["src/app/layout.tsx", "next.config.js", "tailwind.config.ts", "src/app/globals.css"]) {
      const src = read(f);
      expect(src, f).not.toMatch(/fontshare/i);
      expect(src, f).not.toMatch(/cabinet/i);
    }
  });

  it("tailwind usa var(--font-display) no stack de display", () => {
    const tw = read("tailwind.config.ts");
    expect(tw).toMatch(/displayStack\s*=\s*\[\s*'var\(--font-display\)'/);
  });

  it("CSP de fontes e estilos aceita só a própria origem (sem CDN de fonte)", () => {
    const cfg = read("next.config.js");
    expect(cfg).toMatch(/"font-src 'self' data:"/);
    expect(cfg).toMatch(/"style-src 'self' 'unsafe-inline'"/);
  });
});
