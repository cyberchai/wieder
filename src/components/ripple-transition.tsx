"use client";

import { useEffect, ReactNode } from "react";
import { useRippleTransition } from "@/providers/ripple-transition-provider";

const DURATION_EXPAND = 800; // Duration for circle to expand
const DURATION_FADE = 400;   // Duration for fade out

type RippleCircleProps = {
  x: number;
  y: number;
  id: number;
  onComplete: (id: number) => void;
};

function RippleCircle({ x, y, id, onComplete }: RippleCircleProps) {
  useEffect(() => {
    // Remove ripple after animation completes
    const timer = setTimeout(() => {
      onComplete(id);
    }, DURATION_EXPAND + DURATION_FADE);

    return () => clearTimeout(timer);
  }, [id, onComplete]);

  // Calculate size to cover entire viewport from click point
  const size = typeof window !== "undefined" 
    ? Math.max(window.innerWidth, window.innerHeight) * 2.5 
    : 2000;

  return (
    <div 
      className="ripple-transition-wrapper"
      style={{
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ["--ripple-duration-expand" as any]: `${DURATION_EXPAND}ms`,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ["--ripple-duration-fade" as any]: `${DURATION_FADE}ms`,
      }}
    >
      <div
        className="ripple-transition-circle"
        style={{
          left: `${x}px`,
          top: `${y}px`,
          width: `${size}px`,
          height: `${size}px`,
        }}
      />
    </div>
  );
}

type RippleTransitionProps = {
  children: ReactNode;
};

export function RippleTransition({ children }: RippleTransitionProps) {
  const { ripples, removeRipple } = useRippleTransition();

  return (
    <>
      {children}
      {ripples.map((ripple) => (
        <RippleCircle
          key={ripple.id}
          x={ripple.x}
          y={ripple.y}
          id={ripple.id}
          onComplete={removeRipple}
        />
      ))}
    </>
  );
}
