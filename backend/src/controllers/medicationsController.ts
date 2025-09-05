import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';

/**
 * Medications Controller
 * จัดการข้อมูลยาที่ใช้ของผู้ป่วย
 */

/**
 * Get medications for a patient
 * GET /api/patients/{id}/medications
 */
export const getPatientMedications = async (req: Request, res: Response) => {
  try {
    const { id: patientId } = req.params;
    const { page = 1, limit = 10, status, medicationType, startDate, endDate } = req.query;

    // Validate patient exists
    const patientExists = await databaseManager.query(
      'SELECT id, first_name, last_name FROM patients WHERE id = $1',
      [patientId]
    );

    if (patientExists.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Patient not found' },
        statusCode: 404
      });
    }

    const patient = patientExists.rows[0];
    const offset = (Number(page) - 1) * Number(limit);

    // Build query for medications
    let whereClause = 'WHERE p.patient_id = $1';
    const queryParams: any[] = [patientId];

    if (status) {
      whereClause += ' AND pi.item_status = $2';
      queryParams.push(status);
    }

    if (medicationType) {
      whereClause += ` AND pi.medication_name ILIKE $${queryParams.length + 1}`;
      queryParams.push(`%${medicationType}%`);
    }

    if (startDate) {
      const paramIndex = queryParams.length + 1;
      whereClause += ` AND p.prescription_date >= $${paramIndex}`;
      queryParams.push(startDate);
    }

    if (endDate) {
      const paramIndex = queryParams.length + 1;
      whereClause += ` AND p.prescription_date <= $${paramIndex}`;
      queryParams.push(endDate);
    }

    // Get medications from prescription items
    const medicationsQuery = `
      SELECT 
        pi.id as medication_id,
        pi.medication_name,
        pi.strength,
        pi.dosage_form,
        pi.quantity_prescribed,
        pi.unit,
        pi.dosage_instructions,
        pi.duration_days,
        pi.item_status,
        pi.notes,
        pi.created_at,
        pi.updated_at,
        p.id as prescription_id,
        p.prescription_number,
        p.prescription_date,
        p.status as prescription_status,
        p.general_instructions,
        u.first_name as prescribed_by_first_name,
        u.last_name as prescribed_by_last_name,
        v.visit_number,
        v.visit_date,
        v.diagnosis
      FROM prescription_items pi
      INNER JOIN prescriptions p ON pi.prescription_id = p.id
      LEFT JOIN users u ON p.prescribed_by = u.id
      LEFT JOIN visits v ON p.visit_id = v.id
      ${whereClause}
      ORDER BY p.prescription_date DESC, pi.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    queryParams.push(Number(limit), offset);

    const medicationsResult = await databaseManager.query(medicationsQuery, queryParams);
    const medications = medicationsResult.rows;

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM prescription_items pi
      INNER JOIN prescriptions p ON pi.prescription_id = p.id
      ${whereClause}
    `;
    const countResult = await databaseManager.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    // Format medications
    const formattedMedications = medications.map(med => ({
      id: med.medication_id,
      medication_name: med.medication_name,
      strength: med.strength,
      dosage_form: med.dosage_form,
      quantity_prescribed: med.quantity_prescribed,
      unit: med.unit,
      dosage_instructions: med.dosage_instructions,
      duration_days: med.duration_days,
      status: med.item_status,
      notes: med.notes,
      created_at: med.created_at,
      updated_at: med.updated_at,
      prescription: {
        id: med.prescription_id,
        number: med.prescription_number,
        date: med.prescription_date,
        status: med.prescription_status,
        general_instructions: med.general_instructions,
        prescribed_by: {
          name: `${med.prescribed_by_first_name} ${med.prescribed_by_last_name}`
        }
      },
      visit: {
        number: med.visit_number,
        date: med.visit_date,
        diagnosis: med.diagnosis
      }
    }));

    res.json({
      data: {
        patient: {
          id: patient.id,
          name: `${patient.first_name} ${patient.last_name}`
        },
        medications: formattedMedications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        medicationCount: formattedMedications.length
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error getting patient medications:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Add new medication to patient
 * POST /api/patients/{id}/medications
 */
export const addPatientMedication = async (req: Request, res: Response) => {
  try {
    const { id: patientId } = req.params;
    const {
      medication_name,
      strength,
      dosage_form,
      quantity_prescribed,
      unit,
      dosage_instructions,
      duration_days,
      notes,
      prescription_id
    } = req.body;

    const userId = (req as any).user.id;

    // Validate patient exists
    const patientExists = await databaseManager.query(
      'SELECT id, first_name, last_name FROM patients WHERE id = $1',
      [patientId]
    );

    if (patientExists.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Patient not found' },
        statusCode: 404
      });
    }

    // Validate prescription exists and belongs to patient
    const prescriptionExists = await databaseManager.query(`
      SELECT id FROM prescriptions 
      WHERE id = $1 AND patient_id = $2
    `, [prescription_id, patientId]);

    if (prescriptionExists.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Prescription not found' },
        statusCode: 404
      });
    }

    // Create medication record
    const medicationId = uuidv4();

    await databaseManager.query(`
      INSERT INTO prescription_items (
        id, prescription_id, medication_name, strength, dosage_form,
        quantity_prescribed, unit, dosage_instructions, duration_days,
        item_status, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      medicationId, prescription_id, medication_name, strength, dosage_form,
      quantity_prescribed, unit, dosage_instructions, duration_days,
      'prescribed', notes
    ]);

    // Get created medication
    const createdMedication = await databaseManager.query(`
      SELECT 
        pi.id, pi.medication_name, pi.strength, pi.dosage_form,
        pi.quantity_prescribed, pi.unit, pi.dosage_instructions,
        pi.duration_days, pi.item_status, pi.notes, pi.created_at,
        p.prescription_number, p.prescription_date,
        u.first_name as prescribed_by_first_name, u.last_name as prescribed_by_last_name
      FROM prescription_items pi
      INNER JOIN prescriptions p ON pi.prescription_id = p.id
      LEFT JOIN users u ON p.prescribed_by = u.id
      WHERE pi.id = $1
    `, [medicationId]);

    res.status(201).json({
      data: {
        medication: {
          ...createdMedication.rows[0],
          prescribed_by: {
            name: `${createdMedication.rows[0].prescribed_by_first_name} ${createdMedication.rows[0].prescribed_by_last_name}`
          }
        },
        message: 'Medication added successfully'
      },
      meta: {
        timestamp: new Date().toISOString(),
        medicationId: medicationId
      },
      error: null,
      statusCode: 201
    });

  } catch (error) {
    console.error('Error adding patient medication:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Update medication
 * PUT /api/patients/{id}/medications/{medId}
 */
export const updatePatientMedication = async (req: Request, res: Response) => {
  try {
    const { id: patientId, medId } = req.params;
    const {
      medication_name,
      strength,
      dosage_form,
      quantity_prescribed,
      unit,
      dosage_instructions,
      duration_days,
      item_status,
      notes
    } = req.body;

    const userId = (req as any).user.id;
    
    // Get a valid user ID if not provided
    let validUserId = userId;
    if (!validUserId || validUserId === '1') {
      const userResult = await databaseManager.query('SELECT id FROM users LIMIT 1');
      validUserId = userResult.rows[0]?.id;
    }

    // Validate medication exists and belongs to patient
    const medicationExists = await databaseManager.query(`
      SELECT pi.id FROM prescription_items pi
      INNER JOIN prescriptions p ON pi.prescription_id = p.id
      WHERE pi.id = $1 AND p.patient_id = $2
    `, [medId, patientId]);

    if (medicationExists.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Medication not found' },
        statusCode: 404
      });
    }

    // Update medication
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (medication_name !== undefined) {
      updateFields.push(`medication_name = $${paramCount++}`);
      updateValues.push(medication_name);
    }
    if (strength !== undefined) {
      updateFields.push(`strength = $${paramCount++}`);
      updateValues.push(strength);
    }
    if (dosage_form !== undefined) {
      updateFields.push(`dosage_form = $${paramCount++}`);
      updateValues.push(dosage_form);
    }
    if (quantity_prescribed !== undefined) {
      updateFields.push(`quantity_prescribed = $${paramCount++}`);
      updateValues.push(quantity_prescribed);
    }
    if (unit !== undefined) {
      updateFields.push(`unit = $${paramCount++}`);
      updateValues.push(unit);
    }
    if (dosage_instructions !== undefined) {
      updateFields.push(`dosage_instructions = $${paramCount++}`);
      updateValues.push(dosage_instructions);
    }
    if (duration_days !== undefined) {
      updateFields.push(`duration_days = $${paramCount++}`);
      updateValues.push(duration_days);
    }
    if (item_status !== undefined) {
      updateFields.push(`item_status = $${paramCount++}`);
      updateValues.push(item_status);
    }
    if (notes !== undefined) {
      updateFields.push(`notes = $${paramCount++}`);
      updateValues.push(notes);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(medId);

    const updateQuery = `
      UPDATE prescription_items 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
    `;

    await databaseManager.query(updateQuery, updateValues);

    // Get updated medication
    const updatedMedication = await databaseManager.query(`
      SELECT 
        pi.id, pi.medication_name, pi.strength, pi.dosage_form,
        pi.quantity_prescribed, pi.unit, pi.dosage_instructions,
        pi.duration_days, pi.item_status, pi.notes, pi.updated_at,
        p.prescription_number, p.prescription_date,
        u.first_name as prescribed_by_first_name, u.last_name as prescribed_by_last_name
      FROM prescription_items pi
      INNER JOIN prescriptions p ON pi.prescription_id = p.id
      LEFT JOIN users u ON p.prescribed_by = u.id
      WHERE pi.id = $1
    `, [medId]);

    res.json({
      data: {
        medication: {
          ...updatedMedication.rows[0],
          prescribed_by: {
            name: `${updatedMedication.rows[0].prescribed_by_first_name} ${updatedMedication.rows[0].prescribed_by_last_name}`
          }
        },
        message: 'Medication updated successfully'
      },
      meta: {
        timestamp: new Date().toISOString(),
        updatedBy: validUserId
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error updating patient medication:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};
