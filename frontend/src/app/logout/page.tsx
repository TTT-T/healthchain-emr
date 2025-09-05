"use client";

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function LogoutPage() {
  const { logout, isLoading } = useAuth();

  useEffect(() => {
    const performLogout = async () => {
      try {
        await logout();
      } catch (error) {
        console.error('Logout error:', error);
        // Even if logout fails, redirect to home
        window.location.href = '/';
      }
    };

    performLogout();
  }, [logout]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังออกจากระบบ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">กำลังออกจากระบบ...</p>
      </div>
    </div>
  );
}
