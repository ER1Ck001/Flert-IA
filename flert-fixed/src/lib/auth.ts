import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { Adapter, AdapterUser } from "next-auth/adapters";
import { prisma } from "@/lib/prisma";
import { createMailTransport } from "@/lib/email/transport";
import { authorizeCredentials } from "@/lib/auth-credentials";
import { normalizeEmail } from "@/lib/validation/auth";
import { welcomeEmail } from "@/lib/email/templates";
import { findUserByEmail } from "@/lib/users";
import { checkSessionVersion } from "@/lib/session-version";
import { errorMessage } from "@/lib/http";

/**
 * Adapter do Prisma com e-mail normalizado: sem isso o login Google com "Foo@x.com" criaria
 * uma segunda conta ao lado de "foo@x.com" (cadastro por senha).
 */
function normalizedEmailAdapter(): Adapter {
  const base = PrismaAdapter(prisma) as Adapter;
  return {
    ...base,
    createUser: (data: Parameters<NonNullable<Adapter["createUser"]>>[0]) =>
      base.createUser!({ ...data, email: normalizeEmail(data.email) }),
    // Mesmo lookup do login por senha (inclui contas antigas em caixa mista).
    getUserByEmail: async (email) => (await findUserByEmail(email)) as AdapterUser | null,
  };
}

const transporter = createMailTransport();

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "E-mail", type: "email" },
      password: { label: "Password", type: "password" },
    },
    authorize: authorizeCredentials,
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const authOptions: NextAuthOptions = {
  adapter: normalizedEmailAdapter() as NextAuthOptions["adapter"],
  session: {
    strategy: "jwt",
    maxAge: 14 * 24 * 60 * 60, // 14 dias (padrão do NextAuth: 30)
    updateAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  providers,
  events: {
    async createUser({ user }) {
      // Fires only for OAuth (Google) signups — credential users are created in /api/auth/register
      if (!user.email) return;

      // Create FREE subscription status (adapter doesn't do this automatically)
      await prisma.subscriptionStatus.upsert({
        where:  { userId: user.id },
        create: { userId: user.id, status: "FREE" },
        update: {},
      }).catch(() => {});

      // E-mail de boas-vindas (template único em lib/email/templates)
      const welcome = welcomeEmail({ name: user.name });
      await transporter.sendMail({
        from:    process.env.SMTP_FROM,
        to:      user.email,
        subject: welcome.subject,
        html:    welcome.html,
      }).catch(err => console.error("OAuth welcome email error:", errorMessage(err)));
    },
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id    = user.id;
        token.email = user.email;
        token.name  = user.name;
        token.image = user.image;
        // Versão de sessão no login: incrementá-la no banco invalida este token.
        token.sv = (user as { sessionVersion?: number }).sessionVersion ?? 0;
        token.svCheckedAt = Date.now();
      } else if ((await checkSessionVersion(token)) === "revoked") {
        // Senha trocada/redefinida, "sair de todos os dispositivos" ou conta excluída.
        // Erro no callback jwt faz o NextAuth descartar a sessão (getServerSession → null).
        throw new Error("SESSION_REVOKED");
      }
      // update() no cliente (ex.: após editar o perfil): relê do banco — nunca confia no payload.
      if (trigger === "update" && token.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id },
          select: { name: true, email: true, image: true },
        });
        if (fresh) {
          token.name  = fresh.name;
          token.email = fresh.email;
          token.image = fresh.image;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id    = token.id    as string;
        session.user.email = token.email as string;
        session.user.name  = token.name  as string;
        session.user.image = token.image as string | null | undefined;
      }
      return session;
    },
  },
};
