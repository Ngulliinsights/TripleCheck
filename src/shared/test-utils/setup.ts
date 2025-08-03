import { vi, beforeAll, afterEach, afterAll } from 'vitest';

import '@testing-library/jest-dom';
import { TestDataFactory } from './fixtures';
import { memoryManager, cleanupTestMemory } from './memory-manager';
import { setupMswServer } from './msw-server';

// Set up MSW server for API mocking
setupMswServer({
  onUnhandledRequest: 'warn',
  quiet: process.env.NODE_ENV === 'test',
});

// Reset test data factory between tests
afterEach(() => {
  TestDataFactory.reset();
});

// Mock Web APIs that are not available in jsdom
// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
});

// Mock window.scrollBy
Object.defineProperty(window, 'scrollBy', {
  writable: true,
  value: vi.fn(),
});

// Mock Element.scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Mock URL.createObjectURL
if (typeof window.URL.createObjectURL === 'undefined') {
  Object.defineProperty(window.URL, 'createObjectURL', { 
    value: vi.fn(() => 'mock-object-url'),
    writable: true,
  });
}

// Mock URL.revokeObjectURL
if (typeof window.URL.revokeObjectURL === 'undefined') {
  Object.defineProperty(window.URL, 'revokeObjectURL', { 
    value: vi.fn(),
    writable: true,
  });
}

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
    get length() {
      return Object.keys(store).length;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
    get length() {
      return Object.keys(store).length;
    },
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
});

// Mock fetch if not available (though jsdom should provide it)
if (typeof global.fetch === 'undefined') {
  global.fetch = vi.fn();
}

// Mock File and FileReader for file upload testing
global.File = class MockFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;

  constructor(fileBits: BlobPart[], fileName: string, options?: FilePropertyBag) {
    this.name = fileName;
    this.size = fileBits.reduce((acc, bit) => {
      if (typeof bit === 'string') return acc + bit.length;
      if (bit instanceof ArrayBuffer) return acc + bit.byteLength;
      return acc + (bit as any).length || 0;
    }, 0);
    this.type = options?.type || '';
    this.lastModified = options?.lastModified || Date.now();
  }

  arrayBuffer(): Promise<ArrayBuffer> {
    return Promise.resolve(new ArrayBuffer(this.size));
  }

  text(): Promise<string> {
    return Promise.resolve('mock file content');
  }

  stream(): ReadableStream {
    return new ReadableStream();
  }

  slice(): Blob {
    return new Blob();
  }
} as any;

global.FileReader = class MockFileReader extends EventTarget {
  result: string | ArrayBuffer | null = null;
  error: DOMException | null = null;
  readyState: 0 | 1 | 2 = 0;
  
  // FileReader constants
  static readonly EMPTY = 0;
  static readonly LOADING = 1;
  static readonly DONE = 2;
  
  readonly EMPTY = 0;
  readonly LOADING = 1;
  readonly DONE = 2;
  
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onabort: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onloadstart: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onprogress: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;

  readAsText(file: Blob): void {
    const self = this;
    setTimeout(() => {
      self.result = 'mock file content';
      self.readyState = 2 as const;
      if (self.onload) {
        self.onload({} as ProgressEvent<FileReader>);
      }
    }, 0);
  }

  readAsDataURL(file: Blob): void {
    const self = this;
    setTimeout(() => {
      self.result = 'data:text/plain;base64,bW9jayBmaWxlIGNvbnRlbnQ=';
      self.readyState = 2 as const;
      if (self.onload) {
        self.onload({} as ProgressEvent<FileReader>);
      }
    }, 0);
  }

  readAsArrayBuffer(file: Blob): void {
    const self = this;
    setTimeout(() => {
      self.result = new ArrayBuffer(8);
      self.readyState = 2 as const;
      if (self.onload) {
        self.onload({} as ProgressEvent<FileReader>);
      }
    }, 0);
  }

  readAsBinaryString(file: Blob): void {
    const self = this;
    setTimeout(() => {
      self.result = 'mock binary content';
      self.readyState = 2 as const;
      if (self.onload) {
        self.onload({} as ProgressEvent<FileReader>);
      }
    }, 0);
  }

  abort(): void {
    const self = this;
    self.readyState = 2 as const;
    if (self.onabort) {
      self.onabort({} as ProgressEvent<FileReader>);
    }
  }
} as any;

// Mock Blob constructor
global.Blob = class MockBlob {
  size: number;
  type: string;

  constructor(blobParts?: BlobPart[], options?: BlobPropertyBag) {
    this.size = blobParts?.reduce((acc, part) => {
      if (typeof part === 'string') return acc + part.length;
      if (part instanceof ArrayBuffer) return acc + part.byteLength;
      return acc + (part as any).length || 0;
    }, 0) || 0;
    this.type = options?.type || '';
  }

  arrayBuffer(): Promise<ArrayBuffer> {
    return Promise.resolve(new ArrayBuffer(this.size));
  }

  text(): Promise<string> {
    return Promise.resolve('mock blob content');
  }

  stream(): ReadableStream {
    return new ReadableStream();
  }

  slice(): Blob {
    return new MockBlob();
  }

  bytes(): Promise<Uint8Array> {
    return Promise.resolve(new Uint8Array(this.size));
  }
} as any;

// Mock canvas for image testing
HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((contextType) => {
  if (contextType === '2d') {
    return {
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(4),
        width: 1,
        height: 1,
      })),
      putImageData: vi.fn(),
      createImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(4),
        width: 1,
        height: 1,
      })),
      setTransform: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      fillText: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      measureText: vi.fn(() => ({ width: 0 })),
      transform: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
    };
  }
  return null;
});

HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,mock');
HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
  if (callback) {
    callback(new Blob(['mock'], { type: 'image/png' }));
  }
});

// Mock Image constructor
global.Image = class MockImage extends EventTarget {
  alt: string = '';
  width: number = 0;
  height: number = 0;
  complete: boolean = false;
  naturalWidth: number = 0;
  naturalHeight: number = 0;
  private _src: string = '';
  
  onload: ((this: GlobalEventHandlers, ev: Event) => any) | null = null;
  onerror: ((this: GlobalEventHandlers, ev: Event) => any) | null = null;

  constructor(width?: number, height?: number) {
    super();
    if (width) this.width = width;
    if (height) this.height = height;
  }

  set src(value: string) {
    this._src = value;
    const self = this;
    setTimeout(() => {
      self.complete = true;
      self.naturalWidth = self.width || 100;
      self.naturalHeight = self.height || 100;
      if (self.onload) {
        self.onload.call(self as any, {} as Event);
      }
    }, 0);
  }

  get src(): string {
    return this._src;
  }
} as any;

// Mock performance API
if (typeof window.performance === 'undefined') {
  Object.defineProperty(window, 'performance', {
    value: {
      now: vi.fn(() => Date.now()),
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByName: vi.fn(() => []),
      getEntriesByType: vi.fn(() => []),
    },
    writable: true,
  });
}

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
  return setTimeout(callback, 16) as unknown as number; // ~60fps
});

global.cancelAnimationFrame = vi.fn((id) => {
  clearTimeout(id);
});

// Mock requestIdleCallback
global.requestIdleCallback = vi.fn((callback) => {
  return setTimeout(() => callback({ 
    didTimeout: false, 
    timeRemaining: () => 50 
  }), 1) as unknown as number;
});

global.cancelIdleCallback = vi.fn((id) => {
  clearTimeout(id);
});

// Mock crypto for testing
Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: vi.fn((arr: any) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
    randomUUID: vi.fn(() => '123e4567-e89b-12d3-a456-426614174000'),
  },
  writable: true,
});

// Mock geolocation
Object.defineProperty(navigator, 'geolocation', {
  value: {
    getCurrentPosition: vi.fn((success) => {
      success({
        coords: {
          latitude: -1.2921,
          longitude: 36.8219,
          accuracy: 100,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      });
    }),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  },
  writable: true,
});

// Mock clipboard API
if (!navigator.clipboard) {
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn(() => Promise.resolve()),
      readText: vi.fn(() => Promise.resolve('mock clipboard text')),
      write: vi.fn(() => Promise.resolve()),
      read: vi.fn(() => Promise.resolve([])),
    },
    writable: true,
    configurable: true,
  });
}

// Mock notification API
Object.defineProperty(window, 'Notification', {
  value: class MockNotification extends EventTarget {
    static permission: NotificationPermission = 'default';
    static requestPermission = vi.fn(() => Promise.resolve('granted' as NotificationPermission));
    
    title: string;
    body?: string;
    icon?: string;
    
    constructor(title: string, options?: NotificationOptions) {
      super();
      this.title = title;
      if (options?.body !== undefined) this.body = options.body;
      if (options?.icon !== undefined) this.icon = options.icon;
    }
    
    close = vi.fn();
  },
  writable: true,
});

// Clean up after each test
afterEach(async () => {
  // Use memory manager for comprehensive cleanup
  await cleanupTestMemory();
  
  // Reset localStorage and sessionStorage
  localStorageMock.clear();
  sessionStorageMock.clear();
  
  // Reset window location
  delete (window as any).location;
  window.location = {
    href: 'http://localhost:3000/',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
    toString: vi.fn(() => 'http://localhost:3000/'),
  } as any;
  
  // Reset document title
  document.title = 'Test';
});

// Global test utilities
declare global {
  interface Window {
    __TEST_ENV__: boolean;
  }
}

// Mark as test environment
window.__TEST_ENV__ = true;

// Console overrides for cleaner test output
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  // Suppress specific React warnings in tests
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('Warning: An invalid form control') ||
       args[0].includes('Warning: Failed prop type'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('componentWillReceiveProps') ||
       args[0].includes('componentWillUpdate'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(async () => {
  // Restore original console methods
  console.error = originalError;
  console.warn = originalWarn;
  
  // Final memory cleanup
  await memoryManager.cleanupTestResources();
});