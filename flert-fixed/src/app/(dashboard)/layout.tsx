"use client";

import { useEffect, useState, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app/AppSidebar";
import { TopBar } from "@/components/app/TopBar";
import { BottomNav } from "@/components/app/BottomNav";
import { AccountSheet } from "@/components/app/AccountSheet";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [accountOpen, setAccountOpen] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();
  const user = session?.user;

  // Fecha a folha da conta ao trocar de rota.
  useEffect(() => {
    setAccountOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-bg">
      <AppSidebar user={user} />

      <div className="lg:pl-64">
        <TopBar user={user} onOpenAccount={() => setAccountOpen(true)} accountOpen={accountOpen} />

        <main id="main" tabIndex={-1} className="pb-safe lg:pb-8 px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8 max-w-app mx-auto focus:outline-none">
          {children}
        </main>
      </div>

      <BottomNav onOpenAccount={() => setAccountOpen(true)} accountOpen={accountOpen} />
      <AccountSheet open={accountOpen} onOpenChange={setAccountOpen} user={user} />
    </div>
  );
}
