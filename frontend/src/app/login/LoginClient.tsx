"use client";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { showError, showSuccess, showWarning, showFeatureComingSoon } from "@/lib/alerts";
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/api';

function LoginClientContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Local state management (like admin/external login)
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    username: "", // Clear pre-filled values
    password: "", // Clear pre-filled values
    rememberMe: false
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');

  // Clear form data when component mounts to prevent cached values
  useEffect(() => {
    // Clear any previously filled form data
    setFormData({
      username: "",
      password: "",
      rememberMe: false
    });
    
    
  }, []);

  // Clear auth error when component mounts - don't redirect here
  useEffect(() => {
    setError(null); // Use local state instead of clearError
  }, []);

  // Handle success/error messages from URL parameters
  useEffect(() => {
    if (searchParams) {
      const message = searchParams.get('message');
      const verified = searchParams.get('verified');
      
      if (message) {
        setSuccessMessage(decodeURIComponent(message));
      }
      if (verified === 'true') {
        setSuccessMessage('Email verified successfully! You can now login.');
      }
    }
  }, [searchParams]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Clear resend message after 5 seconds
  useEffect(() => {
    if (resendMessage) {
      const timer = setTimeout(() => {
        setResendMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [resendMessage]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.username?.trim()) {
      newErrors.username = "Username is required";
    }
    
    if (!formData.password?.trim()) {
      newErrors.password = "Password is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Clear previous errors
    setErrors({});
    setSuccessMessage(null);
    setIsLoading(true);
    setError(null);

    try {
      // Use fetch API like admin/external login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username.trim(),
          password: formData.password,
          rememberMe: formData.rememberMe
        })
      });

      const result = await response.json();
      
      // Debug logging
      console.log('🔍 Login response:', result);
      console.log('🔍 Response status:', response.status);
      console.log('🔍 Result success:', result.success);
      console.log('🔍 Result statusCode:', result.statusCode);
      console.log('🔍 Result data:', result.data);

      if ((result.success === true || result.statusCode === 200) && result.data) {
        // Login successful
        
        // Store tokens in both localStorage and cookies for compatibility
        if (result.data.accessToken) {
          localStorage.setItem('access_token', result.data.accessToken);
          // Also set cookie for middleware compatibility
          document.cookie = `access_token=${result.data.accessToken}; path=/; max-age=${60 * 60}; SameSite=Lax`;
        }
        if (result.data.refreshToken) {
          localStorage.setItem('refresh_token', result.data.refreshToken);
          // Also set cookie for middleware compatibility
          document.cookie = `refresh_token=${result.data.refreshToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        }
        
        // Store remember me preference
        if (formData.rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberMe');
        }
        
        // Show success notification
        showSuccess('เข้าสู่ระบบสำเร็จ', 'ยินดีต้อนรับสู่ระบบบันทึกสุขภาพอิเล็กทรอนิกส์');
        
        // Update AuthContext with user data
        if (typeof window !== 'undefined') {
          // Dispatch custom event to update AuthContext
          window.dispatchEvent(new CustomEvent('userLoggedIn', {
            detail: { user: result.data.user }
          }));
        }
        
        // Redirect based on user role and profile completion
        const userRole = result.data.user.role;
        const requiresProfileSetup = result.data.requiresProfileSetup;
        const redirectTo = result.data.redirectTo;
        const profileCompleted = result.data.user.profileCompleted;
        
        console.log('🔍 User role:', userRole);
        console.log('🔍 Requires profile setup:', requiresProfileSetup);
        console.log('🔍 Redirect to:', redirectTo);
        console.log('🔍 Profile completed:', profileCompleted);
        
        // Always redirect to dashboard first, then user can go to setup-profile if needed
        // This prevents the redirect loop issue
        console.log('🔍 Redirecting to dashboard based on role:', userRole);
        let redirectPath = '/accounts/patient/dashboard'; // Default
        
        switch (userRole) {
          case 'patient':
            redirectPath = '/accounts/patient/dashboard';
            break;
          case 'doctor':
          case 'nurse':
          case 'staff':
            redirectPath = '/emr/dashboard'; // Medical staff use EMR system
            break;
          case 'admin':
            redirectPath = '/admin/dashboard';
            break;
          default:
            redirectPath = '/accounts/patient/dashboard';
            break;
        }
        
        console.log('🔍 Final redirect path:', redirectPath);
        window.location.href = redirectPath;
        
        // TODO: Alternative flow - if you want to force profile setup first, uncomment below:
        // if (profileCompleted === false && requiresProfileSetup && redirectTo) {
        //   // Redirect to profile setup if required
        //   console.log('🔍 Redirecting to profile setup:', redirectTo);
        //   router.push(redirectTo);
        // } else {
        //   // Redirect based on role
        //   console.log('🔍 Redirecting to dashboard based on role:', userRole);
        //   switch (userRole) {
        //     case 'patient':
        //       router.push('/accounts/patient/dashboard');
        //       break;
        //     case 'doctor':
        //     case 'nurse':
        //     case 'staff':
        //       router.push('/emr/dashboard'); // Medical staff use EMR system
        //       break;
        //     case 'admin':
        //       router.push('/admin/dashboard');
        //       break;
        //     default:
        //       router.push('/accounts/patient/dashboard');
        //       break;
        //   }
        // }
        
      } else {
        // Login failed - Enhanced error handling
        const errorMessage = result.message || result.error?.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
        const statusCode = result.statusCode || response.status;
        
        console.log('🔍 Login failed - Status:', statusCode, 'Message:', errorMessage);
        console.log('🔍 Full response:', result);
        
        // Check if it's an unverified email error
        if (errorMessage.includes('verify your email') || 
            errorMessage.includes('email verification') ||
            errorMessage.includes('Please verify your email') ||
            result.metadata?.requiresEmailVerification) {
          
          // Store email for verification page
          const emailToStore = result.metadata?.email || formData.username;
          setPendingEmail(emailToStore);
          
          // Show modal for user to choose
          setShowEmailVerificationModal(true);
          return;
        }
        
        // Enhanced error handling with specific messages
        let displayMessage = '';
        
        if (statusCode === 401) {
          if (errorMessage.includes('Invalid credentials') || 
              errorMessage.includes('Invalid username or password') ||
              errorMessage.includes('User not found')) {
            displayMessage = '❌ ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง\n\n💡 ข้อแนะนำ:\n• ตรวจสอบการสะกดชื่อผู้ใช้\n• ตรวจสอบรหัสผ่าน (ตัวพิมพ์เล็ก/ใหญ่)\n• ลองใช้ชื่อผู้ใช้แทนอีเมล';
          } else if (errorMessage.includes('Account is deactivated')) {
            displayMessage = '🚫 บัญชีของคุณถูกระงับ\n\nกรุณาติดต่อผู้ดูแลระบบเพื่อเปิดใช้งานบัญชี';
          } else if (errorMessage.includes('email verification') || 
                     errorMessage.includes('verify your email')) {
            displayMessage = '📧 ต้องยืนยันอีเมลก่อนเข้าสู่ระบบ\n\nกรุณาตรวจสอบอีเมลและคลิกลิงก์ยืนยัน';
          } else {
            displayMessage = `❌ เข้าสู่ระบบไม่สำเร็จ (รหัส: ${statusCode})\n\n${errorMessage}`;
          }
        } else if (statusCode === 404) {
          displayMessage = '❌ ไม่พบผู้ใช้\n\nกรุณาตรวจสอบชื่อผู้ใช้หรือสมัครสมาชิกใหม่';
        } else if (statusCode === 429) {
          displayMessage = '⏰ ส่งคำขอมากเกินไป\n\nกรุณารอสักครู่แล้วลองใหม่';
        } else if (statusCode >= 500) {
          displayMessage = '🔧 เกิดข้อผิดพลาดจากเซิร์ฟเวอร์\n\nกรุณาลองใหม่อีกครั้งในภายหลัง';
        } else {
          displayMessage = `❌ เกิดข้อผิดพลาด (รหัส: ${statusCode})\n\n${errorMessage}`;
        }
        
        setErrors({ 
          submit: displayMessage
        });
        
        // Also show toast notification
        showError('เข้าสู่ระบบไม่สำเร็จ', displayMessage);
      }

    } catch (error: any) {
      console.log('💥 Login catch error:', error);
      
      let errorMessage = 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง';
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = '🔌 ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้\n\nกรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
      } else if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          errorMessage = '❌ ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง\n\nกรุณาตรวจสอบข้อมูลและลองใหม่';
        } else if (status === 404) {
          errorMessage = '❌ ไม่พบผู้ใช้\n\nกรุณาตรวจสอบชื่อผู้ใช้หรือสมัครสมาชิกใหม่';
        } else if (status >= 500) {
          errorMessage = '🔧 เกิดข้อผิดพลาดจากเซิร์ฟเวอร์\n\nกรุณาลองใหม่อีกครั้งในภายหลัง';
        } else {
          errorMessage = `❌ เกิดข้อผิดพลาด (รหัส: ${status})\n\n${error.response.data?.message || error.message}`;
        }
      } else if (error.message) {
        errorMessage = `❌ เกิดข้อผิดพลาด\n\n${error.message}`;
      }
      
      setErrors({ 
        submit: errorMessage
      });
      
      showError('ข้อผิดพลาดเครือข่าย', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resendEmail.trim()) {
      setResendMessage('Please enter your email address');
      return;
    }

    setIsResendingEmail(true);
    setResendMessage(null);

    try {
      const response = await apiClient.resendVerificationEmail(resendEmail);

      if (response.statusCode === 200 && !response.error) {
        setResendMessage('Verification email sent successfully! Please check your inbox.');
        setShowResendVerification(false);
        setResendEmail('');
      } else {
        setResendMessage(response.error?.message || 'Failed to send verification email');
      }
    } catch (error) {
      setResendMessage('Network error. Please try again.');
      logger.error('Resend verification error:', error);
    } finally {
      setIsResendingEmail(false);
    }
  };

  const handleGoToVerification = () => {
    localStorage.setItem('pendingVerificationEmail', pendingEmail);
    setShowEmailVerificationModal(false);
    router.push(`/resend-verification?email=${encodeURIComponent(pendingEmail)}`);
  };

  const handleCancelVerification = () => {
    setShowEmailVerificationModal(false);
    setPendingEmail('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-xl">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            HealthChain
          </h1>
          <p className="text-gray-600 text-lg">
            ระบบบันทึกสุขภาพอิเล็กทรอนิกส์
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/30 p-8 sm:p-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              เข้าสู่ระบบ
            </h2>
            <p className="text-gray-600">
              ยังไม่มีบัญชี?{' '}
              <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                สมัครสมาชิก
              </Link>
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-2xl mb-6 shadow-sm">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="font-medium">{successMessage}</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-2xl mb-6 shadow-sm">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Resend Verification Message */}
          {resendMessage && (
            <div className={`border px-6 py-4 rounded-2xl mb-6 shadow-sm ${
              resendMessage.includes('successfully') 
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 ${
                  resendMessage.includes('successfully') ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="font-medium">{resendMessage}</span>
              </div>
            </div>
          )}

          <form 
            className="space-y-6" 
            id="loginForm"
            onSubmit={handleSubmit}
          >
            <input type="hidden" name="remember" value={formData.rememberMe.toString()} />
            
            {/* Username Field */}
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                ชื่อผู้ใช้
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  className={`block w-full pl-12 pr-4 py-4 border-2 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    errors.username ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  placeholder="กรอกชื่อผู้ใช้"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>
              {errors.username && (
                <p className="text-red-600 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.username}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                รหัสผ่าน
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className={`block w-full pl-12 pr-12 py-4 border-2 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  placeholder="กรอกรหัสผ่าน"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M9.878 9.878a3 3 0 004.243 4.243m0 0L16.536 16.536M14.121 14.121l-4.242-4.242" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-600 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="rememberMe"
                  type="checkbox"
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded-lg"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                <label htmlFor="remember-me" className="ml-3 block text-sm font-medium text-gray-700">
                  จดจำการเข้าสู่ระบบ
                </label>
              </div>

              <div className="text-sm">
                <Link 
                  href="/forgot-password"
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors underline"
                >
                  ลืมรหัสผ่าน?
                </Link>
              </div>
            </div>

            {/* Error Message */}
            {errors.submit && (
              <div className="rounded-xl bg-red-50 p-4 border border-red-200 shadow-sm">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="text-sm font-medium text-red-800 whitespace-pre-line">
                      {errors.submit}
                    </div>
                    
                    {/* Email Verification Actions */}
                    {errors.emailVerification && (
                      <div className="mt-3 space-y-2">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Link
                            href={`/verify-email?email=${encodeURIComponent(formData.username)}`}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                          >
                            📧 ขอยืนยันอีเมลอีกครั้ง
                          </Link>
                          
                          <button
                            type="button"
                            onClick={() => {
                              setErrors({});
                              setFormData(prev => ({ ...prev, username: '', password: '' }));
                            }}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                          >
                            🔄 ลองใหม่
                          </button>
                        </div>
                        
                        <p className="text-xs text-red-600">
                          💡 หากไม่ได้รับอีเมล กรุณาตรวจสอบ Spam folder หรือใช้ปุ่ม &quot;ขอยืนยันอีเมลอีกครั้ง&quot;
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="rounded-md bg-green-50 p-4 border border-green-200">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">{successMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className={`group relative w-full flex justify-center items-center py-4 px-6 border border-transparent text-lg font-semibold rounded-2xl text-white transition-all duration-200 transform ${
                  isLoading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-blue-200'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    เข้าสู่ระบบ
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        {/* Resend Verification Email Form */}
        {showResendVerification && (
          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-amber-800">
                ต้องยืนยันอีเมล
              </h3>
            </div>
            <p className="text-amber-700 mb-6">
              กรุณายืนยันที่อยู่อีเมลของคุณเพื่อดำเนินการต่อ กรอกอีเมลเพื่อส่งอีเมลยืนยันใหม่
            </p>
            <div className="space-y-4">
              <div>
                <label htmlFor="resend-email" className="block text-sm font-medium text-amber-800 mb-2">
                  ที่อยู่อีเมล
                </label>
                <input
                  type="email"
                  id="resend-email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="block w-full px-4 py-3 border-2 border-amber-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                  placeholder="กรอกที่อยู่อีเมลของคุณ"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResendingEmail}
                  className={`flex-1 py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white transition-all duration-200 ${
                    isResendingEmail 
                      ? 'bg-slate-400 cursor-not-allowed' 
                      : 'bg-amber-600 hover:bg-amber-700 hover:shadow-md'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500`}
                >
                  {isResendingEmail ? 'กำลังส่ง...' : 'ส่งอีเมลยืนยันใหม่'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowResendVerification(false)}
                  className="flex-1 py-3 px-4 border-2 border-slate-300 text-sm font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-200"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Email Verification Modal */}
        {showEmailVerificationModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/20">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  ต้องยืนยันอีเมลก่อนเข้าสู่ระบบ
                </h3>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                  <p className="text-amber-800 font-medium mb-2">
                    📧 อีเมลที่ยังไม่ได้ยืนยัน:
                  </p>
                  <p className="text-amber-700 font-semibold text-lg">
                    {pendingEmail}
                  </p>
                </div>
                <p className="text-gray-600 mb-6 text-lg">
                  กรุณายืนยันอีเมลของคุณก่อนเข้าสู่ระบบ
                  <br />
                  <span className="text-sm text-gray-500">เพื่อความปลอดภัยของบัญชี</span>
                </p>
                <div className="space-y-3">
                  <button
                    onClick={handleGoToVerification}
                    className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    ✉️ ไปยืนยันอีเมล
                  </button>
                  <button
                    onClick={handleCancelVerification}
                    className="w-full h-12 text-lg font-semibold border-2 border-gray-300 hover:border-gray-400 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    ❌ ยกเลิก
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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

function LoginClient() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500">กำลังโหลด...</p>
      </div>
    </div>}>
      <LoginClientContent />
    </Suspense>
  );
}

export default LoginClient;
