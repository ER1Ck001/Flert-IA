import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const nextConfig = require("../../next.config.js");

type Rule = { source: string; headers: { key: string; value: string }[] };

describe("headers de segurança (next.config.js)", () => {
  it("não expõe X-Powered-By", () => {
    expect(nextConfig.poweredByHeader).toBe(false);
  });

  it("aplica CSP e headers essenciais em todas as rotas", async () => {
    const rules: Rule[] = await nextConfig.headers();
    const all = rules.find((r) => r.source === "/:path*")!;
    const h = Object.fromEntries(all.headers.map((x) => [x.key, x.value]));
    expect(h["X-Content-Type-Options"]).toBe("nosniff");
    expect(h["X-Frame-Options"]).toBe("DENY");
    expect(h["Strict-Transport-Security"]).toMatch(/max-age=\d+/);
    expect(h["Permissions-Policy"]).toMatch(/camera=\(\)/);
    const csp = h["Content-Security-Policy"];
    expect(csp).toMatch(/frame-ancestors 'none'/);
    expect(csp).toMatch(/object-src 'none'/);
    expect(csp).toMatch(/base-uri 'self'/);
    expect(csp).toMatch(/connect\.facebook\.net/);
  });

  it("página de redefinição de senha não envia Referer (token na URL)", async () => {
    const rules: Rule[] = await nextConfig.headers();
    const reset = rules.find((r) => r.source === "/auth/reset-password")!;
    expect(reset.headers).toContainEqual({ key: "Referrer-Policy", value: "no-referrer" });
  });
});
