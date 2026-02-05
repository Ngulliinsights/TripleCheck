# Modular Routes Architecture

This directory contains the new modular routes architecture that replaces the monolithic `server/routes.ts` file.

## Structure

```
server/routes/
├── index.ts              # Main routes coordinator
├── AuthRoutes.ts         # Authentication routes module
├── PropertyRoutes.ts     # Property management routes (future)
├── ReviewRoutes.ts       # Review management routes (future)
├── UserRoutes.ts         # User management routes (future)
├── VerificationRoutes.ts # Verification routes (future)
└── __tests__/            # Route module tests
```

## Usage

### In your main server application (server/app.ts):

```typescript
import { createRoutesCoordinator } from './routes';

// Replace the old monolithic routes registration
// OLD: import { registerRoutes } from './routes';
// NEW:
const routesCoordinator = await createRoutesCoordinator(app);
```

### For backward compatibility:

```typescript
import { registerRoutes } from './routes';

// This still works and will use the new modular system
await registerRoutes(app);
```

## AuthRoutes Module

The `AuthRoutes` class handles all authentication-related endpoints:

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `GET /api/auth/validate-session` - Validate session
- `POST /api/auth/change-password` - Change password

### Features

- **Rate Limiting**: Built-in rate limiting for auth endpoints
- **Validation**: Comprehensive input validation using Zod schemas
- **Error Handling**: Consistent error responses using ResponseHelper
- **Security**: Password hashing, session management, and CSRF protection
- **Backward Compatibility**: Maintains the same API endpoints as the original system

### Dependencies

- `AuthService`: Handles authentication business logic
- `UserService`: Handles user management operations
- `ValidationMiddleware`: Provides input validation
- `AuthMiddleware`: Provides authentication and authorization
- `ResponseHelper`: Provides consistent API responses

## Testing

Each route module includes comprehensive tests:

```bash
# Run tests for AuthRoutes
npm test server/routes/__tests__/AuthRoutes.test.ts
```

## Adding New Route Modules

To add a new route module (e.g., PropertyRoutes):

1. Create the route class following the same pattern as AuthRoutes
2. Implement the required methods: `getRouter()` and `initialize()`
3. Add the route module to the RoutesCoordinator in `index.ts`
4. Create tests for the new module

Example:

```typescript
export class PropertyRoutes {
  private router: Router;
  private propertyService: PropertyService;

  constructor(propertyService: PropertyService) {
    this.router = Router();
    this.propertyService = propertyService;
    this.initializeRoutes();
  }

  getRouter(): Router {
    return this.router;
  }

  async initialize(): Promise<void> {
    console.log('PropertyRoutes initialized');
  }

  private initializeRoutes(): void {
    this.router.get('/', this.getProperties.bind(this));
    this.router.post('/', requireAuth, this.createProperty.bind(this));
    // ... other routes
  }

  // ... route handlers
}
```

## Migration from Monolithic Routes

The new modular system maintains backward compatibility with the existing API. The migration process:

1. ✅ Extract types and interfaces
2. ✅ Create service layer
3. ✅ Create AuthRoutes module
4. 🔄 Create other route modules (PropertyRoutes, ReviewRoutes, etc.)
5. 🔄 Update main application to use new routes coordinator
6. 🔄 Remove old monolithic routes.ts file

## Benefits

- **Separation of Concerns**: Each domain has its own route module
- **Testability**: Each module can be tested independently
- **Maintainability**: Easier to locate and modify specific functionality
- **Scalability**: Easy to add new domains and features
- **Type Safety**: Full TypeScript support with proper interfaces
- **Consistency**: Standardized error handling and response formats