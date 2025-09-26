/**
 * Unified Alert System
 * 
 * This module provides a centralized way to display notifications
 * across the entire application. It replaces console.log, alert(),
 * and custom notification implementations with a consistent system.
 * 
 * Usage:
 * import { showError, showSuccess, showWarning, showInfo } from '@/lib/alerts';
 * 
 * showError('Error Title', 'Error message');
 * showSuccess('Success Title', 'Operation completed successfully');
 * showWarning('Warning Title', 'Please check your input');
 * showInfo('Info Title', 'Additional information');
 */

import {
  showAlert,
  showError,
  showInformation,
  showConfirmation,
  showWarning,
  dismissAllAlerts,
  dismissAlert,
  type AlertConfig,
  type AlertType,
} from '@/components/ui/alert-system';

// Re-export all alert functions for convenience
export {
  showAlert,
  showError,
  showInformation,
  showConfirmation,
  showWarning,
  dismissAllAlerts,
  dismissAlert,
  type AlertConfig,
  type AlertType,
};

// Additional convenience aliases
export const showSuccess = (message: string, title?: string) => 
  showAlert({
    type: 'confirmation',
    title: title || 'สำเร็จ',
    message,
    duration: 4000,
  });
export const showInfo = showInformation;

// Common alert messages for consistency
export const CommonAlerts = {
  // Success messages
  LOGIN_SUCCESS: 'เข้าสู่ระบบสำเร็จ',
  LOGOUT_SUCCESS: 'ออกจากระบบสำเร็จ',
  SAVE_SUCCESS: 'บันทึกข้อมูลสำเร็จ',
  UPDATE_SUCCESS: 'อัปเดตข้อมูลสำเร็จ',
  DELETE_SUCCESS: 'ลบข้อมูลสำเร็จ',
  SEND_SUCCESS: 'ส่งข้อมูลสำเร็จ',
  
  // Error messages
  LOGIN_ERROR: 'เข้าสู่ระบบไม่สำเร็จ',
  NETWORK_ERROR: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
  VALIDATION_ERROR: 'ข้อมูลไม่ถูกต้อง',
  PERMISSION_ERROR: 'ไม่มีสิทธิ์ในการดำเนินการ',
  SERVER_ERROR: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์',
  UNKNOWN_ERROR: 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ',
  
  // Warning messages
  UNSAVED_CHANGES: 'มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก',
  CONFIRM_DELETE: 'คุณต้องการลบข้อมูลนี้หรือไม่?',
  SESSION_EXPIRED: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่',
  
  // Information messages
  LOADING: 'กำลังโหลดข้อมูล...',
  NO_DATA: 'ไม่มีข้อมูล',
  FEATURE_COMING_SOON: 'ฟีเจอร์นี้จะเปิดให้ใช้งานในเร็วๆ นี้',
};

// Helper function to show common alerts
export const showCommonAlert = (
  alertKey: keyof typeof CommonAlerts,
  type: AlertType = 'information',
  customMessage?: string
): string => {
  const message = customMessage || CommonAlerts[alertKey];
  
  switch (type) {
    case 'error':
      return showError('ข้อผิดพลาด', message);
    case 'warning':
      return showWarning('คำเตือน', message);
    case 'confirmation':
      return showConfirmation('สำเร็จ', message);
    case 'information':
    default:
      return showInformation('ข้อมูล', message);
  }
};

// Helper function for API error handling
export const showAPIError = (error: any, customMessage?: string): string => {
  let message = customMessage || CommonAlerts.UNKNOWN_ERROR;
  
  if (error?.response?.data?.message) {
    message = (error as any).message;
  } else if (error?.message) {
    message = (error as any).message;
  } else if (typeof error === 'string') {
    message = error;
  }
  
  return showError('ข้อผิดพลาด', message);
};

// Helper function for form validation errors
export const showValidationError = (errors: Record<string, string>): string => {
  const firstError = Object.values(errors)[0];
  return showError('ข้อมูลไม่ถูกต้อง', firstError || CommonAlerts.VALIDATION_ERROR);
};

// Helper function for network errors (basic version)
export const showBasicNetworkError = (): string => {
  return showError('ข้อผิดพลาดเครือข่าย', CommonAlerts.NETWORK_ERROR);
};

// Helper function for permission errors (basic version)
export const showBasicPermissionError = (): string => {
  return showError('ไม่มีสิทธิ์', CommonAlerts.PERMISSION_ERROR);
};

// Helper function for session expired
export const showSessionExpired = (): string => {
  return showWarning('เซสชันหมดอายุ', CommonAlerts.SESSION_EXPIRED);
};

// Helper function for feature coming soon
export const showFeatureComingSoon = (featureName?: string): string => {
  const message = featureName 
    ? `ฟีเจอร์ ${featureName} จะเปิดให้ใช้งานในเร็วๆ นี้`
    : CommonAlerts.FEATURE_COMING_SOON;
  return showInformation('ฟีเจอร์ใหม่', message);
};

// Enhanced error handling functions
export const showNetworkError = (customMessage?: string): string => {
  return showError('ข้อผิดพลาดเครือข่าย', customMessage || CommonAlerts.NETWORK_ERROR);
};

export const showServerError = (customMessage?: string): string => {
  return showError('ข้อผิดพลาดเซิร์ฟเวอร์', customMessage || CommonAlerts.SERVER_ERROR);
};

export const showAuthError = (customMessage?: string): string => {
  return showWarning('เซสชันหมดอายุ', customMessage || 'กรุณาเข้าสู่ระบบใหม่');
};

export const showPermissionError = (customMessage?: string): string => {
  return showError('ไม่มีสิทธิ์', customMessage || CommonAlerts.PERMISSION_ERROR);
};

export const showNotFoundError = (resource?: string): string => {
  const message = resource 
    ? `ไม่พบ${resource}ที่ร้องขอ`
    : 'ไม่พบข้อมูลที่ร้องขอ';
  return showError('ไม่พบข้อมูล', message);
};

export const showRateLimitError = (): string => {
  return showWarning('ส่งคำขอมากเกินไป', 'กรุณารอสักครู่แล้วลองใหม่');
};

export const showTimeoutError = (): string => {
  return showError('หมดเวลา', 'การดำเนินการใช้เวลานานเกินไป กรุณาลองใหม่');
};

// Error with retry option
export const showErrorWithRetry = (
  title: string,
  message: string,
  onRetry: () => void,
  retryLabel: string = 'ลองใหม่'
): string => {
  return showError(title, message, {
    action: {
      label: retryLabel,
      onClick: onRetry
    }
  });
};

// Error with custom action
export const showErrorWithAction = (
  title: string,
  message: string,
  actionLabel: string,
  onAction: () => void
): string => {
  return showError(title, message, {
    action: {
      label: actionLabel,
      onClick: onAction
    }
  });
};

// Confirmation dialog style error
export const showConfirmError = (
  title: string,
  message: string,
  onConfirm: () => void,
  confirmLabel: string = 'ยืนยัน'
): string => {
  return showError(title, message, {
    action: {
      label: confirmLabel,
      onClick: onConfirm
    }
  });
};
