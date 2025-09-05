import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';

/**
 * Patient Management Controller
 * จัดการข้อมูลผู้ป่วยสำหรับระบบ EMR
 */

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
        p.hospital_number,
        p.national_id,
        p.birth_date,
        p.gender,
        p.phone,
        p.email,
        p.address,
        p.current_address,
        p.blood_group,
        p.blood_type,
        p.emergency_contact,
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
        birth_date: patient.birth_date,
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
        name: patient.emergency_contact,
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
        p.birth_date,
        p.gender,
        p.phone,
        p.email,
        p.address,
        p.current_address,
        p.blood_group,
        p.blood_type,
        p.emergency_contact,
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
        birth_date: patient.birth_date,
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
        name: patient.emergency_contact,
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
 */
export const createPatient = async (req: Request, res: Response) => {
  try {
    const {
      first_name,
      last_name,
      thai_name,
      national_id,
      birth_date,
      gender,
      phone,
      email,
      address,
      current_address,
      blood_group,
      blood_type,
      emergency_contact,
      emergency_contact_phone,
      emergency_contact_relation,
      medical_history,
      allergies,
      drug_allergies,
      chronic_diseases,
      department_id,
      user_id,
      is_active
    } = req.body;

    const userId = (req as any).user.id;

    // Validate required fields
    if (!first_name || !last_name || !national_id || !birth_date || !gender) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: { message: 'Missing required fields: first_name, last_name, national_id, birth_date, gender' },
        statusCode: 400
      });
    }

    // Get a valid user ID if not provided
    let validUserId = user_id || userId;
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

    // Get a valid department ID if not provided
    let validDepartmentId = department_id;
    if (!validDepartmentId) {
      const deptResult = await databaseManager.query('SELECT id FROM departments LIMIT 1');
      validDepartmentId = deptResult.rows[0]?.id;
    }

    // Generate hospital number
    const hospitalNumber = await generateHospitalNumber();

    // Create patient
    const patientId = uuidv4();
    const createPatientQuery = `
      INSERT INTO patients (
        id, first_name, last_name, thai_name, hospital_number, national_id,
        birth_date, gender, phone, email, address, current_address,
        blood_group, blood_type, emergency_contact, emergency_contact_phone,
        emergency_contact_relation, medical_history, allergies, drug_allergies,
        chronic_diseases, department_id, user_id, is_active
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
      )
      RETURNING *
    `;

    const patientResult = await databaseManager.query(createPatientQuery, [
      patientId, first_name, last_name, thai_name, hospitalNumber, national_id,
      birth_date, gender, phone, email, address, current_address,
      blood_group, blood_type, emergency_contact, emergency_contact_phone,
      emergency_contact_relation, medical_history, allergies, drug_allergies,
      chronic_diseases, validDepartmentId, validUserId, is_active !== undefined ? is_active : true
    ]);

    const newPatient = patientResult.rows[0];

    res.status(201).json({
      data: {
        patient: {
          id: newPatient.id,
          hospital_number: newPatient.hospital_number,
          first_name: newPatient.first_name,
          last_name: newPatient.last_name,
          thai_name: newPatient.thai_name,
          status: newPatient.is_active ? 'active' : 'inactive',
          created_at: newPatient.created_at
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        createdBy: validUserId
      },
      error: null,
      statusCode: 201
    });

  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
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
