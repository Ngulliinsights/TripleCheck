import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useToast, toast, cleanup } from '../use-toast'

describe('useToast Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Clear any existing toasts
    cleanup();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  describe('Basic Functionality', () => {
    it('initializes with empty toasts array', () => {
      const { result } = renderHook(() => useToast());
      
      expect(result.current.toasts).toEqual([]);
    });

    it('adds toast when toast function is called', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.toast({
          title: 'Test Toast',
          description: 'This is a test toast',
        });
      });
      
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]).toMatchObject({
        title: 'Test Toast',
        description: 'This is a test toast',
        open: true,
      });
      expect(result.current.toasts[0].id).toBeDefined();
    });

    it('limits number of toasts to TOAST_LIMIT', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.toast({ title: 'Toast 1' });
        result.current.toast({ title: 'Toast 2' });
        result.current.toast({ title: 'Toast 3' });
      });
      
      // Should only keep the most recent toast (TOAST_LIMIT = 1)
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe('Toast 3');
    });

    it('generates unique IDs for toasts', () => {
      const { result } = renderHook(() => useToast());
      
      let toast1Id: string;
      let toast2Id: string;
      
      act(() => {
        const toast1 = result.current.toast({ title: 'Toast 1' });
        toast1Id = toast1.id;
      });
      
      act(() => {
        result.current.dismiss(); // Clear first toast
      });
      
      act(() => {
        const toast2 = result.current.toast({ title: 'Toast 2' });
        toast2Id = toast2.id;
      });
      
      expect(toast1Id).not.toBe(toast2Id);
    });
  });

  describe('Toast Management', () => {
    it('dismisses specific toast by ID', () => {
      const { result } = renderHook(() => useToast());
      
      let toastId: string;
      
      act(() => {
        const toastResult = result.current.toast({ title: 'Test Toast' });
        toastId = toastResult.id;
      });
      
      expect(result.current.toasts[0].open).toBe(true);
      
      act(() => {
        result.current.dismiss(toastId);
      });
      
      expect(result.current.toasts[0].open).toBe(false);
    });

    it('dismisses all toasts when no ID provided', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.toast({ title: 'Toast 1' });
      });
      
      expect(result.current.toasts[0].open).toBe(true);
      
      act(() => {
        result.current.dismiss();
      });
      
      expect(result.current.toasts[0].open).toBe(false);
    });

    it('removes toast after dismiss timeout', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.toast({ title: 'Test Toast' });
      });
      
      expect(result.current.toasts).toHaveLength(1);
      
      act(() => {
        result.current.dismiss();
      });
      
      // Fast-forward past the remove delay
      act(() => {
        vi.advanceTimersByTime(1000000); // TOAST_REMOVE_DELAY
      });
      
      expect(result.current.toasts).toHaveLength(0);
    });

    it('cancels removal timeout when toast is dismissed and re-added', () => {
      const { result } = renderHook(() => useToast());
      
      let toastId: string;
      
      act(() => {
        const toastResult = result.current.toast({ title: 'Test Toast' });
        toastId = toastResult.id;
      });
      
      act(() => {
        result.current.dismiss(toastId);
      });
      
      // Add another toast before removal timeout
      act(() => {
        result.current.toast({ title: 'New Toast' });
      });
      
      act(() => {
        vi.advanceTimersByTime(1000000);
      });
      
      // Should have the new toast, old one should be removed
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe('New Toast');
    });
  });

  describe('Toast Updates', () => {
    it('updates toast properties', () => {
      const { result } = renderHook(() => useToast());
      
      let toastResult: any;
      
      act(() => {
        toastResult = result.current.toast({ title: 'Original Title' });
      });
      
      act(() => {
        toastResult.update({ title: 'Updated Title', description: 'New description' });
      });
      
      expect(result.current.toasts[0]).toMatchObject({
        title: 'Updated Title',
        description: 'New description',
      });
    });

    it('preserves toast ID when updating', () => {
      const { result } = renderHook(() => useToast());
      
      let toastResult: any;
      
      act(() => {
        toastResult = result.current.toast({ title: 'Original Title' });
      });
      
      const originalId = result.current.toasts[0].id;
      
      act(() => {
        toastResult.update({ title: 'Updated Title' });
      });
      
      expect(result.current.toasts[0].id).toBe(originalId);
    });
  });

  describe('Toast Return Object', () => {
    it('returns toast object with dismiss method', () => {
      const { result } = renderHook(() => useToast());
      
      let toastResult: any;
      
      act(() => {
        toastResult = result.current.toast({ title: 'Test Toast' });
      });
      
      expect(toastResult).toHaveProperty('id');
      expect(toastResult).toHaveProperty('dismiss');
      expect(toastResult).toHaveProperty('update');
      expect(typeof toastResult.dismiss).toBe('function');
      expect(typeof toastResult.update).toBe('function');
    });

    it('dismiss method works correctly', () => {
      const { result } = renderHook(() => useToast());
      
      let toastResult: any;
      
      act(() => {
        toastResult = result.current.toast({ title: 'Test Toast' });
      });
      
      expect(result.current.toasts[0].open).toBe(true);
      
      act(() => {
        toastResult.dismiss();
      });
      
      expect(result.current.toasts[0].open).toBe(false);
    });
  });

  describe('onOpenChange Handler', () => {
    it('calls dismiss when onOpenChange is called with false', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.toast({ title: 'Test Toast' });
      });
      
      const toast = result.current.toasts[0];
      expect(toast.open).toBe(true);
      
      act(() => {
        toast.onOpenChange?.(false);
      });
      
      expect(result.current.toasts[0].open).toBe(false);
    });

    it('does not dismiss when onOpenChange is called with true', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.toast({ title: 'Test Toast' });
      });
      
      const toast = result.current.toasts[0];
      
      act(() => {
        toast.onOpenChange?.(true);
      });
      
      expect(result.current.toasts[0].open).toBe(true);
    });
  });

  describe('Multiple Hook Instances', () => {
    it('synchronizes state across multiple hook instances', () => {
      const { result: result1 } = renderHook(() => useToast());
      const { result: result2 } = renderHook(() => useToast());
      
      act(() => {
        result1.current.toast({ title: 'Test Toast' });
      });
      
      expect(result1.current.toasts).toHaveLength(1);
      expect(result2.current.toasts).toHaveLength(1);
      expect(result1.current.toasts[0].id).toBe(result2.current.toasts[0].id);
    });

    it('updates all instances when toast is dismissed', () => {
      const { result: result1 } = renderHook(() => useToast());
      const { result: result2 } = renderHook(() => useToast());
      
      act(() => {
        result1.current.toast({ title: 'Test Toast' });
      });
      
      act(() => {
        result2.current.dismiss();
      });
      
      expect(result1.current.toasts[0].open).toBe(false);
      expect(result2.current.toasts[0].open).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty toast object', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.toast({});
      });
      
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]).toMatchObject({
        open: true,
      });
    });

    it('handles toast with all properties', () => {
      const { result } = renderHook(() => useToast());
      
      const mockAction = { altText: 'Action' };
      
      act(() => {
        result.current.toast({
          title: 'Title',
          description: 'Description',
          variant: 'destructive',
          action: mockAction,
        });
      });
      
      expect(result.current.toasts[0]).toMatchObject({
        title: 'Title',
        description: 'Description',
        variant: 'destructive',
        action: mockAction,
        open: true,
      });
    });

    it('handles rapid toast creation and dismissal', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        // Create and dismiss multiple toasts rapidly
        for (let i = 0; i < 5; i++) {
          const toastResult = result.current.toast({ title: `Toast ${i}` });
          toastResult.dismiss();
        }
      });
      
      // Should handle this gracefully without errors
      expect(result.current.toasts).toHaveLength(1); // Due to TOAST_LIMIT
      expect(result.current.toasts[0].open).toBe(false);
    });
  });

  describe('Memory Management', () => {
    it('cleans up listeners on unmount', () => {
      const { unmount } = renderHook(() => useToast());
      
      // Should not throw when unmounting
      expect(() => unmount()).not.toThrow();
    });

    it('handles cleanup function', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.toast({ title: 'Test Toast' });
      });
      
      expect(result.current.toasts).toHaveLength(1);
      
      act(() => {
        cleanup();
      });
      
      // After cleanup, new hook instance should start fresh
      const { result: newResult } = renderHook(() => useToast());
      expect(newResult.current.toasts).toHaveLength(0);
    });
  });
});

describe('Standalone toast function', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    cleanup();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('creates toast without hook', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      toast({ title: 'Standalone Toast' });
    });
    
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].title).toBe('Standalone Toast');
  });

  it('returns toast control object', () => {
    let toastResult: any;
    
    act(() => {
      toastResult = toast({ title: 'Test Toast' });
    });
    
    expect(toastResult).toHaveProperty('id');
    expect(toastResult).toHaveProperty('dismiss');
    expect(toastResult).toHaveProperty('update');
  });

  it('works with hook instances', () => {
    const { result } = renderHook(() => useToast());
    
    let toastResult: any;
    
    act(() => {
      toastResult = toast({ title: 'Standalone Toast' });
    });
    
    expect(result.current.toasts).toHaveLength(1);
    
    act(() => {
      toastResult.dismiss();
    });
    
    expect(result.current.toasts[0].open).toBe(false);
  });
});