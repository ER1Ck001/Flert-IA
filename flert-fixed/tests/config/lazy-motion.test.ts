import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

// Tarefa 9 (M1): framer-motion via LazyMotion + `m`, para não carregar o `motion` completo.
const root = path.resolve(__dirname, "../..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : /\.(ts|tsx)$/.test(name) ? [full] : [];
  });
}

const srcFiles = walk(path.join(root, "src")).map((f) => ({
  rel: path.relative(root, f).split(path.sep).join("/"),
  text: readFileSync(f, "utf8"),
}));

const framerImports = (text: string) =>
  [...text.matchAll(/import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*["']framer-motion["']/g)].map((m) =>
    m[1].split(",").map((s) => s.trim().split(/\s+as\s+/)[0].replace(/^type\s+/, "")).filter(Boolean)
  ).flat();

describe("LazyMotion", () => {
  it("nenhum arquivo de src importa o componente `motion` completo", () => {
    const offenders = srcFiles.filter((f) => framerImports(f.text).includes("motion")).map((f) => f.rel);
    expect(offenders).toEqual([]);
  });

  it("nenhum JSX usa <motion.*>", () => {
    const offenders = srcFiles.filter((f) => /<motion\.[a-z]/.test(f.text)).map((f) => f.rel);
    expect(offenders).toEqual([]);
  });

  it("o provider carrega domAnimation de forma síncrona, em strict, e mantém reducedMotion=user", () => {
    const p = read("src/components/motion/MotionProvider.tsx");
    expect(p).toMatch(/<LazyMotion\s+features=\{domAnimation\}\s+strict>/);
    expect(p).toMatch(/<MotionConfig reducedMotion="user">/);
    expect(read("src/app/providers.tsx")).toMatch(/<MotionProvider>/);
  });

  it("domMax (layoutId do tone-chip) é carregado sob demanda, nunca importado estaticamente", () => {
    const staticDomMax = srcFiles
      .filter((f) => framerImports(f.text).includes("domMax"))
      .map((f) => f.rel);
    // Só o módulo que é importado via import() pode citar domMax.
    expect(staticDomMax).toEqual(["src/components/motion/dom-max.ts"]);
    const chip = read("src/components/ui/tone-chip.tsx");
    expect(chip).toMatch(/import\(["']@\/components\/motion\/dom-max["']\)/);
    expect(chip).toMatch(/<LazyMotion features=\{loadDomMax\}>/);
    const dynamicUsers = srcFiles.filter((f) => f.text.includes("motion/dom-max")).map((f) => f.rel);
    expect(dynamicUsers).toEqual(["src/components/ui/tone-chip.tsx"]);
  });
});
