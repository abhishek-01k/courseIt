"use client";

import { ReactLenis } from "lenis/react";
import { MotionConfig, useReducedMotion } from "motion/react";
import "lenis/dist/lenis.css";

// Smooth (inertial) page scroll + one place to honour prefers-reduced-motion for every animation.
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();

  return (
    <MotionConfig reducedMotion="user">
      <ReactLenis root options={{ lerp: reduce ? 1 : 0.1, smoothWheel: !reduce, anchors: { offset: -96 } }}>
        {children}
      </ReactLenis>
    </MotionConfig>
  );
}
