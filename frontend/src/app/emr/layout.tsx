'use client';

import React, { useState, useEffect } from 'react';
import EMRSidebar from '../../components/EMRSidebar';
import { Menu } from 'lucide-react';

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
        {/* Mobile Header with Menu Button */}
        {isMobile && (
          <div className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-30">
            <button
              onClick={openMobileMenu}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="เปิดเมนู"
            >
              <Menu className="h-6 w-6 text-gray-600" />
            </button>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center mr-2">
                <span className="text-xs text-white font-bold">E</span>
              </div>
              <h1 className="text-lg font-bold text-gray-900">EMR</h1>
            </div>
          </div>
        )}
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
