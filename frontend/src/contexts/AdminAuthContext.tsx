"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { logger } from '@/lib/logger';

interface AdminUser {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  organizationId?: string;
}

interface AdminAuthContextType {
  user: AdminUser | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  isAuthenticated: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

interface AdminAuthProviderProps {
  children: ReactNode;
}

export function AdminAuthProvider({ children }: AdminAuthProviderProps) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user;

  const clearError = () => setError(null);

  const login = async (username: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (result.statusCode === 200 && result.data) {
        // Store access token
        if (result.data.accessToken) {
          localStorage.setItem('access_token', result.data.accessToken);
          document.cookie = `access_token=${result.data.accessToken}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
        }
        
        // Set user from response
        setUser({
          id: result.data.user?.id || 'admin-user',
          email: result.data.user?.email || 'admin@hospital.com',
          role: result.data.user?.role || 'admin',
          permissions: ['admin'],
          organizationId: 'hospital',
        });
      } else {
        throw new Error(result.message || 'Login failed');
      }
    } catch (error: any) {
      setError(error.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
      });
    } catch (error) {
      logger.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('🔍 AdminAuthContext: Checking session...');
        
        // Check for access token in localStorage or cookies (same as normal user login)
        const localStorageToken = localStorage.getItem('access_token');
        const cookieToken = document.cookie
          .split('; ')
          .find(row => row.startsWith('access_token='))
          ?.split('=')[1];
        
        const token = localStorageToken || cookieToken;

        console.log('🔍 AdminAuthContext: localStorage access_token:', !!localStorageToken);
        console.log('🔍 AdminAuthContext: cookie access_token:', !!cookieToken);
        console.log('🔍 AdminAuthContext: final token:', !!token);
        console.log('🔍 AdminAuthContext: Token value:', token ? token.substring(0, 20) + '...' : 'null');
        console.log('🔍 AdminAuthContext: localStorage keys:', Object.keys(localStorage));
        console.log('🔍 AdminAuthContext: document.cookie:', document.cookie);

        if (token) {
          console.log('✅ AdminAuthContext: Setting admin user from access_token');
          // Decode JWT token to get user info
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log('🔍 AdminAuthContext: JWT payload:', payload);
            
            // Only set admin user if role is admin
            if (payload.role === 'admin') {
              setUser({
                id: payload.id || 'admin-user',
                email: payload.email || 'admin@hospital.com',
                role: payload.role || 'admin',
                permissions: ['admin'],
                organizationId: 'hospital',
              });
              console.log('✅ AdminAuthContext: Admin user set from JWT');
            } else {
              console.log('❌ AdminAuthContext: Token found but user is not admin, role:', payload.role);
            }
          } catch (error) {
            console.error('❌ AdminAuthContext: Error decoding JWT:', error);
          }
        } else {
          console.log('❌ AdminAuthContext: No access_token found');
        }
        
        // Always set loading to false after session check
        setIsLoading(false);
        console.log('🔍 AdminAuthContext: Session check completed, isLoading set to false');
      } catch (error) {
        logger.error('Session check error:', error);
        setIsLoading(false);
      }
    };

    // Start with loading true
    setIsLoading(true);
    
    // Add a longer delay to ensure localStorage is available
    setTimeout(checkSession, 500);
  }, []);

  const value: AdminAuthContextType = {
    user,
    isLoading,
    error,
    login,
    logout,
    clearError,
    isAuthenticated,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
