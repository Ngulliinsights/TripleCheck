/**
 * CacheService Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cacheService } from "../../../src/shared/services/CacheService"

describe('CacheService', () => {
  beforeEach(() => {
    cacheService.clear();
    vi.clearAllMocks();
  });

  describe('basic operations', () => {
    it('should set and get cache entries', () => {
      const key = 'test-key';
      const data = { message: 'Hello, World!' };

      cacheService.set(key, data);
      const retrieved = cacheService.get(key);

      expect(retrieved).toEqual(data);
    });

    it('should return null for non-existent keys', () => {
      const result = cacheService.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should check if key exists', () => {
      const key = 'test-key';
      const data = { test: true };

      expect(cacheService.has(key)).toBe(false);
      
      cacheService.set(key, data);
      expect(cacheService.has(key)).toBe(true);
    });

    it('should delete cache entries', () => {
      const key = 'test-key';
      const data = { test: true };

      cacheService.set(key, data);
      expect(cacheService.has(key)).toBe(true);

      const deleted = cacheService.delete(key);
      expect(deleted).toBe(true);
      expect(cacheService.has(key)).toBe(false);
    });

    it('should clear all cache entries', () => {
      cacheService.set('key1', 'data1');
      cacheService.set('key2', 'data2');

      expect(cacheService.has('key1')).toBe(true);
      expect(cacheService.has('key2')).toBe(true);

      cacheService.clear();

      expect(cacheService.has('key1')).toBe(false);
      expect(cacheService.has('key2')).toBe(false);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire entries after TTL', async () => {
      const key = 'test-key';
      const data = { test: true };
      const ttl = 100; // 100ms

      cacheService.set(key, data, { ttl });
      expect(cacheService.get(key)).toEqual(data);

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(cacheService.get(key)).toBeNull();
      expect(cacheService.has(key)).toBe(false);
    });

    it('should use default TTL when not specified', () => {
      const key = 'test-key';
      const data = { test: true };

      cacheService.set(key, data);
      
      // Entry should exist immediately
      expect(cacheService.get(key)).toEqual(data);
    });
  });

  describe('tags and invalidation', () => {
    it('should invalidate entries by tags', () => {
      cacheService.set('key1', 'data1', { tags: ['tag1', 'tag2'] });
      cacheService.set('key2', 'data2', { tags: ['tag2', 'tag3'] });
      cacheService.set('key3', 'data3', { tags: ['tag3'] });

      expect(cacheService.has('key1')).toBe(true);
      expect(cacheService.has('key2')).toBe(true);
      expect(cacheService.has('key3')).toBe(true);

      const invalidated = cacheService.invalidateByTags(['tag2']);
      expect(invalidated).toBe(2); // key1 and key2 should be invalidated

      expect(cacheService.has('key1')).toBe(false);
      expect(cacheService.has('key2')).toBe(false);
      expect(cacheService.has('key3')).toBe(true);
    });

    it('should get entries by tag', () => {
      cacheService.set('key1', 'data1', { tags: ['tag1'] });
      cacheService.set('key2', 'data2', { tags: ['tag1', 'tag2'] });
      cacheService.set('key3', 'data3', { tags: ['tag2'] });

      const tag1Entries = cacheService.getByTag('tag1');
      expect(tag1Entries).toHaveLength(2);
      expect(tag1Entries.map(e => e.key)).toEqual(['key1', 'key2']);

      const tag2Entries = cacheService.getByTag('tag2');
      expect(tag2Entries).toHaveLength(2);
      expect(tag2Entries.map(e => e.key)).toEqual(['key2', 'key3']);
    });
  });

  describe('getOrSet functionality', () => {
    it('should return cached value if exists', async () => {
      const key = 'test-key';
      const cachedData = { cached: true };
      const factory = vi.fn().mockResolvedValue({ fresh: true });

      cacheService.set(key, cachedData);

      const result = await cacheService.getOrSet(key, factory);

      expect(result).toEqual(cachedData);
      expect(factory).not.toHaveBeenCalled();
    });

    it('should call factory and cache result if not exists', async () => {
      const key = 'test-key';
      const freshData = { fresh: true };
      const factory = vi.fn().mockResolvedValue(freshData);

      const result = await cacheService.getOrSet(key, factory);

      expect(result).toEqual(freshData);
      expect(factory).toHaveBeenCalledOnce();
      expect(cacheService.get(key)).toEqual(freshData);
    });

    it('should handle factory errors', async () => {
      const key = 'test-key';
      const error = new Error('Factory failed');
      const factory = vi.fn().mockRejectedValue(error);

      await expect(cacheService.getOrSet(key, factory)).rejects.toThrow('Factory failed');
      expect(cacheService.has(key)).toBe(false);
    });
  });

  describe('statistics', () => {
    it('should track cache statistics', () => {
      const stats = cacheService.getStats();
      
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('totalEntries');
      expect(stats).toHaveProperty('totalSize');
    });

    it('should update hit/miss statistics', () => {
      const key = 'test-key';
      const data = { test: true };

      // Miss
      cacheService.get('non-existent');
      let stats = cacheService.getStats();
      expect(stats.misses).toBeGreaterThan(0);

      // Hit
      cacheService.set(key, data);
      cacheService.get(key);
      stats = cacheService.getStats();
      expect(stats.hits).toBeGreaterThan(0);
    });
  });

  describe('preloading', () => {
    it('should preload multiple entries', async () => {
      const entries = [
        {
          key: 'key1',
          factory: vi.fn().mockResolvedValue('data1'),
          options: { tags: ['preload'] }
        },
        {
          key: 'key2',
          factory: vi.fn().mockResolvedValue('data2'),
          options: { tags: ['preload'] }
        }
      ];

      await cacheService.preload(entries);

      expect(cacheService.get('key1')).toBe('data1');
      expect(cacheService.get('key2')).toBe('data2');
      expect(entries[0].factory).toHaveBeenCalledOnce();
      expect(entries[1].factory).toHaveBeenCalledOnce();
    });

    it('should skip preloading for existing entries', async () => {
      const key = 'existing-key';
      cacheService.set(key, 'existing-data');

      const entries = [
        {
          key,
          factory: vi.fn().mockResolvedValue('new-data')
        }
      ];

      await cacheService.preload(entries);

      expect(cacheService.get(key)).toBe('existing-data');
      expect(entries[0].factory).not.toHaveBeenCalled();
    });
  });

  describe('import/export', () => {
    it('should export cache data', () => {
      cacheService.set('key1', 'data1', { tags: ['export'] });
      cacheService.set('key2', 'data2', { ttl: 60000 });

      const exported = cacheService.export();

      expect(exported).toHaveProperty('key1');
      expect(exported).toHaveProperty('key2');
      expect(exported.key1.data).toBe('data1');
      expect(exported.key2.data).toBe('data2');
    });

    it('should import cache data', () => {
      const importData = {
        'key1': {
          data: 'imported-data1',
          timestamp: Date.now(),
          ttl: 60000,
          tags: ['imported']
        },
        'key2': {
          data: 'imported-data2',
          timestamp: Date.now(),
          ttl: 60000,
          tags: []
        }
      };

      cacheService.import(importData);

      expect(cacheService.get('key1')).toBe('imported-data1');
      expect(cacheService.get('key2')).toBe('imported-data2');
    });
  });
});