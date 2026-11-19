// Autorização do painel admin (somente servidor).
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/validation/auth";

/** Sem ADMIN_EMAIL configurado não existe admin (falha fechada) — nenhum e-mail fixo no código. */
const adminEmail = (): string | null => {
  const configured = process.env.ADMIN_EMAIL?.trim();
  return configured ? normalizeEmail(configured) : null;
};

/**
 * O e-mail do admin é reservado: não pode ser cadastrado nem assumido por troca de e-mail
 * com senha. Só o login Google (que comprova a posse do e-mail) pode criar essa conta.
 */
export const isReservedAdminEmail = (email: string) => {
  const admin = adminEmail();
  return admin !== null && normalizeEmail(email) === admin;
};

/**
 * Admin é decidido pelo e-mail EXATO gravado no banco, lido pelo id da sessão.
 * Nunca comparar o e-mail do token em minúsculas: contas cadastradas com variações de
 * caixa do e-mail do admin (ex.: "ADMIN@...") passariam no teste.
 */
export async function isAdminUser(userId: string | null | undefined): Promise<boolean> {
  const admin = adminEmail();
  if (!userId || !admin) return false;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  return !!user?.email && user.email === admin;
}
