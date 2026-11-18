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
