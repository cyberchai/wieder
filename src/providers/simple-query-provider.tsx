"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, ReactNode } from 'react';

// Simple cache monitoring without complex tracking
class SimpleCacheMonitor {
  private metrics: Map<string, { hits: number; misses: number; totalRequests: number }> = new Map();

  trackCacheHit(queryKey: string) {
    const current = this.metrics.get(queryKey) || { hits: 0, misses: 0, totalRequests: 0 };
    current.hits++;
    current.totalRequests++;
    this.metrics.set(queryKey, current);
  }

  trackCacheMiss(queryKey: string) {
    const current = this.metrics.get(queryKey) || { hits: 0, misses: 0, totalRequests: 0 };
    current.misses++;
    current.totalRequests++;
    this.metrics.set(queryKey, current);
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

  reportMetrics() {
    const overallHitRate = this.getHitRate();
    
    if (process.env.NODE_ENV === 'development') {
      console.group('📊 Cache Performance Metrics');
      console.log('Overall Hit Rate:', (overallHitRate * 100).toFixed(2) + '%');
      console.table(Array.from(this.metrics.entries()).map(([key, metric]) => ({
        Query: key,
        'Hit Rate': ((metric.hits / metric.totalRequests) * 100).toFixed(2) + '%',
        'Total Requests': metric.totalRequests,
        'Cache Hits': metric.hits,
        'Cache Misses': metric.misses,
      })));
      console.groupEnd();
    }
  }
}

export const simpleCacheMonitor = new SimpleCacheMonitor();

// Create a simple query client
const createQueryClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 2,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 1,
      },
    },
  });

  // Simple cache monitoring
  queryClient.getQueryCache().subscribe((event) => {
    if (event.type === 'updated') {
      const queryKey = JSON.stringify(event.query.queryKey);
      if (event.query.state.status === 'success') {
        simpleCacheMonitor.trackCacheHit(queryKey);
      } else if (event.query.state.status === 'error') {
        simpleCacheMonitor.trackCacheMiss(queryKey);
      }
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
        simpleCacheMonitor.reportMetrics();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Simple hook to access cache metrics
export const useCacheMetrics = () => {
  const getHitRate = (queryKey?: string) => simpleCacheMonitor.getHitRate(queryKey);
  const reportMetrics = () => simpleCacheMonitor.reportMetrics();
  const metrics = simpleCacheMonitor.getMetrics();

  return {
    metrics,
    getHitRate,
    reportMetrics,
    overallHitRate: getHitRate(),
  };
};

