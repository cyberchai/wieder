"use client"

import { useTheme } from '@/providers/theme-provider';
import Aurora from './aurora';
import LowPolyLandscapeBackground from './low-poly-landscape-background';

interface AuroraBackgroundProps {
  className?: string;
}

export default function AuroraBackground({ className = "" }: AuroraBackgroundProps) {
  const { theme } = useTheme();
  
  // Show low-poly landscape background for wiederland theme
  if (theme === 'wiederland') {
    return <LowPolyLandscapeBackground className={className} />;
  }
  
  // Show noise background for light theme
  if (theme === 'light') {
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
