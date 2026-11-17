import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const m = vi.hoisted(() => {
  const prisma = {
    user: { findUnique: vi.fn(), findMany: vi.fn(), delete: vi.fn() },
    subscriptionStatus: { findMany: vi.fn(), upsert: vi.fn() },
  };
  return { prisma, getServerSession: vi.fn(), isAdminUser: vi.fn(), sendMail: vi.fn() };
});

vi.mock("next-auth", () => ({ getServerSession: m.getServerSession }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({ prisma: m.prisma }));
vi.mock("@/lib/admin", () => ({ isAdminUser: m.isAdminUser }));
vi.mock("nodemailer", () => ({ default: { createTransport: () => ({ sendMail: m.sendMail }) } }));

import { POST as sendEmail } from "@/app/api/admin/email/route";
import { DELETE as deleteUser, PATCH as patchUser } from "@/app/api/admin/users/[id]/route";
import { GET as listUsers } from "@/app/api/admin/users/route";

const json = (url: string, method: string, body: unknown) =>
  new NextRequest(`http://localhost${url}`, {
    method,
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

const ID = "clh1x2y3z0000abcd1234efgh";

beforeEach(() => {
  m.getServerSession.mockResolvedValue({ user: { id: "admin", email: "ADMIN@x.com" } });
  m.isAdminUser.mockResolvedValue(true);
  m.prisma.user.findUnique.mockResolvedValue({ id: ID, email: "u@x.com", name: "Ana", subscriptionStatus: null });
  m.prisma.user.findMany.mockResolvedValue([]);
  m.prisma.subscriptionStatus.upsert.mockResolvedValue({});
  m.sendMail.mockResolvedValue({});
});

describe("autorização de admin", () => {
  it("todas as rotas consultam isAdminUser com o id da sessão e negam quem não é admin", async () => {
    m.isAdminUser.mockResolvedValue(false);
    expect((await listUsers()).status).toBe(403);
    expect((await sendEmail(json("/api/admin/email", "POST", { template: "free_upsell" }))).status).toBe(401);
    expect((await patchUser(json(`/api/admin/users/${ID}`, "PATCH", { subscription: "FREE" }), { params: { id: ID } })).status).toBe(403);
    expect((await deleteUser(json(`/api/admin/users/${ID}`, "DELETE", {}), { params: { id: ID } })).status).toBe(403);
    expect(m.isAdminUser).toHaveBeenCalledWith("admin");
    expect(m.prisma.subscriptionStatus.upsert).not.toHaveBeenCalled();
    expect(m.prisma.user.delete).not.toHaveBeenCalled();
  });
});

describe("POST /api/admin/email", () => {
  it.each(["{x", { template: "hack" }, { template: "custom", customSubject: "Oi\r\nBcc: a@b.c", customBody: "x" }, { template: "custom", targetPlan: "VIP", customSubject: "a", customBody: "b" }])(
    "400 com entrada inválida %o",
    async (body) => {
      expect((await sendEmail(json("/api/admin/email", "POST", body))).status).toBe(400);
      expect(m.sendMail).not.toHaveBeenCalled();
    }
  );

  it("404 quando userId não existe", async () => {
    m.prisma.user.findUnique.mockResolvedValue(null);
    expect((await sendEmail(json("/api/admin/email", "POST", { template: "free_upsell", userId: ID }))).status).toBe(404);
  });

  it("nome do destinatário é escapado no HTML", async () => {
    m.prisma.user.findUnique.mockResolvedValue({ email: "u@x.com", name: "<b>Ana</b>", subscriptionStatus: null });
    const res = await sendEmail(json("/api/admin/email", "POST", { template: "custom", userId: ID, customSubject: "Novidade", customBody: "Olá" }));
    expect(res.status).toBe(200);
    expect(m.sendMail.mock.calls[0][0].html).toContain("&lt;b&gt;Ana");
    expect(m.sendMail.mock.calls[0][0].html).not.toContain("<b>Ana");
  });
});

describe("PATCH/DELETE /api/admin/users/[id]", () => {
  it("400 com id ou plano inválidos e JSON quebrado", async () => {
    expect((await patchUser(json("/api/admin/users/x", "PATCH", { subscription: "FREE" }), { params: { id: "../x" } })).status).toBe(400);
    expect((await patchUser(json(`/api/admin/users/${ID}`, "PATCH", { subscription: "GOD" }), { params: { id: ID } })).status).toBe(400);
    expect((await patchUser(json(`/api/admin/users/${ID}`, "PATCH", "{x"), { params: { id: ID } })).status).toBe(400);
  });

  it("404 ao alterar plano de usuário inexistente (antes: 500 de FK)", async () => {
    m.prisma.user.findUnique.mockResolvedValue(null);
    expect((await patchUser(json(`/api/admin/users/${ID}`, "PATCH", { subscription: "ANNUAL" }), { params: { id: ID } })).status).toBe(404);
    expect(m.prisma.subscriptionStatus.upsert).not.toHaveBeenCalled();
  });

  it("404 ao excluir usuário inexistente (antes: 500 P2025)", async () => {
    m.prisma.user.delete.mockRejectedValue(Object.assign(new Error("nf"), { code: "P2025" }));
    expect((await deleteUser(json(`/api/admin/users/${ID}`, "DELETE", {}), { params: { id: ID } })).status).toBe(404);
  });
});
