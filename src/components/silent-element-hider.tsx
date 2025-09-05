"use client";

import { useEffect } from 'react';

interface SilentElementHiderProps {
  selectors: string[];
  enabled?: boolean;
}

export const SilentElementHider = ({ selectors, enabled = true }: SilentElementHiderProps) => {
  useEffect(() => {
    if (!enabled) return;

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
  }, [selectors, enabled]);

  return null;
};

// Specific component for the problematic circle - completely silent
export const SilentCircleHider = () => {
  const selectors = [
    'circle[cx="316.5"][cy="316.5"][r="316.5"]',
    'circle[r="316.5"]',
    'circle[fill*="url(#a-cl-9)"]',
    'svg circle[fill*="url(#a-cl-9)"]'
  ];

  return (
    <SilentElementHider 
      selectors={selectors}
      enabled={true}
    />
  );
};
