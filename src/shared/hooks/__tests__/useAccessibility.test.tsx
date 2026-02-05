/**
 * Test for consolidated accessibility hook
 */

import { renderHook, act } from '@testing-library/react'
import { useAccessibility, useKeyboardNavigation } from '../useAccessibility'

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('useAccessibility', () => {
  beforeEach(() => {
    // Clear any existing live regions
    const existingLiveRegions = document.querySelectorAll('[aria-live]');
    existingLiveRegions.forEach(region => region.remove());
  });

  it('should provide basic accessibility functions', () => {
    const { result } = renderHook(() => useAccessibility());

    expect(result.current.trapFocus).toBeDefined();
    expect(result.current.announceLiveRegion).toBeDefined();
    expect(result.current.restoreFocus).toBeDefined();
    expect(typeof result.current.trapFocus).toBe('function');
    expect(typeof result.current.announceLiveRegion).toBe('function');
    expect(typeof result.current.restoreFocus).toBe('function');
  });

  it('should provide accessibility preferences', () => {
    const { result } = renderHook(() => useAccessibility());

    expect(result.current.prefersReducedMotion).toBeDefined();
    expect(result.current.prefersHighContrast).toBeDefined();
    expect(result.current.prefersLargeText).toBeDefined();
    expect(result.current.keyboardNavigation).toBeDefined();
    expect(typeof result.current.prefersReducedMotion).toBe('boolean');
    expect(typeof result.current.prefersHighContrast).toBe('boolean');
    expect(typeof result.current.prefersLargeText).toBe('boolean');
    expect(typeof result.current.keyboardNavigation).toBe('boolean');
  });

  it('should create live region for announcements', () => {
    const { result } = renderHook(() => useAccessibility());

    act(() => {
      result.current.announceLiveRegion('Test announcement');
    });

    const liveRegion = document.querySelector('[aria-live]');
    expect(liveRegion).toBeTruthy();
    expect(liveRegion?.textContent).toBe('Test announcement');
  });

  it('should handle focus trapping', () => {
    const { result } = renderHook(() => useAccessibility());

    // Create a test container with focusable elements
    const container = document.createElement('div');
    const button1 = document.createElement('button');
    const button2 = document.createElement('button');
    button1.textContent = 'Button 1';
    button2.textContent = 'Button 2';
    container.appendChild(button1);
    container.appendChild(button2);
    document.body.appendChild(container);

    let cleanup: (() => void) | undefined;

    act(() => {
      cleanup = result.current.trapFocus(container);
    });

    expect(cleanup).toBeDefined();
    expect(typeof cleanup).toBe('function');

    // Cleanup
    if (cleanup) cleanup();
    document.body.removeChild(container);
  });

  it('should detect keyboard navigation', () => {
    const { result } = renderHook(() => useAccessibility());

    expect(result.current.keyboardNavigation).toBe(false);

    // Simulate Tab key press
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      document.dispatchEvent(event);
    });

    expect(result.current.keyboardNavigation).toBe(true);

    // Simulate mouse down
    act(() => {
      const event = new MouseEvent('mousedown');
      document.dispatchEvent(event);
    });

    expect(result.current.keyboardNavigation).toBe(false);
  });
});

describe('useKeyboardNavigation', () => {
  it('should handle keyboard events', () => {
    const onEnter = jest.fn();
    const onEscape = jest.fn();
    const onArrowKeys = jest.fn();

    renderHook(() => useKeyboardNavigation(onEnter, onEscape, onArrowKeys));

    // Test Enter key
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(event);
    });
    expect(onEnter).toHaveBeenCalled();

    // Test Escape key
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);
    });
    expect(onEscape).toHaveBeenCalled();

    // Test Arrow key
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      document.dispatchEvent(event);
    });
    expect(onArrowKeys).toHaveBeenCalledWith('up');
  });
});