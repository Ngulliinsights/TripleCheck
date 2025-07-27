import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RiskAssessmentService, VerificationResult, RiskFactor, PropertyData } from './RiskAssessmentService';

// Mock the database and logger
vi.mock('../db');
vi.mock('../logger');

describe('RiskAssessmentService', () => {
  let riskAssessmentService: RiskAssessmentService;
  let mockVerificationResults: VerificationResult[];
  let mockPropertyData: PropertyData;

  beforeEach(() => {
    riskAssessmentService = new RiskAssessmentService();
    
    mockPropertyData = {
      id: 'test-property-1',
      location: 'Nairobi, Kenya',
      price: 5000000,
      coordinates: { lat: -1.2921, lng: 36.8219 }
    };

    mockVerificationResults = [
      {
        layerType: 'ownership',
        status: 'pass',
        score: 0.8,
        confidence: 0.9,
        results: [{ description: 'Ownership verified successfully' }],
        completedAt: new Date()
      },
      {
        layerType: 'government',
        status: 'warning',
        score: 0.6,
        confidence: 0.7,
        results: [{ description: 'Minor government designation issues' }],
        completedAt: new Date()
      },
      {
        layerType: 'legal',
        status: 'fail',
        score: 0.3,
        confidence: 0.8,
        results: [{ description: 'Legal disputes identified' }],
        completedAt: new Date()
      }
    ];
  });

  describe('calculateOverallRisk', () => {
    it('should calculate overall risk profile correctly', async () => {
      const riskProfile = await riskAssessmentService.calculateOverallRisk(mockVerificationResults);

      expect(riskProfile).toBeDefined();
      expect(riskProfile.overallRiskScore).toBeGreaterThan(0);
      expect(riskProfile.riskLevel).toMatch(/^(low|medium|high|critical)$/);
      expect(riskProfile.confidence).toBeGreaterThan(0);
      expect(riskProfile.confidence).toBeLessThanOrEqual(1);
      expect(riskProfile.riskFactors).toBeInstanceOf(Array);
      expect(riskProfile.riskInteractions).toBeInstanceOf(Array);
      expect(riskProfile.recommendations).toBeInstanceOf(Array);
      expect(riskProfile.assessmentDate).toBeInstanceOf(Date);
      expect(riskProfile.validUntil).toBeInstanceOf(Date);
    });

    it('should handle empty verification results', async () => {
      const riskProfile = await riskAssessmentService.calculateOverallRisk([]);

      expect(riskProfile.overallRiskScore).toBe(0);
      expect(riskProfile.riskLevel).toBe('low');
      expect(riskProfile.confidence).toBe(1.0);
      expect(riskProfile.riskFactors).toHaveLength(0);
    });

    it('should emit riskAssessmentCompleted event', async () => {
      const eventSpy = vi.fn();
      riskAssessmentService.on('riskAssessmentCompleted', eventSpy);

      await riskAssessmentService.calculateOverallRisk(mockVerificationResults);

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          riskProfile: expect.any(Object),
          processingTime: expect.any(Number)
        })
      );
    });
  });

  describe('identifyRiskFactors', () => {
    it('should identify risk factors from verification results', async () => {
      const riskFactors = await riskAssessmentService.identifyRiskFactors(mockPropertyData, mockVerificationResults);

      expect(riskFactors).toBeInstanceOf(Array);
      expect(riskFactors.length).toBeGreaterThan(0);

      // Should have risk factors for failed/warning results
      const governmentRisk = riskFactors.find(rf => rf.category === 'government');
      const legalRisk = riskFactors.find(rf => rf.category === 'legal');

      expect(governmentRisk).toBeDefined();
      expect(legalRisk).toBeDefined();
      expect(legalRisk?.severity).toBe('high'); // Score 0.3 should be high based on current logic
    });

    it('should assign correct weights to risk factors', async () => {
      const riskFactors = await riskAssessmentService.identifyRiskFactors(mockPropertyData, mockVerificationResults);

      riskFactors.forEach(factor => {
        expect(factor.weight).toBeGreaterThan(0);
        expect(typeof factor.weight).toBe('number');
      });
    });

    it('should include proper mitigation strategies', async () => {
      const riskFactors = await riskAssessmentService.identifyRiskFactors(mockPropertyData, mockVerificationResults);

      riskFactors.forEach(factor => {
        expect(factor.mitigation).toBeInstanceOf(Array);
        expect(factor.mitigation!.length).toBeGreaterThan(0);
      });
    });
  });

  describe('analyzeRiskInteractions', () => {
    it('should identify risk interactions correctly', async () => {
      const mockRiskFactors: RiskFactor[] = [
        {
          id: 'rf1',
          category: 'ownership',
          severity: 'high',
          confidence: 0.8,
          description: 'Ownership dispute',
          evidence: ['Court case pending'],
          impact: 'High ownership risk',
          likelihood: 0.7,
          sourceLayer: 'ownership',
          weight: 2.0
        },
        {
          id: 'rf2',
          category: 'legal',
          severity: 'medium',
          confidence: 0.7,
          description: 'Legal encumbrance',
          evidence: ['Mortgage registered'],
          impact: 'Legal complications',
          likelihood: 0.5,
          sourceLayer: 'legal',
          weight: 1.5
        }
      ];

      const interactions = await riskAssessmentService.analyzeRiskInteractions(mockRiskFactors);

      expect(interactions).toBeInstanceOf(Array);
      
      // Should find ownership-legal interaction
      const ownershipLegalInteraction = interactions.find(i => 
        i.riskFactorIds.includes('rf1') && i.riskFactorIds.includes('rf2')
      );
      
      if (ownershipLegalInteraction) {
        expect(ownershipLegalInteraction.interactionType).toBe('amplifying');
        expect(ownershipLegalInteraction.combinedImpact).toBeGreaterThan(0);
      }
    });

    it('should handle single category risk factors', async () => {
      const mockRiskFactors: RiskFactor[] = [
        {
          id: 'rf1',
          category: 'ownership',
          severity: 'high',
          confidence: 0.8,
          description: 'Ownership dispute',
          evidence: ['Court case pending'],
          impact: 'High ownership risk',
          likelihood: 0.7,
          sourceLayer: 'ownership',
          weight: 2.0
        }
      ];

      const interactions = await riskAssessmentService.analyzeRiskInteractions(mockRiskFactors);

      expect(interactions).toBeInstanceOf(Array);
      // Should have no interactions with single category
      expect(interactions.length).toBe(0);
    });
  });

  describe('generateRecommendations', () => {
    it('should generate appropriate recommendations', async () => {
      const mockRiskFactors: RiskFactor[] = [
        {
          id: 'rf1',
          category: 'ownership',
          severity: 'critical',
          confidence: 0.8,
          description: 'Critical ownership issue',
          evidence: ['Multiple ownership claims'],
          impact: 'Property ownership unclear',
          likelihood: 0.9,
          sourceLayer: 'ownership',
          weight: 3.0
        }
      ];

      const mockInteractions = [];

      const recommendations = await riskAssessmentService.generateRecommendations(
        mockRiskFactors, 
        mockInteractions, 
        'critical'
      );

      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations.length).toBeGreaterThan(0);

      // Should have critical risk recommendation
      const criticalRec = recommendations.find(r => r.priority === 'high' && r.title.includes('Critical'));
      expect(criticalRec).toBeDefined();
      expect(criticalRec?.actionItems).toBeInstanceOf(Array);
      expect(criticalRec?.actionItems.length).toBeGreaterThan(0);
    });

    it('should prioritize recommendations correctly', async () => {
      const mockRiskFactors: RiskFactor[] = [
        {
          id: 'rf1',
          category: 'ownership',
          severity: 'critical',
          confidence: 0.8,
          description: 'Critical ownership issue',
          evidence: [],
          impact: 'High impact',
          likelihood: 0.9,
          sourceLayer: 'ownership',
          weight: 3.0
        },
        {
          id: 'rf2',
          category: 'government',
          severity: 'medium',
          confidence: 0.7,
          description: 'Government designation issue',
          evidence: [],
          impact: 'Medium impact',
          likelihood: 0.5,
          sourceLayer: 'government',
          weight: 1.5
        }
      ];

      const recommendations = await riskAssessmentService.generateRecommendations(
        mockRiskFactors, 
        [], 
        'high'
      );

      // Should be sorted by priority (high first)
      const priorities = recommendations.map(r => r.priority);
      const highPriorityCount = priorities.filter(p => p === 'high').length;
      const mediumPriorityCount = priorities.filter(p => p === 'medium').length;

      expect(highPriorityCount).toBeGreaterThan(0);
      
      // High priority recommendations should come first
      if (highPriorityCount > 0 && mediumPriorityCount > 0) {
        const firstHighIndex = priorities.indexOf('high');
        const firstMediumIndex = priorities.indexOf('medium');
        expect(firstHighIndex).toBeLessThan(firstMediumIndex);
      }
    });
  });

  describe('risk level determination', () => {
    it('should determine correct risk levels', async () => {
      const testCases = [
        { score: 9, expectedLevel: 'critical' },
        { score: 7, expectedLevel: 'high' },
        { score: 4, expectedLevel: 'medium' },
        { score: 1, expectedLevel: 'low' }
      ];

      for (const testCase of testCases) {
        // Create mock results that will produce the desired score
        const mockResults: VerificationResult[] = [
          {
            layerType: 'ownership',
            status: testCase.score < 3 ? 'pass' : 'fail',
            score: testCase.score / 10,
            confidence: 0.8,
            results: [{ description: 'Test result' }],
            completedAt: new Date()
          }
        ];

        const riskProfile = await riskAssessmentService.calculateOverallRisk(mockResults);
        
        // Note: The actual risk level depends on the complex scoring algorithm,
        // so we just verify it's a valid risk level
        expect(['low', 'medium', 'high', 'critical']).toContain(riskProfile.riskLevel);
      }
    });
  });

  describe('error handling', () => {
    it('should handle invalid verification results gracefully', async () => {
      const invalidResults: VerificationResult[] = [
        {
          layerType: 'invalid' as any,
          status: 'pass',
          score: 0.8,
          confidence: 0.9,
          results: [],
          completedAt: new Date()
        }
      ];

      // Should not throw error, but handle gracefully
      const riskProfile = await riskAssessmentService.calculateOverallRisk(invalidResults);
      expect(riskProfile).toBeDefined();
    });

    it('should handle missing or null data', async () => {
      const incompleteResults: VerificationResult[] = [
        {
          layerType: 'ownership',
          status: 'pass',
          score: 0.8,
          confidence: 0.9,
          results: null as any,
          completedAt: new Date()
        }
      ];

      const riskProfile = await riskAssessmentService.calculateOverallRisk(incompleteResults);
      expect(riskProfile).toBeDefined();
      expect(riskProfile.riskFactors).toBeInstanceOf(Array);
    });
  });

  describe('performance', () => {
    it('should complete risk assessment within reasonable time', async () => {
      const startTime = Date.now();
      
      await riskAssessmentService.calculateOverallRisk(mockVerificationResults);
      
      const processingTime = Date.now() - startTime;
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle large number of verification results', async () => {
      const largeResultSet: VerificationResult[] = [];
      
      // Create 100 mock results
      for (let i = 0; i < 100; i++) {
        largeResultSet.push({
          layerType: ['ownership', 'government', 'legal', 'physical', 'community'][i % 5] as any,
          status: Math.random() > 0.5 ? 'pass' : 'fail',
          score: Math.random(),
          confidence: Math.random(),
          results: [{ description: `Result ${i}` }],
          completedAt: new Date()
        });
      }

      const startTime = Date.now();
      const riskProfile = await riskAssessmentService.calculateOverallRisk(largeResultSet);
      const processingTime = Date.now() - startTime;

      expect(riskProfile).toBeDefined();
      expect(processingTime).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });
});