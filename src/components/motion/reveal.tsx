"use client";

import { motion, type Variants } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;

const container: Variants = {
  hidden: {},
  show: (stagger: number) => ({ transition: { staggerChildren: stagger } }),
};

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

const TAGS = { div: motion.div, ol: motion.ol, li: motion.li, article: motion.article, figure: motion.figure };
type Tag = keyof typeof TAGS;

type RevealProps = {
  as?: Tag;
  className?: string;
  children: React.ReactNode;
};

// One element that fades up the first time it scrolls into view.
export function Reveal({ as = "div", className, children }: RevealProps) {
  const Comp = TAGS[as];
  return (
    <Comp className={className} variants={item} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}>
      {children}
    </Comp>
  );
}

// A parent whose RevealItem children fade up one after another.
export function RevealGroup({ as = "div", className, children, stagger = 0.08 }: RevealProps & { stagger?: number }) {
  const Comp = TAGS[as];
  return (
    <Comp className={className} variants={container} custom={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
      {children}
    </Comp>
  );
}

export function RevealItem({ as = "div", className, children }: RevealProps) {
  const Comp = TAGS[as];
  return (
    <Comp className={className} variants={item}>
      {children}
    </Comp>
  );
}
