import { Request, Response, NextFunction } from 'express';
import { 
  createDeduplicationMiddleware, 
  addRequestIdMiddleware, 
  idempotencyMiddleware,
  DeduplicatedRequest 
} from '../deduplication.middleware';
import { RequestDeduplicator } from '../../infrastructure/deduplication/RequestDeduplicator';
import { CacheService } from '../../infrastructure/cache/CacheService';

// Mock dependencies
jest.mock('../../infrastructure/deduplication/RequestDeduplicator');
jest.mock('../../infrastructure/cache/CacheService');

describe('Deduplication Middleware', () => {
  let mockReq: Partial<DeduplicatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let mockDeduplicator: jest.Mocked<RequestDeduplicator>;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      path: '/api/test',
      originalUrl: '/api/test?param=value',
      headers: {
        'content-type': 'application/json',
        'accept': 'application/json'
      },
      body: {},
      session: { userId: 123 }
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      on: jest.fn()
    };

    mockNext = jest.fn();

    mockDeduplicator = {
      handleIdempotentRequest: jest.fn(),
      generateRequestHash: jest.fn().mockReturnValue('test-hash'),
      shouldDeduplicate: jest.fn().mockReturnValue(true),
      generateIdempotencyKey: jest.fn(),
      clearCache: jest.fn(),
      getStats: jest.fn()
    } as any;

    (RequestDeduplicator.getInstance as jest.Mock).mockReturnValue(mockDeduplicator);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createDeduplicationMiddleware', () => {
    it('should skip deduplication when disabled', async () => {
      const middleware = createDeduplicationMiddleware({ enabled: false });

      await middleware(mockReq as DeduplicatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockDeduplicator.handleIdempotentRequest).not.toHaveBeenCalled();
    });

    it('should skip deduplication for skip patterns', async () => {
      const middleware = createDeduplicationMiddleware({
        skipPatterns: [/^\/api\/test$/]
      });

      await middleware(mockReq as DeduplicatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockDeduplicator.handleIdempotentRequest).not.toHaveBeenCalled();
    });

    it('should add deduplication info to request', async () => {
      const middleware = createDeduplicationMiddleware();
      mockDeduplicator.shouldDeduplicate.mockReturnValue(false);

      await middleware(mockReq as DeduplicatedRequest, mockRes as Response, mockNext);

      expect(mockReq.deduplication).toBeDefined();
      expect(mockReq.deduplication?.key).toContain('GET|/api/test');
      expect(mockReq.deduplication?.hash).toBe('test-hash');
      expect(mockReq.deduplication?.shouldDeduplicate).toBe(false);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should handle idempotent requests', async () => {
      const middleware = createDeduplicationMiddleware();
      mockDeduplicator.shouldDeduplicate.mockReturnValue(true);
      mockDeduplicator.handleIdempotentRequest.mockResolvedValue({
        data: { result: 'cached' },
        status: 200,
        fromCache: true
      });

      await middleware(mockReq as DeduplicatedRequest, mockRes as Response, mockNext);

      expect(mockDeduplicator.handleIdempotentRequest).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        result: 'cached',
        cached: true,
        requestId: expect.any(String)
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should continue with normal processing for non-cached results', async () => {
      const middleware = createDeduplicationMiddleware();
      mockDeduplicator.shouldDeduplicate.mockReturnValue(true);
      mockDeduplicator.handleIdempotentRequest.mockResolvedValue({
        data: { result: 'fresh' },
        status: 200,
        fromCache: false
      });

      await middleware(mockReq as DeduplicatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should include user ID in deduplication key when configured', async () => {
      const middleware = createDeduplicationMiddleware({ includeUserInKey: true });
      mockDeduplicator.shouldDeduplicate.mockReturnValue(false);

      await middleware(mockReq as DeduplicatedRequest, mockRes as Response, mockNext);

      expect(mockReq.deduplication?.key).toContain('user:123');
    });

    it('should exclude user ID when not configured', async () => {
      const middleware = createDeduplicationMiddleware({ includeUserInKey: false });
      mockDeduplicator.shouldDeduplicate.mockReturnValue(false);

      await middleware(mockReq as DeduplicatedRequest, mockRes as Response, mockNext);

      expect(mockReq.deduplication?.key).not.toContain('user:123');
    });

    it('should include relevant headers in deduplication key', async () => {
      const middleware = createDeduplicationMiddleware({
        includeHeaders: ['content-type', 'accept']
      });
      mockDeduplicator.shouldDeduplicate.mockReturnValue(false);

      await middleware(mockReq as DeduplicatedRequest, mockRes as Response, mockNext);

      expect(mockReq.deduplication?.key).toContain('headers:');
    });

    it('should force deduplication for force patterns', async () => {
      mockReq.path = '/api/analytics/events';
      const middleware = createDeduplicationMiddleware({
        forcePatterns: [/^\/api\/analytics\/events$/]
      });
      mockDeduplicator.shouldDeduplicate.mockReturnValue(false);

      await middleware(mockReq as DeduplicatedRequest, mockRes as Response, mockNext);

      expect(mockReq.deduplication?.shouldDeduplicate).toBe(true);
    });

    it('should handle middleware errors gracefully', async () => {
      const middleware = createDeduplicationMiddleware();
      mockDeduplicator.shouldDeduplicate.mockImplementation(() => {
        throw new Error('Deduplication error');
      });

      await middleware(mockReq as DeduplicatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should skip deduplication for PATCH requests', async () => {
      mockReq.method = 'PATCH';
      const middleware = createDeduplicationMiddleware();

      await middleware(mockReq as DeduplicatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockDeduplicator.handleIdempotentRequest).not.toHaveBeenCalled();
    });

    it('should skip deduplication when x-no-deduplication header is present', async () => {
      mockReq.headers!['x-no-deduplication'] = 'true';
      const middleware = createDeduplicationMiddleware();

      await middleware(mockReq as DeduplicatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockDeduplicator.handleIdempotentRequest).not.toHaveBeenCalled();
    });

    it('should include body hash for POST requests', async () => {
      mockReq.method = 'POST';
      mockReq.body = { data: 'test-data' };
      const middleware = createDeduplicationMiddleware();
      mockDeduplicator.shouldDeduplicate.mockReturnValue(false);

      await middleware(mockReq as DeduplicatedRequest, mockRes as Response, mockNext);

      expect(mockReq.deduplication?.key).toContain('body:');
    });
  });

  describe('addRequestIdMiddleware', () => {
    it('should add request ID when not present', () => {
      const middleware = addRequestIdMiddleware();

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.headers!['x-request-id']).toBeDefined();
      expect(mockRes.setHeader).toHaveBeenCalledWith('x-request-id', mockReq.headers!['x-request-id']);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should preserve existing request ID', () => {
      const existingId = 'existing-request-id';
      mockReq.headers!['x-request-id'] = existingId;
      const middleware = addRequestIdMiddleware();

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.headers!['x-request-id']).toBe(existingId);
      expect(mockRes.setHeader).toHaveBeenCalledWith('x-request-id', existingId);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('idempotencyMiddleware', () => {
    it('should validate and add idempotency key', () => {
      const validKey = '550e8400-e29b-41d4-a716-446655440000'; // Valid UUID
      mockReq.headers!['idempotency-key'] = validKey;
      const middleware = idempotencyMiddleware();

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect((mockReq as any).idempotencyKey).toBe(validKey);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should accept valid hash as idempotency key', () => {
      const validHash = 'abcdef1234567890abcdef1234567890'; // Valid hash
      mockReq.headers!['idempotency-key'] = validHash;
      const middleware = idempotencyMiddleware();

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect((mockReq as any).idempotencyKey).toBe(validHash);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should reject invalid idempotency key', () => {
      const invalidKey = 'invalid-key';
      mockReq.headers!['idempotency-key'] = invalidKey;
      const middleware = idempotencyMiddleware();

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid idempotency key format',
        message: 'Idempotency key must be a valid UUID or hash'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should continue without idempotency key when not provided', () => {
      const middleware = idempotencyMiddleware();

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect((mockReq as any).idempotencyKey).toBeUndefined();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('deduplication key generation', () => {
    it('should generate consistent keys for same request parameters', async () => {
      const middleware = createDeduplicationMiddleware();
      mockDeduplicator.shouldDeduplicate.mockReturnValue(false);

      // First request
      await middleware(mockReq as DeduplicatedRequest, mockRes as Response, mockNext);
      const key1 = mockReq.deduplication?.key;

      // Reset request object
      delete mockReq.deduplication;

      // Second identical request
      await middleware(mockReq as DeduplicatedRequest, mockRes as Response, mockNext);
      const key2 = mockReq.deduplication?.key;

      expect(key1).toBe(key2);
    });

    it('should generate different keys for different methods', async () => {
      const middleware = createDeduplicationMiddleware();
      mockDeduplicator.shouldDeduplicate.mockReturnValue(false);

      // GET request
      mockReq.method = 'GET';
      await middleware(mockReq as DeduplicatedRequest, mockRes as Response, mockNext);
      const getKey = mockReq.deduplication?.key;

      // Reset and change to POST
      delete mockReq.deduplication;
      mockReq.method = 'POST';
      await middleware(mockReq as DeduplicatedRequest, mockRes as Response, mockNext);
      const postKey = mockReq.deduplication?.key;

      expect(getKey).not.toBe(postKey);
    });

    it('should generate different keys for different paths', async () => {
      const middleware = createDeduplicationMiddleware();
      mockDeduplicator.shouldDeduplicate.mockReturnValue(false);

      // First path
      mockReq.path = '/api/test1';
      await middleware(mockReq as DeduplicatedRequest, mockRes as Response, mockNext);
      const key1 = mockReq.deduplication?.key;

      // Reset and change path
      delete mockReq.deduplication;
      mockReq.path = '/api/test2';
      await middleware(mockReq as DeduplicatedRequest, mockRes as Response, mockNext);
      const key2 = mockReq.deduplication?.key;

      expect(key1).not.toBe(key2);
    });
  });
});