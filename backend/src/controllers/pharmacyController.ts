import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../database';
import { 
  successResponse, 
  errorResponse
} from '../utils';

// Validation schemas
const createPrescriptionSchema = z.object({
  visitId: z.string().uuid("Visit ID ต้องเป็น UUID"),
  diagnosis: z.string().min(1, "กรุณาระบุการวินิจฉัย").max(500),
  totalAmount: z.number().min(0, "จำนวนเงินต้องไม่น้อยกว่า 0").optional(),
  notes: z.string().max(1000, "หมายเหตุต้องไม่เกิน 1000 ตัวอักษร").optional(),
  items: z.array(z.object({
    medicationName: z.string().min(1, "กรุณาระบุชื่อยา").max(200),
    dosage: z.string().min(1, "กรุณาระบุขนาดยา").max(100),
    frequency: z.string().min(1, "กรุณาระบุความถี่ในการใช้").max(100),
    duration: z.string().min(1, "กรุณาระบุระยะเวลาการใช้").max(100),
    quantity: z.number().min(1, "จำนวนยาต้องมากกว่า 0"),
    unitPrice: z.number().min(0, "ราคาต่อหน่วยต้องไม่น้อยกว่า 0").optional(),
    totalPrice: z.number().min(0, "ราคารวมต้องไม่น้อยกว่า 0").optional(),
    instructions: z.string().max(500, "คำแนะนำต้องไม่เกิน 500 ตัวอักษร").optional()
  })).min(1, "ต้องมีรายการยาอย่างน้อย 1 รายการ")
});

const updatePrescriptionSchema = z.object({
  status: z.enum(['pending', 'dispensed', 'completed', 'cancelled']).optional(),
  dispensedAt: z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, "รูปแบบวันที่ไม่ถูกต้อง").optional(),
  totalAmount: z.number().min(0).optional(),
  notes: z.string().max(1000).optional()
});

const updatePrescriptionItemSchema = z.object({
  dispensedQuantity: z.number().min(0, "จำนวนยาที่จ่ายต้องไม่น้อยกว่า 0").optional(),
  status: z.enum(['pending', 'dispensed', 'out_of_stock', 'substituted']).optional(),
  substituteMedication: z.string().max(200).optional(),
  notes: z.string().max(500).optional()
});

/**
 * สร้างใบสั่งยา
 * POST /api/medical/prescriptions
 */
export const createPrescription = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = createPrescriptionSchema.parse(req.body);
    
    // Check if visit exists and get patient_id
    const visitCheck = await db.query('SELECT id, patient_id FROM visits WHERE id = $1', [validatedData.visitId]);
    if (visitCheck.rows.length === 0) {
      return res.status(400).json(
        errorResponse('ไม่พบข้อมูลการมาพบแพทย์', 400)
      );
    }

    const patientId = visitCheck.rows[0].patient_id;

    // Generate prescription number
    const prescriptionNumberResult = await db.query(`
      SELECT COALESCE(MAX(CAST(SUBSTRING(prescription_number FROM 4) AS INTEGER)), 0) + 1 as next_number
      FROM prescriptions
      WHERE prescription_number LIKE 'RX%'
    `);
    const nextNumber = prescriptionNumberResult.rows[0].next_number;
    const prescriptionNumber = `RX${nextNumber.toString().padStart(6, '0')}`;

    // Calculate total amount from items if not provided
    let totalAmount = validatedData.totalAmount || 0;
    if (!validatedData.totalAmount) {
      totalAmount = validatedData.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    }

    // Start transaction
    await db.query('BEGIN');

    try {
      // Insert prescription
      const prescriptionResult = await db.query(`
        INSERT INTO prescriptions (
          visit_id, patient_id, prescription_number, diagnosis_for_prescription, total_cost, prescribed_by
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        validatedData.visitId,
        patientId,
        prescriptionNumber,
        validatedData.diagnosis,
        totalAmount,
        (req as any).user?.id
      ]);

      const prescriptionId = prescriptionResult.rows[0].id;

      // Insert prescription items
      const prescriptionItems = [];
      for (const item of validatedData.items) {
        const itemResult = await db.query(`
          INSERT INTO prescription_items (
            prescription_id, medication_name, dosage_instructions, 
            quantity_prescribed, unit_cost, total_cost
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `, [
          prescriptionId,
          item.medicationName,
          `${item.dosage} ${item.frequency} ${item.duration} ${item.instructions}`.trim(),
          item.quantity,
          item.unitPrice,
          item.totalPrice
        ]);

        prescriptionItems.push({
          id: itemResult.rows[0].id,
          prescriptionId: itemResult.rows[0].prescription_id,
          medicationName: itemResult.rows[0].medication_name,
          dosageInstructions: itemResult.rows[0].dosage_instructions,
          quantityPrescribed: itemResult.rows[0].quantity_prescribed,
          quantityDispensed: itemResult.rows[0].quantity_dispensed,
          unitCost: itemResult.rows[0].unit_cost,
          totalCost: itemResult.rows[0].total_cost,
          itemStatus: itemResult.rows[0].item_status,
          createdAt: itemResult.rows[0].created_at,
          updatedAt: itemResult.rows[0].updated_at
        });
      }

      // Commit transaction
      await db.query('COMMIT');

      // Map to camelCase response
      const prescription = {
        id: prescriptionResult.rows[0].id,
        visitId: prescriptionResult.rows[0].visit_id,
        patientId: prescriptionResult.rows[0].patient_id,
        prescriptionNumber: prescriptionResult.rows[0].prescription_number,
        diagnosisForPrescription: prescriptionResult.rows[0].diagnosis_for_prescription,
        totalCost: prescriptionResult.rows[0].total_cost,
        status: prescriptionResult.rows[0].status,
        prescribedBy: prescriptionResult.rows[0].prescribed_by,
        prescriptionDate: prescriptionResult.rows[0].prescription_date,
        dispensedBy: prescriptionResult.rows[0].dispensed_by,
        dispensedAt: prescriptionResult.rows[0].dispensed_at,
        createdAt: prescriptionResult.rows[0].created_at,
        updatedAt: prescriptionResult.rows[0].updated_at,
        items: prescriptionItems
      };

      res.status(201).json(
        successResponse('สร้างใบสั่งยาสำเร็จ', prescription)
      );

    } catch (error) {
      // Rollback transaction on error
      await db.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Create prescription error:', error);
    
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
 * ดึงข้อมูลใบสั่งยา
 * GET /api/medical/prescriptions/:id
 */
export const getPrescription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate UUID
    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      return res.status(400).json(
        errorResponse('รูปแบบ ID ไม่ถูกต้อง', 400)
      );
    }

    // Get prescription with doctor information
    const prescriptionResult = await db.query(`
      SELECT p.*, 
             u_prescribed.first_name as prescribed_by_first_name,
             u_prescribed.last_name as prescribed_by_last_name,
             u_dispensed.first_name as dispensed_by_first_name,
             u_dispensed.last_name as dispensed_by_last_name
      FROM prescriptions p
      LEFT JOIN users u_prescribed ON p.prescribed_by = u_prescribed.id
      LEFT JOIN users u_dispensed ON p.dispensed_by = u_dispensed.id
      WHERE p.id = $1
    `, [id]);

    if (prescriptionResult.rows.length === 0) {
      return res.status(404).json(
        errorResponse('ไม่พบข้อมูลใบสั่งยา', 404)
      );
    }

    // Get prescription items
    const itemsResult = await db.query(`
      SELECT * FROM prescription_items 
      WHERE prescription_id = $1 
      ORDER BY created_at ASC
    `, [id]);

    const prescriptionRow = prescriptionResult.rows[0];
    
    // Map to camelCase response
    const prescription = {
      id: prescriptionRow.id,
      visitId: prescriptionRow.visit_id,
      prescriptionNumber: prescriptionRow.prescription_number,
      diagnosis: prescriptionRow.diagnosis,
      totalAmount: prescriptionRow.total_amount,
      notes: prescriptionRow.notes,
      status: prescriptionRow.status,
      prescribedBy: prescriptionRow.prescribed_by_first_name && prescriptionRow.prescribed_by_last_name ? {
        firstName: prescriptionRow.prescribed_by_first_name,
        lastName: prescriptionRow.prescribed_by_last_name
      } : null,
      dispensedBy: prescriptionRow.dispensed_by_first_name && prescriptionRow.dispensed_by_last_name ? {
        firstName: prescriptionRow.dispensed_by_first_name,
        lastName: prescriptionRow.dispensed_by_last_name
      } : null,
      prescribedAt: prescriptionRow.prescribed_at,
      dispensedAt: prescriptionRow.dispensed_at,
      createdAt: prescriptionRow.created_at,
      updatedAt: prescriptionRow.updated_at,
      items: itemsResult.rows.map(item => ({
        id: item.id,
        prescriptionId: item.prescription_id,
        medicationName: item.medication_name,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        quantity: item.quantity,
        dispensedQuantity: item.dispensed_quantity,
        unitPrice: item.unit_price,
        totalPrice: item.total_price,
        instructions: item.instructions,
        status: item.status,
        substituteMedication: item.substitute_medication,
        notes: item.notes,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }))
    };

    res.json(
      successResponse('ดึงข้อมูลใบสั่งยาสำเร็จ', prescription)
    );

  } catch (error) {
    console.error('Get prescription error:', error);
    res.status(500).json(
      errorResponse('เกิดข้อผิดพลาดในระบบ', 500)
    );
  }
};

/**
 * อัปเดตใบสั่งยา
 * PUT /api/medical/prescriptions/:id
 */
export const updatePrescription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate UUID
    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      return res.status(400).json(
        errorResponse('รูปแบบ ID ไม่ถูกต้อง', 400)
      );
    }

    // Validate input
    const validatedData = updatePrescriptionSchema.parse(req.body);
    
    // Check if prescription exists
    const existingPrescription = await db.query('SELECT id FROM prescriptions WHERE id = $1', [id]);
    if (existingPrescription.rows.length === 0) {
      return res.status(404).json(
        errorResponse('ไม่พบข้อมูลใบสั่งยา', 404)
      );
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramIndex = 1;

    const fieldMappings = {
      status: 'status',
      dispensedAt: 'dispensed_at',
      totalAmount: 'total_amount',
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

    // Add dispensed_by if status is dispensed
    if (validatedData.status === 'dispensed') {
      updates.push(`dispensed_by = $${paramIndex}`);
      values.push((req as any).user?.userId);
      paramIndex++;
    }

    // Add updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const updateQuery = `
      UPDATE prescriptions 
      SET ${updates.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(updateQuery, values);

    // Map to camelCase response
    const prescription = {
      id: result.rows[0].id,
      visitId: result.rows[0].visit_id,
      prescriptionNumber: result.rows[0].prescription_number,
      diagnosis: result.rows[0].diagnosis,
      totalAmount: result.rows[0].total_amount,
      notes: result.rows[0].notes,
      status: result.rows[0].status,
      prescribedBy: result.rows[0].prescribed_by,
      dispensedBy: result.rows[0].dispensed_by,
      prescribedAt: result.rows[0].prescribed_at,
      dispensedAt: result.rows[0].dispensed_at,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    };

    res.json(
      successResponse('อัปเดตใบสั่งยาสำเร็จ', prescription)
    );

  } catch (error) {
    console.error('Update prescription error:', error);
    
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
 * อัปเดตรายการยาในใบสั่งยา
 * PUT /api/medical/prescription-items/:id
 */
export const updatePrescriptionItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate UUID
    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      return res.status(400).json(
        errorResponse('รูปแบบ ID ไม่ถูกต้อง', 400)
      );
    }

    // Validate input
    const validatedData = updatePrescriptionItemSchema.parse(req.body);
    
    // Check if prescription item exists
    const existingItem = await db.query('SELECT id FROM prescription_items WHERE id = $1', [id]);
    if (existingItem.rows.length === 0) {
      return res.status(404).json(
        errorResponse('ไม่พบข้อมูลรายการยา', 404)
      );
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramIndex = 1;

    const fieldMappings = {
      dispensedQuantity: 'dispensed_quantity',
      status: 'status',
      substituteMedication: 'substitute_medication',
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

    // Add updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const updateQuery = `
      UPDATE prescription_items 
      SET ${updates.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(updateQuery, values);

    // Map to camelCase response
    const prescriptionItem = {
      id: result.rows[0].id,
      prescriptionId: result.rows[0].prescription_id,
      medicationName: result.rows[0].medication_name,
      dosage: result.rows[0].dosage,
      frequency: result.rows[0].frequency,
      duration: result.rows[0].duration,
      quantity: result.rows[0].quantity,
      dispensedQuantity: result.rows[0].dispensed_quantity,
      unitPrice: result.rows[0].unit_price,
      totalPrice: result.rows[0].total_price,
      instructions: result.rows[0].instructions,
      status: result.rows[0].status,
      substituteMedication: result.rows[0].substitute_medication,
      notes: result.rows[0].notes,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    };

    res.json(
      successResponse('อัปเดตรายการยาสำเร็จ', prescriptionItem)
    );

  } catch (error) {
    console.error('Update prescription item error:', error);
    
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
 * ดึงข้อมูลใบสั่งยาของการมาพบแพทย์
 * GET /api/medical/visits/:visitId/prescriptions
 */
export const getPrescriptionsByVisit = async (req: Request, res: Response) => {
  try {
    const { visitId } = req.params;
    
    // Validate UUID
    if (!visitId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      return res.status(400).json(
        errorResponse('รูปแบบ Visit ID ไม่ถูกต้อง', 400)
      );
    }

    const result = await db.query(`
      SELECT p.*, 
             u_prescribed.first_name as prescribed_by_first_name,
             u_prescribed.last_name as prescribed_by_last_name
      FROM prescriptions p
      LEFT JOIN users u_prescribed ON p.prescribed_by = u_prescribed.id
      WHERE p.visit_id = $1
      ORDER BY p.created_at DESC
    `, [visitId]);

    // Map to camelCase response
    const prescriptions = result.rows.map(row => ({
      id: row.id,
      visitId: row.visit_id,
      patientId: row.patient_id,
      prescriptionNumber: row.prescription_number,
      diagnosisForPrescription: row.diagnosis_for_prescription,
      totalCost: row.total_cost,
      status: row.status,
      prescribedBy: row.prescribed_by_first_name && row.prescribed_by_last_name ? {
        firstName: row.prescribed_by_first_name,
        lastName: row.prescribed_by_last_name
      } : null,
      prescriptionDate: row.prescription_date,
      dispensedAt: row.dispensed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json(
      successResponse('ดึงข้อมูลใบสั่งยาสำเร็จ', prescriptions)
    );

  } catch (error) {
    console.error('Get prescriptions by visit error:', error);
    res.status(500).json(
      errorResponse('เกิดข้อผิดพลาดในระบบ', 500)
    );
  }
};
