'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import ExternalRequestersSidebar from '../../components/ExternalRequestersSidebar';
import ExternalRequestersHeader from '../../components/ExternalRequestersHeader';
import { ExternalAuthProvider } from '@/contexts/ExternalAuthContext';
// import { Menu } from 'lucide-react';

interface ExternalRequestersLayoutProps {
  children: React.ReactNode;
}

export default function ExternalRequestersLayout({ children }: ExternalRequestersLayoutProps) {
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
    <ExternalAuthProvider>
      <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Sidebar */}
        <ExternalRequestersSidebar
          isCollapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
          isMobile={isMobile}
          isOpen={mobileMenuOpen}
          onClose={closeMobileMenu}
        />

        <main className={`flex-1 flex flex-col transition-all duration-300 ${
          !isMobile
            ? (sidebarCollapsed ? 'lg:ml-12' : 'lg:ml-56')
            : ''
        }`}>
          {/* Header */}
          <ExternalRequestersHeader
            title="External Requesters"
            subtitle="ระบบจัดการคำขอข้อมูลสุขภาพ"
            onToggleSidebar={isMobile ? openMobileMenu : toggleSidebar}
          />

          {/* Main Content */}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </ExternalAuthProvider>
  );
}
