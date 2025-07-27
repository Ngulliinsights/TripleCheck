import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { PropertyRepository } from './property.repository';

// Mock the database
vi.mock('../lib/database', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}));

// Mock drizzle-orm functions
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((column, value) => ({ column, value, type: 'eq' })),
  and: vi.fn((...conditions) => ({ conditions, type: 'and' })),
  desc: vi.fn((column) => ({ column, type: 'desc' })),
  asc: vi.fn((column) => ({ column, type: 'asc' })),
  sql: vi.fn((template, ...values) => ({ template, values, type: 'sql' })),
  like: vi.fn((column, pattern) => ({ column, pattern, type: 'like' })),
  gte: vi.fn((column, value) => ({ column, value, type: 'gte' })),
  lte: vi.fn((column, value) => ({ column, value, type: 'lte' })),
  inArray: vi.fn((column, values) => ({ column, values, type: 'inArray' }))
}));

describe('PropertyRepository Land Verification Integration', () => {
  let propertyRepository: PropertyRepository;
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    propertyRepository = new PropertyRepository();
    mockDb = require('../lib/database').db;
  });

  describe('findMany with land verification filters', () => {
    it('should filter properties by land verification status', async () => {
      const mockProperties = [
        {
          property: {
            id: 1,
            title: 'Verified Land Property',
            description: 'A verified land property',
            price: '100000',
            location: 'Nairobi'
          },
          landVerification: {
            sessionId: 1,
            status: 'completed',
            overallRiskScore: 20,
            riskLevel: 'low',
            confidence: '0.9',
            lastUpdated: new Date()
          }
        },
        {
          property: {
            id: 2,
            title: 'Unverified Property',
            description: 'An unverified property',
            price: '80000',
            location: 'Mombasa'
          },
          landVerification: {
            sessionId: null,
            status: null,
            overallRiskScore: null,
            riskLevel: null,
            confidence: null,
            lastUpdated: null
          }
        }
      ];

      const mockLayers = [
        { layerType: 'registry', status: 'completed' },
        { layerType: 'physical', status: 'completed' }
      ];

      // Mock the query builder chain
      const mockQueryBuilder = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(mockProperties)
      };

      mockDb.select.mockReturnValue(mockQueryBuilder);

      // Mock count query
      const mockCountQuery = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 2 }])
      };

      mockDb.select.mockReturnValueOnce(mockQueryBuilder);
      mockDb.select.mockReturnValueOnce(mockCountQuery);

      // Mock layers query for each property
      const mockLayersQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockLayers)
      };

      mockDb.select.mockReturnValue(mockLayersQuery);

      const filters = {
        landVerified: true,
        landRiskLevel: 'low',
        page: 1,
        limit: 10
      };

      const result = await propertyRepository.findMany(filters);

      expect(result.data).toHaveLength(2);
      expect(result.data[0].landVerification).toEqual({
        sessionId: '1',
        status: 'completed',
        overallRiskScore: 20,
        riskLevel: 'low',
        confidence: 0.9,
        completedLayers: ['registry', 'physical'],
        lastUpdated: expect.any(Date),
        badge: {
          type: 'verified',
          label: 'Land Verified',
          color: 'green',
          description: 'Property has completed comprehensive land verification with low risk'
        }
      });
    });

    it('should handle properties without land verification', async () => {
      const mockProperties = [
        {
          property: {
            id: 1,
            title: 'Property without verification',
            price: '50000',
            location: 'Kisumu'
          },
          landVerification: {
            sessionId: null,
            status: null,
            overallRiskScore: null,
            riskLevel: null,
            confidence: null,
            lastUpdated: null
          }
        }
      ];

      const mockQueryBuilder = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(mockProperties)
      };

      const mockCountQuery = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 1 }])
      };

      mockDb.select.mockReturnValueOnce(mockQueryBuilder);
      mockDb.select.mockReturnValueOnce(mockCountQuery);

      const result = await propertyRepository.findMany({});

      expect(result.data).toHaveLength(1);
      expect(result.data[0].landVerification).toBeNull();
    });

    it('should apply multiple filters including land verification', async () => {
      const mockQueryBuilder = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue([])
      };

      const mockCountQuery = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 0 }])
      };

      mockDb.select.mockReturnValueOnce(mockQueryBuilder);
      mockDb.select.mockReturnValueOnce(mockCountQuery);

      const filters = {
        query: 'land property',
        location: 'Nairobi',
        priceMin: 50000,
        priceMax: 200000,
        landVerified: true,
        landRiskLevel: 'low',
        sortBy: 'landVerification',
        sortOrder: 'desc'
      };

      await propertyRepository.findMany(filters);

      // Verify that the query builder methods were called
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalled();
      expect(mockQueryBuilder.limit).toHaveBeenCalled();
      expect(mockQueryBuilder.offset).toHaveBeenCalled();
    });

    it('should handle sorting by land verification score', async () => {
      const mockQueryBuilder = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue([])
      };

      const mockCountQuery = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 0 }])
      };

      mockDb.select.mockReturnValueOnce(mockQueryBuilder);
      mockDb.select.mockReturnValueOnce(mockCountQuery);

      await propertyRepository.findMany({
        sortBy: 'landVerification',
        sortOrder: 'asc'
      });

      expect(mockQueryBuilder.orderBy).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockDb.select.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const result = await propertyRepository.findMany({});

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        hasNext: false,
        hasPrev: false
      });
    });
  });

  describe('findById with land verification', () => {
    it('should return property with land verification data', async () => {
      const mockResult = {
        property: {
          id: 1,
          title: 'Test Property',
          description: 'A test property',
          price: '100000',
          location: 'Nairobi'
        },
        landVerification: {
          sessionId: 1,
          status: 'completed',
          overallRiskScore: 25,
          riskLevel: 'low',
          confidence: '0.85',
          lastUpdated: new Date()
        }
      };

      const mockLayers = [
        { layerType: 'registry', status: 'completed' },
        { layerType: 'physical', status: 'completed' },
        { layerType: 'community', status: 'in_progress' }
      ];

      const mockQueryBuilder = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockResult])
      };

      const mockLayersQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockLayers)
      };

      mockDb.select.mockReturnValueOnce(mockQueryBuilder);
      mockDb.select.mockReturnValueOnce(mockLayersQuery);

      const result = await propertyRepository.findById('1');

      expect(result).toEqual({
        ...mockResult.property,
        landVerification: {
          sessionId: '1',
          status: 'completed',
          overallRiskScore: 25,
          riskLevel: 'low',
          confidence: 0.85,
          completedLayers: ['registry', 'physical'],
          lastUpdated: mockResult.landVerification.lastUpdated,
          badge: {
            type: 'verified',
            label: 'Land Verified',
            color: 'green',
            description: 'Property has completed comprehensive land verification with low risk'
          }
        }
      });
    });

    it('should return property without land verification when none exists', async () => {
      const mockResult = {
        property: {
          id: 1,
          title: 'Test Property',
          price: '100000'
        },
        landVerification: {
          sessionId: null,
          status: null,
          overallRiskScore: null,
          riskLevel: null,
          confidence: null,
          lastUpdated: null
        }
      };

      const mockQueryBuilder = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockResult])
      };

      mockDb.select.mockReturnValue(mockQueryBuilder);

      const result = await propertyRepository.findById('1');

      expect(result).toEqual({
        ...mockResult.property,
        landVerification: null
      });
    });

    it('should return null when property not found', async () => {
      const mockQueryBuilder = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]) // No results
      };

      mockDb.select.mockReturnValue(mockQueryBuilder);

      const result = await propertyRepository.findById('999');

      expect(result).toBeNull();
    });

    it('should handle database errors in findById', async () => {
      mockDb.select.mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await propertyRepository.findById('1');

      expect(result).toBeNull();
    });
  });

  describe('findByOwner with land verification', () => {
    it('should return owner properties with land verification data', async () => {
      const mockResults = [
        {
          property: {
            id: 1,
            title: 'Owner Property 1',
            ownerId: 123
          },
          landVerification: {
            sessionId: 1,
            status: 'completed',
            overallRiskScore: 30,
            riskLevel: 'medium',
            confidence: '0.7',
            lastUpdated: new Date()
          }
        },
        {
          property: {
            id: 2,
            title: 'Owner Property 2',
            ownerId: 123
          },
          landVerification: {
            sessionId: null,
            status: null,
            overallRiskScore: null,
            riskLevel: null,
            confidence: null,
            lastUpdated: null
          }
        }
      ];

      const mockLayers = [
        { layerType: 'registry', status: 'completed' }
      ];

      const mockQueryBuilder = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockResults)
      };

      const mockLayersQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockLayers)
      };

      mockDb.select.mockReturnValueOnce(mockQueryBuilder);
      mockDb.select.mockReturnValue(mockLayersQuery);

      const result = await propertyRepository.findByOwner('123');

      expect(result).toHaveLength(2);
      expect(result[0].landVerification).toEqual({
        sessionId: '1',
        status: 'completed',
        overallRiskScore: 30,
        riskLevel: 'medium',
        confidence: 0.7,
        completedLayers: ['registry'],
        lastUpdated: expect.any(Date),
        badge: {
          type: 'verified',
          label: 'Land Verified - Medium Risk',
          color: 'blue',
          description: 'Property has completed land verification with medium risk factors identified'
        }
      });
      expect(result[1].landVerification).toBeNull();
    });

    it('should handle errors in findByOwner', async () => {
      mockDb.select.mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await propertyRepository.findByOwner('123');

      expect(result).toEqual([]);
    });
  });

  describe('Badge generation', () => {
    it('should generate correct badge for different verification states', () => {
      const repository = new PropertyRepository();

      // Test completed low risk
      let badge = (repository as any).generateLandVerificationBadge('completed', 'low');
      expect(badge).toEqual({
        type: 'verified',
        label: 'Land Verified',
        color: 'green',
        description: 'Property has completed comprehensive land verification with low risk'
      });

      // Test completed medium risk
      badge = (repository as any).generateLandVerificationBadge('completed', 'medium');
      expect(badge).toEqual({
        type: 'verified',
        label: 'Land Verified - Medium Risk',
        color: 'blue',
        description: 'Property has completed land verification with medium risk factors identified'
      });

      // Test completed high risk
      badge = (repository as any).generateLandVerificationBadge('completed', 'high');
      expect(badge).toEqual({
        type: 'high_risk',
        label: 'High Risk Property',
        color: 'red',
        description: 'Property has completed verification but significant risks were identified'
      });

      // Test in progress
      badge = (repository as any).generateLandVerificationBadge('in_progress', 'low');
      expect(badge).toEqual({
        type: 'in_progress',
        label: 'Verification In Progress',
        color: 'blue',
        description: 'Land verification is currently underway'
      });

      // Test failed
      badge = (repository as any).generateLandVerificationBadge('failed', 'medium');
      expect(badge).toEqual({
        type: 'expert_required',
        label: 'Expert Review Required',
        color: 'orange',
        description: 'Land verification requires expert attention'
      });

      // Test unknown status
      badge = (repository as any).generateLandVerificationBadge('unknown', 'low');
      expect(badge).toBeUndefined();
    });
  });

  describe('Sort column mapping', () => {
    it('should map sort columns correctly', () => {
      const repository = new PropertyRepository();

      // Test different sort options
      const priceColumn = (repository as any).getSortColumn('price');
      const dateColumn = (repository as any).getSortColumn('date');
      const landVerificationColumn = (repository as any).getSortColumn('landVerification');
      const trustScoreColumn = (repository as any).getSortColumn('trustScore');
      const defaultColumn = (repository as any).getSortColumn('unknown');

      // These would return the actual column objects in a real implementation
      expect(priceColumn).toBeDefined();
      expect(dateColumn).toBeDefined();
      expect(landVerificationColumn).toBeDefined();
      expect(trustScoreColumn).toBeDefined();
      expect(defaultColumn).toBeDefined();
    });
  });

  describe('CRUD operations', () => {
    it('should create property successfully', async () => {
      const mockProperty = {
        title: 'New Property',
        description: 'A new property',
        price: 150000,
        location: 'Nairobi',
        ownerId: 123
      };

      const mockCreatedProperty = {
        id: 1,
        ...mockProperty,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockInsertQuery = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockCreatedProperty])
      };

      mockDb.insert.mockReturnValue(mockInsertQuery);

      const result = await propertyRepository.create(mockProperty);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockInsertQuery.values).toHaveBeenCalled();
      expect(mockInsertQuery.returning).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedProperty);
    });

    it('should update property successfully', async () => {
      const updates = {
        title: 'Updated Property',
        landVerification: {
          status: 'completed',
          riskLevel: 'low'
        }
      };

      const mockUpdatedProperty = {
        id: 1,
        ...updates,
        updatedAt: new Date()
      };

      const mockUpdateQuery = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockUpdatedProperty])
      };

      mockDb.update.mockReturnValue(mockUpdateQuery);

      const result = await propertyRepository.update('1', updates);

      expect(mockDb.update).toHaveBeenCalled();
      expect(mockUpdateQuery.set).toHaveBeenCalledWith({
        ...updates,
        updatedAt: expect.any(Date)
      });
      expect(result).toEqual(mockUpdatedProperty);
    });

    it('should delete property successfully', async () => {
      const mockDeleteQuery = {
        where: vi.fn().mockResolvedValue(undefined)
      };

      mockDb.delete.mockReturnValue(mockDeleteQuery);

      const result = await propertyRepository.delete('1');

      expect(mockDb.delete).toHaveBeenCalled();
      expect(mockDeleteQuery.where).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should handle CRUD operation errors', async () => {
      // Test create error
      mockDb.insert.mockImplementation(() => {
        throw new Error('Insert failed');
      });

      await expect(propertyRepository.create({})).rejects.toThrow('Insert failed');

      // Test update error
      mockDb.update.mockImplementation(() => {
        throw new Error('Update failed');
      });

      await expect(propertyRepository.update('1', {})).rejects.toThrow('Update failed');

      // Test delete error
      mockDb.delete.mockImplementation(() => {
        throw new Error('Delete failed');
      });

      await expect(propertyRepository.delete('1')).rejects.toThrow('Delete failed');
    });
  });

  describe('Pagination and filtering edge cases', () => {
    it('should handle empty filter results', async () => {
      const mockQueryBuilder = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue([])
      };

      const mockCountQuery = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 0 }])
      };

      mockDb.select.mockReturnValueOnce(mockQueryBuilder);
      mockDb.select.mockReturnValueOnce(mockCountQuery);

      const result = await propertyRepository.findMany({
        landVerified: true,
        landRiskLevel: 'critical'
      });

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        hasNext: false,
        hasPrev: false
      });
    });

    it('should calculate pagination correctly', async () => {
      const mockQueryBuilder = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue([])
      };

      const mockCountQuery = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 25 }])
      };

      mockDb.select.mockReturnValueOnce(mockQueryBuilder);
      mockDb.select.mockReturnValueOnce(mockCountQuery);

      const result = await propertyRepository.findMany({
        page: 2,
        limit: 10
      });

      expect(result.total).toBe(25);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(true);
    });
  });
});