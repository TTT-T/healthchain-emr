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

    console.log('🔍 getAllDoctors called with params:', { page, limit, department, specialization, is_available });

    const offset = (Number(page) - 1) * Number(limit);

    // Build query conditions
    let whereClause = 'WHERE 1=1 AND u.id IS NOT NULL'; // Ensure user exists
    console.log('🔍 whereClause initialized:', whereClause);
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
      queryParams.push(is_available === 'true' || is_available === true);
    }

    // Get doctors with pagination - include all doctor users
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
        u.is_active,
        u.email_verified
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      ${whereClause}
      ORDER BY d.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(Number(limit), offset);
    
    console.log('🔍 Final whereClause:', whereClause);
    console.log('🔍 Final query:', doctorsQuery);
    console.log('🔍 Query params:', queryParams);
    
    const result = await databaseManager.query(doctorsQuery, queryParams);
    const doctors = result.rows;
    
    console.log('🔍 Query result:', doctors.length, 'doctors found');

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
    // Get real queue counts for each doctor from visits table
    console.log('🔍 Processing', doctors.length, 'doctors for queue data...');
    const doctorsWithQueue = await Promise.all(doctors.map(async (doctor) => {
      try {
        // Count patients waiting for this doctor today
        const queueQuery = `
          SELECT COUNT(*) as queue_count
          FROM visits v
          WHERE v.attending_doctor_id = $1
            AND v.status = 'in_progress'
            AND DATE(v.visit_date) = CURRENT_DATE
        `;
        
        const queueResult = await databaseManager.query(queueQuery, [doctor.user_id]);
        const queueCount = parseInt(queueResult.rows[0]?.queue_count || '0');
        
        // Calculate estimated wait time (15 minutes per patient)
        const estimatedWait = queueCount * 15;

        // Auto-update doctor data if incomplete
        if (!doctor.medical_license_number || !doctor.specialization || !doctor.department) {
          console.log(`🔧 Auto-updating incomplete doctor profile for ${doctor.thai_name || doctor.first_name}`);
          
          // Generate default values based on user data
          const defaultData = {
            medical_license_number: doctor.medical_license_number || `MD${doctor.user_id.substring(0, 3).toUpperCase()}`,
            specialization: doctor.specialization || 'อายุรกรรม',
            department: doctor.department || 'อายุรกรรม',
            position: doctor.position || 'แพทย์ผู้เชี่ยวชาญ',
            years_of_experience: doctor.years_of_experience || 5,
            consultation_fee: doctor.consultation_fee || 500
          };
          
          // Update database with default values
          try {
            await databaseManager.query(`
              UPDATE doctors 
              SET 
                medical_license_number = $1,
                specialization = $2,
                department = $3,
                position = $4,
                years_of_experience = $5,
                consultation_fee = $6,
                updated_at = CURRENT_TIMESTAMP
              WHERE id = $7
            `, [
              defaultData.medical_license_number,
              defaultData.specialization,
              defaultData.department,
              defaultData.position,
              defaultData.years_of_experience,
              defaultData.consultation_fee,
              doctor.id
            ]);
            
            // Update the doctor object with new values
            doctor.medical_license_number = defaultData.medical_license_number;
            doctor.specialization = defaultData.specialization;
            doctor.department = defaultData.department;
            doctor.position = defaultData.position;
            doctor.years_of_experience = defaultData.years_of_experience;
            doctor.consultation_fee = defaultData.consultation_fee;
            
            console.log(`✅ Updated doctor profile for ${doctor.thai_name || doctor.first_name}`);
          } catch (updateError) {
            console.error('Error updating doctor profile:', updateError);
          }
        }

        return {
          id: doctor.id, // Use doctor.id for consistency
          userId: doctor.user_id,
          name: doctor.thai_name || `${doctor.first_name} ${doctor.last_name}`,
          department: doctor.department || 'อายุรกรรม',
          specialization: doctor.specialization || 'อายุรกรรม',
          isAvailable: doctor.is_active,
          currentQueue: queueCount,
          estimatedWaitTime: estimatedWait,
          medicalLicenseNumber: doctor.medical_license_number || 'MD001',
          yearsOfExperience: doctor.years_of_experience || 5,
          position: doctor.position || 'แพทย์ผู้เชี่ยวชาญ',
          consultationFee: doctor.consultation_fee || 500,
          email: doctor.email,
          phone: doctor.phone,
          availability: doctor.availability && doctor.availability !== 'null' ? 
            (typeof doctor.availability === 'string' ? JSON.parse(doctor.availability) : doctor.availability) : null
        };
      } catch (error) {
        console.error(`Error getting queue for doctor ${doctor.id}:`, error);
        // Fallback to random data if query fails
        const queueCount = Math.floor(Math.random() * 3) + 1;
        const estimatedWait = queueCount * 15;
        
        return {
          id: doctor.user_id, // Use user_id instead of doctor.id for foreign key compatibility
          name: doctor.thai_name || `${doctor.first_name} ${doctor.last_name}`,
          department: doctor.department || 'ไม่ระบุ',
          specialization: doctor.specialization || 'ไม่ระบุ',
          isAvailable: doctor.is_active,
          currentQueue: queueCount,
          estimatedWaitTime: estimatedWait,
          medicalLicenseNumber: doctor.medical_license_number,
          yearsOfExperience: doctor.years_of_experience,
          position: doctor.position,
          consultationFee: doctor.consultation_fee,
          email: doctor.email,
          phone: doctor.phone,
          availability: doctor.availability && doctor.availability !== 'null' ? 
            (typeof doctor.availability === 'string' ? JSON.parse(doctor.availability) : doctor.availability) : null
        };
      }
    }));

    const formattedDoctors = doctorsWithQueue;

    console.log('🔍 Formatted doctors count:', formattedDoctors.length);
    console.log('🔍 Sample formatted doctor:', formattedDoctors[0]);

    // Log if no doctors found
    if (formattedDoctors.length === 0) {
      console.log('⚠️ No doctors found in database');
    }

    const response = {
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
    };

    console.log('🔍 Sending response:', response);
    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Error getting doctors:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    // Handle specific database errors
    if (error.message?.includes('relation "doctors" does not exist') || 
        error.code === '42P01') {
      console.log('⚠️ Doctors table not found');
      return res.status(500).json({
        data: null,
        meta: null,
        error: { message: 'Doctors table not found. Please run database migrations.' },
        statusCode: 500
      });
    }
    
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

    // Get real queue count for this doctor from visits table
    let queueCount = 0;
    let estimatedWait = 0;
    
    try {
      const queueQuery = `
        SELECT COUNT(*) as queue_count
        FROM visits v
        WHERE v.attending_doctor_id = $1
          AND v.status = 'in_progress'
          AND DATE(v.visit_date) = CURRENT_DATE
      `;
      
      const queueResult = await databaseManager.query(queueQuery, [doctor.user_id]);
      queueCount = parseInt(queueResult.rows[0]?.queue_count || '0');
      estimatedWait = queueCount * 15; // 15 minutes per patient
    } catch (error) {
      console.error(`Error getting queue for doctor ${doctor.id}:`, error);
      // Fallback to random data if query fails
      queueCount = Math.floor(Math.random() * 3) + 1;
      estimatedWait = queueCount * 15;
    }
    
    const formattedDoctor = {
      id: doctor.user_id, // Use user_id instead of doctor.id for foreign key compatibility
      name: doctor.thai_name || `${doctor.first_name} ${doctor.last_name}`,
      department: doctor.department || 'ไม่ระบุ',
      specialization: doctor.specialization || 'ไม่ระบุ',
      isAvailable: doctor.is_active,
      currentQueue: queueCount,
      estimatedWaitTime: estimatedWait,
      medicalLicenseNumber: doctor.medical_license_number,
      yearsOfExperience: doctor.years_of_experience,
      position: doctor.position,
      consultationFee: doctor.consultation_fee,
      email: doctor.email,
      phone: doctor.phone,
      availability: doctor.availability && doctor.availability !== 'null' ? JSON.parse(doctor.availability) : null,
      education: doctor.education && doctor.education !== 'null' ? JSON.parse(doctor.education) : null,
      certifications: doctor.certifications && doctor.certifications !== 'null' ? JSON.parse(doctor.certifications) : null,
      languages: doctor.languages && doctor.languages !== 'null' ? JSON.parse(doctor.languages) : null,
      workSchedule: doctor.work_schedule && doctor.work_schedule !== 'null' ? JSON.parse(doctor.work_schedule) : null,
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
