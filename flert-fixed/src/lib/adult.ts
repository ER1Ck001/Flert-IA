// Confirmação de 18+ no servidor (somente servidor). Fonte da verdade: User.adultConfirmedAt.
// O claim `adult` do JWT só serve para o middleware redirecionar páginas; as APIs pagas
// (análise e criação de pagamento) sempre conferem no banco.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const ADULT_REQUIRED_ERROR =
  "Confirme que você tem 18 anos ou mais para usar o Flert IA. Abra o app e responda à confirmação de idade.";

export async function isAdultConfirmed(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { adultConfirmedAt: true } });
  return Boolean(user?.adultConfirmedAt);
}

/** null quando confirmado; senão a resposta 403 a devolver. */
export async function requireAdultConfirmed(userId: string): Promise<NextResponse | null> {
  if (await isAdultConfirmed(userId)) return null;
  return NextResponse.json({ error: ADULT_REQUIRED_ERROR, adultRequired: true }, { status: 403 });
}
