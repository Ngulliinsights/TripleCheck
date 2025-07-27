import { apiClient } from '../../shared/services/api-client';

// Types for fraud detection dashboard
export interface BackgroundScan {
  id: string;
  propertyId: string;
  status: "scanning" | "complete" | "flagged" | "cleared";
  progress: number;
  startTime: string;
  estimatedCompletion?: string;
  riskLevel: "low" | "medium" | "high" | "critical";
}

export interface FraudReport {
  id: string;
  propertyId: string;
  title: string;
  summary: string;
  riskScore: number;
  status: "safe" | "caution" | "warning" | "blocked";
  completedAt: string;
  keyFindings: string[];
  recommendations: string[];
}

export interface UserStats {
  propertiesScanned: number;
  averageScanTime: number;
  cleanRate: number;
}

export interface DetailedReport extends FraudReport {
  detailedAnalysis: {
    documentAuthenticity: {
      score: number;
      status: string;
      details: string;
    };
    ownershipVerification: {
      score: number;
      status: string;
      details: string;
    };
    marketAnalysis: {
      score: number;
      status: string;
      details: string;
    };
    legalCompliance: {
      score: number;
      status: string;
      details: string;
    };
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

class FraudDetectionApiService {
  private readonly baseUrl = '/api/fraud-detection/dashboard';

  /**
   * Get user's active fraud detection scans
   */
  async getActiveScans(): Promise<BackgroundScan[]> {
    const response = await apiClient.get<ApiResponse<BackgroundScan[]>>(`${this.baseUrl}/scans/active`);
    
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to fetch active scans');
    }
    
    return response.data?.data || [];
  }

  /**
   * Get user's recent fraud detection reports
   */
  async getRecentReports(): Promise<FraudReport[]> {
    const response = await apiClient.get<ApiResponse<FraudReport[]>>(`${this.baseUrl}/reports/recent`);
    
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to fetch recent reports');
    }
    
    return response.data?.data || [];
  }

  /**
   * Get user's fraud detection statistics
   */
  async getUserStats(): Promise<UserStats> {
    const response = await apiClient.get<ApiResponse<UserStats>>(`${this.baseUrl}/stats`);
    
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to fetch user statistics');
    }
    
    return response.data?.data || { propertiesScanned: 0, averageScanTime: 0, cleanRate: 0 };
  }

  /**
   * Get detailed report information
   */
  async getReportDetails(reportId: string): Promise<DetailedReport> {
    const response = await apiClient.get<ApiResponse<DetailedReport>>(`${this.baseUrl}/reports/${reportId}`);
    
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to fetch report details');
    }
    
    if (!response.data?.data) {
      throw new Error('Report not found');
    }
    
    return response.data.data;
  }

  /**
   * Download report as PDF
   */
  async downloadReport(reportId: string): Promise<Blob> {
    const response = await apiClient.get(`${this.baseUrl}/reports/${reportId}/download`);
    
    return response.data as Blob;
  }

  /**
   * Refresh scan status
   */
  async refreshScans(): Promise<void> {
    const response = await apiClient.post<ApiResponse<void>>(`${this.baseUrl}/scans/refresh`);
    
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to refresh scans');
    }
  }

  /**
   * Start new fraud detection scan for a property
   */
  async startScan(propertyId: string): Promise<BackgroundScan> {
    const response = await apiClient.post<ApiResponse<BackgroundScan>>(`${this.baseUrl}/scans/start`, {
      propertyId,
    });
    
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to start scan');
    }
    
    if (!response.data?.data) {
      throw new Error('Invalid response from server');
    }
    
    return response.data.data;
  }

  /**
   * Get public fraud detection metrics (for marketing page)
   */
  async getPublicMetrics(): Promise<{
    propertiesScannedToday: string;
    averageScanTime: string;
    cleanProperties: string;
    issuesPrevented: string;
  }> {
    // This would typically come from a public API endpoint
    // For now, return mock data that matches the marketing page
    return {
      propertiesScannedToday: "1,247",
      averageScanTime: "3.2 min",
      cleanProperties: "94.7%",
      issuesPrevented: "₦2.8B",
    };
  }
}

export const fraudDetectionApi = new FraudDetectionApiService();