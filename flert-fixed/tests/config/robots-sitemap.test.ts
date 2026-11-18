import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

const BASE = "https://flertia.com.br";

describe("robots.txt", () => {
  const r = robots();
  const rules = Array.isArray(r.rules) ? r.rules : [r.rules];

  it("permite a landing e aponta o sitemap", () => {
    expect(rules[0].allow).toBe("/");
    expect(r.sitemap).toBe(`${BASE}/sitemap.xml`);
  });

  it("bloqueia API, admin, área logada e auth", () => {
    const disallow = ([] as string[]).concat(rules[0].disallow ?? []);
    for (const p of ["/api/", "/admin", "/dashboard", "/analyze", "/history", "/profile", "/settings", "/pricing", "/auth/"]) {
      expect(disallow).toContain(p);
    }
  });
});

describe("sitemap.xml", () => {
  it("só páginas públicas", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toEqual([`${BASE}/`]);
  });
});
