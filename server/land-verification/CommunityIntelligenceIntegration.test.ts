import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LandVerificationService } from './LandVerificationService';
import { CommunityIntelligenceService } from './CommunityIntelligenceService';
import { DocumentAuthService } from '../document-auth/DocumentAuthService';
import { db } from '../infrastructure/database/connection';

// Mock the database
vi.mock('../lib/database', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  }
}));

// Mock the logger
vi.mock('../logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }
}));

// Mock DocumentAuthService
vi.mock('../document-auth/DocumentAuthService', () => ({
  DocumentAuthService: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    verifyDocument: vi.fn().mockResolvedValue({ isValid: true, confidence: 0.9 })
  }))
}));

describe('Community Intelligence Integration', () => {
  let landVerificationService: LandVerificationService;
  let documentAuthService: DocumentAuthService;
  let mockDbSelect: any;
  let mockDbInsert: any;
  let mockDbUpdate: any;

  beforeEach(async () => {
    // Setup database mocks
    mockDbSelect = vi.fn();
    mockDbInsert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 1 }])
      })
    });
    mockDbUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([])
      })
    });

    (db.select as any) = mockDbSelect;
    (db.insert as any) = mockDbInsert;
    (db.update as any) = mockDbUpdate;

    // Create services
    documentAuthService = new DocumentAuthService();
    landVerificationService = new LandVerificationService(documentAuthService);

    await landVerificationService.initialize();
  });

  afterEach(async () => {
    await landVerificationService.shutdown();
    vi.clearAllMocks();
  });

  describe('Community Layer Execution', () => {
    beforeEach(() => {
      // Mock session and property data
      mockDbSelect.mockImplementation((table?: any) => {
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockImplementation(() => {
                // Mock session data
                if (table === 'landVerificationSessions') {
                  return Promise.resolve([{
                    id: 1,
                    propertyId: 1,
                    userId: 1,
                    status: 'in_progress'
                  }]);
                }
                // Mock property data
                if (table === 'properties') {
                  return Promise.resolve([{
                    id: 1,
                    title: 'Test Property',
                    location: 'Nairobi',
                    features: { propertyType: 'land' }
                  }]);
                }
                // Mock layer data
                return Promise.resolve([{
                  id: 1,
                  sessionId: 1,
                  layerType: 'community',
                  status: 'not_started'
                }]);
              }),
              orderBy: vi.fn().mockResolvedValue([]) // No existing feedback
            })
          })
        };
      });
    });

    it('should execute community verification layer successfully', async () => {
      const results = await landVerificationService.executeVerificationLayer('1', 'community');

      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);

      // Should have template generation result
      const templateResult = results.find(r => r.type === 'interview_templates');
      expect(templateResult).toBeDefined();
      expect(templateResult?.status).toBe('pass');
      expect(templateResult?.score).toBe(90);
      expect(templateResult?.description).toContain('interview templates');

      // Should have preparation result (no existing feedback)
      const preparationResult = results.find(r => r.type === 'community_preparation');
      expect(preparationResult).toBeDefined();
      expect(preparationResult?.status).toBe('warning');
      expect(preparationResult?.description).toContain('awaiting feedback collection');
    });

    it('should generate interview templates based on property characteristics', async () => {
      const results = await landVerificationService.executeVerificationLayer('1', 'community');

      const templateResult = results.find(r => r.type === 'interview_templates');
      expect(templateResult).toBeDefined();
      
      // Should indicate multiple templates generated (base + land-specific + location-specific)
      expect(templateResult?.details).toBeDefined();
      expect(templateResult?.details.length).toBeGreaterThan(0);
      expect(templateResult?.details[0]).toContain('minutes');
      expect(templateResult?.details[0]).toContain('sections');
    });

    it('should handle community analysis when feedback exists', async () => {
      // Mock existing community feedback
      mockDbSelect.mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 1,
              sessionId: 1,
              propertyId: 1,
              userId: 1,
              status: 'in_progress'
            }]),
            orderBy: vi.fn().mockResolvedValue([
              {
                id: 1,
                sessionId: 1,
                source: 'local_admin',
                reliability: '0.9',
                ownershipHistory: 'Family owned for 20 years',
                knownDisputes: ['Boundary issue'],
                landUsePatterns: ['Agriculture'],
                recentChanges: [],
                concerns: ['Water access']
              }
            ])
          })
        })
      }));

      const results = await landVerificationService.executeVerificationLayer('1', 'community');

      // Should have analysis result
      const analysisResult = results.find(r => r.type === 'community_analysis');
      expect(analysisResult).toBeDefined();
      expect(analysisResult?.description).toContain('Analyzed 1 community feedback');
      expect(analysisResult?.details).toContain('Reliability Score: 90.0%');
    });

    it('should identify and report risk indicators', async () => {
      // Mock feedback with risk indicators
      mockDbSelect.mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 1,
              sessionId: 1,
              propertyId: 1,
              userId: 1,
              status: 'in_progress'
            }]),
            orderBy: vi.fn().mockResolvedValue([
              {
                id: 1,
                sessionId: 1,
                source: 'local_admin',
                reliability: '0.8',
                ownershipHistory: 'Property was grabbed illegally',
                knownDisputes: ['Major court case', 'Boundary dispute'],
                landUsePatterns: ['Illegal encroachment'],
                recentChanges: [],
                concerns: ['Boundary issues with all neighbors']
              }
            ])
          })
        })
      }));

      const results = await landVerificationService.executeVerificationLayer('1', 'community');

      // Should have risk indicator results
      const riskResults = results.filter(r => r.type === 'risk_indicator');
      expect(riskResults.length).toBeGreaterThan(0);

      // Should have dispute risk indicator
      const disputeRisk = riskResults.find(r => r.description.includes('dispute'));
      expect(disputeRisk).toBeDefined();
      expect(disputeRisk?.status).toBe('warning'); // Medium severity
    });

    it('should calculate appropriate scores for community analysis', async () => {
      // Mock high-quality feedback
      mockDbSelect.mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 1,
              sessionId: 1,
              propertyId: 1,
              userId: 1,
              status: 'in_progress'
            }]),
            orderBy: vi.fn().mockResolvedValue([
              {
                id: 1,
                sessionId: 1,
                source: 'local_admin',
                reliability: '0.95',
                ownershipHistory: 'Stable family ownership for generations',
                knownDisputes: [],
                landUsePatterns: ['Agriculture', 'Residential'],
                recentChanges: ['Improved fencing'],
                concerns: []
              },
              {
                id: 2,
                sessionId: 1,
                source: 'community_leader',
                reliability: '0.9',
                ownershipHistory: 'Well-known family property',
                knownDisputes: [],
                landUsePatterns: ['Agriculture'],
                recentChanges: [],
                concerns: []
              }
            ])
          })
        })
      }));

      const results = await landVerificationService.executeVerificationLayer('1', 'community');

      const analysisResult = results.find(r => r.type === 'community_analysis');
      expect(analysisResult).toBeDefined();
      
      // High-quality feedback should result in high score
      expect(analysisResult?.score).toBeGreaterThan(80);
      expect(analysisResult?.status).toBe('pass');
      expect(analysisResult?.confidence).toBeGreaterThan(0.8);
    });

    it('should handle errors gracefully', async () => {
      // Mock database error
      mockDbSelect.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const results = await landVerificationService.executeVerificationLayer('1', 'community');

      expect(results).toBeDefined();
      expect(results.length).toBe(1);
      
      const errorResult = results[0];
      expect(errorResult.type).toBe('community_error');
      expect(errorResult.status).toBe('fail');
      expect(errorResult.score).toBe(0);
      expect(errorResult.description).toContain('Community verification failed');
    });
  });

  describe('Service Integration Events', () => {
    it('should emit events during community verification', async () => {
      const eventSpy = vi.fn();
      landVerificationService.on('layer_completed', eventSpy);

      // Mock successful execution
      mockDbSelect.mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 1,
              sessionId: 1,
              propertyId: 1,
              status: 'in_progress'
            }]),
            orderBy: vi.fn().mockResolvedValue([])
          })
        })
      }));

      await landVerificationService.executeVerificationLayer('1', 'community');

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: '1',
          layerType: 'community',
          results: expect.any(Array)
        })
      );
    });

    it('should update layer progress during execution', async () => {
      mockDbSelect.mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 1,
              sessionId: 1,
              layerType: 'community',
              status: 'not_started'
            }]),
            orderBy: vi.fn().mockResolvedValue([])
          })
        })
      }));

      await landVerificationService.executeVerificationLayer('1', 'community');

      // Should update layer status to in_progress
      expect(mockDbUpdate).toHaveBeenCalled();
      expect(mockDbUpdate().set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'in_progress',
          startedAt: expect.any(Date)
        })
      );
    });
  });

  describe('Template Generation Integration', () => {
    it('should generate appropriate templates for different property types', async () => {
      // Test land property
      mockDbSelect.mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 1,
              location: 'Nairobi',
              features: { propertyType: 'land' }
            }]),
            orderBy: vi.fn().mockResolvedValue([])
          })
        })
      }));

      const results = await landVerificationService.executeVerificationLayer('1', 'community');
      const templateResult = results.find(r => r.type === 'interview_templates');
      
      expect(templateResult?.description).toContain('3 interview templates'); // base + land + location

      // Test house property
      mockDbSelect.mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 1,
              location: 'Mombasa',
              features: { propertyType: 'house' }
            }]),
            orderBy: vi.fn().mockResolvedValue([])
          })
        })
      }));

      const houseResults = await landVerificationService.executeVerificationLayer('1', 'community');
      const houseTemplateResult = houseResults.find(r => r.type === 'interview_templates');
      
      expect(houseTemplateResult?.description).toContain('2 interview templates'); // base + location only
    });

    it('should cache templates for repeated requests', async () => {
      mockDbSelect.mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 1,
              location: 'Nairobi',
              features: { propertyType: 'land' }
            }]),
            orderBy: vi.fn().mockResolvedValue([])
          })
        })
      }));

      // First execution
      const results1 = await landVerificationService.executeVerificationLayer('1', 'community');
      const processingTime1 = results1.find(r => r.type === 'interview_templates')?.processingTime || 0;

      // Second execution (should use cache)
      const results2 = await landVerificationService.executeVerificationLayer('1', 'community');
      const processingTime2 = results2.find(r => r.type === 'interview_templates')?.processingTime || 0;

      // Second execution should be faster due to caching
      expect(processingTime2).toBeLessThanOrEqual(processingTime1);
    });
  });

  describe('Risk Assessment Integration', () => {
    it('should properly assess risk levels based on community feedback', async () => {
      // Mock critical risk feedback
      mockDbSelect.mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 1,
              sessionId: 1,
              propertyId: 1,
              status: 'in_progress'
            }]),
            orderBy: vi.fn().mockResolvedValue([
              {
                id: 1,
                sessionId: 1,
                source: 'local_admin',
                reliability: '0.9',
                ownershipHistory: 'Property grabbed through forged documents',
                knownDisputes: ['Criminal case pending', 'Civil suit filed', 'Injunction issued'],
                landUsePatterns: ['Illegal occupation'],
                recentChanges: [],
                concerns: ['Multiple ownership claims', 'Police involvement']
              }
            ])
          })
        })
      }));

      const results = await landVerificationService.executeVerificationLayer('1', 'community');

      const analysisResult = results.find(r => r.type === 'community_analysis');
      expect(analysisResult?.status).toBe('fail'); // Critical risks should fail

      const riskResults = results.filter(r => r.type === 'risk_indicator');
      expect(riskResults.some(r => r.status === 'fail')).toBe(true); // Should have failing risk indicators
    });

    it('should calculate risk indicator scores correctly', async () => {
      mockDbSelect.mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 1,
              sessionId: 1,
              propertyId: 1,
              status: 'in_progress'
            }]),
            orderBy: vi.fn().mockResolvedValue([
              {
                id: 1,
                sessionId: 1,
                source: 'neighbor',
                reliability: '0.6', // Lower reliability
                ownershipHistory: 'Suspicious rapid ownership changes',
                knownDisputes: ['Minor boundary issue'],
                landUsePatterns: [],
                recentChanges: [],
                concerns: []
              }
            ])
          })
        })
      }));

      const results = await landVerificationService.executeVerificationLayer('1', 'community');

      const riskResults = results.filter(r => r.type === 'risk_indicator');
      
      for (const riskResult of riskResults) {
        expect(riskResult.score).toBeGreaterThan(0);
        expect(riskResult.score).toBeLessThanOrEqual(100);
        
        // Lower reliability should result in lower scores
        expect(riskResult.confidence).toBeLessThanOrEqual(0.6);
      }
    });
  });
});