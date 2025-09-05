import { APIError } from '@/types/api';

/**
 * Format API error messages for display to users
 */
export function formatAPIError(error: APIError | Error | unknown): string {
  if (!error) {
    return 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
  }

  // Handle APIError type
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const apiError = error as APIError;
    
    // Handle common HTTP status codes
    switch (apiError.statusCode) {
      case 400:
        return 'ข้อมูลที่ส่งมาไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง';
      case 401:
        return 'ไม่ได้รับอนุญาตให้เข้าถึง กรุณาเข้าสู่ระบบใหม่';
      case 403:
        return 'ไม่มีสิทธิ์ในการเข้าถึงข้อมูลนี้';
      case 404:
        return 'ไม่พบข้อมูลที่ร้องขอ';
      case 409:
        return 'ข้อมูลที่ส่งมาขัดแย้งกับข้อมูลที่มีอยู่';
      case 422:
        return 'ข้อมูลที่ส่งมาไม่ถูกต้องตามรูปแบบที่กำหนด';
      case 429:
        return 'ส่งคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่';
      case 500:
        return 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง';
      case 502:
        return 'เซิร์ฟเวอร์ไม่สามารถเข้าถึงได้ กรุณาลองใหม่อีกครั้ง';
      case 503:
        return 'เซิร์ฟเวอร์ไม่สามารถให้บริการได้ในขณะนี้';
      case 0:
        return 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
      default:
        return apiError.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
    }
  }

  // Handle regular Error
  if (error instanceof Error) {
    return error.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  return 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
}

/**
 * Get error details for developers (in development mode)
 */
export function getErrorDetails(error: APIError | Error | unknown): string {
  if (process.env.NODE_ENV !== 'development') {
    return '';
  }

  if (typeof error === 'object' && error !== null) {
    const apiError = error as APIError;
    return JSON.stringify({
      message: apiError.message,
      code: apiError.code,
      statusCode: apiError.statusCode,
      details: apiError.details,
    }, null, 2);
  }

  return String(error);
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: APIError | Error | unknown): boolean {
  if (typeof error === 'object' && error !== null) {
    const apiError = error as APIError;
    return apiError.statusCode === 0 || apiError.code === 'NETWORK_ERROR';
  }
  return false;
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: APIError | Error | unknown): boolean {
  if (typeof error === 'object' && error !== null) {
    const apiError = error as APIError;
    return apiError.statusCode === 401 || apiError.statusCode === 403;
  }
  return false;
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: APIError | Error | unknown): boolean {
  if (typeof error === 'object' && error !== null) {
    const apiError = error as APIError;
    return apiError.statusCode === 400 || apiError.statusCode === 422;
  }
  return false;
}

/**
 * Extract validation field errors from API response
 */
export function getValidationErrors(error: APIError | Error | unknown): Record<string, string> {
  if (typeof error === 'object' && error !== null) {
    const apiError = error as APIError;
    
    if (apiError.details && typeof apiError.details === 'object') {
      // Handle different validation error formats
      if (Array.isArray(apiError.details)) {
        // Handle array of validation errors
        const fieldErrors: Record<string, string> = {};
        apiError.details.forEach((detail: any) => {
          if (detail.field && detail.message) {
            fieldErrors[detail.field] = detail.message;
          }
        });
        return fieldErrors;
      } else if (typeof apiError.details === 'object') {
        // Handle object with field keys
        const fieldErrors: Record<string, string> = {};
        Object.keys(apiError.details).forEach(key => {
          const value = apiError.details[key];
          if (typeof value === 'string') {
            fieldErrors[key] = value;
          } else if (Array.isArray(value) && value.length > 0) {
            fieldErrors[key] = value[0];
          }
        });
        return fieldErrors;
      }
    }
  }
  
  return {};
}

/**
 * Create user-friendly error message with action suggestions
 */
export function createErrorMessage(error: APIError | Error | unknown): {
  message: string;
  action?: string;
} {
  const message = formatAPIError(error);
  
  if (isNetworkError(error)) {
    return {
      message,
      action: 'ตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองใหม่อีกครั้ง',
    };
  }
  
  if (isAuthError(error)) {
    return {
      message,
      action: 'กรุณาเข้าสู่ระบบใหม่อีกครั้ง',
    };
  }
  
  if (isValidationError(error)) {
    return {
      message,
      action: 'กรุณาตรวจสอบข้อมูลที่กรอกและลองใหม่อีกครั้ง',
    };
  }
  
  return { message };
}

/**
 * Handle API errors in React components
 */
export function handleAPIError(error: APIError | Error | unknown, options?: {
  showToast?: boolean;
  redirectOnAuth?: boolean;
  customMessage?: string;
}) {
  const { message } = createErrorMessage(error);
  const finalMessage = options?.customMessage || message;
  
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', getErrorDetails(error));
  }
  
  // Show toast notification if requested
  if (options?.showToast) {
    // You can integrate with your toast library here
    console.warn('Toast notification:', finalMessage);
  }
  
  // Redirect on authentication errors if requested
  if (options?.redirectOnAuth && isAuthError(error)) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
  
  return finalMessage;
}
