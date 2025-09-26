/**
 * Central Error Handler Middleware
 * Standardizes error responses across the application
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { DatabaseSerializer } from '../utils/serializer';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    
    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Predefined error types for common scenarios
 */
export const ErrorTypes = {
  // Authentication & Authorization
  UNAUTHORIZED: (message: string = 'Unauthorized access') => 
    new AppError(message, 401, 'UNAUTHORIZED'),
  
  FORBIDDEN: (message: string = 'Access forbidden') => 
    new AppError(message, 403, 'FORBIDDEN'),
  
  INVALID_TOKEN: (message: string = 'Invalid token') => 
    new AppError(message, 401, 'INVALID_TOKEN'),
  
  TOKEN_EXPIRED: (message: string = 'Token expired') => 
    new AppError(message, 401, 'TOKEN_EXPIRED'),
  
  // Validation
  VALIDATION_ERROR: (message: string = 'Validation failed', details?: any) => 
    new AppError(message, 400, 'VALIDATION_ERROR', details),
  
  INVALID_INPUT: (message: string = 'Invalid input provided') => 
    new AppError(message, 400, 'INVALID_INPUT'),
  
  // Resource Management
  NOT_FOUND: (message: string = 'Resource not found') => 
    new AppError(message, 404, 'NOT_FOUND'),
  
  CONFLICT: (message: string = 'Resource conflict') => 
    new AppError(message, 409, 'CONFLICT'),
  
  DUPLICATE: (message: string = 'Resource already exists') => 
    new AppError(message, 409, 'DUPLICATE'),
  
  // Database
  DATABASE_ERROR: (message: string = 'Database operation failed') => 
    new AppError(message, 500, 'DATABASE_ERROR'),
  
  CONNECTION_ERROR: (message: string = 'Database connection failed') => 
    new AppError(message, 503, 'CONNECTION_ERROR'),
  
  // External Services
  EXTERNAL_SERVICE_ERROR: (message: string = 'External service error') => 
    new AppError(message, 502, 'EXTERNAL_SERVICE_ERROR'),
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: (message: string = 'Rate limit exceeded') => 
    new AppError(message, 429, 'RATE_LIMIT_EXCEEDED'),
  
  // Server
  INTERNAL_ERROR: (message: string = 'Internal server error') => 
    new AppError(message, 500, 'INTERNAL_ERROR'),
  
  SERVICE_UNAVAILABLE: (message: string = 'Service unavailable') => 
    new AppError(message, 503, 'SERVICE_UNAVAILABLE'),
};

/**
 * Main error handler middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error details
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    body: req.body,
    query: req.query,
    params: req.params
  });

  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Internal Server Error';
  let details = null;

  // Handle different error types
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    details = error.details;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
    }));
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Token expired';
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = error.message;
  } else if (error.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_INPUT';
    message = 'Invalid input format';
  } else if (error.name === 'MongoError' || error.name === 'MongooseError') {
    statusCode = 500;
    code = 'DATABASE_ERROR';
    message = 'Database operation failed';
  } else if (error.name === 'MulterError') {
    statusCode = 400;
    code = 'FILE_UPLOAD_ERROR';
    message = 'File upload error';
    details = error.message;
  }

  // Send standardized error response
  const errorResponse = DatabaseSerializer.toApiError({
    code,
    message,
    details
  }, statusCode);

  res.status(statusCode).json(errorResponse);
};

/**
 * Async error wrapper for route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = ErrorTypes.NOT_FOUND(`Route ${req.method} ${req.originalUrl} not found`);
  next(error);
};

/**
 * Validation error handler for specific validation scenarios
 */
export const validationErrorHandler = (message: string, details?: any) => {
  return ErrorTypes.VALIDATION_ERROR(message, details);
};

/**
 * Database error handler
 */
export const databaseErrorHandler = (error: any) => {
  console.error('Database error:', error);
  
  if (error.code === '23505') { // Unique constraint violation
    return ErrorTypes.CONFLICT('Resource already exists');
  } else if (error.code === '23503') { // Foreign key constraint violation
    return ErrorTypes.VALIDATION_ERROR('Referenced resource does not exist');
  } else if (error.code === '23502') { // Not null constraint violation
    return ErrorTypes.VALIDATION_ERROR('Required field is missing');
  } else {
    return ErrorTypes.DATABASE_ERROR('Database operation failed');
  }
};

/**
 * Health check error handler
 */
export const healthCheckErrorHandler = (error: any) => {
  console.error('Health check error:', error);
  return ErrorTypes.SERVICE_UNAVAILABLE('Service health check failed');
};