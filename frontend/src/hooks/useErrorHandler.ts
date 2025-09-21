"use client";
import { useEffect, useCallback } from 'react';
import { useToast } from '@/components/Toast';
import { logger } from '@/lib/logger';

interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  fallbackMessage?: string;
}

export const useErrorHandler = (options: ErrorHandlerOptions = {}) => {
  const { showToast = true, logError = true, fallbackMessage = 'เกิดข้อผิดพลาดที่ไม่คาดคิด' } = options;
  const { addToast } = useToast();

  const handleError = useCallback((error: any, context?: string) => {
    if (logError) {
      logger.error('Error handled by useErrorHandler', {
        error: error?.message || error,
        context,
        stack: error?.stack
      });
    }

    if (showToast) {
      let message = fallbackMessage;
      let title = 'เกิดข้อผิดพลาด';

      if (error?.message) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      }

      // Handle specific error types
      if (error?.statusCode) {
        switch (error.statusCode) {
          case 400:
            title = 'ข้อมูลไม่ถูกต้อง';
            break;
          case 401:
            title = 'เซสชันหมดอายุ';
            message = 'กรุณาเข้าสู่ระบบใหม่';
            break;
          case 403:
            title = 'ไม่มีสิทธิ์เข้าถึง';
            message = 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้';
            break;
          case 404:
            title = 'ไม่พบข้อมูล';
            message = 'ไม่พบข้อมูลที่ต้องการ';
            break;
          case 429:
            title = 'คำขอมากเกินไป';
            message = 'กรุณารอสักครู่แล้วลองใหม่';
            break;
          case 500:
          case 502:
          case 503:
          case 504:
            title = 'ข้อผิดพลาดของระบบ';
            message = 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง';
            break;
        }
      }

      addToast({
        type: 'error',
        title,
        message,
        duration: 5000
      });
    }
  }, [addToast, showToast, logError, fallbackMessage]);

  const handleWarning = useCallback((message: string, title: string = 'คำเตือน') => {
    if (logError) {
      logger.warn('Warning handled by useErrorHandler', { message, title });
    }

    if (showToast) {
      addToast({
        type: 'warning',
        title,
        message,
        duration: 4000
      });
    }
  }, [addToast, showToast, logError]);

  const handleInfo = useCallback((message: string, title: string = 'ข้อมูล') => {
    if (logError) {
      logger.info('Info handled by useErrorHandler', { message, title });
    }

    if (showToast) {
      addToast({
        type: 'info',
        title,
        message,
        duration: 3000
      });
    }
  }, [addToast, showToast, logError]);

  // Global error event listeners
  useEffect(() => {
    const handleTokenExpired = (event: CustomEvent) => {
      const { message } = event.detail || {};
      handleError({ message, statusCode: 401 }, 'Token Expired Event');
    };

    const handleAccessDenied = (event: CustomEvent) => {
      const { message } = event.detail || {};
      handleError({ message, statusCode: 403 }, 'Access Denied Event');
    };

    const handleRateLimited = (event: CustomEvent) => {
      const { message } = event.detail || {};
      handleWarning(message, 'คำขอมากเกินไป');
    };

    const handleServerError = (event: CustomEvent) => {
      const { message } = event.detail || {};
      handleError({ message, statusCode: 500 }, 'Server Error Event');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logger.error('Unhandled promise rejection', event.reason);
      handleError(event.reason, 'Unhandled Promise Rejection');
    };

    const handleGlobalError = (event: ErrorEvent) => {
      logger.error('Global error', event.error);
      handleError(event.error, 'Global Error');
    };

    // Add event listeners
    window.addEventListener('tokenExpired', handleTokenExpired as EventListener);
    window.addEventListener('accessDenied', handleAccessDenied as EventListener);
    window.addEventListener('rateLimited', handleRateLimited as EventListener);
    window.addEventListener('serverError', handleServerError as EventListener);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleGlobalError);

    // Cleanup
    return () => {
      window.removeEventListener('tokenExpired', handleTokenExpired as EventListener);
      window.removeEventListener('accessDenied', handleAccessDenied as EventListener);
      window.removeEventListener('rateLimited', handleRateLimited as EventListener);
      window.removeEventListener('serverError', handleServerError as EventListener);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleGlobalError);
    };
  }, [handleError, handleWarning]);

  return {
    handleError,
    handleWarning,
    handleInfo
  };
};

// Hook for handling async operations with error handling
export const useAsyncErrorHandler = (options: ErrorHandlerOptions = {}) => {
  const { handleError } = useErrorHandler(options);

  const executeAsync = useCallback(async <T>(
    asyncFunction: () => Promise<T>,
    context?: string
  ): Promise<T | null> => {
    try {
      return await asyncFunction();
    } catch (error) {
      handleError(error, context);
      return null;
    }
  }, [handleError]);

  return { executeAsync };
};
