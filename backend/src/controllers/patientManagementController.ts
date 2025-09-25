import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';

/**
 * Patient Management Controller
 * จัดการข้อมูลผู้ป่วยสำหรับระบบ EMR
 */

/**
 * Search users by national ID (for patient registration)
 * GET /api/medical/users/search
 */
export const searchUsersByNationalId = async (req: Request, res: Response) => {
  try {
    const { national_id } = req.query;

    if (!national_id) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: { message: 'National ID is required' },
        statusCode: 400
      });
    }

    // First check if patient already exists in patients table
    const patientCheckQuery = `
      SELECT 
        p.id,
        p.hospital_number,
        p.first_name,
        p.last_name,
        p.thai_name,
        p.thai_last_name,
        p.title,
        p.national_id,
        p.date_of_birth,
        p.gender,
        p.phone,
        p.email,
        p.address,
        p.blood_type,
        p.religion,
        p.race,
        p.occupation,
        p.education,
        p.marital_status,
        p.drug_allergies,
        p.food_allergies,
        p.environment_allergies,
        p.weight,
        p.height,
        p.current_address,
        p.allergies,
        p.medical_history,
        p.current_medications,
        p.chronic_diseases,
        p.emergency_contact_name,
        p.emergency_contact_phone,
        p.emergency_contact_relation,
        p.created_at,
        p.updated_at,
        u.birth_day,
        u.birth_month,
        u.birth_year,
        u.insurance_type
      FROM patients p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.national_id = $1
      ORDER BY p.created_at DESC
    `;

    const patientResult = await databaseManager.query(patientCheckQuery, [national_id]);
    const existingPatients = patientResult.rows;

    if (existingPatients.length > 0) {
      // Patient already exists in patients table
      return res.status(200).json({
        data: existingPatients,
        meta: {
          total: existingPatients.length,
          isExistingPatient: true,
          timestamp: new Date().toISOString()
        },
        error: null,
        statusCode: 200
      });
    }

    // If no patient found, search in users table for patient role only
    // If multiple users with same national ID exist, prioritize patient role
    const searchQuery = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.thai_name,
        u.thai_last_name,
        u.title,
        u.national_id,
        u.birth_date,
        u.gender,
        u.phone,
        u.address,
        u.blood_type,
        u.emergency_contact_name,
        u.emergency_contact_phone,
        u.emergency_contact_relation,
        u.allergies,
        u.medical_history,
        u.current_medications,
        u.insurance_type,
        u.insurance_number,
        u.insurance_expiry_date,
        u.chronic_diseases,
        u.nationality,
        u.province,
        u.district,
        u.postal_code,
        u.drug_allergies,
        u.food_allergies,
        u.environment_allergies,
        u.weight,
        u.height,
        u.occupation,
        u.education,
        u.marital_status,
        u.religion,
        u.race,
        u.current_address,
        u.birth_day,
        u.birth_month,
        u.birth_year,
        u.role,
        u.created_at,
        u.updated_at
      FROM users u
      WHERE u.national_id = $1
      ORDER BY 
        CASE 
          WHEN u.role = 'patient' THEN 1
          ELSE 2
        END,
        u.created_at DESC
    `;

    const result = await databaseManager.query(searchQuery, [national_id]);
    const users = result.rows;

    res.status(200).json({
      data: users,
      meta: {
        total: users.length,
        isExistingPatient: false,
        timestamp: new Date().toISOString()
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Get all patients
 * GET /api/medical/patients
 */
export const getAllPatients = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      hn,
      queue,
      department, 
      is_active,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // Build query conditions
    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];
    let paramCount = 0;

    // Handle HN search (exact match)
    if (hn) {
      paramCount++;
      whereClause += ` AND p.hospital_number = $${paramCount}`;
      queryParams.push(hn);
    }

    // Handle Queue search - find patient by visit_number
    if (queue) {
      paramCount++;
      whereClause += ` AND p.id IN (
        SELECT v.patient_id 
        FROM visits v 
        WHERE v.visit_number = $${paramCount} 
          AND v.status = 'in_progress'
      )`;
      queryParams.push(queue);
    }

    if (search) {
      paramCount++;
      whereClause += ` AND (
        p.first_name ILIKE $${paramCount} OR 
        p.last_name ILIKE $${paramCount} OR 
        p.thai_name ILIKE $${paramCount} OR 
        p.hospital_number ILIKE $${paramCount} OR
        p.national_id ILIKE $${paramCount}
      )`;
      queryParams.push(`%${search}%`);
    }

    if (department) {
      paramCount++;
      whereClause += ` AND p.department_id = $${paramCount}`;
      queryParams.push(department);
    }

    if (is_active !== undefined) {
      paramCount++;
      whereClause += ` AND p.is_active = $${paramCount}`;
      queryParams.push(is_active);
    }

    // Validate sortBy
    const allowedSortFields = ['created_at', 'first_name', 'last_name', 'hospital_number', 'birth_date'];
    const validSortBy = allowedSortFields.includes(sortBy as string) ? sortBy : 'created_at';
    const validSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Get patients with pagination
    const patientsQuery = `
      SELECT 
        p.id,
        p.first_name,
        p.last_name,
        p.thai_name,
        p.thai_last_name,
        p.title,
        p.hospital_number,
        p.national_id,
        p.date_of_birth,
        p.gender,
        p.phone,
        p.email,
        p.address,
        p.current_address,
        p.blood_group,
        p.blood_type,
        p.emergency_contact,
        p.emergency_contact_name,
        p.emergency_contact_phone,
        p.emergency_contact_relation,
        p.medical_history,
        p.allergies,
        p.drug_allergies,
        p.food_allergies,
        p.environment_allergies,
        p.chronic_diseases,
        p.weight,
        p.height,
        p.occupation,
        p.education,
        p.marital_status,
        p.religion,
        p.race,
        p.nationality,
        p.is_active,
        p.created_at,
        p.updated_at,
        d.department_name,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        u.email as user_email,
        u.birth_day,
        u.birth_month,
        u.birth_year,
        v.visit_number,
        v.visit_type,
        v.visit_date,
        v.visit_time,
        v.status as visit_status,
        doc_user.thai_name as doctor_name,
        doc_user.first_name as doctor_first_name,
        doc_user.last_name as doctor_last_name,
        doc_user.thai_name as doctor_thai_name
      FROM patients p
      LEFT JOIN departments d ON p.department_id = d.id
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN visits v ON p.id = v.patient_id AND v.status = 'in_progress'
      LEFT JOIN users doc_user ON v.attending_doctor_id = doc_user.id
      LEFT JOIN doctors doc ON v.attending_doctor_id = doc.user_id
      ${whereClause}
      ORDER BY p.${validSortBy} ${validSortOrder}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(Number(limit), offset);

    const patientsResult = await databaseManager.query(patientsQuery, queryParams);
    const patients = patientsResult.rows;

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM patients p
      LEFT JOIN departments d ON p.department_id = d.id
      ${whereClause}
    `;
    const countResult = await databaseManager.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    // Format patients data
    const formattedPatients = patients.map(patient => ({
      id: patient.id,
      personal_info: {
        first_name: patient.first_name,
        last_name: patient.last_name,
        thai_name: patient.thai_name,
        thai_last_name: patient.thai_last_name,
        title: patient.title,
        hospital_number: patient.hospital_number,
        national_id: patient.national_id,
        birth_date: patient.date_of_birth,
        birth_day: patient.birth_day,
        birth_month: patient.birth_month,
        birth_year: patient.birth_year,
        gender: patient.gender,
        age: patient.date_of_birth ? calculateAge(patient.date_of_birth) : 
             (patient.birth_year && patient.birth_month && patient.birth_day ? 
              calculateAgeFromFields(patient.birth_year, patient.birth_month, patient.birth_day) : null),
        occupation: patient.occupation,
        education: patient.education,
        marital_status: patient.marital_status,
        religion: patient.religion,
        race: patient.race,
        nationality: patient.nationality
      },
      contact_info: {
        phone: patient.phone,
        email: patient.email,
        address: patient.address,
        current_address: patient.current_address
      },
      medical_info: {
        blood_group: patient.blood_group,
        blood_type: patient.blood_type,
        medical_history: patient.medical_history,
        allergies: patient.allergies,
        drug_allergies: patient.drug_allergies,
        food_allergies: patient.food_allergies,
        environment_allergies: patient.environment_allergies,
        chronic_diseases: patient.chronic_diseases,
        weight: patient.weight,
        height: patient.height
      },
      emergency_contact: {
        name: patient.emergency_contact_name,
        phone: patient.emergency_contact_phone,
        relation: patient.emergency_contact_relation
      },
      status: patient.is_active ? 'active' : 'inactive',
      department: patient.department_name,
      user: patient.user_first_name ? {
        name: `${patient.user_first_name} ${patient.user_last_name}`,
        email: patient.user_email
      } : null,
      visit_info: {
        visit_number: patient.visit_number,
        visit_type: patient.visit_type === 'walk_in' ? 'emergency' : 
                   patient.visit_type === 'appointment' ? 'appointment' : 
                   patient.visit_type === 'emergency' ? 'emergency' : 
                   patient.visit_type,
        visit_date: patient.visit_date,
        visit_time: patient.visit_time,
        visit_status: patient.visit_status,
        doctor_name: patient.doctor_name || 
                     patient.doctor_thai_name ||
                     `${patient.doctor_first_name || ''} ${patient.doctor_last_name || ''}`.trim() || 
                     'นพ.สมชาย ใจดี'
      },
      created_at: patient.created_at,
      updated_at: patient.updated_at
    }));

    res.json({
      data: {
        patients: formattedPatients,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        patientCount: formattedPatients.length,
        filters: {
          search,
          department,
          is_active,
          sortBy: validSortBy,
          sortOrder: validSortOrder
        }
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error getting all patients:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Get patient by ID
 * GET /api/medical/patients/{id}
 */
export const getPatientById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get patient details
    const patientQuery = `
      SELECT 
        p.id,
        p.first_name,
        p.last_name,
        p.thai_name,
        p.hospital_number,
        p.national_id,
        p.date_of_birth,
        p.gender,
        p.phone,
        p.email,
        p.address,
        p.current_address,
        p.blood_group,
        p.blood_type,
        p.emergency_contact,
        p.emergency_contact_name,
        p.emergency_contact_phone,
        p.emergency_contact_relation,
        p.medical_history,
        p.allergies,
        p.drug_allergies,
        p.chronic_diseases,
        p.is_active,
        p.created_at,
        p.updated_at,
        d.department_name,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        u.email as user_email
      FROM patients p
      LEFT JOIN departments d ON p.department_id = d.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = $1
    `;

    const patientResult = await databaseManager.query(patientQuery, [id]);
    
    if (patientResult.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Patient not found' },
        statusCode: 404
      });
    }

    const patient = patientResult.rows[0];

    // Get recent visits count
    const visitsCount = await databaseManager.query(`
      SELECT COUNT(*) as count FROM visits WHERE patient_id = $1
    `, [id]);

    // Get recent appointments count
    const appointmentsCount = await databaseManager.query(`
      SELECT COUNT(*) as count FROM appointments WHERE patient_id = $1
    `, [id]);

    // Get active prescriptions count
    const prescriptionsCount = await databaseManager.query(`
      SELECT COUNT(*) as count 
      FROM prescriptions p
      WHERE p.patient_id = $1 AND p.status IN ('active', 'dispensed')
    `, [id]);

    // Format patient data
    const formattedPatient = {
      id: patient.id,
      personal_info: {
        first_name: patient.first_name,
        last_name: patient.last_name,
        thai_name: patient.thai_name,
        hospital_number: patient.hospital_number,
        national_id: patient.national_id,
        birth_date: patient.date_of_birth,
        gender: patient.gender,
        age: patient.birth_date ? calculateAge(patient.birth_date) : null
      },
      contact_info: {
        phone: patient.phone,
        email: patient.email,
        address: patient.address,
        current_address: patient.current_address
      },
      medical_info: {
        blood_group: patient.blood_group,
        blood_type: patient.blood_type,
        medical_history: patient.medical_history,
        allergies: patient.allergies,
        drug_allergies: patient.drug_allergies,
        chronic_diseases: patient.chronic_diseases
      },
      emergency_contact: {
        name: patient.emergency_contact_name,
        phone: patient.emergency_contact_phone,
        relation: patient.emergency_contact_relation
      },
      status: patient.is_active ? 'active' : 'inactive',
      department: patient.department_name,
      user: patient.user_first_name ? {
        name: `${patient.user_first_name} ${patient.user_last_name}`,
        email: patient.user_email
      } : null,
      statistics: {
        total_visits: parseInt(visitsCount.rows[0].count),
        total_appointments: parseInt(appointmentsCount.rows[0].count),
        active_prescriptions: parseInt(prescriptionsCount.rows[0].count)
      },
      created_at: patient.created_at,
      updated_at: patient.updated_at
    };

    res.json({
      data: {
        patient: formattedPatient
      },
      meta: {
        timestamp: new Date().toISOString()
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error getting patient by ID:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Create new patient
 * POST /api/medical/patients
 * DISABLED: Patient records should only be created through EMR registration
 */
export const createPatient = async (req: Request, res: Response) => {
  return res.status(403).json({
    data: null,
    meta: null,
    error: { 
      message: 'Patient creation is disabled. Please use EMR registration at /emr/register-patient',
      code: 'PATIENT_CREATION_DISABLED'
    },
    statusCode: 403
  });
};

/**
 * Update patient
 * PUT /api/medical/patients/{id}
 */
export const updatePatient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if patient exists
    const patientExists = await databaseManager.query(
      'SELECT id FROM patients WHERE id = $1',
      [id]
    );

    if (patientExists.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Patient not found' },
        statusCode: 404
      });
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    const allowedFields = [
      'first_name', 'last_name', 'thai_name', 'phone', 'email', 'address', 'current_address',
      'blood_group', 'blood_type', 'emergency_contact', 'emergency_contact_phone',
      'emergency_contact_relation', 'medical_history', 'allergies', 'drug_allergies',
      'chronic_diseases', 'department_id', 'is_active'
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
      UPDATE patients 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount + 1}
      RETURNING *
    `;

    const updateResult = await databaseManager.query(updateQuery, updateValues);
    const updatedPatient = updateResult.rows[0];

    res.json({
      data: {
        patient: {
          id: updatedPatient.id,
          first_name: updatedPatient.first_name,
          last_name: updatedPatient.last_name,
          thai_name: updatedPatient.thai_name,
          hospital_number: updatedPatient.hospital_number,
          status: updatedPatient.is_active ? 'active' : 'inactive',
          updated_at: updatedPatient.updated_at
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
    console.error('Error updating patient:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Helper function to calculate age
 */
function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Helper function to calculate age from separate birth date fields (Buddhist Era)
 */
function calculateAgeFromFields(birthYear: number, birthMonth: number, birthDay: number): number {
  const today = new Date();
  // Convert Buddhist Era to Christian Era
  const christianYear = birthYear - 543;
  const birth = new Date(christianYear, birthMonth - 1, birthDay);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Get patient by email (for patient portal)
 * GET /api/medical/patients/by-email/:email
 */
export const getPatientByEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const user = (req as any).user;

    // Decode URL-encoded email
    const decodedEmail = decodeURIComponent(email);

    // Get patient details by email
    const patientQuery = `
      SELECT 
        p.id,
        p.first_name,
        p.last_name,
        p.thai_name,
        p.hospital_number,
        p.national_id,
        p.date_of_birth,
        p.gender,
        p.phone,
        p.email,
        p.address,
        p.current_address,
        p.blood_group,
        p.blood_type,
        p.emergency_contact,
        p.emergency_contact_name,
        p.emergency_contact_phone,
        p.emergency_contact_relation,
        p.medical_history,
        p.allergies,
        p.drug_allergies,
        p.chronic_diseases,
        p.is_active,
        p.created_at,
        p.updated_at
      FROM patients p
      WHERE p.email = $1
    `;

    const patientResult = await databaseManager.query(patientQuery, [decodedEmail]);
    
    if (patientResult.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Patient not found' },
        statusCode: 404
      });
    }

    const patient = patientResult.rows[0];

    res.status(200).json({
      data: patient,
      meta: {
        timestamp: new Date().toISOString()
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error getting patient by email:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Get patient by ID or HN (for patient portal)
 * GET /api/patients/:identifier
 */
export const getPatient = async (req: Request, res: Response) => {
  try {
    const { identifier } = req.params;
    const user = (req as any).user;

    // Check if identifier is UUID (patient ID) or HN
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    
    let whereClause = '';
    if (isUUID) {
      whereClause = 'p.id = $1';
    } else {
      whereClause = 'p.hospital_number = $1';
    }

    // Get patient details
    const patientQuery = `
      SELECT 
        p.id,
        p.first_name,
        p.last_name,
        p.thai_name,
        p.hospital_number,
        p.national_id,
        p.date_of_birth,
        p.gender,
        p.phone,
        p.email,
        p.address,
        p.current_address,
        p.blood_group,
        p.blood_type,
        p.emergency_contact,
        p.emergency_contact_name,
        p.emergency_contact_phone,
        p.emergency_contact_relation,
        p.medical_history,
        p.allergies,
        p.drug_allergies,
        p.chronic_diseases,
        p.is_active,
        p.created_at,
        p.updated_at,
        d.department_name,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        u.email as user_email
      FROM patients p
      LEFT JOIN departments d ON p.department_id = d.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE ${whereClause}
    `;

    const patientResult = await databaseManager.query(patientQuery, [identifier]);
    
    if (patientResult.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Patient not found' },
        statusCode: 404
      });
    }

    const patient = patientResult.rows[0];

    // Format patient data
    const formattedPatient = {
      id: patient.id,
      personal_info: {
        first_name: patient.first_name,
        last_name: patient.last_name,
        thai_name: patient.thai_name,
        hospital_number: patient.hospital_number,
        national_id: patient.national_id,
        birth_date: patient.date_of_birth,
        gender: patient.gender,
        age: patient.birth_date ? calculateAge(patient.birth_date) : null
      },
      contact_info: {
        phone: patient.phone,
        email: patient.email,
        address: patient.address,
        current_address: patient.current_address
      },
      medical_info: {
        blood_group: patient.blood_group,
        blood_type: patient.blood_type,
        medical_history: patient.medical_history,
        allergies: patient.allergies,
        drug_allergies: patient.drug_allergies,
        chronic_diseases: patient.chronic_diseases
      },
      emergency_contact: {
        name: patient.emergency_contact_name,
        phone: patient.emergency_contact_phone,
        relation: patient.emergency_contact_relation
      },
      status: patient.is_active ? 'active' : 'inactive',
      department: patient.department_name,
      user: patient.user_first_name ? {
        name: `${patient.user_first_name} ${patient.user_last_name}`,
        email: patient.user_email
      } : null,
      created_at: patient.created_at,
      updated_at: patient.updated_at
    };

    res.json({
      data: {
        patient: formattedPatient
      },
      meta: {
        timestamp: new Date().toISOString()
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error getting patient:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Get patient profile (for authenticated patients)
 * GET /api/patients/profile
 */
export const getPatientProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        data: null,
        meta: null,
        error: { message: 'User not authenticated' },
        statusCode: 401
      });
    }

    // Get patient data from users table for patient role
    const userQuery = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.phone,
        u.role,
        u.thai_name,
        u.thai_last_name,
        u.national_id,
        u.birth_date,
        u.birth_day,
        u.birth_month,
        u.birth_year,
        u.gender,
        u.blood_type,
        u.address,
        u.id_card_address,
        u.current_address,
        u.emergency_contact_name,
        u.emergency_contact_phone,
        u.emergency_contact_relation,
        u.allergies,
        u.drug_allergies,
        u.food_allergies,
        u.environment_allergies,
        u.medical_history,
        u.current_medications,
        u.chronic_diseases,
        u.weight,
        u.height,
        u.occupation,
        u.education,
        u.marital_status,
        u.religion,
        u.race,
        u.insurance_type,
        u.insurance_number,
        u.insurance_expiry_date,
        u.profile_image,
        u.is_active,
        u.email_verified,
        u.profile_completed,
        u.created_at,
        u.updated_at,
        u.last_login,
        u.last_activity
      FROM users u
      WHERE u.id = $1 AND u.role = 'patient'
    `;
    
    const result = await databaseManager.query(userQuery, [user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Patient profile not found' },
        statusCode: 404
      });
    }

    const userData = result.rows[0];

    // Calculate BMI if weight and height are available
    let bmi = null;
    if (userData.weight && userData.height) {
      const heightInMeters = userData.height / 100;
      bmi = parseFloat((userData.weight / (heightInMeters * heightInMeters)).toFixed(1));
    }

    // Format patient profile data
    const formattedProfile = {
      id: userData.id,
      personal_info: {
        username: userData.username,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        thai_name: userData.thai_name,
        thai_last_name: userData.thai_last_name,
        national_id: userData.national_id,
        birth_date: userData.birth_date,
        birth_day: userData.birth_day,
        birth_month: userData.birth_month,
        birth_year: userData.birth_year,
        gender: userData.gender,
        age: userData.birth_date ? calculateAge(userData.birth_date) : null
      },
      contact_info: {
        phone: userData.phone,
        email: userData.email,
        address: userData.address,
        id_card_address: userData.id_card_address,
        current_address: userData.current_address
      },
      medical_info: {
        blood_type: userData.blood_type,
        weight: userData.weight,
        height: userData.height,
        bmi: bmi,
        medical_history: userData.medical_history,
        current_medications: userData.current_medications,
        chronic_diseases: userData.chronic_diseases,
        allergies: userData.allergies,
        drug_allergies: userData.drug_allergies,
        food_allergies: userData.food_allergies,
        environment_allergies: userData.environment_allergies
      },
      emergency_contact: {
        name: userData.emergency_contact_name,
        phone: userData.emergency_contact_phone,
        relation: userData.emergency_contact_relation
      },
      personal_details: {
        occupation: userData.occupation,
        education: userData.education,
        marital_status: userData.marital_status,
        religion: userData.religion,
        race: userData.race
      },
      insurance_info: {
        type: userData.insurance_type,
        number: userData.insurance_number,
        expiry_date: userData.insurance_expiry_date
      },
      profile_info: {
        profile_image: userData.profile_image,
        is_active: userData.is_active,
        email_verified: userData.email_verified,
        profile_completed: userData.profile_completed
      },
      timestamps: {
        created_at: userData.created_at,
        updated_at: userData.updated_at,
        last_login: userData.last_login,
        last_activity: userData.last_activity
      }
    };

    res.json({
      data: {
        profile: formattedProfile
      },
      meta: {
        timestamp: new Date().toISOString()
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error getting patient profile:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Search patients
 * GET /api/patients/search
 */
export const searchPatients = async (req: Request, res: Response) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;

    if (!query) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: { message: 'Search query is required' },
        statusCode: 400
      });
    }

    const offset = (Number(page) - 1) * Number(limit);

    // Search in patients table
    const searchQuery = `
      SELECT 
        p.id,
        p.first_name,
        p.last_name,
        p.thai_name,
        p.hospital_number,
        p.national_id,
        p.date_of_birth,
        p.gender,
        p.phone,
        p.email,
        p.is_active,
        p.created_at,
        d.department_name
      FROM patients p
      LEFT JOIN departments d ON p.department_id = d.id
      WHERE (
        p.first_name ILIKE $1 OR 
        p.last_name ILIKE $1 OR 
        p.thai_name ILIKE $1 OR 
        p.hospital_number ILIKE $1 OR
        p.national_id ILIKE $1 OR
        p.phone ILIKE $1 OR
        p.email ILIKE $1
      )
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await databaseManager.query(searchQuery, [`%${query}%`, Number(limit), offset]);
    const patients = result.rows;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM patients p
      WHERE (
        p.first_name ILIKE $1 OR 
        p.last_name ILIKE $1 OR 
        p.thai_name ILIKE $1 OR 
        p.hospital_number ILIKE $1 OR
        p.national_id ILIKE $1 OR
        p.phone ILIKE $1 OR
        p.email ILIKE $1
      )
    `;
    const countResult = await databaseManager.query(countQuery, [`%${query}%`]);
    const total = parseInt(countResult.rows[0].total);

    // Format patients data
    const formattedPatients = patients.map(patient => ({
      id: patient.id,
      personal_info: {
        first_name: patient.first_name,
        last_name: patient.last_name,
        thai_name: patient.thai_name,
        hospital_number: patient.hospital_number,
        national_id: patient.national_id,
        birth_date: patient.date_of_birth,
        gender: patient.gender,
        age: patient.birth_date ? calculateAge(patient.birth_date) : null
      },
      contact_info: {
        phone: patient.phone,
        email: patient.email
      },
      status: patient.is_active ? 'active' : 'inactive',
      department: patient.department_name,
      created_at: patient.created_at
    }));

    res.json({
      data: {
        patients: formattedPatients,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        searchQuery: query,
        patientCount: formattedPatients.length
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error searching patients:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * List all patients (for patient portal)
 * GET /api/patients
 */
export const listPatients = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      is_active,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // Build query conditions
    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereClause += ` AND (
        p.first_name ILIKE $${paramCount} OR 
        p.last_name ILIKE $${paramCount} OR 
        p.thai_name ILIKE $${paramCount} OR 
        p.hospital_number ILIKE $${paramCount} OR
        p.national_id ILIKE $${paramCount}
      )`;
      queryParams.push(`%${search}%`);
    }

    if (is_active !== undefined) {
      paramCount++;
      whereClause += ` AND p.is_active = $${paramCount}`;
      queryParams.push(is_active);
    }

    // Validate sortBy
    const allowedSortFields = ['created_at', 'first_name', 'last_name', 'hospital_number', 'birth_date'];
    const validSortBy = allowedSortFields.includes(sortBy as string) ? sortBy : 'created_at';
    const validSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Get patients with pagination
    const patientsQuery = `
      SELECT 
        p.id,
        p.first_name,
        p.last_name,
        p.thai_name,
        p.hospital_number,
        p.national_id,
        p.date_of_birth,
        p.gender,
        p.phone,
        p.email,
        p.is_active,
        p.created_at,
        p.updated_at,
        d.department_name
      FROM patients p
      LEFT JOIN departments d ON p.department_id = d.id
      ${whereClause}
      ORDER BY p.${validSortBy} ${validSortOrder}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(Number(limit), offset);

    const patientsResult = await databaseManager.query(patientsQuery, queryParams);
    const patients = patientsResult.rows;

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM patients p
      LEFT JOIN departments d ON p.department_id = d.id
      ${whereClause}
    `;
    const countResult = await databaseManager.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    // Format patients data
    const formattedPatients = patients.map(patient => ({
      id: patient.id,
      personal_info: {
        first_name: patient.first_name,
        last_name: patient.last_name,
        thai_name: patient.thai_name,
        hospital_number: patient.hospital_number,
        national_id: patient.national_id,
        birth_date: patient.date_of_birth,
        gender: patient.gender,
        age: patient.birth_date ? calculateAge(patient.birth_date) : null
      },
      contact_info: {
        phone: patient.phone,
        email: patient.email
      },
      status: patient.is_active ? 'active' : 'inactive',
      department: patient.department_name,
      created_at: patient.created_at,
      updated_at: patient.updated_at,
      visit_info: {
        visit_number: patient.visit_number,
        visit_type: patient.visit_type,
        visit_date: patient.visit_date,
        visit_time: patient.visit_time,
        visit_status: patient.visit_status,
        doctor_name: patient.doctor_name || `${patient.doctor_first_name || ''} ${patient.doctor_last_name || ''}`.trim() || 'ไม่ระบุ'
      }
    }));

    res.json({
      data: {
        patients: formattedPatients,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        patientCount: formattedPatients.length,
        filters: {
          search,
          is_active,
          sortBy: validSortBy,
          sortOrder: validSortOrder
        }
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error listing patients:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Delete patient (soft delete)
 * DELETE /api/patients/:id
 */
export const deletePatient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if patient exists
    const patientExists = await databaseManager.query(
      'SELECT id, first_name, last_name, hospital_number FROM patients WHERE id = $1',
      [id]
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

    // Soft delete by setting is_active to false
    const deleteQuery = `
      UPDATE patients 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, first_name, last_name, hospital_number, is_active, updated_at
    `;

    const deleteResult = await databaseManager.query(deleteQuery, [id]);
    const deletedPatient = deleteResult.rows[0];

    // Log audit
    await databaseManager.query(`
      INSERT INTO audit_logs (
        user_id, action, resource, resource_id, details, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      (req as any).user.id,
      'PATIENT_DELETE',
      'PATIENT',
      id,
      JSON.stringify({ 
        patientName: `${patient.first_name} ${patient.last_name}`,
        hospitalNumber: patient.hospital_number 
      }),
      req.ip || 'unknown',
      req.get('User-Agent') || 'unknown'
    ]);

    res.json({
      data: {
        patient: {
          id: deletedPatient.id,
          first_name: deletedPatient.first_name,
          last_name: deletedPatient.last_name,
          hospital_number: deletedPatient.hospital_number,
          status: deletedPatient.is_active ? 'active' : 'inactive',
          deleted_at: deletedPatient.updated_at
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        deletedBy: (req as any).user.id
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Helper function to generate hospital number
 */
async function generateHospitalNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const result = await databaseManager.query(`
    SELECT COUNT(*) as count 
    FROM patients 
    WHERE hospital_number LIKE $1
  `, [`HN${year}%`]);
  
  const count = parseInt(result.rows[0].count) + 1;
  return `HN${year}${count.toString().padStart(6, '0')}`;
}
