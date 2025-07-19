/**
 * Example of how to integrate OperationTracker with existing React components
 * 
 * This example demonstrates how to track operations in a typical React component
 * that might experience race conditions, infinite API calls, or UI flickering.
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  useComponentTracking, 
  useTrackedQuery, 
  useTrackedMutation,
  useInteractionTracking,
  useTrackedEffect
} from '@/hooks/useOperationTracking';
import { operationTracker } from '@/utils/operation-tracker';

interface User {
  id: number;
  name: string;
  email: string;
}

interface SearchResult {
  users: User[];
  total: number;
}

/**
 * Example component that demonstrates common race condition scenarios
 * and how to track them with OperationTracker
 */
export function TrackedComponentExample() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Track component lifecycle automatically
  const { mountOperationId, renderCount } = useComponentTracking(
    'TrackedComponentExample',
    [searchTerm, selectedUser, isEditing] // Dependencies that trigger updates
  );

  // Track user interactions
  const { trackInteraction } = useInteractionTracking('TrackedComponentExample');

  // Tracked search query - this might cause race conditions if not handled properly
  const searchQuery = useTrackedQuery<SearchResult>(
    {
      queryKey: ['users', 'search', searchTerm],
      queryFn: async () => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
        
        // Simulate search results
        const mockUsers: User[] = [
          { id: 1, name: `User matching "${searchTerm}"`, email: `user1@example.com` },
          { id: 2, name: `Another user with "${searchTerm}"`, email: `user2@example.com` }
        ];
        
        return {
          users: searchTerm ? mockUsers : [],
          total: searchTerm ? mockUsers.length : 0
        };
      },
      enabled: searchTerm.length > 2, // Only search when we have enough characters
      staleTime: 5000, // Cache results for 5 seconds
    },
    {
      componentName: 'TrackedComponentExample',
      description: `Search users for "${searchTerm}"`,
      parentOperationId: mountOperationId
    }
  );

  // Tracked mutation for updating user data
  const updateUserMutation = useTrackedMutation<User, Error, Partial<User>>(
    {
      mutationFn: async (userData) => {
        // Track the start of the API call
        const apiOperationId = operationTracker.startOperation(
          'api_call',
          `Update user ${userData.id}`,
          'TrackedComponentExample',
          undefined,
          { userId: userData.id, changes: Object.keys(userData) }
        );

        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          operationTracker.recordMilestone(
            apiOperationId,
            'completed',
            userData,
            undefined,
            { success: true }
          );

          return { ...selectedUser, ...userData } as User;
        } catch (error) {
          operationTracker.recordMilestone(
            apiOperationId,
            'failed',
            undefined,
            error as Error
          );
          throw error;
        }
      },
      onSuccess: (updatedUser) => {
        setSelectedUser(updatedUser);
        setIsEditing(false);
        
        // Track successful update
        trackInteraction('user_update_success', `Updated user ${updatedUser.id}`, {
          userId: updatedUser.id,
          changes: Object.keys(updatedUser)
        });
      },
      onError: (error) => {
        // Track failed update
        trackInteraction('user_update_error', `Failed to update user`, {
          error: error.message
        });
      }
    },
    {
      componentName: 'TrackedComponentExample',
      description: 'Update user data',
      parentOperationId: mountOperationId
    }
  );

  // Tracked effect for search term changes - this could cause infinite loops
  useTrackedEffect(
    'search-term-effect',
    () => {
      // This effect demonstrates a potential race condition:
      // If the search term changes rapidly, multiple API calls might be in flight
      
      if (searchTerm.length > 0 && searchTerm.length <= 2) {
        // Clear results for short search terms
        // This could cause flickering if not handled properly
        console.log('Clearing search results for short term:', searchTerm);
      }
      
      // No cleanup needed for this effect
      return undefined;
    },
    [searchTerm],
    'TrackedComponentExample'
  );

  // Tracked effect for selected user changes
  useTrackedEffect(
    'selected-user-effect',
    () => {
      if (selectedUser) {
        // This could cause a race condition if the user is changed rapidly
        console.log('Selected user changed:', selectedUser.id);
        
        // Simulate some side effect that might cause issues
        const sideEffectOperationId = operationTracker.startOperation(
          'state_update',
          `Process user selection: ${selectedUser.name}`,
          'TrackedComponentExample',
          mountOperationId,
          { userId: selectedUser.id }
        );

        // Simulate async side effect
        setTimeout(() => {
          operationTracker.recordMilestone(
            sideEffectOperationId,
            'completed',
            { processed: true }
          );
        }, 100);
      }
      
      return undefined;
    },
    [selectedUser?.id], // Only depend on ID to avoid unnecessary re-runs
    'TrackedComponentExample'
  );

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    
    // Track the user interaction
    trackInteraction('search_input', `Search term changed to "${newSearchTerm}"`, {
      previousTerm: searchTerm,
      newTerm: newSearchTerm,
      termLength: newSearchTerm.length
    });

    setSearchTerm(newSearchTerm);
  };

  // Handle user selection
  const handleUserSelect = (user: User) => {
    trackInteraction('user_select', `Selected user ${user.name}`, {
      userId: user.id,
      previousUserId: selectedUser?.id
    });

    setSelectedUser(user);
  };

  // Handle edit mode toggle
  const handleEditToggle = () => {
    const newEditingState = !isEditing;
    
    trackInteraction('edit_toggle', `Edit mode ${newEditingState ? 'enabled' : 'disabled'}`, {
      userId: selectedUser?.id,
      editingState: newEditingState
    });

    setIsEditing(newEditingState);
  };

  // Handle user update
  const handleUserUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedUser) return;

    const formData = new FormData(e.currentTarget);
    const updatedData = {
      id: selectedUser.id,
      name: formData.get('name') as string,
      email: formData.get('email') as string
    };

    trackInteraction('user_update_submit', `Submitting user update`, {
      userId: selectedUser.id,
      changes: Object.keys(updatedData).filter(key => 
        updatedData[key as keyof typeof updatedData] !== selectedUser[key as keyof User]
      )
    });

    updateUserMutation.mutate(updatedData);
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Tracked Component Example
            <div className="text-sm text-gray-500">
              Render #{renderCount} | Operation ID: {mountOperationId}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Section */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Search Users (demonstrates potential race conditions)
            </label>
            <Input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Type at least 3 characters to search..."
              className="w-full"
            />
            
            {/* Search Status */}
            <div className="mt-2 text-sm text-gray-600">
              {searchQuery.isFetching && (
                <span className="text-blue-600">🔄 Searching... (Operation: {searchQuery.operationId})</span>
              )}
              {searchQuery.error && (
                <span className="text-red-600">❌ Search failed: {searchQuery.error.message}</span>
              )}
              {searchQuery.data && (
                <span className="text-green-600">
                  ✅ Found {searchQuery.data.total} users
                </span>
              )}
            </div>
          </div>

          {/* Search Results */}
          {searchQuery.data?.users && searchQuery.data.users.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Search Results:</h3>
              <div className="space-y-2">
                {searchQuery.data.users.map(user => (
                  <div
                    key={user.id}
                    className={`p-2 border rounded cursor-pointer hover:bg-gray-50 ${
                      selectedUser?.id === user.id ? 'bg-blue-50 border-blue-300' : ''
                    }`}
                    onClick={() => handleUserSelect(user)}
                  >
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected User Section */}
          {selectedUser && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Selected User
                  <Button
                    size="sm"
                    onClick={handleEditToggle}
                    disabled={updateUserMutation.isPending}
                  >
                    {isEditing ? 'Cancel' : 'Edit'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <form onSubmit={handleUserUpdate} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Name</label>
                      <Input
                        name="name"
                        defaultValue={selectedUser.name}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <Input
                        name="email"
                        type="email"
                        defaultValue={selectedUser.email}
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={updateUserMutation.isPending}
                      >
                        {updateUserMutation.isPending ? 'Updating...' : 'Update User'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleEditToggle}
                      >
                        Cancel
                      </Button>
                    </div>
                    
                    {/* Mutation Status */}
                    {updateUserMutation.isPending && (
                      <div className="text-sm text-blue-600">
                        🔄 Updating user... (Operation: {updateUserMutation.operationId})
                      </div>
                    )}
                    {updateUserMutation.error && (
                      <div className="text-sm text-red-600">
                        ❌ Update failed: {updateUserMutation.error.message}
                      </div>
                    )}
                  </form>
                ) : (
                  <div className="space-y-2">
                    <div><strong>Name:</strong> {selectedUser.name}</div>
                    <div><strong>Email:</strong> {selectedUser.email}</div>
                    <div><strong>ID:</strong> {selectedUser.id}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Debug Information */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-sm">Debug Information</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <div><strong>Component Renders:</strong> {renderCount}</div>
              <div><strong>Mount Operation ID:</strong> {mountOperationId}</div>
              <div><strong>Search Query Status:</strong> {searchQuery.status}</div>
              <div><strong>Search Operation ID:</strong> {searchQuery.operationId || 'None'}</div>
              <div><strong>Mutation Status:</strong> {updateUserMutation.status}</div>
              <div><strong>Mutation Operation ID:</strong> {updateUserMutation.operationId || 'None'}</div>
              
              <div className="mt-4">
                <Button
                  size="sm"
                  onClick={() => {
                    console.log('=== Operation Timeline ===');
                    console.log(operationTracker.generateTimeline());
                    console.log('=== Race Condition Analysis ===');
                    console.table(operationTracker.analyzeRaceConditions());
                  }}
                >
                  Log Debug Info to Console
                </Button>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}

export default TrackedComponentExample;