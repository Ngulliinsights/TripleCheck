import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';

interface MetricData {
  name: string;
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
}

interface VerificationMetrics {
  totalVerifications: number;
  successfulVerifications: number;
  failedVerifications: number;
  averageProcessingTime: number;
  verificationsByType: Record<string, number>;
  verificationsByRiskLevel: Record<string, number>;
  apiCallMetrics: Record<string, {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    averageResponseTime: number;
  }>;
}

export class MetricsService {
  private metrics: Map<string, MetricData[]> = new Map();
  private counters: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  // Counter methods
  incrementCounter(name: string, labels?: Record<string, string>): void {
    const key = this.createKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + 1);
    
    this.recordMetric({
      name,
      value: current + 1,
      timestamp: Date.now(),
      labels
    });
  }

  // Histogram methods
  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.createKey(name, labels);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);
    
    this.recordMetric({
      name,
      value,
      timestamp: Date.now(),
      labels
    });
  }

  // Gauge methods
  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    this.recordMetric({
      name,
      value,
      timestamp: Date.now(),
      labels
    });
  }

  // Land verification specific metrics
  recordVerificationStart(sessionId: string, verificationType: string): void {
    this.incrementCounter('land_verification_started_total', {
      type: verificationType,
      session_id: sessionId
    });
  }

  recordVerificationComplete(sessionId: string, verificationType: string, success: boolean, duration: number): void {
    const status = success ? 'success' : 'failure';
    
    this.incrementCounter('land_verification_completed_total', {
      type: verificationType,
      status,
      session_id: sessionId
    });
    
    this.recordHistogram('land_verification_duration_seconds', duration / 1000, {
      type: verificationType,
      status
    });
  }

  recordRiskAssessment(sessionId: string, riskLevel: string, riskScore: number): void {
    this.incrementCounter('land_verification_risk_assessments_total', {
      risk_level: riskLevel,
      session_id: sessionId
    });
    
    this.recordHistogram('land_verification_risk_score', riskScore, {
      risk_level: riskLevel
    });
  }

  recordAPICall(apiName: string, endpoint: string, success: boolean, responseTime: number): void {
    const status = success ? 'success' : 'failure';
    
    this.incrementCounter('external_api_calls_total', {
      api: apiName,
      endpoint,
      status
    });
    
    this.recordHistogram('external_api_response_time_seconds', responseTime / 1000, {
      api: apiName,
      endpoint,
      status
    });
  }

  recordGovernmentIntegration(integrationType: string, success: boolean, responseTime: number): void {
    const status = success ? 'success' : 'failure';
    
    this.incrementCounter('government_integration_calls_total', {
      type: integrationType,
      status
    });
    
    this.recordHistogram('government_integration_response_time_seconds', responseTime / 1000, {
      type: integrationType,
      status
    });
  }

  recordCommunityIntelligence(sessionId: string, feedbackCount: number, reliabilityScore: number): void {
    this.setGauge('community_feedback_count', feedbackCount, {
      session_id: sessionId
    });
    
    this.recordHistogram('community_feedback_reliability_score', reliabilityScore, {
      session_id: sessionId
    });
  }

  recordExpertCoordination(expertType: string, assigned: boolean, responseTime?: number): void {
    const status = assigned ? 'assigned' : 'unavailable';
    
    this.incrementCounter('expert_coordination_requests_total', {
      expert_type: expertType,
      status
    });
    
    if (responseTime) {
      this.recordHistogram('expert_response_time_seconds', responseTime / 1000, {
        expert_type: expertType,
        status
      });
    }
  }

  // Get aggregated metrics
  getVerificationMetrics(): VerificationMetrics {
    const totalVerifications = this.getCounterValue('land_verification_started_total');
    const successfulVerifications = this.getCounterValue('land_verification_completed_total', { status: 'success' });
    const failedVerifications = this.getCounterValue('land_verification_completed_total', { status: 'failure' });
    
    const processingTimes = this.getHistogramValues('land_verification_duration_seconds');
    const averageProcessingTime = processingTimes.length > 0 
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length 
      : 0;

    return {
      totalVerifications,
      successfulVerifications,
      failedVerifications,
      averageProcessingTime,
      verificationsByType: this.getCountersByLabel('land_verification_completed_total', 'type'),
      verificationsByRiskLevel: this.getCountersByLabel('land_verification_risk_assessments_total', 'risk_level'),
      apiCallMetrics: this.getAPICallMetrics()
    };
  }

  // Express middleware for request metrics
  requestMetricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const startTime = performance.now();
    
    res.on('finish', () => {
      const duration = performance.now() - startTime;
      const route = req.route?.path || req.path;
      const method = req.method;
      const statusCode = res.statusCode.toString();
      
      this.incrementCounter('http_requests_total', {
        method,
        route,
        status_code: statusCode
      });
      
      this.recordHistogram('http_request_duration_seconds', duration / 1000, {
        method,
        route,
        status_code: statusCode
      });
    });
    
    next();
  };

  // Metrics endpoint handler
  metricsHandler = (req: Request, res: Response): void => {
    const metrics = this.getVerificationMetrics();
    res.json({
      timestamp: new Date().toISOString(),
      metrics,
      counters: Object.fromEntries(this.counters),
      histograms: this.getHistogramSummaries()
    });
  };

  // Prometheus format metrics
  prometheusHandler = (req: Request, res: Response): void => {
    let output = '';
    
    // Export counters
    for (const [key, value] of this.counters) {
      const [name, labels] = this.parseKey(key);
      const labelString = labels ? this.formatPrometheusLabels(labels) : '';
      output += `${name}${labelString} ${value}\n`;
    }
    
    // Export histogram summaries
    for (const [key, values] of this.histograms) {
      const [name, labels] = this.parseKey(key);
      const labelString = labels ? this.formatPrometheusLabels(labels) : '';
      
      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        const count = values.length;
        
        output += `${name}_sum${labelString} ${sum}\n`;
        output += `${name}_count${labelString} ${count}\n`;
      }
    }
    
    res.set('Content-Type', 'text/plain');
    res.send(output);
  };

  private recordMetric(metric: MetricData): void {
    const key = this.createKey(metric.name, metric.labels);
    const metrics = this.metrics.get(key) || [];
    metrics.push(metric);
    
    // Keep only last 1000 metrics per key to prevent memory issues
    if (metrics.length > 1000) {
      metrics.shift();
    }
    
    this.metrics.set(key, metrics);
  }

  private createKey(name: string, labels?: Record<string, string>): string {
    if (!labels) return name;
    const labelString = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return `${name}{${labelString}}`;
  }

  private parseKey(key: string): [string, Record<string, string> | undefined] {
    const match = key.match(/^([^{]+)(?:\{(.+)\})?$/);
    if (!match) return [key, undefined];
    
    const [, name, labelString] = match;
    if (!labelString) return [name, undefined];
    
    const labels: Record<string, string> = {};
    const labelPairs = labelString.split(',');
    
    for (const pair of labelPairs) {
      const [k, v] = pair.split('=');
      labels[k] = v.replace(/"/g, '');
    }
    
    return [name, labels];
  }

  private getCounterValue(name: string, labels?: Record<string, string>): number {
    const key = this.createKey(name, labels);
    return this.counters.get(key) || 0;
  }

  private getHistogramValues(name: string, labels?: Record<string, string>): number[] {
    const key = this.createKey(name, labels);
    return this.histograms.get(key) || [];
  }

  private getCountersByLabel(metricName: string, labelName: string): Record<string, number> {
    const result: Record<string, number> = {};
    
    for (const [key, value] of this.counters) {
      const [name, labels] = this.parseKey(key);
      if (name === metricName && labels && labels[labelName]) {
        result[labels[labelName]] = (result[labels[labelName]] || 0) + value;
      }
    }
    
    return result;
  }

  private getAPICallMetrics(): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [key, value] of this.counters) {
      const [name, labels] = this.parseKey(key);
      if (name === 'external_api_calls_total' && labels && labels.api) {
        const api = labels.api;
        if (!result[api]) {
          result[api] = {
            totalCalls: 0,
            successfulCalls: 0,
            failedCalls: 0,
            averageResponseTime: 0
          };
        }
        
        result[api].totalCalls += value;
        if (labels.status === 'success') {
          result[api].successfulCalls += value;
        } else {
          result[api].failedCalls += value;
        }
      }
    }
    
    return result;
  }

  private getHistogramSummaries(): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [key, values] of this.histograms) {
      const [name] = this.parseKey(key);
      if (values.length > 0) {
        const sorted = [...values].sort((a, b) => a - b);
        result[key] = {
          count: values.length,
          sum: values.reduce((a, b) => a + b, 0),
          min: sorted[0],
          max: sorted[sorted.length - 1],
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          p50: sorted[Math.floor(sorted.length * 0.5)],
          p95: sorted[Math.floor(sorted.length * 0.95)],
          p99: sorted[Math.floor(sorted.length * 0.99)]
        };
      }
    }
    
    return result;
  }

  private formatPrometheusLabels(labels: Record<string, string>): string {
    const labelPairs = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return `{${labelPairs}}`;
  }
}

export const metricsService = new MetricsService();