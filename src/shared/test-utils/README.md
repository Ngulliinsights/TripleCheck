# Frontend Testing Utilities

This directory contains comprehensive testing utilities for the frontend application. These utilities provide a complete testing framework with support for component testing, API mocking, accessibility testing, and common testing patterns.

## Table of Contents

- [Quick Start](#quick-start)
- [Core Utilities](#core-utilities)
- [Testing Patterns](#testing-patterns)
- [API Mocking](#api-mocking)
- [Accessibility Testing](#accessibility-testing)
- [Test Data and Fixtures](#test-data-and-fixtures)
- [File Upload Testing](#file-upload-testing)
- [Performance Testing](#performance-testing)
- [Best Practices](#best-practices)

## Quick Start

```typescript
import { 
  renderWithProviders, 
  setupUserEvent, 
  testA11y,
  TestDataFactory 
} from '@/shared/test-utils';

describe('MyComponent', () => {
  it('should render and be accessible', async () => {
    const user = setupUserEvent();
    const testData = TestDataFactory.createProperty();
    
    const { container } = renderWithProviders(
      <MyComponent property={testData} />
    );
    
    // Test accessibility
    await testA11y(container);
    
    // Test interactions
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(screen.getByText('Expected text')).toBeInTheDocument();
  });
});
```

## Core Utilities

### Rendering Utilities (`render.tsx`)

#### `renderWithProviders(ui, options)`
Main rendering function that wraps components with necessary providers.

```typescript
const { container, queryClient, user, rerender } = renderWithProviders(
  <MyComponent />,
  {
    route: '/properties',
    user: TestDataFactory.createUser(),
    isAuthenticated: true,
    withRouter: true,
    routerType: 'memory',
    initialEntries: ['/properties', '/properties/1'],
  }
);
```

#### Convenience Rendering Functions

```typescript
// Render with authenticated user
renderWithAuth(<MyComponent />, { user: customUser });

// Render with admin user
renderWithAdmin(<MyComponent />);

// Render with agent user
renderWithAgent(<MyComponent />);

// Render without router
renderWithoutRouter(<MyComponent />);

// Render with specific routes
renderWithRoutes(<MyComponent />, ['/home', '/about']);
```

### User Interactions (`user-event.ts`)

#### Enhanced Form Handling

```typescript
import { fillForm, submitForm, setupUserEvent } from '@/shared/test-utils';

const user = setupUserEvent();

// Fill form with enhanced field detection
await fillForm(user, {
  email: 'test@example.com',
  password: 'password123',
  rememberMe: true, // boolean for checkboxes
  country: { 
    value: 'Kenya', 
    type: 'select',
    selector: '[data-testid="country-select"]'
  },
});

// Submit form with validation
await submitForm(user, 'form[aria-label="Login form"]', {
  email: 'test@example.com',
  password: 'password123',
});
```

#### Advanced Interactions

```typescript
// File uploads
await uploadFiles(user, '[data-testid="file-input"]', [
  createTestFile('document.pdf'),
  createTestImageFile('photo.jpg'),
]);

// Multi-step forms
await navigateMultiStepForm(user, [
  {
    fields: { firstName: 'John', lastName: 'Doe' },
    nextButtonSelector: '[data-testid="next-step"]',
    validation: () => expect(screen.getByText('Step 1 Complete')).toBeInTheDocument(),
  },
  {
    fields: { email: 'john@example.com' },
  },
]);

// Keyboard navigation
await navigateWithKeyboard(user, ['Tab', 'Tab', 'Enter', 'Escape']);

// Drag and drop
await dragAndDrop(user, '[data-testid="source"]', '[data-testid="target"]');
```

## Testing Patterns

### Common Patterns (`patterns.ts`)

#### Component Testing

```typescript
import { TestPatterns } from '@/shared/test-utils';

// Test component renders without errors
await TestPatterns.testComponentRenders(
  () => renderWithProviders(<MyComponent />),
  'Expected text'
);

// Test loading states
await TestPatterns.testLoadingState(
  () => renderWithProviders(<AsyncComponent />),
  'Loading...'
);

// Test error states
await TestPatterns.testErrorState(
  () => renderWithProviders(<ErrorComponent />),
  () => { throw new Error('Test error'); },
  'Something went wrong'
);
```

#### Form Testing

```typescript
// Test form submission
await TestPatterns.testFormSubmission(
  'form[data-testid="contact-form"]',
  {
    name: 'John Doe',
    email: 'john@example.com',
    message: 'Hello world',
  },
  mockSubmitHandler,
  { name: 'John Doe', email: 'john@example.com' }
);

// Test form validation
await TestPatterns.testFormValidation([
  {
    name: 'email',
    invalidValue: 'invalid-email',
    expectedError: 'Please enter a valid email',
  },
  {
    name: 'password',
    invalidValue: '123',
    expectedError: 'Password must be at least 8 characters',
  },
]);
```

### Property-Specific Patterns

```typescript
import { PropertyTestPatterns } from '@/shared/test-utils';

// Test property card rendering
PropertyTestPatterns.testPropertyCard(testProperty);

// Test property search
await PropertyTestPatterns.testPropertySearch('apartment', {
  location: 'Nairobi',
  priceMin: 1000000,
  priceMax: 5000000,
  bedrooms: 2,
});

// Test property creation
await PropertyTestPatterns.testPropertyCreation({
  title: 'New Property',
  description: 'Beautiful home',
  price: 2000000,
});
```

### User-Specific Patterns

```typescript
import { UserTestPatterns } from '@/shared/test-utils';

// Test login flow
await UserTestPatterns.testLogin({
  email: 'test@example.com',
  password: 'password123',
}, '/dashboard');

// Test registration flow
await UserTestPatterns.testRegistration({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  password: 'password123',
  confirmPassword: 'password123',
});

// Test profile update
await UserTestPatterns.testProfileUpdate({
  firstName: 'Jane',
  bio: 'Updated bio',
});
```

## API Mocking

### MSW Server Setup (`msw-server.ts`)

The MSW server is automatically configured in the test setup. You can add custom handlers:

```typescript
import { server, mockApiSuccess, mockApiError } from '@/shared/test-utils';

// Add temporary handlers for specific tests
server.use(
  mockApiSuccess('/api/custom', { data: 'test' }),
  mockApiError('/api/error', { status: 404, message: 'Not found' })
);

// Mock authentication endpoints
server.use(...mockAuthEndpoints({
  validCredentials: { email: 'admin@test.com', password: 'admin123' },
  mockUser: { id: 1, role: 'admin' },
}));

// Simulate network conditions
simulateNetworkConditions({ slow: true });
simulateNetworkConditions({ offline: true });
simulateNetworkConditions({ unreliable: true });
```

### API Handlers (`api-handlers.ts`)

Comprehensive handlers are provided for all API endpoints:

```typescript
// Properties, users, reviews, authentication, payments, etc.
// All handlers support filtering, pagination, and realistic responses
```

## Accessibility Testing

### Basic Accessibility Testing (`accessibility.ts`)

```typescript
import { testA11y, testA11yWithConfig, runFullAccessibilityTest } from '@/shared/test-utils';

// Basic accessibility test
await testA11y(container);

// Test with specific configuration
await testA11yWithConfig(container, 'strict');
await testA11yWithConfig(container, 'forms');

// Comprehensive accessibility test
await runFullAccessibilityTest(container, {
  skipColorContrast: false,
  skipKeyboardNav: false,
  config: 'strict',
});
```

### Keyboard Navigation Testing

```typescript
import { testKeyboardAccessibility } from '@/shared/test-utils';

await testKeyboardAccessibility(container, {
  expectFocusable: ['button', 'input', 'a'],
  expectNotFocusable: ['[tabindex="-1"]'],
  testTabOrder: true,
});
```

### ARIA Testing

```typescript
import { testAriaAttributes } from '@/shared/test-utils';

testAriaAttributes(container, {
  hasRole: [
    { selector: '[data-testid="dialog"]', role: 'dialog' },
    { selector: '[data-testid="button"]', role: 'button' },
  ],
  hasAriaLabel: [
    { selector: 'button', label: 'Close dialog' },
  ],
  hasAriaExpanded: [
    { selector: '[data-testid="dropdown"]', expanded: false },
  ],
});
```

### Form Accessibility

```typescript
import { testFormAccessibility } from '@/shared/test-utils';

await testFormAccessibility(container, {
  expectLabels: ['#email', '#password', '#confirm-password'],
  expectRequired: ['#email', '#password'],
  expectErrorMessages: ['#email', '#password'],
});
```

## Test Data and Fixtures

### Data Factory (`fixtures.ts`)

```typescript
import { TestDataFactory, testScenarios } from '@/shared/test-utils';

// Create individual entities
const user = TestDataFactory.createUser({
  firstName: 'John',
  role: 'agent',
  trustScore: 95,
});

const property = TestDataFactory.createProperty({
  title: 'Luxury Villa',
  price: 50000000,
  features: { bedrooms: 4, bathrooms: 3 },
});

const review = TestDataFactory.createReview({
  rating: 5,
  comment: 'Excellent property!',
});

// Create multiple entities
const users = TestDataFactory.createUsers(10);
const properties = TestDataFactory.createProperties(5, { ownerId: user.id });

// Use predefined scenarios
const { user, property } = testScenarios.singleUserWithProperty();
const { agent, properties } = testScenarios.agentWithProperties(5);
const marketplace = testScenarios.marketplace();
```

### Test Database

```typescript
import { TestDatabase } from '@/shared/test-utils';

// Seed test database
TestDatabase.seed({
  users: TestDataFactory.createUsers(10),
  properties: TestDataFactory.createProperties(20),
});

// Query test data
const users = TestDatabase.getCollection('users');
const user = TestDatabase.findById('users', 1);

// Modify test data
TestDatabase.insert('users', newUser);
TestDatabase.updateById('users', 1, { trustScore: 100 });
TestDatabase.deleteById('users', 1);
```

## File Upload Testing

### Creating Test Files

```typescript
import { createTestFile, createTestImageFile } from '@/shared/test-utils';

// Create text file
const textFile = createTestFile('document.txt', 'File content', 'text/plain');

// Create image file
const imageFile = createTestImageFile('photo.jpg', 800, 600);

// Test file upload
const user = setupUserEvent();
const fileInput = screen.getByLabelText(/upload/i);
await user.upload(fileInput, [textFile, imageFile]);
```

## Performance Testing

### Measuring Performance

```typescript
import { measurePerformance, waitForCondition } from '@/shared/test-utils';

// Measure operation performance
const { result, duration } = await measurePerformance(
  async () => {
    // Expensive operation
    return await processLargeDataset();
  },
  'Data processing'
);

expect(duration).toBeLessThan(1000); // Should complete in under 1 second

// Wait for conditions
await waitForCondition(
  () => screen.queryByText('Loading...') === null,
  5000 // timeout
);
```

## Best Practices

### Test Organization

```typescript
describe('PropertyCard Component', () => {
  // Group related tests
  describe('Rendering', () => {
    it('should render property information', () => {});
    it('should render property images', () => {});
  });

  describe('Interactions', () => {
    it('should handle click events', () => {});
    it('should handle keyboard navigation', () => {});
  });

  describe('Accessibility', () => {
    it('should be accessible to screen readers', () => {});
    it('should support keyboard navigation', () => {});
  });
});
```

### Test Data Management

```typescript
describe('Property Tests', () => {
  beforeEach(() => {
    // Reset test data before each test
    TestDataFactory.reset();
  });

  it('should create property with unique data', () => {
    const property1 = TestDataFactory.createProperty();
    const property2 = TestDataFactory.createProperty();
    
    expect(property1.id).not.toBe(property2.id);
  });
});
```

### Async Testing

```typescript
it('should handle async operations', async () => {
  const user = setupUserEvent();
  
  renderWithProviders(<AsyncComponent />);
  
  // Wait for initial load
  await waitFor(() => {
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
  
  // Trigger async action
  const button = screen.getByRole('button', { name: /save/i });
  await user.click(button);
  
  // Wait for completion
  await waitFor(() => {
    expect(screen.getByText('Saved successfully')).toBeInTheDocument();
  });
});
```

### Error Testing

```typescript
it('should handle errors gracefully', async () => {
  // Mock API error
  server.use(
    mockApiError('/api/properties', {
      status: 500,
      message: 'Server error',
    })
  );

  renderWithProviders(<PropertyList />);

  await waitFor(() => {
    expect(screen.getByText(/error loading properties/i)).toBeInTheDocument();
  });
});
```

### Cleanup

```typescript
describe('Component with side effects', () => {
  afterEach(() => {
    // Clean up any side effects
    vi.clearAllMocks();
    TestDatabase.clear();
  });
});
```

## Configuration

The testing utilities are configured in `setup.ts` and automatically loaded by Vitest. The configuration includes:

- MSW server setup for API mocking
- Web API mocks (ResizeObserver, IntersectionObserver, etc.)
- Storage mocks (localStorage, sessionStorage)
- File API mocks (File, FileReader, Blob)
- Performance API mocks
- Accessibility testing setup

## Examples

See `example.test.tsx` for comprehensive examples of all testing utilities in action.

## Troubleshooting

### Common Issues

1. **Tests failing due to missing providers**: Use `renderWithProviders` instead of plain `render`
2. **Accessibility tests failing**: Check console for specific violations and fix them
3. **API mocks not working**: Ensure MSW server is properly set up in test setup
4. **File upload tests failing**: Use `createTestFile` or `createTestImageFile` helpers
5. **Async tests timing out**: Use `waitFor` and increase timeout if needed

### Debug Tips

```typescript
// Enable request logging for API debugging
import { enableRequestLogging } from '@/shared/test-utils';
enableRequestLogging();

// Debug component state
screen.debug(); // Prints current DOM
console.log(screen.getByTestId('component').textContent);

// Debug accessibility issues
const results = await checkA11y(container);
console.log(results.violations);
```