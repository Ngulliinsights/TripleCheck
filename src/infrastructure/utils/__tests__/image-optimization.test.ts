/**
 * IMAGE OPTIMIZATION UTILITIES TESTS
 * ===================================
 * 
 * Tests for image optimization utilities including responsive srcset generation,
 * format detection, and blur placeholder creation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateResponsiveSrcSet,
  detectImageFormat,
  calculateOptimalDimensions,
  generateSizesAttribute,
  DEFAULT_BREAKPOINTS
} from '../image-optimization';

// Mock DOM APIs
const mockCanvas = {
  width: 0,
  height: 0,
  toDataURL: vi.fn(() => 'data:image/webp;base64,test'),
  getContext: vi.fn(() => ({
    drawImage: vi.fn(),
    filter: '',
  }))
};

const mockImage = {
  onload: null as any,
  onerror: null as any,
  src: '',
  crossOrigin: '',
  height: 2,
  width: 2
};

beforeEach(() => {
  vi.clearAllMocks();
  
  // Mock document.createElement
  global.document = {
    createElement: vi.fn((tagName: string) => {
      if (tagName === 'canvas') return mockCanvas;
      if (tagName === 'img') return mockImage;
      return {};
    })
  } as any;

  // Mock window
  global.window = {
    devicePixelRatio: 2
  } as any;

  // Mock navigator
  global.navigator = {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  } as any;
});

describe('generateResponsiveSrcSet', () => {
  it('should generate responsive srcSet with default breakpoints', () => {
    const result = generateResponsiveSrcSet('/test-image.jpg');
    
    expect(result.srcSet).toContain('320w');
    expect(result.srcSet).toContain('640w');
    expect(result.srcSet).toContain('1024w');
    expect(result.sizes).toContain('(max-width: 320px)');
    expect(result.sources).toHaveLength(2); // webp and jpg by default
  });

  it('should generate srcSet with custom breakpoints', () => {
    const customBreakpoints = [
      { width: 400, condition: '(max-width: 400px)' },
      { width: 800, condition: '(max-width: 800px)' },
      { width: 1200 }
    ];

    const result = generateResponsiveSrcSet('/test-image.jpg', {
      breakpoints: customBreakpoints
    });

    expect(result.srcSet).toContain('400w');
    expect(result.srcSet).toContain('800w');
    expect(result.srcSet).toContain('1200w');
    expect(result.sizes).toContain('(max-width: 400px) 400px');
  });

  it('should generate sources for multiple formats', () => {
    const result = generateResponsiveSrcSet('/test-image.jpg', {
      formats: ['avif', 'webp', 'jpg']
    });

    expect(result.sources).toHaveLength(3);
    expect(result.sources[0].type).toBe('image/avif');
    expect(result.sources[1].type).toBe('image/webp');
    expect(result.sources[2].type).toBe('image/jpeg');
  });
});

describe('detectImageFormat', () => {
  it('should return format support object', async () => {
    const result = await detectImageFormat();
    
    expect(result).toHaveProperty('webp');
    expect(result).toHaveProperty('avif');
    expect(result).toHaveProperty('heic');
    expect(typeof result.webp).toBe('boolean');
    expect(typeof result.avif).toBe('boolean');
    expect(typeof result.heic).toBe('boolean');
  }, 10000); // Increase timeout for async operations
});

describe('calculateOptimalDimensions', () => {
  it('should calculate dimensions with device pixel ratio', () => {
    const result = calculateOptimalDimensions(400, 300, 2);
    
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
  });

  it('should use default device pixel ratio when not provided', () => {
    const result = calculateOptimalDimensions(400, 300);
    
    expect(result.width).toBe(800); // 400 * 2 (mocked devicePixelRatio)
    expect(result.height).toBe(600); // 300 * 2
  });
});

describe('generateSizesAttribute', () => {
  it('should generate sizes attribute from breakpoints', () => {
    const breakpoints = [
      { width: 320, condition: '(max-width: 320px)' },
      { width: 768, condition: '(max-width: 768px)' },
      { width: 1024 }
    ];

    const result = generateSizesAttribute(breakpoints);
    
    expect(result).toBe('(max-width: 320px) 320px, (max-width: 768px) 768px, 100vw');
  });

  it('should handle breakpoints without conditions', () => {
    const breakpoints = [
      { width: 320, condition: '(max-width: 320px)' },
      { width: 1024 } // No condition
    ];

    const result = generateSizesAttribute(breakpoints);
    
    expect(result).toBe('(max-width: 320px) 320px, 100vw');
  });
});

describe('DEFAULT_BREAKPOINTS', () => {
  it('should have expected breakpoint values', () => {
    expect(DEFAULT_BREAKPOINTS).toHaveLength(7);
    expect(DEFAULT_BREAKPOINTS[0].width).toBe(320);
    expect(DEFAULT_BREAKPOINTS[6].width).toBe(1920);
  });

  it('should have conditions for all but the largest breakpoint', () => {
    const withConditions = DEFAULT_BREAKPOINTS.filter(bp => bp.condition);
    expect(withConditions).toHaveLength(6);
    
    const withoutConditions = DEFAULT_BREAKPOINTS.filter(bp => !bp.condition);
    expect(withoutConditions).toHaveLength(1);
    expect(withoutConditions[0].width).toBe(1920);
  });
});