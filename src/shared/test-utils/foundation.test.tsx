/**
 * Foundation test to verify core testing utilities are working
 * This test validates that all the testing infrastructure is properly set up
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import {
  renderWithProviders,
  renderWithAuth,
  renderWithAdmin,
  testA11y,
  TestDataFactory,
  testScenarios,
  mockApiSuccess,
  server,
  createTestFile,
} from './index';

// Simple test components
const TestButton = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <button type="button" onClick={onClick} aria-label="Test button">
    {children}
  </button>
);

const PropertyCard = ({ property }: { property: any }) => (
  <div data-testid="property-card" role="article">
    <h3>{property.title}</h3>
    <p>{property.location}</p>
    <p>KES {property.price.toLocaleString()}</p>
    <p>{property.features.bedrooms} bedrooms, {property.features.bathrooms} bathrooms</p>
  </div>
);

describe('Testing Foundation Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestDataFactory.reset();
  });

  describe('1. Enhanced Test Utilities', () => {
    it('should render components with all providers', () => {
      const handleClick = vi.fn();
      
      renderWithProviders(
        <TestButton onClick={handleClick}>Test Button</TestButton>
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Test Button')).toBeInTheDocument();
    });

    it('should render with authenticated user context', () => {
      const handleClick = vi.fn();
      
      renderWithAuth(
        <TestButton onClick={handleClick}>Authenticated Button</TestButton>
      );

      expect(screen.getByText('Authenticated Button')).toBeInTheDocument();
    });

    it('should render with admin user context', () => {
      const handleClick = vi.fn();
      
      renderWithAdmin(
        <TestButton onClick={handleClick}>Admin Button</TestButton>
      );

      expect(screen.getByText('Admin Button')).toBeInTheDocument();
    });

    it('should render without router when specified', () => {
      const handleClick = vi.fn();
      
      renderWithProviders(
        <TestButton onClick={handleClick}>No Router Button</TestButton>,
        { withRouter: false }
      );

      expect(screen.getByText('No Router Button')).toBeInTheDocument();
    });
  });

  describe('2. Mock Service Worker (MSW) Configuration', () => {
    it('should mock API endpoints successfully', async () => {
      const testData = { message: 'Success' };
      
      server.use(
        mockApiSuccess('/api/test', testData)
      );

      const response = await fetch('/api/test');
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toEqual(testData);
    });

    it('should handle properties API endpoint', async () => {
      const response = await fetch('/api/properties');
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.properties).toBeDefined();
      expect(Array.isArray(data.data.properties)).toBe(true);
    });

    it('should handle authentication endpoints', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });
      
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.user).toBeDefined();
      expect(data.data.token).toBeDefined();
    });
  });

  describe('3. Test Database and Data Fixtures', () => {
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

    it('should create multiple entities with unique IDs', () => {
      const users = TestDataFactory.createUsers(3);
      const properties = TestDataFactory.createProperties(2);

      expect(users).toHaveLength(3);
      expect(properties).toHaveLength(2);
      
      // Each user should have unique ID
      const userIds = users.map(u => u.id);
      expect(new Set(userIds).size).toBe(3);
    });

    it('should use predefined test scenarios', () => {
      const scenario = testScenarios.singleUserWithProperty();
      
      expect(scenario.user).toBeDefined();
      expect(scenario.property).toBeDefined();
      expect(scenario.property.ownerId).toBe(scenario.user.id);
    });

    it('should create marketplace scenario with multiple entities', () => {
      const marketplace = testScenarios.marketplace();
      
      expect(marketplace.users.length).toBeGreaterThan(0);
      expect(marketplace.agents.length).toBeGreaterThan(0);
      expect(marketplace.properties.length).toBeGreaterThan(0);
      expect(marketplace.admin).toBeDefined();
    });

    it('should reset data factory between tests', () => {
      const user1 = TestDataFactory.createUser();
      TestDataFactory.reset();
      const user2 = TestDataFactory.createUser();

      // After reset, IDs should start from 1 again
      expect(user2.id).toBe(1);
    });
  });

  describe('4. Accessibility Testing Utilities', () => {
    it('should pass basic accessibility tests', async () => {
      const { container } = renderWithProviders(
        <TestButton onClick={vi.fn()}>Accessible Button</TestButton>
      );

      // This should pass without throwing
      await testA11y(container);
    });

    it('should test form accessibility', async () => {
      const TestForm = () => (
        <form>
          <label htmlFor="test-input">Test Input</label>
          <input id="test-input" type="text" />
          <button type="submit">Submit</button>
        </form>
      );

      const { container } = renderWithProviders(<TestForm />);

      // Basic accessibility test should pass
      await testA11y(container);
    });
  });

  describe('5. Common Testing Patterns', () => {
    it('should render property card with test data', () => {
      const property = TestDataFactory.createProperty({
        title: 'Beautiful Apartment',
        location: 'Nairobi, Kenya',
        price: 2000000,
        features: {
          bedrooms: 3,
          bathrooms: 2,
          squareFeet: 1200,
          parkingSpaces: 1,
          yearBuilt: 2020,
          amenities: ['Pool', 'Gym'],
          propertyType: 'Apartment',
        },
      });
      
      renderWithProviders(<PropertyCard property={property} />);

      expect(screen.getByText('Beautiful Apartment')).toBeInTheDocument();
      expect(screen.getByText('Nairobi, Kenya')).toBeInTheDocument();
      expect(screen.getByText('KES 2,000,000')).toBeInTheDocument();
      expect(screen.getByText('3 bedrooms, 2 bathrooms')).toBeInTheDocument();
    });

    it('should create test files for upload testing', () => {
      const textFile = createTestFile('test.txt', 'test content', 'text/plain');
      
      expect(textFile.name).toBe('test.txt');
      expect(textFile.type).toBe('text/plain');
      expect(textFile.size).toBeGreaterThan(0);
    });
  });

  describe('6. Test Environment Setup', () => {
    it('should have proper test environment markers', () => {
      expect(window.__TEST_ENV__).toBe(true);
    });

    it('should have mocked Web APIs', () => {
      expect(window.ResizeObserver).toBeDefined();
      expect(window.IntersectionObserver).toBeDefined();
      expect(window.matchMedia).toBeDefined();
      expect(window.localStorage).toBeDefined();
      expect(window.sessionStorage).toBeDefined();
    });

    it('should have mocked file APIs', () => {
      expect(global.File).toBeDefined();
      expect(global.FileReader).toBeDefined();
      expect(global.Blob).toBeDefined();
    });

    it('should have performance and animation APIs mocked', () => {
      expect(window.performance).toBeDefined();
      expect(global.requestAnimationFrame).toBeDefined();
      expect(global.cancelAnimationFrame).toBeDefined();
    });
  });
});