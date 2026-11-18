import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

// Tarefa 9 (B4): logs do servidor passam por errorMessage() (erros do Prisma viram só "Nome:código";
// a mensagem crua inclui a invocação com valores).
const root = path.resolve(__dirname, "../..");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : /\.(ts|tsx)$/.test(name) ? [full] : [];
  });
}

const serverFiles = [...walk(path.join(root, "src/app/api")), ...walk(path.join(root, "src/lib"))]
  .map((f) => ({ rel: path.relative(root, f).split(path.sep).join("/"), text: readFileSync(f, "utf8") }))
  .filter((f) => f.rel !== "src/lib/http.ts");

describe("logs seguros no servidor", () => {
  it("nenhum console.* com error.message cru", () => {
    const offenders = serverFiles.flatMap((f) =>
      f.text
        .split("\n")
        .map((line, i) => ({ line, n: i + 1 }))
        .filter(({ line }) => /console\.(error|warn|log)\(/.test(line) && /instanceof Error \? \w+\.message/.test(line))
        .map(({ n }) => `${f.rel}:${n}`)
    );
    expect(offenders).toEqual([]);
  });

  it("nenhum console.* que loga o objeto de erro inteiro", () => {
    const offenders = serverFiles.flatMap((f) =>
      f.text
        .split("\n")
        .map((line, i) => ({ line, n: i + 1 }))
        .filter(({ line }) => /console\.(error|warn|log)\([^)]*,\s*(e|err|error)\s*\)/.test(line))
        .map(({ n }) => `${f.rel}:${n}`)
    );
    expect(offenders).toEqual([]);
  });
});
