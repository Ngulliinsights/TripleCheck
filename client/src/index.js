"use strict";
/**
 * Main Application Barrel Export
 *
 * Central export point for the entire application.
 * This provides organized access to all major modules and components.
 *
 * Usage:
 * import { PropertyCard, useAuth, SearchBar } from '@/src'
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
// Property Module
__exportStar(require("./property/components"), exports);
__exportStar(require("./property/hooks"), exports);
__exportStar(require("./property/services"), exports);
// Shared Module
__exportStar(require("./local/components/ui"), exports);
__exportStar(require("./local/components/layout"), exports);
// Navigation is exported from both layout and navigation, so we skip both wildcard exports to avoid conflicts
__exportStar(require("./local/hooks"), exports);
__exportStar(require("./local/utils"), exports);
__exportStar(require("./local/services"), exports);
// User Module
__exportStar(require("./user/components"), exports);
__exportStar(require("./user/hooks"), exports);
// Search Module
__exportStar(require("./search/components"), exports);
__exportStar(require("./search/hooks"), exports);
// Auth Module
__exportStar(require("./auth/components"), exports);
__exportStar(require("./auth/hooks"), exports);
// export type { User } from './user/types' // File doesn't exist
// export type { SearchFilters } from './search/types' // File doesn't exist
