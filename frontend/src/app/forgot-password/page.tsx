"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { showSuccess, showError } from '@/lib/alerts';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { logger } from '@/lib/logger';
import { 
  Mail, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Shield,
  Clock,
  RefreshCw
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('กรุณากรอกอีเมล');
      return;
    }

    if (!email.includes('@')) {
      setError('กรุณากรอกอีเมลที่ถูกต้อง');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/auth/forgot-password', {
        email: email.trim()
      });

      // Check for successful response - improved logic
      if (response && (response.statusCode === 200 || response.data)) {
        setIsEmailSent(true);
        setError('');
        showSuccess('ส่งลิงก์รีเซ็ตรหัสผ่านเรียบร้อยแล้ว กรุณาตรวจสอบอีเมลของคุณ');
      } else {
        const errorMessage = response?.error?.message || 'เกิดข้อผิดพลาดในการส่งอีเมล';
        setError(errorMessage);
        showError(errorMessage, 'เกิดข้อผิดพลาด');
      }
    } catch (error: any) {
      logger.error('Forgot password error:', error);
      
      // More robust error handling
      let errorMessage = 'เกิดข้อผิดพลาดในการส่งอีเมล กรุณาลองใหม่อีกครั้ง';
      
      if ((error as any).response?.data?.error?.message) {
        errorMessage = (error as any).response.data.error.message;
      } else if ((error as any).response?.data?.message) {
        errorMessage = (error as any).response.data.message;
      } else if ((error as any).message) {
        errorMessage = (error as any).message;
      }
      
      setError(errorMessage);
      showError(errorMessage, 'เกิดข้อผิดพลาด');
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-xl animate-pulse">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ส่งอีเมลเรียบร้อยแล้ว! 🎉
            </h1>
            <p className="text-gray-600 text-lg">
              เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว
            </p>
          </div>

          {/* Main Card */}
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="space-y-6">
                {/* Success Alert */}
                <Alert className="border-green-300 bg-green-50 rounded-xl">
                  <Mail className="h-5 w-5 text-green-600" />
                  <AlertDescription className="text-green-700 font-medium">
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">📧</span>
                        <span>กรุณาตรวจสอบกล่องจดหมายของคุณ</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-lg mr-2">🔗</span>
                        <span>คลิกลิงก์ที่ส่งมาเพื่อรีเซ็ตรหัสผ่าน</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-lg mr-2">📁</span>
                        <span>หากไม่พบอีเมล กรุณาตรวจสอบในโฟลเดอร์ Spam</span>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
                
                {/* Timer Alert */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-blue-800 font-semibold">ลิงก์จะหมดอายุใน 1 ชั่วโมง</p>
                      <p className="text-blue-600 text-sm">กรุณาใช้ลิงก์โดยเร็วเพื่อความปลอดภัย</p>
                    </div>
                  </div>
                </div>

                {/* Security Info */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mr-3">
                      <Shield className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-amber-800 font-semibold">ความปลอดภัย</p>
                      <p className="text-amber-600 text-sm">ลิงก์นี้ใช้ได้เพียงครั้งเดียวและจะหมดอายุอัตโนมัติ</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button 
                    onClick={() => {
                      setIsEmailSent(false);
                      setEmail('');
                    }}
                    className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    ส่งอีเมลใหม่
                  </Button>
                  
                  <Button 
                    onClick={() => router.push('/login')}
                    variant="outline"
                    className="w-full h-12 text-lg font-semibold border-2 border-gray-300 hover:border-gray-400 rounded-xl transition-all duration-200"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    กลับไปหน้าเข้าสู่ระบบ
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">
              © 2024 HealthChain. ระบบบันทึกสุขภาพอิเล็กทรอนิกส์
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-xl">
              <Mail className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ลืมรหัสผ่าน
          </h1>
          <p className="text-gray-600 text-lg">
            ไม่ต้องกังวล เราจะช่วยคุณรีเซ็ตรหัสผ่าน
          </p>
        </div>

        {/* Main Card */}
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                  อีเมลของคุณ
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="กรอกอีเมลของคุณ"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full h-12 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  required
                />
              </div>

              {error && (
                <Alert className="border-red-300 bg-red-50 rounded-xl">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <AlertDescription className="text-red-700 font-medium">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    กำลังส่งอีเมล...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5 mr-2" />
                    ส่งลิงก์รีเซ็ตรหัสผ่าน
                  </>
                )}
              </Button>
            </form>

            {/* Help Section */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-blue-600 text-sm font-bold">💡</span>
                </div>
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">คำแนะนำ:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• ใช้อีเมลที่ใช้สมัครสมาชิก</li>
                    <li>• ตรวจสอบกล่องจดหมายและโฟลเดอร์ Spam</li>
                    <li>• ลิงก์จะหมดอายุใน 1 ชั่วโมง</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link 
                href="/login" 
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                กลับไปหน้าเข้าสู่ระบบ
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            © 2024 HealthChain. ระบบบันทึกสุขภาพอิเล็กทรอนิกส์
          </p>
        </div>
      </div>
    </div>
  );
}
