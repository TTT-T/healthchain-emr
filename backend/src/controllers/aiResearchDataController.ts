import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';

/**
 * AI Research Data Controller
 * จัดการข้อมูล AI Research Data จาก EMR forms
 */

/**
 * Create AI research data
 * POST /api/patients/{id}/ai-research-data
 */
export const createAIResearchData = async (req: Request, res: Response) => {
  try {
    const { id: patientId } = req.params;
    const {
      recordType,
      recordId,
      researchData,
      dataVersion = '1.0'
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

    // Validate required fields
    if (!recordType || !researchData) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: { message: 'recordType and researchData are required' },
        statusCode: 400
      });
    }

    // Validate record type
    const validRecordTypes = ['doctor_visit', 'pharmacy', 'lab_result', 'appointment'];
    if (!validRecordTypes.includes(recordType)) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: { message: 'Invalid record type' },
        statusCode: 400
      });
    }

    // Create AI research data record
    const researchId = uuidv4();

    await databaseManager.query(`
      INSERT INTO ai_research_data (
        id, patient_id, record_type, record_id, research_data,
        data_version, recorded_by, recorded_time
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() AT TIME ZONE 'Asia/Bangkok')
      RETURNING *
    `, [
      researchId, patientId, recordType, recordId, JSON.stringify(researchData),
      dataVersion, userId
    ]);

    // Get created record
    const createdRecord = await databaseManager.query(`
      SELECT 
        ard.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        u.first_name as recorded_by_first_name,
        u.last_name as recorded_by_last_name
      FROM ai_research_data ard
      LEFT JOIN patients p ON ard.patient_id = p.id
      LEFT JOIN users u ON ard.recorded_by = u.id
      WHERE ard.id = $1
    `, [researchId]);

    res.status(201).json({
      data: createdRecord.rows[0],
      meta: {
        timestamp: new Date().toISOString(),
        recordType,
        dataVersion
      },
      error: null,
      statusCode: 201
    });

  } catch (error) {
    console.error('Error creating AI research data:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Get AI research data for a patient
 * GET /api/patients/{id}/ai-research-data
 */
export const getPatientAIResearchData = async (req: Request, res: Response) => {
  try {
    const { id: patientId } = req.params;
    const { page = 1, limit = 10, recordType, isActive = true } = req.query;
    const user = (req as any).user;

    // Get patient ID based on user role
    let actualPatientId: string;
    let patient: any;
    
    // For patients, they can only access their own data
    if (user.role === 'patient') {
      let patientQuery = await databaseManager.query(
        'SELECT id, first_name, last_name, user_id, email FROM patients WHERE user_id = $1',
        [user.id]
      );
      
      if (patientQuery.rows.length === 0) {
        patientQuery = await databaseManager.query(
          'SELECT id, first_name, last_name, user_id, email FROM patients WHERE email = $1',
          [user.email]
        );
      }
      
      if (patientQuery.rows.length === 0) {
        return res.status(404).json({
          data: null,
          meta: null,
          error: { message: 'Patient not found' },
          statusCode: 404
        });
      }
      
      patient = patientQuery.rows[0];
      actualPatientId = patient.id;
    } else {
      // For doctors/admins, use the provided patient ID
      const patientResult = await databaseManager.query(
        'SELECT id, first_name, last_name, email FROM patients WHERE id = $1',
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

    // Build query
    let whereClause = 'WHERE ard.patient_id = $1';
    const queryParams: any[] = [actualPatientId];

    if (recordType) {
      whereClause += ' AND ard.record_type = $2';
      queryParams.push(recordType);
    }

    if (isActive !== undefined) {
      const paramIndex = queryParams.length + 1;
      whereClause += ` AND ard.is_active = $${paramIndex}`;
      queryParams.push(isActive === 'true');
    }

    // Get AI research data
    const researchDataQuery = `
      SELECT 
        ard.id,
        ard.record_type,
        ard.record_id,
        ard.research_data,
        ard.data_version,
        ard.is_active,
        ard.recorded_time,
        ard.created_at,
        ard.updated_at,
        u.first_name as recorded_by_first_name,
        u.last_name as recorded_by_last_name
      FROM ai_research_data ard
      LEFT JOIN users u ON ard.recorded_by = u.id
      ${whereClause}
      ORDER BY ard.recorded_time DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    queryParams.push(Number(limit), offset);

    const researchDataResult = await databaseManager.query(researchDataQuery, queryParams);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ai_research_data ard
      ${whereClause}
    `;
    const countResult = await databaseManager.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    res.status(200).json({
      data: researchDataResult.rows,
      meta: {
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        },
        timestamp: new Date().toISOString(),
        patient: {
          id: patient.id,
          name: `${patient.first_name} ${patient.last_name}`
        }
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error retrieving AI research data:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Update AI research data
 * PUT /api/patients/{id}/ai-research-data/{researchId}
 */
export const updateAIResearchData = async (req: Request, res: Response) => {
  try {
    const { id: patientId, researchId } = req.params;
    const { researchData, isActive } = req.body;
    const userId = (req as any).user.id;

    // Validate patient exists
    const patientExists = await databaseManager.query(
      'SELECT id FROM patients WHERE id = $1',
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

    // Check if research data exists
    const existingRecord = await databaseManager.query(
      'SELECT id, patient_id FROM ai_research_data WHERE id = $1 AND patient_id = $2',
      [researchId, patientId]
    );

    if (existingRecord.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'AI research data not found' },
        statusCode: 404
      });
    }

    // Update record
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (researchData !== undefined) {
      updateFields.push(`research_data = $${paramIndex}`);
      updateValues.push(JSON.stringify(researchData));
      paramIndex++;
    }

    if (isActive !== undefined) {
      updateFields.push(`is_active = $${paramIndex}`);
      updateValues.push(isActive);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: { message: 'No fields to update' },
        statusCode: 400
      });
    }

    updateValues.push(researchId);

    const updateQuery = `
      UPDATE ai_research_data 
      SET ${updateFields.join(', ')}, updated_at = NOW() AT TIME ZONE 'Asia/Bangkok'
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const updatedRecord = await databaseManager.query(updateQuery, updateValues);

    res.status(200).json({
      data: updatedRecord.rows[0],
      meta: {
        timestamp: new Date().toISOString(),
        updatedFields: updateFields.length
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error updating AI research data:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Delete AI research data
 * DELETE /api/patients/{id}/ai-research-data/{researchId}
 */
export const deleteAIResearchData = async (req: Request, res: Response) => {
  try {
    const { id: patientId, researchId } = req.params;

    // Validate patient exists
    const patientExists = await databaseManager.query(
      'SELECT id FROM patients WHERE id = $1',
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

    // Check if research data exists
    const existingRecord = await databaseManager.query(
      'SELECT id FROM ai_research_data WHERE id = $1 AND patient_id = $2',
      [researchId, patientId]
    );

    if (existingRecord.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'AI research data not found' },
        statusCode: 404
      });
    }

    // Delete record
    await databaseManager.query(
      'DELETE FROM ai_research_data WHERE id = $1',
      [researchId]
    );

    res.status(200).json({
      data: { message: 'AI research data deleted successfully' },
      meta: {
        timestamp: new Date().toISOString(),
        deletedId: researchId
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error deleting AI research data:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};
