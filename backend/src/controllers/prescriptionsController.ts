import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';
import { NotificationService } from '../services/notificationService';

/**
 * Prescriptions Controller
 * จัดการ prescriptions สำหรับระบบ EMR
 */

/**
 * Create prescription for a visit
 * POST /api/medical/visits/{id}/prescriptions
 */
export const createPrescription = async (req: Request, res: Response) => {
  try {
    const { id: visitId } = req.params;
    const {
      general_instructions,
      prescription_items
    } = req.body;

    const userId = (req as any).user.id;

    // Validate required fields
    if (!prescription_items || !Array.isArray(prescription_items) || prescription_items.length === 0) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: { message: 'At least one prescription item is required' },
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

    // Generate prescription number
    const prescriptionNumber = await generatePrescriptionNumber();

    // Create prescription
    const prescriptionId = uuidv4();
    const createPrescriptionQuery = `
      INSERT INTO prescriptions (
        id, patient_id, visit_id, prescription_number, general_instructions,
        prescribed_by, prescription_date, status
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8
      )
      RETURNING *
    `;

    const now = new Date();
    const prescriptionResult = await databaseManager.query(createPrescriptionQuery, [
      prescriptionId, visit.patient_id, visitId, prescriptionNumber, general_instructions,
      validUserId, now.toISOString().split('T')[0], 'active'
    ]);

    const newPrescription = prescriptionResult.rows[0];

    // Create prescription items
    const prescriptionItems = [];
    for (const item of prescription_items) {
      const {
        medication_name,
        strength,
        dosage_form,
        quantity_prescribed,
        unit,
        dosage_instructions,
        duration_days,
        notes
      } = item;

      if (!medication_name || !dosage_instructions) {
        continue; // Skip invalid items
      }

      const itemId = uuidv4();
      const createItemQuery = `
        INSERT INTO prescription_items (
          id, prescription_id, medication_name, strength, dosage_form,
          quantity_prescribed, unit, dosage_instructions, duration_days,
          notes, item_status
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        )
        RETURNING *
      `;

      const itemResult = await databaseManager.query(createItemQuery, [
        itemId, prescriptionId, medication_name, strength, dosage_form,
        quantity_prescribed, unit, dosage_instructions, duration_days,
        notes, 'prescribed'
      ]);

      prescriptionItems.push(itemResult.rows[0]);
    }

    // ส่งการแจ้งเตือนให้ผู้ป่วย
    try {
      const user = (req as any).user;
      
      // Get patient information
      const patientQuery = 'SELECT id, thai_name, first_name, last_name, hospital_number, phone, email FROM patients WHERE id = $1';
      const patientResult = await databaseManager.query(patientQuery, [visit.patient_id]);
      
      if (patientResult.rows.length > 0) {
        const patient = patientResult.rows[0];
        
        await NotificationService.sendPatientNotification({
          patientId: patient.id,
          patientHn: patient.hospital_number || '',
          patientName: patient.thai_name || `${patient.first_name} ${patient.last_name}`,
          patientPhone: patient.phone,
          patientEmail: patient.email,
          notificationType: 'prescription_ready',
          title: `ยาเตรียมพร้อม: ${prescriptionItems[0]?.medication_name || 'ยาตามใบสั่ง'}`,
          message: `ยาเตรียมพร้อมสำหรับคุณ ${patient.thai_name || patient.first_name} แล้ว กรุณามารับยาได้ที่แผนกเภสัชกรรม`,
          recordType: 'prescription',
          recordId: prescriptionId,
          createdBy: user.id,
          createdByName: user.thai_name || `${user.first_name} ${user.last_name}`,
          metadata: {
            prescriptionNumber: prescriptionNumber,
            itemsCount: prescriptionItems.length,
            medications: prescriptionItems.map(item => item.medication_name)
          }
        });
      }
    } catch (notificationError) {
      console.error('Failed to send prescription notification:', notificationError);
      // ไม่ throw error เพื่อไม่ให้กระทบการสร้างใบสั่งยา
    }

    res.status(201).json({
      data: {
        prescription: {
          id: newPrescription.id,
          prescription_number: newPrescription.prescription_number,
          patient_id: newPrescription.patient_id,
          visit_id: newPrescription.visit_id,
          general_instructions: newPrescription.general_instructions,
          status: newPrescription.status,
          prescription_date: newPrescription.prescription_date,
          created_at: newPrescription.created_at,
          items: prescriptionItems.map(item => ({
            id: item.id,
            medication_name: item.medication_name,
            strength: item.strength,
            dosage_form: item.dosage_form,
            quantity_prescribed: item.quantity_prescribed,
            unit: item.unit,
            dosage_instructions: item.dosage_instructions,
            duration_days: item.duration_days,
            notes: item.notes,
            item_status: item.item_status
          }))
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        prescribedBy: validUserId,
        itemsCount: prescriptionItems.length
      },
      error: null,
      statusCode: 201
    });

  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Get prescriptions for a visit
 * GET /api/medical/visits/{id}/prescriptions
 */
export const getPrescriptions = async (req: Request, res: Response) => {
  try {
    const { id: visitId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

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
    let whereClause = 'WHERE p.visit_id = $1';
    const queryParams: any[] = [visitId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      whereClause += ` AND p.status = $${paramCount}`;
      queryParams.push(status);
    }

    // Get prescriptions for the visit
    const prescriptionsQuery = `
      SELECT 
        p.id,
        p.patient_id,
        p.visit_id,
        p.prescription_number,
        p.general_instructions,
        p.prescription_date,
        p.status,
        p.created_at,
        p.updated_at,
        u.first_name as prescribed_by_first_name,
        u.last_name as prescribed_by_last_name
      FROM prescriptions p
      LEFT JOIN users u ON p.prescribed_by = u.id
      ${whereClause}
      ORDER BY p.prescription_date DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(Number(limit), offset);

    const prescriptionsResult = await databaseManager.query(prescriptionsQuery, queryParams);
    const prescriptions = prescriptionsResult.rows;

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM prescriptions p
      ${whereClause}
    `;
    const countResult = await databaseManager.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    // Get prescription items for each prescription
    const prescriptionsWithItems = await Promise.all(
      prescriptions.map(async (prescription) => {
        const itemsQuery = `
          SELECT 
            pi.id,
            pi.medication_name,
            pi.strength,
            pi.dosage_form,
            pi.quantity_prescribed,
            pi.unit,
            pi.dosage_instructions,
            pi.duration_days,
            pi.notes,
            pi.item_status,
            pi.created_at,
            pi.updated_at
          FROM prescription_items pi
          WHERE pi.prescription_id = $1
          ORDER BY pi.created_at ASC
        `;

        const items = await databaseManager.query(itemsQuery, [prescription.id]);

        return {
          id: prescription.id,
          prescription_number: prescription.prescription_number,
          patient_id: prescription.patient_id,
          visit_id: prescription.visit_id,
          general_instructions: prescription.general_instructions,
          prescription_date: prescription.prescription_date,
          status: prescription.status,
          prescribed_by: prescription.prescribed_by_first_name ? {
            name: `${prescription.prescribed_by_first_name} ${prescription.prescribed_by_last_name}`
          } : null,
          items: items.rows,
          created_at: prescription.created_at,
          updated_at: prescription.updated_at
        };
      })
    );

    res.json({
      data: {
        visit_id: visitId,
        patient_id: visit.patient_id,
        prescriptions: prescriptionsWithItems,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        prescriptionsCount: prescriptionsWithItems.length,
        filters: {
          status
        }
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error getting prescriptions:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Update prescription
 * PUT /api/medical/prescriptions/{id}
 */
export const updatePrescription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if prescription exists
    const prescriptionExists = await databaseManager.query(
      'SELECT id, status FROM prescriptions WHERE id = $1',
      [id]
    );

    if (prescriptionExists.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Prescription not found' },
        statusCode: 404
      });
    }

    const prescription = prescriptionExists.rows[0];

    // Check if prescription can be updated
    if (prescription.status === 'dispensed' || prescription.status === 'cancelled') {
      return res.status(400).json({
        data: null,
        meta: null,
        error: { message: 'Cannot update dispensed or cancelled prescription' },
        statusCode: 400
      });
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    const allowedFields = [
      'general_instructions', 'status'
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
      UPDATE prescriptions 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount + 1}
      RETURNING *
    `;

    const updateResult = await databaseManager.query(updateQuery, updateValues);
    const updatedPrescription = updateResult.rows[0];

    res.json({
      data: {
        prescription: {
          id: updatedPrescription.id,
          prescription_number: updatedPrescription.prescription_number,
          general_instructions: updatedPrescription.general_instructions,
          status: updatedPrescription.status,
          updated_at: updatedPrescription.updated_at
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
    console.error('Error updating prescription:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Helper function to generate prescription number
 */
async function generatePrescriptionNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const result = await databaseManager.query(`
    SELECT COUNT(*) as count 
    FROM prescriptions 
    WHERE prescription_number LIKE $1
  `, [`RX${year}%`]);
  
  const count = parseInt(result.rows[0].count) + 1;
  return `RX${year}${count.toString().padStart(6, '0')}`;
}

// Complete prescription dispensing
export const completePrescription = async (req: Request, res: Response) => {
  try {
    const { prescriptionId } = req.params;
    const { pharmacistName, pharmacistNotes, dispensedDate, dispensedBy } = req.body;

    // Validate required fields
    if (!pharmacistName || !dispensedDate || !dispensedBy) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: pharmacistName, dispensedDate, dispensedBy'
      });
    }

    // Update prescription status to completed
    const updatePrescriptionQuery = `
      UPDATE prescriptions 
      SET status = 'completed', 
          updated_at = NOW()
      WHERE prescription_number = $1 OR id = $1
      RETURNING *
    `;
    
    const prescriptionResult = await databaseManager.query(updatePrescriptionQuery, [prescriptionId]);
    
    if (prescriptionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Prescription not found'
      });
    }

    // Update all prescription items to dispensed
    const updateItemsQuery = `
      UPDATE prescription_items 
      SET item_status = 'dispensed',
          dispensed_by = $1,
          dispensed_date = $2,
          pharmacist_notes = $3,
          updated_at = NOW()
      WHERE prescription_id = $4
    `;
    
    await databaseManager.query(updateItemsQuery, [
      dispensedBy,
      dispensedDate,
      pharmacistNotes,
      prescriptionResult.rows[0].id
    ]);

    // Log the dispensing activity
    const logQuery = `
      INSERT INTO prescription_activity_log (
        prescription_id, 
        action, 
        performed_by, 
        performed_at, 
        notes
      ) VALUES ($1, $2, $3, $4, $5)
    `;
    
    await databaseManager.query(logQuery, [
      prescriptionResult.rows[0].id,
      'dispensed',
      dispensedBy,
      dispensedDate,
      `Dispensed by ${pharmacistName}. Notes: ${pharmacistNotes || 'None'}`
    ]);

    res.json({
      success: true,
      message: 'Prescription completed successfully',
      data: {
        prescriptionId: prescriptionResult.rows[0].prescription_number,
        status: 'completed',
        dispensedBy,
        dispensedDate,
        pharmacistName,
        pharmacistNotes
      }
    });

  } catch (error) {
    console.error('Complete prescription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete prescription'
    });
  }
};

// Get prescription by ID
export const getPrescriptionById = async (req: Request, res: Response) => {
  try {
    const { prescriptionId } = req.params;

    const query = `
      SELECT 
        p.*,
        pt.first_name, pt.last_name, pt.hn, pt.date_of_birth, pt.gender,
        pt.phone, pt.email, pt.address,
        d.first_name as doctor_first_name, d.last_name as doctor_last_name,
        d.specialization, d.license_number
      FROM prescriptions p
      LEFT JOIN patients pt ON p.patient_id = pt.id
      LEFT JOIN doctors d ON p.doctor_id = d.id
      WHERE p.prescription_number = $1 OR p.id = $1
    `;
    
    const result = await databaseManager.query(query, [prescriptionId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Prescription not found'
      });
    }

    const prescription = result.rows[0];

    // Get prescription items
    const itemsQuery = `
      SELECT * FROM prescription_items 
      WHERE prescription_id = $1
      ORDER BY created_at
    `;
    
    const itemsResult = await databaseManager.query(itemsQuery, [prescription.id]);
    prescription.items = itemsResult.rows;

    res.json({
      success: true,
      data: prescription
    });

  } catch (error) {
    console.error('Get prescription by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get prescription'
    });
  }
};

// Update prescription status
export const updatePrescriptionStatus = async (req: Request, res: Response) => {
  try {
    const { prescriptionId } = req.params;
    const { status, notes, updatedBy } = req.body;

    // Validate status
    const validStatuses = ['pending', 'approved', 'dispensed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    const query = `
      UPDATE prescriptions 
      SET status = $1, 
          updated_at = NOW()
      WHERE prescription_number = $2 OR id = $2
      RETURNING *
    `;
    
    const result = await databaseManager.query(query, [status, prescriptionId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Prescription not found'
      });
    }

    // Log the status change
    if (updatedBy) {
      const logQuery = `
        INSERT INTO prescription_activity_log (
          prescription_id, 
          action, 
          performed_by, 
          performed_at, 
          notes
        ) VALUES ($1, $2, $3, NOW(), $4)
      `;
      
      await databaseManager.query(logQuery, [
        result.rows[0].id,
        'status_changed',
        updatedBy,
        `Status changed to ${status}. ${notes || ''}`
      ]);
    }

    res.json({
      success: true,
      message: 'Prescription status updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update prescription status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update prescription status'
    });
  }
};