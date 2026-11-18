import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { ADULT_CONFIRM_PATH, adultGateRedirect } from "@/lib/adult-gate";

// Páginas de /auth acessíveis mesmo logado (o link de redefinição chega por e-mail;
// a confirmação de idade é justamente para quem já entrou).
const AUTH_PAGES_FOR_EVERYONE = ["/auth/reset-password", ADULT_CONFIRM_PATH];

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname, search } = req.nextUrl;
    const isAuthPage = pathname.startsWith("/auth");

    if (token && isAuthPage && !AUTH_PAGES_FOR_EVERYONE.includes(pathname)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // 18+ (Tarefa 10): sem confirmação, as páginas do app levam à confirmação; já confirmado,
    // a confirmação devolve ao callbackUrl. Destinos sempre internos (safeCallbackUrl).
    const gate = adultGateRedirect(token, pathname, search);
    if (gate) return NextResponse.redirect(new URL(gate, req.url));

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        // A confirmação de idade exige login (sem token → withAuth manda para /auth/login).
        if (pathname === ADULT_CONFIRM_PATH) return !!token;
        if (pathname.startsWith("/auth")) return true;
        return !!token;
      },
    },
    pages: {
      signIn: "/auth/login",
      error: "/auth/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/analyze/:path*",
    "/history/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/pricing/:path*",
    "/auth/:path*",
    // Defesa em profundidade: admin/layout.tsx e as APIs também checam isAdminUser.
    "/admin/:path*",
  ],
};
