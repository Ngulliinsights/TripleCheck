/**
 * Compatibility export for validation middleware
 * Re-exports from validation.ts for backward compatibility
 */

export * from './validation';

// Legacy exports for backward compatibility
import { validateBody, validateQuery, validateParams, validate } from './validation';
import * as PropertySchemas from '../schemas/property.schema';
import * as UserSchemas from '../schemas/user.schema';

// validateRequest is an alias for the validate function that accepts an object
export const validateRequest = validate;
export default validateRequest;

// Legacy validation schemas - re-export from new schema files
export const PropertyValidationSchemas = {
  createProperty: PropertySchemas.CreatePropertySchema,
  updateProperty: PropertySchemas.UpdatePropertySchema,
  searchFilters: PropertySchemas.PropertySearchSchema,
  propertyId: PropertySchemas.PropertyIdSchema,
};

export const UserValidationSchemas = {
  register: UserSchemas.RegisterUserSchema,
  login: UserSchemas.LoginSchema,
  updateProfile: UserSchemas.UpdateUserSchema,
  changePassword: UserSchemas.ChangePasswordSchema,
};

export const CommonValidationSchemas = {
  idParam: PropertySchemas.PropertyIdSchema,
  pagination: PropertySchemas.PropertySearchSchema.pick({ page: true, limit: true }),
};

export type ValidatedRequest = any; // Placeholder type
