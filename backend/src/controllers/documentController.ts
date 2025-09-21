import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

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
    const patientQuery = 'SELECT id, thai_name, national_id, hospital_number FROM users WHERE id = $1 AND role = $2';
    const patientResult = await client.query(patientQuery, [patientId, 'patient']);
    
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
        template,
        variables,
        attachments,
        status,
        notes,
        recorded_by,
        recorded_time,
        issued_by,
        issued_date,
        valid_until,
        recipient_info,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      patientId,
      visitId || null,
      'document',
      documentType,
      documentTitle,
      content,
      template || null,
      variables ? JSON.stringify(variables) : null,
      attachments ? JSON.stringify(attachments) : null,
      status || 'draft',
      notes || null,
      issuedBy,
      new Date().toISOString(),
      issuedBy,
      issuedDate || new Date().toISOString(),
      validUntil || null,
      recipientInfo ? JSON.stringify(recipientInfo) : null
    ];

    const result = await client.query(insertQuery, values);
    const documentRecord = result.rows[0];

    logger.info('Document created successfully', {
      patientId,
      recordId: documentRecord.id,
      documentType,
      issuedBy
    });

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
        template: documentRecord.template,
        variables: documentRecord.variables ? JSON.parse(documentRecord.variables) : {},
        attachments: documentRecord.attachments ? JSON.parse(documentRecord.attachments) : [],
        status: documentRecord.status,
        notes: documentRecord.notes,
        issuedBy: documentRecord.issued_by,
        issuedDate: documentRecord.issued_date,
        validUntil: documentRecord.valid_until,
        recipientInfo: documentRecord.recipient_info ? JSON.parse(documentRecord.recipient_info) : null,
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

  try {
    const client = await databaseManager.getClient();
    
    let query = `
      SELECT mr.*, u.thai_name, u.national_id, u.hospital_number
      FROM medical_records mr
      JOIN users u ON mr.patient_id = u.id
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
      variables: record.variables ? JSON.parse(record.variables) : {},
      attachments: record.attachments ? JSON.parse(record.attachments) : [],
      status: record.status,
      notes: record.notes,
      issuedBy: record.issued_by,
      issuedDate: record.issued_date,
      validUntil: record.valid_until,
      recipientInfo: record.recipient_info ? JSON.parse(record.recipient_info) : null,
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
      SELECT mr.*, u.thai_name, u.national_id, u.hospital_number
      FROM medical_records mr
      JOIN users u ON mr.patient_id = u.id
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
        variables: record.variables ? JSON.parse(record.variables) : {},
        attachments: record.attachments ? JSON.parse(record.attachments) : [],
        status: record.status,
        notes: record.notes,
        issuedBy: record.issued_by,
        issuedDate: record.issued_date,
        validUntil: record.valid_until,
        recipientInfo: record.recipient_info ? JSON.parse(record.recipient_info) : null,
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
        variables: updatedRecord.variables ? JSON.parse(updatedRecord.variables) : {},
        attachments: updatedRecord.attachments ? JSON.parse(updatedRecord.attachments) : [],
        status: updatedRecord.status,
        notes: updatedRecord.notes,
        issuedBy: updatedRecord.issued_by,
        issuedDate: updatedRecord.issued_date,
        validUntil: updatedRecord.valid_until,
        recipientInfo: updatedRecord.recipient_info ? JSON.parse(updatedRecord.recipient_info) : null,
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
