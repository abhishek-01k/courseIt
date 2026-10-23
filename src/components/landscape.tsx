import { LANDSCAPE_PALETTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { LandscapeScene } from "@/types/landscape";

// ponytail: hand-built SVG illustration; swap for /public/hero-landscape.png if painted art is commissioned.
const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 `;

const cloud = (cx: number, cy: number, s: number, dy = 0, grow = 0) =>
  [[-70, 12, 30], [-35, -6, 40], [8, -16, 48], [52, -2, 38], [86, 14, 26], [0, 16, 36]]
    .map(([x, y, r]) => circle(cx + x * s, cy + y * s + dy, r * s + grow))
    .join("") + `M${cx - 96 * s} ${cy + 14 * s + dy} h${208 * s} v${30 * s} h${-208 * s} Z `;

const tree = (x: number, base: number, h: number) => {
  let d = "";
  for (let i = 0; i < 3; i++) {
    const top = base - h + i * h * 0.22;
    const half = ((h * 0.42) / 2) * (0.6 + i * 0.25);
    d += `M${x} ${top} L${x - half} ${top + h * 0.45} L${x + half} ${top + h * 0.45} Z `;
  }
  return d + `M${x - 3} ${base - h * 0.11} h6 v${h * 0.13} h-6 Z `;
};

// Deterministic "random" so server and client render the same shapes.
let seed = 7;
const rnd = () => {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
};

const SHAPES = (() => {
  let shore = "";
  for (let x = 0; x < 1440; x += 11) shore += `M${x} 551 L${x + 5.5} ${551 - (6 + rnd() * 12)} L${x + 11} 551 Z `;
  const sheen = [[556, 160], [566, 120], [578, 190], [590, 90], [602, 150], [616, 70]]
    .map(([y, w]) => `M${720 - w / 2} ${y} h${w} v2.5 h${-w} Z `)
    .join("");
  const snow = [[230, 372], [450, 360], [1000, 330], [1230, 352]]
    .map(([x, y]) => `M${x} ${y} L${x - 11} ${y + 15} L${x - 4} ${y + 11} L${x} ${y + 17} L${x + 5} ${y + 11} L${x + 12} ${y + 15} Z `)
    .join("");
  const pines = [
    [40, 690, 190], [85, 694, 150], [130, 688, 210], [175, 700, 140], [230, 704, 170], [280, 712, 120],
    [1180, 712, 140], [1230, 704, 190], [1290, 700, 160], [1340, 694, 210], [1395, 690, 150],
  ]
    .map(([x, base, h]) => tree(x, base, h))
    .join("");
  const flowers = Array.from({ length: 80 }, () => circle(rnd() * 1440, 704 + rnd() * 52, 1.8 + rnd() * 1.6)).join("");
  const stars = Array.from({ length: 60 }, () => circle(rnd() * 1440, 20 + rnd() * 320, 0.7 + rnd() * 1.1)).join("");
  const cloudSet = [[220, 140, 1.3], [1210, 175, 1.05]];
  const clouds = cloudSet.map(([x, y, s]) => cloud(x, y, s)).join("");
  const cloudShade = cloudSet.map(([x, y, s]) => cloud(x + 6, y, s, 9, 2)).join("");
  const birds = [[390, 70], [418, 84], [445, 64], [1010, 300], [1035, 314]].map(([x, y]) => `M${x} ${y} q5 -6 10 0 q5 -6 10 0 `).join("");
  return { shore, sheen, snow, pines, flowers, stars, clouds, cloudShade, birds };
})();

type LandscapeProps = {
  scene: LandscapeScene;
  className?: string;
};

export default function Landscape({ scene, className }: LandscapeProps) {
  const p = LANDSCAPE_PALETTES[scene];
  const sky = `ls-sky-${scene}`;
  const lake = `ls-lake-${scene}`;

  return (
    <svg
      viewBox="0 0 1440 760"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      className={cn("absolute inset-0 size-full", className)}
    >
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.sky[0]} />
          <stop offset="0.45" stopColor={p.sky[1]} />
          <stop offset="0.72" stopColor={p.sky[2]} />
        </linearGradient>
        <linearGradient id={lake} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.lake[0]} />
          <stop offset="1" stopColor={p.lake[1]} />
        </linearGradient>
      </defs>
      <rect width="1440" height="760" fill={`url(#${sky})`} />
      <path d={SHAPES.stars} fill={p.star} />
      <circle cx="1120" cy="140" r="30" fill={p.moon} />
      <path d={SHAPES.cloudShade} fill={p.cloudShade} />
      <path d={SHAPES.clouds} fill={p.cloud} />
      <path d={SHAPES.birds} fill="none" stroke={p.bird} strokeWidth="2" strokeLinecap="round" />
      <path d="M0 548 L0 420 L110 440 L230 372 L330 430 L450 360 L560 420 L660 395 L760 445 L880 388 L1000 330 L1110 410 L1230 352 L1330 400 L1440 372 L1440 548 Z" fill={p.far} />
      <path d={SHAPES.snow} fill={p.snow} />
      <path d="M0 548 L0 500 L90 478 L200 516 L300 466 L420 528 L520 500 L610 548 Z" fill={p.mid[0]} />
      <path d="M840 548 L980 470 L1100 512 L1230 450 L1350 500 L1440 474 L1440 548 Z" fill={p.mid[1]} />
      <rect y="548" width="1440" height="90" fill={`url(#${lake})`} />
      <path d={SHAPES.sheen} fill={p.sheen} opacity="0.85" />
      <path d={SHAPES.shore} fill={p.shore} />
      <path d="M0 760 L0 610 C130 590 270 618 390 650 C480 674 540 720 600 760 Z" fill={p.hills[0]} />
      <path d="M1440 760 L1440 616 C1320 604 1180 632 1070 672 C990 702 950 740 930 760 Z" fill={p.hills[1]} />
      <path d={SHAPES.pines} fill={p.pine} />
      <path d="M0 760 L0 700 C300 676 700 706 1000 694 C1200 688 1350 704 1440 696 L1440 760 Z" fill={p.hills[2]} />
      <path d={SHAPES.flowers} fill={p.flower} />
    </svg>
  );
}
