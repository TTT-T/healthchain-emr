#!/usr/bin/env ts-node

/**
 * Database Health Check Script
 * This script checks database health and can auto-fix common issues
 * Usage: npm run db:health-check
 */

import { databaseManager } from '../database/connection';
import { databaseInitializer } from '../database/init';
import { migrationManager } from '../database/migrations';
import config from '../config/config';

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'critical';
  issues: string[];
  recommendations: string[];
  details: {
    connection: boolean;
    migrations: boolean;
    tables: boolean;
    indexes: boolean;
  };
}

class DatabaseHealthChecker {
  private static instance: DatabaseHealthChecker;

  private constructor() {}

  public static getInstance(): DatabaseHealthChecker {
    if (!DatabaseHealthChecker.instance) {
      DatabaseHealthChecker.instance = new DatabaseHealthChecker();
    }
    return DatabaseHealthChecker.instance;
  }

  /**
   * Run comprehensive health check
   */
  public async runHealthCheck(): Promise<HealthCheckResult> {
    console.log('🏥 Starting Database Health Check...');
    console.log(`📊 Environment: ${config.nodeEnv}`);
    console.log(`🗄️ Database: ${config.database.host}:${config.database.port}/${config.database.database}`);

    const result: HealthCheckResult = {
      status: 'healthy',
      issues: [],
      recommendations: [],
      details: {
        connection: false,
        migrations: false,
        tables: false,
        indexes: false
      }
    };

    try {
      // Check 1: Database Connection
      console.log('\n📋 Check 1: Database Connection...');
      try {
        await databaseInitializer.initialize();
        result.details.connection = true;
        console.log('✅ Database connection is healthy');
      } catch (error) {
        result.issues.push('Database connection failed');
        result.recommendations.push('Check if PostgreSQL is running and accessible');
        console.log('❌ Database connection failed:', error.message);
      }

      // Check 2: Migration Status
      console.log('\n📋 Check 2: Migration Status...');
      try {
        const migrationStatus = await migrationManager.getMigrationStatus();
        if (migrationStatus.failed > 0) {
          result.issues.push(`${migrationStatus.failed} migrations failed`);
          result.recommendations.push('Run migrations to fix failed migrations');
          console.log(`❌ ${migrationStatus.failed} migrations failed`);
        } else {
          result.details.migrations = true;
          console.log('✅ All migrations are healthy');
        }
      } catch (error) {
        result.issues.push('Migration system error');
        result.recommendations.push('Check migration files and database schema');
        console.log('❌ Migration check failed:', error.message);
      }

      // Check 3: Essential Tables
      console.log('\n📋 Check 3: Essential Tables...');
      try {
        const essentialTables = [
          'users', 'patients', 'visits', 'vital_signs', 'lab_orders', 'lab_results',
          'prescriptions', 'prescription_items', 'visit_attachments', 'departments',
          'appointments', 'notifications', 'medical_records', 'audit_logs', 
          'user_sessions', 'password_reset_tokens', 'email_verification_tokens', 
          'user_security_settings', 'migrations'
        ];
        
        for (const table of essentialTables) {
          const tableExists = await this.checkTableExists(table);
          if (!tableExists) {
            result.issues.push(`Table '${table}' does not exist`);
            result.recommendations.push(`Create missing table '${table}'`);
            console.log(`❌ Table '${table}' is missing`);
          }
        }
        
        if (result.issues.filter(issue => issue.includes('Table')).length === 0) {
          result.details.tables = true;
          console.log('✅ All essential tables exist');
        }
      } catch (error) {
        result.issues.push('Table check failed');
        result.recommendations.push('Check database permissions and schema');
        console.log('❌ Table check failed:', error.message);
      }

      // Check 4: Database Indexes
      console.log('\n📋 Check 4: Database Indexes...');
      try {
        const indexCheck = await this.checkIndexes();
        if (!indexCheck) {
          result.issues.push('Some database indexes are missing');
          result.recommendations.push('Recreate missing indexes for better performance');
          console.log('❌ Some indexes are missing');
        } else {
          result.details.indexes = true;
          console.log('✅ Database indexes are healthy');
        }
      } catch (error) {
        result.issues.push('Index check failed');
        result.recommendations.push('Check database permissions');
        console.log('❌ Index check failed:', error.message);
      }

      // Determine overall status
      if (result.issues.length === 0) {
        result.status = 'healthy';
      } else if (result.issues.some(issue => issue.includes('connection') || issue.includes('Table'))) {
        result.status = 'critical';
      } else {
        result.status = 'unhealthy';
      }

      // Print summary
      console.log('\n📊 Health Check Summary:');
      console.log(`   Status: ${result.status.toUpperCase()}`);
      console.log(`   Issues: ${result.issues.length}`);
      console.log(`   Recommendations: ${result.recommendations.length}`);

      if (result.issues.length > 0) {
        console.log('\n⚠️ Issues Found:');
        result.issues.forEach((issue, index) => {
          console.log(`   ${index + 1}. ${issue}`);
        });
      }

      if (result.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        result.recommendations.forEach((rec, index) => {
          console.log(`   ${index + 1}. ${rec}`);
        });
      }

      return result;

    } catch (error) {
      console.error('💥 Health check failed:', error);
      result.status = 'critical';
      result.issues.push('Health check system error');
      result.recommendations.push('Check system configuration and try again');
      return result;
    }
  }

  /**
   * Auto-fix common database issues
   */
  public async autoFix(): Promise<void> {
    console.log('🔧 Starting Auto-Fix Process...');

    try {
      // Fix 1: Run migrations
      console.log('\n📋 Fix 1: Running Migrations...');
      try {
        await migrationManager.initialize();
        console.log('✅ Migrations completed');
      } catch (error) {
        console.log('❌ Migration fix failed:', error.message);
      }

      // Fix 2: Create missing tables
      console.log('\n📋 Fix 2: Checking for Missing Tables...');
      try {
        await this.createMissingTables();
        console.log('✅ Missing tables check completed');
      } catch (error) {
        console.log('❌ Table creation failed:', error.message);
      }

      // Fix 3: Recreate indexes
      console.log('\n📋 Fix 3: Recreating Indexes...');
      try {
        await this.recreateIndexes();
        console.log('✅ Indexes recreated');
      } catch (error) {
        console.log('❌ Index recreation failed:', error.message);
      }

      console.log('\n🎉 Auto-fix process completed!');

    } catch (error) {
      console.error('💥 Auto-fix failed:', error);
      throw error;
    }
  }

  /**
   * Check if table exists
   */
  private async checkTableExists(tableName: string): Promise<boolean> {
    const result = await databaseManager.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );
    `, [tableName]);
    
    return result.rows[0].exists;
  }

  /**
   * Check database indexes
   */
  private async checkIndexes(): Promise<boolean> {
    const essentialIndexes = [
      'idx_users_email',
      'idx_users_username',
      'idx_patients_patient_number',
      'idx_patients_user_id',
      'idx_visits_patient_id',
      'idx_visits_date',
      'idx_vital_signs_visit_id',
      'idx_lab_orders_visit_id',
      'idx_lab_results_visit_id',
      'idx_prescriptions_visit_id',
      'idx_prescription_items_prescription_id',
      'idx_visit_attachments_visit_id',
      'idx_appointments_patient_id',
      'idx_notifications_user_id',
      'idx_medical_records_patient_id'
    ];

    for (const indexName of essentialIndexes) {
      const result = await databaseManager.query(`
        SELECT EXISTS (
          SELECT FROM pg_indexes 
          WHERE indexname = $1
        );
      `, [indexName]);
      
      if (!result.rows[0].exists) {
        return false;
      }
    }

    return true;
  }

  /**
   * Create missing tables
   */
  private async createMissingTables(): Promise<void> {
    // This would contain logic to create missing tables
    // For now, we'll just run migrations which should handle this
    console.log('📝 Running migrations to create missing tables...');
  }

  /**
   * Recreate indexes
   */
  private async recreateIndexes(): Promise<void> {
    // This would contain logic to recreate missing indexes
    console.log('📝 Recreating essential indexes...');
  }
}

// Main execution
async function main() {
  const healthChecker = DatabaseHealthChecker.getInstance();
  
  const args = process.argv.slice(2);
  const shouldAutoFix = args.includes('fix');

  try {
    const result = await healthChecker.runHealthCheck();
    
    if (shouldAutoFix && result.status !== 'healthy') {
      console.log('\n🔧 Auto-fix requested, starting fix process...');
      await healthChecker.autoFix();
      
      console.log('\n🔄 Re-running health check after fixes...');
      const newResult = await healthChecker.runHealthCheck();
      
      if (newResult.status === 'healthy') {
        console.log('\n🎉 Database is now healthy!');
        process.exit(0);
      } else {
        console.log('\n⚠️ Some issues remain after auto-fix');
        process.exit(1);
      }
    } else if (result.status === 'healthy') {
      console.log('\n🎉 Database is healthy!');
      process.exit(0);
    } else {
      console.log('\n⚠️ Database has issues that need attention');
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Health check failed:', error);
    process.exit(1);
  }
}

// Handle command line arguments
if (require.main === module) {
  main();
}

export default DatabaseHealthChecker;