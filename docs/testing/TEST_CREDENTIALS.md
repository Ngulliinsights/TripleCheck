# Test Credentials for TripleCheck Authentication System

## Overview
This document provides test credentials for evaluating dashboard functionality and user flows during development. These credentials are for development and testing purposes only.

## Test User Accounts

### Standard User Account
- **Email**: `test.user@triplecheck.dev`
- **Password**: `TestUser123!`
- **Role**: Standard User
- **Features**: Basic property verification, search, and listing access

### Premium User Account
- **Email**: `premium.user@triplecheck.dev`
- **Password**: `PremiumUser123!`
- **Role**: Premium User
- **Features**: Advanced verification, priority support, enhanced analytics

### Property Owner Account
- **Email**: `property.owner@triplecheck.dev`
- **Password**: `PropertyOwner123!`
- **Role**: Property Owner
- **Features**: Property listing management, verification status tracking

### Real Estate Agent Account
- **Email**: `agent@triplecheck.dev`
- **Password**: `RealEstateAgent123!`
- **Role**: Real Estate Agent
- **Features**: Multiple property management, client dashboard, commission tracking

### Admin Account
- **Email**: `admin@triplecheck.dev`
- **Password**: `AdminUser123!`
- **Role**: Administrator
- **Features**: Full system access, user management, system analytics

## API Test Tokens

### Development API Key
```
API_KEY=dev_test_key_12345abcdef
```

### Test Environment Endpoints
- **Base URL**: `https://api-dev.triplecheck.com`
- **Auth Endpoint**: `/auth/login`
- **Properties Endpoint**: `/api/properties`
- **Verification Endpoint**: `/api/verify`

## Test Property Data

### Sample Property IDs for Testing
- **Residential Property**: `prop_res_001`
- **Commercial Property**: `prop_com_001`
- **Land Property**: `prop_land_001`
- **Luxury Property**: `prop_lux_001`

### Sample Verification Statuses
- **Verified**: Properties with ID ending in `_001`
- **Pending**: Properties with ID ending in `_002`
- **Failed**: Properties with ID ending in `_003`

## Security Notes

⚠️ **Important Security Reminders**:
1. These credentials are for development/testing only
2. Never use these credentials in production
3. Change all default passwords before deployment
4. Implement proper password policies in production
5. Use environment variables for sensitive data
6. Enable 2FA for all production accounts

## Usage Instructions

1. **Login Testing**: Use any of the test accounts above to test login functionality
2. **Role Testing**: Switch between different user types to test role-based access
3. **API Testing**: Use the provided API keys for backend integration testing
4. **Property Testing**: Use sample property IDs to test verification workflows

## Troubleshooting

### Common Issues
- **Login Failed**: Ensure you're using the correct environment (dev/staging)
- **API Errors**: Check that the API key matches the environment
- **Permission Denied**: Verify the user role has appropriate permissions

### Reset Instructions
If test accounts become corrupted or need reset:
1. Contact the development team
2. Use the admin account to reset user passwords
3. Clear browser cache and cookies
4. Try logging in with fresh credentials

## Contact
For issues with test credentials or additional test accounts:
- **Development Team**: dev@triplecheck.com
- **QA Team**: qa@triplecheck.com
- **Documentation**: docs@triplecheck.com

---
*Last Updated: December 2024*
*Environment: Development/Testing*