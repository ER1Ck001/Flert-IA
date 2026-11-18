// Tokens de movimento compartilhados. `useMotionSafe` é um hook: use só em client components.
import { useReducedMotion, type Transition, type Variants } from "framer-motion";

/** Durações (s) — espelham --dur-1..4 do globals.css. */
export const DUR = { fast: 0.12, base: 0.2, slow: 0.32, reveal: 0.56 } as const;

/** Curvas — espelham --ease-out / --ease-in-out. */
export const EASE = {
  out: [0.16, 1, 0.3, 1] as [number, number, number, number],
  inOut: [0.65, 0, 0.35, 1] as [number, number, number, number],
};

export const SPRING: Transition = { type: "spring", stiffness: 380, damping: 30 };

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DUR.base, ease: EASE.out } },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE.out } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: DUR.base, ease: EASE.out } },
};

export function stagger(step = 0.06, delayChildren = 0): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren: step, delayChildren } },
  };
}

export const sheetUp: Variants = {
  hidden: { y: "100%" },
  show: { y: 0, transition: { duration: DUR.slow, ease: EASE.out } },
  exit: { y: "100%", transition: { duration: DUR.base, ease: EASE.inOut } },
};

export const sparkPulse: Variants = {
  hidden: { opacity: 0.7, scale: 0.85, rotate: 0 },
  show: {
    opacity: [0.7, 1, 0.7],
    scale: [0.85, 1.12, 0.85],
    rotate: [0, 45, 90],
    transition: { duration: 1.4, ease: EASE.inOut, repeat: Infinity },
  },
};

export const suggestionIn: Variants = {
  hidden: { opacity: 0, y: 8, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: DUR.slow, ease: EASE.out } },
};

type Target = Record<string, unknown>;

function onlyOpacity(target: unknown): unknown {
  if (!target || typeof target !== "object" || Array.isArray(target)) return target;
  const t = target as Target;
  const out: Target = {};
  if ("opacity" in t) {
    // Keyframes de opacidade viram o valor final (sem pulsar).
    out.opacity = Array.isArray(t.opacity) ? t.opacity[t.opacity.length - 1] : t.opacity;
  }
  if (t.transition && typeof t.transition === "object") {
    const tr = t.transition as Target;
    const keep: Target = { duration: DUR.fast };
    if ("staggerChildren" in tr) keep.staggerChildren = 0;
    out.transition = keep;
  }
  return out;
}

/** Versão de variants com reduced motion: só opacidade, sem deslocamento/escala/repetição. */
export function reduced(v: Variants): Variants {
  const out: Variants = {};
  for (const [key, value] of Object.entries(v)) {
    out[key] = (typeof value === "function" ? value : onlyOpacity(value)) as Variants[string];
  }
  return out;
}

/** Retorna as variants originais ou a versão `reduced` conforme prefers-reduced-motion. */
export function useMotionSafe(v: Variants): Variants {
  const prefersReduced = useReducedMotion();
  return prefersReduced ? reduced(v) : v;
}
