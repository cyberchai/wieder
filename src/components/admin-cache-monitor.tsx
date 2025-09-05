"use client";

import { useState, useEffect } from 'react';
import { useCacheMetrics } from '@/providers/simple-query-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { 
  Activity,
  RefreshCw,
  BarChart3,
  Settings,
  Eye,
  EyeOff,
} from 'lucide-react';

export const AdminCacheMonitor = () => {
  const { metrics, getHitRate, reportMetrics, overallHitRate } = useCacheMetrics();
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [, forceUpdate] = useState({});
  const [isVisible, setIsVisible] = useState(false);
  const [adminMode, setAdminMode] = useState(false);

  // Check if admin mode should be enabled
  useEffect(() => {
    // Only enable admin mode if:
    // 1. URL has ?admin=true (explicit admin access)
    // 2. localStorage has admin mode enabled (persistent admin access)
    // Development mode is disabled for production
    const urlParams = new URLSearchParams(window.location.search);
    const isAdminFromUrl = urlParams.get('admin') === 'true';
    const isAdminFromStorage = localStorage.getItem('cache-monitor-admin') === 'true';
    
    setAdminMode(isAdminFromUrl || isAdminFromStorage);
  }, []);

  // Auto-refresh metrics every 5 seconds when enabled
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      forceUpdate({});
    }, 5000);
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Admin mode toggle - Ctrl/Cmd + Shift + A (silent)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + A to toggle admin mode (silent)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        const newAdminMode = !adminMode;
        setAdminMode(newAdminMode);
        localStorage.setItem('cache-monitor-admin', newAdminMode.toString());
        setIsVisible(newAdminMode);
        // No console logging - completely silent
      }
      // Ctrl/Cmd + Shift + C to toggle cache monitor visibility (silent)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        if (adminMode) {
          setIsVisible(prev => !prev);
          // No console logging - completely silent
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [adminMode]);

  const getHitRateColor = (hitRate: number) => {
    if (hitRate >= 0.8) return 'text-green-600';
    if (hitRate >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHitRateBadgeVariant = (hitRate: number) => {
    if (hitRate >= 0.8) return 'default';
    if (hitRate >= 0.6) return 'secondary';
    return 'destructive';
  };

  const formatQueryKey = (key: string) => {
    try {
      const parsed = JSON.parse(key);
      if (Array.isArray(parsed)) {
        return parsed.join(' > ');
      }
      return key;
    } catch {
      return key;
    }
  };

  const totalRequests = Array.from(metrics.values()).reduce(
    (sum, metric) => sum + metric.totalRequests, 
    0
  );

  const totalHits = Array.from(metrics.values()).reduce(
    (sum, metric) => sum + metric.hits, 
    0
  );

  const totalMisses = Array.from(metrics.values()).reduce(
    (sum, metric) => sum + metric.misses, 
    0
  );

  // Only show if admin mode is enabled AND visible
  if (!adminMode || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className={`w-80 transition-all duration-300 ${isExpanded ? 'h-96' : 'h-auto'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <CardTitle className="text-sm">Admin Cache Monitor</CardTitle>
              <Badge variant="outline" className="text-xs">ADMIN</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(!isVisible)}
                className="h-6 w-6 p-0"
              >
                {isVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className={`h-3 w-3 ${autoRefresh ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 p-0"
              >
                {isExpanded ? '−' : '+'}
              </Button>
            </div>
          </div>
          <CardDescription className="text-xs">
            Overall hit rate: <span className={getHitRateColor(overallHitRate)}>
              {(overallHitRate * 100).toFixed(1)}%
            </span>
            <br />
            <span className="text-muted-foreground">
              Press Ctrl+Shift+A to toggle admin mode
            </span>
          </CardDescription>
        </CardHeader>

        {isVisible && (
          <CardContent className="pt-0">
            <div className="space-y-3">
              {/* Admin Controls */}
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <div className="flex items-center gap-2">
                  <Settings className="h-3 w-3" />
                  <span className="text-xs font-medium">Admin Controls</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs">Auto Refresh</span>
                  <Switch
                    checked={autoRefresh}
                    onCheckedChange={setAutoRefresh}
                    className="scale-75"
                  />
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-semibold text-green-600">{totalHits}</div>
                  <div className="text-muted-foreground">Hits</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-red-600">{totalMisses}</div>
                  <div className="text-muted-foreground">Misses</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{totalRequests}</div>
                  <div className="text-muted-foreground">Total</div>
                </div>
              </div>

              {/* Overall Hit Rate Progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Hit Rate</span>
                  <span className={getHitRateColor(overallHitRate)}>
                    {(overallHitRate * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={overallHitRate * 100} 
                  className="h-2"
                />
              </div>

              {isExpanded && (
                <div className="space-y-2">
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {Array.from(metrics.entries()).map(([queryKey, metric]) => {
                      const hitRate = metric.totalRequests > 0 ? metric.hits / metric.totalRequests : 0;
                      return (
                        <div key={queryKey} className="p-2 border rounded text-xs">
                          <div className="flex justify-between items-start mb-1">
                            <div className="font-mono text-xs truncate flex-1 mr-2">
                              {formatQueryKey(queryKey)}
                            </div>
                            <Badge 
                              variant={getHitRateBadgeVariant(hitRate)}
                              className="text-xs"
                            >
                              {(hitRate * 100).toFixed(0)}%
                            </Badge>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>{metric.hits}H/{metric.misses}M</span>
                            <span>{metric.totalRequests} total</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={reportMetrics}
                      className="flex-1 text-xs"
                    >
                      <BarChart3 className="h-3 w-3 mr-1" />
                      Report
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};
