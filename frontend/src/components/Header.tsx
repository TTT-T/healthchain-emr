"use client";
import Link from "next/link";

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  backHref?: string;
  onMenuClick?: () => void;
}

export default function Header({ title, showBackButton = false, backHref = "/", onMenuClick }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-slate-200 w-full sticky top-0 z-40">
      <div className="px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 relative">
          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 w-0 flex-1 min-w-0">
            {/* Mobile Menu Button */}
            {onMenuClick && (
              <button
                onClick={onMenuClick}
                className="lg:hidden p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all duration-200 ease-out"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            
            {/* Back button */}
            {showBackButton && (
              <Link
                href={backHref}
                className="text-slate-600 hover:text-slate-800 text-sm font-medium transition-all duration-150 ease-out flex items-center space-x-1 sm:space-x-2 px-2 py-1.5 rounded-lg hover:bg-slate-100"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">กลับ</span>
              </Link>
            )}
            <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-slate-800 truncate">{title}</h1>
          </div>
          
          {/* Right side content */}
          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
            {/* Notification bell */}
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-150 ease-out">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5-5v-5a5 5 0 00-10 0v5l-5 5h5m5 0v1a3 3 0 01-6 0v-1m6 0H9" />
              </svg>
            </button>
            {/* User menu */}
            <div className="flex items-center space-x-2 px-2 py-1.5 bg-slate-50 rounded-lg">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-slate-300 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-slate-600 font-medium text-xs">คน</span>
              </div>
              <div className="hidden sm:block min-w-0">
                <span className="text-sm font-medium text-slate-700 block truncate">คุณสมชาย</span>
                <p className="text-xs text-slate-500 truncate">ผู้ป่วย</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
