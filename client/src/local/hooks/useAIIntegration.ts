/**
 * AI Integration React Hooks
 *
 * React hooks providing access to AI integration services throughout the application.
 */

import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import {
  aiIntegrationOrchestrator,
} from '../services/ai-integration/ai-integration-orchestrator'
import { propertyAnalysisIntegration } from '../services/ai-integration/property-analysis-integration'
import { documentProcessingIntegration } from '../services/ai-integration/document-processing-integration'
import { fraudDetectionIntegration } from '../services/ai-integration/fraud-detection-integration'
import { recommendationIntegration } from '../services/ai-integration/recommendation-integration'
import { Property } from '@shared/types/property'
import { User } from '../types/contracts/user-contracts'

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface PropertySearchFilters {
  location?: string;
  priceRange?: { min: number; max: number };
  propertyType?: string[];
  bedrooms?: number;
  bathrooms?: number;
  size?: { min: number; max: number };
  amenities?: string[];
  keywords?: string;
  sortBy?: 'price' | 'date' | 'relevance' | 'size';
  sortOrder?: 'asc' | 'desc';
}

interface Logger {
  info(message: string, metadata?: Record<string, unknown>): void;
  error(message: string, metadata?: Record<string, unknown>): void;
  warn(message: string, metadata?: Record<string, unknown>): void;
}

// Lightweight fallback logger — avoids runtime require() anti-pattern.
const logger: Logger = {
  info:  (msg, meta) => {
    // eslint-disable-next-line no-console
    console.log(`[INFO]  ${msg}`, meta ?? '');
  },
  // eslint-disable-next-line no-console
  error: (msg, meta) => console.error(`[ERROR] ${msg}`, meta ?? ''),
  // eslint-disable-next-line no-console
  warn:  (msg, meta) => console.warn(`[WARN]  ${msg}`, meta ?? ''),
};

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const aiQueryKeys = {
  propertyEnhancement: (id: string | number) => ['ai', 'property', 'enhancement', String(id)] as const,
  propertyValuation:   (id: string | number) => ['ai', 'property', 'valuation',   String(id)] as const,
  propertyRisk:        (id: string | number) => ['ai', 'property', 'risk',         String(id)] as const,
  propertyFraud:       (id: string | number) => ['ai', 'property', 'fraud',        String(id)] as const,
  searchEnhancement:   (filters: PropertySearchFilters, userId = '') =>
    ['ai', 'search', 'enhancement', JSON.stringify(filters), userId] as const,
  userRecommendations: (userId: string) => ['ai', 'user', 'recommendations', userId] as const,
  documentProcessing:  (documentId: string) => ['ai', 'document', 'processing', documentId] as const,
  userFraud:           (userId: string) => ['ai', 'user', 'fraud', userId] as const,
  aiMetrics:           () => ['ai', 'metrics'] as const,
  aiHealth:            () => ['ai', 'health'] as const,
};

// ---------------------------------------------------------------------------
// Hook option interfaces
// ---------------------------------------------------------------------------

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
  maxRecommendations?: number;
}

export interface UseDocumentAIOptions {
  enableAuthenticity?: boolean;
  enableCompleteness?: boolean;
  enableConsistency?: boolean;
  sessionId?: string;
}

// ---------------------------------------------------------------------------
// usePropertyAI
// ---------------------------------------------------------------------------

export function usePropertyAI(property: Property, options: UsePropertyAIOptions = {}) {
  const {
    enableValuation    = true,
    enableRiskAssessment = true,
    enableFraudDetection = true,
    enableInsights     = true,
    autoRefresh        = false,
    refreshInterval    = 300_000,
  } = options;

  const propertyId = String(property.id);
  const hasId      = !!property.id;

  const enhancementQuery = useQuery({
    queryKey:        aiQueryKeys.propertyEnhancement(propertyId),
    queryFn:         () => aiIntegrationOrchestrator.enhancePropertyListing(property),
    enabled:         hasId && (enableValuation || enableRiskAssessment || enableFraudDetection || enableInsights),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime:       300_000,
    retry:           2,
    retryDelay:      (attempt) => Math.min(1_000 * 2 ** attempt, 30_000),
  });

  const valuationQuery = useQuery({
    queryKey:  aiQueryKeys.propertyValuation(propertyId),
    queryFn:   () => propertyAnalysisIntegration.analyzePropertyValue(property),
    enabled:   enableValuation && hasId,
    staleTime: 600_000,
  });

  const riskQuery = useQuery({
    queryKey:  aiQueryKeys.propertyRisk(propertyId),
    queryFn:   () => propertyAnalysisIntegration.assessPropertyRisk(property),
    enabled:   enableRiskAssessment && hasId,
    staleTime: 600_000,
  });

  const fraudQuery = useQuery({
    queryKey:  aiQueryKeys.propertyFraud(propertyId),
    queryFn:   () => fraudDetectionIntegration.analyzePropertyFraud(property),
    enabled:   enableFraudDetection && hasId,
    staleTime: 300_000,
  });

  const isLoading = enhancementQuery.isLoading || valuationQuery.isLoading
    || riskQuery.isLoading || fraudQuery.isLoading;

  const error = enhancementQuery.error ?? valuationQuery.error
    ?? riskQuery.error ?? fraudQuery.error ?? null;

  const aiData = useMemo(() => ({
    enhancement:          enhancementQuery.data,
    valuation:            valuationQuery.data,
    riskAssessment:       riskQuery.data,
    fraudAnalysis:        fraudQuery.data,
    trustScoreAdjustment: enhancementQuery.data?.trustScoreAdjustment,
  }), [enhancementQuery.data, valuationQuery.data, riskQuery.data, fraudQuery.data]);

  const refresh = useCallback(() => {
    enhancementQuery.refetch();
    if (enableValuation)     valuationQuery.refetch();
    if (enableRiskAssessment) riskQuery.refetch();
    if (enableFraudDetection) fraudQuery.refetch();
  }, [
    enhancementQuery, valuationQuery, riskQuery, fraudQuery,
    enableValuation, enableRiskAssessment, enableFraudDetection,
  ]);

  return {
    data: aiData,
    isLoading,
    error,
    refresh,
    queries: { enhancement: enhancementQuery, valuation: valuationQuery, risk: riskQuery, fraud: fraudQuery },
  };
}

// ---------------------------------------------------------------------------
// useSearchAI
// ---------------------------------------------------------------------------

export function useSearchAI(
  properties: Property[],
  searchFilters: PropertySearchFilters,
  user?: User,
  options: UseSearchAIOptions = {},
) {
  const { enablePersonalization = true, maxRecommendations = 10 } = options;

  const hasProperties = properties.length > 0;

  const searchEnhancementQuery = useQuery({
    queryKey:  aiQueryKeys.searchEnhancement(searchFilters, user?.id),
    queryFn:   () => aiIntegrationOrchestrator.enhanceSearchResults(properties, searchFilters, user),
    enabled:   hasProperties,
    staleTime: 180_000,
    retry:     1,
  });

  const userRecommendationsQuery = useQuery({
    queryKey:  aiQueryKeys.userRecommendations(user?.id ?? ''),
    queryFn:   () => recommendationIntegration.generatePersonalizedRecommendations(
      user!, properties, undefined, maxRecommendations,
    ),
    enabled:   enablePersonalization && !!user?.id && hasProperties,
    staleTime: 300_000,
  });

  const enhancedData = useMemo(() => ({
    enhancedResults:              searchEnhancementQuery.data?.enhancedResults ?? [],
    personalizedRecommendations:  userRecommendationsQuery.data?.recommendations
                                    ?? searchEnhancementQuery.data?.personalizedRecommendations
                                    ?? [],
    marketInsights:               searchEnhancementQuery.data?.marketInsights,
    searchOptimizations:          searchEnhancementQuery.data?.searchOptimizations,
    matchingStrategy:             userRecommendationsQuery.data?.matchingStrategy,
  }), [searchEnhancementQuery.data, userRecommendationsQuery.data]);

  return {
    data:      enhancedData,
    isLoading: searchEnhancementQuery.isLoading || userRecommendationsQuery.isLoading,
    error:     searchEnhancementQuery.error ?? userRecommendationsQuery.error ?? null,
    refresh:   () => {
      searchEnhancementQuery.refetch();
      if (user) userRecommendationsQuery.refetch();
    },
    queries: {
      searchEnhancement:   searchEnhancementQuery,
      userRecommendations: userRecommendationsQuery,
    },
  };
}

// ---------------------------------------------------------------------------
// useDocumentAI
// ---------------------------------------------------------------------------

export function useDocumentAI(_options: UseDocumentAIOptions = {}) {
  const queryClient = useQueryClient();

  const processDocumentMutation = useMutation({
    mutationFn: ({ documentBuffer, documentType, sessionId }: {
      documentBuffer: Buffer;
      documentType:   string;
      sessionId?:     string;
    }) => documentProcessingIntegration.processDocument(documentBuffer, documentType, sessionId),

    onSuccess: (data) => {
      queryClient.setQueryData(aiQueryKeys.documentProcessing(data.documentId), data);
      logger.info('Document processing completed', {
        documentId:       data.documentId,
        processingStatus: data.processingStatus,
      });
    },
    onError: (error) => {
      logger.error('Document processing failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    },
  });

  const processLandVerificationMutation = useMutation({
    mutationFn: ({ documents, sessionId }: {
      documents:  Array<{ buffer: Buffer; type: string; name: string }>;
      sessionId:  string;
    }) => documentProcessingIntegration.processLandVerificationDocuments(documents, sessionId),

    onSuccess: (data) => {
      logger.info('Land verification workflow completed', {
        sessionId:     data.sessionId,
        overallStatus: data.overallStatus,
      });
    },
  });

  return {
    processDocument:              processDocumentMutation.mutate,
    processDocumentAsync:         processDocumentMutation.mutateAsync,
    processLandVerification:      processLandVerificationMutation.mutate,
    processLandVerificationAsync: processLandVerificationMutation.mutateAsync,
    isProcessing:                 processDocumentMutation.isPending || processLandVerificationMutation.isPending,
    error:                        processDocumentMutation.error ?? processLandVerificationMutation.error ?? null,
    mutations: {
      processDocument:         processDocumentMutation,
      processLandVerification: processLandVerificationMutation,
    },
  };
}

// ---------------------------------------------------------------------------
// useFraudDetectionAI
// ---------------------------------------------------------------------------

export function useFraudDetectionAI(user?: User) {
  const userFraudQuery = useQuery({
    queryKey:  aiQueryKeys.userFraud(user?.id ?? ''),
    queryFn:   () => fraudDetectionIntegration.analyzeUserFraud(user!),
    enabled:   !!user?.id,
    staleTime: 600_000,
    retry:     1,
  });

  const analyzePropertyFraudMutation = useMutation({
    mutationFn: (property: Property) => fraudDetectionIntegration.analyzePropertyFraud(property),
    onSuccess:  (data) => {
      logger.info('Property fraud analysis completed', {
        propertyId: data.propertyId,
        riskLevel:  data.riskLevel,
      });
    },
  });

  const analyzeNetworkFraudMutation = useMutation({
    mutationFn: ({ users, properties, connections }: {
      users:       User[];
      properties:  Property[];
      connections: Array<{ from: string; to: string; type: string; weight: number }>;
    }) => fraudDetectionIntegration.analyzeNetworkFraud(
      [
        ...users.map(u      => ({ id: String(u.id),      type: 'user'     as const, data: u })),
        ...properties.map(p => ({ id: String(p.id), type: 'property' as const, data: p })),
      ],
      connections,
    ),
  });

  return {
    userFraudData:              userFraudQuery.data,
    isLoadingUserFraud:         userFraudQuery.isLoading,
    userFraudError:             userFraudQuery.error ?? null,
    analyzePropertyFraud:       analyzePropertyFraudMutation.mutate,
    analyzePropertyFraudAsync:  analyzePropertyFraudMutation.mutateAsync,
    analyzeNetworkFraud:        analyzeNetworkFraudMutation.mutate,
    analyzeNetworkFraudAsync:   analyzeNetworkFraudMutation.mutateAsync,
    isAnalyzing:                analyzePropertyFraudMutation.isPending || analyzeNetworkFraudMutation.isPending,
    analysisError:              analyzePropertyFraudMutation.error ?? analyzeNetworkFraudMutation.error ?? null,
    refreshUserFraud:           userFraudQuery.refetch,
  };
}

// ---------------------------------------------------------------------------
// useAIMetrics
// ---------------------------------------------------------------------------

export function useAIMetrics() {
  const metricsQuery = useQuery({
    queryKey:        aiQueryKeys.aiMetrics(),
    queryFn:         () => aiIntegrationOrchestrator.getMetrics(),
    refetchInterval: 30_000,
    staleTime:       15_000,
  });

  const healthQuery = useQuery({
    queryKey:        aiQueryKeys.aiHealth(),
    queryFn:         () => aiIntegrationOrchestrator.getHealthStatus(),
    refetchInterval: 60_000,
    staleTime:       30_000,
  });

  return {
    metrics:   metricsQuery.data,
    health:    healthQuery.data,
    isLoading: metricsQuery.isLoading || healthQuery.isLoading,
    error:     metricsQuery.error ?? healthQuery.error ?? null,
    refresh:   () => { metricsQuery.refetch(); healthQuery.refetch(); },
  };
}

// ---------------------------------------------------------------------------
// useRecommendationFeedback
// ---------------------------------------------------------------------------

export function useRecommendationFeedback() {
  const queryClient = useQueryClient();

  const submitFeedbackMutation = useMutation({
    mutationFn: (feedback: {
      userId:           string;
      propertyId:       string;
      recommendationId: string;
      feedbackType:     'interested' | 'not_interested' | 'viewed' | 'inquired' | 'contacted';
      rating?:          number;
      comments?:        string;
    }) => recommendationIntegration.processFeedback({ ...feedback, timestamp: new Date() }),

    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: aiQueryKeys.userRecommendations(variables.userId) });
      logger.info('Recommendation feedback processed', {
        userId:         variables.userId,
        feedbackType:   variables.feedbackType,
        learningImpact: data.learningImpact,
      });
    },
  });

  return {
    submitFeedback:      submitFeedbackMutation.mutate,
    submitFeedbackAsync: submitFeedbackMutation.mutateAsync,
    isSubmitting:        submitFeedbackMutation.isPending,
    error:               submitFeedbackMutation.error ?? null,
    lastResult:          submitFeedbackMutation.data,
  };
}

// ---------------------------------------------------------------------------
// useAIIntegrationState
// ---------------------------------------------------------------------------

export function useAIIntegrationState() {
  const [isEnabled, setIsEnabled] = useState(true);
  const [preferences, setPreferences] = useState({
    enablePropertyAnalysis:   true,
    enableDocumentProcessing: true,
    enableFraudDetection:     true,
    enableRecommendations:    true,
    autoRefresh:              false,
  });

  const toggleAI = useCallback(() => setIsEnabled((prev) => !prev), []);

  const updatePreferences = useCallback(
    (patch: Partial<typeof preferences>) => setPreferences((prev) => ({ ...prev, ...patch })),
    [],
  );

  return { isEnabled, preferences, toggleAI, updatePreferences, setIsEnabled, setPreferences };
}