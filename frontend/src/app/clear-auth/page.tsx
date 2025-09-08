"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

export default function ClearAuth() {
  const router = useRouter();

  useEffect(() => {
    const clearAuth = () => {
      try {
        // Clear all authentication data
        apiClient.clearTokens();
        
        // Clear localStorage
        localStorage.clear();
        
        // Clear sessionStorage
        sessionStorage.clear();
        
        // Clear cookies
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        
        console.log('✅ All authentication data cleared');
        
        // Redirect to login page
        setTimeout(() => {
          router.push('/login');
        }, 1000);
        
      } catch (error) {
        console.error('Error clearing auth:', error);
        // Still redirect to login
        router.push('/login');
      }
    };

    clearAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          กำลังล้างข้อมูลการเข้าสู่ระบบ...
        </h2>
        <p className="text-gray-600">
          กรุณารอสักครู่ ระบบจะนำคุณไปยังหน้าล็อกอิน
        </p>
      </div>
    </div>
  );
}