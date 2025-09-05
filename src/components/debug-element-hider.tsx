"use client";

import { useEffect, useState } from 'react';

interface DebugElementHiderProps {
  selectors: string[];
  enabled?: boolean;
}

export const DebugElementHider = ({ selectors, enabled = true }: DebugElementHiderProps) => {
  const [isActive, setIsActive] = useState(enabled);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + H to toggle element hiding (silent)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'H') {
        e.preventDefault();
        setIsActive(prev => !prev);
        // No console logging - completely silent
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;

    const hideElements = () => {
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          (element as HTMLElement).style.display = 'none';
          (element as HTMLElement).style.visibility = 'hidden';
          (element as HTMLElement).style.opacity = '0';
        });
      });
    };

    // Hide elements immediately
    hideElements();

    // Set up observer to hide any new elements that match the selectors
    const observer = new MutationObserver(() => {
      hideElements();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [selectors, isActive]);

  // No debug info shown - completely hidden

  return null;
};

// Specific component for the problematic circle
export const CircleDebugHider = () => {
  const selectors = [
    'circle[cx="316.5"][cy="316.5"][r="316.5"]',
    'circle[r="316.5"]',
    'circle[fill*="url(#a-cl-9)"]',
    'svg circle[fill*="url(#a-cl-9)"]'
  ];

  return (
    <DebugElementHider 
      selectors={selectors}
      enabled={true}
    />
  );
};
