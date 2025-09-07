'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Activity, Database, Cpu, Shield, Settings, Info } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { formatAPIError } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'checking';
  message: string;
  timestamp: Date;
  backend: boolean;
  database: boolean;
  ai: boolean;
  consent: boolean;
}

export default function HealthCheck() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    status: 'checking',
    message: 'กำลังตรวจสอบสถานะระบบ...',
    timestamp: new Date(),
    backend: false,
    database: false,
    ai: false,
    consent: false,
  });

  const checkHealth = async () => {
    try {
      setHealthStatus(prev => ({ ...prev, status: 'checking', message: 'กำลังตรวจสอบสถานะระบบ...' }));
      
      // Try to call a simple API endpoint
      const response = await fetch(`http://localhost:3001/health`);
      
      if (response.ok) {
        const data = await response.json();
        logger.debug('Backend health response:', data); // Debug log
        
        // Handle new standardized response format
        const healthData = data.data || data;
        
        setHealthStatus({
          status: healthData.status === 'ok' ? 'healthy' : 'unhealthy',
          message: healthData.status === 'ok' ? 'ระบบทำงานปกติ' : 'ระบบมีปัญหา',
          timestamp: new Date(),
          backend: true,
          database: healthData.services?.database?.status === 'connected',
          ai: healthData.services?.ai?.status === 'available',
          consent: healthData.services?.consent?.status === 'active',
        });
      } else {
        setHealthStatus({
          status: 'unhealthy',
          message: `Backend error: ${response.status}`,
          timestamp: new Date(),
          backend: false,
          database: false,
          ai: false,
          consent: false,
        });
      }
    } catch (error) {
      setHealthStatus({
        status: 'unhealthy',
        message: formatAPIError(error),
        timestamp: new Date(),
        backend: false,
        database: false,
        ai: false,
        consent: false,
      });
    }
  };

  useEffect(() => {
    checkHealth();
    // Check every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (healthStatus.status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'unhealthy':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'checking':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (healthStatus.status) {
      case 'healthy':
        return '✅';
      case 'unhealthy':
        return '❌';
      case 'checking':
        return '🔄';
      default:
        return '❓';
    }
  };

  return (
    <div className="h-full bg-gray-50 p-4 md:p-6">
      <div className="h-full flex flex-col overflow-hidden">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-6">
          {/* Header Section */}
          <div className="mb-6 md:mb-8">
            <div className="flex items-center mb-4">
              <Link 
                href="/" 
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 hover:text-gray-900 transition-colors mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                ย้อนกลับ
              </Link>
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">สถานะระบบ</h1>
                <p className="text-sm md:text-base text-gray-600">ตรวจสอบการเชื่อมต่อและสถานะการทำงานของระบบ</p>
              </div>
              <button
                onClick={checkHealth}
                disabled={healthStatus.status === 'checking'}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${healthStatus.status === 'checking' ? 'animate-spin' : ''}`} />
                {healthStatus.status === 'checking' ? 'กำลังตรวจสอบ...' : 'ตรวจสอบใหม่'}
              </button>
            </div>
          </div>

          {/* Overall Status */}
          <div className={`rounded-xl border-2 p-6 mb-6 md:mb-8 ${getStatusColor()}`}>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white bg-opacity-50 flex items-center justify-center">
                <span className="text-3xl">{getStatusIcon()}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl md:text-2xl font-bold mb-2">สถานะโดยรวม</h3>
                <p className="text-base md:text-lg opacity-90 mb-2">{healthStatus.message}</p>
                <p className="text-sm opacity-70">
                  อัปเดตล่าสุด: {healthStatus.timestamp.toLocaleString('th-TH')}
                </p>
              </div>
            </div>
          </div>
          {/* Services Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Frontend */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">✅</span>
              <div>
                <h4 className="font-semibold text-green-800">Frontend</h4>
                <p className="text-sm text-green-600">เชื่อมต่อได้</p>
              </div>
            </div>
          </div>

          {/* Backend */}
          <div className={`rounded-lg border p-4 ${
            healthStatus.backend 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-xl">{healthStatus.backend ? '✅' : '❌'}</span>
              <div>
                <h4 className={`font-semibold ${
                  healthStatus.backend ? 'text-green-800' : 'text-red-800'
                }`}>
                  Backend API
                </h4>
                <p className={`text-sm ${
                  healthStatus.backend ? 'text-green-600' : 'text-red-600'
                }`}>
                  {healthStatus.backend ? 'เชื่อมต่อได้' : 'ไม่สามารถเชื่อมต่อได้'}
                </p>
              </div>
            </div>
          </div>

          {/* Database */}
          <div className={`rounded-lg border p-4 ${
            healthStatus.database 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-xl">{healthStatus.database ? '✅' : '❌'}</span>
              <div>
                <h4 className={`font-semibold ${
                  healthStatus.database ? 'text-green-800' : 'text-red-800'
                }`}>
                  Database
                </h4>
                <p className={`text-sm ${
                  healthStatus.database ? 'text-green-600' : 'text-red-600'
                }`}>
                  {healthStatus.database ? 'เชื่อมต่อได้' : 'ไม่สามารถเชื่อมต่อได้'}
                </p>
              </div>
            </div>
          </div>

          {/* AI Service */}
          <div className={`rounded-lg border p-4 ${
            healthStatus.ai 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-xl">{healthStatus.ai ? '🤖' : '❌'}</span>
              <div>
                <h4 className={`font-semibold ${
                  healthStatus.ai ? 'text-green-800' : 'text-red-800'
                }`}>
                  AI Risk Assessment
                </h4>
                <p className={`text-sm ${
                  healthStatus.ai ? 'text-green-600' : 'text-red-600'
                }`}>
                  {healthStatus.ai ? 'พร้อมใช้งาน' : 'ไม่พร้อมใช้งาน'}
                </p>
              </div>
            </div>
          </div>

          {/* Consent Engine */}
          <div className={`rounded-lg border p-4 ${
            healthStatus.consent 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-xl">{healthStatus.consent ? '📝' : '❌'}</span>
              <div>
                <h4 className={`font-semibold ${
                  healthStatus.consent ? 'text-green-800' : 'text-red-800'
                }`}>
                  Consent Engine
                </h4>
                <p className={`text-sm ${
                  healthStatus.consent ? 'text-green-600' : 'text-red-600'
                }`}>
                  {healthStatus.consent ? 'ทำงานอยู่' : 'ไม่ทำงาน'}
                </p>
              </div>
            </div>
          </div>

          {/* API Configuration */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚙️</span>
              <div>
                <h4 className="font-semibold text-blue-800">API Configuration</h4>
                <p className="text-sm text-blue-600">
                  {process.env.NEXT_PUBLIC_API_URL || 'ไม่ได้กำหนด'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2">คำแนะนำ:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• ตรวจสอบให้แน่ใจว่า Backend Server รันอยู่บนพอร์ต 3001</li>
            <li>• ตรวจสอบให้แน่ใจว่า PostgreSQL Database เชื่อมต่อได้</li>
            <li>• ตรวจสอบการตั้งค่า CORS ใน Backend</li>
            <li>• ตรวจสอบการตั้งค่า Environment Variables</li>
          </ul>
        </div>
      </div>
    </div>
    </div>
  );
}
