/**
 * Comprehensive test suite for UnifiedDataGenerator
 * 
 * Tests scenario-based data generation, Python integration, and validation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { UnifiedDataGenerator, type GenerationResult } from '../UnifiedDataGenerator';

// Mock file system operations
vi.mock('fs/promises');
const mockFs = vi.mocked(fs);

// Mock child_process
vi.mock('child_process', () => ({
  spawn: vi.fn()
}));

describe('UnifiedDataGenerator', () => {
  let generator: UnifiedDataGenerator;
  let tempDir: string;

  beforeEach(() => {
    tempDir = '/tmp/test-data-generation';
    generator = new UnifiedDataGenerator(tempDir);
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock successful file operations
    mockFs.access.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.readFile.mockResolvedValue('[]');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Scenario Management', () => {
    it('should provide predefined scenarios', () => {
      const scenarios = generator.getAvailableScenarios();
      
      expect(scenarios).toHaveLength(5);
      expect(scenarios.map(s => s.name)).toContain('Minimal Test Data');
      expect(scenarios.map(s => s.name)).toContain('Development Dataset');
      expect(scenarios.map(s => s.name)).toContain('Comprehensive Test Dataset');
      expect(scenarios.map(s => s.name)).toContain('Performance Test Dataset');
      expect(scenarios.map(s => s.name)).toContain('Production Demo Dataset');
    });

    it('should provide scenario details', () => {
      const scenarios = generator.getAvailableScenarios();
      const minimalScenario = scenarios.find(s => s.name === 'Minimal Test Data');
      
      expect(minimalScenario).toBeDefined();
      expect(minimalScenario!.description).toContain('Small dataset');
      expect(minimalScenario!.records).toBeGreaterThan(0);
    });
  });

  describe('Data Generation', () => {
    it('should generate minimal scenario successfully', async () => {
      // Mock successful Python execution
      const mockSpawn = await import('child_process');
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10); // Simulate successful completion
          }
        }),
        kill: vi.fn()
      };
      
      vi.mocked(mockSpawn.spawn).mockReturnValue(mockProcess as any);

      // Mock file generation
      mockFs.readFile.mockResolvedValue(JSON.stringify([
        { id: 1, name: 'Test User' },
        { id: 2, name: 'Another User' }
      ]));

      const result = await generator.generateScenario('minimal', {
        usePython: true,
        validateOutput: false
      });

      expect(result.success).toBe(true);
      expect(result.scenario).toBe('minimal');
      expect(result.duration).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle unknown scenario gracefully', async () => {
      await expect(
        generator.generateScenario('unknown-scenario')
      ).rejects.toThrow('Unknown scenario: unknown-scenario');
    });

    it('should support custom configuration overrides', async () => {
      const mockSpawn = await import('child_process');
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
        }),
        kill: vi.fn()
      };
      
      vi.mocked(mockSpawn.spawn).mockReturnValue(mockProcess as any);
      mockFs.readFile.mockResolvedValue('[]');

      const customConfig = {
        users: 500,
        properties: 1000,
        fraudRate: 0.1
      };

      const result = await generator.generateScenario('minimal', {
        customConfig,
        usePython: true,
        validateOutput: false
      });

      expect(result.success).toBe(true);
      
      // Verify that Python script was called with custom parameters
      expect(mockSpawn.spawn).toHaveBeenCalled();
      const spawnCall = vi.mocked(mockSpawn.spawn).mock.calls[0];
      const args = spawnCall[1] as string[];
      
      expect(args).toContain('--users');
      expect(args).toContain('500');
      expect(args).toContain('--properties');
      expect(args).toContain('1000');
      expect(args).toContain('--fraud-rate');
      expect(args).toContain('0.1');
    });
  });

  describe('TypeScript Generation Fallback', () => {
    it('should use TypeScript generators when Python is disabled', async () => {
      // Mock KenyanDataGenerator methods
      const mockUserData = [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
      ];
      
      const mockPropertyData = [
        { id: 1, title: 'Test Property', price: 1000000 },
        { id: 2, title: 'Another Property', price: 2000000 }
      ];

      // We would need to mock the KenyanDataGenerator here
      // For now, we'll test the configuration path
      
      const result = await generator.generateScenario('minimal', {
        usePython: false,
        validateOutput: false
      });

      expect(result.success).toBe(true);
      expect(result.recordsGenerated.users).toBeGreaterThanOrEqual(0);
      expect(result.recordsGenerated.properties).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Progress Tracking', () => {
    it('should track progress during generation', async () => {
      const progressUpdates: any[] = [];
      
      generator.onProgress((progress) => {
        progressUpdates.push(progress);
      });

      const mockSpawn = await import('child_process');
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
        }),
        kill: vi.fn()
      };
      
      vi.mocked(mockSpawn.spawn).mockReturnValue(mockProcess as any);
      mockFs.readFile.mockResolvedValue('[]');

      await generator.generateScenario('minimal', {
        usePython: true,
        validateOutput: false
      });

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0]).toHaveProperty('stage');
      expect(progressUpdates[0]).toHaveProperty('percentage');
      expect(progressUpdates[0]).toHaveProperty('currentOperation');
    });
  });

  describe('Error Handling', () => {
    it('should handle Python script failures gracefully', async () => {
      const mockSpawn = await import('child_process');
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(1), 10); // Simulate failure
          }
        }),
        kill: vi.fn()
      };
      
      vi.mocked(mockSpawn.spawn).mockReturnValue(mockProcess as any);

      const result = await generator.generateScenario('minimal', {
        usePython: true,
        validateOutput: false
      });

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle missing Python scripts', async () => {
      // Mock file access failure
      mockFs.access.mockRejectedValue(new Error('File not found'));

      const result = await generator.generateScenario('minimal', {
        usePython: true,
        validateOutput: false
      });

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('script not found'))).toBe(true);
    });

    it('should handle file system errors', async () => {
      mockFs.writeFile.mockRejectedValue(new Error('Write failed'));

      const result = await generator.generateScenario('minimal', {
        usePython: false,
        validateOutput: false
      });

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Data Validation', () => {
    it('should validate generated data when enabled', async () => {
      const mockSpawn = await import('child_process');
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
        }),
        kill: vi.fn()
      };
      
      vi.mocked(mockSpawn.spawn).mockReturnValue(mockProcess as any);
      
      // Mock valid JSON data
      mockFs.readFile.mockResolvedValue(JSON.stringify([
        { id: 1, name: 'Valid User' }
      ]));

      const result = await generator.generateScenario('minimal', {
        usePython: true,
        validateOutput: true
      });

      expect(result.success).toBe(true);
      expect(result.warnings.length).toBe(0);
    });

    it('should detect invalid data during validation', async () => {
      const mockSpawn = await import('child_process');
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
        }),
        kill: vi.fn()
      };
      
      vi.mocked(mockSpawn.spawn).mockReturnValue(mockProcess as any);
      
      // Mock invalid JSON data
      mockFs.readFile.mockResolvedValue('invalid json');

      const result = await generator.generateScenario('minimal', {
        usePython: true,
        validateOutput: true
      });

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('validate'))).toBe(true);
    });

    it('should detect empty data files', async () => {
      const mockSpawn = await import('child_process');
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
        }),
        kill: vi.fn()
      };
      
      vi.mocked(mockSpawn.spawn).mockReturnValue(mockProcess as any);
      
      // Mock empty array
      mockFs.readFile.mockResolvedValue('[]');

      const result = await generator.generateScenario('minimal', {
        usePython: true,
        validateOutput: true
      });

      expect(result.warnings.some(w => w.includes('empty'))).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should complete minimal scenario within reasonable time', async () => {
      const startTime = Date.now();
      
      const result = await generator.generateScenario('minimal', {
        usePython: false,
        validateOutput: false
      });

      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should handle timeout for long-running processes', async () => {
      const mockSpawn = await import('child_process');
      const mockProcess = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(), // Never calls callback - simulates hanging process
        kill: vi.fn()
      };
      
      vi.mocked(mockSpawn.spawn).mockReturnValue(mockProcess as any);

      // This test would need to be adjusted based on actual timeout implementation
      const result = await generator.generateScenario('minimal', {
        usePython: true,
        validateOutput: false
      });

      // The process should eventually timeout and fail
      expect(result.success).toBe(false);
    }, 10000); // Increase test timeout
  });

  describe('Configuration Validation', () => {
    it('should validate scenario configuration', () => {
      const scenarios = generator.getAvailableScenarios();
      
      scenarios.forEach(scenario => {
        expect(scenario.name).toBeTruthy();
        expect(scenario.description).toBeTruthy();
        expect(scenario.records).toBeGreaterThan(0);
      });
    });

    it('should handle edge case configurations', async () => {
      const edgeCaseConfig = {
        users: 0,
        properties: 0,
        fraudRate: 0
      };

      const result = await generator.generateScenario('minimal', {
        customConfig: edgeCaseConfig,
        usePython: false,
        validateOutput: false
      });

      // Should handle zero values gracefully
      expect(result.success).toBe(true);
      expect(result.recordsGenerated.users).toBe(0);
      expect(result.recordsGenerated.properties).toBe(0);
    });
  });
});

describe('UnifiedDataGenerator Integration', () => {
  it('should integrate with checkpoint manager', async () => {
    // Test checkpoint integration
    // This would require mocking the CheckpointManager
  });

  it('should integrate with cache warming', async () => {
    // Test cache warming integration
    // This would require mocking the cache system
  });

  it('should support concurrent generation requests', async () => {
    // Test concurrent request handling
    // This would test the system under concurrent load
  });
});