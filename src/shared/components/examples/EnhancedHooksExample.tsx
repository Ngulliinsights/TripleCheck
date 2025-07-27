/**
 * Enhanced Hooks Usage Example
 * 
 * This component demonstrates the proper usage of our enhanced hooks:
 * - useSafeQuery for robust data fetching
 * - useOptimisticMutation for instant UI feedback
 * - useOperationTracking for performance monitoring
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Badge } from '@shared/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle, Activity } from 'lucide-react';

// Import our enhanced hooks
import { 
  useSafePropertiesQuery, 
  useSafeUserQuery, 
  useSafeTrustScoreQuery 
} from '@shared/hooks/useSafeQuery';
import { useOptimisticMutation } from '@shared/hooks/useOptimisticMutation';
import { 
  useComponentTracking, 
  useInteractionTracking, 
  useOperationDebug 
} from '@shared/hooks/useOperationTracking';

export default function EnhancedHooksExample() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');

  // 1. Component Performance Tracking
  const { renderCount, mountOperationId } = useComponentTracking(
    'EnhancedHooksExample', 
    [searchQuery, selectedPropertyId]
  );
  const { trackInteraction } = useInteractionTracking('EnhancedHooksExample');

  // 2. Safe Data Fetching with Fallbacks
  const { 
    data: properties, 
    isLoading: propertiesLoading, 
    hasValidData: hasProperties,
    error: propertiesError,
    cancelRequest: cancelPropertiesRequest
  } = useSafePropertiesQuery(
    { search: searchQuery },
    {
      context: 'hooks-example',
      staleTime: 5 * 60 * 1000,
      debounceMs: 300, // Debounce search queries
      validator: (data) => {
        // Custom validation for our specific needs
        if (!Array.isArray(data)) return [];
        return data.filter(property => 
          property && 
          property.id && 
          property.title &&
          property.price > 0
        );
      }
    }
  );

  // 3. User Authentication with Safe Handling
  const { 
    data: user, 
    hasValidData: isAuthenticated 
  } = useSafeUserQuery({
    context: 'hooks-example',
    retry: false // Don't retry auth failures
  });

  // 4. Trust Score with Conditional Loading
  const { 
    data: trustScore, 
    isLoading: trustLoading 
  } = useSafeTrustScoreQuery(
    user?.id || '',
    {
      enabled: isAuthenticated && !!user?.id,
      context: 'hooks-example'
    }
  );

  // 5. Optimistic Mutation for Instant Feedback
  const updatePropertyMutation = useOptimisticMutation({
    mutationFn: async (data: { id: string; title: string }) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { ...data, updatedAt: new Date().toISOString() };
    },
    queryKey: ['/api/properties'],
    optimisticUpdate: (oldData, variables) => {
      if (!Array.isArray(oldData)) return oldData;
      return oldData.map(property => 
        property.id === variables.id 
          ? { ...property, ...variables, isOptimistic: true }
          : property
      );
    },
    onError: (error, variables, context) => {
      console.error('Property update failed:', error);
      // Error handling with context
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      console.log('Property update completed');
    }
  });

  // 6. Performance Debugging (Development Only)
  const { 
    debugInfo, 
    logTimeline, 
    logRaceConditions 
  } = useOperationDebug('EnhancedHooksExample');

  // Event Handlers with Interaction Tracking
  const handleSearch = (query: string) => {
    trackInteraction('search', 'Property search performed', {
      query,
      resultCount: properties.length,
      renderCount
    });
    setSearchQuery(query);
  };

  const handlePropertyUpdate = (propertyId: string, newTitle: string) => {
    trackInteraction('update', 'Property title updated', {
      propertyId,
      newTitle,
      isOptimistic: true
    });

    updatePropertyMutation.mutate({
      id: propertyId,
      title: newTitle
    });
  };

  const handleCancelRequests = () => {
    trackInteraction('cancel', 'Requests cancelled', {
      activeRequests: debugInfo?.componentOperations?.length || 0
    });
    cancelPropertiesRequest();
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Enhanced Hooks Example
            <Badge variant="outline">Render #{renderCount}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Search Input with Debouncing */}
          <div className="space-y-2">
            <label htmlFor="search" className="text-sm font-medium">
              Property Search (Debounced)
            </label>
            <Input
              id="search"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search properties..."
              className="w-full"
            />
          </div>

          {/* User Authentication Status */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Authenticated as {user?.firstName} {user?.lastName}</span>
                {trustLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Badge variant="secondary">
                    Trust Score: {trustScore?.score || 0}
                  </Badge>
                )}
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                <span>Not authenticated</span>
              </>
            )}
          </div>

          {/* Properties List with Safe Loading */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">
                Properties ({hasProperties ? properties.length : 0})
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelRequests}
                  disabled={!propertiesLoading}
                >
                  Cancel Requests
                </Button>
                {import.meta.env.MODE === 'development' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={logTimeline}
                    >
                      Log Timeline
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={logRaceConditions}
                    >
                      Check Race Conditions
                    </Button>
                  </>
                )}
              </div>
            </div>

            {propertiesLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading properties...
              </div>
            )}

            {propertiesError && (
              <div className="flex items-center gap-2 text-sm text-red-500">
                <AlertCircle className="w-4 h-4" />
                Error: {propertiesError.message}
              </div>
            )}

            {hasProperties && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {properties.map((property) => (
                  <div
                    key={property.id}
                    className={`p-3 border rounded-lg ${
                      property.isOptimistic ? 'bg-blue-50 border-blue-200' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{property.title}</h4>
                        <p className="text-sm text-gray-500">
                          ${property.price?.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {property.isOptimistic && (
                          <Badge variant="outline" className="text-blue-600">
                            Updating...
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePropertyUpdate(
                            property.id, 
                            `${property.title} (Updated)`
                          )}
                          disabled={updatePropertyMutation.isPending}
                        >
                          {updatePropertyMutation.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            'Update'
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!propertiesLoading && !hasProperties && !propertiesError && (
              <div className="text-center py-8 text-gray-500">
                No properties found. Try a different search.
              </div>
            )}
          </div>

          {/* Debug Information (Development Only) */}
          {import.meta.env.MODE === 'development' && debugInfo && (
            <details className="text-xs">
              <summary className="cursor-pointer font-medium">
                Debug Information
              </summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Export for easy integration
export { EnhancedHooksExample };