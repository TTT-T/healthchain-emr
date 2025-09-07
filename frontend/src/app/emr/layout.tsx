'use client';

import React, { useState, useEffect } from 'react';
import EMRSidebar from '../../components/EMRSidebar';
import EMRHeader from '../../components/EMRHeader';
// import { Menu } from 'lucide-react';

interface EMRLayoutProps {
  children: React.ReactNode;
}

export default function EMRLayout({ children }: EMRLayoutProps) {
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
        <EMRSidebar 
          isCollapsed={sidebarCollapsed} 
          onToggle={toggleSidebar}
          isMobile={false}
        />
      )}
      
      {/* Mobile Sidebar */}
      {isMobile && (
        <EMRSidebar 
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
        <EMRHeader 
          title="EMR System"
          subtitle="ระบบบันทึกข้อมูลทางการแพทย์"
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
