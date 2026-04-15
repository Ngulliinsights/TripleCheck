/**
 * Schema Exports
 */

// Property schemas
export {
  PropertySchema,
  CreatePropertySchema,
  UpdatePropertySchema,
  PropertySearchSchema,
  PropertyIdSchema,
  BulkPropertyIdsSchema,
  PropertyVerificationSchema,
} from './property.schema';

export type {
  Property,
  CreatePropertyInput,
  UpdatePropertyInput,
  PropertySearchInput,
  PropertyIdInput,
  BulkPropertyIdsInput,
  PropertyVerificationInput,
} from './property.schema';

// User schemas
export {
  UserSchema,
  RegisterUserSchema,
  LoginSchema,
  UpdateUserSchema,
  ChangePasswordSchema,
  PasswordResetRequestSchema,
  PasswordResetSchema,
  UserIdSchema,
} from './user.schema';

export type {
  User,
  RegisterUserInput,
  LoginInput,
  UpdateUserInput,
  ChangePasswordInput,
  PasswordResetRequestInput,
  PasswordResetInput,
  UserIdInput,
} from './user.schema';
