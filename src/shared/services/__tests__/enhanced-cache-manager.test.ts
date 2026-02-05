/**
 * Enhanced Cache Manager Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { cacheService as enhancedCache } from "../CacheService"

describe('Enhanced Cache Manager', () => {
  beforeEach(() => {
    enhancedCache.clear();
  });

  describe('Basic Operations', () => {
    it('should set and get values', () => {
      const testData = { id: 1, name: 'Test' };
      
      enhancedCache.set('test-key', testData);
      const retrieved = enhancedCache.get('test-key');
      
      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent keys', () => {
      const result = enhancedCache.get('non-existent');
      expect(result).toBeNull();
    });

    it('should check if key exists', () => {
      enhancedCache.set('exists', 'value');
      
      expect(enhancedCache.has('exists')).toBe(true);
      expect(enhancedCache.has('not-exists')).toBe(false);
    });

    it('should delete entries', () => {
      enhancedCache.set('to-delete', 'value');
      expect(enhancedCache.has('to-delete')).toBe(true);
      
      const deleted = enhancedCache.delete('to-delete');
      expect(deleted).toBe(true);
      expect(enhancedCache.has('to-delete')).toBe(false);
    });

    it('should clear all entries', () => {
      enhancedCache.set('key1', 'value1');
      enhancedCache.set('key2', 'value2');
      
      enhancedCache.clear();
      
      expect(enhancedCache.has('key1')).toBe(false);
      expect(enhancedCache.has('key2')).toBe(false);
    });
  });

  describe('TTL Support', () => {
    it('should respect TTL values', async () => {
      enhancedCache.set('ttl-test', 'value', 100); // 100ms TTL
      
      expect(enhancedCache.get('ttl-test')).toBe('value');
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(enhancedCache.get('ttl-test')).toBeNull();
    });
  });

  describe('Statistics', () => {
    it('should track cache statistics', () => {
      // Generate some hits and misses
      enhancedCache.set('hit-test', 'value');
      enhancedCache.get('hit-test'); // hit
      enhancedCache.get('miss-test'); // miss
      
      const stats = enhancedCache.getStats();
      
      expect(stats.hits).toBeGreaterThan(0);
      expect(stats.misses).toBeGreaterThan(0);
      expect(stats.totalEntries).toBeGreaterThan(0);
      expect(typeof stats.hitRate).toBe('number');
    });
  });

  describe('Advanced Features', () => {
    it('should support getOrSet with factory function', async () => {
      const factory = vi.fn().mockResolvedValue('factory-value');
      
      // First call should use factory
      const result1 = await enhancedCache.getOrSet('factory-test', factory);
      expect(result1).toBe('factory-value');
      expect(factory).toHaveBeenCalledTimes(1);
      
      // Second call should use cache
      const result2 = await enhancedCache.getOrSet('factory-test', factory);
      expect(result2).toBe('factory-value');
      expect(factory).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should support warming cache with multiple entries', () => {
      const entries = [
        { key: 'warm1', data: 'value1', ttl: 1000 },
        { key: 'warm2', data: 'value2', ttl: 2000 }
      ];
      
      enhancedCache.warm(entries);
      
      expect(enhancedCache.get('warm1')).toBe('value1');
      expect(enhancedCache.get('warm2')).toBe('value2');
    });

    it('should get all cache keys', () => {
      enhancedCache.set('key1', 'value1');
      enhancedCache.set('key2', 'value2');
      
      const keys = enhancedCache.getKeys();
      
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys.length).toBe(2);
    });
  });

  describe('Export/Import', () => {
    it('should export and import cache data', () => {
      enhancedCache.set('export-test', 'export-value');
      
      const exported = enhancedCache.export();
      expect(exported).toHaveProperty('export-test');
      
      enhancedCache.clear();
      expect(enhancedCache.get('export-test')).toBeNull();
      
      enhancedCache.import(exported);
      expect(enhancedCache.get('export-test')).toBe('export-value');
    });
  });

  describe('Configuration', () => {
    it('should allow configuration updates', () => {
      const config = enhancedCache.getConfig();
      expect(config).toHaveProperty('maxSize');
      expect(config).toHaveProperty('defaultTTL');
      
      enhancedCache.updateConfig({
        defaultTTL: 60000,
        maxEntries: 500
      });
      
      const updatedConfig = enhancedCache.getConfig();
      expect(updatedConfig.defaultTTL).toBe(60000);
      expect(updatedConfig.maxEntries).toBe(500);
    });
  });

  describe('Instance Creation', () => {
    it('should use singleton cache service', () => {
      // The cache service is a singleton, so we test its behavior
      enhancedCache.set('singleton-test', 'singleton-value');
      
      expect(enhancedCache.get('singleton-test')).toBe('singleton-value');
    });
  });
});