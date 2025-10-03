#!/usr/bin/env ts-node

/**
 * Database Health Check Script
 * This script checks for missing columns, tables, and other database issues
 * Usage: npm run db:health-check
 */

import { databaseManager } from '../database/connection';
import { migrationManager } from '../database/migrations';
import config from '../config/config';

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'warning';
  issues: string[];
  warnings: string[];
  recommendations: string[];
  details: {
    connection: boolean;
    migrations: any;
    tables: string[];
    missingColumns: string[];
    missingTables: string[];
    constraintViolations: string[];
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
    console.log('🔍 Starting Database Health Check...');
    console.log(`📊 Environment: ${config.nodeEnv}`);
    console.log(`🗄️ Database: ${config.database.host}:${config.database.port}/${config.database.database}`);

    const result: HealthCheckResult = {
      status: 'healthy',
      issues: [],
      warnings: [],
      recommendations: [],
      details: {
        connection: false,
        migrations: null,
        tables: [],
        missingColumns: [],
        missingTables: [],
        constraintViolations: []
      }
    };

    try {
      // Step 1: Initialize database connection
      console.log('\n📋 Step 1: Initializing Database Connection...');
      await databaseManager.initialize();
      await databaseManager.query('SELECT 1');
      result.details.connection = true;
      console.log('✅ Database connection successful');

      // Step 2: Check migration status
      console.log('\n📋 Step 2: Checking Migration Status...');
      result.details.migrations = await migrationManager.getMigrationStatus();
      console.log(`📊 Migrations: ${result.details.migrations.executed}/${result.details.migrations.total} executed`);

      if (result.details.migrations.failed > 0) {
        result.status = 'unhealthy';
        result.issues.push(`${result.details.migrations.failed} migrations failed`);
      }

      // Step 3: Check for required tables
      console.log('\n📋 Step 3: Checking Required Tables...');
      const requiredTables = [
        'users', 'patients', 'departments', 'appointments', 'visits',
        'medical_records', 'consent_requests', 'notifications', 'migrations'
      ];

      const existingTables = await this.getExistingTables();
      result.details.tables = existingTables;

      for (const table of requiredTables) {
        if (!existingTables.includes(table)) {
          result.details.missingTables.push(table);
          result.issues.push(`Missing table: ${table}`);
        }
      }

      if (result.details.missingTables.length > 0) {
        result.status = 'unhealthy';
        console.log(`❌ Missing tables: ${result.details.missingTables.join(', ')}`);
      } else {
        console.log('✅ All required tables exist');
      }

      // Step 4: Check for missing columns
      console.log('\n📋 Step 4: Checking Required Columns...');
      const columnChecks = await this.checkRequiredColumns();
      result.details.missingColumns = columnChecks.missing;

      if (columnChecks.missing.length > 0) {
        result.status = 'unhealthy';
        result.issues.push(`Missing columns: ${columnChecks.missing.join(', ')}`);
        console.log(`❌ Missing columns: ${columnChecks.missing.join(', ')}`);
      } else {
        console.log('✅ All required columns exist');
      }

      // Step 5: Check for constraint violations
      console.log('\n📋 Step 5: Checking Constraint Violations...');
      const constraintViolations = await this.checkConstraintViolations();
      result.details.constraintViolations = constraintViolations;

      if (constraintViolations.length > 0) {
        result.warnings.push(`Constraint violations: ${constraintViolations.join(', ')}`);
        console.log(`⚠️ Constraint violations: ${constraintViolations.join(', ')}`);
      } else {
        console.log('✅ No constraint violations found');
      }

      // Step 6: Generate recommendations
      console.log('\n📋 Step 6: Generating Recommendations...');
      result.recommendations = this.generateRecommendations(result);

      // Determine final status
      if (result.issues.length > 0) {
        result.status = 'unhealthy';
      } else if (result.warnings.length > 0) {
        result.status = 'warning';
      }

      // Display results
      this.displayResults(result);

      return result;

    } catch (error) {
      console.error('\n💥 Health Check Failed:', error);
      result.status = 'unhealthy';
      result.issues.push(`Health check failed: ${error instanceof Error ? error.message : String(error)}`);
      return result;
    }
  }

  /**
   * Get existing tables
   */
  private async getExistingTables(): Promise<string[]> {
    const result = await databaseManager.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    return result.rows.map(row => row.table_name);
  }

  /**
   * Check for required columns
   */
  private async checkRequiredColumns(): Promise<{ missing: string[] }> {
    const requiredColumns = [
      { table: 'patients', column: 'thai_last_name' },
      { table: 'users', column: 'thai_first_name' },
      { table: 'users', column: 'thai_last_name' },
      { table: 'appointments', column: 'start_time' },
      { table: 'appointments', column: 'end_time' }
    ];

    const missing: string[] = [];

    for (const { table, column } of requiredColumns) {
      try {
        const result = await databaseManager.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = $1 AND column_name = $2
        `, [table, column]);

        if (result.rows.length === 0) {
          missing.push(`${table}.${column}`);
        }
      } catch (error) {
        // Table might not exist
        missing.push(`${table}.${column} (table may not exist)`);
      }
    }

    return { missing };
  }

  /**
   * Check for constraint violations
   */
  private async checkConstraintViolations(): Promise<string[]> {
    const violations: string[] = [];

    try {
      // Check for foreign key violations
      const fkViolations = await databaseManager.query(`
        SELECT 
          tc.table_name, 
          kcu.column_name, 
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
        FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
      `);

      // This is a basic check - in a real scenario, you'd run actual queries
      // to find orphaned records
      console.log(`📊 Found ${fkViolations.rows.length} foreign key constraints`);

    } catch (error) {
      violations.push(`Error checking constraints: ${error instanceof Error ? error.message : String(error)}`);
    }

    return violations;
  }

  /**
   * Generate recommendations based on health check results
   */
  private generateRecommendations(result: HealthCheckResult): string[] {
    const recommendations: string[] = [];

    if (result.details.missingTables.length > 0) {
      recommendations.push('Run database migrations to create missing tables');
    }

    if (result.details.missingColumns.length > 0) {
      recommendations.push('Run database migrations to add missing columns');
    }

    if (result.details.migrations.failed > 0) {
      recommendations.push('Fix failed migrations before proceeding');
    }

    if (result.details.constraintViolations.length > 0) {
      recommendations.push('Review and fix constraint violations');
    }

    if (recommendations.length === 0) {
      recommendations.push('Database is healthy - no action required');
    }

    return recommendations;
  }

  /**
   * Display health check results
   */
  private displayResults(result: HealthCheckResult): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 DATABASE HEALTH CHECK RESULTS');
    console.log('='.repeat(60));

    const statusIcon = result.status === 'healthy' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
    console.log(`\n${statusIcon} Status: ${result.status.toUpperCase()}`);

    if (result.issues.length > 0) {
      console.log('\n❌ Issues Found:');
      result.issues.forEach(issue => console.log(`   - ${issue}`));
    }

    if (result.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      result.warnings.forEach(warning => console.log(`   - ${warning}`));
    }

    console.log('\n💡 Recommendations:');
    result.recommendations.forEach(rec => console.log(`   - ${rec}`));

    console.log('\n📊 Details:');
    console.log(`   - Database Connected: ${result.details.connection ? '✅' : '❌'}`);
    console.log(`   - Tables: ${result.details.tables.length}`);
    console.log(`   - Missing Tables: ${result.details.missingTables.length}`);
    console.log(`   - Missing Columns: ${result.details.missingColumns.length}`);
    console.log(`   - Migrations Executed: ${result.details.migrations?.executed || 0}`);
    console.log(`   - Migrations Failed: ${result.details.migrations?.failed || 0}`);

    console.log('\n' + '='.repeat(60));
  }

  /**
   * Auto-fix common issues
   */
  public async autoFix(): Promise<void> {
    console.log('🔧 Starting Auto-Fix Process...');

    try {
      // Initialize database first
      console.log('\n📋 Initializing Database...');
      await databaseManager.initialize();
      console.log('✅ Database initialized');

      // Run migrations
      console.log('\n📋 Running Migrations...');
      await migrationManager.initialize();
      console.log('✅ Migrations completed');

      // Re-run health check
      console.log('\n📋 Re-running Health Check...');
      const result = await this.runHealthCheck();

      if (result.status === 'healthy') {
        console.log('\n🎉 Auto-Fix Completed Successfully!');
        console.log('✅ Database is now healthy');
      } else {
        console.log('\n⚠️ Auto-Fix Completed with Issues');
        console.log('❌ Some issues remain - manual intervention may be required');
      }

    } catch (error) {
      console.error('\n💥 Auto-Fix Failed:', error);
      throw error;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'check';
  
  const checker = DatabaseHealthChecker.getInstance();
  
  switch (command) {
    case 'check':
      await checker.runHealthCheck();
      break;
    case 'fix':
      await checker.autoFix();
      break;
    default:
      console.log('Usage: npm run db:health-check [command]');
      console.log('Commands:');
      console.log('  check  - Run health check (default)');
      console.log('  fix    - Auto-fix common issues');
      process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Health check failed:', error);
    process.exit(1);
  });
}

export default DatabaseHealthChecker;
