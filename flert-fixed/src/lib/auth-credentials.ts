// Login por e-mail e senha (usado pelo CredentialsProvider do NextAuth).
import bcrypt from "bcryptjs";
import { findUserByEmail } from "@/lib/users";
import { loginSchema } from "@/lib/validation/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const INVALID = "Email ou senha inválidos";
export const RATE_LIMITED = "RATE_LIMITED";

// Hash bcrypt (custo 12) de uma senha aleatória descartada: usado quando a conta não existe,
// para que o tempo de resposta não revele quais e-mails estão cadastrados.
const DUMMY_HASH = "$2a$12$7pLKo7KVYpIBgnxrQGSxyOtCmYYwGlqzV6TWfimm3RMus1Jo/1qgi";

type ReqLike = { headers?: Record<string, string | string[] | undefined> } | undefined;

function headerGetter(req: ReqLike) {
  return (name: string) => {
    const v = req?.headers?.[name];
    return Array.isArray(v) ? v[0] : v;
  };
}

export async function authorizeCredentials(
  credentials: Record<"email" | "password", string> | undefined,
  req?: ReqLike
): Promise<{ id: string; email: string | null; name: string | null; image: string | null; sessionVersion: number }> {
  if (!credentials?.email || !credentials?.password) {
    throw new Error("Email e senha são obrigatórios");
  }

  const parsed = loginSchema.safeParse(credentials);
  if (!parsed.success) throw new Error(INVALID);

  // Força bruta, ANTES do bcrypt (cada tentativa custa CPU). Limites:
  //  - por IP: protege o servidor;
  //  - por e-mail+IP: um IP não fica testando senhas de uma conta;
  //  - teto alto por e-mail: força bruta distribuída, sem que poucas tentativas de um
  //    atacante consigam travar o login da vítima.
  // A mesma resposta para todos — não revela qual estourou.
  const ip = getClientIp(headerGetter(req));
  const email = parsed.data.email;
  const results = await Promise.all([
    rateLimit("login:ip", ip, 30, 900),
    rateLimit("login:email-ip", `${email}|${ip}`, 10, 900),
    rateLimit("login:email", email, 100, 3600),
  ]);
  if (results.some((r) => !r.allowed)) throw new Error(RATE_LIMITED);

  const user = await findUserByEmail(parsed.data.email);
  // Mesma mensagem (e mesmo custo) para inexistente, conta Google (sem senha) e senha errada.
  const valid = await bcrypt.compare(parsed.data.password, user?.password ?? DUMMY_HASH);
  if (!user?.password || !valid) throw new Error(INVALID);

  return { id: user.id, email: user.email, name: user.name, image: user.image, sessionVersion: user.sessionVersion ?? 0 };
}
