import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Stable authentication hook that prevents race conditions
 * Implements the authentication separation pattern from the analysis
 */
interface AuthState {
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
}

export function useStableAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const authCheckInProgress = useRef(false);
  const mounted = useRef(true);

  // Single authentication check on mount
  useEffect(() => {
    const checkAuth = async () => {
      // Prevent duplicate auth checks
      if (authCheckInProgress.current) {
        console.log('🔒 Auth check already in progress, skipping...');
        return;
      }

      authCheckInProgress.current = true;
      console.log('🔍 Checking authentication status...');

      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });

        if (!mounted.current) return;

        if (response.ok) {
          const userData = await response.json();
          console.log('✅ User authenticated:', userData?.username || 'Unknown');
          
          setAuthState({
            user: userData,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          console.log('🚫 User not authenticated');
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('❌ Auth check failed:', error);
        
        if (!mounted.current) return;
        
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: error instanceof Error ? error : new Error('Auth check failed'),
        });
      } finally {
        authCheckInProgress.current = false;
      }
    };

    checkAuth();

    // Cleanup function
    return () => {
      mounted.current = false;
    };
  }, []); // Empty dependency array - runs only once

  // Stable logout function
  const logout = useCallback(async () => {
    if (authCheckInProgress.current) {
      console.log('🔒 Auth operation in progress, please wait...');
      return { success: false, message: 'Auth operation in progress' };
    }

    authCheckInProgress.current = true;
    console.log('🚪 Logging out...');

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (!mounted.current) return { success: false, message: 'Component unmounted' };

      if (response.ok) {
        console.log('✅ Logout successful');
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
        return { success: true, message: 'Logged out successfully' };
      } else {
        throw new Error('Logout failed');
      }
    } catch (error) {
      console.error('❌ Logout failed:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Logout failed' 
      };
    } finally {
      authCheckInProgress.current = false;
    }
  }, []);

  // Stable login function
  const login = useCallback(async (credentials: { username: string; password: string }) => {
    if (authCheckInProgress.current) {
      console.log('🔒 Auth operation in progress, please wait...');
      return { success: false, message: 'Auth operation in progress' };
    }

    authCheckInProgress.current = true;
    console.log('🔑 Logging in...');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      if (!mounted.current) return { success: false, message: 'Component unmounted' };

      if (response.ok) {
        const userData = await response.json();
        console.log('✅ Login successful:', userData?.username || 'Unknown');
        
        setAuthState({
          user: userData,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return { success: true, message: 'Login successful', user: userData };
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
        throw new Error(errorData.message || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Login failed:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Login failed' 
      };
    } finally {
      authCheckInProgress.current = false;
    }
  }, []);

  return {
    ...authState,
    login,
    logout,
    isAuthInProgress: authCheckInProgress.current,
  };
}