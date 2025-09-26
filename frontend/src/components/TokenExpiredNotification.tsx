'use client';

import { useEffect, useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface TokenExpiredNotificationProps {
  onClose?: () => void;
}

export default function TokenExpiredNotification({ onClose }: TokenExpiredNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleTokenExpired = (event: CustomEvent) => {
      setMessage(event.detail?.message || 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
      setIsVisible(true);
    };

    const handleAccessDenied = (event: CustomEvent) => {
      setMessage(event.detail?.message || 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้');
      setIsVisible(true);
    };

    const handleRateLimited = (event: CustomEvent) => {
      setMessage(event.detail?.message || 'คำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่');
      setIsVisible(true);
    };

    const handleServerError = (event: CustomEvent) => {
      setMessage(event.detail?.message || 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง');
      setIsVisible(true);
    };

    // Add event listeners
    window.addEventListener('tokenExpired', handleTokenExpired as EventListener);
    window.addEventListener('accessDenied', handleAccessDenied as EventListener);
    window.addEventListener('rateLimited', handleRateLimited as EventListener);
    window.addEventListener('serverError', handleServerError as EventListener);

    return () => {
      window.removeEventListener('tokenExpired', handleTokenExpired as EventListener);
      window.removeEventListener('accessDenied', handleAccessDenied as EventListener);
      window.removeEventListener('rateLimited', handleRateLimited as EventListener);
      window.removeEventListener('serverError', handleServerError as EventListener);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">
              เกิดข้อผิดพลาด
            </h3>
            <p className="mt-1 text-sm text-red-700">
              {message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleClose}
              className="bg-red-50 rounded-md inline-flex text-red-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <span className="sr-only">ปิด</span>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
