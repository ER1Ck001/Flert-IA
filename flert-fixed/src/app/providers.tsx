"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";
import { MotionProvider } from "@/components/motion/MotionProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {/* Só tema escuro por enquanto (modo claro fica para depois). */}
      <ThemeProvider attribute="class" forcedTheme="dark" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
        <MotionProvider>{children}</MotionProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
