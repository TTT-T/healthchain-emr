"use client";
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

export interface TokenExpiryState {
  isExpired: boolean;
  showModal: boolean;
  lastError: string | null;
}

export function useTokenExpiry() {
  const [state, setState] = useState<TokenExpiryState>({
    isExpired: false,
    showModal: false,
    lastError: null
  });
  
  const router = useRouter();

  const handleTokenExpiry = useCallback((error?: string) => {
    console.log('🔒 Token expired, showing modal');
    setState({
      isExpired: true,
      showModal: true,
      lastError: error || 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่'
    });
  }, []);

  const handleLogin = useCallback(() => {
    console.log('🔑 User chose to login again');
    setState(prev => ({ ...prev, showModal: false }));
    router.push('/login');
  }, [router]);

  const handleLogout = useCallback(async () => {
    console.log('🚪 User chose to logout');
    try {
      // Clear all authentication data
      apiClient.clearTokens();
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      setState({
        isExpired: false,
        showModal: false,
        lastError: null
      });
      
      router.push('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      router.push('/login');
    }
  }, [router]);

  const clearExpiry = useCallback(() => {
    setState({
      isExpired: false,
      showModal: false,
      lastError: null
    });
  }, []);

  return {
    ...state,
    handleTokenExpiry,
    handleLogin,
    handleLogout,
    clearExpiry
  };
}
