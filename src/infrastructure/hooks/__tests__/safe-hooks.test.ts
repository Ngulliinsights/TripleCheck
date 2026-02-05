import { renderHook, act } from '@testing-library/react'
import { useSafeEffect, useSafeState, useStableCallback } from '../index'

describe('Safe Hooks', () => {
  describe('useSafeState', () => {
    it('should update state when component is mounted', () => {
      const { result } = renderHook(() => useSafeState(0));
      
      act(() => {
        result.current[1](1);
      });
      
      expect(result.current[0]).toBe(1);
    });

    it('should not update state after unmount', () => {
      const { result, unmount } = renderHook(() => useSafeState(0));
      
      unmount();
      
      // This should not cause any warnings or errors
      act(() => {
        result.current[1](1);
      });
    });
  });

  describe('useStableCallback', () => {
    it('should maintain stable reference', () => {
      let callback = jest.fn();
      const { result, rerender } = renderHook(
        ({ cb }) => useStableCallback(cb),
        { initialProps: { cb: callback } }
      );
      
      const stableCallback1 = result.current;
      
      // Change the callback
      callback = jest.fn();
      rerender({ cb: callback });
      
      const stableCallback2 = result.current;
      
      // Reference should be stable
      expect(stableCallback1).toBe(stableCallback2);
    });

    it('should call the latest callback', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      const { result, rerender } = renderHook(
        ({ cb }) => useStableCallback(cb),
        { initialProps: { cb: callback1 } }
      );
      
      // Call with first callback
      result.current();
      expect(callback1).toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
      
      // Update to second callback
      rerender({ cb: callback2 });
      
      // Call should now use second callback
      result.current();
      expect(callback2).toHaveBeenCalled();
    });
  });

  describe('useSafeEffect', () => {
    it('should run effect when mounted', () => {
      const effect = jest.fn();
      
      renderHook(() => useSafeEffect(effect, []));
      
      expect(effect).toHaveBeenCalled();
    });

    it('should cleanup effect on unmount', () => {
      const cleanup = jest.fn();
      const effect = jest.fn(() => cleanup);
      
      const { unmount } = renderHook(() => useSafeEffect(effect, []));
      
      unmount();
      
      expect(cleanup).toHaveBeenCalled();
    });
  });
});