// Busca de usuários (somente servidor).
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/validation/auth";

/**
 * Busca por e-mail normalizado. O fallback case-insensitive mantém compatibilidade com contas
 * gravadas em caixa mista antes da normalização (remover após a migration normalize_emails).
 */
export async function findUserByEmail(rawEmail: string) {
  const email = normalizeEmail(rawEmail);
  const exact = await prisma.user.findUnique({ where: { email } });
  if (exact) return exact;
  return prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    orderBy: { createdAt: "asc" },
  });
}
