"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Copy, ImageUp, SlidersHorizontal } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { fadeUp, useMotionSafe } from "@/lib/motion";
import { cn } from "@/lib/utils";

const FACTS = [
  { icon: ImageUp, text: "Envie o print da conversa ou descreva a situação." },
  { icon: SlidersHorizontal, text: "Escolha um dos 7 tons e receba 3 sugestões de resposta." },
  { icon: Copy, text: "Você decide o que usar: copie, edite ou descarte." },
] as const;

const homeLinkClass =
  "inline-flex min-h-11 items-center rounded-md focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

function HomeLogo({ className }: { className?: string }) {
  return (
    <Link href="/" aria-label="Flert IA — página inicial" className={cn(homeLinkClass, className)}>
      <Logo size={28} />
    </Link>
  );
}

/** Painel de marca (só lg+). Copy factual sobre o produto, sem promessa de resultado. */
function BrandPanel() {
  return (
    <aside
      aria-label="Sobre o Flert IA"
      className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-aurora p-10 lg:flex xl:p-14"
    >
      <HomeLogo className="self-start" />
      <div className="max-w-md">
        <p className="font-display text-h1 text-text">
          A resposta certa, <span className="text-signal">no tom certo.</span>
        </p>
        <ul className="mt-8 space-y-4">
          {FACTS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3 text-body text-text-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-surface-2 text-violet-400">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="pt-1.5">{text}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-caption text-text-2">© {new Date().getFullYear()} Flert IA</p>
    </aside>
  );
}

export interface AuthShellProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Conteúdo acima do título (ex.: badge do plano escolhido). */
  eyebrow?: React.ReactNode;
  /** Rodapé abaixo do conteúdo (ex.: "Não tem conta? Criar conta"). */
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Casca das telas de autenticação.
 * Mobile: coluna única com logo e bg-aurora. lg+: split com painel de marca à esquerda.
 * `<main id="main">` é o alvo do skip link do layout raiz.
 */
export function AuthShell({ title, description, eyebrow, footer, children }: AuthShellProps) {
  const variants = useMotionSafe(fadeUp);
  return (
    <div className="min-h-dvh bg-bg lg:grid lg:grid-cols-2">
      <BrandPanel />
      <main id="main" tabIndex={-1} className="flex min-h-dvh flex-col bg-aurora focus:outline-none lg:bg-none">
        <div className="flex items-center justify-between gap-4 px-4 pt-4 sm:px-6 sm:pt-6">
          <HomeLogo className="lg:invisible" />
          <Link
            href="/"
            className={cn(homeLinkClass, "gap-1.5 px-2 text-sm text-text-2 transition-colors hover:text-text")}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Voltar ao site
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
          <motion.div initial="hidden" animate="show" variants={variants} className="w-full min-w-0 max-w-md">
            {eyebrow && <div className="mb-4">{eyebrow}</div>}
            <h1 className="font-display text-h1 text-text">{title}</h1>
            {description && <p className="mt-2 text-body text-text-2">{description}</p>}
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-8 text-center text-sm text-text-2">{footer}</div>}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

/** Separador "ou" entre o formulário e o login social. */
export function AuthDivider({ label = "ou" }: { label?: string }) {
  return (
    <div className="my-6 flex items-center gap-3 text-caption text-text-2">
      <span aria-hidden className="h-px flex-1 bg-border" />
      <span>{label}</span>
      <span aria-hidden className="h-px flex-1 bg-border" />
    </div>
  );
}

/** Link de texto com alvo de toque ≥44px e foco visível. */
export const authLinkClass =
  "inline-flex min-h-11 items-center rounded-sm font-semibold text-violet-400 underline-offset-4 hover:underline " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-bg";

/** Contêiner de página inteira para o fallback do Suspense. */
export function AuthFallback({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-dvh items-center justify-center bg-bg">{children}</div>;
}
