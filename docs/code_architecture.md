# Code Architecture Analysis

## Core Technologies & Libraries

### Express.js Framework
- **Version**: Latest stable (implied by modern TypeScript usage)
- **Usage Pattern**: Modular routing with middleware
- **Key Middleware**:
  - `express-session`: Session management
  - `express-fileupload`: Multipart form handling for document uploads
  - `zod`: Runtime type validation for request bodies

### TypeScript Integration
- **Configuration**: Strict type checking enabled
- **Type Patterns**:
  - Interface-first design for data models
  - Type augmentation for Express session
  - Explicit error type handling

### Authentication System
- **Method**: Session-based authentication
- **Storage**: In-memory session store (development)
- **Security Features**:
  - Password comparison (basic - needs hashing)
  - Session middleware integration
  - Route-level authentication checks

## Architecture Overview

### Route Organization
```plaintext
/api
├── /auth
│   ├── /register    POST
│   ├── /login       POST
│   ├── /logout      POST
│   └── /me          GET
├── /properties
│   ├── /            GET, POST
│   ├── /:id         GET
│   ├── /search      POST
│   ├── /:id/reviews GET, POST
│   └── /:id/verification-status GET
├── /locations
│   └── /search      GET
└── /health          GET
```

### Modular Design
1. **Core Routes** (`routes.ts`)
   - Central routing logic
   - Authentication handling
   - Basic CRUD operations

2. **AI Integration** (`ai-routes.ts`)
   - Document verification
   - Fraud detection
   - Report generation

3. **ML Services** (`ml-routes.ts`)
   - Model training
   - Prediction endpoints
   - Training statistics

4. **Storage Layer** (`storage.ts`)
   - Data persistence
   - Query operations
   - Cache management

## Key Design Patterns

### 1. Middleware Pattern
```typescript
app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 },
  abortOnLimit: true,
  createParentPath: true,
  useTempFiles: true,
  tempFileDir: UPLOAD_DIR,
}));
```
- Configurable middleware chain
- Error handling middleware
- Authentication middleware

### 2. Service Layer Pattern
```typescript
async function performAIVerification(propertyData: any) {
  const { detectFraud } = await import('./ai-routes');
  const fraudDetection = await detectFraud(propertyData);
  // ...
}
```
- Separation of concerns
- Dynamic imports for circular dependency prevention
- Error handling with fallbacks

### 3. Repository Pattern
```typescript
const storage = {
  getUserByUsername,
  createUser,
  getProperties,
  searchProperties,
  // ...
};
```
- Abstracted data access
- Centralized storage operations
- Type-safe interfaces

## Error Handling Strategy

### 1. Layered Error Handling
```typescript
try {
  const userData = insertUserSchema.parse(req.body);
  // ... business logic
} catch (error) {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ message: error.errors[0].message });
  }
  res.status(500).json({ message: "Operation failed" });
}
```
- Schema validation errors (Zod)
- Business logic errors
- Infrastructure errors

### 2. Error Response Standardization
```typescript
{
  success: boolean,
  message: string,
  error?: string,
  data?: any
}
```

## Security Considerations

### 1. File Upload Security
- Size limits: 10MB
- Temporary file handling
- File type validation (needed)

### 2. Authentication Security
- Session-based auth
- CSRF protection needed
- Password hashing needed

### 3. Input Validation
- Zod schema validation
- Type checking
- Sanitization needed

## Performance Optimizations

### 1. Caching Opportunities
- Property search results
- Location suggestions
- User sessions

### 2. Query Optimization
- Filtered property search
- Location search
- Review aggregation

### 3. Resource Management
- File upload cleanup
- Session cleanup
- Connection pooling needed

## Development Workflow Integration

### 1. Type Safety
```typescript
interface PropertyFilter {
  type?: string[];
  priceRange?: [number, number];
  // ...
}
```
- Strong typing for API contracts
- Runtime validation
- IDE support

### 2. Error Traceability
```typescript
console.error('Verification status error:', error);
```
- Structured logging
- Error context preservation
- Stack trace maintenance

## Areas for Improvement

### 1. Security Enhancements
- Implement password hashing
- Add rate limiting
- Add CSRF protection
- Implement JWTs or refresh tokens

### 2. Performance Optimization
- Add caching layer
- Implement connection pooling
- Add request validation middleware

### 3. Code Quality
- Add request/response logging
- Implement proper error handling middleware
- Add API documentation
- Add integration tests

## External Service Integration

### 1. AI Services
- Google AI integration
- Document verification
- Fraud detection

### 2. ML Services
- Model training
- Prediction services
- Analytics

### 3. Storage Services
- Property data
- User data
- Review data

## Configuration Management
- Environment variables
- File upload settings
- Session settings
- API keys and secrets

This architecture document provides a comprehensive overview of the codebase structure and can be used as a reference for future optimizations and improvements.

Note: When using this with LLMs, you can reference specific sections to provide context about the implementation details, design patterns, or architectural decisions.
