'use client';

import { SidebarProvider } from "@/components/SidebarContextAdmin";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import "../globals.css";

export default function AdminLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
        <AdminSidebar />
        <div className="flex flex-col flex-1 w-full min-w-0 overflow-hidden">
          <AdminHeader 
            title="Admin Dashboard" 
            subtitle="ระบบจัดการสำหรับผู้ดูแลระบบ"
          />
          <main className="flex-1 w-full overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
