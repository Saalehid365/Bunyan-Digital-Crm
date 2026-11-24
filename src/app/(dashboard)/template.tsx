"use client";

import { motion } from "motion/react";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";

/** Next.js remounts `template.tsx` on every navigation (unlike layout.tsx, which
 * persists) — a clean, App-Router-native hook for an authored page transition without a
 * client-side router wrapper. */
export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  const reduceMotion = useSafeReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.32, ease: [0.2, 0.7, 0.1, 1] }}
    >
      {children}
    </motion.div>
  );
}
