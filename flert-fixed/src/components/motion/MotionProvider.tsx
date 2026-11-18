"use client";

import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";
import type { ReactNode } from "react";

/**
 * framer-motion enxuto: `LazyMotion` + componentes `m` em vez do `motion` completo.
 * `domAnimation` (síncrono) cobre animate, variants, exit/AnimatePresence e hover/tap/focus.
 * Layout/`layoutId` (domMax) só no tone-chip, carregado sob demanda.
 * `strict`: um `motion.*` perdido dentro da árvore lança erro (em dev/teste), em vez de
 * trazer o bundle completo de volta em silêncio.
 * `reducedMotion="user"` segue o prefers-reduced-motion do sistema, como antes.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}
