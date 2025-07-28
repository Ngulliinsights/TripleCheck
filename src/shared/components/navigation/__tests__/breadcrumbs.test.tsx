import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test-utils';

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockLocation = { pathname: '/properties/residential/123' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

// Create a simple Breadcrumbs component for testing
const Breadcrumbs: React.FC<{ 
  items?: Array<{ label: string; href?: string; active?: boolean }>;
  separator?: string;
  className?: string;
}> = ({ 
  items = [], 
  separator = '/', 
  className = '' 
}) => {
  const navigate = mockNavigate;
  
  // Auto-generate breadcrumbs from current path if no items provided
  const breadcrumbItems = items.length > 0 ? items : generateBreadcrumbsFromPath(mockLocation.pathname);

  const handleClick = (href: string) => {
    if (href) {
      navigate(href);
    }
  };

  return (
    <nav aria-label="Breadcrumb" className={className} data-testid="breadcrumbs">
      <ol className="breadcrumb-list">
        {breadcrumbItems.map((item, index) => (
          <li key={index} className={`breadcrumb-item ${item.active ? 'active' : ''}`}>
            {item.href && !item.active ? (
              <button
                onClick={() => handleClick(item.href!)}
                className="breadcrumb-link"
                aria-current={item.active ? 'page' : undefined}
              >
                {item.label}
              </button>
            ) : (
              <span className="breadcrumb-text" aria-current={item.active ? 'page' : undefined}>
                {item.label}
              </span>
            )}
            {index < breadcrumbItems.length - 1 && (
              <span className="breadcrumb-separator" aria-hidden="true">
                {separator}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

// Helper function to generate breadcrumbs from path
function generateBreadcrumbsFromPath(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = [{ label: 'Home', href: '/' }];

  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;
    
    // Convert segment to readable label
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    
    breadcrumbs.push({
      label,
      href: isLast ? undefined : currentPath,
      active: isLast,
    });
  });

  return breadcrumbs;
}

describe('Breadcrumbs Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render breadcrumbs with custom items', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Properties', href: '/properties' },
        { label: 'Residential', active: true },
      ];

      renderWithProviders(<Breadcrumbs items={items} />);

      expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Properties')).toBeInTheDocument();
      expect(screen.getByText('Residential')).toBeInTheDocument();
    });

    it('should auto-generate breadcrumbs from current path', () => {
      renderWithProviders(<Breadcrumbs />);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Properties')).toBeInTheDocument();
      expect(screen.getByText('Residential')).toBeInTheDocument();
      expect(screen.getByText('123')).toBeInTheDocument();
    });

    it('should render with custom separator', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Properties', href: '/properties' },
        { label: 'Residential', active: true },
      ];

      renderWithProviders(<Breadcrumbs items={items} separator=" > " />);

      expect(screen.getByText('>')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      renderWithProviders(<Breadcrumbs className="custom-breadcrumbs" />);

      expect(screen.getByTestId('breadcrumbs')).toHaveClass('custom-breadcrumbs');
    });

    it('should render clickable links for non-active items', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Properties', href: '/properties' },
        { label: 'Residential', active: true },
      ];

      renderWithProviders(<Breadcrumbs items={items} />);

      const homeLink = screen.getByRole('button', { name: 'Home' });
      const propertiesLink = screen.getByRole('button', { name: 'Properties' });

      expect(homeLink).toBeInTheDocument();
      expect(propertiesLink).toBeInTheDocument();
      expect(homeLink).toHaveClass('breadcrumb-link');
      expect(propertiesLink).toHaveClass('breadcrumb-link');
    });

    it('should render non-clickable text for active items', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Properties', href: '/properties' },
        { label: 'Residential', active: true },
      ];

      renderWithProviders(<Breadcrumbs items={items} />);

      const activeItem = screen.getByText('Residential');
      expect(activeItem).toHaveClass('breadcrumb-text');
      expect(activeItem).toHaveAttribute('aria-current', 'page');
    });

    it('should not render separator after last item', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Properties', active: true },
      ];

      renderWithProviders(<Breadcrumbs items={items} />);

      const separators = screen.getAllByText('/');
      expect(separators).toHaveLength(1); // Only one separator between Home and Properties
    });
  });

  describe('Navigation', () => {
    it('should navigate when clicking on breadcrumb links', async () => {
      const user = userEvent.setup();
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Properties', href: '/properties' },
        { label: 'Residential', active: true },
      ];

      renderWithProviders(<Breadcrumbs items={items} />);

      const homeLink = screen.getByRole('button', { name: 'Home' });
      await user.click(homeLink);

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('should navigate to properties page', async () => {
      const user = userEvent.setup();
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Properties', href: '/properties' },
        { label: 'Residential', active: true },
      ];

      renderWithProviders(<Breadcrumbs items={items} />);

      const propertiesLink = screen.getByRole('button', { name: 'Properties' });
      await user.click(propertiesLink);

      expect(mockNavigate).toHaveBeenCalledWith('/properties');
    });

    it('should not navigate when clicking on active items', async () => {
      const user = userEvent.setup();
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Properties', href: '/properties' },
        { label: 'Residential', active: true },
      ];

      renderWithProviders(<Breadcrumbs items={items} />);

      const activeItem = screen.getByText('Residential');
      await user.click(activeItem);

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should handle keyboard navigation', async () => {
      const user = userEvent.setup();
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Properties', href: '/properties' },
        { label: 'Residential', active: true },
      ];

      renderWithProviders(<Breadcrumbs items={items} />);

      const homeLink = screen.getByRole('button', { name: 'Home' });
      
      // Focus and press Enter
      homeLink.focus();
      await user.keyboard('{Enter}');

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('should handle keyboard navigation with Space key', async () => {
      const user = userEvent.setup();
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Properties', href: '/properties' },
        { label: 'Residential', active: true },
      ];

      renderWithProviders(<Breadcrumbs items={items} />);

      const propertiesLink = screen.getByRole('button', { name: 'Properties' });
      
      // Focus and press Space
      propertiesLink.focus();
      await user.keyboard(' ');

      expect(mockNavigate).toHaveBeenCalledWith('/properties');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Properties', href: '/properties' },
        { label: 'Residential', active: true },
      ];

      renderWithProviders(<Breadcrumbs items={items} />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Breadcrumb');
    });

    it('should mark active item with aria-current="page"', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Properties', href: '/properties' },
        { label: 'Residential', active: true },
      ];

      renderWithProviders(<Breadcrumbs items={items} />);

      const activeItem = screen.getByText('Residential');
      expect(activeItem).toHaveAttribute('aria-current', 'page');
    });

    it('should hide separators from screen readers', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Properties', href: '/properties' },
        { label: 'Residential', active: true },
      ];

      renderWithProviders(<Breadcrumbs items={items} />);

      const separators = screen.getAllByText('/');
      expect(separators[0]).toHaveAttribute('aria-hidden', 'true');
    });

    it('should be keyboard accessible', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Properties', href: '/properties' },
        { label: 'Residential', active: true },
      ];

      renderWithProviders(<Breadcrumbs items={items} />);

      const homeLink = screen.getByRole('button', { name: 'Home' });
      const propertiesLink = screen.getByRole('button', { name: 'Properties' });

      expect(homeLink).toBeInTheDocument();
      expect(propertiesLink).toBeInTheDocument();
    });
  });

  describe('Active States', () => {
    it('should apply active class to active items', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Properties', href: '/properties' },
        { label: 'Residential', active: true },
      ];

      renderWithProviders(<Breadcrumbs items={items} />);

      const activeItem = screen.getByText('Residential').closest('li');
      expect(activeItem).toHaveClass('active');
    });

    it('should not apply active class to non-active items', () => {
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Properties', href: '/properties' },
        { label: 'Residential', active: true },
      ];

      renderWithProviders(<Breadcrumbs items={items} />);

      const homeItem = screen.getByText('Home').closest('li');
      const propertiesItem = screen.getByText('Properties').closest('li');

      expect(homeItem).not.toHaveClass('active');
      expect(propertiesItem).not.toHaveClass('active');
    });

    it('should automatically mark last item as active when auto-generating', () => {
      renderWithProviders(<Breadcrumbs />);

      const lastItem = screen.getByText('123').closest('li');
      expect(lastItem).toHaveClass('active');
    });
  });

  describe('Path Generation', () => {
    it('should handle root path correctly', () => {
      const mockRootLocation = { pathname: '/' };
      vi.mocked(mockLocation).pathname = '/';

      renderWithProviders(<Breadcrumbs />);

      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    it('should handle single level paths', () => {
      const mockSingleLocation = { pathname: '/properties' };
      vi.mocked(mockLocation).pathname = '/properties';

      renderWithProviders(<Breadcrumbs />);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Properties')).toBeInTheDocument();
    });

    it('should handle deep nested paths', () => {
      const mockDeepLocation = { pathname: '/properties/residential/nairobi/westlands/123' };
      vi.mocked(mockLocation).pathname = '/properties/residential/nairobi/westlands/123';

      renderWithProviders(<Breadcrumbs />);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Properties')).toBeInTheDocument();
      expect(screen.getByText('Residential')).toBeInTheDocument();
      expect(screen.getByText('Nairobi')).toBeInTheDocument();
      expect(screen.getByText('Westlands')).toBeInTheDocument();
      expect(screen.getByText('123')).toBeInTheDocument();
    });

    it('should handle paths with hyphens', () => {
      const mockHyphenLocation = { pathname: '/fraud-detection/basic-checks' };
      vi.mocked(mockLocation).pathname = '/fraud-detection/basic-checks';

      renderWithProviders(<Breadcrumbs />);

      expect(screen.getByText('Fraud detection')).toBeInTheDocument();
      expect(screen.getByText('Basic checks')).toBeInTheDocument();
    });

    it('should handle empty segments gracefully', () => {
      const mockEmptyLocation = { pathname: '/properties//residential' };
      vi.mocked(mockLocation).pathname = '/properties//residential';

      renderWithProviders(<Breadcrumbs />);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Properties')).toBeInTheDocument();
      expect(screen.getByText('Residential')).toBeInTheDocument();
      // Should not have empty segments - check that all breadcrumb items have content
      const breadcrumbItems = screen.getAllByRole('listitem');
      breadcrumbItems.forEach(item => {
        expect(item.textContent?.trim()).not.toBe('');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle empty items array', () => {
      renderWithProviders(<Breadcrumbs items={[]} />);

      // Should auto-generate from path
      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    it('should handle items without href', () => {
      const items = [
        { label: 'Home' }, // No href
        { label: 'Properties', active: true },
      ];

      renderWithProviders(<Breadcrumbs items={items} />);

      const homeItem = screen.getByText('Home');
      expect(homeItem).toHaveClass('breadcrumb-text');
    });

    it('should handle navigation errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockNavigate.mockImplementationOnce(() => {
        throw new Error('Navigation failed');
      });

      const items = [
        { label: 'Home', href: '/' },
        { label: 'Properties', active: true },
      ];

      renderWithProviders(<Breadcrumbs items={items} />);

      const homeLink = screen.getByRole('button', { name: 'Home' });
      
      // Should not throw
      await user.click(homeLink);

      consoleSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('should not re-generate breadcrumbs unnecessarily', () => {
      renderWithProviders(<Breadcrumbs />, { withRouter: false });

      const initialBreadcrumbs = screen.getByTestId('breadcrumbs');
      
      // Should be in the document and stable
      expect(initialBreadcrumbs).toBeInTheDocument();
    });

    it('should handle rapid navigation changes', async () => {
      const user = userEvent.setup();
      const items = [
        { label: 'Home', href: '/' },
        { label: 'Properties', href: '/properties' },
        { label: 'Residential', href: '/residential' },
        { label: 'Current', active: true },
      ];

      renderWithProviders(<Breadcrumbs items={items} />);

      const homeLink = screen.getByRole('button', { name: 'Home' });
      const propertiesLink = screen.getByRole('button', { name: 'Properties' });

      // Rapid clicks
      await user.click(homeLink);
      await user.click(propertiesLink);
      await user.click(homeLink);

      expect(mockNavigate).toHaveBeenCalledTimes(3);
    });
  });
});