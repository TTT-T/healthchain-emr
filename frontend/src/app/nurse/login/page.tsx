"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function NurseLogin() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/nurse/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('เข้าสู่ระบบพยาบาลสำเร็จ');
        
        // Redirect to nurse dashboard
        window.location.href = '/emr/dashboard';
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-red-50 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-rose-600 rounded-3xl flex items-center justify-center shadow-xl">
              <Heart className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Nurse Portal</h1>
          <p className="text-gray-600 text-lg">ระบบ EMR สำหรับพยาบาล</p>
        </div>

        {/* Login Form */}
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm rounded-3xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-semibold text-gray-900 flex items-center justify-center gap-2">
              <Heart className="h-6 w-6 text-pink-600" />เข้าสู่ระบบพยาบาล
            </CardTitle>
            <CardDescription className="text-gray-600">เข้าถึงระบบบันทึกสุขภาพอิเล็กทรอนิกส์</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">อีเมล</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="อีเมลของคุณ"
                    className="focus:ring-pink-500 focus:border-pink-500"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="password">รหัสผ่าน</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="รหัสผ่านของคุณ"
                    className="focus:ring-pink-500 focus:border-pink-500"
                    required
                  />
                </div>
              </div>
              
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 focus:ring-pink-200 text-white font-semibold py-3 px-6 rounded-xl transition-all"
              >
                {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              </Button>
            </form>
            
            <div className="text-center space-y-4">
              <div className="text-sm">
                <Link href="/forgot-password" className="font-medium text-pink-600 hover:text-pink-800 transition-colors">
                  ลืมรหัสผ่าน?
                </Link>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-600">ยังไม่มีบัญชี?{' '}
                  <Link href="/medical-staff/register" className="font-medium text-pink-600 hover:text-pink-500 transition-colors">
                    สมัครสมาชิกพยาบาล
                  </Link>
                </p>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-600">ไม่ใช่พยาบาล?{' '}
                  <Link href="/login" className="font-medium text-pink-600 hover:text-pink-500 transition-colors">
                    เข้าสู่ระบบผู้ป่วย
                  </Link>
                </p>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <Link href="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  กลับสู่หน้าหลัก
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
