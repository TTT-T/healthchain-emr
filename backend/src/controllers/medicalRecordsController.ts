import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';

/**
 * Medical Records Controller
 * จัดการข้อมูลประวัติการรักษาของผู้ป่วย
 */

/**
 * Get medical records for a patient
 * GET /api/patients/{id}/records
 */
export const getPatientRecords = async (req: Request, res: Response) => {
  try {
    const { id: patientId } = req.params;
    const { page = 1, limit = 10, type, startDate, endDate } = req.query;
    const user = (req as any).user;

    // Get patient ID based on user role
    let actualPatientId: string;
    let patient: any;
    
    // For patients, they can only access their own data
    if (user.role === 'patient') {
      // First try to get patient record using user_id (new schema)
      let patientQuery = await databaseManager.query(
        'SELECT id, first_name, last_name, user_id, email FROM patients WHERE user_id = $1',
        [user.id]
      );
      
      if (patientQuery.rows.length === 0) {
        // If no patient found by user_id, try by email
        patientQuery = await databaseManager.query(
          'SELECT id, first_name, last_name, user_id, email FROM patients WHERE email = $1',
          [user.email]
        );
      }
      
      if (patientQuery.rows.length === 0) {
        // If still no patient found, do not create one automatically
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
        patient = patientQuery.rows[0];
        actualPatientId = patient.id;
      }
    } else {
      // For doctors/admins, use the provided patient ID
      const patientResult = await databaseManager.query(
        'SELECT id, first_name, last_name FROM patients WHERE id = $1',
        [patientId]
      );
      patient = patientResult.rows[0];
      
      if (!patient) {
        return res.status(404).json({
          data: null,
          meta: null,
          error: { message: 'Patient not found' },
          statusCode: 404
        });
      }
      actualPatientId = patientId;
    }

    const offset = (Number(page) - 1) * Number(limit);

    // Build query for medical records (visits, lab results, prescriptions)
    let whereClause = 'WHERE v.patient_id = $1';
    const queryParams: any[] = [actualPatientId];

    if (type) {
      whereClause += ' AND v.visit_type = $2';
      queryParams.push(type);
    }

    if (startDate) {
      const paramIndex = queryParams.length + 1;
      whereClause += ` AND v.visit_date >= $${paramIndex}`;
      queryParams.push(startDate);
    }

    if (endDate) {
      const paramIndex = queryParams.length + 1;
      whereClause += ` AND v.visit_date <= $${paramIndex}`;
      queryParams.push(endDate);
    }

    // Get visits with related data
    const visitsQuery = `
      SELECT 
        v.id,
        v.visit_number,
        v.visit_date,
        v.visit_time,
        v.visit_type,
        v.chief_complaint,
        v.present_illness,
        v.physical_examination,
        v.diagnosis,
        v.treatment_plan,
        v.doctor_notes,
        v.status,
        v.priority,
        u.first_name as doctor_first_name,
        u.last_name as doctor_last_name,
        d.department_name,
        v.created_at,
        v.updated_at
      FROM visits v
      LEFT JOIN users u ON v.attending_doctor_id = u.id
      LEFT JOIN departments d ON v.department_id = d.id
      ${whereClause}
      ORDER BY v.visit_date DESC, v.visit_time DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    queryParams.push(Number(limit), offset);

    const visitsResult = await databaseManager.query(visitsQuery, queryParams);
    const visits = visitsResult.rows;

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM visits v
      ${whereClause}
    `;
    const countResult = await databaseManager.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    // Get lab results for each visit
    for (const visit of visits) {
      const labResults = await databaseManager.query(`
        SELECT 
          lo.id as lab_order_id,
          lo.order_number,
          lo._name,
          lo._category,
          lo.status as order_status,
          lr.id as result_id,
          lr.result_value,
          lr.result_unit,
          lr.reference_range,
          lr.abnormal_flag,
          lr.interpretation,
          lr.result_date,
          lr.result_time
        FROM lab_orders lo
        LEFT JOIN lab_results lr ON lo.id = lr.lab_order_id
        WHERE lo.visit_id = $1
        ORDER BY lo.order_date DESC
      `, [visit.id]);

      visit.lab_results = labResults.rows;
    }

    // Get prescriptions for each visit
    for (const visit of visits) {
      const prescriptions = await databaseManager.query(`
        SELECT 
          p.id as prescription_id,
          p.prescription_number,
          p.prescription_date,
          p.status as prescription_status,
          p.general_instructions,
          pi.id as item_id,
          pi.medication_name,
          pi.strength,
          pi.dosage_form,
          pi.quantity_prescribed,
          pi.unit,
          pi.dosage_instructions,
          pi.duration_days,
          pi.item_status
        FROM prescriptions p
        LEFT JOIN prescription_items pi ON p.id = pi.prescription_id
        WHERE p.visit_id = $1
        ORDER BY p.prescription_date DESC
      `, [visit.id]);

      visit.prescriptions = prescriptions.rows;
    }

    // Get vital signs for each visit
    for (const visit of visits) {
      const vitalSigns = await databaseManager.query(`
        SELECT 
          id,
          systolic_bp,
          diastolic_bp,
          heart_rate,
          respiratory_rate,
          temperature,
          oxygen_saturation,
          weight,
          height,
          bmi,
          pain_scale,
          pain_location,
          blood_glucose,
          measurement_time,
          notes
        FROM vital_signs
        WHERE visit_id = $1
        ORDER BY measurement_time DESC
      `, [visit.id]);

      visit.vital_signs = vitalSigns.rows;
    }

    res.json({
      data: {
        patient: {
          id: patient.id,
          name: `${patient.first_name} ${patient.last_name}`
        },
        records: visits,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        recordCount: visits.length
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error getting patient records:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Create a new medical record (visit)
 * POST /api/patients/{id}/records
 */
export const createPatientRecord = async (req: Request, res: Response) => {
  try {
    const { id: patientId } = req.params;
    const {
      visit_type,
      chief_complaint,
      present_illness,
      physical_examination,
      diagnosis,
      treatment_plan,
      doctor_notes,
      priority = 'normal',
      department_id,
      vital_signs,
      lab_orders,
      prescriptions
    } = req.body;

    const userId = (req as any).user.id;
    
    // Get a valid department ID if not provided
    let validDepartmentId = department_id;
    if (!validDepartmentId) {
      const deptResult = await databaseManager.query('SELECT id FROM departments LIMIT 1');
      validDepartmentId = deptResult.rows[0]?.id;
    }

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

    // Start transaction
    await databaseManager.query('BEGIN');

    try {
      // Create visit record
      const visitId = uuidv4();
      const visitNumber = `V${new Date().toISOString().slice(0, 7).replace('-', '')}${Date.now().toString().slice(-4)}`;

      await databaseManager.query(`
        INSERT INTO visits (
          id, patient_id, visit_number, visit_date, visit_time, visit_type,
          chief_complaint, present_illness, physical_examination, diagnosis,
          treatment_plan, doctor_notes, status, priority, attending_doctor_id,
          department_id, created_by
        )
        VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_TIME, $4, $5, $6, $7, $8, $9, $10, 'in_progress', $11, $12, $13, $14)
      `, [
        visitId, patientId, visitNumber, visit_type, chief_complaint,
        present_illness, physical_examination, diagnosis, treatment_plan,
        doctor_notes, priority, userId, validDepartmentId, userId
      ]);

      // Add vital signs if provided
      if (vital_signs) {
        const vitalSignsId = uuidv4();
        await databaseManager.query(`
          INSERT INTO vital_signs (
            id, visit_id, patient_id, systolic_bp, diastolic_bp, heart_rate,
            respiratory_rate, temperature, oxygen_saturation, weight, height,
            bmi, pain_scale, pain_location, blood_glucose, measured_by
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        `, [
          vitalSignsId, visitId, patientId, vital_signs.systolic_bp,
          vital_signs.diastolic_bp, vital_signs.heart_rate, vital_signs.respiratory_rate,
          vital_signs.temperature, vital_signs.oxygen_saturation, vital_signs.weight,
          vital_signs.height, vital_signs.bmi, vital_signs.pain_scale,
          vital_signs.pain_location, vital_signs.blood_glucose, userId
        ]);
      }

      // Add lab orders if provided
      if (lab_orders && lab_orders.length > 0) {
        for (const labOrder of lab_orders) {
          const labOrderId = uuidv4();
          const orderNumber = `LAB${new Date().toISOString().slice(0, 7).replace('-', '')}${Date.now().toString().slice(-4)}`;

          await databaseManager.query(`
            INSERT INTO lab_orders (
              id, visit_id, patient_id, order_number, _category, _name,
              _code, clinical_indication, specimen_type, priority, status, ordered_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ordered', $11)
          `, [
            labOrderId, visitId, patientId, orderNumber, labOrder._category,
            labOrder._name, labOrder._code, labOrder.clinical_indication,
            labOrder.specimen_type, labOrder.priority || 'routine', userId
          ]);
        }
      }

      // Add prescriptions if provided
      if (prescriptions && prescriptions.length > 0) {
        for (const prescription of prescriptions) {
          const prescriptionId = uuidv4();
          const prescriptionNumber = `RX${new Date().toISOString().slice(0, 7).replace('-', '')}${Date.now().toString().slice(-4)}`;

          await databaseManager.query(`
            INSERT INTO prescriptions (
              id, visit_id, patient_id, prescription_number, prescribed_by,
              diagnosis_for_prescription, status, general_instructions
            )
            VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)
          `, [
            prescriptionId, visitId, patientId, prescriptionNumber, userId,
            diagnosis, prescription.general_instructions
          ]);

          // Add prescription items
          if (prescription.medications && prescription.medications.length > 0) {
            for (const medication of prescription.medications) {
              const itemId = uuidv4();
              await databaseManager.query(`
                INSERT INTO prescription_items (
                  id, prescription_id, medication_name, strength, dosage_form,
                  quantity_prescribed, unit, dosage_instructions, duration_days
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
              `, [
                itemId, prescriptionId, medication.medication_name,
                medication.strength, medication.dosage_form, medication.quantity_prescribed,
                medication.unit, medication.dosage_instructions, medication.duration_days
              ]);
            }
          }
        }
      }

      await databaseManager.query('COMMIT');

      // Get the created visit with all related data
      const createdVisit = await databaseManager.query(`
        SELECT 
          v.id, v.visit_number, v.visit_date, v.visit_time, v.visit_type,
          v.chief_complaint, v.diagnosis, v.treatment_plan, v.status,
          u.first_name as doctor_first_name, u.last_name as doctor_last_name,
          d.department_name
        FROM visits v
        LEFT JOIN users u ON v.attending_doctor_id = u.id
        LEFT JOIN departments d ON v.department_id = d.id
        WHERE v.id = $1
      `, [visitId]);

      res.status(201).json({
        data: {
          visit: createdVisit.rows[0],
          message: 'Medical record created successfully'
        },
        meta: {
          timestamp: new Date().toISOString(),
          visitId: visitId
        },
        error: null,
        statusCode: 201
      });

    } catch (error) {
      await databaseManager.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error creating patient record:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Update a medical record
 * PUT /api/patients/{id}/records/{recordId}
 */
export const updatePatientRecord = async (req: Request, res: Response) => {
  try {
    const { id: actualPatientId, recordId } = req.params;
    const {
      chief_complaint,
      present_illness,
      physical_examination,
      diagnosis,
      treatment_plan,
      doctor_notes,
      status
    } = req.body;

    const userId = (req as any).user.id;

    // Validate visit exists and belongs to patient
    const visitExists = await databaseManager.query(`
      SELECT id, status FROM visits 
      WHERE id = $1 AND patient_id = $2
    `, [recordId, actualPatientId]);

    if (visitExists.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Medical record not found' },
        statusCode: 404
      });
    }

    // Update visit record
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (chief_complaint !== undefined) {
      updateFields.push(`chief_complaint = $${paramCount++}`);
      updateValues.push(chief_complaint);
    }
    if (present_illness !== undefined) {
      updateFields.push(`present_illness = $${paramCount++}`);
      updateValues.push(present_illness);
    }
    if (physical_examination !== undefined) {
      updateFields.push(`physical_examination = $${paramCount++}`);
      updateValues.push(physical_examination);
    }
    if (diagnosis !== undefined) {
      updateFields.push(`diagnosis = $${paramCount++}`);
      updateValues.push(diagnosis);
    }
    if (treatment_plan !== undefined) {
      updateFields.push(`treatment_plan = $${paramCount++}`);
      updateValues.push(treatment_plan);
    }
    if (doctor_notes !== undefined) {
      updateFields.push(`doctor_notes = $${paramCount++}`);
      updateValues.push(doctor_notes);
    }
    if (status !== undefined) {
      updateFields.push(`status = $${paramCount++}`);
      updateValues.push(status);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateFields.push(`updated_by = $${paramCount++}`);
    updateValues.push(userId);

    updateValues.push(recordId);

    const updateQuery = `
      UPDATE visits 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
    `;

    await databaseManager.query(updateQuery, updateValues);

    // Get updated visit
    const updatedVisit = await databaseManager.query(`
      SELECT 
        v.id, v.visit_number, v.visit_date, v.visit_time, v.visit_type,
        v.chief_complaint, v.diagnosis, v.treatment_plan, v.status,
        u.first_name as doctor_first_name, u.last_name as doctor_last_name,
        d.department_name, v.updated_at
      FROM visits v
      LEFT JOIN users u ON v.attending_doctor_id = u.id
      LEFT JOIN departments d ON v.department_id = d.id
      WHERE v.id = $1
    `, [recordId]);

    res.json({
      data: {
        visit: updatedVisit.rows[0],
        message: 'Medical record updated successfully'
      },
      meta: {
        timestamp: new Date().toISOString(),
        updatedBy: userId
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error updating patient record:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Delete a medical record (soft delete)
 * DELETE /api/patients/{id}/records/{recordId}
 */
export const deletePatientRecord = async (req: Request, res: Response) => {
  try {
    const { id: actualPatientId, recordId } = req.params;
    const userId = (req as any).user.id;

    // Validate visit exists and belongs to patient
    const visitExists = await databaseManager.query(`
      SELECT id, status FROM visits 
      WHERE id = $1 AND patient_id = $2
    `, [recordId, actualPatientId]);

    if (visitExists.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Medical record not found' },
        statusCode: 404
      });
    }

    // Soft delete by updating status to 'cancelled'
    await databaseManager.query(`
      UPDATE visits 
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP, updated_by = $1
      WHERE id = $2
    `, [userId, recordId]);

    res.json({
      data: {
        message: 'Medical record deleted successfully'
      },
      meta: {
        timestamp: new Date().toISOString(),
        deletedBy: userId
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error deleting patient record:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};
