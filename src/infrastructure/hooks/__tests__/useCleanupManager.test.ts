import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock React hooks for testing
const mockUseEffect = vi.fn();
const mockUseRef = vi.fn();
const mockUseCallback = vi.fn();

vi.mock('react', () => ({
  useEffect: mockUseEffect,
  useRef: mockUseRef,
  useCallback: mockUseCallback,
}));

describe('useCleanupManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementations
    mockUseCallback.mockImplementation((fn) => fn);
    mockUseRef.mockImplementation((initial) => ({ current: initial }));
    mockUseEffect.mockImplementation((fn) => fn());
  });

  it('should export useCleanupManager function', async () => {
    const { useCleanupManager } = await import('../useCleanupManager');
    expect(typeof useCleanupManager).toBe('function');
  });

  it('should export useEnhancedCleanupManager function', async () => {
    const { useEnhancedCleanupManager } = await import('../useCleanupManager');
    expect(typeof useEnhancedCleanupManager).toBe('function');
  });

  it('should initialize with proper React hooks', async () => {
    const { useCleanupManager } = await import('../useCleanupManager');
    
    // Mock the hook call
    mockUseRef
      .mockReturnValueOnce({ current: new Map() }) // cleanupFunctionsRef
      .mockReturnValueOnce({ current: 0 }) // keyCounterRef
      .mockReturnValueOnce({ current: true }); // isMountedRef

    // This should not throw
    expect(() => {
      useCleanupManager();
    }).not.toThrow();
    
    // Verify React hooks were called
    expect(mockUseRef).toHaveBeenCalledWith(expect.any(Map));
    expect(mockUseRef).toHaveBeenCalledWith(0);
    expect(mockUseRef).toHaveBeenCalledWith(true);
    expect(mockUseEffect).toHaveBeenCalled();
  });

  it('should handle cleanup function management', async () => {
    const { useCleanupManager } = await import('../useCleanupManager');
    
    const mockMap = new Map();
    mockUseRef
      .mockReturnValueOnce({ current: mockMap })
      .mockReturnValueOnce({ current: 0 })
      .mockReturnValueOnce({ current: true });

    const manager = useCleanupManager();
    
    // Test that manager returns expected interface
    expect(typeof manager.addCleanup).toBe('function');
    expect(typeof manager.removeCleanup).toBe('function');
    expect(typeof manager.runCleanup).toBe('function');
    expect(typeof manager.runAllCleanup).toBe('function');
    expect(typeof manager.hasCleanup).toBe('function');
  });
});

describe('useEnhancedCleanupManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Setup default mock implementations
    mockUseCallback.mockImplementation((fn) => fn);
    mockUseRef.mockImplementation((initial) => ({ current: initial }));
    mockUseEffect.mockImplementation((fn) => fn());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should provide enhanced cleanup methods', async () => {
    const { useEnhancedCleanupManager } = await import('../useCleanupManager');
    
    const mockMap = new Map();
    mockUseRef
      .mockReturnValueOnce({ current: mockMap })
      .mockReturnValueOnce({ current: 0 })
      .mockReturnValueOnce({ current: true });

    const manager = useEnhancedCleanupManager();
    
    // Test that enhanced manager returns expected interface
    expect(typeof manager.addCleanup).toBe('function');
    expect(typeof manager.addTimeout).toBe('function');
    expect(typeof manager.addInterval).toBe('function');
    expect(typeof manager.addEventListener).toBe('function');
    expect(typeof manager.addAbortController).toBe('function');
  });

  it('should handle timeout creation', async () => {
    const { useEnhancedCleanupManager } = await import('../useCleanupManager');
    
    const mockMap = new Map();
    const mockAddCleanup = vi.fn();
    
    // Mock the base manager
    mockUseRef
      .mockReturnValueOnce({ current: mockMap })
      .mockReturnValueOnce({ current: 0 })
      .mockReturnValueOnce({ current: true });

    // Mock setTimeout
    const mockSetTimeout = vi.spyOn(global, 'setTimeout').mockReturnValue(123 as any);
    
    const manager = useEnhancedCleanupManager();
    
    // This should not throw
    expect(() => {
      const callback = vi.fn();
      manager.addTimeout(callback, 1000);
    }).not.toThrow();
    
    expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);
    
    mockSetTimeout.mockRestore();
  });
});