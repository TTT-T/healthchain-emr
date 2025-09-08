'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { User, APIError, UserRole } from '@/types/api';
// import SessionManager from '@/lib/sessionManager';
// import FormDataCleaner from '@/lib/formDataCleaner';
import { showError, showSuccess, showWarning } from '@/lib/alerts';
import { logger } from '@/lib/logger';

interface AuthContextType {
  // State
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (data: RegisterData) => Promise<{ success: boolean; message?: string }>;
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
  nationalId?: string;
  birthDate?: string;
  gender?: string;
  address?: string;
  bloodType?: string;
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
        // Initialize authentication context
        
        if (token) {
          try {
            // Only try to get user profile if we're not on setup-profile page
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/setup-profile')) {
              console.log('🔍 AuthContext - Refreshing user data on init');
              await refreshUser();
            } else {
              console.log('🔍 AuthContext - Skipping user refresh on setup-profile page');
              // Don't set user to null on setup-profile page to prevent redirect loops
              setUser(null);
            }
          } catch (error) {
            // Check if it's a network error vs auth error
            const apiError = error as { statusCode?: number; message?: string };
            if (apiError?.statusCode === 401 || apiError?.message?.includes('Authentication')) {
              // Auth error - dispatch token expiry event instead of clearing immediately
              console.log('🔍 AuthContext - Auth error, dispatching token expiry event');
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('tokenExpired', {
                  detail: {
                    message: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่',
                    statusCode: 401
                  }
                }));
              }
            } else {
              // Network or other error - keep token but don't set user
              console.log('🔍 AuthContext - Network error, keeping token');
              setUser(null);
              setError('Unable to connect to server. Please check your connection.');
            }
          }
        } else {
          // Ensure everything is cleared if no token
          console.log('🔍 AuthContext - No token, clearing user data');
          setUser(null);
          setError(null);
        }
      } catch (error) {
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
      setUser(null);
      setError('Session expired. Please login again.');
      showWarning('เซสชันหมดอายุ', 'กรุณาเข้าสู่ระบบใหม่');
      if (!window.location.pathname.includes('/login')) {
        router.push('/login');
      }
    };

    // Listen for user logged in events
    const handleUserLoggedIn = (event: CustomEvent) => {
      const { user } = event.detail;
      setUser(user);
      setError(null);
    };

    // Listen for refresh user data events
    const handleRefreshUserData = async () => {
      console.log('🔍 AuthContext - Refreshing user data');
      try {
        await refreshUser();
      } catch (error) {
        console.error('🔍 AuthContext - Failed to refresh user data:', error);
      }
    };

    // Add event listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('sessionCleared', handleSessionCleared);
      window.addEventListener('userLoggedIn', handleUserLoggedIn as EventListener);
      window.addEventListener('refreshUserData', handleRefreshUserData);
    }

    // Cleanup
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('sessionCleared', handleSessionCleared);
        window.removeEventListener('userLoggedIn', handleUserLoggedIn as EventListener);
        window.removeEventListener('refreshUserData', handleRefreshUserData);
      }
    };
  }, [router]);

  /**
   * Login user
   */
  const login = async (username: string, password: string, rememberMe: boolean = false): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Starting login process
      
      // Store remember me preference BEFORE login API call
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }
      
      const response = await apiClient.login({ username, password });
      
      if (response.data) {
        // Set user state
        setUser(response.data.user);
        setIsLoading(false);
        
        // Show success notification
        showSuccess('เข้าสู่ระบบสำเร็จ', 'ยินดีต้อนรับสู่ระบบบันทึกสุขภาพอิเล็กทรอนิกส์');
        
      } else {
        setIsLoading(false);
        throw new Error(response.error?.message || 'Login failed');
      }
    } catch (error) {
      setIsLoading(false);
      const apiError = error as APIError;
      
      // Show error notification
      showError('เข้าสู่ระบบไม่สำเร็จ', apiError.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      
      // Don't set error in context - let the component handle all errors
      // This prevents unnecessary re-renders and redirects
      throw error;
    }
  };

  /**
   * Register new user
   */
  const register = async (data: RegisterData): Promise<{ success: boolean; message?: string }> => {
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
        return {
          success: true,
          message: 'สมัครสมาชิกสำเร็จ'
        };
      } else {
        throw new Error(response.error?.message || 'Registration failed');
      }
    } catch (error) {
      const apiError = error as APIError;
      let errorMessage = 'เกิดข้อผิดพลาดในการสมัครสมาชิก';
      
      // Handle specific error cases
      if (apiError.message?.includes('already exists') || apiError.message?.includes('409') || apiError.statusCode === 409) {
        errorMessage = (apiError.details as any)?.message || 'อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่นหรือเข้าสู่ระบบ';
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
      
      // Show success notification
      showSuccess('ออกจากระบบสำเร็จ', 'ขอบคุณที่ใช้บริการ');
      
      // Redirect to login
      router.push('/login');
      
    } catch (error) {
      // Even if logout API fails, clear local state
      apiClient.clearTokens();
      setUser(null);
      setError(null);
      showSuccess('ออกจากระบบสำเร็จ', 'ขอบคุณที่ใช้บริการ');
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
        console.log('🔍 AuthContext - No token for refresh, clearing user');
        setUser(null);
        return;
      }
      
      console.log('🔍 AuthContext - Refreshing user data from API');
      // Get fresh user data from API
      const response = await apiClient.getProfile();
      if (response.statusCode === 200 && response.data) {
        console.log('🔍 AuthContext - User data refreshed successfully');
        setUser(response.data);
        setError(null);
      } else {
        console.log('🔍 AuthContext - Failed to load user profile');
        setUser(null);
        setError('Failed to load user profile');
      }
      
    } catch (error) {
      logger.error('Refresh user error:', error);
      console.log('🔍 AuthContext - Error refreshing user:', error);
      
      // Check if it's an auth error
      const apiError = error as { statusCode?: number; message?: string };
      if (apiError?.statusCode === 401 || apiError?.message?.includes('Authentication')) {
        // Dispatch token expiry event instead of setting error
        console.log('🔍 AuthContext - Auth error during refresh, dispatching token expiry event');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('tokenExpired', {
            detail: {
              message: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่',
              statusCode: 401
            }
          }));
        }
      } else {
        setUser(null);
        setError('Failed to refresh user data');
      }
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
