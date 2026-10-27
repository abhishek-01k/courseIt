"use client";

import { useEffect, useRef } from "react";
import { useInView, useReducedMotion } from "motion/react";
import TiltFrame from "./tilt-frame";

// Muted product loop: plays while it's on screen, pauses when scrolled away. Reduced motion → no autoplay, controls instead.
export default function ProductPreview() {
  const ref = useRef<HTMLVideoElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reduce = useReducedMotion();

  useEffect(() => {
    const video = ref.current;
    if (!video || reduce) return;
    if (inView) video.play().catch(() => {}); // autoplay can still be refused (e.g. low-power mode); the poster stays
    else video.pause();
  }, [inView, reduce]);

  return (
    <section aria-label="Product tour" className="relative z-20 -mt-[230px] px-6">
      <TiltFrame className="mx-auto aspect-[1600/1038] w-[min(100%,calc((100vh-140px)*1600/1038))] max-w-[1200px] overflow-hidden rounded-panel bg-tour shadow-[0_0_0_6px_var(--surface),0_40px_80px_-30px_rgba(22,49,92,0.5)]">
        <video
          ref={ref}
          src="/video/product-demo-video.mp4"
          poster="/video/product-demo-poster.jpg"
          muted
          loop
          playsInline
          preload="metadata"
          controls={!!reduce}
          aria-label="CourseIt demo: paste a YouTube link, get a course with a placement test, lessons and quizzes"
          className="size-full object-cover"
        />
      </TiltFrame>
    </section>
  );
}
