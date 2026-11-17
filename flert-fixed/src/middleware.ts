import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Páginas de /auth acessíveis mesmo logado (o link de redefinição chega por e-mail).
const AUTH_PAGES_FOR_EVERYONE = ["/auth/reset-password"];

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;
    const isAuthPage = pathname.startsWith("/auth");

    if (token && isAuthPage && !AUTH_PAGES_FOR_EVERYONE.includes(pathname)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isAuthPage = req.nextUrl.pathname.startsWith("/auth");
        if (isAuthPage) return true;
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
