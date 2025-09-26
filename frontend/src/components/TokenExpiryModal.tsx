"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, LogIn, LogOut } from 'lucide-react';

interface TokenExpiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  onLogout: () => void;
}

export default function TokenExpiryModal({ 
  isOpen, 
  onClose, 
  onLogin, 
  onLogout 
}: TokenExpiryModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await onLogin();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await onLogout();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-4 rounded-t-lg">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-2 rounded-full mr-3">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">
                เซสชันหมดอายุ
              </h3>
              <p className="text-sm text-yellow-700">
                การเข้าสู่ระบบของคุณหมดอายุแล้ว
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <div className="text-gray-700 mb-6">
            <p className="mb-2">
              เซสชันการเข้าสู่ระบบของคุณหมดอายุแล้ว เพื่อความปลอดภัย กรุณาเลือกทำอย่างใดอย่างหนึ่ง:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>เข้าสู่ระบบใหม่เพื่อใช้งานต่อ</li>
              <li>ออกจากระบบและกลับไปหน้าแรก</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all ${
                isLoading
                  ? 'bg-blue-300 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  กำลังดำเนินการ...
                </div>
              ) : (
                <div className="flex items-center">
                  <LogIn className="h-4 w-4 mr-2" />
                  เข้าสู่ระบบใหม่
                </div>
              )}
            </button>

            <button
              onClick={handleLogout}
              disabled={isLoading}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all ${
                isLoading
                  ? 'bg-gray-300 text-white cursor-not-allowed'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center">
                <LogOut className="h-4 w-4 mr-2" />
                ออกจากระบบ
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 rounded-b-lg">
          <p className="text-xs text-gray-500 text-center">
            ระบบจะไม่บันทึกข้อมูลที่ยังไม่ได้บันทึก กรุณาบันทึกงานของคุณก่อนออกจากระบบ
          </p>
        </div>
      </div>
    </div>
  );
}
