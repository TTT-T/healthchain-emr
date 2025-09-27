import { Request, Response } from 'express';
import { z } from 'zod';
import { databaseManager } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';

/**
 * Admin User Management Controller
 * จัดการผู้ใช้สำหรับ Admin Panel
 */

/**
 * Get all users with pagination and filtering
 * GET /api/admin/users
 */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      role, 
      status,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // Build query conditions
    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereClause += ` AND (u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount} OR u.email ILIKE $${paramCount} OR u.username ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    if (role) {
      paramCount++;
      whereClause += ` AND u.role = $${paramCount}`;
      queryParams.push(role);
    }

    if (status) {
      paramCount++;
      whereClause += ` AND u.is_active = $${paramCount}`;
      queryParams.push(status === 'active');
    }

    // Validate sortBy
    const allowedSortFields = ['created_at', 'username', 'first_name', 'last_name', 'email', 'role', 'last_login'];
    const validSortBy = allowedSortFields.includes(sortBy as string) ? sortBy : 'created_at';
    const validSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Get users with pagination
    const usersQuery = `
      SELECT 
        u.id,
        u.username,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        u.is_active,
        u.last_login,
        u.created_at,
        u.updated_at,
        d.department_name,
        COALESCE(visit_counts.visit_count, 0) as visit_count,
        COALESCE(appointment_counts.appointment_count, 0) as appointment_count
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN (
        SELECT attending_doctor_id, COUNT(*) as visit_count 
        FROM visits 
        GROUP BY attending_doctor_id
      ) visit_counts ON u.id = visit_counts.attending_doctor_id
      LEFT JOIN (
        SELECT doctor_id, COUNT(*) as appointment_count 
        FROM appointments 
        GROUP BY doctor_id
      ) appointment_counts ON u.id = appointment_counts.doctor_id
      ${whereClause}
      ORDER BY u.${validSortBy} ${validSortOrder}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(Number(limit), offset);
    const usersResult = await databaseManager.query(usersQuery, queryParams);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      ${whereClause}
    `;
    const countResult = await databaseManager.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    // Format response
    const formattedUsers = usersResult.rows.map(user => ({
      id: user.id,
      username: user.username,
      name: `${user.first_name} ${user.last_name}`,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      status: user.is_active ? 'active' : 'inactive',
      department: user.department_name,
      last_login: user.last_login,
      visit_count: parseInt(user.visit_count),
      appointment_count: parseInt(user.appointment_count),
      created_at: user.created_at,
      updated_at: user.updated_at
    }));

    res.status(200).json({
      data: {
        users: formattedUsers,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        userCount: formattedUsers.length,
        filters: {
          search,
          role,
          status,
          sortBy: validSortBy,
          sortOrder: validSortOrder
        }
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error getting all users:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Get user by ID
 * GET /api/admin/users/{id}
 */
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const userQuery = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        u.is_active,
        u.last_login,
        u.created_at,
        u.updated_at,
        d.department_name,
        COUNT(DISTINCT v.id) as visit_count,
        COUNT(DISTINCT a.id) as appointment_count,
        COUNT(DISTINCT p.id) as patient_count
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN visits v ON u.id = v.attending_doctor_id
      LEFT JOIN appointments a ON u.id = a.doctor_id
      LEFT JOIN patients p ON u.id = p.user_id
      WHERE u.id = $1
      GROUP BY u.id, d.department_name
    `;

    const userResult = await databaseManager.query(userQuery, [id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'User not found' },
        statusCode: 404
      });
    }

    const user = userResult.rows[0];

    // Get recent activity
    const recentVisits = await databaseManager.query(`
      SELECT id, visit_number, visit_date, patient_id
      FROM visits 
      WHERE attending_doctor_id = $1 
      ORDER BY visit_date DESC 
      LIMIT 5
    `, [id]);

    const recentAppointments = await databaseManager.query(`
      SELECT id, start_time as appointment_date, patient_id, status
      FROM appointments 
      WHERE doctor_id = $1 
      ORDER BY start_time DESC 
      LIMIT 5
    `, [id]);

    res.status(200).json({
      data: {
        user: {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          role: user.role,
          status: user.is_active ? 'active' : 'inactive',
          department: user.department_name,
          last_login: user.last_login,
          created_at: user.created_at,
          updated_at: user.updated_at,
          statistics: {
            visit_count: parseInt(user.visit_count),
            appointment_count: parseInt(user.appointment_count),
            patient_count: parseInt(user.patient_count)
          },
          recent_activity: {
            visits: recentVisits.rows,
            appointments: recentAppointments.rows
          }
        }
      },
      meta: {
        timestamp: new Date().toISOString()
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error getting user by ID:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Create new user
 * POST /api/admin/users
 */
export const createUser = async (req: Request, res: Response) => {
  try {
    const {
      first_name,
      last_name,
      email,
      password,
      role,
      department_id,
      phone,
      is_active = true,
      title
    } = req.body;

    const userId = (req as any).user.id;

    // Import and use standardized schema validation
    const { CreateUserSchema } = await import('../schemas/user');
    
    // Transform snake_case input to camelCase for validation
    const validationData = {
      firstName: first_name,
      lastName: last_name,
      email,
      password,
      role,
      phoneNumber: phone
    };
    
    // Validate using Zod schema
    const validatedData = CreateUserSchema.parse(validationData);

    // Check if email already exists
    const existingUser = await databaseManager.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        data: null,
        meta: null,
        error: { message: 'Email already exists' },
        statusCode: 409
      });
    }

    // Get a valid department ID if not provided
    let validDepartmentId = department_id;
    if (!validDepartmentId) {
      const deptResult = await databaseManager.query('SELECT id FROM departments LIMIT 1');
      validDepartmentId = deptResult.rows[0]?.id;
    }

    // Hash password (in real implementation, use bcrypt)
    const hashedPassword = password; // Note: Password hashing should be implemented

    // Create user
    const createUserQuery = `
      INSERT INTO users (
        id, first_name, last_name, email, password_hash, role, 
        department_id, phone, is_active, title
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      )
      RETURNING *
    `;

    const newUserId = uuidv4();
    const userResult = await databaseManager.query(createUserQuery, [
      newUserId, first_name, last_name, email, hashedPassword, role,
      validDepartmentId, phone, is_active, title || null
    ]);

    const newUser = userResult.rows[0];

    res.status(201).json({
      data: {
        user: {
          id: newUser.id,
          name: `${newUser.first_name} ${newUser.last_name}`,
          email: newUser.email,
          role: newUser.role,
          status: newUser.is_active ? 'active' : 'inactive',
          created_at: newUser.created_at
        }
      },
      meta: {
        timestamp: new Date().toISOString()
      },
      error: null,
      statusCode: 201
    });

  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: { 
          message: 'Validation error',
          details: error.errors 
        },
        statusCode: 400
      });
    }
    
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Update user
 * PUT /api/admin/users/{id}
 */
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if user exists
    const userExists = await databaseManager.query('SELECT id FROM users WHERE id = $1', [id]);
    if (userExists.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'User not found' },
        statusCode: 404
      });
    }

    // Build update query
    const allowedFields = [
      'first_name', 'last_name', 'email', 'role', 'department_id', 
      'phone', 'is_active'
    ];

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramCount = 0;

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        paramCount++;
        updateFields.push(`${key} = $${paramCount}`);
        updateValues.push(value);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: { message: 'No valid fields to update' },
        statusCode: 400
      });
    }

    // Add updated_at
    paramCount++;
    updateFields.push(`updated_at = $${paramCount}`);
    updateValues.push(new Date());

    // Add user ID for WHERE clause
    paramCount++;
    updateValues.push(id);

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const updateResult = await databaseManager.query(updateQuery, updateValues);
    const updatedUser = updateResult.rows[0];

    res.status(200).json({
      data: {
        user: {
          id: updatedUser.id,
          name: `${updatedUser.first_name} ${updatedUser.last_name}`,
          email: updatedUser.email,
          role: updatedUser.role,
          status: updatedUser.is_active ? 'active' : 'inactive',
          updated_at: updatedUser.updated_at
        }
      },
      meta: {
        timestamp: new Date().toISOString()
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Delete user (soft delete)
 * DELETE /api/admin/users/{id}
 */
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    // Check if user exists
    const userExists = await databaseManager.query('SELECT id, role FROM users WHERE id = $1', [id]);
    if (userExists.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'User not found' },
        statusCode: 404
      });
    }

    const user = userExists.rows[0];

    // Prevent deleting admin users
    if (user.role === 'admin') {
      return res.status(403).json({
        data: null,
        meta: null,
        error: { message: 'Cannot delete admin users' },
        statusCode: 403
      });
    }

    // Prevent self-deletion
    if (id === userId) {
      return res.status(403).json({
        data: null,
        meta: null,
        error: { message: 'Cannot delete your own account' },
        statusCode: 403
      });
    }

    // Soft delete by setting is_active to false
    const deleteQuery = `
      UPDATE users 
      SET is_active = false, updated_at = $1
      WHERE id = $2
      RETURNING *
    `;

    const deleteResult = await databaseManager.query(deleteQuery, [new Date(), id]);
    const deletedUser = deleteResult.rows[0];

    res.status(200).json({
      data: {
        user: {
          id: deletedUser.id,
          name: `${deletedUser.first_name} ${deletedUser.last_name}`,
          email: deletedUser.email,
          role: deletedUser.role,
          status: 'inactive',
          deleted_at: deletedUser.updated_at
        }
      },
      meta: {
        timestamp: new Date().toISOString()
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};
