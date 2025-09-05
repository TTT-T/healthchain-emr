import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';

/**
 * Vital Signs Controller
 * จัดการ vital signs สำหรับระบบ EMR
 */

/**
 * Record vital signs for a visit
 * POST /api/medical/visits/{id}/vital-signs
 */
export const recordVitalSigns = async (req: Request, res: Response) => {
  try {
    const { id: visitId } = req.params;
    const {
      systolic_bp,
      diastolic_bp,
      heart_rate,
      temperature,
      respiratory_rate,
      oxygen_saturation,
      weight,
      height,
      bmi,
      pain_scale,
      notes
    } = req.body;

    const userId = (req as any).user.id;

    // Validate required fields
    if (!systolic_bp && !diastolic_bp && !heart_rate && !temperature && !weight && !height) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: { message: 'At least one vital sign measurement is required' },
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
      const userResult = await databaseManager.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['nurse']);
      validUserId = userResult.rows[0]?.id;
    }
    
    // Validate user ID exists
    if (validUserId) {
      const userExists = await databaseManager.query('SELECT id FROM users WHERE id = $1', [validUserId]);
      if (userExists.rows.length === 0) {
        const fallbackUser = await databaseManager.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['nurse']);
        validUserId = fallbackUser.rows[0]?.id;
      }
    }

    // Calculate BMI if not provided but weight and height are available
    let calculatedBMI = bmi;
    if (!calculatedBMI && weight && height) {
      const heightInMeters = height / 100;
      calculatedBMI = (weight / (heightInMeters * heightInMeters)).toFixed(1);
    }

    // Create vital signs record
    const vitalSignsId = uuidv4();
    const createVitalSignsQuery = `
      INSERT INTO vital_signs (
        id, patient_id, visit_id, systolic_bp, diastolic_bp, heart_rate,
        temperature, respiratory_rate, oxygen_saturation, weight, height,
        bmi, pain_scale, notes, measured_by, measurement_time
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      )
      RETURNING *
    `;

    const now = new Date();
    const vitalSignsResult = await databaseManager.query(createVitalSignsQuery, [
      vitalSignsId, visit.patient_id, visitId, systolic_bp, diastolic_bp, heart_rate,
      temperature, respiratory_rate, oxygen_saturation, weight, height,
      calculatedBMI, pain_scale, notes, validUserId, now
    ]);

    const newVitalSigns = vitalSignsResult.rows[0];

    res.status(201).json({
      data: {
        vital_signs: {
          id: newVitalSigns.id,
          patient_id: newVitalSigns.patient_id,
          visit_id: newVitalSigns.visit_id,
          systolic_bp: newVitalSigns.systolic_bp,
          diastolic_bp: newVitalSigns.diastolic_bp,
          heart_rate: newVitalSigns.heart_rate,
          temperature: newVitalSigns.temperature,
          respiratory_rate: newVitalSigns.respiratory_rate,
          oxygen_saturation: newVitalSigns.oxygen_saturation,
          weight: newVitalSigns.weight,
          height: newVitalSigns.height,
          bmi: newVitalSigns.bmi,
          pain_scale: newVitalSigns.pain_scale,
          notes: newVitalSigns.notes,
          measurement_time: newVitalSigns.measurement_time,
          created_at: newVitalSigns.created_at
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        measuredBy: validUserId
      },
      error: null,
      statusCode: 201
    });

  } catch (error) {
    console.error('Error recording vital signs:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Get vital signs for a visit
 * GET /api/medical/visits/{id}/vital-signs
 */
export const getVitalSigns = async (req: Request, res: Response) => {
  try {
    const { id: visitId } = req.params;
    const { page = 1, limit = 10 } = req.query;

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

    // Get vital signs for the visit
    const vitalSignsQuery = `
      SELECT 
        vs.id,
        vs.patient_id,
        vs.visit_id,
        vs.systolic_bp,
        vs.diastolic_bp,
        vs.heart_rate,
        vs.temperature,
        vs.respiratory_rate,
        vs.oxygen_saturation,
        vs.weight,
        vs.height,
        vs.bmi,
        vs.pain_scale,
        vs.notes,
        vs.measurement_time,
        vs.created_at,
        vs.updated_at,
        u.first_name as measured_by_first_name,
        u.last_name as measured_by_last_name
      FROM vital_signs vs
      LEFT JOIN users u ON vs.measured_by = u.id
      WHERE vs.visit_id = $1
      ORDER BY vs.measurement_time DESC
      LIMIT $2 OFFSET $3
    `;

    const vitalSignsResult = await databaseManager.query(vitalSignsQuery, [visitId, Number(limit), offset]);
    const vitalSigns = vitalSignsResult.rows;

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM vital_signs vs
      WHERE vs.visit_id = $1
    `;
    const countResult = await databaseManager.query(countQuery, [visitId]);
    const total = parseInt(countResult.rows[0].total);

    // Format vital signs data
    const formattedVitalSigns = vitalSigns.map(vs => ({
      id: vs.id,
      patient_id: vs.patient_id,
      visit_id: vs.visit_id,
      measurements: {
        blood_pressure: {
          systolic: vs.systolic_bp,
          diastolic: vs.diastolic_bp,
          reading: vs.systolic_bp && vs.diastolic_bp ? `${vs.systolic_bp}/${vs.diastolic_bp}` : null
        },
        heart_rate: vs.heart_rate,
        temperature: vs.temperature,
        respiratory_rate: vs.respiratory_rate,
        oxygen_saturation: vs.oxygen_saturation,
        weight: vs.weight,
        height: vs.height,
        bmi: vs.bmi,
        pain_scale: vs.pain_scale
      },
      notes: vs.notes,
      measured_by: vs.measured_by_first_name ? {
        name: `${vs.measured_by_first_name} ${vs.measured_by_last_name}`
      } : null,
      measurement_time: vs.measurement_time,
      created_at: vs.created_at,
      updated_at: vs.updated_at
    }));

    res.json({
      data: {
        visit_id: visitId,
        patient_id: visit.patient_id,
        vital_signs: formattedVitalSigns,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        vitalSignsCount: formattedVitalSigns.length
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error getting vital signs:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Update vital signs
 * PUT /api/medical/vital-signs/{id}
 */
export const updateVitalSigns = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if vital signs record exists
    const vitalSignsExists = await databaseManager.query(
      'SELECT id FROM vital_signs WHERE id = $1',
      [id]
    );

    if (vitalSignsExists.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Vital signs record not found' },
        statusCode: 404
      });
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    const allowedFields = [
      'systolic_bp', 'diastolic_bp', 'heart_rate', 'temperature',
      'respiratory_rate', 'oxygen_saturation', 'weight', 'height',
      'bmi', 'pain_scale', 'notes'
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

    // Recalculate BMI if weight or height is updated
    if (updateData.weight || updateData.height) {
      const currentRecord = await databaseManager.query(
        'SELECT weight, height FROM vital_signs WHERE id = $1',
        [id]
      );
      
      const currentWeight = updateData.weight || currentRecord.rows[0].weight;
      const currentHeight = updateData.height || currentRecord.rows[0].height;
      
      if (currentWeight && currentHeight) {
        const heightInMeters = currentHeight / 100;
        const calculatedBMI = (currentWeight / (heightInMeters * heightInMeters)).toFixed(1);
        paramCount++;
        updateFields.push(`bmi = $${paramCount}`);
        updateValues.push(calculatedBMI);
      }
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(id);

    const updateQuery = `
      UPDATE vital_signs 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount + 1}
      RETURNING *
    `;

    const updateResult = await databaseManager.query(updateQuery, updateValues);
    const updatedVitalSigns = updateResult.rows[0];

    res.json({
      data: {
        vital_signs: {
          id: updatedVitalSigns.id,
          patient_id: updatedVitalSigns.patient_id,
          visit_id: updatedVitalSigns.visit_id,
          systolic_bp: updatedVitalSigns.systolic_bp,
          diastolic_bp: updatedVitalSigns.diastolic_bp,
          heart_rate: updatedVitalSigns.heart_rate,
          temperature: updatedVitalSigns.temperature,
          respiratory_rate: updatedVitalSigns.respiratory_rate,
          oxygen_saturation: updatedVitalSigns.oxygen_saturation,
          weight: updatedVitalSigns.weight,
          height: updatedVitalSigns.height,
          bmi: updatedVitalSigns.bmi,
          pain_scale: updatedVitalSigns.pain_scale,
          notes: updatedVitalSigns.notes,
          updated_at: updatedVitalSigns.updated_at
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
    console.error('Error updating vital signs:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};