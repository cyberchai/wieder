"use client"

import { useTheme } from '@/providers/theme-provider';
import Aurora from './aurora';

interface AuroraBackgroundProps {
  className?: string;
}

export default function AuroraBackground({ className = "" }: AuroraBackgroundProps) {
  const { theme } = useTheme();
  
  // Show noise background for bw theme
  if (theme === 'bw') {
    return (
      <div 
        className={`fixed inset-0 pointer-events-none z-0 ${className}`}
        style={{
          backgroundImage: 'url(/noise.svg)',
          backgroundRepeat: 'repeat',
          opacity: 0.4,
        }}
      />
    );
  }
  
  // Only show aurora for dark theme
  if (theme !== 'dark') {
    return null;
  }

  return (
    <div className={`fixed inset-0 pointer-events-none z-0 ${className}`}>
      <Aurora 
        colorStops={['#5227FF', '#7cff67', '#5227FF']}
        amplitude={0.7}
        blend={0.5}
        speed={0.8}
      />
    </div>
  );
}
