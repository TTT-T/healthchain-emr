'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { User, APIError, UserRole } from '@/types/api';
import SessionManager from '@/lib/sessionManager';
import FormDataCleaner from '@/lib/formDataCleaner';

interface AuthContextType {
  // State
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  // const sessionManager = SessionManager.getInstance(); // Temporarily disabled

  const isAuthenticated = !!user && !!apiClient.getAccessToken();

  /**
   * Clear error message
   */
  const clearError = () => {
    setError(null);
  };

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = apiClient.getAccessToken();
        console.log('🔍 AuthContext init - Token available:', !!token);
        console.log('🔍 AuthContext init - Current path:', typeof window !== 'undefined' ? window.location.pathname : 'SSR');
        
        if (token) {
          try {
            // Only try to get user profile if we're not on setup-profile page
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/setup-profile')) {
              console.log('🔄 Getting user profile...');
              await refreshUser();
            } else {
              console.log('⏭️ Skipping profile fetch on setup-profile page');
            }
          } catch (error) {
            console.error('❌ Token validation failed during init:', error);
            
            // Check if it's a network error vs auth error
            const apiError = error as any;
            if (apiError?.statusCode === 401 || apiError?.message?.includes('Authentication')) {
              // Auth error - clear everything
              console.log('🔑 Authentication error - clearing tokens');
              apiClient.clearTokens();
              // FormDataCleaner.clearAllFormData(); // Disabled to prevent refresh
              setUser(null);
              setError(null);
            } else {
              // Network or other error - keep token but don't set user
              console.log('🌐 Network error - keeping token but not setting user');
              setUser(null);
              setError('Unable to connect to server. Please check your connection.');
            }
          }
        } else {
          console.log('❌ No token found during init');
          // Ensure everything is cleared if no token
          setUser(null);
          setError(null);
        }
      } catch (error) {
        console.error('❌ AuthContext init error:', error);
        // Clear everything on init error
        apiClient.clearTokens();
        // FormDataCleaner.clearAllFormData(); // Disabled to prevent refresh
        setUser(null);
        setError(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Note: No need for beforeunload/visibilitychange handlers anymore
    // When rememberMe is false, tokens are stored in sessionStorage
    // which automatically clears when tab is closed
    // When rememberMe is true, tokens persist until explicit logout

    // Listen for session cleared events
    const handleSessionCleared = () => {
      console.log('🔄 Session cleared event received');
      setUser(null);
      setError('Session expired. Please login again.');
      if (!window.location.pathname.includes('/login')) {
        router.push('/login');
      }
    };

    // Add session cleared listener
    if (typeof window !== 'undefined') {
      window.addEventListener('sessionCleared', handleSessionCleared);
    }

    // Cleanup
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('sessionCleared', handleSessionCleared);
      }
    };
  }, []);

  /**
   * Login user
   */
  const login = async (username: string, password: string, rememberMe: boolean = false): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔐 AuthContext: Starting login process...');
      console.log('🔐 AuthContext: Login data:', { username, rememberMe });
      console.log('🔐 AuthContext: API Client available:', !!apiClient);
      
      // Store remember me preference BEFORE login API call
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        console.log('🔒 User chose to be remembered - set BEFORE login');
      } else {
        localStorage.removeItem('rememberMe');
        console.log('🚫 User chose not to be remembered - cleared BEFORE login');
      }
      
      console.log('🌐 AuthContext: Calling apiClient.login...');
      const response = await apiClient.login({ username, password });
      console.log('📥 AuthContext: Login response received:', response);
      
      if (response.data) {
        console.log('✅ AuthContext: Login successful, setting user:', response.data.user);
        console.log('🔍 AuthContext: Token verification after login:');
        console.log('  - Access token stored:', !!apiClient.getAccessToken());
        console.log('  - Access token preview:', apiClient.getAccessToken()?.substring(0, 30) + '...' || 'none');
        
        // Set user state
        setUser(response.data.user);
        setIsLoading(false);
        
        // Return success - let the calling component handle redirect
        console.log('✅ AuthContext: Login process completed successfully');
        
      } else {
        console.error('❌ AuthContext: Login failed:', response.error?.message);
        setIsLoading(false);
        throw new Error(response.error?.message || 'Login failed');
      }
    } catch (error) {
      console.error('💥 AuthContext: Login error caught:', error);
      console.error('💥 AuthContext: Error details:', {
        name: (error as any)?.name,
        message: (error as any)?.message,
        stack: (error as any)?.stack,
        response: (error as any)?.response
      });
      setIsLoading(false);
      const apiError = error as APIError;
      
      // Don't set error in context - let the component handle all errors
      // This prevents unnecessary re-renders and redirects
      console.log('💥 AuthContext: Throwing error for component to handle:', apiError.message);
      throw error;
    }
  };

  /**
   * Register new user
   */
  const register = async (data: RegisterData): Promise<any> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiClient.register({
        ...data,
        role: 'patient' as UserRole // Default role for registration
      });
      
      if (response.data && !response.error) {
        // Clear the tokens and user data after successful registration
        // User needs to login again to access profile setup
        apiClient.clearTokens();
        setUser(null);
        
        // Return response data for caller to handle
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Registration failed');
      }
    } catch (error) {
      const apiError = error as APIError;
      let errorMessage = 'เกิดข้อผิดพลาดในการสมัครสมาชิก';
      
      // Handle specific error cases
      if (apiError.message?.includes('already exists') || apiError.message?.includes('409')) {
        errorMessage = 'อีเมลหรือชื่อผู้ใช้นี้ถูกใช้งานแล้ว กรุณาเข้าสู่ระบบหรือใช้ข้อมูลอื่น';
      } else if (apiError.message?.includes('validation')) {
        errorMessage = 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบข้อมูลและลองใหม่';
      } else if (apiError.message) {
        errorMessage = apiError.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Clear tokens and user state immediately
      apiClient.clearTokens();
      setUser(null);
      setError(null);
      
      // Clear remember me preference
      localStorage.removeItem('rememberMe');
      
      // Clear all form data
      // FormDataCleaner.clearAllFormData(); // Disabled to prevent refresh
      
      console.log('✅ Logout completed');
      
      // Redirect to login
      router.push('/login');
      
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout API fails, clear local state
      apiClient.clearTokens();
      setUser(null);
      setError(null);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Refresh user data
   */
  const refreshUser = async (): Promise<void> => {
    try {
      const token = apiClient.getAccessToken();
      if (!token) {
        setUser(null);
        return;
      }
      
      // For now, just keep existing user data
      // TODO: Implement getCurrentUser API endpoint
      console.log('Refresh user called - keeping existing user data');
      
    } catch (error) {
      console.error('Refresh user error:', error);
      setUser(null);
    }
  };

  // clearError function already declared above

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
    error,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
