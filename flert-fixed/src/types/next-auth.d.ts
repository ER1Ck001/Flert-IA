import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    /** Versão de sessão do usuário no momento do login (ver src/lib/session-version.ts). */
    sv?: number;
    /** Última conferência da versão no banco (ms). */
    svCheckedAt?: number;
  }
}
