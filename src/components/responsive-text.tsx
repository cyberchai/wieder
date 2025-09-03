"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

// Font size classes in order from largest to smallest
const FONT_SIZES = [
  "text-3xl", "text-2xl", "text-xl", "text-lg", 
  "text-base", "text-sm", "text-xs"
];

interface ResponsiveTextProps {
  text: string;
  className?: string;
  baseFontSize?: string;
}

export function ResponsiveText({
  text,
  className = "",
  baseFontSize = "text-3xl"
}: ResponsiveTextProps) {
  const textRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [currentFontSize, setCurrentFontSize] = useState(baseFontSize);

  const adjustFontSize = useCallback(() => {
    if (!isMobile || !textRef.current) {
      setCurrentFontSize(baseFontSize);
      return;
    }

    // Start with the base font size
    let fontSizeIndex = FONT_SIZES.indexOf(baseFontSize);
    if (fontSizeIndex === -1) fontSizeIndex = 0;

    const findOptimalFontSize = (index: number) => {
      if (index >= FONT_SIZES.length) {
        setCurrentFontSize(FONT_SIZES[FONT_SIZES.length - 1]);
        return;
      }

      const testFontSize = FONT_SIZES[index];
      setCurrentFontSize(testFontSize);
      
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        if (textRef.current) {
          const element = textRef.current;
          const isOverflowing = element.scrollHeight > element.clientHeight || 
                               element.scrollWidth > element.clientWidth;
          
          if (!isOverflowing || index === FONT_SIZES.length - 1) {
            setCurrentFontSize(testFontSize);
          } else {
            findOptimalFontSize(index + 1);
          }
        }
      });
    };

    findOptimalFontSize(fontSizeIndex);
  }, [isMobile, baseFontSize]);

  useEffect(() => {
    if (isMobile) {
      adjustFontSize();
    } else {
      setCurrentFontSize(baseFontSize);
    }
  }, [text, isMobile, baseFontSize, adjustFontSize]);

  // Reset font size when text changes
  useEffect(() => {
    if (isMobile) {
      setCurrentFontSize(baseFontSize);
      setTimeout(adjustFontSize, 100); // Small delay to ensure DOM is updated
    }
  }, [text, isMobile, baseFontSize, adjustFontSize]);

  return (
    <div 
      ref={textRef}
      className={`${currentFontSize} ${className}`}
      style={{
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
        hyphens: 'auto'
      }}
    >
      {text}
    </div>
  );
}
