'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import { AdminAuthProvider, useAdminAuth } from "@/contexts/AdminAuthContext";
import "../globals.css";

interface AdminLayoutProps {
  children: React.ReactNode;
}

function AdminLayoutContent({ children }: AdminLayoutProps) {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Check if current page is login or register
  const isAuthPage = pathname?.includes('/login') || pathname?.includes('/register') || pathname?.includes('/forgot-password');

  // Redirect to login if not authenticated and not on auth page
  useEffect(() => {
    // Add delay to allow AdminAuthContext to complete its session check
    const timeoutId = setTimeout(() => {
      if (!isLoading && !isAuthenticated && !isAuthPage) {
        console.log('🔍 Admin not authenticated, redirecting to login');
        console.log('🔍 isAuthenticated:', isAuthenticated);
        console.log('🔍 isLoading:', isLoading);
        console.log('🔍 isAuthPage:', isAuthPage);
        console.log('🔍 pathname:', pathname);
        
        router.push('/admin/login');
      }
    }, 1000); // Wait 1 second for AdminAuthContext to complete

    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, isLoading, isAuthPage, router, pathname]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  // For auth pages (login, register, forgot-password), render without layout
  if (isAuthPage) {
    return <>{children}</>;
  }

  // If not authenticated, don't render anything (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return <AdminLayoutInner>{children}</AdminLayoutInner>;
}

function AdminLayoutInner({ children }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Detect mobile/desktop
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const openMobileMenu = () => {
    setMobileMenuOpen(true);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <AdminSidebar
          isCollapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
          isMobile={false}
        />
      )}

      {/* Mobile Sidebar */}
      {isMobile && (
        <AdminSidebar
          isMobile={true}
          isOpen={mobileMenuOpen}
          onClose={closeMobileMenu}
        />
      )}

      <main className={`flex-1 flex flex-col transition-all duration-300 ${
        !isMobile
          ? (sidebarCollapsed ? 'lg:ml-12' : 'lg:ml-56')
          : 'ml-0'
      }`}>
        {/* Header */}
        <AdminHeader
          title="Admin Dashboard"
          subtitle="ระบบจัดการสำหรับผู้ดูแลระบบ"
          onToggleSidebar={isMobile ? openMobileMenu : undefined}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-auto h-full">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminAuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminAuthProvider>
  );
}
