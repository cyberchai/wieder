"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";

type RippleConfig = {
  x: number;
  y: number;
  id: number;
};

type RippleTransitionContextType = {
  ripples: RippleConfig[];
  triggerRipple: (x?: number, y?: number) => void;
  removeRipple: (id: number) => void;
};

const RippleTransitionContext = createContext<RippleTransitionContextType>({
  ripples: [],
  triggerRipple: () => {},
  removeRipple: () => {},
});

export const useRippleTransition = () => useContext(RippleTransitionContext);

let rippleIdCounter = 0;

export const RippleTransitionProvider = ({ children }: { children: ReactNode }) => {
  const [ripples, setRipples] = useState<RippleConfig[]>([]);

  const triggerRipple = useCallback((x?: number, y?: number) => {
    // Default to center of screen if no coordinates provided
    const rippleX = x ?? (typeof window !== "undefined" ? window.innerWidth / 2 : 0);
    const rippleY = y ?? (typeof window !== "undefined" ? window.innerHeight / 2 : 0);
    
    const newRipple: RippleConfig = {
      x: rippleX,
      y: rippleY,
      id: ++rippleIdCounter,
    };
    
    setRipples((prev) => [...prev, newRipple]);
  }, []);

  const removeRipple = useCallback((id: number) => {
    setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
  }, []);

  return (
    <RippleTransitionContext.Provider value={{ ripples, triggerRipple, removeRipple }}>
      {children}
    </RippleTransitionContext.Provider>
  );
};
