"use client";
import { useState } from "react";
import MedicalSidebar from "@/components/MedicalSidebar";
import { SidebarProvider } from "@/components/SidebarContext";

export default function NurseLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <SidebarProvider value={{ toggleSidebar }}>
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <MedicalSidebar 
          userType="nurse" 
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
        />
        <main className="flex-1 flex flex-col md:ml-64 transition-all duration-300">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
