"use client";

import { Play } from "lucide-react";
import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Hosts next.config.ts optimizes. Anything else loads straight from the browser instead of throwing.
const OPTIMIZED = /^(img\.youtube\.com|.+\.(ytimg|ggpht|googleusercontent|githubusercontent|twimg)\.com)$/;
const optimizable = (src: string) => {
  try {
    return OPTIMIZED.test(new URL(src).hostname);
  } catch {
    return false;
  }
};

type Props = Omit<ImageProps, "src" | "alt" | "onError"> & { src: string | null | undefined; fallback?: React.ReactNode };

/**
 * Every thumbnail and avatar in the app. A missing, unknown-host or broken image never breaks the page:
 * it shows `fallback` (a plain tile by default) in the image's place.
 */
export default function Thumbnail({ src, fallback, className, fill, ...props }: Props) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!src || failed === src) {
    return (
      fallback ?? (
        <span aria-hidden="true" className={cn("flex items-center justify-center bg-lime-soft text-pill-ink", fill && "absolute inset-0", className)}>
          <Play className="size-1/4 max-h-8 max-w-8 opacity-50" />
        </span>
      )
    );
  }
  return <Image {...props} src={src} alt="" fill={fill} className={className} unoptimized={!optimizable(src)} onError={() => setFailed(src)} />;
}
