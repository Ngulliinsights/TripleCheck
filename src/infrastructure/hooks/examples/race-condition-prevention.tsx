import React, { useState } from 'react'

import { 
  useSafeEffect, 
  useCoordinatedState, 
  useCleanupManager,
  useEnhancedCleanupManager 
} from '../index'

/**
 * Example component demonstrating race condition prevention using safe hooks
 */
export function RaceConditionPreventionExample() {
  // Use coordinated state for atomic updates
  const [userState, updateUserState, { batch: batchUserUpdates, isPending }] = useCoordinatedState({
    id: null as string | null,
    name: '',
    email: '',
    isLoading: false,
  });

  // Use cleanup manager for proper resource management
  const cleanup = useEnhancedCleanupManager();

  // Safe effect that won't cause memory leaks
  useSafeEffect(() => {
    // Simulate API call with proper cleanup
    const controller = new AbortController();
    cleanup.addAbortController(controller, 'user-fetch');

    const fetchUser = async () => {
      try {
        await updateUserState(prev => ({ ...prev, isLoading: true }));
        
        // Simulate API delay
        await new Promise(resolve => {
          cleanup.addTimeout(() => resolve(undefined), 1000, 'api-delay');
        });

        if (!controller.signal.aborted) {
          // Batch multiple state updates atomically
          await batchUserUpdates([
            prev => ({ ...prev, isLoading: false }),
            prev => ({ ...prev, id: '123', name: 'John Doe', email: 'john@example.com' })
          ]);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          await updateUserState(prev => ({ ...prev, isLoading: false }));
        }
      }
    };

    fetchUser();

    // Cleanup function
    return () => {
      cleanup.runCleanup('user-fetch');
      cleanup.runCleanup('api-delay');
    };
  }, []);

  // Handle user updates with coordinated state
  const handleUpdateUser = async (updates: Partial<typeof userState>) => {
    await updateUserState(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-semibold mb-4">Race Condition Prevention Example</h3>
      
      {isPending && (
        <div className="text-blue-600 mb-2">State update in progress...</div>
      )}
      
      {userState.isLoading ? (
        <div className="text-gray-600">Loading user...</div>
      ) : (
        <div className="space-y-2">
          <div><strong>ID:</strong> {userState.id || 'Not loaded'}</div>
          <div><strong>Name:</strong> {userState.name || 'Not loaded'}</div>
          <div><strong>Email:</strong> {userState.email || 'Not loaded'}</div>
          
          <button
            onClick={() => handleUpdateUser({ name: 'Updated Name' })}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Update Name
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Example of using cleanup manager for complex async operations
 */
export function CleanupManagerExample() {
  const [status, setStatus] = useState('idle');
  const cleanup = useEnhancedCleanupManager();

  const startComplexOperation = async () => {
    setStatus('starting');

    // Add multiple cleanup operations
    const intervalKey = cleanup.addInterval(() => {
      console.log('Heartbeat...');
    }, 1000);

    const timeoutKey = cleanup.addTimeout(() => {
      setStatus('timeout reached');
    }, 5000);

    // Add event listener cleanup
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setStatus('paused - tab hidden');
      } else {
        setStatus('resumed - tab visible');
      }
    };

    cleanup.addEventListener(document, 'visibilitychange', handleVisibilityChange);

    // Simulate async work
    try {
      setStatus('working');
      await new Promise(resolve => setTimeout(resolve, 3000));
      setStatus('completed');
      
      // Clean up specific operations
      cleanup.runCleanup(intervalKey);
      cleanup.runCleanup(timeoutKey);
    } catch (error) {
      setStatus('error');
      cleanup.runAllCleanup();
    }
  };

  const stopOperation = () => {
    cleanup.runAllCleanup();
    setStatus('stopped');
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-semibold mb-4">Cleanup Manager Example</h3>
      
      <div className="mb-4">
        <strong>Status:</strong> {status}
      </div>
      
      <div className="space-x-2">
        <button
          onClick={startComplexOperation}
          disabled={status !== 'idle' && status !== 'completed' && status !== 'stopped'}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Start Operation
        </button>
        
        <button
          onClick={stopOperation}
          disabled={status === 'idle' || status === 'stopped'}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          Stop Operation
        </button>
      </div>
    </div>
  );
}

/**
 * Combined example showing all hooks working together
 */
export function CombinedHooksExample() {
  return (
    <div className="space-y-6 p-6">
      <h2 className="text-xl font-bold">Safe Hooks Examples</h2>
      <RaceConditionPreventionExample />
      <CleanupManagerExample />
    </div>
  );
}