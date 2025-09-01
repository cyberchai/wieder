'use client';

import { useTheme } from '@/providers/theme-provider';
import Particles from './particles';

interface DashboardParticlesBackgroundProps {
  className?: string;
}

export default function DashboardParticlesBackground({ className = "" }: DashboardParticlesBackgroundProps) {
  const { theme } = useTheme();
  
  // Only show Particles background for Smith Bears theme on dashboard
  if (theme !== 'skunks') {
    return null;
  }

  return (
    <div className={`fixed inset-0 pointer-events-none z-0 ${className}`}>
      <Particles 
        particleCount={100}
        particleSpread={8}
        speed={0.15}
        particleColors={['#fcb715', '#fcce15', '#fcd73f']}
        moveParticlesOnHover={true}
        particleHoverFactor={2}
        alphaParticles={true}
        particleBaseSize={80}
        sizeRandomness={0.8}
        cameraDistance={25}
        disableRotation={false}
      />
    </div>
  );
}
