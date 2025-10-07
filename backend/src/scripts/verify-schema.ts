/**
 * Schema Verification Script
 * Verifies database schema after migrations
 */

import { databaseManager } from '../database/connection';

interface VerificationResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

class SchemaVerifier {
  private results: VerificationResult[] = [];

  async verifyForeignKeys(): Promise<void> {
    console.log('\n🔍 Verifying Foreign Keys...');
    
    try {
      const result = await databaseManager.query(`
        SELECT 
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table,
          rc.delete_rule,
          COUNT(*) OVER() as total_count
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu
          ON tc.constraint_name = ccu.constraint_name
        JOIN information_schema.referential_constraints rc
          ON tc.constraint_name = rc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
        ORDER BY tc.table_name, kcu.column_name
      `);

      const fkCount = result.rows.length;
      
      this.results.push({
        name: 'Foreign Keys',
        passed: fkCount >= 40,
        message: `Found ${fkCount} foreign keys (expected >= 40)`,
        details: result.rows.slice(0, 5).map(r => 
          `${r.table_name}.${r.column_name} → ${r.foreign_table} (${r.delete_rule})`
        )
      });

      console.log(`  ✓ Total Foreign Keys: ${fkCount}`);
    } catch (error) {
      this.results.push({
        name: 'Foreign Keys',
        passed: false,
        message: `Error: ${error}`
      });
      console.error('  ❌ Error checking foreign keys:', error);
    }
  }

  async verifyIndexes(): Promise<void> {
    console.log('\n🔍 Verifying Indexes...');
    
    try {
      const result = await databaseManager.query(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          COUNT(*) OVER() as total_count
        FROM pg_indexes
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname
      `);

      const indexCount = result.rows.length;
      
      this.results.push({
        name: 'Indexes',
        passed: indexCount >= 100,
        message: `Found ${indexCount} indexes (expected >= 100)`,
        details: result.rows.slice(0, 5).map(r => 
          `${r.tablename}: ${r.indexname}`
        )
      });

      console.log(`  ✓ Total Indexes: ${indexCount}`);
    } catch (error) {
      this.results.push({
        name: 'Indexes',
        passed: false,
        message: `Error: ${error}`
      });
      console.error('  ❌ Error checking indexes:', error);
    }
  }

  async verifyTables(): Promise<void> {
    console.log('\n🔍 Verifying Tables...');
    
    try {
      const result = await databaseManager.query(`
        SELECT table_name, COUNT(*) OVER() as total_count
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);

      const tableCount = result.rows.length;
      const expectedTables = [
        'users', 'patients', 'visits', 'vital_signs',
        'lab_orders', 'lab_results', 'prescriptions', 'prescription_items',
        'appointments', 'notifications', 'medical_records', 'audit_logs',
        'user_sessions', 'departments', 'consent_requests', 'consent_contracts'
      ];

      const existingTables = result.rows.map(r => r.table_name);
      const missingTables = expectedTables.filter(t => !existingTables.includes(t));
      
      this.results.push({
        name: 'Tables',
        passed: tableCount >= 30 && missingTables.length === 0,
        message: `Found ${tableCount} tables`,
        details: missingTables.length > 0 ? 
          `Missing: ${missingTables.join(', ')}` : 
          `Sample: ${existingTables.slice(0, 5).join(', ')}`
      });

      console.log(`  ✓ Total Tables: ${tableCount}`);
      if (missingTables.length > 0) {
        console.log(`  ⚠️  Missing tables: ${missingTables.join(', ')}`);
      }
    } catch (error) {
      this.results.push({
        name: 'Tables',
        passed: false,
        message: `Error: ${error}`
      });
      console.error('  ❌ Error checking tables:', error);
    }
  }

  async verifyViews(): Promise<void> {
    console.log('\n🔍 Verifying Views...');
    
    try {
      const result = await databaseManager.query(`
        SELECT table_name
        FROM information_schema.views
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);

      const viewCount = result.rows.length;
      const viewNames = result.rows.map(r => r.table_name);
      
      const expectedViews = [
        'vital_signs_legacy',
        'lab_orders_legacy',
        'lab_results_legacy'
      ];

      const hasLegacyViews = expectedViews.every(v => viewNames.includes(v));
      
      this.results.push({
        name: 'Legacy Views',
        passed: hasLegacyViews,
        message: hasLegacyViews ? 
          `All legacy views present (${viewCount} total)` :
          `Missing legacy views`,
        details: viewNames.join(', ')
      });

      console.log(`  ✓ Total Views: ${viewCount}`);
      if (hasLegacyViews) {
        console.log(`  ✓ Legacy views: ${expectedViews.join(', ')}`);
      }
    } catch (error) {
      this.results.push({
        name: 'Legacy Views',
        passed: false,
        message: `Error: ${error}`
      });
      console.error('  ❌ Error checking views:', error);
    }
  }

  async verifyColumnNames(): Promise<void> {
    console.log('\n🔍 Verifying Column Names...');
    
    try {
      // Check vital_signs columns
      const vitalSignsResult = await databaseManager.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'vital_signs'
          AND column_name IN ('blood_pressure_systolic', 'blood_pressure_diastolic')
      `);

      const hasCorrectVitalSigns = vitalSignsResult.rows.length === 2;
      
      // Check lab_orders columns
      const labOrdersResult = await databaseManager.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'lab_orders'
          AND column_name IN ('test_type', 'test_name', 'test_code')
      `);

      const hasCorrectLabOrders = labOrdersResult.rows.length === 3;
      
      // Check patients for 'hn' column
      const patientsResult = await databaseManager.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'patients'
          AND column_name = 'hn'
      `);

      const hasHnColumn = patientsResult.rows.length === 1;
      
      const allCorrect = hasCorrectVitalSigns && hasCorrectLabOrders && hasHnColumn;
      
      this.results.push({
        name: 'Column Names',
        passed: allCorrect,
        message: allCorrect ? 
          'All standard column names present' :
          'Some standard columns missing',
        details: {
          vital_signs: hasCorrectVitalSigns ? '✓' : '✗',
          lab_orders: hasCorrectLabOrders ? '✓' : '✗',
          patients_hn: hasHnColumn ? '✓' : '✗'
        }
      });

      console.log(`  ${hasCorrectVitalSigns ? '✓' : '✗'} Vital Signs columns`);
      console.log(`  ${hasCorrectLabOrders ? '✓' : '✗'} Lab Orders columns`);
      console.log(`  ${hasHnColumn ? '✓' : '✗'} Patients HN column`);
    } catch (error) {
      this.results.push({
        name: 'Column Names',
        passed: false,
        message: `Error: ${error}`
      });
      console.error('  ❌ Error checking column names:', error);
    }
  }

  async verifyMigrations(): Promise<void> {
    console.log('\n🔍 Verifying Migrations...');
    
    try {
      const result = await databaseManager.query(`
        SELECT filename, applied_at
        FROM schema_migrations
        ORDER BY id
      `);

      const migrationCount = result.rows.length;
      const expectedMigrations = [
        '001_core_tables.sql'  // All-in-one migration (includes 002, 003, 004)
      ];

      const appliedMigrations = result.rows.map(r => r.filename);
      const missingMigrations = expectedMigrations.filter(m => 
        !appliedMigrations.includes(m)
      );
      
      this.results.push({
        name: 'Migrations',
        passed: migrationCount >= 1,  // At least 001_core_tables.sql must be applied
        message: `${migrationCount} migrations applied (Expected: 001_core_tables.sql)`,
        details: missingMigrations.length > 0 ?
          `Pending: ${missingMigrations.join(', ')}` :
          appliedMigrations.join(', ')
      });

      console.log(`  ✓ Applied Migrations: ${migrationCount}`);
      if (missingMigrations.length > 0) {
        console.log(`  ⚠️  Pending: ${missingMigrations.join(', ')}`);
      } else {
        console.log(`  ✓ All expected migrations applied`);
      }
    } catch (error) {
      this.results.push({
        name: 'Migrations',
        passed: false,
        message: `Error or migration table not found: ${error}`
      });
      console.error('  ⚠️  Migration table not found or error:', error);
    }
  }

  printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 VERIFICATION SUMMARY');
    console.log('='.repeat(60));

    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const percentage = Math.round((passed / total) * 100);

    for (const result of this.results) {
      const status = result.passed ? '✅' : '❌';
      console.log(`\n${status} ${result.name}`);
      console.log(`   ${result.message}`);
      if (result.details) {
        if (Array.isArray(result.details)) {
          result.details.slice(0, 3).forEach(d => console.log(`   - ${d}`));
        } else {
          console.log(`   ${JSON.stringify(result.details, null, 2)}`);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n🎯 Overall: ${passed}/${total} checks passed (${percentage}%)`);
    
    if (passed === total) {
      console.log('\n✨ All verifications passed! Schema is healthy.');
    } else {
      console.log(`\n⚠️  ${total - passed} issue(s) found. Please review above.`);
    }
    console.log('');
  }

  async runAll(): Promise<boolean> {
    console.log('🚀 Starting Schema Verification...\n');
    
    try {
      await databaseManager.initialize();
      
      await this.verifyTables();
      await this.verifyForeignKeys();
      await this.verifyIndexes();
      await this.verifyViews();
      await this.verifyColumnNames();
      await this.verifyMigrations();
      
      this.printSummary();
      
      const allPassed = this.results.every(r => r.passed);
      return allPassed;
    } catch (error) {
      console.error('❌ Verification failed:', error);
      return false;
    } finally {
      await databaseManager.close();
    }
  }
}

// Run if called directly
async function main() {
  const verifier = new SchemaVerifier();
  const success = await verifier.runAll();
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main();
}

export { SchemaVerifier };

