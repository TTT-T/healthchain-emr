import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';
import { DoctorDB } from '../database/doctors';

/**
 * Doctors Controller
 * จัดการข้อมูลแพทย์สำหรับระบบ EMR
 */

/**
 * Get all doctors
 * GET /api/medical/doctors
 */
export const getAllDoctors = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      department,
      specialization,
      is_available = true
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // Build query conditions
    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];
    let paramCount = 0;

    if (department) {
      paramCount++;
      whereClause += ` AND d.department = $${paramCount}`;
      queryParams.push(department);
    }

    if (specialization) {
      paramCount++;
      whereClause += ` AND d.specialization ILIKE $${paramCount}`;
      queryParams.push(`%${specialization}%`);
    }

    if (is_available !== undefined) {
      paramCount++;
      whereClause += ` AND u.is_active = $${paramCount}`;
      queryParams.push(is_available === 'true');
    }

    // Get doctors with pagination
    const doctorsQuery = `
      SELECT 
        d.id,
        d.medical_license_number,
        d.specialization,
        d.years_of_experience,
        d.department,
        d.position,
        d.consultation_fee,
        d.availability,
        d.created_at,
        d.updated_at,
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.thai_name,
        u.email,
        u.phone,
        u.role,
        u.is_active
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      ${whereClause}
      ORDER BY d.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(Number(limit), offset);
    const result = await databaseManager.query(doctorsQuery, queryParams);
    const doctors = result.rows;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      ${whereClause}
    `;
    const countResult = await databaseManager.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    // Format doctors data for frontend
    const formattedDoctors = doctors.map(doctor => ({
      id: doctor.id,
      name: doctor.thai_name || `${doctor.first_name} ${doctor.last_name}`,
      department: doctor.department || 'ไม่ระบุ',
      specialization: doctor.specialization || 'ไม่ระบุ',
      isAvailable: doctor.is_active,
      currentQueue: Math.floor(Math.random() * 5), // Mock data for now
      estimatedWaitTime: Math.floor(Math.random() * 30) + 5, // Mock data for now
      medicalLicenseNumber: doctor.medical_license_number,
      yearsOfExperience: doctor.years_of_experience,
      position: doctor.position,
      consultationFee: doctor.consultation_fee,
      email: doctor.email,
      phone: doctor.phone,
      availability: doctor.availability ? JSON.parse(doctor.availability) : null
    }));

    res.status(200).json({
      data: formattedDoctors,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
        timestamp: new Date().toISOString()
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error getting doctors:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Get doctor by ID
 * GET /api/medical/doctors/:id
 */
export const getDoctorById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const doctorQuery = `
      SELECT 
        d.id,
        d.medical_license_number,
        d.specialization,
        d.years_of_experience,
        d.department,
        d.position,
        d.consultation_fee,
        d.availability,
        d.education,
        d.certifications,
        d.languages,
        d.work_schedule,
        d.emergency_contact,
        d.emergency_phone,
        d.created_at,
        d.updated_at,
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.thai_name,
        u.email,
        u.phone,
        u.role,
        u.is_active
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE d.id = $1
    `;

    const result = await databaseManager.query(doctorQuery, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Doctor not found' },
        statusCode: 404
      });
    }

    const doctor = result.rows[0];

    // Format doctor data
    const formattedDoctor = {
      id: doctor.id,
      name: doctor.thai_name || `${doctor.first_name} ${doctor.last_name}`,
      department: doctor.department || 'ไม่ระบุ',
      specialization: doctor.specialization || 'ไม่ระบุ',
      isAvailable: doctor.is_active,
      currentQueue: Math.floor(Math.random() * 5), // Mock data for now
      estimatedWaitTime: Math.floor(Math.random() * 30) + 5, // Mock data for now
      medicalLicenseNumber: doctor.medical_license_number,
      yearsOfExperience: doctor.years_of_experience,
      position: doctor.position,
      consultationFee: doctor.consultation_fee,
      email: doctor.email,
      phone: doctor.phone,
      availability: doctor.availability ? JSON.parse(doctor.availability) : null,
      education: doctor.education ? JSON.parse(doctor.education) : null,
      certifications: doctor.certifications ? JSON.parse(doctor.certifications) : null,
      languages: doctor.languages ? JSON.parse(doctor.languages) : null,
      workSchedule: doctor.work_schedule ? JSON.parse(doctor.work_schedule) : null,
      emergencyContact: doctor.emergency_contact,
      emergencyPhone: doctor.emergency_phone,
      createdAt: doctor.created_at,
      updatedAt: doctor.updated_at
    };

    res.status(200).json({
      data: formattedDoctor,
      meta: {
        timestamp: new Date().toISOString()
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error getting doctor:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Create doctor profile
 * POST /api/medical/doctors
 */
export const createDoctor = async (req: Request, res: Response) => {
  try {
    const doctorData = req.body;

    // Validate required fields
    if (!doctorData.userId || !doctorData.medicalLicenseNumber || !doctorData.specialization) {
      return res.status(400).json({
        data: null,
        meta: null,
        error: { message: 'Missing required fields: userId, medicalLicenseNumber, specialization' },
        statusCode: 400
      });
    }

    const doctor = await DoctorDB.createDoctorProfile(doctorData);

    res.status(201).json({
      data: doctor,
      meta: {
        timestamp: new Date().toISOString()
      },
      error: null,
      statusCode: 201
    });

  } catch (error) {
    console.error('Error creating doctor:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Update doctor profile
 * PUT /api/medical/doctors/:id
 */
export const updateDoctor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updateQuery = `
      UPDATE doctors 
      SET 
        specialization = COALESCE($2, specialization),
        years_of_experience = COALESCE($3, years_of_experience),
        department = COALESCE($4, department),
        position = COALESCE($5, position),
        consultation_fee = COALESCE($6, consultation_fee),
        availability = COALESCE($7, availability),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const values = [
      id,
      updateData.specialization,
      updateData.yearsOfExperience,
      updateData.department,
      updateData.position,
      updateData.consultationFee,
      updateData.availability ? JSON.stringify(updateData.availability) : null
    ];

    const result = await databaseManager.query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: { message: 'Doctor not found' },
        statusCode: 404
      });
    }

    res.status(200).json({
      data: result.rows[0],
      meta: {
        timestamp: new Date().toISOString()
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error updating doctor:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};
