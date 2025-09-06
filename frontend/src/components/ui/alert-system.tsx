'use client';

import React from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { 
  CheckCircle, 
  AlertCircle, 
  Info, 
  AlertTriangle,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Alert types
export type AlertType = 'error' | 'information' | 'confirmation' | 'warning';

// Alert configuration interface
export interface AlertConfig {
  type: AlertType;
  title: string;
  message: string;
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  showCloseButton?: boolean;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Icon configuration for each alert type
const alertIcons = {
  error: <AlertCircle className="h-5 w-5 text-red-500" />,
  information: <Info className="h-5 w-5 text-blue-500" />,
  confirmation: <CheckCircle className="h-5 w-5 text-green-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
};

// Color configuration for each alert type
const alertColors = {
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    title: 'text-red-900',
  },
  information: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    title: 'text-blue-900',
  },
  confirmation: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    title: 'text-green-900',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    title: 'text-yellow-900',
  },
};

// Custom toast component
const CustomToast: React.FC<{
  config: AlertConfig;
  onClose: () => void;
}> = ({ config, onClose }) => {
  const colors = alertColors[config.type];
  const icon = alertIcons[config.type];

  return (
    <div
      className={cn(
        'relative flex w-full max-w-md items-start space-x-3 rounded-lg border p-4 shadow-lg transition-all duration-300',
        colors.bg,
        colors.border
      )}
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className={cn('text-sm font-semibold mb-1', colors.title)}>
          {config.title}
        </h4>
        <p className={cn('text-sm', colors.text)}>
          {config.message}
        </p>
        
        {/* Action button */}
        {config.action && (
          <button
            onClick={config.action.onClick}
            className={cn(
              'mt-2 text-sm font-medium underline hover:no-underline',
              colors.text
            )}
          >
            {config.action.label}
          </button>
        )}
      </div>

      {/* Close button */}
      {config.showCloseButton !== false && (
        <button
          onClick={onClose}
          className={cn(
            'flex-shrink-0 p-1 rounded-full hover:bg-black/5 transition-colors',
            colors.text
          )}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

// Centralized alert function
export const showAlert = (config: AlertConfig): string => {
  const toastId = toast.custom(
    (t) => (
      <CustomToast
        config={config}
        onClose={() => {
          toast.dismiss(t.id);
          config.onClose?.();
        }}
      />
    ),
    {
      duration: config.duration || (config.type === 'error' ? 6000 : 4000),
      position: config.position || 'top-right',
    }
  );

  return toastId;
};

// Convenience functions for each alert type
export const showError = (
  title: string,
  message: string,
  options?: Partial<AlertConfig>
): string => {
  return showAlert({
    type: 'error',
    title,
    message,
    duration: 6000,
    ...options,
  });
};

export const showInformation = (
  title: string,
  message: string,
  options?: Partial<AlertConfig>
): string => {
  return showAlert({
    type: 'information',
    title,
    message,
    duration: 4000,
    ...options,
  });
};

export const showConfirmation = (
  title: string,
  message: string,
  options?: Partial<AlertConfig>
): string => {
  return showAlert({
    type: 'confirmation',
    title,
    message,
    duration: 4000,
    ...options,
  });
};

export const showWarning = (
  title: string,
  message: string,
  options?: Partial<AlertConfig>
): string => {
  return showAlert({
    type: 'warning',
    title,
    message,
    duration: 5000,
    ...options,
  });
};

// Toast provider component
export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          // Default options for all toasts
          duration: 4000,
          style: {
            background: 'transparent',
            boxShadow: 'none',
            padding: 0,
            margin: 0,
          },
          // Success styles
          success: {
            duration: 4000,
            style: {
              background: 'transparent',
              boxShadow: 'none',
              padding: 0,
              margin: 0,
            },
          },
          // Error styles
          error: {
            duration: 6000,
            style: {
              background: 'transparent',
              boxShadow: 'none',
              padding: 0,
              margin: 0,
            },
          },
        }}
      />
    </>
  );
};

// Utility function to dismiss all toasts
export const dismissAllAlerts = (): void => {
  toast.dismiss();
};

// Utility function to dismiss specific alert
export const dismissAlert = (toastId: string): void => {
  toast.dismiss(toastId);
};

// Export default for easy importing
export default {
  showAlert,
  showError,
  showInformation,
  showConfirmation,
  showWarning,
  dismissAllAlerts,
  dismissAlert,
  AlertProvider,
};
