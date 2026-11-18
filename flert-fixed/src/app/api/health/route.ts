import { NextResponse } from "next/server";

// Liveness para monitores de uptime: não toca no banco nem expõe configuração/versão.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
}
