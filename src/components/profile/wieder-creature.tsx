"use client";

import * as React from "react";
import { useMemo, useRef } from "react";
import { cn } from "@/lib/utils";

export type CreatureVariant =
  | "scatter"
  | "halo"
  | "vortex"
  | "grid"
  | "puff"
  | "nebula"
  | "ring";

export interface Pointer {
  x: number;
  y: number;
}

interface Dot {
  x: number;
  y: number;
  r: number;
  dx: number;
  dy: number;
  dur: number;
  delay: number;
}

// Deterministic PRNG so a creature's dots are stable across renders (and SSR).
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const CONFIG: Record<
  CreatureVariant,
  {
    count: number;
    pattern: "scatter" | "halo" | "vortex" | "grid";
    spread: number;
    flat: number;
    minR: number;
    maxR: number;
  }
> = {
  scatter: { count: 82, pattern: "scatter", spread: 46, flat: 0.92, minR: 0.4, maxR: 2.2 },
  puff: { count: 46, pattern: "scatter", spread: 48, flat: 0.9, minR: 0.7, maxR: 2.9 },
  nebula: { count: 104, pattern: "scatter", spread: 50, flat: 0.82, minR: 0.3, maxR: 1.7 },
  halo: { count: 80, pattern: "halo", spread: 42, flat: 0.5, minR: 0.5, maxR: 2.0 },
  ring: { count: 92, pattern: "halo", spread: 46, flat: 0.82, minR: 0.4, maxR: 1.6 },
  vortex: { count: 90, pattern: "vortex", spread: 46, flat: 0.95, minR: 0.4, maxR: 1.8 },
  grid: { count: 64, pattern: "grid", spread: 40, flat: 1, minR: 1.1, maxR: 2.3 },
};

function buildDots(variant: CreatureVariant): Dot[] {
  const c = CONFIG[variant];
  const rnd = mulberry32(hashString(variant));
  const dots: Dot[] = [];
  const cx = 50;
  const cy = 50;

  for (let i = 0; i < c.count; i++) {
    let x = cx;
    let y = cy;

    if (c.pattern === "scatter") {
      const a = rnd() * Math.PI * 2;
      const rad = c.spread * Math.sqrt(rnd());
      x = cx + Math.cos(a) * rad;
      y = cy + Math.sin(a) * rad * c.flat;
    } else if (c.pattern === "halo") {
      const a = rnd() * Math.PI * 2;
      const rad = c.spread * (0.72 + 0.28 * rnd());
      x = cx + Math.cos(a) * rad * 1.12;
      y = cy + Math.sin(a) * rad * c.flat;
    } else if (c.pattern === "vortex") {
      const t = rnd();
      const a = t * Math.PI * 7;
      const rad = c.spread * Math.pow(t, 0.78);
      x = cx + Math.cos(a) * rad;
      y = cy + Math.sin(a) * rad * c.flat;
    } else {
      // grid — leave gaps so it reads as a loose pixel cloud
      const cols = 8;
      const step = (c.spread * 2) / (cols - 1);
      x = cx - c.spread + (i % cols) * step;
      y = cy - c.spread + Math.floor(i / cols) * step;
      if (rnd() < 0.16) continue;
    }

    dots.push({
      x,
      y,
      r: c.minR + rnd() * (c.maxR - c.minR),
      dx: (rnd() - 0.5) * 3,
      dy: (rnd() - 0.5) * 3,
      dur: 3 + rnd() * 3.5,
      delay: rnd() * 4,
    });
  }

  return dots;
}

// Dot cloud never depends on the pointer, so memoizing keeps it from
// re-rendering on every mouse move — only the eyes react.
const CreatureDots = React.memo(function CreatureDots({
  variant,
  ink,
  animated,
}: {
  variant: CreatureVariant;
  ink: string;
  animated: boolean;
}) {
  const dots = useMemo(() => buildDots(variant), [variant]);
  return (
    <g>
      {dots.map((d, i) => (
        <circle
          key={i}
          cx={d.x}
          cy={d.y}
          r={d.r}
          fill={ink}
          className={animated ? "wc-dot" : undefined}
          style={
            animated
              ? ({
                  "--wc-dx": `${d.dx}px`,
                  "--wc-dy": `${d.dy}px`,
                  "--wc-dur": `${d.dur}s`,
                  "--wc-delay": `${d.delay}s`,
                } as React.CSSProperties)
              : undefined
          }
        />
      ))}
    </g>
  );
});

const EYES = [
  { x: 40, y: 43 },
  { x: 60, y: 43 },
];

function CreatureFace({ target }: { target: Pointer | null }) {
  return (
    <g>
      {EYES.map((e, i) => {
        let dx = 0;
        let dy = 0;
        if (target) {
          const a = Math.atan2(target.y - e.y, target.x - e.x);
          dx = Math.cos(a) * 2.7;
          dy = Math.sin(a) * 2.7;
        }
        return (
          <g key={i}>
            <circle cx={e.x} cy={e.y} r={8} fill="#fdfbf4" />
            <circle cx={e.x + dx} cy={e.y + dy} r={3.7} fill="#141210" />
          </g>
        );
      })}
      {/* surprised little mouth */}
      <circle cx={50} cy={57} r={6} fill="#141210" />
    </g>
  );
}

interface WiederCreatureProps {
  variant: CreatureVariant;
  /** Dot color */
  ink?: string;
  /** Viewport pointer coords; pupils glance toward it. Omit for static eyes. */
  pointer?: Pointer | null;
  /** Whether the dot cloud drifts. Off for tiny dock thumbnails. */
  animated?: boolean;
  className?: string;
}

export function WiederCreature({
  variant,
  ink = "#191712",
  pointer = null,
  animated = true,
  className,
}: WiederCreatureProps) {
  const ref = useRef<SVGSVGElement>(null);

  // Convert the viewport pointer into this creature's 0–100 local space.
  const target = useMemo<Pointer | null>(() => {
    if (!pointer || !ref.current) return null;
    const rect = ref.current.getBoundingClientRect();
    if (!rect.width) return null;
    return {
      x: ((pointer.x - rect.left) / rect.width) * 100,
      y: ((pointer.y - rect.top) / rect.height) * 100,
    };
  }, [pointer]);

  return (
    <svg
      ref={ref}
      viewBox="0 0 100 100"
      className={cn("overflow-visible", className)}
      aria-hidden="true"
    >
      <CreatureDots variant={variant} ink={ink} animated={animated} />
      <CreatureFace target={target} />
    </svg>
  );
}
