"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '@/lib/api';

export default function VerifyEmailTokenPage() {
  const router = useRouter();
  const params = useParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = params.token as string;
      
      if (!token) {
        setError('ไม่พบ token การยืนยัน');
        setIsVerifying(false);
        return;
      }

      try {
        const response = await apiClient.verifyEmail(token);
        
        if (response.data && !response.error) {
          setMessage('ยืนยันอีเมลเรียบร้อยแล้ว! ตอนนี้คุณสามารถเข้าสู่ระบบได้');
          setIsSuccess(true);
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/login?message=email_verified');
          }, 3000);
        } else {
          setError(response.error?.message || 'เกิดข้อผิดพลาดในการยืนยันอีเมล');
        }
      } catch (error: any) {
        console.error('Email verification error:', error);
        setError('เกิดข้อผิดพลาดในการยืนยันอีเมล กรุณาลองใหม่อีกครั้ง');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, [params.token, router]);

  const handleBackToLogin = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
            {isVerifying ? (
              <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : isSuccess ? (
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {isVerifying ? 'กำลังยืนยันอีเมล...' : isSuccess ? 'ยืนยันอีเมลเรียบร้อย' : 'ยืนยันอีเมลไม่สำเร็จ'}
          </h2>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            {/* Success Message */}
            {isSuccess && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">{message}</p>
                    <p className="mt-1 text-sm text-green-700">
                      กำลังนำคุณไปหน้าเข้าสู่ระบบ...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading Message */}
            {isVerifying && (
              <div className="text-center">
                <p className="text-sm text-gray-600">กำลังยืนยันอีเมลของคุณ...</p>
              </div>
            )}

            {/* Action Buttons */}
            {!isVerifying && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  กลับไปหน้าเข้าสู่ระบบ
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
