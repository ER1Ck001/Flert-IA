import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import type { Metadata } from "next";
import { isAdminUser } from "@/lib/admin";
import { PRIVATE_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Admin",
  robots: PRIVATE_ROBOTS,
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login?callbackUrl=/admin");
  }

  // E-mail exato gravado no banco (não o do token em minúsculas) — ver src/lib/admin.ts.
  if (!(await isAdminUser(session.user?.id))) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
