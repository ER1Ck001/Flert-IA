import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
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
