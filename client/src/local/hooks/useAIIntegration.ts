/**
 * AI Integration React Hooks
 * 
 * React hooks that provide easy access to AI integration services
 * for use in components throughout the application.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { aiIntegrationOrchestrator, PropertyListingEnhancement, SearchResultsEnhancement } from '../services/ai-integration/ai-integration-orchestrator'
import { propertyAnalysisIntegration, PropertyValuationResult, PropertyRiskAssessment } from '../services/ai-integration/property-analysis-integration'
import { documentProcessingIntegration, DocumentProcessingResult } from '../services/ai-integration/document-processing-integration'
import { fraudDetectionIntegration, PropertyFraudAnalysis, UserFraudAnalysis } from '../services/ai-integration/fraud-detection-integration'
import { recommendationIntegration, PropertyRecommendation, SmartMatchResult } from '../services/ai-integration/recommendation-integration'

// Fixed imports with proper type definitions
import { Property } from '../types/property'
import { User } from '../types/contracts/user-contracts'

// Create the missing PropertySearchFilters interface
export interface PropertySearchFilters {
  location?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  propertyType?: string[];
  bedrooms?: number;
  bathrooms?: number;
  size?: {
    min: number;
    max: number;
  };
  amenities?: string[];
  keywords?: string;
  sortBy?: 'price' | 'date' | 'relevance' | 'size';
  sortOrder?: 'asc' | 'desc';
}

// Create a simple logging service interface if the import fails
interface LoggingService {
  info(message: string, metadata?: Record<string, any>): void;
  error(message: string, metadata?: Record<string, any>): void;
  warn(message: string, metadata?: Record<string, any>): void;
  debug(message: string, metadata?: Record<string, any>): void;
}

// Fallback logging service implementation
const createLoggingService = (): LoggingService => ({
  info: (message: string, metadata?: Record<string, any>) => {
    console.log(`[INFO] ${message}`, metadata || '');
  },
  error: (message: string, metadata?: Record<string, any>) => {
    console.error(`[ERROR] ${message}`, metadata || '');
  },
  warn: (message: string, metadata?: Record<string, any>) => {
    console.warn(`[WARN] ${message}`, metadata || '');
  },
  debug: (message: string, metadata?: Record<string, any>) => {
    console.debug(`[DEBUG] ${message}`, metadata || '');
  }
});

// Try to import the logging service, fallback to our implementation
let loggingService: LoggingService;
try {
  // Attempt the original import
  const { loggingService: importedLogger } = require('../../../core/src/logging');
  loggingService = importedLogger;
} catch (error) {
  // Use fallback if import fails
  loggingService = createLoggingService();
}

// Hook options interfaces
export interface UsePropertyAIOptions {
  enableValuation?: boolean;
  enableRiskAssessment?: boolean;
  enableFraudDetection?: boolean;
  enableInsights?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseSearchAIOptions {
  enablePersonalization?: boolean;
  enableMarketInsights?: boolean;
  enableOptimizations?: boolean;
  maxRecommendations?: number;
}

export interface UseDocumentAIOptions {
  enableAuthenticity?: boolean;
  enableCompleteness?: boolean;
  enableConsistency?: boolean;
  sessionId?: string;
}

// Query keys for React Query - Fixed to handle string conversion properly
export const aiQueryKeys = {
  propertyEnhancement: (propertyId: string | number) => ['ai', 'property', 'enhancement', String(propertyId)],
  propertyValuation: (propertyId: string | number) => ['ai', 'property', 'valuation', String(propertyId)],
  propertyRisk: (propertyId: string | number) => ['ai', 'property', 'risk', String(propertyId)],
  propertyFraud: (propertyId: string | number) => ['ai', 'property', 'fraud', String(propertyId)],
  searchEnhancement: (filters: PropertySearchFilters, userId?: string) => 
    ['ai', 'search', 'enhancement', JSON.stringify(filters), userId || ''],
  userRecommendations: (userId: string) => ['ai', 'user', 'recommendations', userId],
  documentProcessing: (documentId: string) => ['ai', 'document', 'processing', documentId],
  userFraud: (userId: string) => ['ai', 'user', 'fraud', userId],
  aiMetrics: () => ['ai', 'metrics'],
  aiHealth: () => ['ai', 'health']
};

/**
 * Hook for AI-enhanced property analysis
 * 
 * This hook provides comprehensive AI analysis for individual properties,
 * including valuation, risk assessment, and fraud detection capabilities.
 */
export function usePropertyAI(property: Property, options: UsePropertyAIOptions = {}) {
  const {
    enableValuation = true,
    enableRiskAssessment = true,
    enableFraudDetection = true,
    enableInsights = true,
    autoRefresh = false,
    refreshInterval = 300000 // 5 minutes
  } = options;

  // Convert property.id to string to ensure consistency
  const propertyId = String(property.id);

  // Property enhancement query - coordinates multiple AI analyses
  const enhancementQuery = useQuery({
    queryKey: aiQueryKeys.propertyEnhancement(propertyId),
    queryFn: () => aiIntegrationOrchestrator.enhancePropertyListing(property),
    enabled: !!(property.id && (enableValuation || enableRiskAssessment || enableFraudDetection || enableInsights)),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 300000, // 5 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // Individual analysis queries for more granular control
  const valuationQuery = useQuery({
    queryKey: aiQueryKeys.propertyValuation(propertyId),
    queryFn: () => propertyAnalysisIntegration.analyzePropertyValue(property),
    enabled: enableValuation && !!property.id,
    staleTime: 600000 // 10 minutes - valuations change less frequently
  });

  const riskQuery = useQuery({
    queryKey: aiQueryKeys.propertyRisk(propertyId),
    queryFn: () => propertyAnalysisIntegration.assessPropertyRisk(property),
    enabled: enableRiskAssessment && !!property.id,
    staleTime: 600000 // 10 minutes
  });

  const fraudQuery = useQuery({
    queryKey: aiQueryKeys.propertyFraud(propertyId),
    queryFn: () => fraudDetectionIntegration.analyzePropertyFraud(property),
    enabled: enableFraudDetection && !!property.id,
    staleTime: 300000 // 5 minutes - fraud patterns can change more quickly
  });

  // Computed loading and error states
  const isLoading = enhancementQuery.isLoading || valuationQuery.isLoading || riskQuery.isLoading || fraudQuery.isLoading;
  const hasError = enhancementQuery.error || valuationQuery.error || riskQuery.error || fraudQuery.error;

  // Memoized combined AI data to prevent unnecessary re-renders
  const aiData = useMemo(() => ({
    enhancement: enhancementQuery.data,
    valuation: valuationQuery.data,
    riskAssessment: riskQuery.data,
    fraudAnalysis: fraudQuery.data,
    trustScoreAdjustment: enhancementQuery.data?.trustScoreAdjustment
  }), [enhancementQuery.data, valuationQuery.data, riskQuery.data, fraudQuery.data]);

  // Refresh function to manually trigger all enabled queries
  const refresh = useCallback(() => {
    enhancementQuery.refetch();
    if (enableValuation) valuationQuery.refetch();
    if (enableRiskAssessment) riskQuery.refetch();
    if (enableFraudDetection) fraudQuery.refetch();
  }, [enhancementQuery, valuationQuery, riskQuery, fraudQuery, enableValuation, enableRiskAssessment, enableFraudDetection]);

  return {
    data: aiData,
    isLoading,
    error: hasError,
    refresh,
    queries: {
      enhancement: enhancementQuery,
      valuation: valuationQuery,
      risk: riskQuery,
      fraud: fraudQuery
    }
  };
}

/**
 * Hook for AI-enhanced search results
 * 
 * Provides intelligent search result enhancement including personalization,
 * market insights, and optimization suggestions.
 */
export function useSearchAI(
  properties: Property[],
  searchFilters: PropertySearchFilters,
  user?: User,
  options: UseSearchAIOptions = {}
) {
  const {
    enablePersonalization = true,
    enableMarketInsights = true,
    enableOptimizations = true,
    maxRecommendations = 10
  } = options;

  // Enhanced search results query
  const searchEnhancementQuery = useQuery({
    queryKey: aiQueryKeys.searchEnhancement(searchFilters, user?.id),
    queryFn: () => aiIntegrationOrchestrator.enhanceSearchResults(properties, searchFilters, user),
    enabled: properties.length > 0,
    staleTime: 180000, // 3 minutes - search results can change frequently
    retry: 1
  });

  // Personalized recommendations query
  const userRecommendationsQuery = useQuery({
    queryKey: aiQueryKeys.userRecommendations(user?.id || ''),
    queryFn: () => recommendationIntegration.generatePersonalizedRecommendations(
      user!,
      properties,
      undefined,
      maxRecommendations
    ),
    enabled: enablePersonalization && !!user?.id && properties.length > 0,
    staleTime: 300000 // 5 minutes
  });

  // Combined enhanced data with fallbacks
  const enhancedData = useMemo(() => ({
    enhancedResults: searchEnhancementQuery.data?.enhancedResults || [],
    personalizedRecommendations: userRecommendationsQuery.data?.recommendations || 
                                searchEnhancementQuery.data?.personalizedRecommendations || [],
    marketInsights: searchEnhancementQuery.data?.marketInsights,
    searchOptimizations: searchEnhancementQuery.data?.searchOptimizations,
    matchingStrategy: userRecommendationsQuery.data?.matchingStrategy
  }), [searchEnhancementQuery.data, userRecommendationsQuery.data]);

  return {
    data: enhancedData,
    isLoading: searchEnhancementQuery.isLoading || userRecommendationsQuery.isLoading,
    error: searchEnhancementQuery.error || userRecommendationsQuery.error,
    refresh: () => {
      searchEnhancementQuery.refetch();
      if (user) userRecommendationsQuery.refetch();
    },
    queries: {
      searchEnhancement: searchEnhancementQuery,
      userRecommendations: userRecommendationsQuery
    }
  };
}

/**
 * Hook for AI document processing
 * 
 * Handles document analysis including authenticity verification,
 * completeness checking, and consistency analysis.
 */
export function useDocumentAI(options: UseDocumentAIOptions = {}) {
  const {
    enableAuthenticity = true,
    enableCompleteness = true,
    enableConsistency = true,
    sessionId
  } = options;

  const queryClient = useQueryClient();

  // Document processing mutation
  const processDocumentMutation = useMutation({
    mutationFn: async ({ 
      documentBuffer, 
      documentType, 
      sessionId: docSessionId 
    }: { 
      documentBuffer: Buffer; 
      documentType: string; 
      sessionId?: string; 
    }) => {
      return documentProcessingIntegration.processDocument(documentBuffer, documentType, docSessionId);
    },
    onSuccess: (data, variables) => {
      // Cache the result for future reference
      queryClient.setQueryData(
        aiQueryKeys.documentProcessing(data.documentId),
        data
      );

      loggingService.info('Document processing completed', {
        module: 'useDocumentAI',
        documentId: data.documentId,
        processingStatus: data.processingStatus
      });
    },
    onError: (error) => {
      loggingService.error('Document processing failed', {
        module: 'useDocumentAI',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Land verification workflow mutation
  const processLandVerificationMutation = useMutation({
    mutationFn: async ({
      documents,
      sessionId: workflowSessionId
    }: {
      documents: Array<{ buffer: Buffer; type: string; name: string }>;
      sessionId: string;
    }) => {
      return documentProcessingIntegration.processLandVerificationDocuments(documents, workflowSessionId);
    },
    onSuccess: (data) => {
      loggingService.info('Land verification workflow completed', {
        module: 'useDocumentAI',
        sessionId: data.sessionId,
        overallStatus: data.overallStatus
      });
    }
  });

  return {
    processDocument: processDocumentMutation.mutate,
    processDocumentAsync: processDocumentMutation.mutateAsync,
    processLandVerification: processLandVerificationMutation.mutate,
    processLandVerificationAsync: processLandVerificationMutation.mutateAsync,
    isProcessing: processDocumentMutation.isPending || processLandVerificationMutation.isPending,
    error: processDocumentMutation.error || processLandVerificationMutation.error,
    mutations: {
      processDocument: processDocumentMutation,
      processLandVerification: processLandVerificationMutation
    }
  };
}

/**
 * Hook for AI fraud detection
 * 
 * Provides comprehensive fraud analysis for users, properties,
 * and network-based fraud patterns.
 */
export function useFraudDetectionAI(user?: User) {
  const userFraudQuery = useQuery({
    queryKey: aiQueryKeys.userFraud(user?.id || ''),
    queryFn: () => fraudDetectionIntegration.analyzeUserFraud(user!),
    enabled: !!user?.id,
    staleTime: 600000, // 10 minutes
    retry: 1
  });

  const analyzePropertyFraudMutation = useMutation({
    mutationFn: (property: Property) => fraudDetectionIntegration.analyzePropertyFraud(property),
    onSuccess: (data) => {
      loggingService.info('Property fraud analysis completed', {
        module: 'useFraudDetectionAI',
        propertyId: data.propertyId,
        riskLevel: data.riskLevel
      });
    }
  });

  const analyzeNetworkFraudMutation = useMutation({
    mutationFn: ({
      users,
      properties,
      connections
    }: {
      users: User[];
      properties: Property[];
      connections: Array<{ from: string; to: string; type: string; weight: number }>;
    }) => fraudDetectionIntegration.analyzeNetworkFraud(
      // Fixed: Ensure all IDs are converted to strings for consistency
      [...users.map(u => ({ id: String(u.id), type: 'user' as const, data: u })),
       ...properties.map(p => ({ id: String(p.id), type: 'property' as const, data: p }))],
      connections
    )
  });

  return {
    userFraudData: userFraudQuery.data,
    isLoadingUserFraud: userFraudQuery.isLoading,
    userFraudError: userFraudQuery.error,
    analyzePropertyFraud: analyzePropertyFraudMutation.mutate,
    analyzePropertyFraudAsync: analyzePropertyFraudMutation.mutateAsync,
    analyzeNetworkFraud: analyzeNetworkFraudMutation.mutate,
    analyzeNetworkFraudAsync: analyzeNetworkFraudMutation.mutateAsync,
    isAnalyzing: analyzePropertyFraudMutation.isPending || analyzeNetworkFraudMutation.isPending,
    analysisError: analyzePropertyFraudMutation.error || analyzeNetworkFraudMutation.error,
    refreshUserFraud: userFraudQuery.refetch
  };
}

/**
 * Hook for AI system monitoring and metrics
 * 
 * Provides real-time monitoring of AI system health and performance metrics.
 */
export function useAIMetrics() {
  const metricsQuery = useQuery({
    queryKey: aiQueryKeys.aiMetrics(),
    queryFn: () => aiIntegrationOrchestrator.getMetrics(),
    refetchInterval: 30000, // 30 seconds - frequent updates for monitoring
    staleTime: 15000 // 15 seconds
  });

  const healthQuery = useQuery({
    queryKey: aiQueryKeys.aiHealth(),
    queryFn: () => aiIntegrationOrchestrator.getHealthStatus(),
    refetchInterval: 60000, // 1 minute
    staleTime: 30000 // 30 seconds
  });

  return {
    metrics: metricsQuery.data,
    health: healthQuery.data,
    isLoading: metricsQuery.isLoading || healthQuery.isLoading,
    error: metricsQuery.error || healthQuery.error,
    refresh: () => {
      metricsQuery.refetch();
      healthQuery.refetch();
    }
  };
}

/**
 * Hook for recommendation feedback processing
 * 
 * Handles user feedback on AI recommendations to improve future suggestions.
 */
export function useRecommendationFeedback() {
  const queryClient = useQueryClient();

  const submitFeedbackMutation = useMutation({
    mutationFn: async (feedback: {
      userId: string;
      propertyId: string;
      recommendationId: string;
      feedbackType: 'interested' | 'not_interested' | 'viewed' | 'inquired' | 'contacted';
      rating?: number;
      comments?: string;
    }) => {
      return recommendationIntegration.processFeedback({
        ...feedback,
        timestamp: new Date()
      });
    },
    onSuccess: (data, variables) => {
      // Invalidate user recommendations to trigger refresh with new learning
      queryClient.invalidateQueries({
        queryKey: aiQueryKeys.userRecommendations(variables.userId)
      });

      loggingService.info('Recommendation feedback processed', {
        module: 'useRecommendationFeedback',
        userId: variables.userId,
        feedbackType: variables.feedbackType,
        learningImpact: data.learningImpact
      });
    }
  });

  return {
    submitFeedback: submitFeedbackMutation.mutate,
    submitFeedbackAsync: submitFeedbackMutation.mutateAsync,
    isSubmitting: submitFeedbackMutation.isPending,
    error: submitFeedbackMutation.error,
    lastResult: submitFeedbackMutation.data
  };
}

/**
 * Custom hook for managing AI integration state
 * 
 * Provides centralized state management for AI feature toggles and preferences.
 */
export function useAIIntegrationState() {
  const [isEnabled, setIsEnabled] = useState(true);
  const [preferences, setPreferences] = useState({
    enablePropertyAnalysis: true,
    enableDocumentProcessing: true,
    enableFraudDetection: true,
    enableRecommendations: true,
    autoRefresh: false
  });

  const toggleAI = useCallback(() => {
    setIsEnabled(prev => !prev);
  }, []);

  const updatePreferences = useCallback((newPreferences: Partial<typeof preferences>) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }));
  }, []);

  return {
    isEnabled,
    preferences,
    toggleAI,
    updatePreferences,
    setIsEnabled,
    setPreferences
  };
}