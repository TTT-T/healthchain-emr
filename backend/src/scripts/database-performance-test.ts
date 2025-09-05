import { DatabaseManager } from '../database/connection';
import { performance } from 'perf_hooks';

interface QueryResult {
  query: string;
  duration: number;
  rowCount: number;
  error?: string;
}

interface PerformanceMetrics {
  timestamp: string;
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  slowQueries: QueryResult[];
  results: QueryResult[];
}

class DatabasePerformanceTester {
  private db: DatabaseManager;
  private results: PerformanceMetrics;

  constructor() {
    this.db = new DatabaseManager();
    this.results = {
      timestamp: new Date().toISOString(),
      totalQueries: 0,
      successfulQueries: 0,
      failedQueries: 0,
      averageDuration: 0,
      minDuration: Infinity,
      maxDuration: 0,
      slowQueries: [],
      results: []
    };
  }

  async initialize() {
    try {
      await this.db.initialize();
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async runQuery(query: string, description: string): Promise<QueryResult> {
    const startTime = performance.now();
    
    try {
      const result = await this.db.query(query);
      const endTime = performance.now();
      const duration = endTime - startTime;

      const queryResult: QueryResult = {
        query: description,
        duration,
        rowCount: result.rowCount || 0
      };

      this.results.results.push(queryResult);
      this.results.totalQueries++;
      this.results.successfulQueries++;

      // Update metrics
      this.updateMetrics(queryResult);

      console.log(`✅ ${description}: ${duration.toFixed(2)}ms (${queryResult.rowCount} rows)`);
      return queryResult;

    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      const queryResult: QueryResult = {
        query: description,
        duration,
        rowCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      this.results.results.push(queryResult);
      this.results.totalQueries++;
      this.results.failedQueries++;

      console.log(`❌ ${description}: ${duration.toFixed(2)}ms - ${queryResult.error}`);
      return queryResult;
    }
  }

  private updateMetrics(queryResult: QueryResult) {
    this.results.minDuration = Math.min(this.results.minDuration, queryResult.duration);
    this.results.maxDuration = Math.max(this.results.maxDuration, queryResult.duration);

    // Track slow queries (>100ms)
    if (queryResult.duration > 100) {
      this.results.slowQueries.push(queryResult);
    }
  }

  async runPerformanceTests() {
    console.log('🚀 Starting Database Performance Tests...');
    console.log('');

    // Test 1: Simple SELECT queries
    console.log('📊 Testing Simple SELECT Queries:');
    await this.runQuery(
      'SELECT COUNT(*) FROM users',
      'Count all users'
    );
    
    await this.runQuery(
      'SELECT * FROM users LIMIT 10',
      'Get first 10 users'
    );

    await this.runQuery(
      'SELECT * FROM users WHERE role = $1 LIMIT 5',
      'Get users by role (patient)',
      ['patient']
    );

    // Test 2: JOIN queries
    console.log('');
    console.log('🔗 Testing JOIN Queries:');
    await this.runQuery(
      `SELECT p.*, u.first_name, u.last_name 
       FROM patients p 
       JOIN users u ON p.user_id = u.id 
       LIMIT 10`,
      'Patients with user info (JOIN)'
    );

    await this.runQuery(
      `SELECT v.*, p.first_name, p.last_name, d.name as department_name
       FROM visits v
       JOIN patients p ON v.patient_id = p.id
       JOIN users u ON p.user_id = u.id
       JOIN departments d ON v.department_id = d.id
       LIMIT 10`,
      'Visits with patient and department info (Complex JOIN)'
    );

    // Test 3: Aggregation queries
    console.log('');
    console.log('📈 Testing Aggregation Queries:');
    await this.runQuery(
      'SELECT role, COUNT(*) as count FROM users GROUP BY role',
      'Count users by role'
    );

    await this.runQuery(
      `SELECT 
         DATE(created_at) as date, 
         COUNT(*) as visits_count 
       FROM visits 
       WHERE created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at) 
       ORDER BY date DESC`,
      'Daily visits for last 30 days'
    );

    // Test 4: Complex queries with subqueries
    console.log('');
    console.log('🧩 Testing Complex Queries:');
    await this.runQuery(
      `SELECT p.*, 
         (SELECT COUNT(*) FROM visits v WHERE v.patient_id = p.id) as visit_count,
         (SELECT COUNT(*) FROM medical_records mr WHERE mr.patient_id = p.id) as record_count
       FROM patients p 
       LIMIT 10`,
      'Patients with visit and record counts (Subqueries)'
    );

    // Test 5: Index performance tests
    console.log('');
    console.log('🔍 Testing Index Performance:');
    await this.runQuery(
      'SELECT * FROM users WHERE email = $1',
      'Find user by email (Index lookup)',
      ['test@example.com']
    );

    await this.runQuery(
      'SELECT * FROM visits WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 5',
      'Get recent visits by patient (Index + Sort)',
      ['1']
    );

    // Test 6: INSERT/UPDATE performance
    console.log('');
    console.log('✏️  Testing INSERT/UPDATE Performance:');
    await this.runQuery(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      'Insert audit log',
      ['1', 'test_action', 'test_resource', '1', '{"test": true}', '127.0.0.1']
    );

    await this.runQuery(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      'Update user last login',
      ['1']
    );

    // Test 7: Concurrent query simulation
    console.log('');
    console.log('⚡ Testing Concurrent Query Simulation:');
    const concurrentPromises = [];
    for (let i = 0; i < 5; i++) {
      concurrentPromises.push(
        this.runQuery(
          'SELECT * FROM users LIMIT 5',
          `Concurrent query ${i + 1}`
        )
      );
    }
    await Promise.all(concurrentPromises);

    // Generate final report
    this.generateReport();
  }

  private generateReport() {
    console.log('');
    console.log('📊 DATABASE PERFORMANCE REPORT');
    console.log('='.repeat(50));

    // Calculate average duration
    if (this.results.successfulQueries > 0) {
      this.results.averageDuration = this.results.results
        .filter(r => !r.error)
        .reduce((sum, r) => sum + r.duration, 0) / this.results.successfulQueries;
    }

    console.log(`📈 Total Queries: ${this.results.totalQueries}`);
    console.log(`✅ Successful: ${this.results.successfulQueries}`);
    console.log(`❌ Failed: ${this.results.failedQueries}`);
    console.log(`⚡ Average Duration: ${this.results.averageDuration.toFixed(2)}ms`);
    console.log(`🏃 Min Duration: ${this.results.minDuration.toFixed(2)}ms`);
    console.log(`🐌 Max Duration: ${this.results.maxDuration.toFixed(2)}ms`);
    console.log('');

    if (this.results.slowQueries.length > 0) {
      console.log('⚠️  SLOW QUERIES (>100ms):');
      this.results.slowQueries
        .sort((a, b) => b.duration - a.duration)
        .forEach((query, index) => {
          console.log(`${index + 1}. ${query.query}: ${query.duration.toFixed(2)}ms`);
        });
      console.log('');
    }

    console.log('🏆 PERFORMANCE RECOMMENDATIONS:');
    if (this.results.averageDuration > 50) {
      console.log('   ⚠️  Average query time is high. Consider optimizing queries or adding indexes.');
    }
    if (this.results.slowQueries.length > 0) {
      console.log('   ⚠️  Some queries are slow. Review and optimize slow queries.');
    }
    if (this.results.failedQueries > 0) {
      console.log('   ❌ Some queries failed. Check database schema and data integrity.');
    }
    if (this.results.averageDuration < 10 && this.results.failedQueries === 0) {
      console.log('   ✅ Excellent database performance!');
    }

    console.log('');
    console.log('📄 Full results saved to database-performance-results.json');
    
    // Save results to file
    require('fs').writeFileSync(
      'database-performance-results.json',
      JSON.stringify(this.results, null, 2)
    );
  }

  async cleanup() {
    try {
      await this.db.close();
      console.log('✅ Database connection closed');
    } catch (error) {
      console.error('❌ Error closing database:', error);
    }
  }
}

// Run the database performance tests
async function main() {
  const tester = new DatabasePerformanceTester();
  
  try {
    await tester.initialize();
    await tester.runPerformanceTests();
  } catch (error) {
    console.error('❌ Performance test failed:', error);
  } finally {
    await tester.cleanup();
  }
}

if (require.main === module) {
  main();
}

export { DatabasePerformanceTester };
