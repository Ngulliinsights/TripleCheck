import { ApiResponse } from '../../shared/types';
import { TrustScore, VerificationCheck, FraudAlert } from '../types/trust.types';
import { TrustBusinessLogic } from './trust-business-logic';

const API_BASE = '/api/trust';

// Enhanced trust API with business logic integration
export const trustApi = {
  // Get comprehensive trust score with analysis
  getTrustScore: async (userId: string): Promise<ApiResponse<{
    trustScore: TrustScore;
    analysis: {
      score: number;
      level: string;
      color: string;
      breakdown: Record<string, number>;
      recommendations: string[];
    };
    history: Array<{ date: string; score: number; change: number }>;
  }>> => {
    const response = await fetch(`${API_BASE}/score/${userId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch trust score');
    }
    
    const data = await response.json();
    
    if (data.data) {
      // Enhance with business logic analysis
      const analysis = TrustBusinessLogic.calculateTrustScore(data.data.trustScore.factors);
      data.data.analysis = analysis;
    }
    
    return data;
  },

  // Update trust score with validation
  updateTrustScore: async (
    userId: string, 
    factors: Partial<TrustScore['factors']>
  ): Promise<ApiResponse<TrustScore>> => {
    // Get current trust score first
    const currentScoreResponse = await trustApi.getTrustScore(userId);
    const currentScore = currentScoreResponse.data.trustScore;

    // Check if update is needed
    const updateCheck = TrustBusinessLogic.shouldUpdateTrustScore(currentScore, factors);
    
    if (!updateCheck.shouldUpdate) {
      return {
        success: true,
        data: currentScore,
        message: updateCheck.reason,
      };
    }

    const response = await fetch(`${API_BASE}/score/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify({ factors }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update trust score');
    }
    
    return response.json();
  },

  // Submit document for verification
  submitDocumentVerification: async (data: {
    type: 'document' | 'identity' | 'property' | 'financial';
    files: File[];
    metadata?: Record<string, any>;
  }): Promise<ApiResponse<VerificationCheck>> => {
    const formData = new FormData();
    formData.append('type', data.type);
    
    data.files.forEach((file, index) => {
      formData.append(`document_${index}`, file);
    });
    
    if (data.metadata) {
      formData.append('metadata', JSON.stringify(data.metadata));
    }

    const response = await fetch(`${API_BASE}/verification/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to submit verification');
    }
    
    return response.json();
  },

  // Get verification status
  getVerificationStatus: async (userId: string): Promise<ApiResponse<{
    checks: VerificationCheck[];
    overallStatus: 'pending' | 'partial' | 'complete';
    completionPercentage: number;
    nextSteps: string[];
  }>> => {
    const response = await fetch(`${API_BASE}/verification/${userId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch verification status');
    }
    
    const data = await response.json();
    
    if (data.data && data.data.checks) {
      // Calculate completion percentage and next steps
      const checks = data.data.checks;
      const totalChecks = 4; // document, identity, property, financial
      const completedChecks = checks.filter((check: VerificationCheck) => 
        check.status === 'verified'
      ).length;
      
      const completionPercentage = Math.round((completedChecks / totalChecks) * 100);
      
      // Determine overall status
      let overallStatus: 'pending' | 'partial' | 'complete';
      if (completedChecks === 0) {
        overallStatus = 'pending';
      } else if (completedChecks === totalChecks) {
        overallStatus = 'complete';
      } else {
        overallStatus = 'partial';
      }

      // Generate next steps
      const nextSteps: string[] = [];
      const checkTypes = ['document', 'identity', 'property', 'financial'];
      const completedTypes = checks
        .filter((check: VerificationCheck) => check.status === 'verified')
        .map((check: VerificationCheck) => check.type);
      
      const pendingTypes = checkTypes.filter(type => !completedTypes.includes(type));
      
      pendingTypes.forEach(type => {
        switch (type) {
          case 'document':
            nextSteps.push('Upload government-issued ID and proof of address');
            break;
          case 'identity':
            nextSteps.push('Complete video identity verification');
            break;
          case 'property':
            nextSteps.push('Verify property ownership documents');
            break;
          case 'financial':
            nextSteps.push('Provide financial verification documents');
            break;
        }
      });

      data.data.completionPercentage = completionPercentage;
      data.data.overallStatus = overallStatus;
      data.data.nextSteps = nextSteps;
    }
    
    return data;
  },

  // Report fraud or suspicious activity
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
    
    if (data.evidence) {
      data.evidence.forEach((file, index) => {
        formData.append(`evidence_${index}`, file);
      });
    }

    const response = await fetch(`${API_BASE}/fraud/report`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to report fraud');
    }
    
    return response.json();
  },

  // Get fraud alerts for user or property
  getFraudAlerts: async (params: {
    userId?: string;
    propertyId?: string;
    status?: FraudAlert['status'];
    severity?: FraudAlert['severity'];
  } = {}): Promise<ApiResponse<FraudAlert[]>> => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.append(key, value);
    });

    const response = await fetch(`${API_BASE}/fraud/alerts?${searchParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch fraud alerts');
    }
    
    return response.json();
  },

  // Perform fraud risk assessment
  performFraudAssessment: async (data: {
    userId: string;
    propertyId?: string;
    transactionData?: any;
  }): Promise<ApiResponse<{
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    riskScore: number;
    flags: string[];
    recommendations: string[];
    assessment: {
      userRisk: number;
      propertyRisk?: number;
      transactionRisk?: number;
      overallRisk: number;
    };
  }>> => {
    const response = await fetch(`${API_BASE}/fraud/assess`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to perform fraud assessment');
    }
    
    return response.json();
  },

  // Get community trust data
  getCommunityTrust: async (userId: string): Promise<ApiResponse<{
    score: number;
    factors: Record<string, number>;
    insights: string[];
    references: any[];
    reviews: any[];
    communityEngagement: any[];
  }>> => {
    const response = await fetch(`${API_BASE}/community/${userId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch community trust');
    }
    
    const data = await response.json();
    
    if (data.data) {
      // Enhance with business logic analysis
      const communityTrust = TrustBusinessLogic.calculateCommunityTrust({
        references: data.data.references || [],
        reviews: data.data.reviews || [],
        communityEngagement: data.data.communityEngagement || [],
        reportedIssues: data.data.reportedIssues || [],
      });
      
      data.data.score = communityTrust.score;
      data.data.factors = communityTrust.factors;
      data.data.insights = communityTrust.insights;
    }
    
    return data;
  },

  // Add community reference
  addCommunityReference: async (data: {
    referenceName: string;
    referencePhone: string;
    relationship: string;
    yearsKnown: number;
    notes?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await fetch(`${API_BASE}/community/reference`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to add community reference');
    }
    
    return response.json();
  },

  // Request trust score recalculation
  recalculateTrustScore: async (userId: string): Promise<ApiResponse<{
    oldScore: number;
    newScore: number;
    changes: Record<string, number>;
    reason: string;
  }>> => {
    const response = await fetch(`${API_BASE}/score/${userId}/recalculate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to recalculate trust score');
    }
    
    return response.json();
  },

  // Get trust insights and analytics
  getTrustInsights: async (userId: string): Promise<ApiResponse<{
    trends: Array<{ date: string; score: number }>;
    comparisons: {
      averageScore: number;
      percentile: number;
      similarUsers: number;
    };
    achievements: Array<{
      title: string;
      description: string;
      earnedDate: string;
      icon: string;
    }>;
    goals: Array<{
      title: string;
      description: string;
      progress: number;
      target: number;
    }>;
  }>> => {
    const response = await fetch(`${API_BASE}/insights/${userId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch trust insights');
    }
    
    return response.json();
  },
};