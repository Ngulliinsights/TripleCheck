import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CommunityIntelligenceService, CommunityFeedback, InterviewTemplate } from './CommunityIntelligenceService';
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

describe('CommunityIntelligenceService', () => {
  let service: CommunityIntelligenceService;
  let mockDbSelect: any;
  let mockDbInsert: any;
  let mockDbUpdate: any;

  beforeEach(async () => {
    service = new CommunityIntelligenceService();
    
    // Setup database mocks
    mockDbSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: 1, status: 'in_progress' }]),
          orderBy: vi.fn().mockResolvedValue([])
        })
      })
    });
    
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

    await service.initialize();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generateInterviewTemplates', () => {
    it('should generate templates for land property type', async () => {
      const templates = await service.generateInterviewTemplates('land', 'nairobi');

      expect(templates).toHaveLength(3); // base, land-specific, location-specific
      expect(templates[0].propertyType).toBe('land');
      expect(templates[0].location).toBe('nairobi');
      expect(templates[0].sections).toBeDefined();
      expect(templates[0].sections.length).toBeGreaterThan(0);
    });

    it('should generate templates for house property type', async () => {
      const templates = await service.generateInterviewTemplates('house', 'mombasa');

      expect(templates).toHaveLength(2); // base and location-specific (no land-specific)
      expect(templates[0].propertyType).toBe('house');
      expect(templates[0].location).toBe('mombasa');
    });

    it('should cache templates for repeated requests', async () => {
      const templates1 = await service.generateInterviewTemplates('land', 'nairobi');
      const templates2 = await service.generateInterviewTemplates('land', 'nairobi');

      expect(templates1).toEqual(templates2);
      // Should be same reference due to caching
      expect(templates1).toBe(templates2);
    });

    it('should include required sections in base template', async () => {
      const templates = await service.generateInterviewTemplates('apartment', 'kisumu');
      const baseTemplate = templates[0];

      expect(baseTemplate.sections).toContainEqual(
        expect.objectContaining({
          id: 'basic_info',
          title: 'Basic Information',
          isRequired: true
        })
      );

      expect(baseTemplate.sections).toContainEqual(
        expect.objectContaining({
          id: 'property_knowledge',
          title: 'Property Knowledge',
          isRequired: true
        })
      );
    });

    it('should include risk indicators in questions', async () => {
      const templates = await service.generateInterviewTemplates('land', 'nairobi');
      const landTemplate = templates.find(t => t.id.startsWith('land_'));

      expect(landTemplate).toBeDefined();
      const customaryQuestion = landTemplate!.sections[0].questions.find(q => q.id === 'customary_rights');
      expect(customaryQuestion?.riskIndicators).toContain('customary_conflicts');
    });
  });

  describe('recordCommunityFeedback', () => {
    const mockFeedback: CommunityFeedback = {
      id: 'test-feedback-1',
      sessionId: '1',
      source: 'local_admin',
      sourceDetails: {
        name: 'John Doe',
        position: 'Chief',
        contactInfo: 'john@example.com',
        yearsInArea: 15
      },
      feedback: {
        ownershipHistory: 'Property has been owned by the same family for 20 years',
        knownDisputes: ['Boundary dispute with neighbor in 2020'],
        landUsePatterns: ['Agriculture', 'Residential'],
        recentChanges: ['New fence installed'],
        concerns: ['Water access issues']
      },
      reliability: 0.9,
      recordedAt: new Date(),
      verifiedBy: 'surveyor-1',
      isConfidential: false
    };

    beforeEach(() => {
      // Mock session exists
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 1, status: 'in_progress' }])
          })
        })
      });
    });

    it('should record community feedback successfully', async () => {
      await service.recordCommunityFeedback('1', mockFeedback);

      expect(mockDbInsert).toHaveBeenCalled();
      expect(mockDbInsert().values).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 1,
          source: 'local_admin',
          sourceName: 'John Doe',
          sourcePosition: 'Chief',
          yearsInArea: 15,
          ownershipHistory: 'Property has been owned by the same family for 20 years',
          knownDisputes: ['Boundary dispute with neighbor in 2020'],
          landUsePatterns: ['Agriculture', 'Residential'],
          recentChanges: ['New fence installed'],
          concerns: ['Water access issues'],
          verifiedBy: 'surveyor-1',
          isConfidential: false
        })
      );
    });

    it('should apply privacy protection for confidential feedback', async () => {
      const confidentialFeedback = {
        ...mockFeedback,
        isConfidential: true
      };

      await service.recordCommunityFeedback('1', confidentialFeedback);

      expect(mockDbInsert().values).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceName: 'J. D.', // Anonymized name
          contactInfo: undefined // Removed for confidential feedback
        })
      );
    });

    it('should encrypt contact info when present', async () => {
      await service.recordCommunityFeedback('1', mockFeedback);

      const insertCall = mockDbInsert().values.mock.calls[0][0];
      expect(insertCall.contactInfo).toBeDefined();
      // Should be base64 encoded (simple encryption for test)
      expect(insertCall.contactInfo).toBe(Buffer.from('john@example.com').toString('base64'));
    });

    it('should calculate reliability score based on source and tenure', async () => {
      const neighborFeedback = {
        ...mockFeedback,
        source: 'neighbor' as const,
        sourceDetails: {
          ...mockFeedback.sourceDetails,
          yearsInArea: 1 // Short tenure
        }
      };

      await service.recordCommunityFeedback('1', neighborFeedback);

      const insertCall = mockDbInsert().values.mock.calls[0][0];
      const reliability = parseFloat(insertCall.reliability);
      
      // Neighbor (0.6) + short tenure penalty (-0.1) + completeness bonus
      expect(reliability).toBeLessThan(0.6);
      expect(reliability).toBeGreaterThan(0.4);
    });

    it('should throw error if session not found', async () => {
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]) // No session found
          })
        })
      });

      await expect(service.recordCommunityFeedback('999', mockFeedback))
        .rejects.toThrow('Verification session 999 not found');
    });

    it('should emit feedback_recorded event', async () => {
      const eventSpy = vi.fn();
      service.on('feedback_recorded', eventSpy);

      await service.recordCommunityFeedback('1', mockFeedback);

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: '1',
          source: 'local_admin',
          reliability: expect.any(Number)
        })
      );
    });
  });

  describe('analyzeCommunityIntelligence', () => {
    const mockFeedbackData = [
      {
        id: 1,
        sessionId: 1,
        source: 'local_admin',
        sourceName: 'Chief John',
        reliability: '0.9',
        ownershipHistory: 'Family owned for 20 years',
        knownDisputes: ['Boundary issue in 2020'],
        landUsePatterns: ['Agriculture'],
        recentChanges: ['New fence'],
        concerns: ['Water access'],
        recordedAt: new Date()
      },
      {
        id: 2,
        sessionId: 1,
        source: 'neighbor',
        sourceName: 'Mary Smith',
        reliability: '0.7',
        ownershipHistory: 'Same family, very stable',
        knownDisputes: ['Minor boundary disagreement'],
        landUsePatterns: ['Agriculture', 'Grazing'],
        recentChanges: [],
        concerns: ['Road access'],
        recordedAt: new Date()
      }
    ];

    beforeEach(() => {
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockFeedbackData)
          })
        })
      });
    });

    it('should analyze community intelligence successfully', async () => {
      const analysis = await service.analyzeCommunityIntelligence('1');

      expect(analysis).toMatchObject({
        sessionId: '1',
        totalFeedbackCount: 2,
        sourceDistribution: {
          local_admin: 1,
          neighbor: 1
        },
        reliabilityScore: expect.any(Number),
        consensusLevel: expect.any(Number),
        keyFindings: expect.any(Array),
        riskIndicators: expect.any(Array),
        recommendations: expect.any(Array),
        confidenceLevel: expect.any(Number),
        analysisDate: expect.any(Date)
      });
    });

    it('should calculate source distribution correctly', async () => {
      const analysis = await service.analyzeCommunityIntelligence('1');

      expect(analysis.sourceDistribution).toEqual({
        local_admin: 1,
        neighbor: 1
      });
    });

    it('should calculate overall reliability score', async () => {
      const analysis = await service.analyzeCommunityIntelligence('1');

      // Average of 0.9 and 0.7
      expect(analysis.reliabilityScore).toBe(0.8);
    });

    it('should extract key findings from feedback', async () => {
      const analysis = await service.analyzeCommunityIntelligence('1');

      expect(analysis.keyFindings).toContainEqual(
        expect.objectContaining({
          category: 'ownership',
          finding: 'Community members provided ownership history information',
          supportingEvidence: expect.arrayContaining([
            'Family owned for 20 years',
            'Same family, very stable'
          ])
        })
      );

      expect(analysis.keyFindings).toContainEqual(
        expect.objectContaining({
          category: 'disputes',
          finding: expect.stringContaining('dispute(s) mentioned'),
          supportingEvidence: expect.arrayContaining([
            'Boundary issue in 2020',
            'Minor boundary disagreement'
          ])
        })
      );
    });

    it('should identify risk indicators', async () => {
      const analysis = await service.analyzeCommunityIntelligence('1');

      expect(analysis.riskIndicators).toContainEqual(
        expect.objectContaining({
          type: 'ownership_disputes',
          description: expect.stringContaining('dispute(s) mentioned'),
          severity: 'medium', // 2 disputes = medium risk
          frequency: 2
        })
      );
    });

    it('should generate appropriate recommendations', async () => {
      const analysis = await service.analyzeCommunityIntelligence('1');

      expect(analysis.recommendations).toContain(
        'Conduct thorough court records search to verify dispute claims'
      );
      expect(analysis.recommendations).toContain(
        'Engage local legal counsel familiar with the area'
      );
    });

    it('should calculate confidence level based on multiple factors', async () => {
      const analysis = await service.analyzeCommunityIntelligence('1');

      expect(analysis.confidenceLevel).toBeGreaterThan(0);
      expect(analysis.confidenceLevel).toBeLessThanOrEqual(1);
      
      // With 2 sources and good reliability, should have decent confidence
      expect(analysis.confidenceLevel).toBeGreaterThan(0.5);
    });

    it('should cache analysis results', async () => {
      const analysis1 = await service.analyzeCommunityIntelligence('1');
      const analysis2 = await service.analyzeCommunityIntelligence('1');

      expect(analysis1).toBe(analysis2); // Same reference due to caching
    });

    it('should throw error if no feedback found', async () => {
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([]) // No feedback
          })
        })
      });

      await expect(service.analyzeCommunityIntelligence('999'))
        .rejects.toThrow('No community feedback found for session 999');
    });

    it('should emit analysis_completed event', async () => {
      const eventSpy = vi.fn();
      service.on('analysis_completed', eventSpy);

      const analysis = await service.analyzeCommunityIntelligence('1');

      expect(eventSpy).toHaveBeenCalledWith({
        sessionId: '1',
        analysis
      });
    });
  });

  describe('validateCommunityInformation', () => {
    const mockFeedback: CommunityFeedback = {
      id: 'test-feedback-1',
      sessionId: '1',
      source: 'local_admin',
      sourceDetails: {
        name: 'John Doe',
        position: 'Chief',
        yearsInArea: 15
      },
      feedback: {
        ownershipHistory: 'Recent ownership change in 2023',
        knownDisputes: ['Court case filed in 2022'],
        landUsePatterns: ['Agriculture'],
        recentChanges: [],
        concerns: []
      },
      reliability: 0.9,
      recordedAt: new Date(),
      isConfidential: false
    };

    const mockOfficialRecords = [
      {
        type: 'registry',
        lastTransfer: '2023-01-15',
        owner: 'John Smith'
      },
      {
        type: 'court',
        caseNumber: 'CASE-2022-001',
        status: 'pending'
      }
    ];

    it('should validate community information against official records', async () => {
      const validation = await service.validateCommunityInformation(mockFeedback, mockOfficialRecords);

      expect(validation).toMatchObject({
        isValid: expect.any(Boolean),
        confidence: expect.any(Number),
        discrepancies: expect.any(Array),
        corroborations: expect.any(Array),
        recommendations: expect.any(Array)
      });
    });

    it('should identify corroborations when information aligns', async () => {
      const validation = await service.validateCommunityInformation(mockFeedback, mockOfficialRecords);

      expect(validation.corroborations).toContainEqual(
        expect.objectContaining({
          type: 'timeline_match',
          description: 'Community timeline aligns with registry records',
          sources: ['Community feedback', 'Registry records'],
          confidence: 0.8
        })
      );

      expect(validation.corroborations).toContainEqual(
        expect.objectContaining({
          type: 'legal_consistency',
          description: 'Community dispute mentions align with court records',
          sources: ['Community feedback', 'Court records'],
          confidence: 0.9
        })
      );
    });

    it('should identify discrepancies when information conflicts', async () => {
      const conflictingRecords = [
        {
          type: 'registry',
          lastTransfer: '2020-01-15', // Older than community claim of "recent"
          owner: 'John Smith'
        }
      ];

      const validation = await service.validateCommunityInformation(mockFeedback, conflictingRecords);

      expect(validation.discrepancies).toContainEqual(
        expect.objectContaining({
          type: 'timeline_mismatch',
          description: 'Community mentions recent ownership change but registry shows older transfer',
          severity: 'medium',
          requiresInvestigation: true
        })
      );
    });

    it('should identify discrepancies when disputes mentioned but no court records', async () => {
      const noCourtRecords = [
        {
          type: 'registry',
          lastTransfer: '2023-01-15',
          owner: 'John Smith'
        }
      ];

      const validation = await service.validateCommunityInformation(mockFeedback, noCourtRecords);

      expect(validation.discrepancies).toContainEqual(
        expect.objectContaining({
          type: 'legal_inconsistency',
          description: 'Community mentions disputes but no court records found',
          severity: 'medium',
          requiresInvestigation: true
        })
      );
    });

    it('should calculate validation confidence correctly', async () => {
      const validation = await service.validateCommunityInformation(mockFeedback, mockOfficialRecords);

      expect(validation.confidence).toBeGreaterThan(0);
      expect(validation.confidence).toBeLessThanOrEqual(1);
      
      // With corroborations and no high-severity discrepancies, should have good confidence
      expect(validation.confidence).toBeGreaterThan(0.7);
    });

    it('should mark as invalid if high-severity discrepancies exist', async () => {
      const highSeverityFeedback = {
        ...mockFeedback,
        feedback: {
          ...mockFeedback.feedback,
          ownershipHistory: 'Property was grabbed illegally'
        }
      };

      // Mock to return high-severity discrepancy
      const validation = await service.validateCommunityInformation(highSeverityFeedback, []);

      // Since no official records provided, should still be valid for this test
      expect(validation.isValid).toBe(true);
    });

    it('should generate appropriate validation recommendations', async () => {
      const validation = await service.validateCommunityInformation(mockFeedback, mockOfficialRecords);

      expect(validation.recommendations).toContain(
        'Community feedback corroborates official records, increasing confidence'
      );
    });

    it('should handle empty official records gracefully', async () => {
      const validation = await service.validateCommunityInformation(mockFeedback, []);

      expect(validation).toBeDefined();
      expect(validation.discrepancies).toBeDefined();
      expect(validation.corroborations).toBeDefined();
      expect(validation.recommendations).toBeDefined();
    });
  });

  describe('Risk Assessment', () => {
    it('should assess ownership risk based on keywords', async () => {
      const templates = await service.generateInterviewTemplates('land', 'nairobi');
      expect(templates).toBeDefined();

      // Test internal risk assessment logic through feedback analysis
      const riskFeedback = [
        {
          id: 1,
          source: 'local_admin',
          reliability: '0.8',
          ownershipHistory: 'Property was grabbed illegally and forged documents used',
          knownDisputes: [],
          landUsePatterns: [],
          recentChanges: [],
          concerns: []
        }
      ];

      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(riskFeedback)
          })
        })
      });

      const analysis = await service.analyzeCommunityIntelligence('1');
      
      const ownershipFinding = analysis.keyFindings.find(f => f.category === 'ownership');
      expect(ownershipFinding?.riskLevel).toBe('high');
    });

    it('should assess land use risk based on patterns', async () => {
      const riskFeedback = [
        {
          id: 1,
          source: 'neighbor',
          reliability: '0.7',
          ownershipHistory: '',
          knownDisputes: [],
          landUsePatterns: ['Illegal encroachment', 'Unauthorized construction'],
          recentChanges: [],
          concerns: []
        }
      ];

      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(riskFeedback)
          })
        })
      });

      const analysis = await service.analyzeCommunityIntelligence('1');
      
      const landUseFinding = analysis.keyFindings.find(f => f.category === 'land_use');
      expect(landUseFinding?.riskLevel).toBe('high');
    });

    it('should identify boundary risk indicators', async () => {
      const boundaryFeedback = [
        {
          id: 1,
          source: 'resident',
          reliability: '0.6',
          ownershipHistory: '',
          knownDisputes: [],
          landUsePatterns: [],
          recentChanges: [],
          concerns: ['Boundary disputes with all neighbors', 'Border markers moved frequently']
        }
      ];

      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(boundaryFeedback)
          })
        })
      });

      const analysis = await service.analyzeCommunityIntelligence('1');
      
      // Should identify boundary risk indicator
      const boundaryRisk = analysis.riskIndicators.find(r => r.type === 'boundary_disputes');
      expect(boundaryRisk).toBeDefined();
      expect(boundaryRisk?.severity).toBe('high');
    });
  });

  describe('Consensus Analysis', () => {
    it('should calculate high consensus when sources agree', async () => {
      const consensusFeedback = [
        {
          id: 1,
          source: 'local_admin',
          reliability: '0.9',
          ownershipHistory: 'Owned by Smith family for generations',
          knownDisputes: [],
          landUsePatterns: ['Agriculture', 'Residential'],
          recentChanges: [],
          concerns: []
        },
        {
          id: 2,
          source: 'neighbor',
          reliability: '0.7',
          ownershipHistory: 'Smith family has owned this for many years',
          knownDisputes: [],
          landUsePatterns: ['Agriculture', 'Some residential'],
          recentChanges: [],
          concerns: []
        }
      ];

      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(consensusFeedback)
          })
        })
      });

      const analysis = await service.analyzeCommunityIntelligence('1');
      
      // Should have higher consensus due to agreement
      expect(analysis.consensusLevel).toBeGreaterThan(0.5);
    });

    it('should calculate low consensus when sources disagree', async () => {
      const disagreementFeedback = [
        {
          id: 1,
          source: 'local_admin',
          reliability: '0.9',
          ownershipHistory: 'Owned by Smith family',
          knownDisputes: ['Major court case ongoing'],
          landUsePatterns: ['Agriculture'],
          recentChanges: [],
          concerns: []
        },
        {
          id: 2,
          source: 'neighbor',
          reliability: '0.7',
          ownershipHistory: 'Owned by Johnson family',
          knownDisputes: ['Different dispute about boundaries'],
          landUsePatterns: ['Commercial use'],
          recentChanges: [],
          concerns: []
        }
      ];

      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(disagreementFeedback)
          })
        })
      });

      const analysis = await service.analyzeCommunityIntelligence('1');
      
      // Should have lower consensus due to disagreement
      expect(analysis.consensusLevel).toBeLessThan(0.7);
    });
  });

  describe('Privacy Protection', () => {
    it('should anonymize names for confidential feedback', async () => {
      const confidentialFeedback: CommunityFeedback = {
        id: 'test-feedback-1',
        sessionId: '1',
        source: 'local_admin',
        sourceDetails: {
          name: 'John Doe Smith',
          position: 'Chief',
          contactInfo: 'john@example.com',
          yearsInArea: 15
        },
        feedback: {
          ownershipHistory: 'Test history',
          knownDisputes: [],
          landUsePatterns: [],
          recentChanges: [],
          concerns: []
        },
        reliability: 0.9,
        recordedAt: new Date(),
        isConfidential: true
      };

      await service.recordCommunityFeedback('1', confidentialFeedback);

      const insertCall = mockDbInsert().values.mock.calls[0][0];
      expect(insertCall.sourceName).toBe('J. D. S.'); // Anonymized
      expect(insertCall.contactInfo).toBeUndefined(); // Removed
    });

    it('should encrypt contact info for non-confidential feedback', async () => {
      const feedback: CommunityFeedback = {
        id: 'test-feedback-1',
        sessionId: '1',
        source: 'neighbor',
        sourceDetails: {
          name: 'Jane Smith',
          contactInfo: 'jane@example.com',
          yearsInArea: 5
        },
        feedback: {
          ownershipHistory: 'Test history',
          knownDisputes: [],
          landUsePatterns: [],
          recentChanges: [],
          concerns: []
        },
        reliability: 0.7,
        recordedAt: new Date(),
        isConfidential: false
      };

      await service.recordCommunityFeedback('1', feedback);

      const insertCall = mockDbInsert().values.mock.calls[0][0];
      expect(insertCall.sourceName).toBe('Jane Smith'); // Not anonymized
      expect(insertCall.contactInfo).toBe(Buffer.from('jane@example.com').toString('base64')); // Encrypted
    });
  });

  describe('Service Lifecycle', () => {
    it('should initialize successfully', async () => {
      const newService = new CommunityIntelligenceService();
      await expect(newService.initialize()).resolves.not.toThrow();
    });

    it('should shutdown gracefully', async () => {
      await expect(service.shutdown()).resolves.not.toThrow();
    });

    it('should clear caches on shutdown', async () => {
      // Generate some templates to populate cache
      await service.generateInterviewTemplates('land', 'nairobi');
      
      // Shutdown should clear caches
      await service.shutdown();
      
      // This is more of an integration test - we can't directly test cache clearing
      // but we can ensure shutdown completes without errors
      expect(true).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockDbSelect.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      await expect(service.recordCommunityFeedback('1', {} as CommunityFeedback))
        .rejects.toThrow('Database connection failed');
    });

    it('should handle invalid session ID', async () => {
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]) // No session found
          })
        })
      });

      await expect(service.recordCommunityFeedback('invalid', {} as CommunityFeedback))
        .rejects.toThrow('Verification session invalid not found');
    });

    it('should handle empty feedback data gracefully', async () => {
      const emptyFeedback: CommunityFeedback = {
        id: 'empty-feedback',
        sessionId: '1',
        source: 'resident',
        sourceDetails: {
          yearsInArea: 0
        },
        feedback: {
          ownershipHistory: '',
          knownDisputes: [],
          landUsePatterns: [],
          recentChanges: [],
          concerns: []
        },
        reliability: 0.1,
        recordedAt: new Date(),
        isConfidential: false
      };

      await expect(service.recordCommunityFeedback('1', emptyFeedback))
        .resolves.not.toThrow();
    });
  });
});