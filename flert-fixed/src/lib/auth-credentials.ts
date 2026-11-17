// Login por e-mail e senha (usado pelo CredentialsProvider do NextAuth).
import bcrypt from "bcryptjs";
import { findUserByEmail } from "@/lib/users";
import { loginSchema } from "@/lib/validation/auth";

const INVALID = "Email ou senha inválidos";

// Hash bcrypt (custo 12) de uma senha aleatória descartada: usado quando a conta não existe,
// para que o tempo de resposta não revele quais e-mails estão cadastrados.
const DUMMY_HASH = "$2a$12$7pLKo7KVYpIBgnxrQGSxyOtCmYYwGlqzV6TWfimm3RMus1Jo/1qgi";

export async function authorizeCredentials(
  credentials: Record<"email" | "password", string> | undefined
): Promise<{ id: string; email: string | null; name: string | null; image: string | null }> {
  if (!credentials?.email || !credentials?.password) {
    throw new Error("Email e senha são obrigatórios");
  }

  const parsed = loginSchema.safeParse(credentials);
  if (!parsed.success) throw new Error(INVALID);

  const user = await findUserByEmail(parsed.data.email);
  // Mesma mensagem (e mesmo custo) para inexistente, conta Google (sem senha) e senha errada.
  const valid = await bcrypt.compare(parsed.data.password, user?.password ?? DUMMY_HASH);
  if (!user?.password || !valid) throw new Error(INVALID);

  return { id: user.id, email: user.email, name: user.name, image: user.image };
}
