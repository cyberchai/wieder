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

  // Only log to console, no UI
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        reportMetrics(); // This already logs to console
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, reportMetrics]);

  // No visible UI
  return null;
};
