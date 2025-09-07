"use client";
import React, { useState } from "react";
import Header from "./Header";
import ResponsiveSidebar from "./ResponsiveSidebar";

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  userType?: "patient" | "doctor" | "admin";
  showBackButton?: boolean;
  backHref?: string;
}

const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  title, 
  userType = "patient", 
  showBackButton = false, 
  backHref = "/" 
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden bg-black/50 transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}
      
      <ResponsiveSidebar 
        userType={userType} 
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />
      
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64 xl:ml-72">
        <Header 
          title={title} 
          showBackButton={showBackButton} 
          backHref={backHref}
          onMenuClick={toggleSidebar}
        />
        <main className="flex-1 w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
