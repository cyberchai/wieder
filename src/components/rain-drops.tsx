"use client";

import { useEffect, useState, useRef } from 'react';

interface RainDrop {
  id: number;
  x: number;
  y: number;
  speed: number;
  opacity: number;
  size: number;
  trail: Array<{ x: number; y: number; opacity: number }>;
  color: string;
  isNew: boolean;
  wind: number;
}

interface RainDropsProps {
  score: number;
  isPlaying: boolean;
  headerHeight: number;
}

export default function RainDrops({ score, isPlaying, headerHeight }: RainDropsProps) {
  const [drops, setDrops] = useState<RainDrop[]>([]);
  const animationRef = useRef<number>();
  const dropIdRef = useRef(0);

  // Calculate how many drops to show based on score
  const getDropCount = (currentScore: number) => {
    if (currentScore < 10) return 0; // No drops until score reaches 10
    return (Math.floor((currentScore - 10) / 20) + 1) * 3; // Start at 10, increment every 20, multiply by 3
  };

  // Generate new drops when score increases
  useEffect(() => {
    if (!isPlaying) return;

    const targetDropCount = getDropCount(score);
    const currentDropCount = drops.length;

    if (targetDropCount > currentDropCount) {
      const newDrops: RainDrop[] = [];
      const dropsToAdd = targetDropCount - currentDropCount;

      for (let i = 0; i < dropsToAdd; i++) {
        const drop: RainDrop = {
          id: dropIdRef.current++,
          x: Math.random() * window.innerWidth, // Full screen width
          y: headerHeight + Math.random() * 20, // Start from header area with slight randomization
          speed: 1.5 + Math.random() * 4, // Random speed between 1.5-5.5 for more variety
          opacity: 0.5 + Math.random() * 0.5, // Random opacity between 0.5-1.0
          size: 1.5 + Math.random() * 4, // Random size between 1.5-5.5px for more variety
          trail: [],
          color: ['#3B82F6', '#60A5FA', '#93C5FD', '#2563EB', '#1E40AF', '#7DD3FC'][Math.floor(Math.random() * 6)], // More blue shades
          isNew: true,
          wind: (Math.random() - 0.5) * 0.8, // Slight wind effect for realistic rain
        };
        newDrops.push(drop);
      }

      setDrops(prev => [...prev, ...newDrops]);
    } else if (targetDropCount < currentDropCount) {
      // Remove excess drops when score decreases (e.g., on restart)
      setDrops(prev => prev.slice(0, targetDropCount));
    }
  }, [score, isPlaying, headerHeight, drops.length]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) return;

    const animate = () => {
      setDrops(prev => {
        const updatedDrops = prev
          .map(drop => {
            // Add current position to trail
            const newTrail = [
              { x: drop.x, y: drop.y, opacity: drop.opacity * 0.3 },
              ...drop.trail.slice(0, 3) // Keep last 3 trail positions
            ];
            
            return {
              ...drop,
              x: drop.x + drop.wind, // Apply wind effect
              y: drop.y + drop.speed,
              trail: newTrail,
              isNew: drop.isNew && drop.y < headerHeight + 100, // Remove "new" flag after falling a bit
            };
          })
          .filter(drop => {
            // Remove drops that have fallen off screen
            const screenHeight = window.innerHeight;
            return drop.y < screenHeight + 50;
          });

        return updatedDrops;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  // Clear drops when game stops
  useEffect(() => {
    if (!isPlaying) {
      setDrops([]);
    }
  }, [isPlaying]);

  if (!isPlaying || drops.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      {drops.map(drop => (
        <div key={drop.id}>
          {/* Render trail */}
          {drop.trail.map((trailPoint, index) => (
            <div
              key={`trail-${drop.id}-${index}`}
              className="absolute rounded-full"
              style={{
                left: `${trailPoint.x}px`,
                top: `${trailPoint.y}px`,
                width: `${drop.size * 0.6}px`,
                height: `${drop.size * 1.2}px`,
                opacity: trailPoint.opacity * (1 - index * 0.2),
                background: `linear-gradient(to bottom, ${drop.color}${Math.floor(trailPoint.opacity * 0.5 * 255).toString(16).padStart(2, '0')}, ${drop.color}${Math.floor(trailPoint.opacity * 0.3 * 255).toString(16).padStart(2, '0')})`,
                filter: 'blur(0.3px)',
              }}
            />
          ))}
          
          {/* Render main drop */}
          <div
            className={`absolute rounded-full shadow-lg ${drop.isNew ? 'animate-pulse' : ''}`}
            style={{
              left: `${drop.x}px`,
              top: `${drop.y}px`,
              width: `${drop.size}px`,
              height: `${drop.size * 2}px`, // Make drops more elongated like real rain
              opacity: drop.opacity,
              filter: 'blur(0.5px)',
              background: `linear-gradient(to bottom, ${drop.color}${Math.floor(drop.opacity * 255).toString(16).padStart(2, '0')}, ${drop.color}${Math.floor(drop.opacity * 0.7 * 255).toString(16).padStart(2, '0')})`,
              transform: `rotate(${Math.random() * 10 - 5}deg)`, // Slight random rotation
              boxShadow: `0 0 ${drop.size * 2}px ${drop.color}${Math.floor(drop.opacity * 0.3 * 255).toString(16).padStart(2, '0')}`,
            }}
          />
        </div>
      ))}
    </div>
  );
}
