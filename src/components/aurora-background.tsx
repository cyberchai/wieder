"use client"

import { useTheme } from '@/providers/theme-provider';
import Aurora from './aurora';

interface AuroraBackgroundProps {
  className?: string;
}

export default function AuroraBackground({ className = "" }: AuroraBackgroundProps) {
  const { theme } = useTheme();
  
  // Only show aurora for dark theme
  if (theme !== 'dark') {
    return null;
  }

  return (
    <div className={`fixed inset-0 pointer-events-none z-0 ${className}`}>
      <Aurora 
        colorStops={['#5227FF', '#7cff67', '#5227FF']}
        amplitude={1.2}
        blend={0.6}
        speed={0.8}
      />
    </div>
  );
}
