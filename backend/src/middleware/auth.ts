import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { databaseManager } from '../database/connection';

// Create a database helper that combines databaseManager and DatabaseSchema
const db = {
  ...databaseManager,
  query: databaseManager.query.bind(databaseManager),
  transaction: databaseManager.transaction.bind(databaseManager),
  getUserById: async (userId: string) => {
    const query = `
      SELECT id, username, email, first_name, last_name,
             role, is_active, profile_completed, email_verified,
             created_at, updated_at
      FROM users WHERE id = $1
    `;
    const result = await databaseManager.query(query, [userId]);
    return result.rows[0] || null;
  }
};
import config from '../config';
import { User } from '../types';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and adds user to request
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret) as any;
    
    // Get user from database to check if still active
    const user = await db.getUserById(decoded.sub || decoded.userId);
    
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'User account is inactive'
      });
    }
    
    // Add user to request
    req.user = user;
    next();
    
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Authorization middleware
 * Checks if user has required role
 */
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    
    next();
  };
};

/**
 * Optional authentication middleware
 * Adds user to request if token is provided, but doesn't require it
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // No token provided, continue without user
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret) as any;
    const user = await db.getUserById(decoded.sub);
    
    if (user && user.is_active) {
      req.user = user;
    }
    
    next();
    
  } catch (error) {
    // Token is invalid, but we don't want to stop the request
    next();
  }
};

/**
 * Department-based authorization middleware
 * Check if user belongs to specific department
 */
export const authorizeByDepartment = (allowedDepartments: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      if (!user.department_id || !allowedDepartments.includes(user.department_id)) {
        return res.status(403).json({
          success: false,
          message: 'Department access denied'
        });
      }

      next();
    } catch (error) {
      console.error('Department authorization error:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
};

/**
 * Resource ownership authorization middleware
 * Check if user owns the resource or has admin privileges
 */
export const authorizeResourceOwnership = (userIdField: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      // Admin can access any resource
      if (user.role === 'admin' || user.role === 'consent_admin') {
        return next();
      }

      // Check resource ownership
      const resourceUserId = req.params[userIdField] || req.body[userIdField];
      
      if (!resourceUserId) {
        return res.status(400).json({
          success: false,
          message: 'Resource user ID is required'
        });
      }

      if (resourceUserId !== user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Resource ownership required'
        });
      }

      next();
    } catch (error) {
      console.error('Resource ownership authorization error:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
};
