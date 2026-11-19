import { describe, expect, it, vi } from "vitest";

const prisma = vi.hoisted(() => ({ $queryRaw: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma }));

import * as route from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("200 com status ok, sem cache", async () => {
    const res = await route.GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
    expect(res.headers.get("cache-control")).toMatch(/no-store/);
  });

  it("não expõe variáveis de ambiente, versão nem banco", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://segredo@host/db");
    const text = JSON.stringify(await (await route.GET()).json());
    expect(text).not.toMatch(/postgres|segredo|version|database/i);
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it("é dinâmica (nunca pré-renderizada no build)", () => {
    expect(route.dynamic).toBe("force-dynamic");
  });
});
