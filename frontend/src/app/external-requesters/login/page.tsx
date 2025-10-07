'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  AlertCircle,
  CheckCircle,
  Building2,
  Shield,
  ExternalLink
} from 'lucide-react';

export default function ExternalRequesterLoginPage() {
  const { user, isAuthenticated, login, isLoading } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (['external_requester', 'external_admin'].includes(user.role)) {
        router.push('/external-requesters/dashboard');
      } else {
        router.push('/');
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await login(formData.email, formData.password);
      
      if (response.success) {
        setSuccess(true);
        
        // Redirect to dashboard after 1 second
        setTimeout(() => {
          router.push('/external-requesters/dashboard');
        }, 1000);
      } else {
        setError(response.message || 'เข้าสู่ระบบไม่สำเร็จ');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">H</span>
          </div>
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับไปหน้าแรก
          </Link>
          
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900">
            เข้าสู่ระบบ
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            สำหรับผู้ขอเข้าถึงข้อมูลจากภายนอก
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
          {success ? (
            <div className="text-center">
              <div className="text-green-600 mb-4">
                <CheckCircle className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">เข้าสู่ระบบสำเร็จ!</h3>
              <p className="text-gray-600 mb-4">
                กำลังเปลี่ยนเส้นทางไปยังแดชบอร์ด...
              </p>
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  อีเมล
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="กรอกอีเมลของคุณ"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  รหัสผ่าน
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="กรอกรหัสผ่านของคุณ"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      กำลังเข้าสู่ระบบ...
                    </>
                  ) : (
                    <>
                      <Shield className="h-5 w-5 mr-2" />
                      เข้าสู่ระบบ
                    </>
                  )}
                </button>
              </div>

              {/* Additional Links */}
              <div className="text-center space-y-3">
                <Link
                  href="/external-requesters/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
                >
                  ลืมรหัสผ่าน?
                </Link>
                
                <div className="text-sm text-gray-600">
                  ยังไม่มีบัญชี?{' '}
                  <Link
                    href="/external-requesters/register"
                    className="text-blue-600 hover:text-blue-500 font-medium transition-colors"
                  >
                    ลงทะเบียนที่นี่
                  </Link>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center mb-2">
              <Shield className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="font-medium text-gray-900">ปลอดภัย</h3>
            </div>
            <p className="text-sm text-gray-600">
              ข้อมูลของคุณได้รับการปกป้องด้วยมาตรฐานความปลอดภัยระดับสูง
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center mb-2">
              <ExternalLink className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="font-medium text-gray-900">เข้าถึงง่าย</h3>
            </div>
            <p className="text-sm text-gray-600">
              เข้าถึงระบบได้ทุกที่ทุกเวลาผ่านเว็บเบราว์เซอร์
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            หากมีปัญหาในการเข้าสู่ระบบ กรุณาติดต่อทีมสนับสนุน
          </p>
        </div>
      </div>
    </div>
  );
}