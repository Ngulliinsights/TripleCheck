# TypeScript Error Summary

**Date**: April 15, 2026  
**Total Errors**: 721

## Error Breakdown by Type

| Error Code | Count | Description |
|------------|-------|-------------|
| TS2339 | 216 | Property does not exist on type |
| TS2345 | 97 | Argument type not assignable to parameter type |
| TS7006 | 69 | Parameter implicitly has 'any' type |
| TS2305 | 56 | Module has no exported member |
| TS2322 | 48 | Type not assignable to type |
| TS2304 | 43 | Cannot find name |
| TS2307 | 34 | Cannot find module |
| TS2459 | 16 | Module has no default export |
| TS2353 | 16 | Object literal may only specify known properties |
| TS2308 | 13 | Module has no exported member (duplicate) |
| TS2769 | 12 | No overload matches this call |
| TS2614 | 12 | Module has no exported member (duplicate) |
| TS2315 | 12 | Type is not generic |
| TS7053 | 9 | Element implicitly has 'any' type |
| TS2367 | 8 | This condition will always return 'false' |
| TS2724 | 7 | Module has no exported member (duplicate) |
| TS2689 | 7 | Cannot extend an interface |
| TS7034 | 5 | Variable implicitly has type 'any[]' |
| TS7005 | 5 | Variable implicitly has 'any[]' type |
| TS2503 | 5 | Cannot find namespace |

## Top Error Categories

### 1. Missing Properties/Members (216 errors - TS2339)
**Impact**: High  
**Examples**:
- Property 'image' does not exist on type 'NotificationOptions'
- Property 'propertyId' does not exist on type 'DocumentVerificationResult'
- Property 'status' does not exist on type 'DocumentVerificationResult'

**Root Cause**: Type definitions don't match actual object structures

### 2. Type Mismatches (97 errors - TS2345)
**Impact**: High  
**Examples**: Arguments passed to functions don't match expected parameter types

### 3. Implicit Any Types (69 errors - TS7006)
**Impact**: Medium  
**Examples**: Function parameters without type annotations

### 4. Missing Exports (56 errors - TS2305)
**Impact**: High  
**Examples**:
- Module '"./hooks/useMessaging"' has no exported member 'Notification'
- Module '"../../../server/types/messaging.types"' has no exported member 'NotificationChannel'

### 5. Type Assignment Issues (48 errors - TS2322)
**Impact**: Medium  
**Examples**: Type 'X' is not assignable to type 'Y'

### 6. Cannot Find Name (43 errors - TS2304)
**Impact**: High  
**Examples**: Variables or types referenced but not defined

### 7. Cannot Find Module (34 errors - TS2307)
**Impact**: High  
**Examples**: Import paths that don't resolve to actual files

## Critical Issues

### New Library Integration Errors (12 errors)
**Files Affected**:
- `server/infrastructure/observability/telemetry.ts` - OpenTelemetry integration issues
- `server/middleware/validation.ts` - Zod validation middleware issues

**Status**: These are from the new ADR 010-015 implementations

### Communication Module Issues (~50 errors)
**Files Affected**:
- `src/communication/hooks/useNotifications.ts`
- `src/communication/services/DocumentCommunicationIntegration.ts`
- `src/communication/index.ts`

**Root Cause**: Type definitions missing or mismatched

### Document Verification Issues (~30 errors)
**Files Affected**:
- `src/communication/services/DocumentCommunicationIntegration.ts`

**Root Cause**: `DocumentVerificationResult` type incomplete

## Comparison to Previous State

**Note**: No baseline available from before ADR extraction work.

## Recommended Actions

### Priority 1: Fix New Library Integration (12 errors)
1. Fix OpenTelemetry configuration in `telemetry.ts`
2. Fix Zod validation middleware signatures
3. Verify library versions match documentation

### Priority 2: Fix Type Definitions (216 + 56 = 272 errors)
1. Add missing properties to type definitions
2. Export missing types from modules
3. Update interface definitions to match actual usage

### Priority 3: Add Type Annotations (69 errors)
1. Add explicit types to function parameters
2. Enable stricter TypeScript checks gradually

### Priority 4: Fix Import Paths (34 errors)
1. Verify all import paths resolve correctly
2. Update paths after file moves/renames

## Notes

- Many errors are related to incomplete type definitions
- New library integrations (ADR 010-015) introduced ~12 new errors
- Communication and document verification modules need type definition updates
- Consider enabling stricter TypeScript checks after fixing critical errors

## Next Steps

1. Fix critical library integration errors (Priority 1)
2. Update type definitions for communication module
3. Add missing exports
4. Run incremental fixes and re-check error count
