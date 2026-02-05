import { AppError, ErrorSeverity } from '../errors/base-error'
import { ErrorCategory } from '../constants/error-categories'

export interface ErrorMetrics {
  count: number;
  category: ErrorCategory;
  severity: ErrorSeverity;
  lastOccurred: Date;
  avgResponseTime?: number;
}

export class ErrorMetricsCollector {
  private metrics = new Map<string, ErrorMetrics>();

  record(error: AppError, responseTime?: number): void {
    const key = `${error.category}:${error.code}`;
    const existing = this.metrics.get(key);

    if (existing) {
      existing.count += 1;
      existing.lastOccurred = new Date();
      if (responseTime && existing.avgResponseTime) {
        existing.avgResponseTime = (existing.avgResponseTime + responseTime) / 2;
      }
    } else {
      this.metrics.set(key, {
        count: 1,
        category: error.category,
        severity: error.severity,
        lastOccurred: new Date(),
        ...(responseTime !== undefined && { avgResponseTime: responseTime }),
      });
    }
  }

  getMetrics(): Record<string, ErrorMetrics> {
    return Object.fromEntries(this.metrics);
  }

  clear(): void {
    this.metrics.clear();
  }
}

export const errorMetrics = new ErrorMetricsCollector();