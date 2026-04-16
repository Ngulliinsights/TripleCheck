/**
 * Test Setup Configuration
 * Global test setup and configuration
 */

import { beforeAll, afterAll, beforeEach, afterEach } from '../src/shared/test-utils/index';
import { setupTest, teardownTest } from '../src/local/testing/TestUtils';

// Global test setup
beforeAll(() => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Mock console methods to reduce noise
  global.console = {
    ...console,
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
  };

  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock window.scrollTo
  Object.defineProperty(window, 'scrollTo', {
    value: vi.fn(),
    writable: true,
  });

  // Mock window.location
  delete (window as any).location;
  window.location = {
    ...window.location,
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
  } as any;

  // Mock fetch globally
  global.fetch = vi.fn();

  // Mock Image constructor
  global.Image = class {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    src = '';
    
    constructor() {
      setTimeout(() => {
        this.onload?.();
      }, 0);
    }
  } as any;

  // Mock URL constructor
  global.URL = class {
    pathname = '';
    search = '';
    hash = '';
    
    constructor(url: string) {
      const parts = url.split('/');
      this.pathname = '/' + parts.slice(3).join('/');
    }
  } as any;

  // Mock crypto for UUID generation
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
      getRandomValues: (arr: any) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      },
    },
  });
});

// Setup before each test
beforeEach(() => {
  setupTest();
});

// Cleanup after each test
afterEach(() => {
  teardownTest();
});

// Global cleanup
afterAll(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});