import { databaseManager } from './connection';
import { migrationManager } from './migrations';
import config from '../config/config';

/**
 * Database Initialization System
 */
export class DatabaseInitializer {
  private static instance: DatabaseInitializer;

  private constructor() {}

  public static getInstance(): DatabaseInitializer {
    if (!DatabaseInitializer.instance) {
      DatabaseInitializer.instance = new DatabaseInitializer();
    }
    return DatabaseInitializer.instance;
  }

  /**
   * Initialize database system
   */
  public async initialize(): Promise<void> {
    try {
      console.log('🚀 Starting database initialization...');
      console.log('📋 Configuration:', {
        host: config.database.host,
        port: config.database.port,
        database: config.database.database,
        username: config.database.username,
        autoCreateDatabase: config.database.autoCreateDatabase,
        autoCreateUser: config.database.autoCreateUser
      });

      // Step 1: Initialize database connection
      console.log('🔌 Step 1: Initializing database connection...');
      await databaseManager.initialize();

      // Step 2: Create user if needed
      if (config.database.autoCreateUser) {
        console.log('👤 Step 2: Creating database user if needed...');
        await databaseManager.createDatabaseUserIfNotExists();
      }

      // Step 3: Run migrations
      console.log('🔄 Step 3: Running database migrations...');
      await migrationManager.initialize();

      // Step 4: Verify system
      console.log('✅ Step 4: Verifying database system...');
      await this.verifySystem();

      console.log('🎉 Database initialization completed successfully!');
      
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Verify database system
   */
  private async verifySystem(): Promise<void> {
    try {
      // Get database info
      const dbInfo = await databaseManager.getDatabaseInfo();
      console.log('📊 Database Information:', dbInfo);

      // Get migration status
      const migrationStatus = await migrationManager.getMigrationStatus();
      console.log('📋 Migration Status:', {
        total: migrationStatus.total,
        executed: migrationStatus.executed,
        failed: migrationStatus.failed
      });

      // Test basic queries
      await this.testBasicQueries();

      console.log('✅ Database system verification completed');
      
    } catch (error) {
      console.error('❌ Database system verification failed:', error);
      throw error;
    }
  }

  /**
   * Test basic database queries
   */
  private async testBasicQueries(): Promise<void> {
    try {
      // Test 1: Check if tables exist
      const tablesResult = await databaseManager.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);

      const tableNames = tablesResult.rows.map(row => row.table_name);
      console.log('📋 Available tables:', tableNames);

      // Test 2: Check if users table has data
      const usersCount = await databaseManager.query('SELECT COUNT(*) as count FROM users');
      console.log('👥 Users count:', usersCount.rows[0].count);

      // Test 3: Check if patients table exists
      const patientsCount = await databaseManager.query('SELECT COUNT(*) as count FROM patients');
      console.log('🏥 Patients count:', patientsCount.rows[0].count);

      // Test 4: Check if departments table has data
      const departmentsCount = await databaseManager.query('SELECT COUNT(*) as count FROM departments');
      console.log('🏢 Departments count:', departmentsCount.rows[0].count);

    } catch (error) {
      console.error('❌ Basic query test failed:', error);
      throw error;
    }
  }

  /**
   * Reset database (for development only)
   */
  public async resetDatabase(): Promise<void> {
    if (config.nodeEnv === 'production') {
      throw new Error('Database reset is not allowed in production environment');
    }

    try {
      console.log('⚠️ Resetting database (development only)...');
      
      // Reset database
      await databaseManager.resetDatabase();
      
      // Reinitialize
      await this.initialize();
      
      console.log('✅ Database reset completed');
      
    } catch (error) {
      console.error('❌ Database reset failed:', error);
      throw error;
    }
  }

  /**
   * Get system status
   */
  public async getSystemStatus(): Promise<{
    database: {
      connected: boolean;
      info: any;
    };
    migrations: any;
    tables: string[];
    counts: {
      users: number;
      patients: number;
      departments: number;
    };
  }> {
    try {
      const dbInfo = await databaseManager.getDatabaseInfo();
      const migrationStatus = await migrationManager.getMigrationStatus();
      
      const tablesResult = await databaseManager.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      
      const tableNames = tablesResult.rows.map(row => row.table_name);
      
      const [usersCount, patientsCount, departmentsCount] = await Promise.all([
        databaseManager.query('SELECT COUNT(*) as count FROM users'),
        databaseManager.query('SELECT COUNT(*) as count FROM patients'),
        databaseManager.query('SELECT COUNT(*) as count FROM departments')
      ]);

      return {
        database: {
          connected: databaseManager.isDatabaseConnected(),
          info: dbInfo
        },
        migrations: migrationStatus,
        tables: tableNames,
        counts: {
          users: parseInt(usersCount.rows[0].count),
          patients: parseInt(patientsCount.rows[0].count),
          departments: parseInt(departmentsCount.rows[0].count)
        }
      };
      
    } catch (error) {
      console.error('❌ Error getting system status:', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    database: boolean;
    migrations: boolean;
    timestamp: string;
    uptime: number;
  }> {
    try {
      const startTime = Date.now();
      
      // Test database connection
      await databaseManager.query('SELECT 1');
      const database = true;
      
      // Test migrations
      const migrationStatus = await migrationManager.getMigrationStatus();
      const migrations = migrationStatus.failed === 0;
      
      const status = database && migrations ? 'healthy' : 'unhealthy';
      
      return {
        status,
        database,
        migrations,
        timestamp: new Date().toISOString(),
        uptime: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return {
        status: 'unhealthy',
        database: false,
        migrations: false,
        timestamp: new Date().toISOString(),
        uptime: 0
      };
    }
  }
}

// Export singleton instance
export const databaseInitializer = DatabaseInitializer.getInstance();
export default DatabaseInitializer;
