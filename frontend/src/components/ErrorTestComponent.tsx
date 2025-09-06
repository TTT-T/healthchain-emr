'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  handleErrorWithAlert,
  handleValidationErrors,
  handleNetworkError,
  handleAuthError,
  handleServerError,
  handlePermissionError,
  formatAPIError,
  isNetworkError,
  isAuthError,
  isValidationError
} from '@/lib/errorHandler';
import { APIError } from '@/types/api';

export default function ErrorTestComponent() {
  const [isLoading, setIsLoading] = useState(false);

  // Mock error objects for testing
  const mockErrors = {
    networkError: {
      message: 'Network error - please check your connection',
      statusCode: 0,
      code: 'NETWORK_ERROR'
    } as APIError,
    
    authError: {
      message: 'Unauthorized access',
      statusCode: 401,
      code: 'UNAUTHORIZED'
    } as APIError,
    
    validationError: {
      message: 'Validation failed',
      statusCode: 422,
      code: 'VALIDATION_ERROR',
      details: {
        email: 'อีเมลไม่ถูกต้อง',
        password: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'
      }
    } as APIError,
    
    serverError: {
      message: 'Internal server error',
      statusCode: 500,
      code: 'INTERNAL_ERROR'
    } as APIError,
    
    permissionError: {
      message: 'Access denied',
      statusCode: 403,
      code: 'FORBIDDEN'
    } as APIError,
    
    notFoundError: {
      message: 'Resource not found',
      statusCode: 404,
      code: 'NOT_FOUND'
    } as APIError,
    
    rateLimitError: {
      message: 'Too many requests',
      statusCode: 429,
      code: 'RATE_LIMIT'
    } as APIError
  };

  const handleTestError = (errorType: keyof typeof mockErrors) => {
    const error = mockErrors[errorType];
    handleErrorWithAlert(error, {
      title: `ทดสอบ ${errorType}`,
      redirectOnAuth: errorType === 'authError'
    });
  };

  const handleTestValidationErrors = () => {
    const errors = {
      email: 'อีเมลไม่ถูกต้อง',
      password: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร',
      confirmPassword: 'รหัสผ่านไม่ตรงกัน'
    };
    handleValidationErrors(errors);
  };

  const handleTestNetworkErrorWithRetry = () => {
    const retryFunction = () => {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        console.log('Retry attempt completed');
      }, 1000);
    };
    
    handleNetworkError(mockErrors.networkError, retryFunction);
  };

  const handleTestAuthError = () => {
    handleAuthError(mockErrors.authError);
  };

  const handleTestServerError = () => {
    handleServerError(mockErrors.serverError);
  };

  const handleTestPermissionError = () => {
    handlePermissionError(mockErrors.permissionError);
  };

  const handleTestErrorFormatting = () => {
    const error = mockErrors.validationError;
    const formattedMessage = formatAPIError(error);
    console.log('Formatted error message:', formattedMessage);
    
    // Show the formatted message in an alert
    handleErrorWithAlert(error, {
      title: 'Formatted Error Message',
      customMessage: formattedMessage
    });
  };

  const handleTestErrorDetection = () => {
    const tests = [
      { name: 'Network Error', error: mockErrors.networkError, isNetwork: isNetworkError, isAuth: isAuthError, isValidation: isValidationError },
      { name: 'Auth Error', error: mockErrors.authError, isNetwork: isNetworkError, isAuth: isAuthError, isValidation: isValidationError },
      { name: 'Validation Error', error: mockErrors.validationError, isNetwork: isNetworkError, isAuth: isAuthError, isValidation: isValidationError }
    ];

    tests.forEach(test => {
      console.log(`${test.name}:`, {
        isNetwork: test.isNetwork(test.error),
        isAuth: test.isAuth(test.error),
        isValidation: test.isValidation(test.error)
      });
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">ทดสอบระบบจัดการ Error</h2>
        <p className="text-gray-600">ทดสอบการจัดการข้อผิดพลาดประเภทต่างๆ</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Network Errors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Network Errors</CardTitle>
            <CardDescription>ข้อผิดพลาดเครือข่าย</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              onClick={() => handleTestError('networkError')}
              variant="destructive"
              className="w-full"
            >
              ทดสอบ Network Error
            </Button>
            <Button 
              onClick={handleTestNetworkErrorWithRetry}
              variant="outline"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'กำลังลองใหม่...' : 'Network Error + Retry'}
            </Button>
          </CardContent>
        </Card>

        {/* Authentication Errors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-yellow-600">Authentication Errors</CardTitle>
            <CardDescription>ข้อผิดพลาดการยืนยันตัวตน</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              onClick={() => handleTestError('authError')}
              variant="outline"
              className="w-full border-yellow-500 text-yellow-600 hover:bg-yellow-50"
            >
              ทดสอบ Auth Error
            </Button>
            <Button 
              onClick={handleTestAuthError}
              variant="outline"
              className="w-full border-yellow-500 text-yellow-600 hover:bg-yellow-50"
            >
              Auth Error + Redirect
            </Button>
          </CardContent>
        </Card>

        {/* Validation Errors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">Validation Errors</CardTitle>
            <CardDescription>ข้อผิดพลาดการตรวจสอบข้อมูล</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              onClick={() => handleTestError('validationError')}
              variant="outline"
              className="w-full border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              ทดสอบ Validation Error
            </Button>
            <Button 
              onClick={handleTestValidationErrors}
              variant="outline"
              className="w-full border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              Multiple Validation Errors
            </Button>
          </CardContent>
        </Card>

        {/* Server Errors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-purple-600">Server Errors</CardTitle>
            <CardDescription>ข้อผิดพลาดเซิร์ฟเวอร์</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              onClick={() => handleTestError('serverError')}
              variant="outline"
              className="w-full border-purple-500 text-purple-600 hover:bg-purple-50"
            >
              ทดสอบ Server Error
            </Button>
            <Button 
              onClick={handleTestServerError}
              variant="outline"
              className="w-full border-purple-500 text-purple-600 hover:bg-purple-50"
            >
              Server Error Handler
            </Button>
          </CardContent>
        </Card>

        {/* Permission Errors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-orange-600">Permission Errors</CardTitle>
            <CardDescription>ข้อผิดพลาดสิทธิ์การเข้าถึง</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              onClick={() => handleTestError('permissionError')}
              variant="outline"
              className="w-full border-orange-500 text-orange-600 hover:bg-orange-50"
            >
              ทดสอบ Permission Error
            </Button>
            <Button 
              onClick={handleTestPermissionError}
              variant="outline"
              className="w-full border-orange-500 text-orange-600 hover:bg-orange-50"
            >
              Permission Error Handler
            </Button>
          </CardContent>
        </Card>

        {/* Other Errors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-600">Other Errors</CardTitle>
            <CardDescription>ข้อผิดพลาดประเภทอื่นๆ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              onClick={() => handleTestError('notFoundError')}
              variant="outline"
              className="w-full"
            >
              ทดสอบ 404 Error
            </Button>
            <Button 
              onClick={() => handleTestError('rateLimitError')}
              variant="outline"
              className="w-full"
            >
              ทดสอบ Rate Limit Error
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Utility Functions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-green-600">Utility Functions</CardTitle>
          <CardDescription>ฟังก์ชันช่วยเหลือสำหรับการจัดการ Error</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Button 
              onClick={handleTestErrorFormatting}
              variant="outline"
              className="border-green-500 text-green-600 hover:bg-green-50"
            >
              ทดสอบ Error Formatting
            </Button>
            <Button 
              onClick={handleTestErrorDetection}
              variant="outline"
              className="border-green-500 text-green-600 hover:bg-green-50"
            >
              ทดสอบ Error Detection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Information */}
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูล Error ที่ใช้ทดสอบ</CardTitle>
          <CardDescription>รายละเอียดของ Error ต่างๆ ที่ใช้ในการทดสอบ</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(mockErrors).map(([key, error]) => (
              <div key={key} className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-sm text-gray-700">{key}</h4>
                <p className="text-xs text-gray-600">Status: {error.statusCode} | Code: {error.code}</p>
                <p className="text-xs text-gray-600">Message: {error.message}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
