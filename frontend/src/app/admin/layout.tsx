'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import "../globals.css";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if current page is login or register
  const isAuthPage = pathname?.includes('/login') || pathname?.includes('/register') || pathname?.includes('/forgot-password');

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

  // For auth pages (login, register, forgot-password), render without layout
  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <AdminAuthProvider>
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
    </AdminAuthProvider>
  );
}
