"use client";

import { useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
} from "framer-motion";
import { cn } from "@/lib/utils";

interface MagicCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  tiltAmount?: number;
  disabled?: boolean;
}

export function MagicCard({
  children,
  className,
  glowColor = "rgba(255,45,149,0.14)",
  tiltAmount = 6,
  disabled = false,
}: MagicCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const rotX = useSpring(
    useTransform(my, [-0.5, 0.5], [tiltAmount, -tiltAmount]),
    { stiffness: 280, damping: 28 }
  );
  const rotY = useSpring(
    useTransform(mx, [-0.5, 0.5], [-tiltAmount, tiltAmount]),
    { stiffness: 280, damping: 28 }
  );

  const glowXPct = useTransform(mx, [-0.5, 0.5], [0, 100]);
  const glowYPct = useTransform(my, [-0.5, 0.5], [0, 100]);
  const gradient = useMotionTemplate`radial-gradient(circle at ${glowXPct}% ${glowYPct}%, ${glowColor} 0%, transparent 65%)`;

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (disabled) return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function onLeave() {
    mx.set(0);
    my.set(0);
    setHovered(false);
  }

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={onMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={onLeave}
      style={{
        rotateX: rotX,
        rotateY: rotY,
        transformStyle: "preserve-3d",
      }}
      className={cn("relative", className)}
    >
      {/* Dynamic spotlight */}
      <motion.div
        className="absolute inset-0 rounded-[inherit] pointer-events-none z-[1]"
        style={{ background: gradient }}
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />
      <div className="relative z-[2]">{children}</div>
    </motion.div>
  );
}

/* ── Lightweight hover-lift card (no tilt) ── */
export function HoverCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
