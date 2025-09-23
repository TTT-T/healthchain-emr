import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

/**
 * Medical Documents Controller
 * จัดการเอกสารทางการแพทย์ของผู้ป่วย
 */

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/medical-documents');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and documents are allowed'));
    }
  }
});

export { upload };

/**
 * Get medical documents for a patient
 * GET /api/patients/{id}/documents
 */
export const getPatientDocuments = async (req: Request, res: Response) => {
  try {
    const { id: patientId } = req.params;
    const { page = 1, limit = 10, documentType, startDate, endDate } = req.query;
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
        // If still no patient found, create one
        const newPatientId = uuidv4();
        await databaseManager.query(
          `INSERT INTO patients (
            id, user_id, email, first_name, last_name, 
            date_of_birth, phone, emergency_contact, 
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            newPatientId,
            user.id,
            user.email,
            user.first_name || 'Patient',
            user.last_name || 'User',
            '1990-01-01', // Default date
            user.phone || '',
            '{}', // Empty JSON object for emergency contact
            new Date(),
            new Date()
          ]
        );
        
        patient = {
          id: newPatientId,
          first_name: user.first_name || 'Patient',
          last_name: user.last_name || 'User',
          user_id: user.id,
          email: user.email
        };
        actualPatientId = newPatientId;
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

    // Build query for medical documents
    let whereClause = 'WHERE md.patient_id = $1';
    const queryParams: any[] = [actualPatientId];

    if (documentType) {
      whereClause += ' AND md.document_type = $2';
      queryParams.push(documentType);
    }

    if (startDate) {
      const paramIndex = queryParams.length + 1;
      whereClause += ` AND md.upload_date >= $${paramIndex}`;
      queryParams.push(startDate);
    }

    if (endDate) {
      const paramIndex = queryParams.length + 1;
      whereClause += ` AND md.upload_date <= $${paramIndex}`;
      queryParams.push(endDate);
    }

    // Get medical documents
    const documentsQuery = `
      SELECT 
        md.id,
        md.document_name,
        md.document_type,
        md.file_path,
        md.file_size,
        md.mime_type,
        md.description,
        md.tags,
        md.is_confidential,
        md.upload_date,
        md.created_at,
        md.updated_at,
        u.first_name as uploaded_by_first_name,
        u.last_name as uploaded_by_last_name,
        v.visit_number,
        v.visit_date
      FROM medical_documents md
      LEFT JOIN users u ON md.uploaded_by = u.id
      LEFT JOIN visits v ON md.visit_id = v.id
      ${whereClause}
      ORDER BY md.upload_date DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    queryParams.push(Number(limit), offset);

    const documentsResult = await databaseManager.query(documentsQuery, queryParams);
    const documents = documentsResult.rows;

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM medical_documents md
      ${whereClause}
    `;
    const countResult = await databaseManager.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    // Format documents
    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      document_name: doc.document_name,
      document_type: doc.document_type,
      file_path: doc.file_path,
      file_size: doc.file_size,
      mime_type: doc.mime_type,
      description: doc.description,
      tags: doc.tags ? doc.tags.split(',') : [],
      is_confidential: doc.is_confidential,
      upload_date: doc.upload_date,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
      uploaded_by: {
        name: `${doc.uploaded_by_first_name} ${doc.uploaded_by_last_name}`
      },
      visit: doc.visit_number ? {
        number: doc.visit_number,
        date: doc.visit_date
      } : null
    }));

    res.json({
      data: {
        patient: {
          id: patient.id,
          name: `${patient.first_name} ${patient.last_name}`
        },
        documents: formattedDocuments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        documentCount: formattedDocuments.length
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error getting patient documents:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Upload medical document
 * POST /api/patients/{id}/documents
 */
export const uploadPatientDocument = async (req: Request, res: Response) => {
  try {
    const { id: patientId } = req.params;
    const {
      document_type,
      description,
      tags,
      is_confidential = false,
      visit_id
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

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: { message: 'No file uploaded' },
        statusCode: 400
      });
    }

    const file = req.file;

    // Create document record
    const documentId = uuidv4();
    const tagsArray = tags ? tags.split(',').map((tag: string) => tag.trim()) : [];
    const tagsString = tagsArray.join(',');

    await databaseManager.query(`
      INSERT INTO medical_documents (
        id, patient_id, visit_id, document_name, document_type,
        file_path, file_size, mime_type, description, tags,
        is_confidential, uploaded_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [
      documentId, patientId, visit_id || null, file.originalname, document_type,
      file.path, file.size, file.mimetype, description, tagsString,
      is_confidential, userId
    ]);

    // Get created document
    const createdDocument = await databaseManager.query(`
      SELECT 
        md.id, md.document_name, md.document_type, md.file_path,
        md.file_size, md.mime_type, md.description, md.tags,
        md.is_confidential, md.upload_date,
        u.first_name as uploaded_by_first_name, u.last_name as uploaded_by_last_name
      FROM medical_documents md
      LEFT JOIN users u ON md.uploaded_by = u.id
      WHERE md.id = $1
    `, [documentId]);

    res.status(201).json({
      data: {
        document: {
          ...createdDocument.rows[0],
          tags: createdDocument.rows[0].tags ? createdDocument.rows[0].tags.split(',') : [],
          uploaded_by: {
            name: `${createdDocument.rows[0].uploaded_by_first_name} ${createdDocument.rows[0].uploaded_by_last_name}`
          }
        },
        message: 'Document uploaded successfully'
      },
      meta: {
        timestamp: new Date().toISOString(),
        documentId: documentId
      },
      error: null,
      statusCode: 201
    });

  } catch (error) {
    console.error('Error uploading patient document:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Delete medical document
 * DELETE /api/patients/{id}/documents/{docId}
 */
export const deletePatientDocument = async (req: Request, res: Response) => {
  try {
    const { id: actualPatientId, docId } = req.params;
    const userId = (req as any).user.id;

    // Validate document exists and belongs to patient
    const documentExists = await databaseManager.query(`
      SELECT id, file_path FROM medical_documents 
      WHERE id = $1 AND patient_id = $2
    `, [docId, actualPatientId]);

    if (documentExists.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Document not found' },
        statusCode: 404
      });
    }

    const document = documentExists.rows[0];

    // Delete file from filesystem
    try {
      if (fs.existsSync(document.file_path)) {
        fs.unlinkSync(document.file_path);
      }
    } catch (fileError) {
      console.warn('Could not delete file from filesystem:', fileError);
    }

    // Delete document record
    await databaseManager.query(`
      DELETE FROM medical_documents 
      WHERE id = $1
    `, [docId]);

    res.json({
      data: {
        message: 'Document deleted successfully'
      },
      meta: {
        timestamp: new Date().toISOString(),
        deletedBy: userId
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error deleting patient document:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Download medical document
 * GET /api/patients/{id}/documents/{docId}/download
 */
export const downloadPatientDocument = async (req: Request, res: Response) => {
  try {
    const { id: actualPatientId, docId } = req.params;

    // Validate document exists and belongs to patient
    const documentExists = await databaseManager.query(`
      SELECT id, document_name, file_path, mime_type FROM medical_documents 
      WHERE id = $1 AND patient_id = $2
    `, [docId, actualPatientId]);

    if (documentExists.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Document not found' },
        statusCode: 404
      });
    }

    const document = documentExists.rows[0];

    // Check if file exists
    if (!fs.existsSync(document.file_path)) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'File not found on server' },
        statusCode: 404
      });
    }

    // Set headers for file download
    res.setHeader('Content-Type', document.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${document.document_name}"`);

    // Stream file to response
    const fileStream = fs.createReadStream(document.file_path);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error downloading patient document:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};
