# User Frontend Services

This directory contains client-side business logic and utilities for the user domain.

## Purpose
- **Client-side validation** and business rules
- **UI state management** helpers
- **Frontend-specific utilities** that don't require server communication
- **Type definitions** and schemas for frontend use

## Key Files
- `user-business-logic.ts` - Core user validation and business logic for the frontend

## Usage
```typescript
import { UserBusinessLogic } from '@/user/services/user-business-logic';

// Validate user input before sending to server
const validatedData = UserBusinessLogic.validateUserProfile(formData);
```

## Relationship to Backend
- Frontend services handle UI logic and validation
- Backend services (`server/services/UserService.ts`) handle database operations
- Clear separation prevents code duplication and maintains clean architecture