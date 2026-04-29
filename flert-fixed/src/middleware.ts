import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuthPage = req.nextUrl.pathname.startsWith("/auth");

    if (token && isAuthPage) {
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
  ],
};
