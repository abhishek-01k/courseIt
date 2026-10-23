"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

// Product tour frame: tilted back and smaller as it enters, flat and full size once it's in view.
export default function TiltFrame({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 0.25"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.7, 1]);

  return (
    <motion.div
      ref={ref}
      className={className}
      style={reduce ? undefined : { rotateX, scale, transformPerspective: 1200, transformOrigin: "top center" }}
    >
      {children}
    </motion.div>
  );
}
