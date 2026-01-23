"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { performanceMonitor } from '@/lib/performance-monitor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const PerformanceDashboard = () => {
  const [metrics, setMetrics] = useState<Map<string, { count: number; totalTime: number; avgTime: number }>>(new Map());
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();

  // Check if we're on the dashboard page
  const isDashboardPage = pathname === '/dashboard';

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const updateMetrics = () => {
      setMetrics(performanceMonitor.getMetrics());
    };

    // Update metrics every 5 seconds
    const interval = setInterval(updateMetrics, 5000);
    updateMetrics(); // Initial update

    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut handler
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+Shift+P
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Only log to console, no UI
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const updateMetrics = () => {
      const currentMetrics = performanceMonitor.getMetrics();
      if (currentMetrics.size > 0) {
        console.log('📊 Performance Metrics:', performanceMonitor.getReport());
      }
    };

    // Log metrics every 30 seconds
    const interval = setInterval(updateMetrics, 30000);
    updateMetrics(); // Initial log

    return () => clearInterval(interval);
  }, []);

  // No visible UI
  return null;
};
