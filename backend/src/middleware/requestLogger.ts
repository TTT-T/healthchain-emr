import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Extend Request interface to include custom properties
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      startTime?: number;
    }
  }
}

/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Generate unique request ID
  req.requestId = uuidv4();
  req.startTime = Date.now();

  // Log incoming request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`, {
    requestId: req.requestId,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentLength: req.get('Content-Length'),
    contentType: req.get('Content-Type')
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - (req.startTime || 0);
    const logLevel = res.statusCode >= 400 ? 'ERROR' : 'INFO';
    
    console.log(`[${new Date().toISOString()}] ${logLevel} ${res.statusCode} ${req.method} ${req.url}`, {
      requestId: req.requestId,
      duration: `${duration}ms`,
      statusCode: res.statusCode,
      contentLength: res.get('Content-Length')
    });
  });

  next();
};
