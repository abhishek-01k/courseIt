import Image from "next/image";
import { NVIDIA_INCEPTION } from "@/lib/constants";

// The official NVIDIA Inception Program member badge (design.nvidia.com), unchanged. NVIDIA's rules: don't recolor, stretch or
// edit it, keep clear space around it, and never show it bigger than the CourseIt logo beside it. It has its own white panel,
// so it reads on light and dark backgrounds.
const RATIO = 500.4288 / 216; // the artwork's viewBox

export default function NvidiaInceptionBadge({ height = 40, className = "" }: { height?: number; className?: string }) {
  return (
    <a
      href={NVIDIA_INCEPTION.url}
      target="_blank"
      rel="noreferrer"
      aria-label="CourseIt is a member of the NVIDIA Inception program"
      className={`inline-block shrink-0 ${className}`}
    >
      <Image src="/brand/nvidia-inception-badge.svg" alt="NVIDIA Inception Program member badge" width={Math.round(height * RATIO)} height={height} unoptimized />
    </a>
  );
}
