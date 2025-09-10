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

  if (process.env.NODE_ENV !== 'development') return null;

  const handleReset = () => {
    performanceMonitor.reset();
    setMetrics(new Map());
  };

  const handlePrintReport = () => {
    console.log(performanceMonitor.getReport());
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Only show button if not on dashboard page */}
      {false && !isDashboardPage && (
        <Button
          onClick={() => setIsVisible(!isVisible)}
          variant="outline"
          size="sm"
          className="mb-2"
        >
          {isVisible ? 'Hide' : 'Show'} Performance
        </Button>
      )}
      
      {/* Show small indicator on dashboard when hidden */}
      {isDashboardPage && !isVisible && (
        <div className="mb-2 w-2 h-2 bg-blue-500 rounded-full opacity-50 hover:opacity-100 transition-opacity cursor-pointer" 
             onClick={() => setIsVisible(true)}
             title="Press Ctrl+Shift+P to toggle performance metrics" />
      )}
      
      {/* Show keyboard shortcut hint when visible on dashboard */}
      {isDashboardPage && isVisible && (
        <div className="mb-2 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded">
          Press Ctrl+Shift+P to toggle
        </div>
      )}
      
      {isVisible && (
        <Card className="w-80 max-h-96 overflow-y-auto">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Performance Metrics</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleReset}>
                Reset
              </Button>
              <Button size="sm" variant="outline" onClick={handlePrintReport}>
                Print Report
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {metrics.size === 0 ? (
              <p className="text-sm text-muted-foreground">No metrics yet</p>
            ) : (
              <div className="space-y-3">
                {Array.from(metrics.entries()).map(([operation, metric]) => (
                  <div key={operation} className="space-y-1">
                    <div className="text-sm font-medium">{operation}</div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Count: {metric.count}</div>
                      <div>Avg Time: {metric.avgTime.toFixed(2)}ms</div>
                      <div>Total Time: {metric.totalTime.toFixed(2)}ms</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
