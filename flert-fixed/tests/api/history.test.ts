import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// Tarefa 9 (M7): paginação por cursor no GET /api/history, compatível com o cliente antigo.
const m = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: m.getServerSession }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({ prisma: { conversation: { findMany: m.findMany } } }));

import { GET } from "@/app/api/history/route";
import { HISTORY_DEFAULT_LIMIT, HISTORY_MAX_LIMIT } from "@/lib/validation/history";

const get = (qs = "") => GET(new NextRequest(`http://localhost/api/history${qs}`));
const conv = (n: number) => ({ id: `c${n}`, title: `t${n}`, createdAt: new Date(2026, 0, 30 - n).toISOString(), messages: [] });
const rows = (count: number) => Array.from({ length: count }, (_, i) => conv(i + 1));

beforeEach(() => {
  m.getServerSession.mockResolvedValue({ user: { id: "u1" } });
  m.findMany.mockResolvedValue([]);
});

describe("GET /api/history", () => {
  it("401 sem sessão, sem tocar no banco", async () => {
    m.getServerSession.mockResolvedValue(null);
    expect((await get("?limit=10")).status).toBe(401);
    expect(m.findMany).not.toHaveBeenCalled();
  });

  it("sem parâmetros: mesma consulta e mesmo formato de antes (cliente antigo durante o rollout)", async () => {
    m.findMany.mockResolvedValue(rows(3));
    const res = await get();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.conversations).toHaveLength(3);
    expect(json.nextCursor).toBeNull();
    expect(m.findMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
      include: { messages: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
  });

  it("limites: padrão 20, máximo 50", () => {
    expect(HISTORY_DEFAULT_LIMIT).toBe(20);
    expect(HISTORY_MAX_LIMIT).toBe(50);
  });

  it("primeira página: take limit+1, ordem createdAt desc + id desc, nextCursor = id do último item", async () => {
    m.findMany.mockResolvedValue(rows(11));
    const json = await (await get("?limit=10")).json();
    expect(m.findMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
      include: { messages: { orderBy: { createdAt: "asc" } } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 11,
    });
    expect(json.conversations).toHaveLength(10);
    expect(json.conversations.at(-1).id).toBe("c10");
    expect(json.nextCursor).toBe("c10");
  });

  it("última página: nextCursor null", async () => {
    m.findMany.mockResolvedValue(rows(4));
    const json = await (await get("?limit=10")).json();
    expect(json.conversations).toHaveLength(4);
    expect(json.nextCursor).toBeNull();
  });

  it("com cursor: começa depois do cursor (skip 1) e mantém o filtro pelo usuário da sessão", async () => {
    m.findMany.mockResolvedValue([]);
    await get("?cursor=clh1x2y3z0000abcd1234efgh&limit=5&userId=outro");
    expect(m.findMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
      include: { messages: { orderBy: { createdAt: "asc" } } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 6,
      cursor: { id: "clh1x2y3z0000abcd1234efgh" },
      skip: 1,
    });
  });

  it("cursor sem limit usa o limite padrão", async () => {
    await get("?cursor=c20");
    expect(m.findMany.mock.calls[0][0].take).toBe(HISTORY_DEFAULT_LIMIT + 1);
  });

  it.each(["?limit=0", "?limit=51", "?limit=abc", "?limit=1.5", "?cursor=", "?cursor=../x", "?cursor=a%27%20OR%201%3D1", "?limit="])(
    "400 com parâmetro inválido (%s), sem tocar no banco",
    async (qs) => {
      const res = await get(qs);
      expect(res.status).toBe(400);
      expect(m.findMany).not.toHaveBeenCalled();
    }
  );

  it("erro do banco → 500 sem vazar detalhes", async () => {
    m.findMany.mockRejectedValue(new Error("Invalid `prisma.conversation.findMany()` invocation: segredo"));
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await get("?limit=10");
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("segredo");
    err.mockRestore();
  });
});
