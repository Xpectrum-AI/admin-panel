import { useState, useEffect, useCallback } from 'react';
import { useAuthInfo } from '@propelauth/react';
import { 
  getAuthState, 
  setAuthState, 
  clearAuthState, 
  getStoredToken, 
  setStoredToken, 
  removeStoredToken,
  getStoredUser,
  setStoredUser,
  removeStoredUser,
  type User,
  type AuthState
} from '@/lib/utils/authUtils';
import { 
  login as loginService, 
  logout as logoutService, 
  getCurrentUser as getCurrentUserService,
  createUser as createUserService,
  changePassword as changePasswordService,
  resetPassword as resetPasswordService
} from '@/service/userService';

export interface UseAuthReturn {
  // State
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (userData: SignupData) => Promise<void>;
  getCurrentUser: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
  
  // Utilities
  refreshAuth: () => void;
}

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
}

export function useAuth(): UseAuthReturn {
  const [authState, setAuthStateLocal] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: true,
  });
  const [error, setError] = useState<string | null>(null);
  
  // PropelAuth hook
  const { user: propelUser, isLoggedIn, loading: propelLoading } = useAuthInfo();

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedState = getAuthState();
        
        if (propelUser && isLoggedIn) {
          // Use PropelAuth user data
          const user: User = {
            userId: propelUser.userId,
            email: propelUser.email,
            firstName: propelUser.firstName || undefined,
            lastName: propelUser.lastName || undefined,
            username: propelUser.username || undefined,
            emailConfirmed: propelUser.emailConfirmed,
            locked: propelUser.locked,
            enabled: propelUser.enabled,
            createdAt: propelUser.createdAt?.toString(),
            lastActiveAt: propelUser.lastActiveAt?.toString(),
            assignedRoles: (propelUser as any).assignedRoles || [],
            permissions: (propelUser as any).permissions || [],
            metadata: (propelUser as any).metadata || {},
          };
          
          setAuthStateLocal({
            isAuthenticated: true,
            user,
            token: getStoredToken(),
            isLoading: false,
          });
          
          // Store user data
          setStoredUser(user);
        } else if (storedState.isAuthenticated) {
          // Use stored state
          setAuthStateLocal({
            ...storedState,
            isLoading: false,
          });
        } else {
          // Not authenticated
          setAuthStateLocal({
            isAuthenticated: false,
            user: null,
            token: null,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthStateLocal({
          isAuthenticated: false,
          user: null,
          token: null,
          isLoading: false,
        });
      }
    };

    if (!propelLoading) {
      initializeAuth();
    }
  }, [propelUser, isLoggedIn, propelLoading]);

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      setAuthStateLocal(prev => ({ ...prev, isLoading: true }));
      
      const result = await loginService(email, password);
      
      if (result.data?.accessToken) {
        setStoredToken(result.data.accessToken);
      }
      
      // Get current user data
      await getCurrentUser();
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed';
      setError(errorMessage);
      throw error;
    } finally {
      setAuthStateLocal(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      setError(null);
      setAuthStateLocal(prev => ({ ...prev, isLoading: true }));
      
      await logoutService();
      clearAuthState();
      
      setAuthStateLocal({
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Logout failed';
      setError(errorMessage);
      // Still clear local state even if server logout fails
      clearAuthState();
      setAuthStateLocal({
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
      });
    } finally {
      setAuthStateLocal(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Signup function
  const signup = useCallback(async (userData: SignupData) => {
    try {
      setError(null);
      setAuthStateLocal(prev => ({ ...prev, isLoading: true }));
      
      await createUserService(
        userData.email,
        userData.password,
        userData.firstName,
        userData.lastName,
        userData.username
      );
    } catch (error: any) {
      const errorMessage = error.message || 'Signup failed';
      setError(errorMessage);
      throw error;
    } finally {
      setAuthStateLocal(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Get current user function
  const getCurrentUser = useCallback(async () => {
    try {
      setError(null);
      
      const result = await getCurrentUserService();
      
      if (result.data) {
        const user: User = result.data;
        setStoredUser(user);
        
        setAuthStateLocal(prev => ({
          ...prev,
          user,
          isAuthenticated: true,
        }));
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to get current user';
      setError(errorMessage);
      
      // If getting current user fails, clear auth state
      clearAuthState();
      setAuthStateLocal({
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
      });
    }
  }, []);

  // Change password function
  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      setError(null);
      setAuthStateLocal(prev => ({ ...prev, isLoading: true }));
      
      await changePasswordService(currentPassword, newPassword);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to change password';
      setError(errorMessage);
      throw error;
    } finally {
      setAuthStateLocal(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Reset password function
  const resetPassword = useCallback(async (email: string) => {
    try {
      setError(null);
      setAuthStateLocal(prev => ({ ...prev, isLoading: true }));
      
      await resetPasswordService(email);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to send password reset email';
      setError(errorMessage);
      throw error;
    } finally {
      setAuthStateLocal(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refresh auth function
  const refreshAuth = useCallback(() => {
    if (authState.isAuthenticated) {
      getCurrentUser();
    }
  }, [authState.isAuthenticated, getCurrentUser]);

  return {
    // State
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    token: authState.token,
    isLoading: authState.isLoading,
    error,
    
    // Actions
    login,
    logout,
    signup,
    getCurrentUser,
    changePassword,
    resetPassword,
    clearError,
    
    // Utilities
    refreshAuth,
  };
}
