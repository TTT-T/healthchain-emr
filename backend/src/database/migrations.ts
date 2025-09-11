import { databaseManager } from './connection';
import { DatabaseSchema } from './index';

/**
 * Database Migration System
 */
export class MigrationManager {
  private static instance: MigrationManager;

  private constructor() {}

  public static getInstance(): MigrationManager {
    if (!MigrationManager.instance) {
      MigrationManager.instance = new MigrationManager();
    }
    return MigrationManager.instance;
  }

  /**
   * Initialize migration system
   */
  public async initialize(): Promise<void> {
    try {
      console.log('🔄 Initializing migration system...');
      
      // Create migrations table if not exists
      await this.createMigrationsTable();
      
      // Run pending migrations
      await this.runPendingMigrations();
      
      console.log('✅ Migration system initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing migration system:', error);
      throw error;
    }
  }

  /**
   * Create migrations table
   */
  private async createMigrationsTable(): Promise<void> {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        execution_time_ms INTEGER,
        success BOOLEAN DEFAULT TRUE,
        error_message TEXT
      );
    `;

    await databaseManager.query(createTableQuery);
    console.log('📋 Migrations table created/verified');
  }

  /**
   * Run pending migrations
   */
  private async runPendingMigrations(): Promise<void> {
    const migrations = [
      {
        name: '001_initial_schema',
        description: 'Create initial database schema',
        up: async () => {
          await DatabaseSchema.initialize();
        }
      },
      {
        name: '002_create_ai_tables',
        description: 'Create AI risk assessment tables',
        up: async () => {
          await this.createAITables();
        }
      },
      {
        name: '003_create_consent_tables',
        description: 'Create consent management tables',
        up: async () => {
          await this.createConsentTables();
        }
      },
      {
        name: '004_create_appointment_tables',
        description: 'Create appointment management tables',
        up: async () => {
          await this.createAppointmentTables();
        }
      },
      {
        name: '005_create_audit_tables',
        description: 'Create audit and logging tables',
        up: async () => {
          await this.createAuditTables();
        }
      },
      {
        name: '006_add_user_profile_fields',
        description: 'Add comprehensive user profile fields',
        up: async () => {
          await this.runSqlMigration('006_add_user_profile_fields.sql');
        }
      },
      {
        name: '007_fix_patient_schema_consistency',
        description: 'Fix patient schema consistency',
        up: async () => {
          await this.runSqlMigration('007_fix_patient_schema_consistency.sql');
        }
      },
      {
        name: '008_add_user_id_to_patients',
        description: 'Add user_id to patients table',
        up: async () => {
          await this.runSqlMigration('008_add_user_id_to_patients.sql');
        }
      },
      {
        name: '009_enhance_user_profile_fields',
        description: 'Enhance user profile fields for comprehensive profile management',
        up: async () => {
          await this.runSqlMigration('009_enhance_user_profile_fields.sql');
        }
      },
      {
        name: '010_add_thai_last_name_field',
        description: 'Add thai_last_name field for proper Thai name handling',
        up: async () => {
          await this.runSqlMigration('010_add_thai_last_name_field.sql');
        }
      },
      {
        name: '011_create_doctors_nurses_tables',
        description: 'Create doctors and nurses tables for professional profiles',
        up: async () => {
          await this.runSqlMigration('011_create_doctors_nurses_tables.sql');
        }
      },
      {
        name: '012_add_user_approval_fields',
        description: 'Add user approval and rejection tracking fields',
        up: async () => {
          await this.runSqlMigration('012_add_user_approval_fields.sql');
        }
      },
      {
        name: '013_add_separate_birth_date_fields',
        description: 'Add separate birth date fields for better date handling',
        up: async () => {
          await this.runSqlMigration('013_add_separate_birth_date_fields.sql');
        }
      },
      {
        name: '014_add_hospital_number_sequence',
        description: 'Add hospital number sequence for HR number generation',
        up: async () => {
          await this.runSqlMigration('014_add_hospital_number_sequence.sql');
        }
      }
    ];

    for (const migration of migrations) {
      await this.runMigration(migration);
    }
  }

  /**
   * Run a single migration
   */
  private async runMigration(migration: {
    name: string;
    description: string;
    up: () => Promise<void>;
  }): Promise<void> {
    try {
      // Check if migration already exists
      const existingMigration = await databaseManager.query(
        'SELECT id FROM migrations WHERE migration_name = $1',
        [migration.name]
      );

      if (existingMigration.rows.length > 0) {
        console.log(`⏭️ Migration ${migration.name} already executed, skipping`);
        return;
      }

      console.log(`🔄 Running migration: ${migration.name} - ${migration.description}`);
      const startTime = Date.now();

      // Execute migration
      await migration.up();

      const executionTime = Date.now() - startTime;

      // Record migration
      await databaseManager.query(
        `INSERT INTO migrations (migration_name, execution_time_ms, success) 
         VALUES ($1, $2, $3)`,
        [migration.name, executionTime, true]
      );

      console.log(`✅ Migration ${migration.name} completed in ${executionTime}ms`);

    } catch (error) {
      console.error(`❌ Migration ${migration.name} failed:`, error);
      
      // Record failed migration
      await databaseManager.query(
        `INSERT INTO migrations (migration_name, execution_time_ms, success, error_message) 
         VALUES ($1, $2, $3, $4)`,
        [migration.name, 0, false, error instanceof Error ? error.message : String(error)]
      );

      throw error;
    }
  }

  /**
   * Create AI risk assessment tables
   */
  private async createAITables(): Promise<void> {
    const createTablesQuery = `
      -- AI Risk Assessment Tables
      CREATE TABLE IF NOT EXISTS risk_assessments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        assessment_type VARCHAR(50) NOT NULL 
            CHECK (assessment_type IN ('diabetes', 'hypertension', 'heart_disease', 'stroke', 'cancer')),
        risk_level VARCHAR(20) NOT NULL 
            CHECK (risk_level IN ('low', 'moderate', 'high', 'very_high')),
        probability DECIMAL(5,2) NOT NULL CHECK (probability >= 0 AND probability <= 100),
        factors JSONB NOT NULL DEFAULT '{}'::jsonb,
        recommendations TEXT[],
        next_assessment_date DATE,
        assessed_by UUID NOT NULL REFERENCES users(id),
        assessment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- AI Model Performance Tracking
      CREATE TABLE IF NOT EXISTS ai_model_performance (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        model_name VARCHAR(100) NOT NULL,
        model_version VARCHAR(20) NOT NULL,
        assessment_type VARCHAR(50) NOT NULL,
        accuracy DECIMAL(5,4),
        precision_score DECIMAL(5,4),
        recall_score DECIMAL(5,4),
        f1_score DECIMAL(5,4),
        total_predictions INTEGER DEFAULT 0,
        correct_predictions INTEGER DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_risk_assessments_patient_id ON risk_assessments(patient_id);
      CREATE INDEX IF NOT EXISTS idx_risk_assessments_type ON risk_assessments(assessment_type);
      CREATE INDEX IF NOT EXISTS idx_risk_assessments_date ON risk_assessments(assessment_date);
      CREATE INDEX IF NOT EXISTS idx_ai_model_performance_model ON ai_model_performance(model_name, model_version);
    `;

    await databaseManager.query(createTablesQuery);
    console.log('🤖 AI risk assessment tables created');
  }

  /**
   * Create consent management tables
   */
  private async createConsentTables(): Promise<void> {
    const createTablesQuery = `
      -- Consent Management Tables
      CREATE TABLE IF NOT EXISTS consent_contracts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        contract_id VARCHAR(50) UNIQUE NOT NULL,
        patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        requester_id UUID NOT NULL REFERENCES users(id),
        data_types TEXT[] NOT NULL,
        purpose TEXT NOT NULL,
        duration VARCHAR(50) NOT NULL,
        conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
        status VARCHAR(20) NOT NULL DEFAULT 'pending'
            CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'revoked')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved_at TIMESTAMP,
        expires_at TIMESTAMP,
        revoked_at TIMESTAMP,
        revocation_reason TEXT,
        smart_contract_rules JSONB DEFAULT '{}'::jsonb,
        created_by UUID REFERENCES users(id),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Consent Access Logs
      CREATE TABLE IF NOT EXISTS consent_access_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        contract_id UUID NOT NULL REFERENCES consent_contracts(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id),
        action VARCHAR(50) NOT NULL,
        data_type VARCHAR(50) NOT NULL,
        resource_id UUID,
        ip_address INET,
        user_agent TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        success BOOLEAN DEFAULT TRUE,
        error_message TEXT
      );

      -- Consent Audit Trail
      CREATE TABLE IF NOT EXISTS consent_audit_trail (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        contract_id UUID NOT NULL REFERENCES consent_contracts(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL,
        old_values JSONB,
        new_values JSONB,
        changed_by UUID NOT NULL REFERENCES users(id),
        change_reason TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_consent_contracts_patient_id ON consent_contracts(patient_id);
      CREATE INDEX IF NOT EXISTS idx_consent_contracts_status ON consent_contracts(status);
      CREATE INDEX IF NOT EXISTS idx_consent_contracts_expires_at ON consent_contracts(expires_at);
      CREATE INDEX IF NOT EXISTS idx_consent_access_logs_contract_id ON consent_access_logs(contract_id);
      CREATE INDEX IF NOT EXISTS idx_consent_access_logs_timestamp ON consent_access_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_consent_audit_trail_contract_id ON consent_audit_trail(contract_id);
    `;

    await databaseManager.query(createTablesQuery);
    console.log('🔒 Consent management tables created');
  }

  /**
   * Create appointment management tables
   */
  private async createAppointmentTables(): Promise<void> {
    const createTablesQuery = `
      -- Appointment Management Tables
      CREATE TABLE IF NOT EXISTS appointments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        physician_id UUID NOT NULL REFERENCES users(id),
        title VARCHAR(200) NOT NULL,
        description TEXT,
        appointment_type VARCHAR(50) NOT NULL DEFAULT 'consultation'
            CHECK (appointment_type IN ('consultation', 'follow_up', 'procedure', 'test', 'emergency')),
        status VARCHAR(20) NOT NULL DEFAULT 'scheduled'
            CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
        priority VARCHAR(10) DEFAULT 'normal'
            CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
        appointment_date DATE NOT NULL,
        appointment_time TIME NOT NULL,
        duration_minutes INTEGER DEFAULT 30,
        location JSONB DEFAULT '{}'::jsonb,
        notes TEXT,
        preparations TEXT[],
        follow_up_required BOOLEAN DEFAULT FALSE,
        follow_up_notes TEXT,
        reminder_sent BOOLEAN DEFAULT FALSE,
        reminder_sent_at TIMESTAMP,
        can_reschedule BOOLEAN DEFAULT TRUE,
        can_cancel BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by UUID REFERENCES users(id),
        updated_by UUID REFERENCES users(id)
      );

      -- Appointment History
      CREATE TABLE IF NOT EXISTS appointment_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL,
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        changed_by UUID REFERENCES users(id),
        reason TEXT,
        notes TEXT
      );

      -- Appointment Reminders
      CREATE TABLE IF NOT EXISTS appointment_reminders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
        reminder_type VARCHAR(20) NOT NULL
            CHECK (reminder_type IN ('email', 'sms', 'push', 'phone')),
        scheduled_at TIMESTAMP NOT NULL,
        sent_at TIMESTAMP,
        status VARCHAR(20) NOT NULL DEFAULT 'pending'
            CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
      CREATE INDEX IF NOT EXISTS idx_appointments_physician_id ON appointments(physician_id);
      CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
      CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
      CREATE INDEX IF NOT EXISTS idx_appointment_history_appointment_id ON appointment_history(appointment_id);
      CREATE INDEX IF NOT EXISTS idx_appointment_reminders_appointment_id ON appointment_reminders(appointment_id);
      CREATE INDEX IF NOT EXISTS idx_appointment_reminders_scheduled_at ON appointment_reminders(scheduled_at);
    `;

    await databaseManager.query(createTablesQuery);
    console.log('📅 Appointment management tables created');
  }

  /**
   * Create audit and logging tables
   */
  private async createAuditTables(): Promise<void> {
    const createTablesQuery = `
      -- Enhanced Audit Logs
      CREATE TABLE IF NOT EXISTS system_audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        session_id UUID,
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(100) NOT NULL,
        resource_id UUID,
        old_values JSONB,
        new_values JSONB,
        ip_address INET,
        user_agent TEXT,
        success BOOLEAN DEFAULT TRUE,
        error_message TEXT,
        execution_time_ms INTEGER,
        request_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- System Performance Logs
      CREATE TABLE IF NOT EXISTS performance_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        endpoint VARCHAR(200),
        method VARCHAR(10),
        response_time_ms INTEGER NOT NULL,
        status_code INTEGER,
        user_id UUID REFERENCES users(id),
        ip_address INET,
        user_agent TEXT,
        request_size_bytes INTEGER,
        response_size_bytes INTEGER,
        database_query_time_ms INTEGER,
        memory_usage_mb DECIMAL(8,2),
        cpu_usage_percent DECIMAL(5,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Error Logs
      CREATE TABLE IF NOT EXISTS error_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        error_type VARCHAR(100) NOT NULL,
        error_message TEXT NOT NULL,
        stack_trace TEXT,
        user_id UUID REFERENCES users(id),
        session_id UUID,
        endpoint VARCHAR(200),
        method VARCHAR(10),
        ip_address INET,
        user_agent TEXT,
        request_body JSONB,
        severity VARCHAR(20) DEFAULT 'error'
            CHECK (severity IN ('debug', 'info', 'warn', 'error', 'fatal')),
        resolved BOOLEAN DEFAULT FALSE,
        resolved_at TIMESTAMP,
        resolved_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_system_audit_logs_user_id ON system_audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_system_audit_logs_created_at ON system_audit_logs(created_at);
      CREATE INDEX IF NOT EXISTS idx_system_audit_logs_resource ON system_audit_logs(resource_type, resource_id);
      CREATE INDEX IF NOT EXISTS idx_performance_logs_endpoint ON performance_logs(endpoint);
      CREATE INDEX IF NOT EXISTS idx_performance_logs_created_at ON performance_logs(created_at);
      CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(error_type);
      CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
      CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);
    `;

    await databaseManager.query(createTablesQuery);
    console.log('📊 Audit and logging tables created');
  }

  /**
   * Get migration status
   */
  public async getMigrationStatus(): Promise<{
    total: number;
    executed: number;
    pending: number;
    failed: number;
    migrations: Array<{
      name: string;
      executed_at: Date;
      execution_time_ms: number;
      success: boolean;
      error_message?: string;
    }>;
  }> {
    const result = await databaseManager.query(`
      SELECT 
        migration_name,
        executed_at,
        execution_time_ms,
        success,
        error_message
      FROM migrations 
      ORDER BY executed_at DESC
    `);

    const migrations = result.rows.map(row => ({
      name: row.migration_name,
      executed_at: row.executed_at,
      execution_time_ms: row.execution_time_ms,
      success: row.success,
      error_message: row.error_message
    }));

    const executed = migrations.filter(m => m.success).length;
    const failed = migrations.filter(m => !m.success).length;

    return {
      total: migrations.length,
      executed,
      pending: 0, // All migrations are defined in code
      failed,
      migrations
    };
  }

  /**
   * Run SQL migration from file
   */
  private async runSqlMigration(filename: string): Promise<void> {
    const fs = require('fs');
    const path = require('path');
    
    const migrationPath = path.join(__dirname, 'migrations', filename);
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${filename}`);
    }
    
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the SQL
    await databaseManager.query(sql);
    console.log(`✅ SQL migration executed: ${filename}`);
  }

  /**
   * Reset all migrations (for development only)
   */
  public async resetMigrations(): Promise<void> {
    console.log('⚠️ Resetting all migrations...');
    
    await databaseManager.query('DROP TABLE IF EXISTS migrations CASCADE');
    console.log('🗑️ Migrations table dropped');
    
    // Recreate and run migrations
    await this.initialize();
    console.log('✅ Migrations reset and re-executed');
  }
}

// Export singleton instance
export const migrationManager = MigrationManager.getInstance();
export default MigrationManager;
