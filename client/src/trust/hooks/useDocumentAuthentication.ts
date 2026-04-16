import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback } from 'react'

import { apiClient } from "../../local/services/unified-api-client"

export interface DocumentVerificationRequest {
  id: string;
  file: File;
  filename: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  userId?: string;
  propertyId?: string;
}

export interface DocumentVerificationResult {
  id: string;
  documentId: string;
  overallScore: number;
  status: 'authentic' | 'suspicious' | 'forged';
  confidence: number;
  checks: VerificationCheck[];
  metadata: DocumentMetadata;
  processedAt: Date;
  processingTime: number;
  riskFactors: RiskFactor[];
  recommendations: string[];
  landSpecificData?: LandDocumentData;
}

export interface VerificationCheck {
  type: 'metadata' | 'visual' | 'signature' | 'content' | 'format';
  name: string;
  status: 'pass' | 'fail' | 'warning';
  score: number;
  description: string;
  details: string[];
  confidence: number;
  processingTime: number;
}

export interface DocumentMetadata {
  creationDate?: Date;
  modificationDate?: Date;
  author?: string;
  software?: string;
  version?: string;
  pageCount?: number;
  fileSize: number;
  hash: string;
  digitalSignature?: boolean;
  compressionRatio?: number;
  colorProfile?: string;
  resolution?: { width: number; height: number; dpi: number };
  fonts?: string[];
  embeddedObjects?: number;
}

export interface RiskFactor {
  category: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  evidence: string[];
}

export interface LandDocumentData {
  documentType: 'title_deed' | 'sale_agreement' | 'survey_plan' | 'compliance_certificate';
  propertyDetails: {
    plotNumber?: string;
    location?: string;
    size?: string;
    coordinates?: string;
  };
  ownershipDetails: {
    currentOwner?: string;
    previousOwners?: string[];
    ownershipType?: string;
  };
  legalStatus: {
    registrationNumber?: string;
    registrationDate?: Date;
    expiryDate?: Date;
    restrictions?: string[];
  };
  verificationMarkers: {
    officialSeals: boolean;
    watermarks: boolean;
    securityFeatures: boolean;
    signatures: boolean;
  };
}

export interface SystemStats {
  totalProcessed: number;
  currentlyProcessing: number;
  statusDistribution: {
    authentic: number;
    suspicious: number;
    forged: number;
  };
  averageProcessingTime: number;
  averageScore: number;
  uptime: number;
  lastProcessed: Date | null;
}

export function useDocumentAuthentication() {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Upload and verify document
  const verifyDocumentMutation = useMutation({
    mutationFn: async (file: File): Promise<DocumentVerificationResult> => {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('filename', file.name);
      formData.append('mimeType', file.type);
      formData.append('size', file.size.toString());
      formData.append('uploadedAt', new Date().toISOString());

      const response = await apiClient.post('/api/document-auth/verify', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: (result) => {
      queryClient.setQueryData(['document-auth', 'result', result.documentId], result);
      queryClient.invalidateQueries({ queryKey: ['document-auth', 'stats'] });
    },
  });

  // Get verification result
  const useVerificationResult = (documentId: string) => {
    return useQuery({
      queryKey: ['document-auth', 'result', documentId],
      queryFn: async (): Promise<DocumentVerificationResult> => {
        const response = await apiClient.get(`/api/document-auth/results/${documentId}`);
        return response.data;
      },
      enabled: !!documentId,
    });
  };

  // Get processing status
  const useProcessingStatus = (documentId: string) => {
    return useQuery({
      queryKey: ['document-auth', 'status', documentId],
      queryFn: async (): Promise<'processing' | 'completed' | 'not_found'> => {
        const response = await apiClient.get(`/api/document-auth/status/${documentId}`);
        return response.data.status;
      },
      enabled: !!documentId,
      refetchInterval: (data) => data === 'processing' ? 2000 : false, // Poll every 2 seconds while processing
    });
  };

  // Get system statistics
  const useSystemStats = () => {
    return useQuery({
      queryKey: ['document-auth', 'stats'],
      queryFn: async (): Promise<SystemStats> => {
        const response = await apiClient.get('/api/document-auth/stats');
        return response.data;
      },
      refetchInterval: 30000, // Refresh every 30 seconds
    });
  };

  // Get user's document history
  const useDocumentHistory = (userId: string, options?: { limit?: number; offset?: number }) => {
    return useQuery({
      queryKey: ['document-auth', 'history', userId, options],
      queryFn: async (): Promise<DocumentVerificationResult[]> => {
        const params = new URLSearchParams();
        if (options?.limit) params.append('limit', options.limit.toString());
        if (options?.offset) params.append('offset', options.offset.toString());
        
        const response = await apiClient.get(`/api/document-auth/history/${userId}?${params}`);
        return response.data;
      },
      enabled: !!userId,
    });
  };

  // Get recent verifications
  const useRecentVerifications = (limit: number = 10) => {
    return useQuery({
      queryKey: ['document-auth', 'recent', limit],
      queryFn: async (): Promise<DocumentVerificationResult[]> => {
        const response = await apiClient.get(`/api/document-auth/recent?limit=${limit}`);
        return response.data;
      },
    });
  };

  // Clear old results
  const clearOldResultsMutation = useMutation({
    mutationFn: async (olderThan?: Date): Promise<number> => {
      const params = olderThan ? `?olderThan=${olderThan.toISOString()}` : '';
      const response = await apiClient.delete(`/api/document-auth/results${params}`);
      return response.data.cleared;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-auth'] });
    },
  });

  // Wrapper functions for mutations
  const verifyDocument = useCallback(async (file: File): Promise<DocumentVerificationResult> => {
    setIsLoading(true);
    setError(null);
    try {
      return await verifyDocumentMutation.mutateAsync(file);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to verify document');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [verifyDocumentMutation]);

  const clearOldResults = useCallback(async (olderThan?: Date): Promise<number> => {
    setIsLoading(true);
    setError(null);
    try {
      return await clearOldResultsMutation.mutateAsync(olderThan);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to clear old results');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [clearOldResultsMutation]);

  // Utility functions
  const getDocumentTypeIcon = (documentType?: string) => {
    switch (documentType) {
      case 'title_deed':
        return '📜';
      case 'sale_agreement':
        return '📋';
      case 'survey_plan':
        return '🗺️';
      case 'compliance_certificate':
        return '✅';
      default:
        return '📄';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'authentic':
        return 'text-green-600';
      case 'suspicious':
        return 'text-yellow-600';
      case 'forged':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'authentic':
        return 'default';
      case 'suspicious':
        return 'secondary';
      case 'forged':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'text-blue-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-orange-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))  } ${  sizes[i]}`;
  };

  const formatProcessingTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return {
    // Mutation functions
    verifyDocument,
    clearOldResults,

    // Query hooks
    useVerificationResult,
    useProcessingStatus,
    useSystemStats,
    useDocumentHistory,
    useRecentVerifications,

    // State
    isLoading: isLoading || verifyDocumentMutation.isPending || clearOldResultsMutation.isPending,
    error,

    // Mutation states
    isVerifying: verifyDocumentMutation.isPending,
    isClearing: clearOldResultsMutation.isPending,

    // Utility functions
    getDocumentTypeIcon,
    getStatusColor,
    getStatusBadgeVariant,
    getSeverityColor,
    formatFileSize,
    formatProcessingTime,
  };
}

export default useDocumentAuthentication;