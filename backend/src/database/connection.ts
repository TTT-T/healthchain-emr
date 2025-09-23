import { Pool, PoolClient, QueryResult } from 'pg';
import config from '../config/config';

/**
 * Database Connection Manager with Auto-Creation
 */
export class DatabaseManager {
  private static instance: DatabaseManager;
  private pool: Pool | null = null;
  private isConnected = false;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Initialize database connection with auto-creation
   */
  public async initialize(): Promise<void> {
    try {
      // First, try to connect to the target database
      await this.connectToDatabase();
      
      //  the connection
      await this.Connection();
      
      this.isConnected = true;
    } catch (error) {
      // If connection fails, try to create the database
      await this.createDatabaseIfNotExists();
      
      // Try to connect again
      await this.connectToDatabase();
      await this.Connection();
      
      this.isConnected = true;
    }
  }

  /**
   * Connect to the target database
   */
  private async connectToDatabase(): Promise<void> {
    this.pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      database: config.database.database,
      user: config.database.username,
      password: config.database.password,
      max: config.database.maxConnections || 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
    });

    // Handle pool events
    this.pool.on('connect', (client) => {
    });

    this.pool.on('error', (err) => {
      console.error('❌ Unexpected error on idle client', err);
    });
  }

  /**
   * Create database if it doesn't exist
   */
  private async createDatabaseIfNotExists(): Promise<void> {
    // Connect to default 'postgres' database to create our target database
    const adminPool = new Pool({
      host: config.database.host,
      port: config.database.port,
      database: 'postgres', // Connect to default database
      user: config.database.username,
      password: config.database.password,
      max: 1, // Only need one connection for this operation
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
    });

    try {
      // Check if database exists
      const checkQuery = `
        SELECT 1 FROM pg_database WHERE datname = $1
      `;
      
      const result = await adminPool.query(checkQuery, [config.database.database]);
      
      if (result.rows.length === 0) {
        // Create database
        const createQuery = `CREATE DATABASE "${config.database.database}"`;
        await adminPool.query(createQuery);
      } else {
      }
      
    } catch (error) {
      console.error('❌ Error creating database:', error);
      throw error;
    } finally {
      await adminPool.end();
    }
  }

  /**
   *  database connection
   */
  private async Connection(): Promise<void> {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }

    try {
      const result = await this.pool.query('SELECT NOW() as current_time, version() as version');
    } catch (error) {
      console.error('❌ Database connection  failed:', error);
      throw error;
    }
  }

  /**
   * Get database pool
   */
  public getPool(): Pool {
    if (!this.pool) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.pool;
  }

  /**
   * Execute a query
   */
  public async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    if (!this.pool) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    const start = Date.now();
    try {
      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;
      return result;
    } catch (error) {
      console.error('❌ Query error:', error);
      throw error;
    }
  }

  /**
   * Get a client from the pool for transactions
   */
  public async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.pool.connect();
  }

  /**
   * Execute a transaction
   */
  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Close the connection pool
   */
  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.isConnected = false;
    }
  }

  /**
   * Check if database is connected
   */
  public isDatabaseConnected(): boolean {
    return this.isConnected && this.pool !== null;
  }

  /**
   * Get database information
   */
  public async getDatabaseInfo(): Promise<{
    name: string;
    version: string;
    size: string;
    connections: number;
    uptime: string;
  }> {
    if (!this.pool) {
      throw new Error('Database not initialized');
    }

    try {
      const [versionResult, sizeResult, connectionsResult, uptimeResult] = await Promise.all([
        this.pool.query('SELECT version() as version'),
        this.pool.query(`
          SELECT pg_size_pretty(pg_database_size(current_database())) as size
        `),
        this.pool.query(`
          SELECT count(*) as connections 
          FROM pg_stat_activity 
          WHERE datname = current_database()
        `),
        this.pool.query(`
          SELECT 
            EXTRACT(EPOCH FROM (now() - pg_postmaster_start_time())) as uptime_seconds
        `)
      ]);

      const uptimeSeconds = parseInt(uptimeResult.rows[0].uptime_seconds);
      const days = Math.floor(uptimeSeconds / 86400);
      const hours = Math.floor((uptimeSeconds % 86400) / 3600);
      const minutes = Math.floor((uptimeSeconds % 3600) / 60);

      return {
        name: config.database.database,
        version: versionResult.rows[0].version.split(' ')[0] + ' ' + versionResult.rows[0].version.split(' ')[1],
        size: sizeResult.rows[0].size,
        connections: parseInt(connectionsResult.rows[0].connections),
        uptime: `${days}d ${hours}h ${minutes}m`
      };
    } catch (error) {
      console.error('Error getting database info:', error);
      throw error;
    }
  }

  /**
   * Create database user if not exists
   */
  public async createDatabaseUserIfNotExists(): Promise<void> {
    const adminPool = new Pool({
      host: config.database.host,
      port: config.database.port,
      database: 'postgres',
      user: config.database.username,
      password: config.database.password,
      max: 1,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
    });

    try {
      // Check if user exists
      const checkUserQuery = `
        SELECT 1 FROM pg_roles WHERE rolname = $1
      `;
      
      const result = await adminPool.query(checkUserQuery, [config.database.username]);
      
      if (result.rows.length === 0) {
        // Create user with password
        const createUserQuery = `
          CREATE USER "${config.database.username}" WITH PASSWORD $1
        `;
        await adminPool.query(createUserQuery, [config.database.password]);
        
        // Grant privileges
        const grantQuery = `
          GRANT ALL PRIVILEGES ON DATABASE "${config.database.database}" TO "${config.database.username}"
        `;
        await adminPool.query(grantQuery);
      } else {
      }
      
    } catch (error) {
      console.error('❌ Error creating database user:', error);
      throw error;
    } finally {
      await adminPool.end();
    }
  }

  /**
   * Reset database (drop and recreate)
   */
  public async resetDatabase(): Promise<void> {
    const adminPool = new Pool({
      host: config.database.host,
      port: config.database.port,
      database: 'postgres',
      user: config.database.username,
      password: config.database.password,
      max: 1,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
    });

    try {
      // Close existing connections to the database
      await adminPool.query(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = $1 AND pid <> pg_backend_pid()
      `, [config.database.database]);

      // Drop database
      await adminPool.query(`DROP DATABASE IF EXISTS "${config.database.database}"`);
      
      // Recreate database
      await adminPool.query(`CREATE DATABASE "${config.database.database}"`);
    } catch (error) {
      console.error('❌ Error resetting database:', error);
      throw error;
    } finally {
      await adminPool.end();
    }
  }
}

// Export singleton instance
export const databaseManager = DatabaseManager.getInstance();
export default DatabaseManager;
