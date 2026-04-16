# Naming Conventions

## File Naming Standards

### TypeScript/JavaScript Files

**Rule:** Use kebab-case for all files

✅ **Correct:**
```
user-service.ts
fraud-detection-ai.service.ts
property-cache.service.ts
authentication.middleware.ts
```

❌ **Incorrect:**
```
UserService.ts
FraudDetectionAPI.ts
PropertyCache.ts
AuthMiddleware.ts
```

### React Components

**Rule:** Use PascalCase for component files

✅ **Correct:**
```
PropertyCard.tsx
UserProfile.tsx
NavigationMenu.tsx
```

❌ **Incorrect:**
```
property-card.tsx
user_profile.tsx
navigation-menu.tsx
```

### Test Files

**Rule:** Match the file being tested with `.test` or `.spec` suffix

✅ **Correct:**
```
user-service.test.ts
PropertyCard.test.tsx
fraud-detection.spec.ts
```

### Configuration Files

**Rule:** Use lowercase with dots for separation

✅ **Correct:**
```
jest.config.js
tsconfig.json
vite.config.ts
.eslintrc.json
```

## Directory Naming

**Rule:** Use kebab-case for all directories

✅ **Correct:**
```
fraud-detection/
user-management/
property-listings/
```

❌ **Incorrect:**
```
FraudDetection/
UserManagement/
property_listings/
```

## Variable Naming

### Constants

**Rule:** Use SCREAMING_SNAKE_CASE for true constants

```typescript
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.example.com';
const DEFAULT_TIMEOUT = 5000;
```

### Variables and Functions

**Rule:** Use camelCase

```typescript
const userName = 'John';
const propertyList = [];
function getUserById(id: string) { }
function calculateTotalPrice() { }
```

### Classes and Interfaces

**Rule:** Use PascalCase

```typescript
class UserService { }
class PropertyManager { }
interface UserProfile { }
interface PropertyListing { }
```

### Type Aliases

**Rule:** Use PascalCase

```typescript
type UserId = string;
type PropertyStatus = 'active' | 'pending' | 'sold';
```

## Known Violations to Fix

### High Priority
- [ ] `server/ai/services/FraudDetectionAPI.ts` → `fraud-detection-api.service.ts`
- [ ] Multiple `AuditLogger.ts` files → `audit-logger.ts`

### Medium Priority
- [ ] Review all service files for consistent `.service.ts` suffix
- [ ] Review all controller files for consistent `.controller.ts` suffix
- [ ] Review all middleware files for consistent `.middleware.ts` suffix

### Low Priority
- [ ] Standardize test file extensions (`.test.ts` vs `.spec.ts`)
- [ ] Review utility file naming

## Enforcement

### ESLint Rule (Recommended)
```json
{
  "rules": {
    "unicorn/filename-case": [
      "error",
      {
        "cases": {
          "kebabCase": true,
          "pascalCase": true
        },
        "ignore": [
          "^[A-Z]+\\..*$"  // Allow README.md, LICENSE, etc.
        ]
      }
    ]
  }
}
```

### Pre-commit Hook
```bash
#!/bin/bash
# Check for PascalCase files outside of component directories
find src -type f -name "*.ts" ! -name "*.tsx" -regex ".*/[A-Z].*" | while read file; do
  echo "Warning: $file uses PascalCase (should be kebab-case)"
done
```

## Migration Strategy

1. **Document** - Create this guide ✅
2. **Audit** - Identify all violations
3. **Prioritize** - Fix high-impact files first
4. **Gradual** - Fix files as they're modified
5. **Enforce** - Add linting rules to prevent new violations

## References

- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
