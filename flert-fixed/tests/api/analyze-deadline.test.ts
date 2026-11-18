import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// Tarefa 9 (M6): OpenAI travada → erro honesto e cota liberada, pelo mesmo caminho de openai_error.
// Aqui o generate.ts é o real; só o SDK da OpenAI é simulado.
const m = vi.hoisted(() => ({
  create: vi.fn(),
  getServerSession: vi.fn(),
  getEntitlement: vi.fn(),
  reserveDailyUsage: vi.fn(),
  releaseDailyUsage: vi.fn(),
  refundDailyUsage: vi.fn(),
  rateLimit: vi.fn(),
  conversationCreate: vi.fn(),
}));

vi.mock("openai", () => ({
  default: class {
    chat = { completions: { create: m.create } };
  },
}));
vi.mock("next-auth", () => ({ getServerSession: m.getServerSession }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/subscription", () => ({ getEntitlement: m.getEntitlement }));
vi.mock("@/lib/usage", () => ({
  reserveDailyUsage: m.reserveDailyUsage,
  releaseDailyUsage: m.releaseDailyUsage,
  refundDailyUsage: m.refundDailyUsage,
}));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: m.rateLimit }));
vi.mock("@/lib/prisma", () => ({ prisma: { conversation: { create: m.conversationCreate } } }));

import { POST as postImage } from "@/app/api/analyze/route";
import { POST as postText } from "@/app/api/analyze/text/route";
import { OPENAI_DEADLINE_MS } from "@/lib/ai/generate";

const req = (url: string, body: unknown) =>
  new NextRequest(`http://localhost${url}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const routes = [
  { name: "/api/analyze", post: postImage, url: "/api/analyze", body: { imageUrl: "data:image/png;base64,AAA", style: "flirty" } },
  { name: "/api/analyze/text", post: postText, url: "/api/analyze/text", body: { context: "ela curte trilha", mode: "start", style: "flirty" } },
];

beforeEach(() => {
  vi.useFakeTimers();
  m.getServerSession.mockResolvedValue({ user: { id: "u1" } });
  m.getEntitlement.mockResolvedValue({ plan: "PREMIUM", isPaid: true, isExpired: false, dailyLimit: 30 });
  m.reserveDailyUsage.mockResolvedValue({ ok: true, dayKey: "2026-01-09", used: 1 });
  m.releaseDailyUsage.mockResolvedValue(undefined);
  m.refundDailyUsage.mockResolvedValue(true);
  m.rateLimit.mockResolvedValue({ allowed: true, remaining: 9, retryAfterSec: 0 });
  m.create.mockImplementation(
    (_body: unknown, opts?: { signal?: AbortSignal }) =>
      new Promise((_, reject) => opts?.signal?.addEventListener("abort", () => reject(new Error("aborted"))))
  );
});
afterEach(() => {
  vi.useRealTimers();
});

describe.each(routes)("$name com a OpenAI travada", ({ post, url, body }) => {
  it("responde 502 honesto no prazo e libera a reserva da cota (não usa devolução)", async () => {
    const pending = post(req(url, body));
    await vi.advanceTimersByTimeAsync(OPENAI_DEADLINE_MS);
    const res = await pending;
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error).toMatch(/não foi descontada/i);
    expect(json.retryable).toBe(true);
    expect(m.releaseDailyUsage).toHaveBeenCalledWith("u1", "2026-01-09");
    expect(m.refundDailyUsage).not.toHaveBeenCalled();
    expect(m.conversationCreate).not.toHaveBeenCalled();
  });
});
