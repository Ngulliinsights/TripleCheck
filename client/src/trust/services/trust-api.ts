import { 
  TrustScore, 
  VerificationCheck, 
  FraudAlert,
  TrustScoreAnalysis,
  TrustScoreHistory,
  VerificationStatus,
  FraudRiskLevel
} from '../types/trust.types';
import { 
  CommunityReference, 
  CommunityReview, 
  CommunityEngagement, 
  ReportedIssue 
} from './trust-business-logic';
import { apiRequest } from '@/infrastructure/api/queryClient';
import { ApiResponse } from './fraudDetectionApi';

const API_BASE = '/api/trust';

// ─── Internal helpers ────────────────────────────────────────────────────────

function getAuthHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function apiFetch<T>(
  input: RequestInfo,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: { ...getAuthHeaders(), ...((init.headers as Record<string, string>) ?? {}) },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error((errorData as { message?: string }).message ?? `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

// ─── Pure API Layer ──────────────────────────────────────────────────────────

export const trustApi = {
  getTrustScore: async (userId: string): Promise<ApiResponse<{
    trustScore: TrustScore;
    analysis: TrustScoreAnalysis;
    history: TrustScoreHistory;
  }>> => 
    apiRequest<ApiResponse<{
      trustScore: TrustScore;
      analysis: TrustScoreAnalysis;
      history: TrustScoreHistory;
    }>>(
      'GET',
      `${API_BASE}/score/${userId}`,
      undefined,
      {
        headers: getAuthHeaders(),
        requestOptions: { key: `trust-score:${userId}`, priority: 'high', cancelPrevious: true },
      },
    ),

  updateTrustScore: async (
    userId: string,
    factors: Partial<TrustScore['factors']>,
  ): Promise<ApiResponse<TrustScore>> => 
    apiRequest<ApiResponse<TrustScore>>(
      'PATCH',
      `${API_BASE}/score/${userId}`,
      { factors },
      {
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        requestOptions: { key: `update-trust-score:${userId}`, priority: 'high', cancelPrevious: true },
      },
    ),

  submitDocumentVerification: async (data: {
    type: 'document' | 'identity' | 'property' | 'financial';
    files: File[];
    metadata?: Record<string, unknown>;
  }): Promise<ApiResponse<VerificationCheck>> => {
    const formData = new FormData();
    formData.append('type', data.type);
    data.files.forEach((file, i) => formData.append(`document_${i}`, file));
    if (data.metadata) formData.append('metadata', JSON.stringify(data.metadata));

    return apiFetch<ApiResponse<VerificationCheck>>(`${API_BASE}/verification/submit`, {
      method: 'POST',
      body: formData,
    });
  },

  getVerificationStatus: async (userId: string): Promise<ApiResponse<{
    checks: VerificationCheck[];
    overallStatus: VerificationStatus;
    completionPercentage: number;
    nextSteps: string[];
  }>> => 
    apiFetch<ApiResponse<{
      checks: VerificationCheck[];
      overallStatus: VerificationStatus;
      completionPercentage: number;
      nextSteps: string[];
    }>>(`${API_BASE}/verification/${userId}`),

  reportFraud: async (data: {
    userId?: string;
    propertyId?: string;
    alertType: 'suspicious_activity' | 'fake_documents' | 'duplicate_listing' | 'payment_fraud';
    description: string;
    evidence?: File[];
  }): Promise<ApiResponse<FraudAlert>> => {
    const formData = new FormData();
    formData.append('alertType', data.alertType);
    formData.append('description', data.description);
    if (data.userId) formData.append('userId', data.userId);
    if (data.propertyId) formData.append('propertyId', data.propertyId);
    data.evidence?.forEach((file, i) => formData.append(`evidence_${i}`, file));

    return apiFetch<ApiResponse<FraudAlert>>(`${API_BASE}/fraud/report`, {
      method: 'POST',
      body: formData,
    });
  },

  getFraudAlerts: async (params: {
    userId?: string;
    propertyId?: string;
    status?: FraudAlert['status'];
    severity?: FraudAlert['severity'];
  } = {}): Promise<ApiResponse<FraudAlert[]>> => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v != null) as [string, string][],
    );

    return apiFetch<ApiResponse<FraudAlert[]>>(`${API_BASE}/fraud/alerts?${query}`);
  },

  performFraudAssessment: async (data: {
    userId: string;
    propertyId?: string;
    transactionData?: unknown;
  }): Promise<ApiResponse<{
    riskLevel: FraudRiskLevel;
    riskScore: number;
    flags: string[];
    recommendations: string[];
    assessment: {
      userRisk: number;
      propertyRisk?: number;
      transactionRisk?: number;
      overallRisk: number;
    };
  }>> =>
    apiFetch(`${API_BASE}/fraud/assess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  getCommunityTrust: async (userId: string): Promise<ApiResponse<{
    score: number;
    factors: Record<string, number>;
    insights: string[];
    references: CommunityReference[];
    reviews: CommunityReview[];
    communityEngagement: CommunityEngagement[];
    reportedIssues?: ReportedIssue[];
  }>> => 
    apiFetch<ApiResponse<{
      score: number;
      factors: Record<string, number>;
      insights: string[];
      references: CommunityReference[];
      reviews: CommunityReview[];
      communityEngagement: CommunityEngagement[];
      reportedIssues?: ReportedIssue[];
    }>>(`${API_BASE}/community/${userId}`),

  addCommunityReference: async (data: {
    referenceName:  string;
    referencePhone: string;
    relationship:   string;
    yearsKnown:     number;
    notes?:         string;
  }): Promise<ApiResponse<unknown>> =>
    apiFetch(`${API_BASE}/community/reference`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  recalculateTrustScore: async (userId: string): Promise<ApiResponse<{
    oldScore: number;
    newScore: number;
    changes: Record<string, number>;
    reason: string;
  }>> =>
    apiFetch(`${API_BASE}/score/${userId}/recalculate`, { method: 'POST' }),

  getTrustInsights: async (userId: string): Promise<ApiResponse<{
    trends: Array<{ date: string; score: number }>;
    comparisons: { averageScore: number; percentile: number; similarUsers: number };
    achievements: Array<{ title: string; description: string; earnedDate: string; icon: string }>;
    goals: Array<{ title: string; description: string; progress: number; target: number }>;
  }>> =>
    apiFetch(`${API_BASE}/insights/${userId}`),
};