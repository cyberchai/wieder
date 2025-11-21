"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type FlipTransitionContextType = {
  isFlipping: boolean;
  triggerFlip: () => void;
  resetFlip: () => void;
};

const FlipTransitionContext = createContext<FlipTransitionContextType>({
  isFlipping: false,
  triggerFlip: () => {},
  resetFlip: () => {},
});

export const useFlipTransition = () => useContext(FlipTransitionContext);

export const FlipTransitionProvider = ({ children }: { children: ReactNode }) => {
  const [isFlipping, setIsFlipping] = useState(false);

  const triggerFlip = () => {
    setIsFlipping(true);
  };

  const resetFlip = () => {
    setIsFlipping(false);
  };

  return (
    <FlipTransitionContext.Provider value={{ isFlipping, triggerFlip, resetFlip }}>
      {children}
    </FlipTransitionContext.Provider>
  );
};

