import { databaseManager } from './connection';

/**
 * Database Schema Management
 */
export class DatabaseSchema {
  private static db = databaseManager;

  /**
   * Initialize database schema
   */
  static async initialize(): Promise<void> {
    try {
      console.log('🔄 Initializing database schema...');
      
      // Create tables in order
      await this.createTables();
      
      // Insert default data
      await this.insertDefaultData();
      
      console.log('✅ Database schema initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing database schema:', error);
      throw error;
    }
  }

  /**
   * Create all tables
   */
  private static async createTables(): Promise<void> {
    const tables = [
      this.createUsersTable(),
      this.createUserSessionsTable(),
      this.createPasswordResetTokensTable(),
      this.createEmailVerificationTokensTable(),
      this.createUserSecuritySettingsTable(),
      this.createAuditLogsTable(),
      this.createDepartmentsTable(),
      this.createPatientsTable(),
      // Medical Records Tables
      this.createMedicalTables(),
    ];

    for (const table of tables) {
      await this.db.query(table);
    }
    
    // Create medical-specific functions and sequences
    await this.createMedicalFunctions();
  }

  /**
   * Create users table
   */
  private static createUsersTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        
        -- Personal Information
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        thai_name VARCHAR(200),
        
        -- Professional Information
        employee_id VARCHAR(20) UNIQUE,
        professional_license VARCHAR(50),
        position VARCHAR(100),
        department_id UUID,
        
        -- Role Management
        role VARCHAR(30) NOT NULL CHECK (role IN (
          'admin', 'doctor', 'nurse', 'pharmacist', 'lab_tech', 'staff',
          'consent_admin', 'compliance_officer', 'data_protection_officer', 'legal_advisor',
          'patient_guardian', 'legal_representative', 'medical_attorney',
          'external_user', 'external_admin', 'patient'
        )),
        
        -- Contact Information
        phone VARCHAR(20),
        emergency_contact VARCHAR(100),
        
        -- Account Status
        is_active BOOLEAN DEFAULT TRUE,
        is_verified BOOLEAN DEFAULT FALSE,
        email_verified BOOLEAN DEFAULT FALSE,
        profile_completed BOOLEAN DEFAULT FALSE,
        
        -- Security
        two_factor_enabled BOOLEAN DEFAULT FALSE,
        failed_login_attempts INTEGER DEFAULT 0,
        locked_until TIMESTAMP,
        
        -- Session Management
        last_login TIMESTAMP,
        last_activity TIMESTAMP,
        password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- System Fields
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by UUID
      );
    `;
  }

  /**
   * Create user sessions table
   */
  private static createUserSessionsTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        ip_address INET,
        user_agent TEXT,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
  }

  /**
   * Create password reset tokens table
   */
  private static createPasswordResetTokensTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
  }

  /**
   * Create user security settings table
   */
  private static createUserSecuritySettingsTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS user_security_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        two_factor_enabled BOOLEAN DEFAULT FALSE,
        email_notifications BOOLEAN DEFAULT TRUE,
        sms_notifications BOOLEAN DEFAULT FALSE,
        login_alerts BOOLEAN DEFAULT TRUE,
        session_timeout INTEGER DEFAULT 60,
        require_password_change BOOLEAN DEFAULT FALSE,
        password_change_interval INTEGER DEFAULT 90,
        device_trust BOOLEAN DEFAULT FALSE,
        location_tracking BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      );
    `;
  }

  /**
   * Create email verification tokens table
   */
  private static createEmailVerificationTokensTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS email_verification_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
  }

  /**
   * Create audit logs table
   */
  private static createAuditLogsTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        resource VARCHAR(100) NOT NULL,
        resource_id UUID,
        details JSONB DEFAULT '{}'::jsonb,
        ip_address INET,
        user_agent TEXT,
        success BOOLEAN DEFAULT TRUE,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
  }

  /**
   * Create departments table
   */
  private static createDepartmentsTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS departments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        department_code VARCHAR(10) UNIQUE NOT NULL,
        department_name VARCHAR(100) NOT NULL,
        department_type VARCHAR(20) CHECK (department_type IN ('clinical', 'diagnostic', 'support')),
        location VARCHAR(100),
        phone VARCHAR(20),
        operating_hours JSONB DEFAULT '{
          "monday": {"open": "08:00", "close": "17:00"},
          "tuesday": {"open": "08:00", "close": "17:00"},
          "wednesday": {"open": "08:00", "close": "17:00"},
          "thursday": {"open": "08:00", "close": "17:00"},
          "friday": {"open": "08:00", "close": "17:00"},
          "saturday": {"open": "08:00", "close": "12:00"},
          "sunday": {"closed": true}
        }'::jsonb,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
  }

  /**
   * Create patients table
   */
  private static createPatientsTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS patients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        hospital_number VARCHAR(20) UNIQUE NOT NULL,
        
        -- Personal Information
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        thai_name VARCHAR(200),
        date_of_birth DATE,
        gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
        nationality VARCHAR(50),
        
        -- Contact Information
        phone VARCHAR(20),
        email VARCHAR(100),
        address TEXT,
        
        -- Emergency Contact
        emergency_contact_name VARCHAR(100),
        emergency_contact_phone VARCHAR(20),
        emergency_contact_relationship VARCHAR(50),
        
        -- Medical Information
        blood_type VARCHAR(5),
        allergies TEXT,
        medical_history TEXT,
        current_medications TEXT,
        chronic_conditions TEXT[],
        
        -- System Fields
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by UUID REFERENCES users(id)
      );
    `;
  }

  /**
   * Create medical records tables
   */
  private static createMedicalTables(): string {
    return `
      -- Medical Records Tables
      -- This loads the comprehensive medical tables from migration file
      
      -- VISITS TABLE
      CREATE TABLE IF NOT EXISTS visits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        visit_number VARCHAR(20) UNIQUE NOT NULL,
        visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
        visit_time TIME NOT NULL DEFAULT CURRENT_TIME,
        visit_type VARCHAR(20) NOT NULL DEFAULT 'walk_in' 
            CHECK (visit_type IN ('walk_in', 'appointment', 'emergency', 'follow_up', 'referral')),
        chief_complaint TEXT,
        present_illness TEXT,
        physical_examination TEXT,
        diagnosis TEXT,
        treatment_plan TEXT,
        doctor_notes TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'in_progress'
            CHECK (status IN ('scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show')),
        priority VARCHAR(10) DEFAULT 'normal' 
            CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
        attending_doctor_id UUID REFERENCES users(id),
        assigned_nurse_id UUID REFERENCES users(id),
        department_id UUID REFERENCES departments(id),
        follow_up_required BOOLEAN DEFAULT FALSE,
        follow_up_date DATE,
        follow_up_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by UUID REFERENCES users(id),
        updated_by UUID REFERENCES users(id)
      );

      -- VITAL SIGNS TABLE
      CREATE TABLE IF NOT EXISTS vital_signs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
        patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        systolic_bp INTEGER,
        diastolic_bp INTEGER,
        heart_rate INTEGER,
        respiratory_rate INTEGER,
        temperature DECIMAL(4,1),
        oxygen_saturation INTEGER,
        weight DECIMAL(5,2),
        height DECIMAL(5,2),
        bmi DECIMAL(5,2),
        pain_scale INTEGER CHECK (pain_scale BETWEEN 0 AND 10),
        pain_location TEXT,
        blood_glucose INTEGER,
        waist_circumference DECIMAL(5,2),
        position VARCHAR(20) DEFAULT 'sitting' 
            CHECK (position IN ('sitting', 'standing', 'lying', 'ambulatory')),
        measurement_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        measured_by UUID REFERENCES users(id),
        notes TEXT,
        abnormal_findings TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- LAB ORDERS TABLE
      CREATE TABLE IF NOT EXISTS lab_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
        patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        order_number VARCHAR(20) UNIQUE NOT NULL,
        order_date DATE NOT NULL DEFAULT CURRENT_DATE,
        order_time TIME NOT NULL DEFAULT CURRENT_TIME,
        test_category VARCHAR(50) NOT NULL,
        test_name VARCHAR(200) NOT NULL,
        test_code VARCHAR(20),
        clinical_indication TEXT,
        specimen_type VARCHAR(50) DEFAULT 'blood' 
            CHECK (specimen_type IN ('blood', 'urine', 'stool', 'sputum', 'csf', 'other')),
        priority VARCHAR(20) DEFAULT 'routine'
            CHECK (priority IN ('stat', 'urgent', 'routine')),
        requested_completion TIMESTAMP,
        status VARCHAR(20) NOT NULL DEFAULT 'ordered'
            CHECK (status IN ('ordered', 'collected', 'processing', 'completed', 'cancelled')),
        ordered_by UUID NOT NULL REFERENCES users(id),
        collected_by UUID REFERENCES users(id),
        collection_date TIMESTAMP,
        collection_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- LAB RESULTS TABLE
      CREATE TABLE IF NOT EXISTS lab_results (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lab_order_id UUID NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
        patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        test_name VARCHAR(200) NOT NULL,
        test_code VARCHAR(20),
        result_value VARCHAR(500),
        result_numeric DECIMAL(10,3),
        result_unit VARCHAR(20),
        reference_range VARCHAR(200),
        reference_min DECIMAL(10,3),
        reference_max DECIMAL(10,3),
        abnormal_flag VARCHAR(10) 
            CHECK (abnormal_flag IN ('normal', 'high', 'low', 'critical_high', 'critical_low')),
        interpretation TEXT,
        validated BOOLEAN DEFAULT FALSE,
        validated_by UUID REFERENCES users(id),
        validated_at TIMESTAMP,
        result_date DATE NOT NULL DEFAULT CURRENT_DATE,
        result_time TIME NOT NULL DEFAULT CURRENT_TIME,
        reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        method VARCHAR(100),
        instrument VARCHAR(100),
        technician_notes TEXT,
        pathologist_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- PRESCRIPTIONS TABLE
      CREATE TABLE IF NOT EXISTS prescriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
        patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        prescription_number VARCHAR(20) UNIQUE NOT NULL,
        prescription_date DATE NOT NULL DEFAULT CURRENT_DATE,
        prescription_time TIME NOT NULL DEFAULT CURRENT_TIME,
        prescribed_by UUID NOT NULL REFERENCES users(id),
        diagnosis_for_prescription TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'pending'
            CHECK (status IN ('pending', 'approved', 'dispensed', 'partially_dispensed', 'cancelled')),
        dispensed_by UUID REFERENCES users(id),
        dispensed_at TIMESTAMP,
        general_instructions TEXT,
        precautions TEXT,
        follow_up_instructions TEXT,
        total_cost DECIMAL(10,2) DEFAULT 0.00,
        insurance_covered BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- PRESCRIPTION ITEMS TABLE
      CREATE TABLE IF NOT EXISTS prescription_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
        medication_name VARCHAR(200) NOT NULL,
        medication_code VARCHAR(50),
        generic_name VARCHAR(200),
        brand_name VARCHAR(200),
        strength VARCHAR(50),
        dosage_form VARCHAR(50) 
            CHECK (dosage_form IN ('tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'inhaler', 'other')),
        quantity_prescribed INTEGER NOT NULL,
        quantity_dispensed INTEGER DEFAULT 0,
        unit VARCHAR(20) DEFAULT 'tablet' 
            CHECK (unit IN ('tablet', 'capsule', 'ml', 'bottle', 'tube', 'box', 'vial', 'ampule', 'other')),
        dosage_instructions TEXT NOT NULL,
        duration_days INTEGER,
        unit_cost DECIMAL(8,2) DEFAULT 0.00,
        total_cost DECIMAL(10,2) DEFAULT 0.00,
        item_status VARCHAR(20) DEFAULT 'pending'
            CHECK (item_status IN ('pending', 'dispensed', 'partially_dispensed', 'cancelled', 'substituted')),
        substituted_with VARCHAR(200),
        substitution_reason TEXT,
        allergy_checked BOOLEAN DEFAULT FALSE,
        interaction_checked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes for medical tables
      CREATE INDEX IF NOT EXISTS idx_visits_patient_id ON visits(patient_id);
      CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(visit_date);
      CREATE INDEX IF NOT EXISTS idx_visits_doctor ON visits(attending_doctor_id);
      CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);
      CREATE INDEX IF NOT EXISTS idx_visits_visit_number ON visits(visit_number);

      CREATE INDEX IF NOT EXISTS idx_vital_signs_visit_id ON vital_signs(visit_id);
      CREATE INDEX IF NOT EXISTS idx_vital_signs_patient_id ON vital_signs(patient_id);
      CREATE INDEX IF NOT EXISTS idx_vital_signs_measurement_time ON vital_signs(measurement_time);

      CREATE INDEX IF NOT EXISTS idx_lab_orders_patient_id ON lab_orders(patient_id);
      CREATE INDEX IF NOT EXISTS idx_lab_orders_visit_id ON lab_orders(visit_id);
      CREATE INDEX IF NOT EXISTS idx_lab_orders_order_date ON lab_orders(order_date);
      CREATE INDEX IF NOT EXISTS idx_lab_orders_status ON lab_orders(status);

      CREATE INDEX IF NOT EXISTS idx_lab_results_lab_order_id ON lab_results(lab_order_id);
      CREATE INDEX IF NOT EXISTS idx_lab_results_patient_id ON lab_results(patient_id);
      CREATE INDEX IF NOT EXISTS idx_lab_results_result_date ON lab_results(result_date);

      CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
      CREATE INDEX IF NOT EXISTS idx_prescriptions_visit_id ON prescriptions(visit_id);
      CREATE INDEX IF NOT EXISTS idx_prescriptions_prescription_date ON prescriptions(prescription_date);

      CREATE INDEX IF NOT EXISTS idx_prescription_items_prescription_id ON prescription_items(prescription_id);
    `;
  }

  /**
   * Create medical-specific functions and sequences
   */
  private static async createMedicalFunctions(): Promise<void> {
    // Create sequences for number generation
    await this.db.query(`
      CREATE SEQUENCE IF NOT EXISTS visit_number_seq START 1;
      CREATE SEQUENCE IF NOT EXISTS lab_order_number_seq START 1;
      CREATE SEQUENCE IF NOT EXISTS prescription_number_seq START 1;
    `);

    // Create functions for auto-generating numbers
    await this.db.query(`
      CREATE OR REPLACE FUNCTION generate_visit_number()
      RETURNS VARCHAR(20) AS $$
      DECLARE
          year_month VARCHAR(6);
          sequence_num VARCHAR(6);
      BEGIN
          year_month := TO_CHAR(CURRENT_DATE, 'YYYYMM');
          sequence_num := LPAD(nextval('visit_number_seq')::TEXT, 4, '0');
          RETURN 'V' || year_month || sequence_num;
      END;
      $$ LANGUAGE plpgsql;

      CREATE OR REPLACE FUNCTION generate_lab_order_number()
      RETURNS VARCHAR(20) AS $$
      DECLARE
          year_month VARCHAR(6);
          sequence_num VARCHAR(6);
      BEGIN
          year_month := TO_CHAR(CURRENT_DATE, 'YYYYMM');
          sequence_num := LPAD(nextval('lab_order_number_seq')::TEXT, 4, '0');
          RETURN 'LAB' || year_month || sequence_num;
      END;
      $$ LANGUAGE plpgsql;

      CREATE OR REPLACE FUNCTION generate_prescription_number()
      RETURNS VARCHAR(20) AS $$
      DECLARE
          year_month VARCHAR(6);
          sequence_num VARCHAR(6);
      BEGIN
          year_month := TO_CHAR(CURRENT_DATE, 'YYYYMM');
          sequence_num := LPAD(nextval('prescription_number_seq')::TEXT, 4, '0');
          RETURN 'RX' || year_month || sequence_num;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create trigger function for updating timestamps
    await this.db.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create triggers for timestamp updates (with IF NOT EXISTS-like logic)
    const triggers = [
      'update_visits_updated_at',
      'update_vital_signs_updated_at', 
      'update_lab_orders_updated_at',
      'update_lab_results_updated_at',
      'update_prescriptions_updated_at',
      'update_prescription_items_updated_at'
    ];

    const tables = [
      'visits',
      'vital_signs',
      'lab_orders', 
      'lab_results',
      'prescriptions',
      'prescription_items'
    ];

    for (let i = 0; i < triggers.length; i++) {
      try {
        await this.db.query(`
          DROP TRIGGER IF EXISTS ${triggers[i]} ON ${tables[i]};
          CREATE TRIGGER ${triggers[i]} BEFORE UPDATE ON ${tables[i]}
              FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `);
      } catch (error) {
        console.warn(`Warning: Could not create trigger ${triggers[i]}:`, error);
      }
    }

    console.log('✅ Medical functions and sequences created');
  }

  /**
   * Insert default data
   */
  private static async insertDefaultData(): Promise<void> {
    await this.insertDefaultDepartments();
    console.log('✅ Default data inserted');
  }

  /**
   * Insert default departments
   */
  private static async insertDefaultDepartments(): Promise<void> {
    const departments = [
      { code: 'OPD', name: 'Out Patient Department', type: 'clinical' },
      { code: 'ER', name: 'Emergency Room', type: 'clinical' },
      { code: 'LAB', name: 'Laboratory', type: 'diagnostic' },
      { code: 'PHARM', name: 'Pharmacy', type: 'support' },
      { code: 'RADIO', name: 'Radiology', type: 'diagnostic' },
      { code: 'ADMIN', name: 'Administration', type: 'support' },
    ];

    for (const dept of departments) {
      await this.db.query(
        `INSERT INTO departments (department_code, department_name, department_type) 
         VALUES ($1, $2, $3) ON CONFLICT (department_code) DO NOTHING`,
        [dept.code, dept.name, dept.type]
      );
    }
  }

  /**
   * Create email verification token
   */
  static async createEmailVerificationToken(userId: string, token: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    await this.db.query(`
      INSERT INTO email_verification_tokens (user_id, token, expires_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id) DO UPDATE SET
        token = EXCLUDED.token,
        expires_at = EXCLUDED.expires_at,
        created_at = CURRENT_TIMESTAMP
    `, [userId, token, expiresAt]);
  }

  /**
   * Verify email token
   */
  static async verifyEmailToken(token: string): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      // Find and validate token
      const tokenResult = await this.db.query(`
        SELECT user_id, expires_at
        FROM email_verification_tokens
        WHERE token = $1 AND used_at IS NULL
      `, [token]);

      if (tokenResult.rows.length === 0) {
        return { success: false, error: 'Invalid or expired verification token' };
      }

      const { user_id, expires_at } = tokenResult.rows[0];

      // Check if token is expired
      if (new Date() > new Date(expires_at)) {
        return { success: false, error: 'Verification token has expired' };
      }

      // Update user email verification status
      await this.db.query(`
        UPDATE users 
        SET email_verified = true, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [user_id]);

      // Mark token as used
      await this.db.query(`
        UPDATE email_verification_tokens
        SET used_at = CURRENT_TIMESTAMP
        WHERE token = $1
      `, [token]);

      return { success: true, userId: user_id };
    } catch (error) {
      console.error('Email verification error:', error);
      return { success: false, error: 'Failed to verify email' };
    }
  }

  /**
   * Create password reset token
   */
  static async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<{ success: boolean; error?: string }> {
    try {
      // Delete any existing reset tokens for this user
      await this.db.query(
        'DELETE FROM password_reset_tokens WHERE user_id = $1',
        [userId]
      );

      // Create new reset token
      await this.db.query(
        'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [userId, token, expiresAt]
      );

      return { success: true };
    } catch (error) {
      console.error('Create password reset token error:', error);
      return { success: false, error: 'Failed to create reset token' };
    }
  }

  /**
   * Validate password reset token
   */
  static async validatePasswordResetToken(token: string): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      const result = await this.db.query(
        'SELECT user_id, expires_at, used_at FROM password_reset_tokens WHERE token = $1',
        [token]
      );

      if (result.rows.length === 0) {
        return { success: false, error: 'Invalid token' };
      }

      const tokenData = result.rows[0];

      // Check if token is expired
      if (new Date() > new Date(tokenData.expires_at)) {
        return { success: false, error: 'Token expired' };
      }

      // Check if token is already used
      if (tokenData.used_at) {
        return { success: false, error: 'Token already used' };
      }

      return { success: true, userId: tokenData.user_id };
    } catch (error) {
      console.error('Validate password reset token error:', error);
      return { success: false, error: 'Failed to validate token' };
    }
  }

  /**
   * Mark password reset token as used
   */
  static async markPasswordResetTokenAsUsed(token: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.db.query(
        'UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE token = $1',
        [token]
      );

      return { success: true };
    } catch (error) {
      console.error('Mark password reset token as used error:', error);
      return { success: false, error: 'Failed to mark token as used' };
    }
  }

  /**
   * Update user password
   */
  static async updateUserPassword(userId: string, newPasswordHash: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.db.query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newPasswordHash, userId]
      );

      return { success: true };
    } catch (error) {
      console.error('Update user password error:', error);
      return { success: false, error: 'Failed to update password' };
    }
  }

  /**
   * Create password reset token (instance method)
   */
  async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<{ success: boolean; error?: string }> {
    return DatabaseSchema.createPasswordResetToken(userId, token, expiresAt);
  }

  /**
   * Validate password reset token (instance method)
   */
  async validatePasswordResetToken(token: string): Promise<{ success: boolean; userId?: string; error?: string }> {
    return DatabaseSchema.validatePasswordResetToken(token);
  }

  /**
   * Update user password (instance method)
   */
  async updateUserPassword(userId: string, newPasswordHash: string): Promise<{ success: boolean; error?: string }> {
    return DatabaseSchema.updateUserPassword(userId, newPasswordHash);
  }

  /**
   * Mark password reset token as used (instance method)
   */
  async markPasswordResetTokenAsUsed(token: string): Promise<{ success: boolean; error?: string }> {
    return DatabaseSchema.markPasswordResetTokenAsUsed(token);
  }

  /**
   * Invalidate user sessions (instance method)
   */
  async invalidateUserSessions(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await DatabaseSchema.db.query(
        'DELETE FROM user_sessions WHERE user_id = $1',
        [userId]
      );

      return { success: true };
    } catch (error) {
      console.error('Invalidate user sessions error:', error);
      return { success: false, error: 'Failed to invalidate sessions' };
    }
  }
}

export const db = databaseManager;
export default databaseManager;
