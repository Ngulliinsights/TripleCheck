import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import { Navigation } from '../../layout/Navigation'
import { MobileNav } from '../MobileNav'

// Mock all external dependencies that might cause crashes
jest.mock('@shared/hooks/useAccessibility', () => ({
  useAccessibility: () => ({
    trapFocus: jest.fn(() => jest.fn()),
    announceLiveRegion: jest.fn(),
  }),
}));

// Mock Logo component with error boundary
jest.mock('@shared/components/ui/logo', () => ({
  Logo: ({ onClick, href, ...props }: any) => {
    try {
      return (
        <div 
          data-testid="logo" 
          onClick={onClick}
          role={props.interactive ? "button" : undefined}
          tabIndex={props.interactive ? 0 : -1}
        >
          Logo
        </div>
      );
    } catch (error) {
      console.error('Logo component error:', error);
      return <div data-testid="logo-error">Logo Error</div>;
    }
  },
}));

// Mock Wordmark component with error boundary
jest.mock('@shared/components/ui/wordmark', () => ({
  Wordmark: ({ onClick, href, ...props }: any) => {
    try {
      return (
        <div 
          data-testid="wordmark" 
          onClick={onClick}
          role={props.interactive ? "button" : undefined}
          tabIndex={props.interactive ? 0 : -1}
        >
          Wordmark
        </div>
      );
    } catch (error) {
      console.error('Wordmark component error:', error);
      return <div data-testid="wordmark-error">Wordmark Error</div>;
    }
  },
}));

// Mock Button component to catch any button-related crashes
jest.mock('@shared/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => {
    try {
      return (
        <button 
          onClick={onClick} 
          disabled={disabled}
          data-testid={`button-${children?.toString().toLowerCase().replace(/\s+/g, '-') || 'unknown'}`}
          {...props}
        >
          {children}
        </button>
      );
    } catch (error) {
      console.error('Button component error:', error);
      return <button data-testid="button-error">Button Error</button>;
    }
  },
}));

// Mock Input component
jest.mock('@shared/components/ui/input', () => ({
  Input: ({ onChange, value, ...props }: any) => {
    try {
      return (
        <input 
          onChange={onChange} 
          value={value}
          data-testid="input"
          {...props}
        />
      );
    } catch (error) {
      console.error('Input component error:', error);
      return <input data-testid="input-error" />;
    }
  },
}));

// Mock cn utility function
jest.mock('@shared/lib/utils', () => ({
  cn: (...classes: any[]) => {
    try {
      return classes.filter(Boolean).join(' ');
    } catch (error) {
      console.error('cn utility error:', error);
      return '';
    }
  },
}));

// Error boundary component for testing
class TestErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Test Error Boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div data-testid="error-boundary">
          Error: {this.state.error?.message || 'Unknown error'}
        </div>
      );
    }

    return this.props.children;
  }
}

const renderWithRouter = (component: React.ReactElement, initialEntries = ['/']) => {
  return render(
    <TestErrorBoundary>
      <MemoryRouter initialEntries={initialEntries}>
        {component}
      </MemoryRouter>
    </TestErrorBoundary>
  );
};

describe('Navigation Crash Tests', () => {
  beforeEach(() => {
    // Clear any previous errors
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  describe('Navigation Component Crash Tests', () => {
    it('should render without crashing', () => {
      expect(() => {
        renderWithRouter(<Navigation />);
      }).not.toThrow();
      
      expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
    });

    it('should handle navigation clicks without crashing', async () => {
      renderWithRouter(<Navigation />);
      
      const homeButton = screen.getByText('Home');
      
      expect(() => {
        fireEvent.click(homeButton);
      }).not.toThrow();
      
      expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
    });

    it('should handle dropdown interactions without crashing', async () => {
      renderWithRouter(<Navigation />);
      
      const propertiesButton = screen.getByText('Properties');
      
      expect(() => {
        fireEvent.mouseEnter(propertiesButton);
      }).not.toThrow();
      
      await waitFor(() => {
        expect(screen.queryByText('Browse Properties')).toBeInTheDocument();
      }, { timeout: 1000 });
      
      expect(() => {
        fireEvent.mouseLeave(propertiesButton);
      }).not.toThrow();
      
      expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
    });

    it('should handle search interactions without crashing', () => {
      renderWithRouter(<Navigation />);
      
      const searchInput = screen.getByPlaceholderText('Search properties...');
      
      expect(() => {
        fireEvent.change(searchInput, { target: { value: 'test search' } });
        fireEvent.focus(searchInput);
        fireEvent.blur(searchInput);
      }).not.toThrow();
      
      expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
    });

    it('should handle rapid navigation clicks without crashing', async () => {
      renderWithRouter(<Navigation />);
      
      const homeButton = screen.getByText('Home');
      const pricingButton = screen.getByText('Pricing');
      
      expect(() => {
        // Simulate rapid clicking
        for (let i = 0; i < 5; i++) {
          fireEvent.click(homeButton);
          fireEvent.click(pricingButton);
        }
      }).not.toThrow();
      
      expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
    });
  });

  describe('MobileNav Component Crash Tests', () => {
    it('should render without crashing', () => {
      expect(() => {
        renderWithRouter(<MobileNav />);
      }).not.toThrow();
      
      expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
    });

    it('should handle menu toggle without crashing', async () => {
      renderWithRouter(<MobileNav />);
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
      
      expect(() => {
        fireEvent.click(menuButton);
      }).not.toThrow();
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
    });

    it('should handle quick action clicks without crashing', async () => {
      renderWithRouter(<MobileNav />);
      
      // Open menu
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
      fireEvent.click(menuButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Test quick action buttons
      const homeButton = screen.getByText('Home');
      const propertiesButton = screen.getByText('Properties');
      
      expect(() => {
        fireEvent.click(homeButton);
      }).not.toThrow();
      
      expect(() => {
        fireEvent.click(propertiesButton);
      }).not.toThrow();
      
      expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
    });

    it('should handle section expansion without crashing', async () => {
      renderWithRouter(<MobileNav />);
      
      // Open menu
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
      fireEvent.click(menuButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Test section expansion
      const propertiesSectionButton = screen.getByRole('button', { name: /properties/i });
      
      expect(() => {
        fireEvent.click(propertiesSectionButton);
      }).not.toThrow();
      
      await waitFor(() => {
        expect(screen.getByText('All Properties')).toBeInTheDocument();
      });
      
      expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
    });

    it('should handle touch gestures without crashing', async () => {
      renderWithRouter(<MobileNav />);
      
      // Open menu
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
      fireEvent.click(menuButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const panel = screen.getByRole('dialog').querySelector('[data-testid="mobile-panel"]') || 
                   screen.getByRole('dialog').firstElementChild?.firstElementChild;
      
      if (panel) {
        expect(() => {
          // Simulate touch events
          fireEvent.touchStart(panel, {
            touches: [{ clientX: 100, clientY: 100 }]
          });
          
          fireEvent.touchMove(panel, {
            touches: [{ clientX: 50, clientY: 100 }]
          });
          
          fireEvent.touchEnd(panel);
        }).not.toThrow();
      }
      
      expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
    });

    it('should handle search functionality without crashing', async () => {
      renderWithRouter(<MobileNav />);
      
      // Open menu
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i });
      fireEvent.click(menuButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByRole('searchbox');
      
      expect(() => {
        fireEvent.change(searchInput, { target: { value: 'test search' } });
        fireEvent.submit(searchInput.closest('form')!);
      }).not.toThrow();
      
      expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
    });
  });

  describe('Component Integration Crash Tests', () => {
    it('should handle Logo component interactions without crashing', () => {
      renderWithRouter(<Navigation />);
      
      const logo = screen.getByTestId('logo');
      
      expect(() => {
        fireEvent.click(logo);
        fireEvent.keyDown(logo, { key: 'Enter' });
        fireEvent.keyDown(logo, { key: ' ' });
      }).not.toThrow();
      
      expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
      expect(screen.queryByTestId('logo-error')).not.toBeInTheDocument();
    });

    it('should handle Wordmark component interactions without crashing', () => {
      renderWithRouter(<Navigation />);
      
      const wordmark = screen.getByTestId('wordmark');
      
      expect(() => {
        fireEvent.click(wordmark);
        fireEvent.keyDown(wordmark, { key: 'Enter' });
        fireEvent.keyDown(wordmark, { key: ' ' });
      }).not.toThrow();
      
      expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
      expect(screen.queryByTestId('wordmark-error')).not.toBeInTheDocument();
    });

    it('should handle route changes without crashing', async () => {
      const { rerender } = renderWithRouter(<Navigation />, ['/']);
      
      expect(() => {
        rerender(
          <TestErrorBoundary>
            <MemoryRouter initialEntries={['/properties']}>
              <Navigation />
            </MemoryRouter>
          </TestErrorBoundary>
        );
      }).not.toThrow();
      
      expect(() => {
        rerender(
          <TestErrorBoundary>
            <MemoryRouter initialEntries={['/services']}>
              <Navigation />
            </MemoryRouter>
          </TestErrorBoundary>
        );
      }).not.toThrow();
      
      expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
    });
  });

  describe('Error Recovery Tests', () => {
    it('should recover from navigation errors gracefully', () => {
      // Mock navigate to throw an error
      const mockNavigate = jest.fn(() => {
        throw new Error('Navigation failed');
      });
      
      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate,
      }));
      
      renderWithRouter(<Navigation />);
      
      const homeButton = screen.getByText('Home');
      
      expect(() => {
        fireEvent.click(homeButton);
      }).not.toThrow();
      
      // Should not crash the entire component
      expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
    });
  });
});