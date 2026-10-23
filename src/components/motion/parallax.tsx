"use client";

import { motion, useScroll, useTransform } from "motion/react";

// Moves its children down slower than the page scrolls, so they appear further away.
export default function Parallax({ className, children, distance = 220 }: { className?: string; children: React.ReactNode; distance?: number }) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, distance]);

  return (
    <motion.div className={className} style={{ y }}>
      {children}
    </motion.div>
  );
}
