'use client';

import { useTheme } from '@/providers/theme-provider';
import DotGrid from './dot-grid';
import Particles from './particles';

interface ThemeBackgroundProps {
  className?: string;
}

export default function ThemeBackground({ className = "" }: ThemeBackgroundProps) {
  const { theme } = useTheme();
  
  // Only show DotGrid background for dark theme
  if (theme !== 'dark') {
    return null;
  }

  // For dark theme, show DotGrid background
  return (
    <div className={`fixed inset-0 pointer-events-none z-0 ${className}`}>
      <DotGrid 
        dotSize={20}
        gap={5}
        baseColor="#1a2c57"
        activeColor="#fcb715"
        proximity={120}
        speedTrigger={80}
        shockRadius={100}
        shockStrength={8}
        maxSpeed={4000}
        resistance={600}
        returnDuration={0.8}
      />
    </div>
  );
}
