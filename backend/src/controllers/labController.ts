import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../database';
import { 
  successResponse, 
  errorResponse
} from '../utils';

// Validation schemas
const createLabOrderSchema = z.object({
  visitId: z.string().uuid("Visit ID ต้องเป็น UUID"),
  Category: z.enum(['blood', 'urine', 'stool', 'imaging', 'other'], {
    errorMap: () => ({ message: "ประเภทการตรวจไม่ถูกต้อง" })
  }),
  Name: z.string().min(1, "กรุณาระบุชื่อการตรวจ").max(200),
  Code: z.string().min(1, "กรุณาระบุรหัสการตรวจ").max(50),
  clinicalIndication: z.string().max(1000, "ข้อบ่งชี้ทางคลินิกต้องไม่เกิน 1000 ตัวอักษร").optional(),
  priority: z.enum(['routine', 'urgent', 'stat'], {
    errorMap: () => ({ message: "ระดับความเร่งด่วนไม่ถูกต้อง" })
  }).default('routine'),
  notes: z.string().max(1000, "หมายเหตุต้องไม่เกิน 1000 ตัวอักษร").optional()
});

const createLabResultSchema = z.object({
  labOrderId: z.string().uuid("Lab Order ID ต้องเป็น UUID"),
  Parameter: z.string().min(1, "กรุณาระบุพารามิเตอร์การตรวจ").max(200),
  result: z.string().min(1, "กรุณาระบุผลการตรวจ").max(500),
  unit: z.string().max(50, "หน่วยต้องไม่เกิน 50 ตัวอักษร").optional(),
  referenceRange: z.string().max(200, "ช่วงค่าปกติต้องไม่เกิน 200 ตัวอักษร").optional(),
  flag: z.enum(['normal', 'high', 'low', 'abnormal']).default('normal'),
  notes: z.string().max(1000, "หมายเหตุต้องไม่เกิน 1000 ตัวอักษร").optional()
});

const updateLabOrderSchema = z.object({
  status: z.enum(['pending', 'collected', 'processing', 'completed', 'cancelled']).optional(),
  collectionDate: z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, "รูปแบบวันที่ไม่ถูกต้อง").optional(),
  instructions: z.string().max(1000).optional(),
  notes: z.string().max(1000).optional()
});

/**
 * สร้างใบสั่งตรวจทางห้องปฏิบัติการ
 * POST /api/medical/lab-orders
 */
export const createLabOrder = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = createLabOrderSchema.parse(req.body);
    
    // Check if visit exists and get patient_id
    const visitCheck = await db.query('SELECT id, patient_id FROM visits WHERE id = $1', [validatedData.visitId]);
    if (visitCheck.rows.length === 0) {
      return res.status(400).json(
        errorResponse('ไม่พบข้อมูลการมาพบแพทย์', 400)
      );
    }

    const patientId = visitCheck.rows[0].patient_id;

    // Generate lab order number
    const orderNumberResult = await db.query(`
      SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 4) AS INTEGER)), 0) + 1 as next_number
      FROM lab_orders
      WHERE order_number LIKE 'LAB%'
    `);
    const nextNumber = orderNumberResult.rows[0].next_number;
    const orderNumber = `LAB${nextNumber.toString().padStart(6, '0')}`;

    // Insert lab order
    const result = await db.query(`
      INSERT INTO lab_orders (
        visit_id, patient_id, order_number, _category, _name, _code, 
        clinical_indication, priority, ordered_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *    `, [
      validatedData.visitId,
      patientId,
      orderNumber,
      validatedData.Category, // This will be mapped to _category
      validatedData.Name,
      validatedData.Code,
      validatedData.clinicalIndication, // This will be mapped to clinical_indication
      validatedData.priority,
      (req as any).user?.id // From auth middleware
    ]);

    // Map to camelCase response
    const labOrder = {
      id: result.rows[0].id,
      visitId: result.rows[0].visit_id,
      patientId: result.rows[0].patient_id,
      orderNumber: result.rows[0].order_number,
      Category: result.rows[0]._category,
      Name: result.rows[0]._name,
      Code: result.rows[0]._code,
      clinicalIndication: result.rows[0].clinical_indication,
      priority: result.rows[0].priority,
      status: result.rows[0].status,
      orderedBy: result.rows[0].ordered_by,
      orderDate: result.rows[0].order_date,
      collectionDate: result.rows[0].collection_date,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    };

    res.status(201).json(
      successResponse('สร้างใบสั่งตรวจทางห้องปฏิบัติการสำเร็จ', labOrder)
    );

  } catch (error) {
    console.error('Create lab order error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json(
        errorResponse('ข้อมูลไม่ถูกต้อง', 400, error.errors)
      );
    }
    
    res.status(500).json(
      errorResponse('เกิดข้อผิดพลาดในระบบ', 500)
    );
  }
};

/**
 * ดึงข้อมูลใบสั่งตรวจทางห้องปฏิบัติการ
 * GET /api/medical/lab-orders/:id
 */
export const getLabOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate UUID
    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      return res.status(400).json(
        errorResponse('รูปแบบ ID ไม่ถูกต้อง', 400)
      );
    }

    const result = await db.query(`
      SELECT lo.*, 
             u_ordered.first_name as ordered_by_first_name,
             u_ordered.last_name as ordered_by_last_name,
             u_collected.first_name as collected_by_first_name,
             u_collected.last_name as collected_by_last_name
      FROM lab_orders lo
      LEFT JOIN users u_ordered ON lo.ordered_by = u_ordered.id
      LEFT JOIN users u_collected ON lo.collected_by = u_collected.id
      WHERE lo.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json(
        errorResponse('ไม่พบข้อมูลใบสั่งตรวจ', 404)
      );
    }

    const row = result.rows[0];
    
    // Map to camelCase response
    const labOrder = {
      id: row.id,
      visitId: row.visit_id,
      orderNumber: row.order_number,
      Type: row._type,
      Name: row._name,
      Code: row._code,
      instructions: row.instructions,
      priority: row.priority,
      status: row.status,
      fasting: row.fasting,
      notes: row.notes,
      orderedBy: row.ordered_by_first_name && row.ordered_by_last_name ? {
        firstName: row.ordered_by_first_name,
        lastName: row.ordered_by_last_name
      } : null,
      collectedBy: row.collected_by_first_name && row.collected_by_last_name ? {
        firstName: row.collected_by_first_name,
        lastName: row.collected_by_last_name
      } : null,
      orderedAt: row.ordered_at,
      collectionDate: row.collection_date,
      reportedAt: row.reported_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    res.json(
      successResponse('ดึงข้อมูลใบสั่งตรวจสำเร็จ', labOrder)
    );

  } catch (error) {
    console.error('Get lab order error:', error);
    res.status(500).json(
      errorResponse('เกิดข้อผิดพลาดในระบบ', 500)
    );
  }
};

/**
 * อัปเดตใบสั่งตรวจทางห้องปฏิบัติการ
 * PUT /api/medical/lab-orders/:id
 */
export const updateLabOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate UUID
    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      return res.status(400).json(
        errorResponse('รูปแบบ ID ไม่ถูกต้อง', 400)
      );
    }

    // Validate input
    const validatedData = updateLabOrderSchema.parse(req.body);
    
    // Check if lab order exists
    const existingOrder = await db.query('SELECT id FROM lab_orders WHERE id = $1', [id]);
    if (existingOrder.rows.length === 0) {
      return res.status(404).json(
        errorResponse('ไม่พบข้อมูลใบสั่งตรวจ', 404)
      );
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramIndex = 1;

    const fieldMappings = {
      status: 'status',
      collectionDate: 'collection_date',
      instructions: 'instructions',
      notes: 'notes'
    };

    for (const [key, dbField] of Object.entries(fieldMappings)) {
      if (validatedData[key as keyof typeof validatedData] !== undefined) {
        updates.push(`${dbField} = $${paramIndex}`);
        values.push(validatedData[key as keyof typeof validatedData]);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return res.status(400).json(
        errorResponse('ไม่มีข้อมูลที่ต้องอัปเดต', 400)
      );
    }

    // Add collected_by if status is collected
    if (validatedData.status === 'collected') {
      updates.push(`collected_by = $${paramIndex}`);
      values.push((req as any).user?.userId);
      paramIndex++;
    }

    // Add updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const updateQuery = `
      UPDATE lab_orders 
      SET ${updates.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(updateQuery, values);

    // Map to camelCase response
    const labOrder = {
      id: result.rows[0].id,
      visitId: result.rows[0].visit_id,
      orderNumber: result.rows[0].order_number,
      Type: result.rows[0]._type,
      Name: result.rows[0]._name,
      Code: result.rows[0]._code,
      instructions: result.rows[0].instructions,
      priority: result.rows[0].priority,
      status: result.rows[0].status,
      fasting: result.rows[0].fasting,
      notes: result.rows[0].notes,
      orderedBy: result.rows[0].ordered_by,
      collectedBy: result.rows[0].collected_by,
      orderedAt: result.rows[0].ordered_at,
      collectionDate: result.rows[0].collection_date,
      reportedAt: result.rows[0].reported_at,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    };

    res.json(
      successResponse('อัปเดตใบสั่งตรวจสำเร็จ', labOrder)
    );

  } catch (error) {
    console.error('Update lab order error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json(
        errorResponse('ข้อมูลไม่ถูกต้อง', 400, error.errors)
      );
    }
    
    res.status(500).json(
      errorResponse('เกิดข้อผิดพลาดในระบบ', 500)
    );
  }
};

/**
 * สร้างผลตรวจทางห้องปฏิบัติการ
 * POST /api/medical/lab-results
 */
export const createLabResult = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = createLabResultSchema.parse(req.body);
    
    // Check if lab order exists
    const orderCheck = await db.query('SELECT id FROM lab_orders WHERE id = $1', [validatedData.labOrderId]);
    if (orderCheck.rows.length === 0) {
      return res.status(400).json(
        errorResponse('ไม่พบข้อมูลใบสั่งตรวจ', 400)
      );
    }

    // Insert lab result
    const result = await db.query(`
      INSERT INTO lab_results (
        lab_order_id, _parameter, result, unit, reference_range, flag, notes, reported_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      validatedData.labOrderId,
      validatedData.Parameter,
      validatedData.result,
      validatedData.unit,
      validatedData.referenceRange,
      validatedData.flag,
      validatedData.notes,
      (req as any).user?.userId
    ]);

    // Update lab order status to completed
    await db.query(`
      UPDATE lab_orders 
      SET status = 'completed', reported_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [validatedData.labOrderId]);

    // Map to camelCase response
    const labResult = {
      id: result.rows[0].id,
      labOrderId: result.rows[0].lab_order_id,
      Parameter: result.rows[0]._parameter,
      result: result.rows[0].result,
      unit: result.rows[0].unit,
      referenceRange: result.rows[0].reference_range,
      flag: result.rows[0].flag,
      notes: result.rows[0].notes,
      reportedBy: result.rows[0].reported_by,
      reportedAt: result.rows[0].reported_at,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    };

    res.status(201).json(
      successResponse('บันทึกผลตรวจทางห้องปฏิบัติการสำเร็จ', labResult)
    );

  } catch (error) {
    console.error('Create lab result error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json(
        errorResponse('ข้อมูลไม่ถูกต้อง', 400, error.errors)
      );
    }
    
    res.status(500).json(
      errorResponse('เกิดข้อผิดพลาดในระบบ', 500)
    );
  }
};

/**
 * ดึงข้อมูลผลตรวจทางห้องปฏิบัติการ
 * GET /api/medical/lab-orders/:labOrderId/results
 */
export const getLabResults = async (req: Request, res: Response) => {
  try {
    const { labOrderId } = req.params;
    
    // Validate UUID
    if (!labOrderId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      return res.status(400).json(
        errorResponse('รูปแบบ Lab Order ID ไม่ถูกต้อง', 400)
      );
    }

    const result = await db.query(`
      SELECT lr.*, 
             u.first_name as reported_by_first_name,
             u.last_name as reported_by_last_name
      FROM lab_results lr
      LEFT JOIN users u ON lr.reported_by = u.id
      WHERE lr.lab_order_id = $1
      ORDER BY lr.reported_at DESC
    `, [labOrderId]);

    // Map to camelCase response
    const labResults = result.rows.map(row => ({
      id: row.id,
      labOrderId: row.lab_order_id,
      Parameter: row._parameter,
      result: row.result,
      unit: row.unit,
      referenceRange: row.reference_range,
      flag: row.flag,
      notes: row.notes,
      reportedBy: row.reported_by_first_name && row.reported_by_last_name ? {
        firstName: row.reported_by_first_name,
        lastName: row.reported_by_last_name
      } : null,
      reportedAt: row.reported_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json(
      successResponse('ดึงข้อมูลผลตรวจสำเร็จ', labResults)
    );

  } catch (error) {
    console.error('Get lab results error:', error);
    res.status(500).json(
      errorResponse('เกิดข้อผิดพลาดในระบบ', 500)
    );
  }
};

/**
 * ดึงข้อมูลใบสั่งตรวจทางห้องปฏิบัติการของการมาพบแพทย์
 * GET /api/medical/visits/:visitId/lab-orders
 */
export const getLabOrdersByVisit = async (req: Request, res: Response) => {
  try {
    const { visitId } = req.params;
    
    // Validate UUID
    if (!visitId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      return res.status(400).json(
        errorResponse('รูปแบบ Visit ID ไม่ถูกต้อง', 400)
      );
    }

    const result = await db.query(`
      SELECT lo.*, 
             u_ordered.first_name as ordered_by_first_name,
             u_ordered.last_name as ordered_by_last_name
      FROM lab_orders lo
      LEFT JOIN users u_ordered ON lo.ordered_by = u_ordered.id
      WHERE lo.visit_id = $1
      ORDER BY lo.created_at DESC
    `, [visitId]);

    // Map to camelCase response
    const labOrders = result.rows.map(row => ({
      id: row.id,
      visitId: row.visit_id,
      patientId: row.patient_id,
      orderNumber: row.order_number,
      Category: row._category,
      Name: row._name,
      Code: row._code,
      clinicalIndication: row.clinical_indication,
      priority: row.priority,
      status: row.status,
      orderDate: row.order_date,
      collectionDate: row.collection_date,
      orderedBy: row.ordered_by_first_name && row.ordered_by_last_name ? {
        firstName: row.ordered_by_first_name,
        lastName: row.ordered_by_last_name
      } : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json(
      successResponse('ดึงข้อมูลใบสั่งตรวจสำเร็จ', labOrders)
    );

  } catch (error) {
    console.error('Get lab orders by visit error:', error);
    res.status(500).json(
      errorResponse('เกิดข้อผิดพลาดในระบบ', 500)
    );
  }
};
