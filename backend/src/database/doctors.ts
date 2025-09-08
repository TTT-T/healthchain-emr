import { databaseManager } from './connection';
import { v4 as uuidv4 } from 'uuid';

export interface DoctorProfile {
  id?: string;
  userId: string;
  medicalLicenseNumber: string;
  specialization: string;
  yearsOfExperience?: number;
  education?: any[];
  certifications?: any[];
  languages?: any[];
  department?: string;
  position?: string;
  workSchedule?: any;
  consultationFee?: number;
  availability?: any;
  emergencyContact?: string;
  emergencyPhone?: string;
  notificationPreferences?: any;
  privacySettings?: any;
}

export interface NurseProfile {
  id?: string;
  userId: string;
  nursingLicenseNumber: string;
  specialization: string;
  yearsOfExperience?: number;
  education?: any[];
  certifications?: any[];
  languages?: any[];
  department?: string;
  position?: string;
  workSchedule?: any;
  shiftPreference?: string;
  availability?: any;
  emergencyContact?: string;
  emergencyPhone?: string;
  notificationPreferences?: any;
  privacySettings?: any;
}

/**
 * Doctor Database Operations
 */
export class DoctorDB {
  /**
   * Create doctor profile
   */
  static async createDoctorProfile(profile: DoctorProfile): Promise<any> {
    const query = `
      INSERT INTO doctors (
        id, user_id, medical_license_number, specialization, years_of_experience,
        education, certifications, languages, department, position, work_schedule,
        consultation_fee, availability, emergency_contact, emergency_phone,
        notification_preferences, privacy_settings, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW()
      )
      RETURNING *
    `;

    const values = [
      uuidv4(),
      profile.userId,
      profile.medicalLicenseNumber,
      profile.specialization,
      profile.yearsOfExperience || null,
      profile.education ? JSON.stringify(profile.education) : null,
      profile.certifications ? JSON.stringify(profile.certifications) : null,
      profile.languages ? JSON.stringify(profile.languages) : null,
      profile.department || null,
      profile.position || null,
      profile.workSchedule ? JSON.stringify(profile.workSchedule) : null,
      profile.consultationFee || null,
      profile.availability ? JSON.stringify(profile.availability) : null,
      profile.emergencyContact || null,
      profile.emergencyPhone || null,
      profile.notificationPreferences ? JSON.stringify(profile.notificationPreferences) : null,
      profile.privacySettings ? JSON.stringify(profile.privacySettings) : null
    ];

    const result = await databaseManager.query(query, values);
    return result.rows[0];
  }

  /**
   * Get doctor profile by user ID
   */
  static async getDoctorByUserId(userId: string): Promise<any> {
    const query = `
      SELECT d.*, u.first_name, u.last_name, u.email, u.phone, u.role
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE d.user_id = $1
    `;

    const result = await databaseManager.query(query, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Update doctor profile
   */
  static async updateDoctorProfile(userId: string, profile: Partial<DoctorProfile>): Promise<any> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Build dynamic update query
    Object.entries(profile).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'userId' && value !== undefined) {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        fields.push(`${dbKey} = $${paramCount}`);
        
        // Handle JSON fields
        if (['education', 'certifications', 'languages', 'workSchedule', 'availability', 'notificationPreferences', 'privacySettings'].includes(key)) {
          values.push(value ? JSON.stringify(value) : null);
        } else {
          values.push(value);
        }
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push(`updated_at = NOW()`);
    values.push(userId);

    const query = `
      UPDATE doctors 
      SET ${fields.join(', ')}
      WHERE user_id = $${paramCount}
      RETURNING *
    `;

    const result = await databaseManager.query(query, values);
    return result.rows[0];
  }

  /**
   * Check if medical license number exists
   */
  static async checkMedicalLicenseExists(licenseNumber: string, excludeUserId?: string): Promise<boolean> {
    let query = 'SELECT id FROM doctors WHERE medical_license_number = $1';
    const values = [licenseNumber];

    if (excludeUserId) {
      query += ' AND user_id != $2';
      values.push(excludeUserId);
    }

    const result = await databaseManager.query(query, values);
    return result.rows.length > 0;
  }
}

/**
 * Nurse Database Operations
 */
export class NurseDB {
  /**
   * Create nurse profile
   */
  static async createNurseProfile(profile: NurseProfile): Promise<any> {
    const query = `
      INSERT INTO nurses (
        id, user_id, nursing_license_number, specialization, years_of_experience,
        education, certifications, languages, department, position, work_schedule,
        shift_preference, availability, emergency_contact, emergency_phone,
        notification_preferences, privacy_settings, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW()
      )
      RETURNING *
    `;

    const values = [
      uuidv4(),
      profile.userId,
      profile.nursingLicenseNumber,
      profile.specialization,
      profile.yearsOfExperience || null,
      profile.education ? JSON.stringify(profile.education) : null,
      profile.certifications ? JSON.stringify(profile.certifications) : null,
      profile.languages ? JSON.stringify(profile.languages) : null,
      profile.department || null,
      profile.position || null,
      profile.workSchedule ? JSON.stringify(profile.workSchedule) : null,
      profile.shiftPreference || null,
      profile.availability ? JSON.stringify(profile.availability) : null,
      profile.emergencyContact || null,
      profile.emergencyPhone || null,
      profile.notificationPreferences ? JSON.stringify(profile.notificationPreferences) : null,
      profile.privacySettings ? JSON.stringify(profile.privacySettings) : null
    ];

    const result = await databaseManager.query(query, values);
    return result.rows[0];
  }

  /**
   * Get nurse profile by user ID
   */
  static async getNurseByUserId(userId: string): Promise<any> {
    const query = `
      SELECT n.*, u.first_name, u.last_name, u.email, u.phone, u.role
      FROM nurses n
      JOIN users u ON n.user_id = u.id
      WHERE n.user_id = $1
    `;

    const result = await databaseManager.query(query, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Update nurse profile
   */
  static async updateNurseProfile(userId: string, profile: Partial<NurseProfile>): Promise<any> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Build dynamic update query
    Object.entries(profile).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'userId' && value !== undefined) {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        fields.push(`${dbKey} = $${paramCount}`);
        
        // Handle JSON fields
        if (['education', 'certifications', 'languages', 'workSchedule', 'availability', 'notificationPreferences', 'privacySettings'].includes(key)) {
          values.push(value ? JSON.stringify(value) : null);
        } else {
          values.push(value);
        }
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push(`updated_at = NOW()`);
    values.push(userId);

    const query = `
      UPDATE nurses 
      SET ${fields.join(', ')}
      WHERE user_id = $${paramCount}
      RETURNING *
    `;

    const result = await databaseManager.query(query, values);
    return result.rows[0];
  }

  /**
   * Check if nursing license number exists
   */
  static async checkNursingLicenseExists(licenseNumber: string, excludeUserId?: string): Promise<boolean> {
    let query = 'SELECT id FROM nurses WHERE nursing_license_number = $1';
    const values = [licenseNumber];

    if (excludeUserId) {
      query += ' AND user_id != $2';
      values.push(excludeUserId);
    }

    const result = await databaseManager.query(query, values);
    return result.rows.length > 0;
  }
}
