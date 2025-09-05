import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../database';
import { 
  successResponse, 
  errorResponse
} from '../utils';

// Validation schemas
const createVitalSignsSchema = z.object({
  visitId: z.string().uuid("Visit ID ต้องเป็น UUID"),
  systolicBP: z.number().min(50).max(300, "ค่าความดันโลหิตซิสโตลิคไม่อยู่ในช่วงปกติ").optional(),
  diastolicBP: z.number().min(30).max(200, "ค่าความดันโลหิตไดแอสโตลิคไม่อยู่ในช่วงปกติ").optional(),
  heartRate: z.number().min(30).max(200, "อัตราการเต้นของหัวใจไม่อยู่ในช่วงปกติ").optional(),
  temperature: z.number().min(30).max(45, "อุณหภูมิร่างกายไม่อยู่ในช่วงปกติ").optional(),
  respiratoryRate: z.number().min(5).max(60, "อัตราการหายใจไม่อยู่ในช่วงปกติ").optional(),
  oxygenSaturation: z.number().min(50).max(100, "ค่าออกซิเจนในเลือดไม่อยู่ในช่วงปกติ").optional(),
  weight: z.number().min(0.5).max(500, "น้ำหนักไม่อยู่ในช่วงปกติ").optional(),
  height: z.number().min(30).max(250, "ส่วนสูงไม่อยู่ในช่วงปกติ").optional(),
  bmi: z.number().min(10).max(80, "ค่า BMI ไม่อยู่ในช่วงปกติ").optional(),
  painScale: z.number().min(0).max(10, "ระดับความเจ็บปวดต้องอยู่ในช่วง 0-10").optional(),
  notes: z.string().max(1000, "หมายเหตุต้องไม่เกิน 1000 ตัวอักษร").optional()
});

const updateVitalSignsSchema = z.object({
  systolicBP: z.number().min(50).max(300).optional(),
  diastolicBP: z.number().min(30).max(200).optional(),
  heartRate: z.number().min(30).max(200).optional(),
  temperature: z.number().min(30).max(45).optional(),
  respiratoryRate: z.number().min(5).max(60).optional(),
  oxygenSaturation: z.number().min(50).max(100).optional(),
  weight: z.number().min(0.5).max(500).optional(),
  height: z.number().min(30).max(250).optional(),
  bmi: z.number().min(10).max(80).optional(),
  painScale: z.number().min(0).max(10).optional(),
  notes: z.string().max(1000).optional()
});

/**
 * บันทึกสัญญาณชีพใหม่
 * POST /api/medical/vital-signs
 */
export const createVitalSigns = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = createVitalSignsSchema.parse(req.body);
    
    // Calculate BMI if weight and height are provided
    let calculatedBMI = validatedData.bmi;
    if (validatedData.weight && validatedData.height) {
      const heightInMeters = validatedData.height / 100;
      calculatedBMI = validatedData.weight / (heightInMeters * heightInMeters);
      calculatedBMI = Math.round(calculatedBMI * 100) / 100; // Round to 2 decimal places
    }

    // Check if visit exists and get patient_id
    const visitCheck = await db.query('SELECT id, patient_id FROM visits WHERE id = $1', [validatedData.visitId]);
    if (visitCheck.rows.length === 0) {
      return res.status(400).json(
        errorResponse('ไม่พบข้อมูลการมาพบแพทย์', 400)
      );
    }

    const patientId = visitCheck.rows[0].patient_id;

    // Insert vital signs
    const result = await db.query(`
      INSERT INTO vital_signs (
        visit_id, patient_id, systolic_bp, diastolic_bp, heart_rate, temperature, 
        respiratory_rate, oxygen_saturation, weight, height, bmi, pain_scale, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      validatedData.visitId,
      patientId,
      validatedData.systolicBP,
      validatedData.diastolicBP,
      validatedData.heartRate,
      validatedData.temperature,
      validatedData.respiratoryRate,
      validatedData.oxygenSaturation,
      validatedData.weight,
      validatedData.height,
      calculatedBMI,
      validatedData.painScale,
      validatedData.notes
    ]);

    // Map to camelCase response
    const vitalSigns = {
      id: result.rows[0].id,
      visitId: result.rows[0].visit_id,
      systolicBP: result.rows[0].systolic_bp,
      diastolicBP: result.rows[0].diastolic_bp,
      heartRate: result.rows[0].heart_rate,
      temperature: result.rows[0].temperature,
      respiratoryRate: result.rows[0].respiratory_rate,
      oxygenSaturation: result.rows[0].oxygen_saturation,
      weight: result.rows[0].weight,
      height: result.rows[0].height,
      bmi: result.rows[0].bmi,
      painScale: result.rows[0].pain_scale,
      notes: result.rows[0].notes,
      recordedAt: result.rows[0].recorded_at,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    };

    res.status(201).json(
      successResponse('บันทึกสัญญาณชีพสำเร็จ', vitalSigns)
    );

  } catch (error) {
    console.error('Create vital signs error:', error);
    
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
 * ดึงข้อมูลสัญญาณชีพของการมาพบแพทย์
 * GET /api/medical/visits/:visitId/vital-signs
 */
export const getVitalSignsByVisit = async (req: Request, res: Response) => {
  try {
    const { visitId } = req.params;
    
    // Validate UUID
    if (!visitId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      return res.status(400).json(
        errorResponse('รูปแบบ Visit ID ไม่ถูกต้อง', 400)
      );
    }

    const result = await db.query(`
      SELECT vs.*, u.first_name, u.last_name
      FROM vital_signs vs
      LEFT JOIN users u ON vs.measured_by = u.id
      WHERE vs.visit_id = $1
      ORDER BY vs.measurement_time DESC
    `, [visitId]);

    if (result.rows.length === 0) {
      return res.status(404).json(
        errorResponse('ไม่พบข้อมูลสัญญาณชีพ', 404)
      );
    }

    // Map to camelCase response
    const vitalSigns = result.rows.map(row => ({
      id: row.id,
      visitId: row.visit_id,
      systolicBP: row.systolic_bp,
      diastolicBP: row.diastolic_bp,
      heartRate: row.heart_rate,
      temperature: row.temperature,
      respiratoryRate: row.respiratory_rate,
      oxygenSaturation: row.oxygen_saturation,
      weight: row.weight,
      height: row.height,
      bmi: row.bmi,
      painScale: row.pain_scale,
      notes: row.notes,
      measurementTime: row.measurement_time,
      measuredBy: row.first_name && row.last_name ? {
        firstName: row.first_name,
        lastName: row.last_name
      } : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json(
      successResponse('ดึงข้อมูลสัญญาณชีพสำเร็จ', vitalSigns)
    );

  } catch (error) {
    console.error('Get vital signs error:', error);
    res.status(500).json(
      errorResponse('เกิดข้อผิดพลาดในระบบ', 500)
    );
  }
};

/**
 * อัปเดตข้อมูลสัญญาณชีพ
 * PUT /api/medical/vital-signs/:id
 */
export const updateVitalSigns = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate UUID
    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      return res.status(400).json(
        errorResponse('รูปแบบ ID ไม่ถูกต้อง', 400)
      );
    }

    // Validate input
    const validatedData = updateVitalSignsSchema.parse(req.body);
    
    // Check if vital signs record exists
    const existingRecord = await db.query('SELECT id, weight, height FROM vital_signs WHERE id = $1', [id]);
    if (existingRecord.rows.length === 0) {
      return res.status(404).json(
        errorResponse('ไม่พบข้อมูลสัญญาณชีพ', 404)
      );
    }

    // Calculate BMI if weight and height are provided
    let calculatedBMI = validatedData.bmi;
    const currentWeight = validatedData.weight || existingRecord.rows[0].weight;
    const currentHeight = validatedData.height || existingRecord.rows[0].height;
    
    if (currentWeight && currentHeight) {
      const heightInMeters = currentHeight / 100;
      calculatedBMI = currentWeight / (heightInMeters * heightInMeters);
      calculatedBMI = Math.round(calculatedBMI * 100) / 100;
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramIndex = 1;

    const fieldMappings = {
      systolicBP: 'systolic_bp',
      diastolicBP: 'diastolic_bp',
      heartRate: 'heart_rate',
      temperature: 'temperature',
      respiratoryRate: 'respiratory_rate',
      oxygenSaturation: 'oxygen_saturation',
      weight: 'weight',
      height: 'height',
      painScale: 'pain_scale',
      notes: 'notes'
    };

    for (const [key, dbField] of Object.entries(fieldMappings)) {
      if (validatedData[key as keyof typeof validatedData] !== undefined) {
        updates.push(`${dbField} = $${paramIndex}`);
        values.push(validatedData[key as keyof typeof validatedData]);
        paramIndex++;
      }
    }

    // Always update BMI if calculated
    if (calculatedBMI !== undefined) {
      updates.push(`bmi = $${paramIndex}`);
      values.push(calculatedBMI);
      paramIndex++;
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
      UPDATE vital_signs 
      SET ${updates.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(updateQuery, values);

    // Map to camelCase response
    const vitalSigns = {
      id: result.rows[0].id,
      visitId: result.rows[0].visit_id,
      systolicBP: result.rows[0].systolic_bp,
      diastolicBP: result.rows[0].diastolic_bp,
      heartRate: result.rows[0].heart_rate,
      temperature: result.rows[0].temperature,
      respiratoryRate: result.rows[0].respiratory_rate,
      oxygenSaturation: result.rows[0].oxygen_saturation,
      weight: result.rows[0].weight,
      height: result.rows[0].height,
      bmi: result.rows[0].bmi,
      painScale: result.rows[0].pain_scale,
      notes: result.rows[0].notes,
      recordedAt: result.rows[0].recorded_at,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    };

    res.json(
      successResponse('อัปเดตสัญญาณชีพสำเร็จ', vitalSigns)
    );

  } catch (error) {
    console.error('Update vital signs error:', error);
    
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
 * ลบข้อมูลสัญญาณชีพ
 * DELETE /api/medical/vital-signs/:id
 */
export const deleteVitalSigns = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate UUID
    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      return res.status(400).json(
        errorResponse('รูปแบบ ID ไม่ถูกต้อง', 400)
      );
    }

    // Check if vital signs record exists
    const existingRecord = await db.query('SELECT id FROM vital_signs WHERE id = $1', [id]);
    if (existingRecord.rows.length === 0) {
      return res.status(404).json(
        errorResponse('ไม่พบข้อมูลสัญญาณชีพ', 404)
      );
    }

    await db.query('DELETE FROM vital_signs WHERE id = $1', [id]);

    res.json(
      successResponse('ลบข้อมูลสัญญาณชีพสำเร็จ', { id })
    );

  } catch (error) {
    console.error('Delete vital signs error:', error);
    res.status(500).json(
      errorResponse('เกิดข้อผิดพลาดในระบบ', 500)
    );
  }
};
