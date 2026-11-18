import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "../..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

describe("content guard — fundação Faísca", () => {
  const layout = read("src/app/layout.tsx");
  const css = read("src/app/globals.css");

  it("layout não bloqueia zoom (acessibilidade)", () => {
    expect(layout).not.toMatch(/userScalable/);
    expect(layout).not.toMatch(/maximumScale/);
  });

  it("layout não carrega Cormorant", () => {
    expect(layout).not.toMatch(/Cormorant/i);
  });

  it("layout tem skip link para #main e viewportFit cover", () => {
    expect(layout).toMatch(/href="#main"/);
    expect(layout).toMatch(/Pular para o conteúdo/);
    expect(layout).toMatch(/viewportFit:\s*"cover"/);
  });

  it("globals.css não usa @import (Cabinet vem só do <link>) nem Cormorant", () => {
    expect(css).not.toMatch(/@import/);
    expect(css).not.toMatch(/cormorant/i);
  });

  it("globals.css não tem tema claro nem transição global", () => {
    expect(css).not.toMatch(/data-theme="light"/);
    expect(css).not.toMatch(/transition:\s*background-color 0\.4s/);
  });
});

describe("content guard — landing (4.2)", () => {
  const landingDir = path.join(root, "src/components/landing");
  const files = [
    "src/app/page.tsx",
    ...(existsSync(landingDir)
      ? readdirSync(landingDir)
          .filter((f) => /\.(tsx?|css)$/.test(f))
          .map((f) => `src/components/landing/${f}`)
      : []),
  ];
  const FORBIDDEN = ["Resultado real", "Ela respondeu", "Ela mandou", "MELHOR ESCOLHA", "Mais popular"];

  it("tem os componentes da landing nova", () => {
    expect(files).toEqual(expect.arrayContaining(["src/components/landing/InteractiveDemo.tsx"]));
    expect(files).not.toContain("src/components/landing/ConversationalLanding.tsx");
  });

  it.each(FORBIDDEN)("nenhum arquivo da landing contém \"%s\"", (phrase) => {
    const re = new RegExp(phrase, "i");
    const offenders = files.filter((f) => re.test(read(f)));
    expect(offenders).toEqual([]);
  });

  it("landing não usa o vídeo nem as cenas antigas", () => {
    const offenders = files.filter((f) => /couple\/|video\.mp4|scene-\d/.test(read(f)));
    expect(offenders).toEqual([]);
  });

  it("globals.css não tem mais as classes chat-* da landing antiga", () => {
    expect(read("src/app/globals.css")).not.toMatch(/\.chat-/);
  });
});

describe("content guard — auth (4.3)", () => {
  const authDir = path.join(root, "src/app/auth");
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) return walk(full);
      return /\.(tsx?|css)$/.test(e.name) ? [path.relative(root, full)] : [];
    });
  const files = existsSync(authDir) ? walk(authDir) : [];

  it("encontra as 4 páginas de auth", () => {
    expect(files.length).toBeGreaterThanOrEqual(4);
  });

  it.each(["dangerouslySetInnerHTML", "AUTH_CSS", "burst"])(
    "nenhum arquivo em src/app/auth contém \"%s\"",
    (needle) => {
      const offenders = files.filter((f) => read(f).includes(needle));
      expect(offenders).toEqual([]);
    }
  );

  it("páginas de auth usam o AuthShell e não usam classes au-*", () => {
    const offenders = files.filter((f) => /className="au[-"\s]/.test(read(f)) || !read(f).includes("AuthShell"));
    expect(offenders).toEqual([]);
  });
});

describe("content guard — analyze + dashboard (4.4)", () => {
  const walk = (dir: string): string[] =>
    existsSync(dir)
      ? readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
          const full = path.join(dir, e.name);
          if (e.isDirectory()) return walk(full);
          return /\.(tsx?|css)$/.test(e.name) ? [path.relative(root, full)] : [];
        })
      : [];
  const pages = [
    ...walk(path.join(root, "src/app/(dashboard)/analyze")),
    ...walk(path.join(root, "src/app/(dashboard)/dashboard")),
  ];
  const components = walk(path.join(root, "src/components/analyze"));
  const files = [...pages, ...components];

  it("encontra as páginas de analyze e dashboard e os componentes de analyze", () => {
    expect(pages.length).toBeGreaterThanOrEqual(2);
    expect(components.map((f) => path.basename(f)).sort()).toEqual(
      expect.arrayContaining([
        "AnalyzeGate.tsx",
        "ModeCard.tsx",
        "ResultsPanel.tsx",
        "StickyActionBar.tsx",
        "SuggestionCard.tsx",
        "UploadDropzone.tsx",
        "UsageMeter.tsx",
        "tones.ts",
      ])
    );
  });

  it.each(["az-", "AZ_CSS", "MAIS USADO", "dangerouslySetInnerHTML"])(
    "nenhum arquivo de analyze/dashboard contém \"%s\"",
    (needle) => {
      const offenders = files.filter((f) => read(f).includes(needle));
      expect(offenders).toEqual([]);
    }
  );

  it("magic-card foi removido e ninguém o importa", () => {
    expect(existsSync(path.join(root, "src/components/ui/magic-card.tsx"))).toBe(false);
    const offenders = walk(path.join(root, "src")).filter((f) => /magic-card|MagicCard/.test(read(f)));
    expect(offenders).toEqual([]);
  });

  it("tones.ts declara os 7 values fixos da API, na ordem", () => {
    const src = read("src/components/analyze/tones.ts");
    const values = [...src.matchAll(/value:\s*"([a-z]+)"/g)].map((m) => m[1]);
    expect(values).toEqual(["flirty", "funny", "casual", "witty", "serious", "pickup", "stories"]);
  });
});
