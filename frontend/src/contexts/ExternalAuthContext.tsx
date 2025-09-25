"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { logger } from '@/lib/logger';

interface ExternalUser {
  id: string;
  email: string;
  organizationName: string;
  organizationType: string;
  status: string;
  dataAccessLevel: string;
}

interface ExternalAuthContextType {
  user: ExternalUser | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  isAuthenticated: boolean;
}

const ExternalAuthContext = createContext<ExternalAuthContextType | undefined>(undefined);

interface ExternalAuthProviderProps {
  children: ReactNode;
}

export function ExternalAuthProvider({ children }: ExternalAuthProviderProps) {
  const [user, setUser] = useState<ExternalUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user;

  const clearError = () => setError(null);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/external-requesters/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (result.statusCode === 200) {
        setUser(result.user);
      } else {
        throw new Error(result.message || 'Login failed');
      }
    } catch (error: any) {
      setError((error as any).message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/external-requesters/logout', {
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
        // In a real app, you would verify the token with the backend
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('external-requester-token='))
          ?.split('=')[1];

        if (token) {
          // Decode token to get user info (in production, verify with backend)
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUser({
            id: payload.userId,
            email: payload.email,
            organizationName: payload.organizationName || 'Unknown Organization',
            organizationType: payload.organizationType || 'unknown',
            status: payload.status || 'active',
            dataAccessLevel: payload.dataAccessLevel || 'standard',
          });
        }
      } catch (error) {
        logger.error('Session check error:', error);
      }
    };

    checkSession();
  }, []);

  const value: ExternalAuthContextType = {
    user,
    isLoading,
    error,
    login,
    logout,
    clearError,
    isAuthenticated,
  };

  return (
    <ExternalAuthContext.Provider value={value}>
      {children}
    </ExternalAuthContext.Provider>
  );
}

export function useExternalAuth() {
  const context = useContext(ExternalAuthContext);
  if (context === undefined) {
    throw new Error('useExternalAuth must be used within an ExternalAuthProvider');
  }
  return context;
}
