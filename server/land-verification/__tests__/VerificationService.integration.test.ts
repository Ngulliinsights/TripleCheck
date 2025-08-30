/**
 * Integration test for VerificationService
 * This test focuses on the core functionality without complex dependencies
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the complex dependencies to avoid TensorFlow issues
vi.mock('../../fraud-detection/utils/Logger', () => ({
  Logger: vi.fn().mockImplementation(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }))
}));

vi.mock('../../fraud-detection/core/FraudDetectionEngine', () => ({
  FraudDetectionEngine: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    processTransaction: vi.fn().mockResolvedValue([]),
    shutdown: vi.fn().mockResolvedValue(undefined)
  }))
}));

vi.mock('../../storage', () => ({
  storage: {
    getProperty: vi.fn(),
    updateVerificationStatus: vi.fn()
  }
}));

vi.mock('../../ai-routes', () => ({
  detectFraud: vi.fn()
}));

vi.mock('../../ai-ml-service', () => ({
  detectFraud: vi.fn(),
  verifyDocument: vi.fn(),
  generateVerificationReport: vi.fn(),
  generateMarketAnalysisReport: vi.fn(),
  generateRiskAssessmentReport: vi.fn()
}));

import { VerificationService } from '../VerificationService';
import { storage } from '../../storage';
import * as aiService from '../../ai-ml-service';
import * as aiRoutes from '../../ai-routes';

describe('VerificationService Integration', () => {
  let verificationService: VerificationService;

  const mockProperty = {
    id: 1,
    title: 'Test Property',
    description: 'A test property for verification',
    location: 'Nairobi, Kenya',
    price: 5000000,
    ownerId: 1,
    verificationStatus: 'pending',
    imageUrls: ['image1.jpg', 'image2.jpg'],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Setup storage mocks
    vi.mocked(storage.getProperty).mockResolvedValue(mockProperty);
    vi.mocked(storage.updateVerificationStatus).mockResolvedValue(undefined);

    // Setup AI service mocks
    vi.mocked(aiService.detectFraud).mockResolvedValue({
      isSuspicious: false,
      suspiciousScore: 0.2,
      reasons: [],
      riskLevel: 'low',
      verificationDate: new Date(),
      fraudPatterns: {
        priceAnomaly: 10,
        documentInconsistency: 5,
        ownershipRisk: 15,
        marketDeviation: 8
      }
    });

    vi.mocked(aiService.verifyDocument).mockResolvedValue({
      isVerified: true,
      confidence: 0.9,
      issues: [],
      recommendations: [],
      documentType: 'title_deed',
      extractedData: { propertyId: '123' },
      verificationDate: new Date(),
      aiAnalysis: {
        authenticity: 90,
        completeness: 85,
        consistency: 88
      }
    });

    vi.mocked(aiService.generateVerificationReport).mockResolvedValue('Mock verification report');

    // Setup AI routes mocks
    vi.mocked(aiRoutes.detectFraud).mockResolvedValue({
      isSuspicious: false,
      suspiciousScore: 0.1,
      overallScore: 10,
      verificationTimestamp: new Date().toISOString(),
      imageAnalysis: {
        qualityScore: 85,
        authenticityScore: 90,
        flaggedIssues: []
      },
      descriptionAnalysis: {
        sentiment: 0.7,
        keywordFlags: [],
        qualityScore: 80
      },
      aiModel: 'gemini-1.5-pro'
    });

    // Create service instance
    verificationService = new VerificationService({
      enableFraudDetectionEngine: false, // Disable to avoid TensorFlow issues
      enableAIVerification: true,
      riskThreshold: 0.7,
      autoEscalateHighRisk: false // Disable to simplify test
    });

    await verificationService.initialize();
  });

  it('should create VerificationService instance', () => {
    expect(verificationService).toBeDefined();
    expect(verificationService).toBeInstanceOf(VerificationService);
  });

  it('should perform property verification successfully', async () => {
    const result = await verificationService.verifyProperty(1);

    expect(result).toBeDefined();
    expect(result).toHaveProperty('documentAuthenticity');
    expect(result).toHaveProperty('ownershipVerified');
    expect(result).toHaveProperty('riskScore');
    expect(result).toHaveProperty('verifiedAt');
    expect(result).toHaveProperty('overallScore');
    expect(result).toHaveProperty('verificationTimestamp');

    expect(storage.getProperty).toHaveBeenCalledWith(1);
    expect(storage.updateVerificationStatus).toHaveBeenCalled();
  });

  it('should perform fraud detection', async () => {
    const result = await verificationService.performFraudDetection(mockProperty);

    expect(result).toBeDefined();
    expect(result).toHaveProperty('isSuspicious');
    expect(result).toHaveProperty('suspiciousScore');
    expect(result).toHaveProperty('overallScore');
    expect(result).toHaveProperty('verificationTimestamp');

    expect(result.isSuspicious).toBe(false);
    expect(result.suspiciousScore).toBe(0.1); // Uses AI routes fallback
  });

  it('should verify documents', async () => {
    const documents = [
      {
        documentBuffer: Buffer.from('mock document content'),
        documentName: 'title_deed.pdf',
        documentType: 'title_deed'
      }
    ];

    const results = await verificationService.verifyDocuments(1, documents);

    expect(results).toBeDefined();
    expect(results).toHaveLength(1);
    expect(results[0]).toHaveProperty('isVerified', true);
    expect(results[0]).toHaveProperty('confidence', 0.9);
    expect(results[0]).toHaveProperty('documentType', 'title_deed');

    expect(aiService.verifyDocument).toHaveBeenCalledWith(
      documents[0].documentBuffer,
      documents[0].documentName,
      documents[0].documentType
    );
  });

  it('should generate verification report', async () => {
    const report = await verificationService.generateVerificationReport(1);

    expect(report).toBe('Mock verification report');
    expect(aiService.generateVerificationReport).toHaveBeenCalledWith(1);
  });

  it('should get verification status', async () => {
    const status = await verificationService.getVerificationStatus(1);

    expect(status).toBeDefined();
    expect(status).toHaveProperty('status', 'pending');
    expect(status).toHaveProperty('riskLevel');

    expect(storage.getProperty).toHaveBeenCalledWith(1);
  });

  it('should handle property not found', async () => {
    vi.mocked(storage.getProperty).mockResolvedValue(null);

    await expect(verificationService.verifyProperty(999))
      .rejects.toThrow('Property with ID 999 not found');
  });

  it('should handle fraud detection errors gracefully', async () => {
    vi.mocked(aiService.detectFraud).mockRejectedValue(new Error('AI service error'));
    vi.mocked(aiRoutes.detectFraud).mockRejectedValue(new Error('AI routes error'));

    const result = await verificationService.performFraudDetection(mockProperty);

    expect(result).toBeDefined();
    expect(result.isSuspicious).toBe(false);
    expect(result.suspiciousScore).toBe(0);
    expect(result.overallScore).toBe(50);
  });

  it('should shutdown successfully', async () => {
    await expect(verificationService.shutdown()).resolves.not.toThrow();
  });

  it('should work with different configuration options', async () => {
    const customService = new VerificationService({
      enableFraudDetectionEngine: false,
      enableAIVerification: true,
      riskThreshold: 0.5,
      autoEscalateHighRisk: false
    });

    await customService.initialize();

    const result = await customService.performFraudDetection(mockProperty);
    expect(result).toBeDefined();

    await customService.shutdown();
  });
});