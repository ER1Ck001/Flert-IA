import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorMessage, tooMany } from "@/lib/http";
import { getIp, rateLimit } from "@/lib/rate-limit";
import { UNSUBSCRIBE_PAGE_PATH, verifyUnsubscribeToken } from "@/lib/email/unsubscribe";

// Descadastro de e-mails promocionais por link assinado (sem login).
// - POST com corpo "List-Unsubscribe=One-Click" (RFC 8058, enviado pelo provedor de e-mail):
//   desliga e responde 200. Aceita outra origem de propósito — a autorização é o token HMAC.
// - POST do formulário de /descadastrar: desliga e redireciona (303) para a página com o resultado.
// - GET nunca altera nada (pré-carregamento de links): redireciona para a página de confirmação.
// A resposta não depende de a conta existir (sem enumeração): só da validade da assinatura.

const pageUrl = (req: NextRequest, query: string) => new URL(`${UNSUBSCRIBE_PAGE_PATH}?${query}`, req.url);

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const u = params.get("u") ?? "";
  const t = params.get("t") ?? "";
  const query = u && t ? `u=${encodeURIComponent(u)}&t=${encodeURIComponent(t)}` : "status=invalid";
  return NextResponse.redirect(pageUrl(request, query), 303);
}

export async function POST(request: NextRequest) {
  const body = await request.text().catch(() => "");
  const oneClick = /(^|&)List-Unsubscribe=One-Click(&|$)/.test(body.trim());
  const done = (ok: boolean) =>
    oneClick
      ? new NextResponse(ok ? "ok" : "link inválido", { status: ok ? 200 : 400, headers: { "content-type": "text/plain; charset=utf-8" } })
      : NextResponse.redirect(pageUrl(request, `status=${ok ? "ok" : "invalid"}`), 303);

  try {
    const limit = await rateLimit("unsubscribe:ip", getIp(request), 30, 900, { onError: "allow" });
    if (!limit.allowed) return tooMany(limit.retryAfterSec);

    const params = request.nextUrl.searchParams;
    const userId = params.get("u");
    if (!verifyUnsubscribeToken(userId, params.get("t"))) return done(false);

    // updateMany: conta já excluída não lança (mesma resposta de sucesso).
    await prisma.user.updateMany({
      where: { id: userId as string },
      data: { marketingOptIn: false, marketingOptInAt: null },
    });
    return done(true);
  } catch (error) {
    console.error("Unsubscribe error:", errorMessage(error));
    return oneClick
      ? NextResponse.json({ error: "Erro ao processar" }, { status: 500 })
      : NextResponse.redirect(pageUrl(request, "status=error"), 303);
  }
}
