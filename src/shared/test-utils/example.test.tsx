/**
 * Example test file demonstrating comprehensive testing utilities
 * This file serves as documentation and examples for the testing framework
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import {
  renderWithProviders,
  renderWithAuth,
  renderWithAdmin,
  setupUserEvent,
  testA11y,
  testFormAccessibility,
  TestDataFactory,
  testScenarios,
  TestPatterns,
  PropertyTestPatterns,
  UserTestPatterns,
  mockApiSuccess,
  mockApiError,
  server,
  createTestFile,
  createTestImageFile,
} from './index';

// Example components for testing
const SimpleButton = ({ onClick, children, disabled = false }: {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) => (
  <button onClick={onClick} disabled={disabled} aria-label="Test button">
    {children}
  </button>
);

const LoginForm = ({ onSubmit }: { onSubmit: (data: any) => void }) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Login form">
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          aria-describedby="email-error"
        />
        <div id="email-error" role="alert"></div>
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          aria-describedby="password-error"
        />
        <div id="password-error" role="alert"></div>
      </div>
      <button type="submit">Login</button>
    </form>
  );
};

const PropertyCard = ({ property }: { property: any }) => (
  <div data-testid="property-card" role="article">
    <h3>{property.title}</h3>
    <p>{property.location}</p>
    <p>KES {property.price.toLocaleString()}</p>
    <p>{property.features.bedrooms} bed, {property.features.bathrooms} bath</p>
    <img src={property.imageUrls[0]} alt={property.title} />
  </div>
);

const FileUpload = ({ onUpload }: { onUpload: (files: FileList) => void }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onUpload(e.target.files);
    }
  };

  return (
    <div>
      <label htmlFor="file-upload">Upload files</label>
      <input
        id="file-upload"
        type="file"
        multiple
        accept="image/*"
        onChange={handleChange}
      />
    </div>
  );
};

describe('Testing Utilities Examples', () => {
  describe('Basic Rendering', () => {
    it('should render component without providers', () => {
      const handleClick = vi.fn();
      
      renderWithProviders(
        <SimpleButton onClick={handleClick}>Click me</SimpleButton>,
        { withRouter: false }
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('should render with authenticated user', () => {
      const handleClick = vi.fn();
      
      renderWithAuth(
        <SimpleButton onClick={handleClick}>Click me</SimpleButton>
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render with admin user', () => {
      const handleClick = vi.fn();
      
      renderWithAdmin(
        <SimpleButton onClick={handleClick}>Admin Button</SimpleButton>
      );

      expect(screen.getByText('Admin Button')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle button clicks', async () => {
      const user = setupUserEvent();
      const handleClick = vi.fn();
      
      renderWithProviders(
        <SimpleButton onClick={handleClick}>Click me</SimpleButton>
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should handle form submission using patterns', async () => {
      const handleSubmit = vi.fn();
      
      renderWithProviders(<LoginForm onSubmit={handleSubmit} />);

      await TestPatterns.testFormSubmission(
        'form',
        {
          email: 'test@example.com',
          password: 'password123',
        },
        handleSubmit,
        {
          email: 'test@example.com',
          password: 'password123',
        }
      );
    });

    it('should test user authentication flow', async () => {
      renderWithProviders(<LoginForm onSubmit={vi.fn()} />);

      await UserTestPatterns.testLogin({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  describe('Accessibility Testing', () => {
    it('should pass basic accessibility tests', async () => {
      const { container } = renderWithProviders(
        <SimpleButton onClick={vi.fn()}>Accessible Button</SimpleButton>
      );

      await testA11y(container);
    });

    it('should test form accessibility', async () => {
      const { container } = renderWithProviders(
        <LoginForm onSubmit={vi.fn()} />
      );

      await testFormAccessibility(container, {
        expectLabels: ['#email', '#password'],
        expectRequired: ['#email', '#password'],
      });
    });

    it('should test keyboard navigation', async () => {
      renderWithProviders(
        <div>
          <button>First</button>
          <button>Second</button>
          <input type="text" placeholder="Third" />
        </div>
      );

      await TestPatterns.testKeyboardNavigation([
        'First',
        'Second', 
        'Third'
      ]);
    });
  });

  describe('API Mocking', () => {
    it('should mock successful API responses', async () => {
      const testData = { message: 'Success' };
      
      server.use(
        mockApiSuccess('/api/test', testData)
      );

      const response = await fetch('/api/test');
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toEqual(testData);
    });

    it('should mock API errors', async () => {
      server.use(
        mockApiError('/api/test', {
          status: 404,
          message: 'Not found',
        })
      );

      const response = await fetch('/api/test');
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });

    it('should test loading states with API calls', async () => {
      // Mock delayed response
      server.use(
        mockApiSuccess('/api/slow', { data: 'loaded' }, { delay: 100 })
      );

      const LoadingComponent = () => {
        const [loading, setLoading] = React.useState(true);
        const [data, setData] = React.useState(null);

        React.useEffect(() => {
          fetch('/api/slow')
            .then(res => res.json())
            .then(result => {
              setData(result.data);
              setLoading(false);
            });
        }, []);

        if (loading) return <div>Loading...</div>;
        return <div>Data: {data}</div>;
      };

      renderWithProviders(<LoadingComponent />);

      // Should show loading initially
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Data: loaded')).toBeInTheDocument();
      });
    });
  });

  describe('Test Data and Fixtures', () => {
    it('should create test users with factory', () => {
      const user = TestDataFactory.createUser({
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');
      expect(user.email).toContain('@example.com');
      expect(user.trustScore).toBeGreaterThanOrEqual(0);
    });

    it('should create test properties with factory', () => {
      const property = TestDataFactory.createProperty({
        title: 'Test Property',
        price: 1000000,
      });

      expect(property.title).toBe('Test Property');
      expect(property.price).toBe(1000000);
      expect(property.features.bedrooms).toBeGreaterThan(0);
    });

    it('should use predefined test scenarios', () => {
      const scenario = testScenarios.singleUserWithProperty();
      
      expect(scenario.user).toBeDefined();
      expect(scenario.property).toBeDefined();
      expect(scenario.property.ownerId).toBe(scenario.user.id);
    });

    it('should render property card with test data', () => {
      const property = TestDataFactory.createProperty();
      
      renderWithProviders(<PropertyCard property={property} />);

      PropertyTestPatterns.testPropertyCard(property);
    });
  });

  describe('File Upload Testing', () => {
    it('should handle file uploads', async () => {
      const user = setupUserEvent();
      const handleUpload = vi.fn();
      
      renderWithProviders(<FileUpload onUpload={handleUpload} />);

      const file = createTestFile('test.txt', 'test content');
      const fileInput = screen.getByLabelText(/upload files/i);
      
      await user.upload(fileInput, file);

      expect(handleUpload).toHaveBeenCalledWith(
        expect.objectContaining({
          0: expect.objectContaining({
            name: 'test.txt',
            type: 'text/plain',
          }),
        })
      );
    });

    it('should handle image uploads', async () => {
      const user = setupUserEvent();
      const handleUpload = vi.fn();
      
      renderWithProviders(<FileUpload onUpload={handleUpload} />);

      const imageFile = createTestImageFile('test-image.jpg');
      const fileInput = screen.getByLabelText(/upload files/i);
      
      await user.upload(fileInput, imageFile);

      expect(handleUpload).toHaveBeenCalledWith(
        expect.objectContaining({
          0: expect.objectContaining({
            name: 'test-image.jpg',
            type: 'image/jpeg',
          }),
        })
      );
    });
  });

  describe('Advanced Testing Patterns', () => {
    it('should test modal interactions', async () => {
      const ModalExample = () => {
        const [isOpen, setIsOpen] = React.useState(false);
        
        return (
          <div>
            <button onClick={() => setIsOpen(true)}>Open Modal</button>
            {isOpen && (
              <div role="dialog" aria-label="Test Modal">
                <h2>Test Modal</h2>
                <input aria-label="Modal Input" />
                <button onClick={() => setIsOpen(false)}>Close</button>
              </div>
            )}
          </div>
        );
      };

      renderWithProviders(<ModalExample />);

      await TestPatterns.testModal(
        'Open Modal',
        'Test Modal',
        {
          fillFields: { 'Modal Input': 'test value' },
          clickCancel: true,
        }
      );
    });

    it('should test search functionality', async () => {
      const SearchExample = () => {
        const [query, setQuery] = React.useState('');
        const [results, setResults] = React.useState<string[]>([]);

        const handleSearch = () => {
          if (query === 'test') {
            setResults(['Test Result 1', 'Test Result 2']);
          } else {
            setResults([]);
          }
        };

        return (
          <div>
            <input
              role="searchbox"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch}>Search</button>
            <div data-testid="search-results">
              {results.map((result, index) => (
                <div key={index}>{result}</div>
              ))}
            </div>
          </div>
        );
      };

      renderWithProviders(<SearchExample />);

      await TestPatterns.testSearch(
        'test',
        ['Test Result 1', 'Test Result 2']
      );
    });

    it('should test responsive behavior', async () => {
      const ResponsiveComponent = () => {
        const [isMobile, setIsMobile] = React.useState(false);

        React.useEffect(() => {
          const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
          };

          checkMobile();
          window.addEventListener('resize', checkMobile);
          return () => window.removeEventListener('resize', checkMobile);
        }, []);

        return (
          <div>
            {isMobile ? 'Mobile View' : 'Desktop View'}
          </div>
        );
      };

      renderWithProviders(<ResponsiveComponent />);

      await TestPatterns.testResponsive([
        {
          width: 320,
          height: 568,
          expectedChanges: () => {
            expect(screen.getByText('Mobile View')).toBeInTheDocument();
          },
        },
        {
          width: 1024,
          height: 768,
          expectedChanges: () => {
            expect(screen.getByText('Desktop View')).toBeInTheDocument();
          },
        },
      ]);
    });
  });

  describe('Error Handling', () => {
    it('should test error boundaries', () => {
      const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
        if (shouldThrow) {
          throw new Error('Test error');
        }
        return <div>No error</div>;
      };

      const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
        const [hasError, setHasError] = React.useState(false);

        React.useEffect(() => {
          const handleError = () => setHasError(true);
          window.addEventListener('error', handleError);
          return () => window.removeEventListener('error', handleError);
        }, []);

        if (hasError) {
          return <div>Something went wrong</div>;
        }

        return <>{children}</>;
      };

      // Test normal rendering
      const { rerender } = renderWithProviders(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();

      // Test error state
      expect(() => {
        rerender(
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>
        );
      }).toThrow('Test error');
    });

    it('should test network error handling', async () => {
      server.use(
        mockApiError('/api/fail', {
          status: 500,
          message: 'Server error',
        })
      );

      const ErrorComponent = () => {
        const [error, setError] = React.useState<string | null>(null);

        const fetchData = async () => {
          try {
            const response = await fetch('/api/fail');
            if (!response.ok) {
              throw new Error('Network error');
            }
          } catch (err) {
            setError('Failed to load data');
          }
        };

        React.useEffect(() => {
          fetchData();
        }, []);

        if (error) {
          return <div>Error: {error}</div>;
        }

        return <div>Loading...</div>;
      };

      renderWithProviders(<ErrorComponent />);

      await waitFor(() => {
        expect(screen.getByText('Error: Failed to load data')).toBeInTheDocument();
      });
    });
  });
});