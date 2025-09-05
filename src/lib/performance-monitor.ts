// Performance monitoring utility to track query improvements
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, { count: number; totalTime: number; avgTime: number }> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTimer(operation: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      this.recordMetric(operation, duration);
    };
  }

  private recordMetric(operation: string, duration: number): void {
    const existing = this.metrics.get(operation) || { count: 0, totalTime: 0, avgTime: 0 };
    existing.count++;
    existing.totalTime += duration;
    existing.avgTime = existing.totalTime / existing.count;
    this.metrics.set(operation, existing);

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${operation}: ${duration.toFixed(2)}ms (avg: ${existing.avgTime.toFixed(2)}ms)`);
    }
  }

  getMetrics(): Map<string, { count: number; totalTime: number; avgTime: number }> {
    return new Map(this.metrics);
  }

  getReport(): string {
    const report: string[] = [];
    report.push('📊 Performance Report');
    report.push('==================');
    
    this.metrics.forEach((metric, operation) => {
      report.push(`${operation}:`);
      report.push(`  Count: ${metric.count}`);
      report.push(`  Total Time: ${metric.totalTime.toFixed(2)}ms`);
      report.push(`  Average Time: ${metric.avgTime.toFixed(2)}ms`);
      report.push('');
    });
    
    return report.join('\n');
  }

  reset(): void {
    this.metrics.clear();
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

// Helper function to wrap async operations
export const withPerformanceMonitoring = async <T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> => {
  const endTimer = performanceMonitor.startTimer(operation);
  try {
    const result = await fn();
    return result;
  } finally {
    endTimer();
  }
};
