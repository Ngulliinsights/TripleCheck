# End-to-End Testing Suite

This directory contains comprehensive end-to-end tests for the TripleCheck application, covering complete user workflows from registration to property transactions.

## Test Structure

### Test Files

- **`auth-workflows.spec.ts`** - User registration, login, and onboarding flows
- **`property-workflows.spec.ts`** - Property search, filtering, viewing, and management
- **`user-profile-workflows.spec.ts`** - User profile management and settings updates
- **`review-workflows.spec.ts`** - Review submission, interaction, and management
- **`integration-workflows.spec.ts`** - Cross-workflow integration and complete user journeys

### Helper Files

- **`helpers/test-helpers.ts`** - Common utilities and helper functions
- **`config/test-config.ts`** - Test configuration and constants

## Test Coverage

### 1. User Registration and Onboarding Flow
- Complete user registration process with multi-step form
- Form validation and error handling
- User onboarding and welcome tour
- Email verification workflow

### 2. Property Search, Filtering, and Booking Workflows
- Comprehensive property search with filters
- Property details viewing and interaction
- Save properties to favorites
- Schedule property viewings
- Property comparison functionality
- Contact property owners

### 3. User Profile Management and Settings Updates
- Update user profile information
- Change password with validation
- Manage notification preferences
- Privacy settings management
- Profile picture upload
- Account activity monitoring
- Connected accounts and integrations
- Account deletion

### 4. Property Listing Creation and Management Workflows
- Complete property listing creation (multi-step form)
- Edit existing property listings
- Manage property photos
- Delete property listings
- Handle form validation errors

### 5. Review Submission and Interaction Workflows
- Submit property reviews with ratings
- Interact with existing reviews (helpful/unhelpful voting)
- Filter and sort reviews
- Property owner responses to reviews
- Edit and delete submitted reviews
- Review moderation (admin functionality)
- Review analytics and reporting

### 6. Cross-Workflow Integration Tests
- Complete user journey from registration to transaction
- Property owner journey from listing to review management
- Error handling across workflows
- Session persistence across different sections
- Concurrent user actions
- Mobile and desktop responsive workflows
- Data persistence across workflow interruptions

## Running Tests

### Prerequisites
- Node.js and npm installed
- Application running on `http://localhost:3003`
- Test database with sample data

### Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test auth-workflows.spec.ts

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests in debug mode
npx playwright test --debug

# Run tests on specific browser
npx playwright test --project=chromium

# Run tests on mobile devices
npx playwright test --project=mobile-chrome

# Generate test report
npx playwright show-report
```

### Environment Variables

```bash
# Base URL for testing
PLAYWRIGHT_BASE_URL=http://localhost:3003

# Run in headless mode (default: true in CI)
HEADLESS=false

# Enable debug mode
DEBUG=true

# Slow down test execution (milliseconds)
SLOW_MO=1000

# Test timeout (milliseconds)
TIMEOUT=60000
```

## Test Data

### Test Users
- **Buyer**: `buyer@test.com` / `BuyerPassword123!`
- **Seller**: `seller@test.com` / `SellerPassword123!`
- **Admin**: `admin@test.com` / `AdminPassword123!`

### Test Properties
- **Apartment**: Modern 3-bedroom in Nairobi
- **House**: 4-bedroom house in Karen
- **Commercial**: Office space in CBD

## Browser Support

Tests run across multiple browsers and devices:

### Desktop Browsers
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Mobile Devices
- iPhone 12
- Pixel 5
- iPad

### Viewports
- Desktop: 1920x1080
- Tablet: 1024x768
- Mobile: 375x667

## Test Patterns

### Page Object Model
Tests use helper functions that encapsulate page interactions:

```typescript
import { loginUser, searchProperties, createPropertyListing } from './helpers/test-helpers';

test('user can search properties after login', async ({ page }) => {
  await loginUser(page);
  await searchProperties(page, 'Nairobi');
  // assertions...
});
```

### Data-Driven Testing
Tests use configuration objects for test data:

```typescript
import { getTestUser, getTestProperty } from './config/test-config';

const user = getTestUser('buyer');
const property = getTestProperty('apartment');
```

### Error Handling
Tests include comprehensive error scenario coverage:

```typescript
await handleNetworkError(page, async () => {
  await searchProperties(page, 'Nairobi');
});
await verifyErrorHandling(page);
```

## Accessibility Testing

Tests include basic accessibility checks:
- Proper heading structure
- Alt text on images
- Form labels and associations
- Keyboard navigation
- Color contrast (where applicable)

## Performance Testing

Tests monitor performance metrics:
- Page load times (< 3 seconds)
- API response times (< 2 seconds)
- Image load times (< 1 second)

## CI/CD Integration

Tests are configured for continuous integration:
- Automatic test execution on pull requests
- Test result reporting and artifacts
- Screenshot capture on failures
- Video recording for debugging

## Debugging

### Screenshots and Videos
- Screenshots captured on test failures
- Videos recorded for failed tests
- Full page screenshots available

### Debug Mode
```bash
# Run single test in debug mode
npx playwright test auth-workflows.spec.ts --debug

# Pause test execution
await page.pause();
```

### Trace Viewer
```bash
# Generate trace on failure
npx playwright test --trace on-first-retry

# View trace
npx playwright show-trace trace.zip
```

## Best Practices

### Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Keep tests independent and isolated
- Clean up test data after tests

### Assertions
- Use specific assertions over generic ones
- Assert on user-visible behavior
- Include meaningful error messages
- Test both positive and negative scenarios

### Maintenance
- Update selectors when UI changes
- Keep test data current
- Review and update timeouts
- Monitor test flakiness

## Troubleshooting

### Common Issues

1. **Test Timeouts**
   - Increase timeout values in config
   - Check for slow network requests
   - Verify element selectors are correct

2. **Flaky Tests**
   - Add proper wait conditions
   - Use stable selectors
   - Handle async operations correctly

3. **Element Not Found**
   - Verify element exists in current state
   - Check for dynamic content loading
   - Use data-testid attributes

4. **Authentication Issues**
   - Verify test user credentials
   - Check session persistence
   - Clear browser state between tests

### Getting Help

- Check Playwright documentation: https://playwright.dev/
- Review test logs and screenshots
- Use debug mode for step-by-step execution
- Consult team for application-specific issues