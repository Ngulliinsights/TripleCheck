import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { MobileNav } from '../MobileNav';
import { EnhancedNavigation } from '../EnhancedNavigation';
import { SafeNavigation } from '../SafeNavigation';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/' }),
  };
});

// Mock window.location
const mockLocation = {
  href: '',
  reload: vi.fn(),
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('Navigation Crash Fixes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = '';
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('MobileNav', () => {
    it('should handle navigation errors gracefully', async () => {
      // Mock navigate to throw an error
      mockNavigate.mockImplementation(() => {
        throw new Error('Navigation failed');
      });

      render(
        <TestWrapper>
          <MobileNav />
        </TestWrapper>
      );

      // Open mobile menu
      const menuButton = screen.getByLabelText('Open navigation menu');
      fireEvent.click(menuButton);

      // Click on a navigation link
      const homeLink = screen.getByText('Home');
      fireEvent.click(homeLink);

      // Should fallback to window.location
      await waitFor(() => {
        expect(mockLocation.href).toBe('/');
      });
    });

    it('should handle search navigation errors gracefully', async () => {
      mockNavigate.mockImplementation(() => {
        throw new Error('Search navigation failed');
      });

      render(
        <TestWrapper>
          <MobileNav />
        </TestWrapper>
      );

      // Open mobile menu
      const menuButton = screen.getByLabelText('Open navigation menu');
      fireEvent.click(menuButton);

      // Enter search query and submit
      const searchInput = screen.getByLabelText('Search properties');
      fireEvent.change(searchInput, { target: { value: 'test query' } });
      fireEvent.submit(searchInput.closest('form')!);

      // Should fallback to window.location with encoded query
      await waitFor(() => {
        expect(mockLocation.href).toBe('/search?q=test%20query');
      });
    });

    it('should cleanup event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const { unmount } = render(
        <TestWrapper>
          <MobileNav />
        </TestWrapper>
      );

      // Open menu to trigger event listeners
      const menuButton = screen.getByLabelText('Open navigation menu');
      fireEvent.click(menuButton);

      unmount();

      // Should have cleaned up event listeners
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should handle touch events without crashing', () => {
      render(
        <TestWrapper>
          <MobileNav />
        </TestWrapper>
      );

      // Open mobile menu
      const menuButton = screen.getByLabelText('Open navigation menu');
      fireEvent.click(menuButton);

      const panel = screen.getByRole('dialog');

      // Simulate touch events
      fireEvent.touchStart(panel, {
        touches: [{ clientX: 100, clientY: 100 }],
      });

      fireEvent.touchEnd(panel, {
        changedTouches: [{ clientX: 50, clientY: 100 }],
      });

      // Should not crash and menu should close on swipe
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('EnhancedNavigation', () => {
    it('should handle scroll events without memory leaks', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = render(
        <TestWrapper>
          <EnhancedNavigation />
        </TestWrapper>
      );

      // Should have added scroll listener
      expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });

      unmount();

      // Should have removed scroll listener
      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    });

    it('should handle search focus and blur without crashes', () => {
      render(
        <TestWrapper>
          <EnhancedNavigation />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Search properties, locations...');

      // Focus and blur should not crash
      fireEvent.focus(searchInput);
      fireEvent.blur(searchInput);

      expect(searchInput).toBeInTheDocument();
    });
  });

  describe('SafeNavigation', () => {
    it('should render fallback when child component crashes', () => {
      const CrashingComponent = () => {
        throw new Error('Component crashed');
      };

      const fallback = <div>Navigation Error Fallback</div>;

      render(
        <SafeNavigation fallback={fallback}>
          <CrashingComponent />
        </SafeNavigation>
      );

      expect(screen.getByText('Navigation Error Fallback')).toBeInTheDocument();
    });

    it('should render loading fallback during suspense', () => {
      const loadingFallback = <div>Loading Navigation...</div>;

      render(
        <SafeNavigation loadingFallback={loadingFallback}>
          <div>Navigation Content</div>
        </SafeNavigation>
      );

      // Content should eventually render
      expect(screen.getByText('Navigation Content')).toBeInTheDocument();
    });
  });

  describe('Navigation Timeout Protection', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should timeout and fallback after 3 seconds', async () => {
      // Mock navigate to hang indefinitely
      mockNavigate.mockImplementation(() => {
        return new Promise(() => {}); // Never resolves
      });

      render(
        <TestWrapper>
          <MobileNav />
        </TestWrapper>
      );

      // Open mobile menu and click navigation
      const menuButton = screen.getByLabelText('Open navigation menu');
      fireEvent.click(menuButton);

      const homeLink = screen.getByText('Home');
      fireEvent.click(homeLink);

      // Fast-forward time to trigger timeout
      vi.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(mockLocation.href).toBe('/');
      });
    });
  });
});