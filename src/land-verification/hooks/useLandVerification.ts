import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';

import { apiClient } from "../../shared/services/unified-api-client"

export interface VerificationRequest {
  propertyId: string;
  userId: string;
  requestedLayers?: ('registry' | 'physical' | 'community' | 'government' | 'legal' | 'expert')[];
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface VerificationSession {
  id: string;
  propertyId: string;
  userId: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'suspended' | 'failed';
  currentLayer?: string;
  overallRiskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  estimatedCompletionDate?: Date;
  actualCompletionDate?: Date;
  monitoringEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  completedLayers: any[];
  expertAssignments: any[];
}

export interface LayerResult {
  id: string;
  layerId: string;
  type: string;
  status: 'pass' | 'fail' | 'warning';
  score: number;
  description: string;
  details: string[];
  confidence: number;
  processingTime: number;
  evidence: string[];
}

export interface RiskAssessment {
  id: string;
  sessionId: string;
  overallRiskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  riskFactors: RiskFactor[];
  recommendations: Recommendation[];
  assessmentDate: Date;
  validUntil: Date;
}

export interface RiskFactor {
  id: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
  evidence: string[];
  impact: number;
  likelihood: number;
  mitigation?: string;
}

export interface Recommendation {
  id: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  title: string;
  description: string;
  actionItems: string[];
  estimatedCost?: number;
  estimatedTime?: number;
}

export interface VerificationStatus {
  sessionId: string;
  status: VerificationSession['status'];
  progress: {
    totalLayers: number;
    completedLayers: number;
    currentLayer?: string;
    estimatedTimeRemaining?: number;
  };
  riskAssessment?: {
    overallScore: number;
    riskLevel: string;
    confidence: number;
    majorRisks: string[];
  };
  lastUpdated: Date;
}

export interface ExpertAssignment {
  id: string;
  sessionId: string;
  layerId?: string;
  expertType: 'surveyor' | 'lawyer' | 'appraiser';
  expertName: string;
  expertCredentials?: string;
  contactInfo?: string;
  specialization?: string;
  assignedAt: Date;
  expectedCompletionDate?: Date;
  actualCompletionDate?: Date;
  status: 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  reportUrl?: string;
  cost?: number;
  notes?: string;
}

export function useLandVerification() {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initiate verification session
  const initiateVerificationMutation = useMutation({
    mutationFn: async (request: VerificationRequest): Promise<VerificationSession> => {
      const response = await apiClient.post('/api/land-verification/sessions', request);
      return response.data;
    },
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['land-verification', 'sessions'] });
      queryClient.setQueryData(['land-verification', 'session', session.id], session);
    },
  });

  // Execute verification layer
  const executeLayerMutation = useMutation({
    mutationFn: async ({ sessionId, layerType }: { sessionId: string; layerType: string }): Promise<LayerResult[]> => {
      const response = await apiClient.post(`/api/land-verification/sessions/${sessionId}/layers/${layerType}/execute`);
      return response.data;
    },
    onSuccess: (results, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ['land-verification', 'session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['land-verification', 'status', sessionId] });
    },
  });

  // Generate risk assessment
  const generateRiskAssessmentMutation = useMutation({
    mutationFn: async (sessionId: string): Promise<RiskAssessment> => {
      const response = await apiClient.post(`/api/land-verification/sessions/${sessionId}/risk-assessment`);
      return response.data;
    },
    onSuccess: (assessment) => {
      queryClient.setQueryData(['land-verification', 'risk-assessment', assessment.sessionId], assessment);
      queryClient.invalidateQueries({ queryKey: ['land-verification', 'session', assessment.sessionId] });
    },
  });

  // Assign expert
  const assignExpertMutation = useMutation({
    mutationFn: async ({ sessionId, expertType, layerId }: { 
      sessionId: string; 
      expertType: 'surveyor' | 'lawyer' | 'appraiser';
      layerId?: string;
    }): Promise<ExpertAssignment> => {
      const response = await apiClient.post(`/api/land-verification/sessions/${sessionId}/experts`, {
        expertType,
        layerId
      });
      return response.data;
    },
    onSuccess: (assignment) => {
      queryClient.invalidateQueries({ queryKey: ['land-verification', 'session', assignment.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['land-verification', 'experts', assignment.sessionId] });
    },
  });

  // Schedule monitoring
  const scheduleMonitoringMutation = useMutation({
    mutationFn: async ({ propertyId, config }: { 
      propertyId: string; 
      config: {
        enabled: boolean;
        frequency: 'daily' | 'weekly' | 'monthly';
        monitoringTypes: string[];
        alertThresholds: Record<string, number>;
        notificationPreferences: {
          email: boolean;
          sms: boolean;
          inApp: boolean;
        };
      };
    }) => {
      const response = await apiClient.post(`/api/land-verification/properties/${propertyId}/monitoring`, config);
      return response.data;
    },
  });

  // Get verification session
  const useVerificationSession = (sessionId: string) => {
    return useQuery({
      queryKey: ['land-verification', 'session', sessionId],
      queryFn: async (): Promise<VerificationSession> => {
        const response = await apiClient.get(`/api/land-verification/sessions/${sessionId}`);
        return response.data;
      },
      enabled: !!sessionId,
    });
  };

  // Get verification status
  const useVerificationStatus = (sessionId: string, options?: { refetchInterval?: number }) => {
    return useQuery({
      queryKey: ['land-verification', 'status', sessionId],
      queryFn: async (): Promise<VerificationStatus> => {
        const response = await apiClient.get(`/api/land-verification/sessions/${sessionId}/status`);
        return response.data;
      },
      enabled: !!sessionId,
      refetchInterval: options?.refetchInterval || 5000, // Poll every 5 seconds
    });
  };

  // Get risk assessment
  const useRiskAssessment = (sessionId: string) => {
    return useQuery({
      queryKey: ['land-verification', 'risk-assessment', sessionId],
      queryFn: async (): Promise<RiskAssessment> => {
        const response = await apiClient.get(`/api/land-verification/sessions/${sessionId}/risk-assessment`);
        return response.data;
      },
      enabled: !!sessionId,
    });
  };

  // Get expert assignments
  const useExpertAssignments = (sessionId: string) => {
    return useQuery({
      queryKey: ['land-verification', 'experts', sessionId],
      queryFn: async (): Promise<ExpertAssignment[]> => {
        const response = await apiClient.get(`/api/land-verification/sessions/${sessionId}/experts`);
        return response.data;
      },
      enabled: !!sessionId,
    });
  };

  // Get user's verification sessions
  const useUserVerificationSessions = (userId: string) => {
    return useQuery({
      queryKey: ['land-verification', 'sessions', 'user', userId],
      queryFn: async (): Promise<VerificationSession[]> => {
        const response = await apiClient.get(`/api/land-verification/sessions?userId=${userId}`);
        return response.data;
      },
      enabled: !!userId,
    });
  };

  // Get property verification history
  const usePropertyVerificationHistory = (propertyId: string) => {
    return useQuery({
      queryKey: ['land-verification', 'sessions', 'property', propertyId],
      queryFn: async (): Promise<VerificationSession[]> => {
        const response = await apiClient.get(`/api/land-verification/sessions?propertyId=${propertyId}`);
        return response.data;
      },
      enabled: !!propertyId,
    });
  };

  // Wrapper functions for mutations
  const initiateVerification = useCallback(async (request: VerificationRequest): Promise<VerificationSession> => {
    setIsLoading(true);
    setError(null);
    try {
      return await initiateVerificationMutation.mutateAsync(request);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to initiate verification');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [initiateVerificationMutation]);

  const executeLayer = useCallback(async (sessionId: string, layerType: string): Promise<LayerResult[]> => {
    setIsLoading(true);
    setError(null);
    try {
      return await executeLayerMutation.mutateAsync({ sessionId, layerType });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to execute layer');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [executeLayerMutation]);

  const generateRiskAssessment = useCallback(async (sessionId: string): Promise<RiskAssessment> => {
    setIsLoading(true);
    setError(null);
    try {
      return await generateRiskAssessmentMutation.mutateAsync(sessionId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to generate risk assessment');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [generateRiskAssessmentMutation]);

  const assignExpert = useCallback(async (
    sessionId: string, 
    expertType: 'surveyor' | 'lawyer' | 'appraiser',
    layerId?: string
  ): Promise<ExpertAssignment> => {
    setIsLoading(true);
    setError(null);
    try {
      return await assignExpertMutation.mutateAsync({ sessionId, expertType, layerId });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to assign expert');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [assignExpertMutation]);

  const scheduleMonitoring = useCallback(async (propertyId: string, config: any) => {
    setIsLoading(true);
    setError(null);
    try {
      return await scheduleMonitoringMutation.mutateAsync({ propertyId, config });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to schedule monitoring');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [scheduleMonitoringMutation]);

  return {
    // Mutation functions
    initiateVerification,
    executeLayer,
    generateRiskAssessment,
    assignExpert,
    scheduleMonitoring,

    // Query hooks
    useVerificationSession,
    useVerificationStatus,
    useRiskAssessment,
    useExpertAssignments,
    useUserVerificationSessions,
    usePropertyVerificationHistory,

    // State
    isLoading: isLoading || 
               initiateVerificationMutation.isPending || 
               executeLayerMutation.isPending || 
               generateRiskAssessmentMutation.isPending ||
               assignExpertMutation.isPending ||
               scheduleMonitoringMutation.isPending,
    error,

    // Mutation states
    isInitiating: initiateVerificationMutation.isPending,
    isExecutingLayer: executeLayerMutation.isPending,
    isGeneratingAssessment: generateRiskAssessmentMutation.isPending,
    isAssigningExpert: assignExpertMutation.isPending,
    isSchedulingMonitoring: scheduleMonitoringMutation.isPending,
  };
}

export default useLandVerification;