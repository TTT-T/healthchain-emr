"use client";

import { useEffect, useState } from 'react';

export default function AdminDashboardSimple() {
  const [token, setToken] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Check for access token
    const accessToken = localStorage.getItem('access_token');
    setToken(accessToken);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-2xl">
        <h1 className="text-3xl font-bold text-blue-600 mb-4">
          ✅ Admin Dashboard Simple
        </h1>
        <p className="text-gray-600 mb-4">
          หน้านี้ทำงานได้ปกติ! (ไม่ใช้ admin layout authentication)
        </p>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
          <h3 className="font-semibold mb-2"> Information:</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>URL:</strong> {isClient ? window.location.href : 'Loading...'}</p>
            <p><strong>Timestamp:</strong> {isClient ? new Date().toLocaleString() : 'Loading...'}</p>
            <p><strong>Access Token:</strong> {token ? '✅ Found' : '❌ Not found'}</p>
            <p><strong>Token Preview:</strong> {token ? token.substring(0, 30) + '...' : 'N/A'}</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <a 
            href="/admin" 
            className="block bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 transition-colors"
          >
            ไปยัง Dashboard หลัก (Admin Layout)
          </a>
          
          <a 
            href="/-dashboard" 
            className="block bg-green-500 text-white px-6 py-3 rounded hover:bg-green-600 transition-colors"
          >
            กลับไป  Dashboard
          </a>
          
          <button 
            onClick={() => {
            }}
            className="block w-full bg-gray-500 text-white px-6 py-3 rounded hover:bg-gray-600 transition-colors"
          >
             LocalStorage (Check Console)
          </button>
          
          <a 
            href="/admin/login" 
            className="block bg-red-500 text-white px-6 py-3 rounded hover:bg-red-600 transition-colors"
          >
            กลับไปหน้า Login
          </a>
        </div>
      </div>
    </div>
  );
}
