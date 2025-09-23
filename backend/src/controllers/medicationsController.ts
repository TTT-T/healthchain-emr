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
    const user = (req as any).user; // Get user from request

    // Get patient ID based on user role
    let actualPatientId: string;
    let patient: any;
    
    // For patients, they can only access their own data
    if (user.role === 'patient') {
      // First try to get patient record using user_id (new schema)
      let patientQuery = `
        SELECT p.*, u.first_name, u.last_name, u.email
        FROM patients p
        JOIN users u ON p.user_id = u.id
        WHERE u.id = $1
      `;
      let patientResult = await databaseManager.query(patientQuery, [user.id]);
      
      // If no patient found with user_id, try to find by email (fallback for old schema)
      if (patientResult.rows.length === 0) {
        patientQuery = `
          SELECT p.*, u.first_name, u.last_name, u.email
          FROM patients p
          JOIN users u ON p.email = u.email
          WHERE u.id = $1 AND u.role = 'patient'
        `;
        patientResult = await databaseManager.query(patientQuery, [user.id]);
      }
      
      // If still no patient found, do not create one automatically
      if (patientResult.rows.length === 0) {
        return res.status(404).json({
          data: null,
          meta: null,
          error: { 
            message: 'Patient record not found. Please register through EMR system at /emr/register-patient',
            code: 'PATIENT_NOT_REGISTERED'
          },
          statusCode: 404
        });
      } else {
        patient = patientResult.rows[0];
      }
      
      actualPatientId = patient.id;
    } else {
      // For doctors/nurses/admins, they can access any patient
      actualPatientId = patientId;
      
      // Verify patient exists
      let patientQuery = `
        SELECT p.*, u.first_name, u.last_name, u.email
        FROM patients p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.id = $1
      `;
      let patientResult = await databaseManager.query(patientQuery, [patientId]);
      
      if (patientResult.rows.length === 0) {
        return res.status(404).json({
          data: null,
          meta: null,
          error: { message: 'Patient not found' },
          statusCode: 404
        });
      }
      
      patient = patientResult.rows[0];
    }
    const offset = (Number(page) - 1) * Number(limit);

    // Build query for medications from medical_records
    let whereClause = 'WHERE mr.patient_id = $1 AND mr.record_type = \'pharmacy_dispensing\'';
    const queryParams: any[] = [actualPatientId];

    if (status) {
      // For medical_records, we'll use 'dispensed' as the status
      whereClause += ' AND mr.record_type = \'pharmacy_dispensing\'';
    }

    if (medicationType) {
      whereClause += ` AND mr.medications::text ILIKE $${queryParams.length + 1}`;
      queryParams.push(`%${medicationType}%`);
    }

    if (startDate) {
      const paramIndex = queryParams.length + 1;
      whereClause += ` AND mr.recorded_time >= $${paramIndex}`;
      queryParams.push(startDate);
    }

    if (endDate) {
      const paramIndex = queryParams.length + 1;
      whereClause += ` AND mr.recorded_time <= $${paramIndex}`;
      queryParams.push(endDate);
    }

    // Get medications from medical_records (pharmacy_dispensing records)
    const medicationsQuery = `
      SELECT 
        mr.id as medication_id,
        mr.medications,
        mr.total_amount,
        mr.payment_method,
        mr.recorded_time as prescription_date,
        mr.recorded_by,
        mr.notes,
        mr.created_at,
        mr.updated_at,
        u.first_name as prescribed_by_first_name,
        u.last_name as prescribed_by_last_name,
        v.visit_number,
        v.visit_date,
        v.diagnosis
      FROM medical_records mr
      LEFT JOIN users u ON mr.recorded_by = u.id
      LEFT JOIN visits v ON mr.visit_id = v.id
      ${whereClause}
      ORDER BY mr.recorded_time DESC, mr.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    queryParams.push(Number(limit), offset);
    const medicationsResult = await databaseManager.query(medicationsQuery, queryParams);
    const medications = medicationsResult.rows;
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM medical_records mr
      ${whereClause}
    `;
    const countResult = await databaseManager.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    // Format medications from medical_records
    const formattedMedications = [];
    for (const med of medications) {
      try {
        // Parse medications JSON array
        let medicationsArray = [];
        if (med.medications) {
          if (typeof med.medications === 'string') {
            try {
              medicationsArray = JSON.parse(med.medications);
            } catch (error) {
              console.error('❌ JSON parsing error:', error);
              console.error('❌ Raw medications string:', med.medications);
              medicationsArray = [];
            }
          } else if (Array.isArray(med.medications)) {
            medicationsArray = med.medications;
          } else if (typeof med.medications === 'object') {
            // Handle case where medications is already an object/array
            medicationsArray = med.medications;
          }
        }
        // If no medications array or empty, create a fallback entry
        if (!medicationsArray || medicationsArray.length === 0) {
          formattedMedications.push({
            id: med.medication_id,
            medication_name: 'ข้อมูลยา (ไม่สามารถแยกวิเคราะห์ได้)',
            strength: 'ไม่ระบุ',
            dosage_form: 'ไม่ระบุ',
            quantity_prescribed: 0,
            unit: 'ไม่ระบุ',
            dosage_instructions: 'ไม่ระบุ',
            duration_days: 0,
            status: 'dispensed',
            notes: med.notes || '',
            created_at: med.created_at,
            updated_at: med.updated_at,
            prescription: {
              id: med.medication_id,
              number: `RX${med.medication_id.slice(0, 8)}`,
              date: med.prescription_date,
              status: 'active',
              general_instructions: med.notes || '',
              prescribed_by: {
                name: `${med.prescribed_by_first_name || ''} ${med.prescribed_by_last_name || ''}`.trim() || 'ไม่ระบุ'
              }
            },
            visit: {
              number: med.visit_number || 'ไม่ระบุ',
              date: med.visit_date || med.prescription_date,
              diagnosis: med.diagnosis || 'ไม่ระบุ'
            },
            total_amount: med.total_amount,
            payment_method: med.payment_method
          });
        } else {
          // Create a medication entry for each item in the medications array
          for (const medicationItem of medicationsArray) {
          formattedMedications.push({
            id: `${med.medication_id}_${medicationItem.medicationName || 'unknown'}`,
            medication_name: medicationItem.medicationName || 'ไม่ระบุ',
            strength: medicationItem.dosage || 'ไม่ระบุ',
            dosage_form: medicationItem.unit || 'ไม่ระบุ',
            quantity_prescribed: medicationItem.quantity || 0,
            unit: medicationItem.unit || 'ไม่ระบุ',
            dosage_instructions: medicationItem.instructions || 'ไม่ระบุ',
            duration_days: medicationItem.duration ? parseInt(medicationItem.duration.replace(/\D/g, '')) : 0,
            status: 'dispensed',
            notes: med.notes || '',
            created_at: med.created_at,
            updated_at: med.updated_at,
            prescription: {
              id: med.medication_id,
              number: `RX${med.medication_id.slice(0, 8)}`,
              date: med.prescription_date,
              status: 'active',
              general_instructions: med.notes || '',
              prescribed_by: {
                name: `${med.prescribed_by_first_name || ''} ${med.prescribed_by_last_name || ''}`.trim() || 'ไม่ระบุ'
              }
            },
            visit: {
              number: med.visit_number || 'ไม่ระบุ',
              date: med.visit_date || med.prescription_date,
              diagnosis: med.diagnosis || 'ไม่ระบุ'
            },
            // Additional fields from medical_records
            total_amount: med.total_amount,
            payment_method: med.payment_method,
            price: medicationItem.price || 0,
            frequency: medicationItem.frequency || 'ไม่ระบุ',
            dispensed_quantity: medicationItem.dispensedQuantity || medicationItem.quantity || 0
          });
          }
        }
      } catch (error) {
        console.error('Error parsing medications JSON:', error);
        // If JSON parsing fails, create a single entry with basic info
        formattedMedications.push({
          id: med.medication_id,
          medication_name: 'ข้อมูลยา (ไม่สามารถแยกวิเคราะห์ได้)',
          strength: 'ไม่ระบุ',
          dosage_form: 'ไม่ระบุ',
          quantity_prescribed: 0,
          unit: 'ไม่ระบุ',
          dosage_instructions: 'ไม่ระบุ',
          duration_days: 0,
          status: 'dispensed',
          notes: med.notes || '',
          created_at: med.created_at,
          updated_at: med.updated_at,
          prescription: {
            id: med.medication_id,
            number: `RX${med.medication_id.slice(0, 8)}`,
            date: med.prescription_date,
            status: 'active',
            general_instructions: med.notes || '',
            prescribed_by: {
              name: `${med.prescribed_by_first_name || ''} ${med.prescribed_by_last_name || ''}`.trim() || 'ไม่ระบุ'
            }
          },
          visit: {
            number: med.visit_number || 'ไม่ระบุ',
            date: med.visit_date || med.prescription_date,
            diagnosis: med.diagnosis || 'ไม่ระบุ'
          },
          total_amount: med.total_amount,
          payment_method: med.payment_method
        });
      }
    }
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
    const { id: actualPatientId, medId } = req.params;
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
    `, [medId, actualPatientId]);

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
