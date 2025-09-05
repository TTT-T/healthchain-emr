'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Loader2, Mail, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface VerificationResult {
  success: boolean;
  message: string;
  data?: any;
  errors?: any;
}

export default function VerifyEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'resend'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const token = searchParams.get('token');
  const urlEmail = searchParams.get('email');

  useEffect(() => {
    if (urlEmail) {
      setEmail(decodeURIComponent(urlEmail));
    }
  }, [urlEmail]);

  useEffect(() => {
    if (token) {
      verifyEmailToken(token);
    } else {
      setStatus('error');
      setMessage('Verification token is missing');
    }
  }, [token]);

  const verifyEmailToken = async (verificationToken: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-email?token=${verificationToken}`);
      const result: VerificationResult = await response.json();

      if (result.success) {
        setStatus('success');
        setMessage(result.message);
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login?verified=true');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(result.message || 'Email verification failed');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      setStatus('error');
      setMessage('Failed to verify email. Please try again.');
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setResendMessage('Please enter your email address');
      return;
    }

    setIsResending(true);
    setResendMessage('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result: VerificationResult = await response.json();

      if (result.success) {
        setResendMessage('Verification email sent successfully! Please check your email.');
      } else {
        setResendMessage(result.message || 'Failed to send verification email');
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      setResendMessage('Failed to send verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Verifying your email...</h2>
            <p className="text-gray-600 text-center">Please wait while we verify your email address.</p>
          </div>
        );

      case 'success':
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">Email Verified!</h2>
            <p className="text-gray-600 text-center mb-4">{message}</p>
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Your email has been successfully verified. You will be redirected to the login page in a few seconds.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => router.push('/login?verified=true')}
              className="mt-4 bg-green-600 hover:bg-green-700"
            >
              Go to Login
            </Button>
          </div>
        );

      case 'error':
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <XCircle className="h-16 w-16 text-red-600 mb-4" />
            <h2 className="text-2xl font-bold text-red-800 mb-2">Verification Failed</h2>
            <p className="text-gray-600 text-center mb-4">{message}</p>
            <Alert className="bg-red-50 border-red-200 mb-6">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                The verification link may have expired or is invalid. You can request a new verification email below.
              </AlertDescription>
            </Alert>
            
            <div className="w-full max-w-md space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <Button 
                onClick={handleResendVerification}
                disabled={isResending}
                className="w-full"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resend Verification Email
                  </>
                )}
              </Button>
              
              {resendMessage && (
                <Alert className={resendMessage.includes('successfully') ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
                  <AlertDescription className={resendMessage.includes('successfully') ? 'text-green-800' : 'text-red-800'}>
                    {resendMessage}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Email Verification
          </CardTitle>
          <CardDescription>
            HealthChain EMR System
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}
