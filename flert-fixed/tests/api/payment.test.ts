import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getServerSession } = vi.hoisted(() => ({ getServerSession: vi.fn() }));

vi.mock("next-auth", () => ({ getServerSession }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({ prisma: { subscriptionStatus: { findUnique: vi.fn() } } }));

import { POST } from "@/app/api/payment/route";

const fetchMock = vi.fn();
let userSeq = 0;

function req(body: unknown) {
  return new NextRequest("http://localhost/api/payment", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("ABACATEPAY_API_KEY", "key");
  vi.stubEnv("ABACATEPAY_BASE_URL", "https://api.abacatepay.com/v2");
  vi.stubEnv("ABACATEPAY_PRODUCT_ID_MONTHLY", "prod_monthly");
  vi.stubEnv("ABACATEPAY_PRODUCT_ID_ANNUAL", "prod_annual");
  vi.stubEnv("ABACATEPAY_PRODUCT_ID_LIFETIME", "prod_lifetime");
  // usuário novo por teste para não esbarrar no rate limit em memória
  getServerSession.mockResolvedValue({ user: { id: `user_${++userSeq}`, email: "u@example.com", name: null } });
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify({ data: { id: "bill_1", url: "https://app.abacatepay.com/pay/bill_1" } }), { status: 200 })
  );
});

describe("POST /api/payment", () => {
  it("401 sem sessão", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await POST(req({ plan: "monthly" }))).status).toBe(401);
  });

  it.each(["constructor", "__proto__", "toString", "LIFETIME", 1, null])("400 para plano inválido (%s)", async (plan) => {
    const res = await POST(req({ plan }));
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("500 quando o ID do produto não está configurado", async () => {
    vi.stubEnv("ABACATEPAY_PRODUCT_ID_ANNUAL", "");
    const res = await POST(req({ plan: "annual" }));
    expect(res.status).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("cria checkout com o produto certo e externalId do usuário (usuário Google sem nome também pode pagar)", async () => {
    const res = await POST(req({ plan: "lifetime" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: "https://app.abacatepay.com/pay/bill_1" });

    const sent = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sent.items).toEqual([{ id: "prod_lifetime", quantity: 1 }]);
    expect(sent.methods).toEqual(["PIX", "CARD"]);
    expect(sent.externalId).toMatch(new RegExp(`^fia:user_${userSeq}:lifetime:[0-9a-f-]{36}$`));
  });

  it("429 após muitas tentativas do mesmo usuário", async () => {
    let last = 0;
    for (let i = 0; i < 11; i++) last = (await POST(req({ plan: "monthly" }))).status;
    expect(last).toBe(429);
  });

  it("502 quando o gateway falha", async () => {
    fetchMock.mockResolvedValue(new Response("boom", { status: 500 }));
    expect((await POST(req({ plan: "monthly" }))).status).toBe(502);
  });
});
