"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import FormDataCleaner from "@/lib/formDataCleaner";

function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading, error, clearError, isAuthenticated, user } = useAuth();
  
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

  // Clear form data when component mounts to prevent cached values
  useEffect(() => {
    // Clear any previously filled form data
    setFormData({
      username: "",
      password: "",
      rememberMe: false
    });
    
    // Use FormDataCleaner to clear all cached data
    FormDataCleaner.clearAllFormData();
    FormDataCleaner.clearFormData('loginForm');
    
    // Disable autofill for the login form (will be applied when form renders)
    setTimeout(() => {
      FormDataCleaner.disableAutofill('loginForm');
      FormDataCleaner.resetFormInputs('loginForm');
    }, 100);
    
  }, []);

  // Clear auth error when component mounts - don't redirect here
  useEffect(() => {
    clearError();
  }, [clearError]);

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
  }, [clearError, searchParams, isAuthenticated, isLoading, user]);

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

    try {
      await login({
        username: formData.username.trim(),
        password: formData.password
      });
      
      // Success - auth context will handle the redirect
      
    } catch (error: any) {
      // Error will be handled by auth context
      console.error('Login failed:', error);
      
      // Check if it's an unverified email error
      if (error?.response?.data?.error === 'Please verify your email before logging in') {
        setShowResendVerification(true);
        setResendEmail(formData.username);
      }
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
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resendEmail }),
      });

      if (response.ok) {
        setResendMessage('Verification email sent successfully! Please check your inbox.');
        setShowResendVerification(false);
        setResendEmail('');
      } else {
        const data = await response.json();
        setResendMessage(data.error || 'Failed to send verification email');
      }
    } catch (error) {
      setResendMessage('Network error. Please try again.');
      console.error('Resend verification error:', error);
    } finally {
      setIsResendingEmail(false);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              create a new account
            </Link>
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Resend Verification Message */}
        {resendMessage && (
          <div className={`border px-4 py-3 rounded ${
            resendMessage.includes('successfully') 
              ? 'bg-green-100 border-green-400 text-green-700'
              : 'bg-red-100 border-red-400 text-red-700'
          }`}>
            {resendMessage}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} id="loginForm">
          <input type="hidden" name="remember" value={formData.rememberMe.toString()} />
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  errors.username ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
              />
              {errors.username && (
                <p className="text-red-600 text-sm mt-1">{errors.username}</p>
              )}
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 pr-10 border ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M9.878 9.878a3 3 0 004.243 4.243m0 0L16.536 16.536M14.121 14.121l-4.242-4.242" />
                  </svg>
                )}
              </button>
              {errors.password && (
                <p className="text-red-600 text-sm mt-1">{errors.password}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="rememberMe"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                checked={formData.rememberMe}
                onChange={handleChange}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        {/* Resend Verification Email Form */}
        {showResendVerification && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h3 className="text-lg font-medium text-yellow-800 mb-2">
              Email Verification Required
            </h3>
            <p className="text-sm text-yellow-700 mb-4">
              Please verify your email address to continue. Enter your email to resend the verification email.
            </p>
            <form onSubmit={handleResendVerification} className="space-y-4">
              <div>
                <label htmlFor="resend-email" className="block text-sm font-medium text-yellow-700">
                  Email Address
                </label>
                <input
                  type="email"
                  id="resend-email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-yellow-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                  placeholder="Enter your email address"
                  required
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={isResendingEmail}
                  className={`flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                    isResendingEmail 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-yellow-600 hover:bg-yellow-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500`}
                >
                  {isResendingEmail ? 'Sending...' : 'Resend Verification Email'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowResendVerification(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginClient;
