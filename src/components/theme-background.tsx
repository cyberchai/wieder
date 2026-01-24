'use client';

import { useTheme } from '@/providers/theme-provider';
import DotGrid from './dot-grid';
import Particles from './particles';
import LowPolyLandscapeBackground from './low-poly-landscape-background';

interface ThemeBackgroundProps {
  className?: string;
}

export default function ThemeBackground({ className = "" }: ThemeBackgroundProps) {
  const { theme } = useTheme();
  
  // Show LowPolyLandscapeBackground for wiederland theme
  if (theme === 'wiederland') {
    return <LowPolyLandscapeBackground className={className} />;
  }
  
  // Show DotGrid background for dark theme
  if (theme === 'dark') {
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

  return null;
}
