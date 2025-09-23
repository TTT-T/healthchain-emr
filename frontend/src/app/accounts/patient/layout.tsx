"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { logger } from '@/lib/logger';

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    logger.('🏥 Patient Layout: Auth state check');
    logger.('  - isLoading:', isLoading);
    logger.('  - isAuthenticated:', isAuthenticated);
    logger.('  - user:', user);
    logger.('  - current path:', typeof window !== 'undefined' ? window.location.pathname : 'SSR');
    
    // Skip checks while still loading
    if (isLoading) {
      logger.('⏳ Still loading, waiting...');
      return;
    }
    
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      logger.("🔒 Patient layout: Not authenticated, redirecting to login");
      router.push("/login");
      return;
    }

    // Check if user role is correct for this layout
    if (user && user.role !== 'patient') {
      logger.("🚫 Patient layout: User role mismatch, redirecting to appropriate dashboard");
      // Redirect to appropriate dashboard based on role
      switch (user.role) {
        case 'admin':
          router.push('/admin');
          break;
        case 'doctor':
        case 'nurse':
        case 'pharmacist':
        case 'lab_tech':
          router.push('/emr');
          break;
        case 'external_user':
        case 'external_admin':
          router.push('/external-requesters');
          break;
        default:
          router.push('/');
          break;
      }
      return;
    }

    // Only redirect to profile setup if specifically needed
    if (user && user.role === 'patient' && !(user as any).profile_completed) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      // Only redirect to setup-profile if not already there
      if (currentPath !== '/setup-profile') {
        logger.("📝 Patient profile not completed, redirecting to setup-profile");
        router.push('/setup-profile');
        return;
      }
    }

    // Allow access to setup-profile even if profile is completed
    // This allows users to update their profile information
    if (user && user.role === 'patient' && (user as any).profile_completed) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      if (currentPath === '/setup-profile') {
        logger.("📝 User accessing setup-profile for updates");
        return; // Allow access to setup-profile
      }
    }

    logger.("✅ Patient layout: Authentication check passed");
  }, [user, isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  if (user && user.role !== 'patient') {
    return null; // Will redirect
  }

  return <>{children}</>;
}
