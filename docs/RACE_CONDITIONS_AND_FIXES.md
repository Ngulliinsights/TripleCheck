# Race Conditions, Infinite API Calls, and UI Flickering - Analysis & Fixes

## Critical Issues Identified and Resolved

### 1. **Race Conditions in React Query Configuration**

**Issue**: The default React Query configuration had `staleTime: Infinity` and improper retry logic, causing race conditions when multiple queries competed for the same data.

**Fix Applied**:
- Updated `queryClient.ts` with proper staleTime (5 minutes)
- Added intelligent retry logic that doesn't retry on 4xx errors
- Implemented exponential backoff for retries
- Added proper garbage collection time

### 2. **Infinite API Calls in Home Page**

**Issue**: The `useEffect` in `home.tsx` had a dependency array that included `searchQuery`, causing infinite loops when URL search parameters changed.

**Fix Applied**:
- Removed `searchQuery` from the dependency array in the `useEffect`
- Added proper condition checks to prevent unnecessary state updates
- Implemented proper URL parameter synchronization

### 3. **UI Flickering from Unnecessary Re-renders**

**Issue**: Multiple components were re-rendering unnecessarily due to:
- Non-memoized query keys
- Recreated objects in dependency arrays
- Missing React.memo optimizations

**Fixes Applied**:
- Created `useStableQuery` hook to prevent unnecessary re-renders
- Added proper memoization for query parameters
- Implemented `useDebounce` hook for search inputs
- Fixed component memoization patterns

### 4. **Missing Dependencies and Improper Query Management**

**Issue**: Several components had missing dependencies in useEffect hooks and improper query key management.

**Fixes Applied**:
- Fixed all missing dependencies in useEffect hooks
- Implemented proper query key management
- Added proper error handling for failed queries
- Created `useOptimisticMutation` for better UX

### 5. **Authentication State Race Conditions**

**Issue**: Authentication queries in multiple components could cause race conditions when user state changed.

**Fix Applied**:
- Standardized authentication query configuration across all components
- Added proper staleTime and refetch settings
- Implemented consistent error handling for auth failures

## New Utility Hooks Created

### 1. `useDebounce` Hook
Prevents excessive API calls by debouncing user input, especially useful for search functionality.

### 2. `useStableQuery` Hook
Provides stable query keys and prevents race conditions by memoizing query options.

### 3. `useOptimisticMutation` Hook
Implements optimistic updates with proper rollback on failure, preventing race conditions in mutations.

### 4. `QueryErrorBoundary` Component
Provides graceful error handling for React Query errors and prevents cascading failures.

## Launch.json Configuration

Created an optimal debugging configuration with:
- **Client debugging**: Chrome debugger for React app
- **Server debugging**: Node.js debugger for Express server
- **Full-stack debugging**: Combined client + server debugging
- **Test debugging**: Vitest test runner debugging
- **Script debugging**: Individual script debugging capability

## Performance Optimizations Applied

1. **Query Deduplication**: Prevented duplicate API calls for the same data
2. **Intelligent Caching**: Proper staleTime and gcTime configuration
3. **Error Boundary Protection**: Graceful error handling prevents app crashes
4. **Optimistic Updates**: Better UX with immediate feedback
5. **Debounced Inputs**: Reduced API calls for search functionality

## Components Fixed

1. **Home Page** (`client/src/pages/home.tsx`)
   - Fixed infinite loop in search query synchronization
   - Added proper memoization for query parameters

2. **Property Page** (`client/src/pages/property.tsx`)
   - Fixed race conditions in property and user queries
   - Added proper error handling for 404 errors

3. **Search Results** (`client/src/pages/search-results.tsx`)
   - Fixed race conditions in search query execution
   - Added proper query function implementation

4. **Reviews Page** (`client/src/pages/services/reviews.tsx`)
   - Fixed unused imports
   - Added proper query configuration

5. **App Component** (`client/src/App.tsx`)
   - Fixed authentication state race conditions
   - Added missing imports

6. **Query Client** (`client/src/lib/queryClient.ts`)
   - Complete overhaul of React Query configuration
   - Added intelligent retry and error handling

## Testing the Fixes

To verify the fixes work correctly:

1. **Start the development servers**:
   ```bash
   npm run dev  # Start backend
   cd client && npm run dev  # Start frontend
   ```

2. **Test scenarios**:
   - Navigate between pages rapidly to test race conditions
   - Perform searches to test infinite API call prevention
   - Test network failures to verify error handling
   - Test authentication flows to verify state management

3. **Use the debugging configuration**:
   - Press F5 in VS Code
   - Select "Debug Client + Server" to debug both simultaneously
   - Set breakpoints to verify proper query execution

## Monitoring and Maintenance

1. **React Query DevTools**: Enable in development to monitor query states
2. **Error Logging**: All errors are now properly logged for debugging
3. **Performance Monitoring**: Query timing and cache hit rates can be monitored
4. **Network Tab**: Monitor for duplicate or unnecessary API calls

## Best Practices Implemented

1. **Consistent Query Configuration**: All queries now use consistent settings
2. **Proper Error Boundaries**: Graceful error handling throughout the app
3. **Optimistic Updates**: Better UX with immediate feedback
4. **Intelligent Caching**: Reduced server load and improved performance
5. **Type Safety**: Proper TypeScript types for all query operations

These fixes address the core issues causing race conditions, infinite API calls, and UI flickering while maintaining optimal performance and user experience.