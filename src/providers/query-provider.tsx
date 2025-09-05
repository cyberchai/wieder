"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, ReactNode } from 'react';

// Extend Window interface to include gtag
declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, unknown>
    ) => void;
  }
}

// Cache monitoring utilities
interface CacheMetrics {
  hits: number;
  misses: number;
  totalRequests: number;
  lastUpdated: Date;
}

class CacheMonitor {
  private metrics: Map<string, CacheMetrics> = new Map();
  private listeners: Set<(metrics: Map<string, CacheMetrics>) => void> = new Set();

  trackCacheHit(queryKey: string) {
    const current = this.metrics.get(queryKey) || { hits: 0, misses: 0, totalRequests: 0, lastUpdated: new Date() };
    current.hits++;
    current.totalRequests++;
    current.lastUpdated = new Date();
    this.metrics.set(queryKey, current);
    this.notifyListeners();
  }

  trackCacheMiss(queryKey: string) {
    const current = this.metrics.get(queryKey) || { hits: 0, misses: 0, totalRequests: 0, lastUpdated: new Date() };
    current.misses++;
    current.totalRequests++;
    current.lastUpdated = new Date();
    this.metrics.set(queryKey, current);
    this.notifyListeners();
  }

  getMetrics() {
    return new Map(this.metrics);
  }

  getHitRate(queryKey?: string) {
    if (queryKey) {
      const metric = this.metrics.get(queryKey);
      if (!metric || metric.totalRequests === 0) return 0;
      return metric.hits / metric.totalRequests;
    }
    
    // Overall hit rate
    let totalHits = 0;
    let totalRequests = 0;
    this.metrics.forEach(metric => {
      totalHits += metric.hits;
      totalRequests += metric.totalRequests;
    });
    
    return totalRequests === 0 ? 0 : totalHits / totalRequests;
  }

  subscribe(listener: (metrics: Map<string, CacheMetrics>) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(new Map(this.metrics)));
  }

  // Send metrics to analytics
  reportMetrics() {
    const metrics = this.getMetrics();
    const overallHitRate = this.getHitRate();
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('📊 Cache Performance Metrics');
      console.log('Overall Hit Rate:', (overallHitRate * 100).toFixed(2) + '%');
      console.table(Array.from(metrics.entries()).map(([key, metric]) => ({
        Query: key,
        'Hit Rate': ((metric.hits / metric.totalRequests) * 100).toFixed(2) + '%',
        'Total Requests': metric.totalRequests,
        'Cache Hits': metric.hits,
        'Cache Misses': metric.misses,
        'Last Updated': metric.lastUpdated.toLocaleTimeString()
      })));
      console.groupEnd();
    }

    // Send to analytics (you can integrate with your existing analytics)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'cache_performance', {
        overall_hit_rate: overallHitRate,
        total_queries: metrics.size,
        custom_parameters: {
          query_metrics: Object.fromEntries(metrics)
        }
      });
    }
  }
}

export const cacheMonitor = new CacheMonitor();

// Create a custom query client with cache monitoring
const createQueryClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Cache for 5 minutes by default
        staleTime: 5 * 60 * 1000,
        // Keep in cache for 10 minutes
        gcTime: 10 * 60 * 1000,
        // Retry failed requests
        retry: 2,
        // Refetch on window focus
        refetchOnWindowFocus: false,
        // Refetch on reconnect
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 1,
      },
    },
  });

  // Add cache monitoring using the correct API
  queryClient.getQueryCache().subscribe((event) => {
    if (event.type === 'updated' && event.query.state.status === 'success') {
      const queryKey = JSON.stringify(event.query.queryKey);
      cacheMonitor.trackCacheHit(queryKey);
    } else if (event.type === 'updated' && event.query.state.status === 'error') {
      const queryKey = JSON.stringify(event.query.queryKey);
      cacheMonitor.trackCacheMiss(queryKey);
    }
  });

  return queryClient;
};

interface QueryProviderProps {
  children: ReactNode;
}

export const QueryProvider = ({ children }: QueryProviderProps) => {
  const [queryClient] = useState(() => createQueryClient());

  // Report metrics every 30 seconds in development
  useState(() => {
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        cacheMonitor.reportMetrics();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
};

// Hook to access cache metrics
export const useCacheMetrics = () => {
  const [metrics, setMetrics] = useState<Map<string, CacheMetrics>>(new Map());

  useState(() => {
    const unsubscribe = cacheMonitor.subscribe(setMetrics);
    return unsubscribe;
  });

  const getHitRate = (queryKey?: string) => cacheMonitor.getHitRate(queryKey);
  const reportMetrics = () => cacheMonitor.reportMetrics();

  return {
    metrics,
    getHitRate,
    reportMetrics,
    overallHitRate: getHitRate(),
  };
};
