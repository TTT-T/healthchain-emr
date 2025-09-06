"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ArrowLeft
} from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const emailParam = searchParams.get('email');
    
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError('ไม่พบ token สำหรับรีเซ็ตรหัสผ่าน');
    }
    
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [searchParams]);

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('รหัสผ่านต้องมีตัวอักษรใหญ่อย่างน้อย 1 ตัว');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('รหัสผ่านต้องมีตัวอักษรเล็กอย่างน้อย 1 ตัว');
    }
    
    if (!/\d/.test(password)) {
      errors.push('รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('รหัสผ่านต้องมีสัญลักษณ์พิเศษอย่างน้อย 1 ตัว');
    }
    
    return errors;
  };

  const handlePasswordChange = (password: string) => {
    setNewPassword(password);
    setPasswordErrors(validatePassword(password));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('ไม่พบ token สำหรับรีเซ็ตรหัสผ่าน');
      return;
    }

    if (!newPassword) {
      setError('กรุณากรอกรหัสผ่านใหม่');
      return;
    }

    if (passwordErrors.length > 0) {
      setError('รหัสผ่านไม่ตรงตามข้อกำหนด');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/auth/reset-password', {
        token,
        new_password: newPassword
      });

      if (response.data.success) {
        setIsSuccess(true);
        showSuccess('รีเซ็ตรหัสผ่านเรียบร้อยแล้ว');
      } else {
        setError(response.data.message || 'เกิดข้อผิดพลาด');
      }
    } catch (error: any) {
      console.error('Reset password error:', error);
      
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              รีเซ็ตรหัสผ่านเรียบร้อยแล้ว
            </CardTitle>
            <CardDescription className="text-gray-600">
              รหัสผ่านของคุณได้รับการอัปเดตเรียบร้อยแล้ว
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                ตอนนี้คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้แล้ว
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={() => router.push('/login')}
              className="w-full"
            >
              เข้าสู่ระบบ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            รีเซ็ตรหัสผ่าน
          </CardTitle>
          <CardDescription className="text-gray-600">
            {email ? `สำหรับอีเมล: ${email}` : 'กรอกรหัสผ่านใหม่ของคุณ'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">รหัสผ่านใหม่</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="กรอกรหัสผ่านใหม่"
                  value={newPassword}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  disabled={isLoading}
                  className="w-full pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {passwordErrors.length > 0 && (
                <div className="text-sm text-red-600 space-y-1">
                  {passwordErrors.map((error, index) => (
                    <div key={index} className="flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {error}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="ยืนยันรหัสผ่านใหม่"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {confirmPassword && newPassword !== confirmPassword && (
                <div className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  รหัสผ่านไม่ตรงกัน
                </div>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || passwordErrors.length > 0 || newPassword !== confirmPassword}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  กำลังรีเซ็ตรหัสผ่าน...
                </>
              ) : (
                'รีเซ็ตรหัสผ่าน'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              href="/login" 
              className="text-sm text-blue-600 hover:text-blue-500 flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              กลับไปหน้าเข้าสู่ระบบ
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
