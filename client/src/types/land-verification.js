"use strict";
// Land Verification System Type Definitions
// This file contains all TypeScript interfaces and types for the Kenya Land Verification System
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERIFICATION_STATUS_COLORS = exports.RISK_LEVEL_COLORS = exports.VERIFICATION_LAYER_NAMES = void 0;
// Constants
exports.VERIFICATION_LAYER_NAMES = {
    registry: 'Land Registry Verification',
    physical: 'Physical Ground-Verification',
    community: 'Community Intelligence',
    government: 'Government Designations',
    legal: 'Legal History Investigation',
    expert: 'Professional Expert Assessment'
};
exports.RISK_LEVEL_COLORS = {
    low: 'text-green-600 bg-green-50 border-green-200',
    medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    high: 'text-orange-600 bg-orange-50 border-orange-200',
    critical: 'text-red-600 bg-red-50 border-red-200'
};
exports.VERIFICATION_STATUS_COLORS = {
    not_started: 'text-gray-600 bg-gray-50 border-gray-200',
    in_progress: 'text-blue-600 bg-blue-50 border-blue-200',
    completed: 'text-green-600 bg-green-50 border-green-200',
    suspended: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    failed: 'text-red-600 bg-red-50 border-red-200'
};
