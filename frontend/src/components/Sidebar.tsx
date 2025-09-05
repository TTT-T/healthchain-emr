"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarProps {
  userType?: "patient" | "doctor" | "admin";
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ userType = "patient", isOpen: isOpenProp = false, onClose }: SidebarProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isOpen, setIsOpen] = useState(isOpenProp);
  const { logout } = useAuth();

  useEffect(() => {
    setIsOpen(isOpenProp);
  }, [isOpenProp]);

  // Toggle sidebar open/close for mobile
  const toggleSidebar = () => {
    setIsOpen((prev) => !prev);
    if (!isOpen && onClose) {
      onClose();
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Handle smooth opening/closing
  const handleLinkClick = () => {
    if (onClose && window.innerWidth < 1024) {
      onClose();
    }
  };

  const menuItems = {
    patient: [
      { href: "/accounts/patient/dashboard", label: "แดชบอร์ด", icon: "🏠" },
      { href: "/accounts/patient/ai-insights", label: "AI Health Insights", icon: "🤖" },
      { href: "/accounts/patient/records", label: "บันทึกสุขภาพ", icon: "📋" },
      { href: "/accounts/patient/profile", label: "ข้อมูลส่วนตัว", icon: "👤" },
    ],
    doctor: [
      { href: "/accounts/doctor/dashboard", label: "แดชบอร์ด", icon: "🏥" },
      { href: "/accounts/doctor/patients", label: "ผู้ป่วย", icon: "👥" },
      { href: "/accounts/doctor/appointments", label: "การนัดหมาย", icon: "📅" },
    ],
    admin: [
      { href: "/accounts/admin/dashboard", label: "แดชบอร์ด", icon: "⚙️" },
      { href: "/accounts/admin/users", label: "ผู้ใช้งาน", icon: "👥" },
      { href: "/accounts/admin/reports", label: "รายงาน", icon: "📊" },
    ]
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 xl:w-72 bg-white/95 backdrop-blur-md border-r border-slate-200/50 z-30 shadow-lg">
        <div className="flex flex-col w-full">
          {/* Logo */}
          <div className="px-4 xl:px-6 py-4 border-b border-slate-200">
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 xl:w-10 xl:h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm xl:text-base">H</span>
              </div>
              <span className="text-lg font-bold text-slate-800">HealthChain</span>
            </Link>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-3 py-4">
            <div className="space-y-1">
              {menuItems[userType].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-3 px-3 py-2.5 text-slate-700 hover:bg-white hover:text-blue-600 rounded-lg transition-all duration-150 ease-out group text-sm"
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>

          {/* User Section */}
          <div className="px-3 py-3 border-t border-slate-200">
            <div className="mt-2">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center space-x-2 px-2.5 py-2 text-slate-600 hover:text-red-600 text-xs transition-all duration-150 ease-out rounded-lg hover:bg-red-50"
              >
                <span>🚪</span>
                <span>ออกจากระบบ</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-1 left-3 z-50 p-3 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-slate-200/50 hover:bg-white hover:shadow-xl transition-all duration-150 ease-out transform-gpu"
        aria-label="เปิดเมนู"
        disabled={isAnimating}
      >
        <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile Sidebar */}
      {isOpen && (
        <div className="fixed left-0 top-0 bottom-0 w-64 bg-white/95 backdrop-blur-md border-r border-slate-200/50 z-50 transform transform-gpu transition-all duration-150 ease-out md:hidden h-full max-h-screen overflow-y-auto shadow-2xl">
            <div className="flex flex-col h-full">
              {/* Logo */}
              <div className="px-4 py-4 border-b border-slate-200">
                <Link href="/" className="flex items-center space-x-2">
                  <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">H</span>
                  </div>
                  <span className="text-lg font-bold text-slate-800">HealthChain</span>
                </Link>
              </div>
              
              {/* Navigation */}
              <nav className="flex-1 px-3 py-4">
                <div className="space-y-1">
                  {menuItems[userType].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        if (onClose) onClose();
                        setIsAnimating(true);
                        setTimeout(() => setIsAnimating(false), 150);
                      }}
                      className="flex items-center space-x-3 px-3 py-2.5 text-slate-700 hover:bg-white hover:text-blue-600 rounded-lg transition-all duration-150 ease-out text-sm"
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </nav>

              {/* User Section */}
              <div className="px-3 py-3 border-t border-slate-200">
                <div className="mt-2">
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-2.5 py-2 text-slate-600 hover:text-red-600 text-xs transition-all duration-150 ease-out rounded-lg hover:bg-red-50"
                  >
                    <span>🚪</span>
                    <span>ออกจากระบบ</span>
                  </button>
                </div>
              </div>          
            </div>
        </div>
      )}
    </>
  );
}
