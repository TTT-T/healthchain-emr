"use client";

import { useEffect } from 'react';

export default function Redirect() {
  useEffect(() => {
    //  redirect after 3 seconds
    setTimeout(() => {
      window.location.href = '/admin';
    }, 3000);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2"> Redirect</h1>
        <p className="text-gray-600">กำลังทดสอบ redirect ไป /admin ใน 3 วินาที...</p>
        <p className="text-sm text-gray-500 mt-4">ตรวจสอบ console สำหรับ  logs</p>
      </div>
    </div>
  );
}
