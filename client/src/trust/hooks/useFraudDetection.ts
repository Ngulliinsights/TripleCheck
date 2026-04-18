import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback } from 'react'

import { apiClient } from "../../local/services/unified-api-client"

export interface FraudAlert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  subcategories: string[];
  confidence: number;
  propertyId?: string;
  transactionId?: string;
  networkId?: string;
  participants: ParticipantInfo[];
  evidence: Evidence[];
  riskFactors: RiskFactor[];
  jurisdiction: string[];
  estimatedLoss?: number;
  timeframe: {
    detectedAt: Date;
    incidentStart?: Date;
    incidentEnd?: Date;
  };
  investigationPriority: number;
  relatedAlerts: string[];
  status: 'active' | 'investigating' | 'resolved' | 'dismissed';
  assignedTo?: string;
  notes?: string;
}

export interface ParticipantInfo {
  id: string;
  type: 'individual' | 'entity' | 'professional' | 'institution';
  name: string;
  role: string;
  riskScore: number;
  previousIncidents: number;
  verificationStatus: 'verified' | 'pending' | 'failed' | 'synthetic';
  jurisdictions: string[];
  networkConnections: number;
}

export interface Evidence {
  id: string;
  type: 'document' | 'transaction' | 'communication' | 'behavioral' | 'network';
  source: string;
  description: string;
  confidence: number;
  timestamp: Date;
  hash: string;
  metadata: Record<string, any>;
}

export interface RiskFactor {
  category: string;
  description: string;
  weight: number;
  evidence: string[];
}

export interface TransactionData {
  id: string;
  amount: number;
  propertyId: string;
  userId: string;
  paymentMethod: string;
  timestamp: string;
  participants?: ParticipantInfo[];
  documents?: any[];
  metadata?: Record<string, any>;
}

export interface FraudDashboardData {
  totalAlerts: number;
  criticalAlerts: number;
  transactionsAnalyzed: number;
  lossesPrevented: number;
  alertsChange: number;
  analysisRate: number;
  detectionRate: number;
  falsePositiveRate: number;
  avgResponseTime: number;
  categoryBreakdown: Record<string, number>;
  recentActivity: any[];
}

export interface SystemStatus {
  status: 'operational' | 'degraded' | 'down';
  uptime: number;
  lastProcessed: Date;
  mlModelsStatus: Record<string, string>;
  dataIntegrationStatus: string;
  processingQueue: number;
}

export interface NetworkAnalysis {
  networkId: string;
  participants: ParticipantInfo[];
  connections: NetworkConnection[];
  riskScore: number;
  suspiciousPatterns: string[];
  timeframe: {
    start: Date;
    end: Date;
  };
}

export interface NetworkConnection {
  from: string;
  to: string;
  type: string;
  strength: number;
  frequency: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface MLAnalytics {
  modelPerformance: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
  featureImportance: Array<{
    feature: string;
    importance: number;
  }>;
  predictionDistribution: Record<string, number>;
  modelVersions: Record<string, string>;
  trainingMetrics: {
    lastTraining: Date;
    datasetSize: number;
    trainingAccuracy: number;
  };
}

export function useFraudDetection() {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Process transaction for fraud analysis
  const processTransactionMutation = useMutation({
    mutationFn: async (transactionData: TransactionData): Promise<FraudAlert[]> => {
      const response = await apiClient.post<FraudAlert[]>('/api/fraud-detection/analyze', transactionData);
      return response.data;
    },
    onSuccess: (alerts) => {
      queryClient.invalidateQueries({ queryKey: ['fraud-detection', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['fraud-detection', 'alerts'] });
      
      // Cache individual alerts
      alerts.forEach(alert => {
        queryClient.setQueryData(['fraud-detection', 'alert', alert.id], alert);
      });
    },
  });

  // Update alert status
  const updateAlertMutation = useMutation({
    mutationFn: async ({ alertId, updates }: { alertId: string; updates: Partial<FraudAlert> }): Promise<FraudAlert> => {
      const response = await apiClient.patch<FraudAlert>(`/api/fraud-detection/alerts/${alertId}`, updates);
      return response.data;
    },
    onSuccess: (alert) => {
      queryClient.setQueryData(['fraud-detection', 'alert', alert.id], alert);
      queryClient.invalidateQueries({ queryKey: ['fraud-detection', 'alerts'] });
      queryClient.invalidateQueries({ queryKey: ['fraud-detection', 'dashboard'] });
    },
  });

  // Create fraud report
  const createReportMutation = useMutation({
    mutationFn: async (reportData: {
      alertIds: string[];
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high' | 'urgent';
    }) => {
      const response = await apiClient.post<any>('/api/fraud-detection/reports', reportData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fraud-detection', 'reports'] });
    },
  });

  // Get fraud dashboard data
  const useFraudDashboard = (userId?: string, options?: { timeRange?: string }) => {
    return useQuery({
      queryKey: ['fraud-detection', 'dashboard', userId, options?.timeRange],
      queryFn: async (): Promise<FraudDashboardData> => {
        const params = new URLSearchParams();
        if (userId) params.append('userId', userId);
        if (options?.timeRange) params.append('timeRange', options.timeRange);
        
        const response = await apiClient.get<FraudDashboardData>(`/api/fraud-detection/dashboard?${params}`);
        return response.data;
      },
      refetchInterval: 30000, // Refresh every 30 seconds
    });
  };

  // Get fraud alerts
  const useFraudAlerts = (filters?: {
    severity?: string;
    category?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) => {
    return useQuery({
      queryKey: ['fraud-detection', 'alerts', filters],
      queryFn: async (): Promise<FraudAlert[]> => {
        const params = new URLSearchParams();
        if (filters?.severity) params.append('severity', filters.severity);
        if (filters?.category) params.append('category', filters.category);
        if (filters?.status) params.append('status', filters.status);
        if (filters?.search) params.append('search', filters.search);
        if (filters?.limit) params.append('limit', filters.limit.toString());
        if (filters?.offset) params.append('offset', filters.offset.toString());
        
        const response = await apiClient.get<FraudAlert[]>(`/api/fraud-detection/alerts?${params}`);
        return response.data;
      },
      refetchInterval: 15000, // Refresh every 15 seconds for alerts
    });
  };

  // Get specific fraud alert
  const useFraudAlert = (alertId: string) => {
    return useQuery({
      queryKey: ['fraud-detection', 'alert', alertId],
      queryFn: async (): Promise<FraudAlert> => {
        const response = await apiClient.get<FraudAlert>(`/api/fraud-detection/alerts/${alertId}`);
        return response.data;
      },
      enabled: !!alertId,
    });
  };

  // Get system status
  const useSystemStatus = () => {
    return useQuery({
      queryKey: ['fraud-detection', 'system-status'],
      queryFn: async (): Promise<SystemStatus> => {
        const response = await apiClient.get<SystemStatus>('/api/fraud-detection/system/status');
        return response.data;
      },
      refetchInterval: 60000, // Refresh every minute
    });
  };

  // Get network analysis
  const useNetworkAnalysis = (options?: {
    userId?: string;
    propertyId?: string;
    timeRange?: string;
  }) => {
    return useQuery({
      queryKey: ['fraud-detection', 'network-analysis', options],
      queryFn: async (): Promise<NetworkAnalysis[]> => {
        const params = new URLSearchParams();
        if (options?.userId) params.append('userId', options.userId);
        if (options?.propertyId) params.append('propertyId', options.propertyId);
        if (options?.timeRange) params.append('timeRange', options.timeRange);
        
        const response = await apiClient.get<NetworkAnalysis[]>(`/api/fraud-detection/network-analysis?${params}`);
        return response.data;
      },
    });
  };

  // Get ML analytics
  const useMLAnalytics = (options?: { timeRange?: string }) => {
    return useQuery({
      queryKey: ['fraud-detection', 'ml-analytics', options?.timeRange],
      queryFn: async (): Promise<MLAnalytics> => {
        const params = new URLSearchParams();
        if (options?.timeRange) params.append('timeRange', options.timeRange);
        
        const response = await apiClient.get<MLAnalytics>(`/api/fraud-detection/ml-analytics?${params}`);
        return response.data;
      },
    });
  };

  // Get fraud reports
  const useFraudReports = (filters?: {
    status?: string;
    priority?: string;
    limit?: number;
  }) => {
    return useQuery({
      queryKey: ['fraud-detection', 'reports', filters],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.priority) params.append('priority', filters.priority);
        if (filters?.limit) params.append('limit', filters.limit.toString());
        
        const response = await apiClient.get<any[]>(`/api/fraud-detection/reports?${params}`);
        return response.data;
      },
    });
  };

  // Wrapper functions for mutations
  const processTransaction = useCallback(async (transactionData: TransactionData): Promise<FraudAlert[]> => {
    setIsLoading(true);
    setError(null);
    try {
      return await processTransactionMutation.mutateAsync(transactionData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to process transaction');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [processTransactionMutation]);

  const updateAlert = useCallback(async (alertId: string, updates: Partial<FraudAlert>): Promise<FraudAlert> => {
    setIsLoading(true);
    setError(null);
    try {
      return await updateAlertMutation.mutateAsync({ alertId, updates });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update alert');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [updateAlertMutation]);

  const createReport = useCallback(async (reportData: {
    alertIds: string[];
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      return await createReportMutation.mutateAsync(reportData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create report');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [createReportMutation]);

  // Bulk operations
  const dismissAlerts = useCallback(async (alertIds: string[]) => {
    const promises = alertIds.map(id => updateAlert(id, { status: 'dismissed' }));
    return Promise.all(promises);
  }, [updateAlert]);

  const escalateAlerts = useCallback(async (alertIds: string[]) => {
    const promises = alertIds.map(id => updateAlert(id, { 
      status: 'investigating',
      investigationPriority: 100 
    }));
    return Promise.all(promises);
  }, [updateAlert]);

  const assignAlerts = useCallback(async (alertIds: string[], assignee: string) => {
    const promises = alertIds.map(id => updateAlert(id, { 
      status: 'investigating',
      assignedTo: assignee 
    }));
    return Promise.all(promises);
  }, [updateAlert]);

  return {
    // Mutation functions
    processTransaction,
    updateAlert,
    createReport,
    dismissAlerts,
    escalateAlerts,
    assignAlerts,

    // Query hooks
    useFraudDashboard,
    useFraudAlerts,
    useFraudAlert,
    useSystemStatus,
    useNetworkAnalysis,
    useMLAnalytics,
    useFraudReports,

    // State
    isLoading: isLoading || 
               processTransactionMutation.isPending || 
               updateAlertMutation.isPending || 
               createReportMutation.isPending,
    error,

    // Mutation states
    isProcessing: processTransactionMutation.isPending,
    isUpdating: updateAlertMutation.isPending,
    isCreatingReport: createReportMutation.isPending,
  };
}

export default useFraudDetection;