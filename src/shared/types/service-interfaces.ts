// Shared interfaces between frontend and backend services

export interface UserValidationResult {
  isValid: boolean;
  errors: string[];
  data?: any;
}

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// User-specific interfaces
export interface UserProfileUpdate {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  preferences?: any;
}

export interface UserActivityData {
  loginFrequency: number;
  propertyInteractions: number;
  messageActivity: number;
  profileCompleteness: number;
  accountAge: number;
  verificationLevel: number;
}