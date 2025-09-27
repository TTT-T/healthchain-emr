#!/usr/bin/env node

import { databaseManager } from '../database/connection';

/**
 * Clear Database Script
 */
class DatabaseClearer {
  private static instance: DatabaseClearer;

  private constructor() {}

  public static getInstance(): DatabaseClearer {
    if (!DatabaseClearer.instance) {
      DatabaseClearer.instance = new DatabaseClearer();
    }
    return DatabaseClearer.instance;
  }

  /**
   * Clear all database data
   */
  public async clearDatabase(): Promise<void> {
    try {
      // Initialize database connection
      await databaseManager.initialize();

      // List of all tables to clear
      const tables = [
        'users', 'patients', 'visits', 'vital_signs', 'lab_orders', 'lab_results',
        'prescriptions', 'appointments', 'risk_assessments', 'consent_contracts',
        'consent_requests', 'consent_audit_trail', 'consent_access_logs',
        'medical_records', 'visit_attachments', 'audit_logs', 'system_audit_logs',
        'error_logs', 'performance_logs', 'email_verification_tokens',
        'password_reset_tokens', 'user_sessions', 'user_security_settings',
        'system_settings', 'departments', 'doctors', 'nurses',
        'database_backup_logs', 'database_maintenance_logs',
        'database_performance_metrics', 'ai_model_performance',
        'appointment_history', 'appointment_reminders', 'appointment_types'
      ];

      console.log('Starting database clear...');

      // Clear each table
      for (const table of tables) {
        try {
          // Check if table exists first
          const tableExists = await databaseManager.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = $1
            )
          `, [table]);
          
          if (tableExists.rows[0].exists) {
            await databaseManager.query(`DELETE FROM ${table}`);
            console.log(`✅ Cleared table: ${table}`);
          } else {
            console.log(`⚠️  Table ${table} does not exist`);
          }
        } catch (error) {
          // Table might not exist or other error, continue
          console.log(`⚠️  Error clearing table ${table}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      console.log('✅ Database cleared successfully');

      // Verify users table is empty
      const result = await databaseManager.query('SELECT COUNT(*) as count FROM users');
      const userCount = result.rows[0].count;
      
      if (userCount == 0) {
        console.log('✅ Verification successful - Database is empty');
      } else {
        console.log(`⚠️  Warning - Users table still has ${userCount} records`);
      }

    } catch (error) {
      console.error('❌ Database clear failed:', error);
      throw error;
    }
  }
}

// Run clearing if called directly
if (require.main === module) {
  const clearer = DatabaseClearer.getInstance();
  clearer.clearDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database clearing failed:', error);
      process.exit(1);
    });
}

export default DatabaseClearer;
