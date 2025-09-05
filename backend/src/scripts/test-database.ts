#!/usr/bin/env node

import { databaseInitializer } from '../database/init';
import { databaseManager } from '../database/connection';
import { migrationManager } from '../database/migrations';
import config from '../config/config';

/**
 * Database Testing Script
 */
class DatabaseTester {
  private static instance: DatabaseTester;

  private constructor() {}

  public static getInstance(): DatabaseTester {
    if (!DatabaseTester.instance) {
      DatabaseTester.instance = new DatabaseTester();
    }
    return DatabaseTester.instance;
  }

  /**
   * Run all database tests
   */
  public async runTests(): Promise<void> {
    try {
      console.log('🧪 Starting database tests...');
      console.log('📋 Configuration:', {
        host: config.database.host,
        port: config.database.port,
        database: config.database.database,
        username: config.database.username,
        autoCreateDatabase: config.database.autoCreateDatabase,
        autoCreateUser: config.database.autoCreateUser
      });

      // Test 1: Database Connection
      await this.testDatabaseConnection();

      // Test 2: Database Initialization
      await this.testDatabaseInitialization();

      // Test 3: Migration System
      await this.testMigrationSystem();

      // Test 4: Basic Queries
      await this.testBasicQueries();

      // Test 5: Transaction Support
      await this.testTransactionSupport();

      // Test 6: Performance Test
      await this.testPerformance();

      // Test 7: Health Check
      await this.testHealthCheck();

      console.log('✅ All database tests passed successfully!');
      
    } catch (error) {
      console.error('❌ Database tests failed:', error);
      throw error;
    }
  }

  /**
   * Test database connection
   */
  private async testDatabaseConnection(): Promise<void> {
    console.log('\n🔌 Test 1: Database Connection');
    console.log('==============================');

    try {
      await databaseManager.initialize();
      console.log('✅ Database connection established');

      const dbInfo = await databaseManager.getDatabaseInfo();
      console.log('📊 Database Info:', {
        name: dbInfo.name,
        version: dbInfo.version,
        size: dbInfo.size,
        connections: dbInfo.connections,
        uptime: dbInfo.uptime
      });

    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  /**
   * Test database initialization
   */
  private async testDatabaseInitialization(): Promise<void> {
    console.log('\n🚀 Test 2: Database Initialization');
    console.log('===================================');

    try {
      await databaseInitializer.initialize();
      console.log('✅ Database initialization completed');

      const status = await databaseInitializer.getSystemStatus();
      console.log('📊 System Status:', {
        databaseConnected: status.database.connected,
        totalTables: status.tables.length,
        usersCount: status.counts.users,
        patientsCount: status.counts.patients,
        departmentsCount: status.counts.departments
      });

    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Test migration system
   */
  private async testMigrationSystem(): Promise<void> {
    console.log('\n🔄 Test 3: Migration System');
    console.log('============================');

    try {
      const migrationStatus = await migrationManager.getMigrationStatus();
      console.log('📋 Migration Status:', {
        total: migrationStatus.total,
        executed: migrationStatus.executed,
        failed: migrationStatus.failed
      });

      if (migrationStatus.failed > 0) {
        console.log('⚠️ Some migrations failed:');
        migrationStatus.migrations
          .filter(m => !m.success)
          .forEach(m => {
            console.log(`  - ${m.name}: ${m.error_message}`);
          });
      }

      console.log('✅ Migration system test completed');

    } catch (error) {
      console.error('❌ Migration system test failed:', error);
      throw error;
    }
  }

  /**
   * Test basic queries
   */
  private async testBasicQueries(): Promise<void> {
    console.log('\n📝 Test 4: Basic Queries');
    console.log('=========================');

    try {
      // Test 1: Simple SELECT
      const timeResult = await databaseManager.query('SELECT NOW() as current_time');
      console.log('✅ Simple SELECT query:', timeResult.rows[0].current_time);

      // Test 2: Table existence check
      const tablesResult = await databaseManager.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      console.log(`✅ Found ${tablesResult.rows.length} tables`);

      // Test 3: Data count queries
      const [usersCount, patientsCount, departmentsCount] = await Promise.all([
        databaseManager.query('SELECT COUNT(*) as count FROM users'),
        databaseManager.query('SELECT COUNT(*) as count FROM patients'),
        databaseManager.query('SELECT COUNT(*) as count FROM departments')
      ]);

      console.log('📊 Data counts:', {
        users: usersCount.rows[0].count,
        patients: patientsCount.rows[0].count,
        departments: departmentsCount.rows[0].count
      });

      console.log('✅ Basic queries test completed');

    } catch (error) {
      console.error('❌ Basic queries test failed:', error);
      throw error;
    }
  }

  /**
   * Test transaction support
   */
  private async testTransactionSupport(): Promise<void> {
    console.log('\n🔄 Test 5: Transaction Support');
    console.log('===============================');

    try {
      // Test successful transaction
      const result = await databaseManager.transaction(async (client) => {
        const insertResult = await client.query(`
          INSERT INTO audit_logs (action, resource, details) 
          VALUES ($1, $2, $3) 
          RETURNING id
        `, ['test_transaction', 'database_test', JSON.stringify({ test: true })]);
        
        return insertResult.rows[0].id;
      });

      console.log('✅ Successful transaction completed, ID:', result);

      // Test failed transaction (rollback)
      try {
        await databaseManager.transaction(async (client) => {
          await client.query(`
            INSERT INTO audit_logs (action, resource, details) 
            VALUES ($1, $2, $3)
          `, ['test_rollback', 'database_test', JSON.stringify({ test: true })]);
          
          // Force an error
          throw new Error('Intentional transaction failure');
        });
      } catch (error) {
        console.log('✅ Transaction rollback test completed (expected error)');
      }

      // Verify rollback worked (should not find the record)
      const rollbackCheck = await databaseManager.query(`
        SELECT COUNT(*) as count FROM audit_logs WHERE action = 'test_rollback'
      `);
      
      if (rollbackCheck.rows[0].count === '0') {
        console.log('✅ Transaction rollback verified');
      } else {
        throw new Error('Transaction rollback failed');
      }

      console.log('✅ Transaction support test completed');

    } catch (error) {
      console.error('❌ Transaction support test failed:', error);
      throw error;
    }
  }

  /**
   * Test performance
   */
  private async testPerformance(): Promise<void> {
    console.log('\n⚡ Test 6: Performance Test');
    console.log('===========================');

    try {
      const iterations = 100;
      const startTime = Date.now();

      // Run multiple queries
      const promises = [];
      for (let i = 0; i < iterations; i++) {
        promises.push(databaseManager.query('SELECT $1 as iteration', [i]));
      }

      await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / iterations;

      console.log('📊 Performance Results:', {
        iterations,
        totalTime: `${totalTime}ms`,
        averageTime: `${avgTime.toFixed(2)}ms`,
        queriesPerSecond: Math.round(1000 / avgTime)
      });

      if (avgTime < 10) {
        console.log('✅ Performance test passed (excellent)');
      } else if (avgTime < 50) {
        console.log('✅ Performance test passed (good)');
      } else {
        console.log('⚠️ Performance test passed (acceptable)');
      }

    } catch (error) {
      console.error('❌ Performance test failed:', error);
      throw error;
    }
  }

  /**
   * Test health check
   */
  private async testHealthCheck(): Promise<void> {
    console.log('\n🏥 Test 7: Health Check');
    console.log('========================');

    try {
      const health = await databaseInitializer.healthCheck();
      
      console.log('📊 Health Check Results:', {
        status: health.status,
        database: health.database ? '✅ Connected' : '❌ Disconnected',
        migrations: health.migrations ? '✅ OK' : '❌ Failed',
        responseTime: `${health.uptime}ms`,
        timestamp: health.timestamp
      });

      if (health.status === 'healthy') {
        console.log('✅ Health check passed');
      } else {
        throw new Error('Health check failed');
      }

    } catch (error) {
      console.error('❌ Health check failed:', error);
      throw error;
    }
  }

  /**
   * Clean up test data
   */
  public async cleanup(): Promise<void> {
    try {
      console.log('\n🧹 Cleaning up test data...');
      
      await databaseManager.query(`
        DELETE FROM audit_logs 
        WHERE action IN ('test_transaction', 'test_rollback')
      `);
      
      console.log('✅ Test data cleanup completed');
      
    } catch (error) {
      console.error('❌ Test data cleanup failed:', error);
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = DatabaseTester.getInstance();
  
  tester.runTests()
    .then(async () => {
      await tester.cleanup();
      console.log('\n🎉 All database tests completed successfully!');
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('\n❌ Database tests failed:', error);
      await tester.cleanup();
      process.exit(1);
    });
}

export default DatabaseTester;
