"use client";

import { useState, useEffect } from 'react';
import { useCacheMetrics } from '@/providers/query-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Database, 
  RefreshCw,
  Activity,
  Zap,
  AlertTriangle
} from 'lucide-react';

interface CacheMetrics {
  hits: number;
  misses: number;
  totalRequests: number;
  lastUpdated: Date;
}

export const CacheMonitor = () => {
  const { metrics, getHitRate, reportMetrics, overallHitRate } = useCacheMetrics();
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [, forceUpdate] = useState({});

  // Auto-refresh metrics every 5 seconds when enabled
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      // Force re-render by updating state
      forceUpdate({});
    }, 5000);
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

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

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className={`w-80 transition-all duration-300 ${isExpanded ? 'h-96' : 'h-auto'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <CardTitle className="text-sm">Cache Monitor</CardTitle>
            </div>
            <div className="flex items-center gap-2">
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
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-3">
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
              <Tabs defaultValue="queries" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="queries" className="text-xs">Queries</TabsTrigger>
                  <TabsTrigger value="performance" className="text-xs">Performance</TabsTrigger>
                </TabsList>
                
                <TabsContent value="queries" className="space-y-2 mt-3">
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
                </TabsContent>
                
                <TabsContent value="performance" className="space-y-3 mt-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <Zap className="h-3 w-3" />
                      <span>Cache Performance</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-muted rounded">
                        <div className="font-semibold">Best Query</div>
                        <div className="text-muted-foreground">
                          {(() => {
                            const best = Array.from(metrics.entries())
                              .reduce((best, [key, metric]) => {
                                const hitRate = metric.totalRequests > 0 ? metric.hits / metric.totalRequests : 0;
                                return hitRate > best.hitRate ? { key, hitRate } : best;
                              }, { key: '', hitRate: 0 });
                            return best.hitRate > 0 ? `${(best.hitRate * 100).toFixed(0)}%` : 'N/A';
                          })()}
                        </div>
                      </div>
                      
                      <div className="p-2 bg-muted rounded">
                        <div className="font-semibold">Worst Query</div>
                        <div className="text-muted-foreground">
                          {(() => {
                            const worst = Array.from(metrics.entries())
                              .reduce((worst, [key, metric]) => {
                                const hitRate = metric.totalRequests > 0 ? metric.hits / metric.totalRequests : 0;
                                return hitRate < worst.hitRate ? { key, hitRate } : worst;
                              }, { key: '', hitRate: 1 });
                            return worst.hitRate < 1 ? `${(worst.hitRate * 100).toFixed(0)}%` : 'N/A';
                          })()}
                        </div>
                      </div>
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
                </TabsContent>
              </Tabs>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
