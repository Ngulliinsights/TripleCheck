import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test-utils';
import { AppLayout } from '../AppLayout';

// Mock the child components
vi.mock('../Navigation', () => ({
  Navigation: ({ children, ...props }: any) => (
    <nav data-testid="navigation" {...props}>
      Navigation Component
      {children}
    </nav>
  ),
}));

vi.mock('../Footer', () => ({
  Footer: ({ children, ...props }: any) => (
    <footer data-testid="footer" {...props}>
      Footer Component
      {children}
    </footer>
  ),
}));

vi.mock('../navigation/NavigationErrorBoundary', () => ({
  NavigationErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="navigation-error-boundary">
      {children}
    </div>
  ),
}));

describe('AppLayout Component', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      renderWithProviders(
        <AppLayout>
          <div>Test Content</div>
        </AppLayout>
      );
      
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('renders all layout components', () => {
      renderWithProviders(
        <AppLayout>
          <div>Main Content</div>
        </AppLayout>
      );
      
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
      expect(screen.getByTestId('navigation-error-boundary')).toBeInTheDocument();
    });

    it('renders children in main content area', () => {
      renderWithProviders(
        <AppLayout>
          <div data-testid="main-content">Main Content</div>
        </AppLayout>
      );
      
      const mainContent = screen.getByTestId('main-content');
      expect(mainContent).toBeInTheDocument();
      
      // Check that main content is inside the main element
      const mainElement = mainContent.closest('main');
      expect(mainElement).toBeInTheDocument();
    });
  });

  describe('Layout Structure', () => {
    it('has proper semantic HTML structure', () => {
      renderWithProviders(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      );
      
      // Check for semantic elements
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // footer
    });

    it('applies correct CSS classes for layout', () => {
      const { container } = renderWithProviders(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      );
      
      const layoutContainer = container.firstChild as HTMLElement;
      expect(layoutContainer).toHaveClass('min-h-screen', 'flex', 'flex-col');
      
      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveClass('flex-1');
    });

    it('maintains proper stacking order', () => {
      renderWithProviders(
        <AppLayout>
          <div data-testid="content">Content</div>
        </AppLayout>
      );
      
      const navigation = screen.getByTestId('navigation');
      const main = screen.getByRole('main');
      const footer = screen.getByTestId('footer');
      
      // Check DOM order
      const layoutContainer = navigation.parentElement;
      const children = Array.from(layoutContainer?.children || []);
      
      const navIndex = children.findIndex(child => 
        child.contains(navigation)
      );
      const mainIndex = children.findIndex(child => child === main);
      const footerIndex = children.findIndex(child => child === footer);
      
      expect(navIndex).toBeLessThan(mainIndex);
      expect(mainIndex).toBeLessThan(footerIndex);
    });
  });

  describe('Error Boundary Integration', () => {
    it('wraps navigation in error boundary', () => {
      renderWithProviders(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      );
      
      const errorBoundary = screen.getByTestId('navigation-error-boundary');
      const navigation = screen.getByTestId('navigation');
      
      expect(errorBoundary).toContainElement(navigation);
    });

    it('does not wrap main content in error boundary', () => {
      renderWithProviders(
        <AppLayout>
          <div data-testid="content">Content</div>
        </AppLayout>
      );
      
      const content = screen.getByTestId('content');
      const errorBoundary = screen.getByTestId('navigation-error-boundary');
      
      expect(errorBoundary).not.toContainElement(content);
    });

    it('does not wrap footer in error boundary', () => {
      renderWithProviders(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      );
      
      const footer = screen.getByTestId('footer');
      const errorBoundary = screen.getByTestId('navigation-error-boundary');
      
      expect(errorBoundary).not.toContainElement(footer);
    });
  });

  describe('Content Rendering', () => {
    it('renders simple text content', () => {
      renderWithProviders(
        <AppLayout>
          Simple text content
        </AppLayout>
      );
      
      expect(screen.getByText('Simple text content')).toBeInTheDocument();
    });

    it('renders complex JSX content', () => {
      renderWithProviders(
        <AppLayout>
          <div>
            <h1>Page Title</h1>
            <p>Page description</p>
            <button>Action Button</button>
          </div>
        </AppLayout>
      );
      
      expect(screen.getByRole('heading', { name: 'Page Title' })).toBeInTheDocument();
      expect(screen.getByText('Page description')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action Button' })).toBeInTheDocument();
    });

    it('renders multiple child elements', () => {
      renderWithProviders(
        <AppLayout>
          <div data-testid="child1">Child 1</div>
          <div data-testid="child2">Child 2</div>
          <div data-testid="child3">Child 3</div>
        </AppLayout>
      );
      
      expect(screen.getByTestId('child1')).toBeInTheDocument();
      expect(screen.getByTestId('child2')).toBeInTheDocument();
      expect(screen.getByTestId('child3')).toBeInTheDocument();
    });

    it('handles empty children gracefully', () => {
      renderWithProviders(<AppLayout>{null}</AppLayout>);
      
      // Should still render navigation and footer
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('handles undefined children gracefully', () => {
      renderWithProviders(<AppLayout>{undefined}</AppLayout>);
      
      // Should still render navigation and footer
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('maintains layout structure on different screen sizes', () => {
      // Test with different viewport sizes
      const originalInnerWidth = window.innerWidth;
      
      // Mobile size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      const { container: mobileContainer } = renderWithProviders(
        <AppLayout>
          <div>Mobile Content</div>
        </AppLayout>
      );
      
      const mobileLayout = mobileContainer.firstChild as HTMLElement;
      expect(mobileLayout).toHaveClass('min-h-screen', 'flex', 'flex-col');
      
      // Desktop size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });
      
      const { container: desktopContainer } = renderWithProviders(
        <AppLayout>
          <div>Desktop Content</div>
        </AppLayout>
      );
      
      const desktopLayout = desktopContainer.firstChild as HTMLElement;
      expect(desktopLayout).toHaveClass('min-h-screen', 'flex', 'flex-col');
      
      // Restore original width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: originalInnerWidth,
      });
    });
  });

  describe('Accessibility', () => {
    it('provides proper landmark roles', () => {
      renderWithProviders(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      );
      
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('maintains proper heading hierarchy', () => {
      renderWithProviders(
        <AppLayout>
          <h1>Main Page Title</h1>
          <h2>Section Title</h2>
        </AppLayout>
      );
      
      const h1 = screen.getByRole('heading', { level: 1 });
      const h2 = screen.getByRole('heading', { level: 2 });
      
      expect(h1).toBeInTheDocument();
      expect(h2).toBeInTheDocument();
    });

    it('allows keyboard navigation through layout', () => {
      renderWithProviders(
        <AppLayout>
          <div>
            <button>First Button</button>
            <button>Second Button</button>
          </div>
        </AppLayout>
      );
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabindex', '-1');
      });
    });
  });

  describe('Performance', () => {
    it('does not cause unnecessary re-renders', () => {
      const renderSpy = vi.fn();
      
      const TestChild = () => {
        renderSpy();
        return <div>Test Child</div>;
      };
      
      const { rerender } = renderWithProviders(
        <AppLayout>
          <TestChild />
        </AppLayout>
      );
      
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with same props
      rerender(
        <AppLayout>
          <TestChild />
        </AppLayout>
      );
      
      // Child should re-render due to React's default behavior,
      // but layout itself should be stable
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Integration with Router', () => {
    it('works with router context', () => {
      renderWithProviders(
        <AppLayout>
          <div>Routed Content</div>
        </AppLayout>,
        { withRouter: true }
      );
      
      expect(screen.getByText('Routed Content')).toBeInTheDocument();
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
    });

    it('works without router context', () => {
      renderWithProviders(
        <AppLayout>
          <div>Non-routed Content</div>
        </AppLayout>,
        { withRouter: false }
      );
      
      expect(screen.getByText('Non-routed Content')).toBeInTheDocument();
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles very long content', () => {
      const longContent = 'A'.repeat(10000);
      
      renderWithProviders(
        <AppLayout>
          <div data-testid="long-content">{longContent}</div>
        </AppLayout>
      );
      
      const content = screen.getByTestId('long-content');
      expect(content).toHaveTextContent(longContent);
      
      // Layout should still be intact
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('handles content with special characters', () => {
      const specialContent = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      
      renderWithProviders(
        <AppLayout>
          <div>{specialContent}</div>
        </AppLayout>
      );
      
      expect(screen.getByText(specialContent)).toBeInTheDocument();
    });

    it('handles deeply nested content', () => {
      renderWithProviders(
        <AppLayout>
          <div>
            <div>
              <div>
                <div>
                  <div data-testid="deeply-nested">
                    Deeply nested content
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AppLayout>
      );
      
      expect(screen.getByTestId('deeply-nested')).toBeInTheDocument();
    });
  });
});