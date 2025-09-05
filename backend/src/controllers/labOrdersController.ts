import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';

/**
 * Lab Orders Controller
 * จัดการ lab orders สำหรับระบบ EMR
 */

/**
 * Create lab order for a visit
 * POST /api/medical/visits/{id}/lab-orders
 */
export const createLabOrder = async (req: Request, res: Response) => {
  try {
    const { id: visitId } = req.params;
    const {
      test_name,
      test_code,
      test_category,
      clinical_indication,
      specimen_type,
      priority = 'routine',
      requested_completion,
      notes
    } = req.body;

    const userId = (req as any).user.id;

    // Validate required fields
    if (!test_name || !test_category || !specimen_type) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: { message: 'Missing required fields: test_name, test_category, specimen_type' },
        statusCode: 400
      });
    }

    // Check if visit exists
    const visitExists = await databaseManager.query(
      'SELECT id, patient_id FROM visits WHERE id = $1',
      [visitId]
    );

    if (visitExists.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Visit not found' },
        statusCode: 404
      });
    }

    const visit = visitExists.rows[0];

    // Get a valid user ID if not provided
    let validUserId = userId;
    if (!validUserId || validUserId === '1') {
      const userResult = await databaseManager.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['doctor']);
      validUserId = userResult.rows[0]?.id;
    }
    
    // Validate user ID exists
    if (validUserId) {
      const userExists = await databaseManager.query('SELECT id FROM users WHERE id = $1', [validUserId]);
      if (userExists.rows.length === 0) {
        const fallbackUser = await databaseManager.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['doctor']);
        validUserId = fallbackUser.rows[0]?.id;
      }
    }

    // Generate order number
    const orderNumber = await generateLabOrderNumber();

    // Create lab order
    const labOrderId = uuidv4();
    const createLabOrderQuery = `
      INSERT INTO lab_orders (
        id, patient_id, visit_id, order_number, test_name, test_code,
        test_category, clinical_indication, specimen_type, priority,
        requested_completion, notes, ordered_by, order_date, order_time, status
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      )
      RETURNING *
    `;

    const now = new Date();
    const labOrderResult = await databaseManager.query(createLabOrderQuery, [
      labOrderId, visit.patient_id, visitId, orderNumber, test_name, test_code,
      test_category, clinical_indication, specimen_type, priority,
      requested_completion, notes, validUserId, now.toISOString().split('T')[0], 
      now.toTimeString().split(' ')[0], 'ordered'
    ]);

    const newLabOrder = labOrderResult.rows[0];

    res.status(201).json({
      data: {
        lab_order: {
          id: newLabOrder.id,
          order_number: newLabOrder.order_number,
          patient_id: newLabOrder.patient_id,
          visit_id: newLabOrder.visit_id,
          test_name: newLabOrder.test_name,
          test_code: newLabOrder.test_code,
          test_category: newLabOrder.test_category,
          clinical_indication: newLabOrder.clinical_indication,
          specimen_type: newLabOrder.specimen_type,
          priority: newLabOrder.priority,
          status: newLabOrder.status,
          order_date: newLabOrder.order_date,
          order_time: newLabOrder.order_time,
          created_at: newLabOrder.created_at
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        orderedBy: validUserId
      },
      error: null,
      statusCode: 201
    });

  } catch (error) {
    console.error('Error creating lab order:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Get lab orders for a visit
 * GET /api/medical/visits/{id}/lab-orders
 */
export const getLabOrders = async (req: Request, res: Response) => {
  try {
    const { id: visitId } = req.params;
    const { page = 1, limit = 10, status, test_category } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // Check if visit exists
    const visitExists = await databaseManager.query(
      'SELECT id, patient_id FROM visits WHERE id = $1',
      [visitId]
    );

    if (visitExists.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Visit not found' },
        statusCode: 404
      });
    }

    const visit = visitExists.rows[0];

    // Build query conditions
    let whereClause = 'WHERE lo.visit_id = $1';
    const queryParams: any[] = [visitId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      whereClause += ` AND lo.status = $${paramCount}`;
      queryParams.push(status);
    }

    if (test_category) {
      paramCount++;
      whereClause += ` AND lo.test_category = $${paramCount}`;
      queryParams.push(test_category);
    }

    // Get lab orders for the visit
    const labOrdersQuery = `
      SELECT 
        lo.id,
        lo.patient_id,
        lo.visit_id,
        lo.order_number,
        lo.test_name,
        lo.test_code,
        lo.test_category,
        lo.clinical_indication,
        lo.specimen_type,
        lo.priority,
        lo.requested_completion,
        lo.notes,
        lo.order_date,
        lo.order_time,
        lo.status,
        lo.created_at,
        lo.updated_at,
        u.first_name as ordered_by_first_name,
        u.last_name as ordered_by_last_name
      FROM lab_orders lo
      LEFT JOIN users u ON lo.ordered_by = u.id
      ${whereClause}
      ORDER BY lo.order_date DESC, lo.order_time DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(Number(limit), offset);

    const labOrdersResult = await databaseManager.query(labOrdersQuery, queryParams);
    const labOrders = labOrdersResult.rows;

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM lab_orders lo
      ${whereClause}
    `;
    const countResult = await databaseManager.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    // Get lab results for each order
    const labOrdersWithResults = await Promise.all(
      labOrders.map(async (order) => {
        const resultsQuery = `
          SELECT 
            lr.id,
            lr.result_value,
            lr.result_numeric,
            lr.result_unit,
            lr.reference_range,
            lr.reference_min,
            lr.reference_max,
            lr.abnormal_flag,
            lr.interpretation,
            lr.validated,
            lr.validated_by,
            lr.validated_at,
            lr.result_date,
            lr.result_time,
            lr.reported_at,
            lr.method,
            lr.instrument,
            lr.technician_notes,
            lr.pathologist_notes
          FROM lab_results lr
          WHERE lr.lab_order_id = $1
          ORDER BY lr.result_date DESC, lr.result_time DESC
        `;

        const results = await databaseManager.query(resultsQuery, [order.id]);

        return {
          id: order.id,
          order_number: order.order_number,
          patient_id: order.patient_id,
          visit_id: order.visit_id,
          test_name: order.test_name,
          test_code: order.test_code,
          test_category: order.test_category,
          clinical_indication: order.clinical_indication,
          specimen_type: order.specimen_type,
          priority: order.priority,
          requested_completion: order.requested_completion,
          notes: order.notes,
          order_date: order.order_date,
          order_time: order.order_time,
          status: order.status,
          ordered_by: order.ordered_by_first_name ? {
            name: `${order.ordered_by_first_name} ${order.ordered_by_last_name}`
          } : null,
          results: results.rows,
          created_at: order.created_at,
          updated_at: order.updated_at
        };
      })
    );

    res.json({
      data: {
        visit_id: visitId,
        patient_id: visit.patient_id,
        lab_orders: labOrdersWithResults,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        labOrdersCount: labOrdersWithResults.length,
        filters: {
          status,
          test_category
        }
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error getting lab orders:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Update lab order
 * PUT /api/medical/lab-orders/{id}
 */
export const updateLabOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if lab order exists
    const labOrderExists = await databaseManager.query(
      'SELECT id, status FROM lab_orders WHERE id = $1',
      [id]
    );

    if (labOrderExists.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Lab order not found' },
        statusCode: 404
      });
    }

    const labOrder = labOrderExists.rows[0];

    // Check if lab order can be updated
    if (labOrder.status === 'completed' || labOrder.status === 'cancelled') {
      return res.status(400).json({
        data: null,
        meta: null,
        error: { message: 'Cannot update completed or cancelled lab order' },
        statusCode: 400
      });
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    const allowedFields = [
      'test_name', 'test_code', 'test_category', 'clinical_indication',
      'specimen_type', 'priority', 'requested_completion', 'notes', 'status'
    ];

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

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(id);

    const updateQuery = `
      UPDATE lab_orders 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount + 1}
      RETURNING *
    `;

    const updateResult = await databaseManager.query(updateQuery, updateValues);
    const updatedLabOrder = updateResult.rows[0];

    res.json({
      data: {
        lab_order: {
          id: updatedLabOrder.id,
          order_number: updatedLabOrder.order_number,
          test_name: updatedLabOrder.test_name,
          test_category: updatedLabOrder.test_category,
          status: updatedLabOrder.status,
          updated_at: updatedLabOrder.updated_at
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        updatedFields: Object.keys(updateData)
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error updating lab order:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Helper function to generate lab order number
 */
async function generateLabOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const result = await databaseManager.query(`
    SELECT COUNT(*) as count 
    FROM lab_orders 
    WHERE order_number LIKE $1
  `, [`LAB${year}%`]);
  
  const count = parseInt(result.rows[0].count) + 1;
  return `LAB${year}${count.toString().padStart(6, '0')}`;
}
