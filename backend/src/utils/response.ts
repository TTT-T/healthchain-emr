import { Response } from 'express';

/**
 * Standard API Response Utilities
 * ฟังก์ชันสำหรับสร้าง response แบบมาตรฐาน
 */

export interface APIResponse<T = any> {
  data: T | null;
  meta?: {
    timestamp: string;
    requestId?: string;
    [key: string]: any;
  };
  error: {
    code: string;
    message: string;
    details?: any;
  } | null;
  statusCode: number;
}

/**
 * Create success response
 */
export const successResponse = <T>(
  message: string,
  data: T,
  statusCode: number = 200,
  meta?: any
): APIResponse<T> => {
  return {
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    },
    error: null,
    statusCode
  };
};

/**
 * Create error response
 */
export const errorResponse = (
  message: string,
  statusCode: number = 500,
  details?: any,
  code?: string
): APIResponse<null> => {
  return {
    data: null,
    meta: {
      timestamp: new Date().toISOString()
    },
    error: {
      code: code || 'INTERNAL_ERROR',
      message,
      details
    },
    statusCode
  };
};

/**
 * Send success response
 */
export const sendSuccess = <T>(
  res: Response,
  message: string,
  data: T,
  statusCode: number = 200,
  meta?: any
): void => {
  const response = successResponse(message, data, statusCode, meta);
  res.status(statusCode).json(response);
};

/**
 * Send error response
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500,
  details?: any,
  code?: string
): void => {
  const response = errorResponse(message, statusCode, details, code);
  res.status(statusCode).json(response);
};

/**
 * Send validation error response
 */
export const sendValidationError = (
  res: Response,
  message: string,
  details?: any
): void => {
  sendError(res, message, 400, details, 'VALIDATION_ERROR');
};

/**
 * Send not found error response
 */
export const sendNotFound = (
  res: Response,
  message: string = 'Resource not found'
): void => {
  sendError(res, message, 404, null, 'NOT_FOUND');
};

/**
 * Send unauthorized error response
 */
export const sendUnauthorized = (
  res: Response,
  message: string = 'Unauthorized access'
): void => {
  sendError(res, message, 401, null, 'UNAUTHORIZED');
};

/**
 * Send forbidden error response
 */
export const sendForbidden = (
  res: Response,
  message: string = 'Forbidden access'
): void => {
  sendError(res, message, 403, null, 'FORBIDDEN');
};

/**
 * Send conflict error response
 */
export const sendConflict = (
  res: Response,
  message: string = 'Resource conflict'
): void => {
  sendError(res, message, 409, null, 'CONFLICT');
};

/**
 * Send too many requests error response
 */
export const sendTooManyRequests = (
  res: Response,
  message: string = 'Too many requests'
): void => {
  sendError(res, message, 429, null, 'TOO_MANY_REQUESTS');
};
