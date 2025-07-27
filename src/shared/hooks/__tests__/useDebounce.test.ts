import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDebounce, useDebouncedCallback, useDebounceSimple } from '../useDebounce';

describe('useDebounce Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic Functionality', () => {
    it('returns initial value immediately', () => {
      const { result } = renderHook(() => useDebounce('initial', 500));
      
      expect(result.current.debouncedValue).toBe('initial');
      expect(result.current.isPending).toBe(false);
    });

    it('debounces value changes', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'initial' } }
      );
      
      expect(result.current.debouncedValue).toBe('initial');
      
      // Change value
      rerender({ value: 'updated' });
      
      // Should still have old value and be pending
      expect(result.current.debouncedValue).toBe('initial');
      expect(result.current.isPending).toBe(true);
      
      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      // Should now have new value
      expect(result.current.debouncedValue).toBe('updated');
      expect(result.current.isPending).toBe(false);
    });

    it('cancels previous debounce when value changes rapidly', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'initial' } }
      );
      
      // First change
      rerender({ value: 'first' });
      expect(result.current.isPending).toBe(true);
      
      // Advance time partially
      act(() => {
        vi.advanceTimersByTime(300);
      });
      
      // Second change before first completes
      rerender({ value: 'second' });
      
      // Should still be pending with original value
      expect(result.current.debouncedValue).toBe('initial');
      expect(result.current.isPending).toBe(true);
      
      // Complete the debounce
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      // Should have the latest value
      expect(result.current.debouncedValue).toBe('second');
      expect(result.current.isPending).toBe(false);
    });
  });

  describe('Options', () => {
    it('supports custom delay', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 1000),
        { initialProps: { value: 'initial' } }
      );
      
      rerender({ value: 'updated' });
      
      // Should not update after 500ms
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current.debouncedValue).toBe('initial');
      
      // Should update after 1000ms
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current.debouncedValue).toBe('updated');
    });

    it('supports leading edge execution', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500, { leading: true }),
        { initialProps: { value: 'initial' } }
      );
      
      // Change value
      rerender({ value: 'updated' });
      
      // Should update immediately with leading edge
      expect(result.current.debouncedValue).toBe('updated');
      expect(result.current.isPending).toBe(false);
    });

    it('supports leading edge with trailing disabled', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500, { leading: true, trailing: false }),
        { initialProps: { value: 'initial' } }
      );
      
      // First change - should update immediately
      rerender({ value: 'first' });
      expect(result.current.debouncedValue).toBe('first');
      
      // Second change quickly - should not update again
      rerender({ value: 'second' });
      expect(result.current.debouncedValue).toBe('first');
      
      // Even after delay, should not update to second value
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current.debouncedValue).toBe('first');
    });

    it('supports maxWait option', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 1000, { maxWait: 500 }),
        { initialProps: { value: 'initial' } }
      );
      
      // Change value
      rerender({ value: 'updated' });
      
      // Should update after maxWait even if delay hasn't passed
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      expect(result.current.debouncedValue).toBe('updated');
    });
  });

  describe('Utility Functions', () => {
    it('flush function immediately updates value', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'initial' } }
      );
      
      rerender({ value: 'updated' });
      expect(result.current.debouncedValue).toBe('initial');
      expect(result.current.isPending).toBe(true);
      
      // Flush immediately
      act(() => {
        result.current.flush();
      });
      
      expect(result.current.debouncedValue).toBe('updated');
      expect(result.current.isPending).toBe(false);
    });

    it('cancel function cancels pending update', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'initial' } }
      );
      
      rerender({ value: 'updated' });
      expect(result.current.isPending).toBe(true);
      
      // Cancel the update
      act(() => {
        result.current.cancel();
      });
      
      expect(result.current.isPending).toBe(false);
      expect(result.current.debouncedValue).toBe('initial');
      
      // Even after delay, should not update
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      expect(result.current.debouncedValue).toBe('initial');
    });

    it('flush does nothing when no pending update', () => {
      const { result } = renderHook(() => useDebounce('initial', 500));
      
      // Should not throw or cause issues
      act(() => {
        result.current.flush();
      });
      
      expect(result.current.debouncedValue).toBe('initial');
      expect(result.current.isPending).toBe(false);
    });

    it('cancel does nothing when no pending update', () => {
      const { result } = renderHook(() => useDebounce('initial', 500));
      
      // Should not throw or cause issues
      act(() => {
        result.current.cancel();
      });
      
      expect(result.current.debouncedValue).toBe('initial');
      expect(result.current.isPending).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('handles same value updates gracefully', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'same' } }
      );
      
      // Update with same value
      rerender({ value: 'same' });
      
      // Should not be pending since value didn't change
      expect(result.current.isPending).toBe(false);
      expect(result.current.debouncedValue).toBe('same');
    });

    it('handles null and undefined values', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: null } }
      );
      
      expect(result.current.debouncedValue).toBe(null);
      
      rerender({ value: undefined });
      
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      expect(result.current.debouncedValue).toBe(undefined);
    });

    it('handles object values', async () => {
      const obj1 = { id: 1, name: 'first' };
      const obj2 = { id: 2, name: 'second' };
      
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: obj1 } }
      );
      
      expect(result.current.debouncedValue).toBe(obj1);
      
      rerender({ value: obj2 });
      
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      expect(result.current.debouncedValue).toBe(obj2);
    });

    it('handles array values', async () => {
      const arr1 = [1, 2, 3];
      const arr2 = [4, 5, 6];
      
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: arr1 } }
      );
      
      expect(result.current.debouncedValue).toBe(arr1);
      
      rerender({ value: arr2 });
      
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      expect(result.current.debouncedValue).toBe(arr2);
    });

    it('handles zero delay', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 0),
        { initialProps: { value: 'initial' } }
      );
      
      rerender({ value: 'updated' });
      
      // Should update immediately with zero delay
      act(() => {
        vi.advanceTimersByTime(0);
      });
      
      expect(result.current.debouncedValue).toBe('updated');
    });
  });

  describe('Cleanup', () => {
    it('cleans up timers on unmount', () => {
      const { result, rerender, unmount } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'initial' } }
      );
      
      rerender({ value: 'updated' });
      expect(result.current.isPending).toBe(true);
      
      // Unmount before debounce completes
      unmount();
      
      // Should not cause any issues
      act(() => {
        vi.advanceTimersByTime(500);
      });
    });
  });
});

describe('useDebouncedCallback Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic Functionality', () => {
    it('debounces function calls', () => {
      const callback = vi.fn();
      const { result } = renderHook(() => 
        useDebouncedCallback(callback, { wait: 500 })
      );
      
      // Call multiple times
      act(() => {
        result.current('arg1');
        result.current('arg2');
        result.current('arg3');
      });
      
      // Should not have been called yet
      expect(callback).not.toHaveBeenCalled();
      
      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      // Should have been called once with last arguments
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('arg3');
    });

    it('supports leading edge execution', () => {
      const callback = vi.fn();
      const { result } = renderHook(() => 
        useDebouncedCallback(callback, { wait: 500, leading: true })
      );
      
      // First call should execute immediately
      act(() => {
        result.current('first');
      });
      
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('first');
      
      // Subsequent calls should be debounced
      act(() => {
        result.current('second');
      });
      
      expect(callback).toHaveBeenCalledTimes(1); // Still only called once
    });

    it('supports trailing edge execution', () => {
      const callback = vi.fn();
      const { result } = renderHook(() => 
        useDebouncedCallback(callback, { wait: 500, trailing: true })
      );
      
      act(() => {
        result.current('test');
      });
      
      expect(callback).not.toHaveBeenCalled();
      
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('test');
    });

    it('supports maxWait option', () => {
      const callback = vi.fn();
      const { result } = renderHook(() => 
        useDebouncedCallback(callback, { wait: 1000, maxWait: 500 })
      );
      
      act(() => {
        result.current('test');
      });
      
      // Should execute after maxWait even if wait time hasn't passed
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('test');
    });
  });

  describe('Utility Functions', () => {
    it('cancel function cancels pending execution', () => {
      const callback = vi.fn();
      const { result } = renderHook(() => 
        useDebouncedCallback(callback, { wait: 500 })
      );
      
      act(() => {
        result.current('test');
      });
      
      // Cancel before execution
      act(() => {
        result.current.cancel();
      });
      
      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      // Should not have been called
      expect(callback).not.toHaveBeenCalled();
    });

    it('flush function executes immediately', () => {
      const callback = vi.fn();
      const { result } = renderHook(() => 
        useDebouncedCallback(callback, { wait: 500 })
      );
      
      act(() => {
        result.current('test');
      });
      
      // Flush immediately
      act(() => {
        result.current.flush();
      });
      
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('test');
    });

    it('flush does nothing when no pending execution', () => {
      const callback = vi.fn();
      const { result } = renderHook(() => 
        useDebouncedCallback(callback, { wait: 500 })
      );
      
      // Flush without any pending calls
      act(() => {
        result.current.flush();
      });
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Callback Updates', () => {
    it('uses latest callback reference', () => {
      let callbackResult = 'first';
      const callback = vi.fn(() => callbackResult);
      
      const { result, rerender } = renderHook(
        ({ cb }) => useDebouncedCallback(cb, { wait: 500 }),
        { initialProps: { cb: callback } }
      );
      
      act(() => {
        result.current();
      });
      
      // Update callback
      callbackResult = 'second';
      const newCallback = vi.fn(() => callbackResult);
      rerender({ cb: newCallback });
      
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      // Should use the latest callback
      expect(newCallback).toHaveBeenCalledTimes(1);
      expect(callback).not.toHaveBeenCalled();
    });
  });
});

describe('useDebounceSimple Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('provides backward compatibility', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounceSimple(value, 500),
      { initialProps: { value: 'initial' } }
    );
    
    expect(result.current).toBe('initial');
    
    rerender({ value: 'updated' });
    
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    expect(result.current).toBe('updated');
  });

  it('uses default delay when not provided', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounceSimple(value),
      { initialProps: { value: 'initial' } }
    );
    
    rerender({ value: 'updated' });
    
    // Should use default delay (500ms)
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    expect(result.current).toBe('updated');
  });
});