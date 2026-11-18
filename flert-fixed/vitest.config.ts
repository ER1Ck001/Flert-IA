import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  // tsconfig usa "jsx": "preserve" (Next); nos testes o esbuild precisa compilar o JSX.
  esbuild: { jsx: "automatic" },
  test: {
    environment: "node",
    // Só os testes de UI rodam em jsdom; API/lib/config continuam em node.
    environmentMatchGlobs: [["tests/ui/**", "jsdom"]],
    include: ["src/**/*.test.ts", "tests/**/*.test.ts", "tests/**/*.test.tsx"],
    setupFiles: ["./tests/setup.ts", "./tests/ui/setup.ts"],
    clearMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    coverage: {
      provider: "v8",
      include: ["src/lib/**", "src/app/api/**/route.ts"],
    },
  },
});
