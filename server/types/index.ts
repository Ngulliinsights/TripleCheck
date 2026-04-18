/**
 * Central export file for all type definitions
 * Note: api.types and auth.types are now canonical in @shared/types
 * These re-exports maintain backward compatibility
 */

// API types (canonical: @shared/types/api.types)
export * from "@shared/types/api.types";

// Authentication types (canonical: @shared/types/auth.types)
export * from "@shared/types/auth.types";

// Property types
export * from "./property.types";

// Verification types
export * from "./verification.types";

// User types
export * from "./user.types";

// Review types
export * from "./review.types";

// Fraud detection types
export * from "./fraud.types";