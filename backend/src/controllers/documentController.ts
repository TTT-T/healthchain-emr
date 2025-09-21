import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { NotificationService } from '../services/notificationService';

interface CreateDocumentRequest {
  patientId: string;
  visitId?: string;
  documentType: string;
  documentTitle: string;
  content: string;
  template?: string;
  variables?: Record<string, any>;
  attachments?: Array<{
    fileName: string;
    filePath: string;
    fileType: string;
    fileSize: number;
  }>;
  status: 'draft' | 'signed' | 'issued' | 'cancelled';
  issuedBy: string;
  issuedDate?: string;
  validUntil?: string;
  notes?: string;
  recipientInfo?: {
    name?: string;
    organization?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
}

interface UpdateDocumentRequest {
  documentTitle?: string;
  content?: string;
  template?: string;
  variables?: Record<string, any>;
  attachments?: any[];
  status?: string;
  issuedBy?: string;
  issuedDate?: string;
  validUntil?: string;
  notes?: string;
  recipientInfo?: any;
}

/**
 * Create document record
 */
export const createDocument = asyncHandler(async (req: Request, res: Response) => {
  const {
    patientId,
    visitId,
    documentType,
    documentTitle,
    content,
    template,
    variables,
    attachments,
    status,
    issuedBy,
    issuedDate,
    validUntil,
    notes,
    recipientInfo
  }: CreateDocumentRequest = req.body;

  // Validate required fields
  if (!patientId || !documentType || !documentTitle || !content || !issuedBy) {
    return res.status(400).json({
      statusCode: 400,
      message: 'Missing required fields: patientId, documentType, documentTitle, content, issuedBy',
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Required fields are missing'
      }
    });
  }

  try {
    const client = await databaseManager.getClient();
    
    // Check if patient exists
    const patientQuery = 'SELECT id, thai_name, national_id, hospital_number FROM patients WHERE id = $1';
    const patientResult = await client.query(patientQuery, [patientId]);
    
    if (patientResult.rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Patient not found',
        data: null,
        error: {
          code: 'PATIENT_NOT_FOUND',
          message: 'Patient with the specified ID does not exist'
        }
      });
    }

    const patient = patientResult.rows[0];

    // Create document record
    const insertQuery = `
      INSERT INTO medical_records (
        patient_id,
        visit_id,
        record_type,
        document_type,
        document_title,
        content,
        attachments,
        status,
        notes,
        recorded_by,
        recorded_time,
        issued_date,
        valid_until,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      patientId,
      visitId || null,
      'document',
      documentType,
      documentTitle,
      content,
      attachments ? JSON.stringify(attachments) : null,
      status || 'draft',
      notes || null,
      issuedBy, // This goes to recorded_by column
      new Date().toISOString(),
      issuedDate || new Date().toISOString(),
      validUntil || null
    ];

    const result = await client.query(insertQuery, values);
    const documentRecord = result.rows[0];

    logger.info('Document created successfully', {
      patientId,
      recordId: documentRecord.id,
      documentType,
      issuedBy
    });

    // ส่งการแจ้งเตือนให้ผู้ป่วย
    try {
      const user = (req as any).user;
      
      await NotificationService.sendPatientNotification({
        patientId: patient.id,
        patientHn: patient.hospital_number || '',
        patientName: patient.thai_name || `${patient.first_name} ${patient.last_name}`,
        patientPhone: patient.phone,
        patientEmail: patient.email,
        notificationType: 'document_created',
        title: `เอกสารใหม่: ${documentTitle}`,
        message: `มีเอกสารใหม่ "${documentTitle}" สำหรับคุณ ${patient.thai_name || patient.first_name}`,
        recordType: 'document',
        recordId: documentRecord.id,
        createdBy: user.id,
        createdByName: user.thai_name || `${user.first_name} ${user.last_name}`,
        metadata: {
          documentType,
          documentTitle,
          issuedDate,
          validUntil
        }
      });
    } catch (notificationError) {
      logger.error('Failed to send document notification:', notificationError);
      // ไม่ throw error เพื่อไม่ให้กระทบการสร้างเอกสาร
    }

    res.status(201).json({
      statusCode: 201,
      message: 'Document created successfully',
      data: {
        id: documentRecord.id,
        patientId: documentRecord.patient_id,
        visitId: documentRecord.visit_id,
        recordType: documentRecord.record_type,
        documentType: documentRecord.document_type,
        documentTitle: documentRecord.document_title,
        content: documentRecord.content,
        attachments: documentRecord.attachments ? (() => {
          try {
            return JSON.parse(documentRecord.attachments);
          } catch (e) {
            logger.warn('Failed to parse attachments JSON:', e);
            return [];
          }
        })() : [],
        status: documentRecord.status,
        notes: documentRecord.notes,
        issuedBy: documentRecord.recorded_by,
        issuedDate: documentRecord.issued_date,
        validUntil: documentRecord.valid_until,
        createdAt: documentRecord.created_at,
        updatedAt: documentRecord.updated_at
      },
      meta: {
        patient: {
          id: patient.id,
          thaiName: patient.thai_name,
          nationalId: patient.national_id,
          hospitalNumber: patient.hospital_number
        }
      }
    });

  } catch (error) {
    logger.error('Error creating document:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create document record'
      }
    });
  }
});

/**
 * Get documents by patient ID
 */
export const getDocumentsByPatient = asyncHandler(async (req: Request, res: Response) => {
  const { patientId } = req.params;
  const { documentType } = req.query;
  const user = (req as any).user;

  try {
    // Check if patient is trying to access their own documents
    if (user.role === 'patient' && user.id !== patientId) {
      return res.status(403).json({
        statusCode: 403,
        message: 'Access denied',
        data: null,
        error: {
          code: 'ACCESS_DENIED',
          message: 'Patients can only access their own documents'
        }
      });
    }

    const client = await databaseManager.getClient();
    
    let query = `
      SELECT mr.*, p.thai_name, p.national_id, p.hospital_number,
             u.thai_name as issued_by_name, u.first_name, u.last_name
      FROM medical_records mr
      JOIN patients p ON mr.patient_id = p.id
      LEFT JOIN users u ON mr.recorded_by = u.id
      WHERE mr.patient_id = $1 AND mr.record_type = 'document'
    `;
    
    const values = [patientId];
    
    if (documentType) {
      query += ` AND mr.document_type = $2`;
      values.push(documentType as string);
    }
    
    query += ` ORDER BY mr.issued_date DESC, mr.created_at DESC`;

    const result = await client.query(query, values);

    const documentRecords = result.rows.map(record => ({
      id: record.id,
      patientId: record.patient_id,
      visitId: record.visit_id,
      recordType: record.record_type,
      documentType: record.document_type,
      documentTitle: record.document_title,
      content: record.content,
      template: record.template,
      variables: record.variables ? (() => {
        try {
          return JSON.parse(record.variables);
        } catch (e) {
          logger.warn('Failed to parse variables JSON:', e);
          return {};
        }
      })() : {},
      attachments: record.attachments ? (() => {
        try {
          return JSON.parse(record.attachments);
        } catch (e) {
          logger.warn('Failed to parse attachments JSON:', e);
          return [];
        }
      })() : [],
      status: record.status,
      notes: record.notes,
      issuedBy: record.issued_by_name || (record.first_name && record.last_name ? `${record.first_name} ${record.last_name}` : record.recorded_by),
      issuedDate: record.issued_date,
      validUntil: record.valid_until,
      recipientInfo: record.recipient_info ? (() => {
        try {
          return JSON.parse(record.recipient_info);
        } catch (e) {
          logger.warn('Failed to parse recipientInfo JSON:', e);
          return null;
        }
      })() : null,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      patient: {
        thaiName: record.thai_name,
        nationalId: record.national_id,
        hospitalNumber: record.hospital_number
      }
    }));

    res.status(200).json({
      statusCode: 200,
      message: 'Documents retrieved successfully',
      data: documentRecords,
      meta: {
        total: documentRecords.length,
        documentType: documentType || 'all'
      }
    });

  } catch (error) {
    logger.error('Error retrieving documents:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve documents'
      }
    });
  }
});

/**
 * Get document by ID
 */
export const getDocumentById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const client = await databaseManager.getClient();
    
    const query = `
      SELECT mr.*, p.thai_name, p.national_id, p.hospital_number
      FROM medical_records mr
      JOIN patients p ON mr.patient_id = p.id
      WHERE mr.id = $1 AND mr.record_type = 'document'
    `;

    const result = await client.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Document record not found',
        data: null,
        error: {
          code: 'RECORD_NOT_FOUND',
          message: 'Document record with the specified ID does not exist'
        }
      });
    }

    const record = result.rows[0];

    res.status(200).json({
      statusCode: 200,
      message: 'Document retrieved successfully',
      data: {
        id: record.id,
        patientId: record.patient_id,
        visitId: record.visit_id,
        recordType: record.record_type,
        documentType: record.document_type,
        documentTitle: record.document_title,
        content: record.content,
        template: record.template,
        variables: record.variables ? (() => {
          try {
            return JSON.parse(record.variables);
          } catch (e) {
            logger.warn('Failed to parse variables JSON:', e);
            return {};
          }
        })() : {},
        attachments: record.attachments ? (() => {
          try {
            return JSON.parse(record.attachments);
          } catch (e) {
            logger.warn('Failed to parse attachments JSON:', e);
            return [];
          }
        })() : [],
        status: record.status,
        notes: record.notes,
        issuedBy: record.recorded_by,
        issuedDate: record.issued_date,
        validUntil: record.valid_until,
        recipientInfo: record.recipient_info ? (() => {
          try {
            return JSON.parse(record.recipient_info);
          } catch (e) {
            logger.warn('Failed to parse recipientInfo JSON:', e);
            return null;
          }
        })() : null,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
        patient: {
          thaiName: record.thai_name,
          nationalId: record.national_id,
          hospitalNumber: record.hospital_number
        }
      }
    });

  } catch (error) {
    logger.error('Error retrieving document:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve document'
      }
    });
  }
});

/**
 * Update document record
 */
export const updateDocument = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData: UpdateDocumentRequest = req.body;

  try {
    const client = await databaseManager.getClient();
    
    // Check if record exists
    const checkQuery = 'SELECT id FROM medical_records WHERE id = $1 AND record_type = $2';
    const checkResult = await client.query(checkQuery, [id, 'document']);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Document record not found',
        data: null,
        error: {
          code: 'RECORD_NOT_FOUND',
          message: 'Document record with the specified ID does not exist'
        }
      });
    }

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        if (typeof value === 'object') {
          updateFields.push(`${dbField} = $${paramCount}`);
          values.push(JSON.stringify(value));
        } else {
          updateFields.push(`${dbField} = $${paramCount}`);
          values.push(value);
        }
        paramCount++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        statusCode: 400,
        message: 'No fields to update',
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'At least one field must be provided for update'
        }
      });
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(id);

    const updateQuery = `
      UPDATE medical_records 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount} AND record_type = 'document'
      RETURNING *
    `;

    const result = await client.query(updateQuery, values);
    const updatedRecord = result.rows[0];

    logger.info('Document updated successfully', {
      recordId: id,
      updatedFields: Object.keys(updateData)
    });

    res.status(200).json({
      statusCode: 200,
      message: 'Document updated successfully',
      data: {
        id: updatedRecord.id,
        patientId: updatedRecord.patient_id,
        visitId: updatedRecord.visit_id,
        recordType: updatedRecord.record_type,
        documentType: updatedRecord.document_type,
        documentTitle: updatedRecord.document_title,
        content: updatedRecord.content,
        template: updatedRecord.template,
        variables: updatedRecord.variables ? (() => {
          try {
            return JSON.parse(updatedRecord.variables);
          } catch (e) {
            logger.warn('Failed to parse variables JSON:', e);
            return {};
          }
        })() : {},
        attachments: updatedRecord.attachments ? (() => {
          try {
            return JSON.parse(updatedRecord.attachments);
          } catch (e) {
            logger.warn('Failed to parse attachments JSON:', e);
            return [];
          }
        })() : [],
        status: updatedRecord.status,
        notes: updatedRecord.notes,
        issuedBy: updatedRecord.recorded_by,
        issuedDate: updatedRecord.issued_date,
        validUntil: updatedRecord.valid_until,
        recipientInfo: updatedRecord.recipient_info ? (() => {
          try {
            return JSON.parse(updatedRecord.recipient_info);
          } catch (e) {
            logger.warn('Failed to parse recipientInfo JSON:', e);
            return null;
          }
        })() : null,
        createdAt: updatedRecord.created_at,
        updatedAt: updatedRecord.updated_at
      }
    });

  } catch (error) {
    logger.error('Error updating document:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update document record'
      }
    });
  }
});

/**
 * Delete document record
 */
export const deleteDocument = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const client = await databaseManager.getClient();
    
    const deleteQuery = 'DELETE FROM medical_records WHERE id = $1 AND record_type = $2 RETURNING id';
    const result = await client.query(deleteQuery, [id, 'document']);

    if (result.rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Document record not found',
        data: null,
        error: {
          code: 'RECORD_NOT_FOUND',
          message: 'Document record with the specified ID does not exist'
        }
      });
    }

    logger.info('Document deleted successfully', { recordId: id });

    res.status(200).json({
      statusCode: 200,
      message: 'Document deleted successfully',
      data: { id: result.rows[0].id }
    });

  } catch (error) {
    logger.error('Error deleting document:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete document record'
      }
    });
  }
});
