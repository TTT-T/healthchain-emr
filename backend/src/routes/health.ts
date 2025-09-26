import { Router, Request, Response } from 'express';
import { db } from '../database';

const router = Router();

/**
 * Health check endpoint - Standardized format
 * Supports both /health and /healthz for compatibility
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    
    // Check database connection
    await db.query('SELECT 1');
    const dbResponseTime = Date.now() - startTime;
    
    const healthStatus = {
      data: {
        status: 'ok',
        time: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        services: {
          database: {
            status: 'connected',
            responseTime: `${dbResponseTime}ms`
          },
          api: {
            status: 'running',
            port: process.env.PORT || 3001
          }
        },
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB'
        }
      },
      meta: null,
      error: null,
      statusCode: 200
    };
    
    res.status(200).json(healthStatus);
  } catch (error) {
    console.error('Health check failed:', error);
    
    res.status(503).json({
      data: null,
      meta: null,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service unavailable',
        details: {
          database: {
            status: 'disconnected',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      },
      statusCode: 503
    });
  }
});

/**
 * Kubernetes-style health check endpoint
 */
router.get('/healthz', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    
    // Check database connection
    await db.query('SELECT 1');
    const dbResponseTime = Date.now() - startTime;
    
    // Simple health check for Kubernetes
    const healthStatus = {
      data: {
        status: 'ok',
        time: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        database: {
          status: 'connected',
          responseTime: `${dbResponseTime}ms`
        }
      },
      meta: null,
      error: null,
      statusCode: 200
    };
    
    res.status(200).json(healthStatus);
  } catch (error) {
    console.error('Health check failed:', error);
    
    res.status(503).json({
      data: null,
      meta: null,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service unavailable',
        details: {
          database: {
            status: 'disconnected',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      },
      statusCode: 503
    });
  }
});

/**
 * Detailed health check
 */
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    const checks = {
      database: await checkDatabase(),
      memory: checkMemory(),
      disk: checkDisk(),
      network: checkNetwork()
    };
    
    const allHealthy = Object.values(checks).every(check => check.status === 'healthy');
    
    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Check database health
 */
async function checkDatabase() {
  try {
    const startTime = Date.now();
    await db.query('SELECT 1');
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      message: 'Database connection successful'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Database connection failed'
    };
  }
}

/**
 * Check memory usage
 */
function checkMemory() {
  const memoryUsage = process.memoryUsage();
  const usedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
  const totalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
  const usagePercent = Math.round((usedMB / totalMB) * 100);
  
  return {
    status: usagePercent > 90 ? 'warning' : 'healthy',
    used: `${usedMB}MB`,
    total: `${totalMB}MB`,
    usagePercent: `${usagePercent}%`
  };
}

/**
 * Check disk space (simplified)
 */
function checkDisk() {
  // This is a simplified check - in production you'd use a proper disk space library
  return {
    status: 'healthy',
    message: 'Disk space check not implemented'
  };
}

/**
 * Check network connectivity (simplified)
 */
function checkNetwork() {
  return {
    status: 'healthy',
    message: 'Network connectivity check not implemented'
  };
}

export default router;
