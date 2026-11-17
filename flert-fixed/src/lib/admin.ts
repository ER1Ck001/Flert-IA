// Autorização do painel admin (somente servidor).
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/validation/auth";

// TODO(Tarefa 3): remover o fallback e exigir ADMIN_EMAIL (ou papel no banco).
const adminEmail = () => normalizeEmail(process.env.ADMIN_EMAIL || "erickrochas230@gmail.com");

/**
 * O e-mail do admin é reservado: não pode ser cadastrado nem assumido por troca de e-mail
 * com senha. Só o login Google (que comprova a posse do e-mail) pode criar essa conta.
 */
export const isReservedAdminEmail = (email: string) => normalizeEmail(email) === adminEmail();

/**
 * Admin é decidido pelo e-mail EXATO gravado no banco, lido pelo id da sessão.
 * Nunca comparar o e-mail do token em minúsculas: contas cadastradas com variações de
 * caixa do e-mail do admin (ex.: "ADMIN@...") passariam no teste.
 */
export async function isAdminUser(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  return !!user?.email && user.email === adminEmail();
}
