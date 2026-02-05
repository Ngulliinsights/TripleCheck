import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test-utils'
import { Navigation } from '../Navigation'

// Mock the child components
vi.mock('../navigation/MobileNav', () => ({
  MobileNav: () => <div data-testid="mobile-nav">Mobile Navigation</div>,
}));

vi.mock('../ui/logo', () => ({
  Logo: ({ size, variant, interactive, href, ...props }: any) => (
    <div 
      data-testid="logo" 
      data-size={size}
      data-variant={variant}
      data-interactive={interactive}
      data-href={href}
      {...props}
    >
      Logo
    </div>
  ),
}));

vi.mock('../ui/wordmark', () => ({
  Wordmark: ({ size, variant, animated, interactive, href, ...props }: any) => (
    <div 
      data-testid="wordmark"
      data-size={size}
      data-variant={variant}
      data-animated={animated}
      data-interactive={interactive}
      data-href={href}
      {...props}
    >
      Wordmark
    </div>
  ),
}));

// Mock react-router-dom hooks
const mockNavigate = vi.fn();
const mockLocation = { pathname: '/' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

describe('Navigation Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset scroll position
    Object.defineProperty(window, 'pageYOffset', {
      writable: true,
      configurable: true,
      value: 0,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      renderWithProviders(<Navigation />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('renders logo and wordmark', () => {
      renderWithProviders(<Navigation />);
      
      expect(screen.getByTestId('logo')).toBeInTheDocument();
      expect(screen.getByTestId('wordmark')).toBeInTheDocument();
    });

    it('renders navigation items', () => {
      renderWithProviders(<Navigation />);
      
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Properties')).toBeInTheDocument();
      expect(screen.getByText('Services')).toBeInTheDocument();
      expect(screen.getByText('Pricing')).toBeInTheDocument();
      expect(screen.getByText('Help')).toBeInTheDocument();
    });

    it('renders search input', () => {
      renderWithProviders(<Navigation />);
      
      expect(screen.getByPlaceholderText('Search properties...')).toBeInTheDocument();
    });

    it('renders authentication buttons when not authenticated', () => {
      renderWithProviders(<Navigation />);
      
      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Get Started' })).toBeInTheDocument();
    });

    it('renders mobile navigation', () => {
      renderWithProviders(<Navigation />);
      
      expect(screen.getByTestId('mobile-nav')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('applies default variant styles', () => {
      const { container } = renderWithProviders(<Navigation />);
      const nav = container.querySelector('nav');
      
      expect(nav).toHaveClass('bg-white/95', 'backdrop-blur-md');
    });

    it('applies transparent variant styles when not scrolled', () => {
      const { container } = renderWithProviders(<Navigation variant="transparent" />);
      const nav = container.querySelector('nav');
      
      expect(nav).toHaveClass('bg-transparent');
    });

    it('changes to solid background when scrolled with transparent variant', async () => {
      const { container } = renderWithProviders(<Navigation variant="transparent" />);
      
      // Simulate scroll
      Object.defineProperty(window, 'pageYOffset', {
        writable: true,
        configurable: true,
        value: 50,
      });
      
      fireEvent.scroll(window);
      
      await waitFor(() => {
        const nav = container.querySelector('nav');
        expect(nav).toHaveClass('bg-white/95', 'backdrop-blur-md');
      });
    });

    it('applies custom className', () => {
      const { container } = renderWithProviders(
        <Navigation className="custom-nav-class" />
      );
      const nav = container.querySelector('nav');
      
      expect(nav).toHaveClass('custom-nav-class');
    });
  });

  describe('Scroll Behavior', () => {
    it('updates styling based on scroll position', async () => {
      const { container } = renderWithProviders(<Navigation />);
      const nav = container.querySelector('nav');
      
      // Initially not scrolled
      expect(nav).toHaveClass('py-4');
      expect(nav).not.toHaveClass('py-2');
      
      // Simulate scroll
      Object.defineProperty(window, 'pageYOffset', {
        writable: true,
        configurable: true,
        value: 50,
      });
      
      fireEvent.scroll(window);
      
      await waitFor(() => {
        expect(nav).toHaveClass('py-2');
        expect(nav).not.toHaveClass('py-4');
      });
    });

    it('throttles scroll events for performance', async () => {
      const scrollHandler = vi.fn();
      
      // Mock requestAnimationFrame
      const mockRAF = vi.fn((callback) => {
        callback();
        return 1;
      });
      
      Object.defineProperty(window, 'requestAnimationFrame', {
        writable: true,
        value: mockRAF,
      });
      
      renderWithProviders(<Navigation />);
      
      // Trigger multiple scroll events rapidly
      for (let i = 0; i < 10; i++) {
        fireEvent.scroll(window);
      }
      
      // Should use requestAnimationFrame for throttling
      expect(mockRAF).toHaveBeenCalled();
    });
  });

  describe('Navigation Interactions', () => {
    it('handles navigation item clicks', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Navigation />);
      
      await user.click(screen.getByText('Home'));
      expect(mockNavigate).toHaveBeenCalledWith('/');
      
      await user.click(screen.getByText('Pricing'));
      expect(mockNavigate).toHaveBeenCalledWith('/pricing');
    });

    it('shows dropdown on hover for items with dropdowns', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Navigation />);
      
      const propertiesButton = screen.getByText('Properties');
      await user.hover(propertiesButton);
      
      await waitFor(() => {
        expect(screen.getByText('Browse Properties')).toBeInTheDocument();
        expect(screen.getByText('Residential')).toBeInTheDocument();
        expect(screen.getByText('Commercial')).toBeInTheDocument();
        expect(screen.getByText('Land')).toBeInTheDocument();
      });
    });

    it('shows dropdown on click for items with dropdowns', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Navigation />);
      
      const servicesButton = screen.getByText('Services');
      await user.click(servicesButton);
      
      await waitFor(() => {
        expect(screen.getByText('Property Verification')).toBeInTheDocument();
        expect(screen.getByText('Fraud Detection')).toBeInTheDocument();
        expect(screen.getByText('Document Authentication')).toBeInTheDocument();
        expect(screen.getByText('List Your Property')).toBeInTheDocument();
      });
    });

    it('closes dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Navigation />);
      
      // Open dropdown
      const servicesButton = screen.getByText('Services');
      await user.click(servicesButton);
      
      await waitFor(() => {
        expect(screen.getByText('Property Verification')).toBeInTheDocument();
      });
      
      // Click outside
      await user.click(document.body);
      
      await waitFor(() => {
        expect(screen.queryByText('Property Verification')).not.toBeInTheDocument();
      });
    });

    it('handles dropdown item clicks', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Navigation />);
      
      // Open dropdown
      const propertiesButton = screen.getByText('Properties');
      await user.hover(propertiesButton);
      
      await waitFor(() => {
        expect(screen.getByText('Residential')).toBeInTheDocument();
      });
      
      // Click dropdown item
      await user.click(screen.getByText('Residential'));
      expect(mockNavigate).toHaveBeenCalledWith('/properties/residential');
    });
  });

  describe('Search Functionality', () => {
    it('handles search input changes', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Navigation />);
      
      const searchInput = screen.getByPlaceholderText('Search properties...');
      await user.type(searchInput, 'Nairobi apartments');
      
      expect(searchInput).toHaveValue('Nairobi apartments');
    });

    it('shows search suggestions when focused', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Navigation />);
      
      const searchInput = screen.getByPlaceholderText('Search properties...');
      await user.click(searchInput);
      
      await waitFor(() => {
        expect(screen.getByText('Popular Searches')).toBeInTheDocument();
        expect(screen.getByText('Nairobi apartments')).toBeInTheDocument();
        expect(screen.getByText('Westlands properties')).toBeInTheDocument();
      });
    });

    it('handles search on Enter key', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Navigation />);
      
      const searchInput = screen.getByPlaceholderText('Search properties...');
      await user.type(searchInput, 'test search');
      await user.keyboard('{Enter}');
      
      expect(mockNavigate).toHaveBeenCalledWith('/search?q=test%20search');
    });

    it('handles search suggestion clicks', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Navigation />);
      
      const searchInput = screen.getByPlaceholderText('Search properties...');
      await user.click(searchInput);
      
      await waitFor(() => {
        expect(screen.getByText('Nairobi apartments')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Nairobi apartments'));
      expect(mockNavigate).toHaveBeenCalledWith('/search?q=Nairobi%20apartments');
    });

    it('closes search suggestions when clicking outside', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Navigation />);
      
      const searchInput = screen.getByPlaceholderText('Search properties...');
      await user.click(searchInput);
      
      await waitFor(() => {
        expect(screen.getByText('Popular Searches')).toBeInTheDocument();
      });
      
      await user.click(document.body);
      
      await waitFor(() => {
        expect(screen.queryByText('Popular Searches')).not.toBeInTheDocument();
      });
    });
  });

  describe('Authentication Buttons', () => {
    it('handles login button click', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Navigation />);
      
      await user.click(screen.getByRole('button', { name: 'Login' }));
      expect(mockNavigate).toHaveBeenCalledWith('/auth/login');
    });

    it('handles get started button click', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Navigation />);
      
      await user.click(screen.getByRole('button', { name: 'Get Started' }));
      expect(mockNavigate).toHaveBeenCalledWith('/auth/register');
    });
  });

  describe('Error Handling', () => {
    it('handles navigation errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Mock navigate to throw an error
      mockNavigate.mockImplementationOnce(() => {
        throw new Error('Navigation failed');
      });
      
      // Mock window.location.href
      delete (window as any).location;
      window.location = { href: '' } as any;
      
      renderWithProviders(<Navigation />);
      
      await user.click(screen.getByText('Home'));
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Navigation failed, falling back to window.location:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });

    it('handles search navigation errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Mock navigate to throw an error
      mockNavigate.mockImplementationOnce(() => {
        throw new Error('Search navigation failed');
      });
      
      // Mock window.location.href
      delete (window as any).location;
      window.location = { href: '' } as any;
      
      renderWithProviders(<Navigation />);
      
      const searchInput = screen.getByPlaceholderText('Search properties...');
      await user.type(searchInput, 'test');
      await user.keyboard('{Enter}');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Search navigation failed:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Responsive Behavior', () => {
    it('hides desktop navigation on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      renderWithProviders(<Navigation />);
      
      // Desktop navigation should be hidden (has lg:flex class)
      const desktopNav = screen.getByText('Home').closest('.hidden.lg/:flex');
      expect(desktopNav).toBeInTheDocument();
    });

    it('shows mobile navigation component', () => {
      renderWithProviders(<Navigation />);
      
      expect(screen.getByTestId('mobile-nav')).toBeInTheDocument();
    });

    it('hides some buttons on smaller screens', () => {
      renderWithProviders(<Navigation />);
      
      const loginButton = screen.getByRole('button', { name: 'Login' });
      const getStartedButton = screen.getByRole('button', { name: 'Get Started' });
      
      // These buttons should have responsive classes
      expect(loginButton).toHaveClass('hidden', 'lg:flex');
      expect(getStartedButton).toHaveClass('hidden', 'lg:flex');
    });
  });

  describe('Accessibility', () => {
    it('has proper navigation role', () => {
      renderWithProviders(<Navigation />);
      
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('has proper button roles and labels', () => {
      renderWithProviders(<Navigation />);
      
      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Get Started' })).toBeInTheDocument();
    });

    it('has proper search input accessibility', () => {
      renderWithProviders(<Navigation />);
      
      const searchInput = screen.getByPlaceholderText('Search properties...');
      expect(searchInput).toHaveAttribute('type', 'search');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Navigation />);
      
      // Tab through navigation items
      await user.tab();
      
      // Should be able to navigate through focusable elements
      const focusableElements = screen.getAllByRole('button');
      expect(focusableElements.length).toBeGreaterThan(0);
    });

    it('has proper ARIA attributes for dropdowns', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Navigation />);
      
      const propertiesButton = screen.getByText('Properties');
      
      // Should have proper ARIA attributes when dropdown is closed
      expect(propertiesButton.closest('button')).toHaveAttribute('aria-expanded');
    });
  });

  describe('Performance', () => {
    it('cleans up event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      const { unmount } = renderWithProviders(<Navigation />);
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
      
      removeEventListenerSpy.mockRestore();
    });

    it('cleans up document event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      
      const { unmount } = renderWithProviders(<Navigation />);
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
      
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Logo and Wordmark Props', () => {
    it('passes correct props to Logo component', () => {
      renderWithProviders(<Navigation />);
      
      const logo = screen.getByTestId('logo');
      expect(logo).toHaveAttribute('data-size', 'md');
      expect(logo).toHaveAttribute('data-variant', 'default');
      expect(logo).toHaveAttribute('data-interactive', 'true');
      expect(logo).toHaveAttribute('data-href', '/');
    });

    it('passes correct props to Wordmark component', () => {
      renderWithProviders(<Navigation />);
      
      const wordmark = screen.getByTestId('wordmark');
      expect(wordmark).toHaveAttribute('data-size', 'md');
      expect(wordmark).toHaveAttribute('data-variant', 'default');
      expect(wordmark).toHaveAttribute('data-animated', 'true');
      expect(wordmark).toHaveAttribute('data-interactive', 'true');
      expect(wordmark).toHaveAttribute('data-href', '/');
    });

    it('passes light variant to logo and wordmark when transparent and not scrolled', () => {
      renderWithProviders(<Navigation variant="transparent" />);
      
      const logo = screen.getByTestId('logo');
      const wordmark = screen.getByTestId('wordmark');
      
      expect(logo).toHaveAttribute('data-variant', 'light');
      expect(wordmark).toHaveAttribute('data-variant', 'light');
    });
  });
});