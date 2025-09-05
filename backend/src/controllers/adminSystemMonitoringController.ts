import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';

/**
 * Admin System Monitoring Controller
 * ตรวจสอบสถานะระบบและสถิติสำหรับ Admin Panel
 */

/**
 * Get system health status
 * GET /api/admin/system/health
 */
export const getSystemHealth = async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();

    // Test database connection
    const dbStartTime = Date.now();
    const dbTest = await databaseManager.query('SELECT NOW() as current_time, version() as version');
    const dbResponseTime = Date.now() - dbStartTime;

    // Get system statistics
    const stats = await Promise.all([
      // User statistics
      databaseManager.query('SELECT COUNT(*) as total FROM users'),
      databaseManager.query('SELECT COUNT(*) as active FROM users WHERE is_active = true'),
      databaseManager.query('SELECT COUNT(*) as patients FROM users WHERE role = \'patient\''),
      databaseManager.query('SELECT COUNT(*) as doctors FROM users WHERE role = \'doctor\''),
      databaseManager.query('SELECT COUNT(*) as nurses FROM users WHERE role = \'nurse\''),
      
      // Patient statistics
      databaseManager.query('SELECT COUNT(*) as total FROM patients'),
      databaseManager.query('SELECT COUNT(*) as active FROM patients WHERE is_active = true'),
      
      // Visit statistics
      databaseManager.query('SELECT COUNT(*) as total FROM visits'),
      databaseManager.query('SELECT COUNT(*) as today FROM visits WHERE visit_date = CURRENT_DATE'),
      databaseManager.query('SELECT COUNT(*) as this_week FROM visits WHERE visit_date >= CURRENT_DATE - INTERVAL \'7 days\''),
      
      // Appointment statistics
      databaseManager.query('SELECT COUNT(*) as total FROM appointments'),
      databaseManager.query('SELECT COUNT(*) as pending FROM appointments WHERE status = \'pending\''),
      databaseManager.query('SELECT COUNT(*) as confirmed FROM appointments WHERE status = \'confirmed\''),
      
      // Lab orders statistics
      databaseManager.query('SELECT COUNT(*) as total FROM lab_orders'),
      databaseManager.query('SELECT COUNT(*) as pending FROM lab_orders WHERE status = \'pending\''),
      databaseManager.query('SELECT COUNT(*) as completed FROM lab_orders WHERE status = \'completed\''),
      
      // Prescription statistics
      databaseManager.query('SELECT COUNT(*) as total FROM prescriptions'),
      databaseManager.query('SELECT COUNT(*) as active FROM prescriptions WHERE status = \'active\''),
      databaseManager.query('SELECT COUNT(*) as dispensed FROM prescriptions WHERE status = \'dispensed\''),
    ]);

    const [
      totalUsers, activeUsers, patients, doctors, nurses,
      totalPatients, activePatients,
      totalVisits, todayVisits, weekVisits,
      totalAppointments, pendingAppointments, confirmedAppointments,
      totalLabOrders, pendingLabOrders, completedLabOrders,
      totalPrescriptions, activePrescriptions, dispensedPrescriptions
    ] = stats;

    const totalResponseTime = Date.now() - startTime;

    // Calculate system health score
    const healthScore = calculateHealthScore({
      dbResponseTime,
      totalResponseTime,
      activeUsers: parseInt(activeUsers.rows[0].active),
      todayVisits: parseInt(todayVisits.rows[0].today),
      pendingAppointments: parseInt(pendingAppointments.rows[0].pending)
    });

    res.status(200).json({
      data: {
        system_health: {
          status: healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'warning' : 'critical',
          score: healthScore,
          response_time: totalResponseTime,
          database: {
            status: 'connected',
            response_time: dbResponseTime,
            version: dbTest.rows[0].version,
            current_time: dbTest.rows[0].current_time
          }
        },
        statistics: {
          users: {
            total: parseInt(totalUsers.rows[0].total),
            active: parseInt(activeUsers.rows[0].active),
            patients: parseInt(patients.rows[0].patients),
            doctors: parseInt(doctors.rows[0].doctors),
            nurses: parseInt(nurses.rows[0].nurses)
          },
          patients: {
            total: parseInt(totalPatients.rows[0].total),
            active: parseInt(activePatients.rows[0].active)
          },
          visits: {
            total: parseInt(totalVisits.rows[0].total),
            today: parseInt(todayVisits.rows[0].today),
            this_week: parseInt(weekVisits.rows[0].this_week)
          },
          appointments: {
            total: parseInt(totalAppointments.rows[0].total),
            pending: parseInt(pendingAppointments.rows[0].pending),
            confirmed: parseInt(confirmedAppointments.rows[0].confirmed)
          },
          lab_orders: {
            total: parseInt(totalLabOrders.rows[0].total),
            pending: parseInt(pendingLabOrders.rows[0].pending),
            completed: parseInt(completedLabOrders.rows[0].completed)
          },
          prescriptions: {
            total: parseInt(totalPrescriptions.rows[0].total),
            active: parseInt(activePrescriptions.rows[0].active),
            dispensed: parseInt(dispensedPrescriptions.rows[0].dispensed)
          }
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        checked_by: (req as any).user.id
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error getting system health:', error);
    res.status(500).json({
      data: {
        system_health: {
          status: 'critical',
          score: 0,
          response_time: 0,
          database: {
            status: 'disconnected',
            response_time: 0,
            version: null,
            current_time: null
          }
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        error: 'System health check failed'
      },
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Get system statistics
 * GET /api/admin/system/stats
 */
export const getSystemStats = async (req: Request, res: Response) => {
  try {
    const { period = '30' } = req.query; // Default to last 30 days
    const days = parseInt(period as string);

    // Get date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Get comprehensive statistics
    const [
      // User growth
      userGrowthResult,
      // Visit trends
      visitTrendsResult,
      // Appointment trends
      appointmentTrendsResult,
      // Lab order trends
      labOrderTrendsResult,
      // Prescription trends
      prescriptionTrendsResult,
      // Department statistics
      departmentStatsResult,
      // Top performing doctors
      topDoctorsResult,
      // Recent activity
      recentActivityResult
    ] = await Promise.all([
      // User growth over time
      databaseManager.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as new_users,
          role
        FROM users 
        WHERE created_at >= $1 
        GROUP BY DATE(created_at), role
        ORDER BY date DESC
      `, [startDate]),

      // Visit trends
      databaseManager.query(`
        SELECT 
          DATE(visit_date) as date,
          COUNT(*) as visits,
          visit_type
        FROM visits 
        WHERE visit_date >= $1 
        GROUP BY DATE(visit_date), visit_type
        ORDER BY date DESC
      `, [startDate]),

      // Appointment trends
      databaseManager.query(`
        SELECT 
          DATE(appointment_date) as date,
          COUNT(*) as appointments,
          status
        FROM appointments 
        WHERE appointment_date >= $1 
        GROUP BY DATE(appointment_date), status
        ORDER BY date DESC
      `, [startDate]),

      // Lab order trends
      databaseManager.query(`
        SELECT 
          DATE(order_date) as date,
          COUNT(*) as lab_orders,
          status
        FROM lab_orders 
        WHERE order_date >= $1 
        GROUP BY DATE(order_date), status
        ORDER BY date DESC
      `, [startDate]),

      // Prescription trends
      databaseManager.query(`
        SELECT 
          DATE(prescription_date) as date,
          COUNT(*) as prescriptions,
          status
        FROM prescriptions 
        WHERE prescription_date >= $1 
        GROUP BY DATE(prescription_date), status
        ORDER BY date DESC
      `, [startDate]),

      // Department statistics
      databaseManager.query(`
        SELECT 
          d.department_name,
          COUNT(DISTINCT u.id) as staff_count,
          COUNT(DISTINCT v.id) as visit_count,
          COUNT(DISTINCT a.id) as appointment_count
        FROM departments d
        LEFT JOIN users u ON d.id = u.department_id
        LEFT JOIN visits v ON d.id = v.department_id
        LEFT JOIN appointments a ON d.id = a.department_id
        GROUP BY d.id, d.department_name
        ORDER BY visit_count DESC
      `),

      // Top performing doctors
      databaseManager.query(`
        SELECT 
          u.first_name,
          u.last_name,
          COUNT(v.id) as visit_count,
          COUNT(a.id) as appointment_count,
          AVG(EXTRACT(EPOCH FROM (v.updated_at - v.created_at))/3600) as avg_visit_duration_hours
        FROM users u
        LEFT JOIN visits v ON u.id = v.doctor_id
        LEFT JOIN appointments a ON u.id = a.doctor_id
        WHERE u.role = 'doctor' AND u.is_active = true
        GROUP BY u.id, u.first_name, u.last_name
        ORDER BY visit_count DESC
        LIMIT 10
      `),

      // Recent activity (last 24 hours)
      databaseManager.query(`
        SELECT 
          'visit' as activity_type,
          v.visit_number as reference,
          u.first_name || ' ' || u.last_name as user_name,
          v.created_at as timestamp
        FROM visits v
        JOIN users u ON v.doctor_id = u.id
        WHERE v.created_at >= NOW() - INTERVAL '24 hours'
        
        UNION ALL
        
        SELECT 
          'appointment' as activity_type,
          a.id::text as reference,
          u.first_name || ' ' || u.last_name as user_name,
          a.created_at as timestamp
        FROM appointments a
        JOIN users u ON a.doctor_id = u.id
        WHERE a.created_at >= NOW() - INTERVAL '24 hours'
        
        UNION ALL
        
        SELECT 
          'lab_order' as activity_type,
          lo.order_number as reference,
          u.first_name || ' ' || u.last_name as user_name,
          lo.created_at as timestamp
        FROM lab_orders lo
        JOIN users u ON lo.ordered_by = u.id
        WHERE lo.created_at >= NOW() - INTERVAL '24 hours'
        
        ORDER BY timestamp DESC
        LIMIT 20
      `)
    ]);

    res.status(200).json({
      data: {
        period: {
          days,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        },
        trends: {
          user_growth: userGrowthResult.rows,
          visits: visitTrendsResult.rows,
          appointments: appointmentTrendsResult.rows,
          lab_orders: labOrderTrendsResult.rows,
          prescriptions: prescriptionTrendsResult.rows
        },
        department_statistics: departmentStatsResult.rows,
        top_performers: {
          doctors: topDoctorsResult.rows
        },
        recent_activity: recentActivityResult.rows
      },
      meta: {
        timestamp: new Date().toISOString(),
        generated_by: (req as any).user.id
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error getting system stats:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Calculate system health score
 */
function calculateHealthScore(metrics: {
  dbResponseTime: number;
  totalResponseTime: number;
  activeUsers: number;
  todayVisits: number;
  pendingAppointments: number;
}): number {
  let score = 100;

  // Database response time penalty
  if (metrics.dbResponseTime > 1000) score -= 20;
  else if (metrics.dbResponseTime > 500) score -= 10;
  else if (metrics.dbResponseTime > 200) score -= 5;

  // Total response time penalty
  if (metrics.totalResponseTime > 5000) score -= 30;
  else if (metrics.totalResponseTime > 2000) score -= 15;
  else if (metrics.totalResponseTime > 1000) score -= 5;

  // System activity bonus
  if (metrics.activeUsers > 0) score += 5;
  if (metrics.todayVisits > 0) score += 5;
  if (metrics.pendingAppointments < 50) score += 5; // Low pending appointments is good

  return Math.max(0, Math.min(100, score));
}
