import { databaseManager } from '../database/connection';
import { cacheService } from './cacheService';

/**
 * Query Optimization Service
 * จัดการการปรับปรุงประสิทธิภาพของ database queries
 */

interface QueryStats {
  query: string;
  executionTime: number;
  rowCount: number;
  timestamp: Date;
}

interface IndexSuggestion {
  table: string;
  columns: string[];
  type: 'btree' | 'hash' | 'gin' | 'gist';
  reason: string;
  estimatedImprovement: string;
}

class QueryOptimizationService {
  private queryStats: QueryStats[] = [];
  private slowQueryThreshold = 1000; // 1 second
  private maxStatsHistory = 1000;

  /**
   * Execute optimized query with caching
   */
  public async executeOptimizedQuery<T = any>(
    query: string,
    params: any[] = [],
    cacheKey?: string,
    cacheTTL: number = 300
  ): Promise<T[]> {
    const startTime = Date.now();

    try {
      // Check cache first if cacheKey is provided
      if (cacheKey) {
        const cached = cacheService.getCachedQueryResult<T[]>(query, params);
        if (cached) {
          return cached;
        }
      }

      // Execute query
      const result = await databaseManager.query(query, params);
      const executionTime = Date.now() - startTime;

      // Log slow queries
      if (executionTime > this.slowQueryThreshold) {
        console.warn(`🐌 Slow query detected (${executionTime}ms): ${query.substring(0, 100)}...`);
        this.recordQueryStats(query, executionTime, result.rows.length);
      }

      // Cache result if cacheKey is provided
      if (cacheKey && result.rows.length > 0) {
        cacheService.cacheQueryResult(query, params, result.rows, cacheTTL);
      }

      return result.rows;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ Query failed (${executionTime}ms): ${query.substring(0, 100)}...`, error);
      throw error;
    }
  }

  /**
   * Record query statistics
   */
  private recordQueryStats(query: string, executionTime: number, rowCount: number): void {
    this.queryStats.push({
      query: query.substring(0, 200), // Truncate for storage
      executionTime,
      rowCount,
      timestamp: new Date()
    });

    // Keep only recent stats
    if (this.queryStats.length > this.maxStatsHistory) {
      this.queryStats = this.queryStats.slice(-this.maxStatsHistory);
    }
  }

  /**
   * Get slow queries report
   */
  public getSlowQueriesReport(limit: number = 10): QueryStats[] {
    return this.queryStats
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, limit);
  }

  /**
   * Analyze query performance
   */
  public async analyzeQueryPerformance(query: string): Promise<{
    explain: any[];
    suggestions: IndexSuggestion[];
  }> {
    try {
      // Get query execution plan
      const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
      const explainResult = await databaseManager.query(explainQuery);
      
      const explain = explainResult.rows[0]['QUERY PLAN'];
      
      // Generate index suggestions based on explain plan
      const suggestions = this.generateIndexSuggestions(query, explain);
      
      return { explain, suggestions };
    } catch (error) {
      console.error('Error analyzing query performance:', error);
      throw error;
    }
  }

  /**
   * Generate index suggestions
   */
  private generateIndexSuggestions(query: string, explainPlan: any[]): IndexSuggestion[] {
    const suggestions: IndexSuggestion[] = [];
    
    // This is a simplified version - in practice, you'd analyze the explain plan
    // to identify sequential scans, missing indexes, etc.
    
    // Example suggestions based on common patterns
    if (query.toLowerCase().includes('where') && query.toLowerCase().includes('created_at')) {
      suggestions.push({
        table: 'users',
        columns: ['created_at'],
        type: 'btree',
        reason: 'Frequent filtering by created_at',
        estimatedImprovement: '50-80%'
      });
    }

    if (query.toLowerCase().includes('where') && query.toLowerCase().includes('status')) {
      suggestions.push({
        table: 'data_requests',
        columns: ['status'],
        type: 'btree',
        reason: 'Frequent filtering by status',
        estimatedImprovement: '60-90%'
      });
    }

    return suggestions;
  }

  /**
   * Get database performance metrics
   */
  public async getDatabasePerformanceMetrics(): Promise<{
    connectionStats: any;
    tableStats: any;
    indexStats: any;
    slowQueries: QueryStats[];
  }> {
    try {
      // Get connection statistics
      const connectionStats = await this.executeOptimizedQuery(`
        SELECT 
          state,
          COUNT(*) as count,
          AVG(EXTRACT(EPOCH FROM (now() - state_change))) as avg_duration
        FROM pg_stat_activity 
        WHERE state IS NOT NULL
        GROUP BY state
      `);

      // Get table statistics
      const tableStats = await this.executeOptimizedQuery(`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC
        LIMIT 20
      `);

      // Get index statistics
      const indexStats = await this.executeOptimizedQuery(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_tup_read,
          idx_tup_fetch,
          idx_scan,
          pg_size_pretty(pg_relation_size(indexrelid)) as index_size
        FROM pg_stat_user_indexes
        ORDER BY idx_scan DESC
        LIMIT 20
      `);

      return {
        connectionStats,
        tableStats,
        indexStats,
        slowQueries: this.getSlowQueriesReport(10)
      };
    } catch (error) {
      console.error('Error getting database performance metrics:', error);
      throw error;
    }
  }

  /**
   * Optimize database indexes
   */
  public async optimizeIndexes(): Promise<{
    created: string[];
    dropped: string[];
    analyzed: string[];
  }> {
    const result = {
      created: [] as string[],
      dropped: [] as string[],
      analyzed: [] as string[]
    };

    try {
      // Find unused indexes
      const unusedIndexes = await this.executeOptimizedQuery(`
        SELECT 
          schemaname,
          tablename,
          indexname
        FROM pg_stat_user_indexes
        WHERE idx_scan = 0
        AND indexname NOT LIKE '%_pkey'
        AND indexname NOT LIKE '%_unique_%'
      `);

      // Drop unused indexes (be careful with this in production!)
      for (const index of unusedIndexes) {
        const dropQuery = `DROP INDEX IF EXISTS ${index.schemaname}.${index.indexname}`;
        try {
          await databaseManager.query(dropQuery);
          result.dropped.push(`${index.schemaname}.${index.indexname}`);
        } catch (error) {
          console.error(`Error dropping index ${index.indexname}:`, error);
        }
      }

      // Analyze tables
      const tables = await this.executeOptimizedQuery(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
      `);

      for (const table of tables) {
        try {
          await databaseManager.query(`ANALYZE ${table.tablename}`);
          result.analyzed.push(table.tablename);
        } catch (error) {
          console.error(`Error analyzing table ${table.tablename}:`, error);
        }
      }

      return result;
    } catch (error) {
      console.error('Error optimizing indexes:', error);
      throw error;
    }
  }

  /**
   * Get query cache hit ratio
   */
  public getCacheHitRatio(): {
    hits: number;
    misses: number;
    ratio: number;
  } {
    const stats = cacheService.getStats();
    const total = stats.hits + stats.misses;
    const ratio = total > 0 ? (stats.hits / total) * 100 : 0;

    return {
      hits: stats.hits,
      misses: stats.misses,
      ratio: Math.round(ratio * 100) / 100
    };
  }

  /**
   * Clear query statistics
   */
  public clearQueryStats(): void {
    this.queryStats = [];
  }

  /**
   * Set slow query threshold
   */
  public setSlowQueryThreshold(threshold: number): void {
    this.slowQueryThreshold = threshold;
  }

  /**
   * Get query optimization recommendations
   */
  public async getOptimizationRecommendations(): Promise<{
    slowQueries: QueryStats[];
    missingIndexes: IndexSuggestion[];
    cacheStats: any;
    recommendations: string[];
  }> {
    const slowQueries = this.getSlowQueriesReport(5);
    const cacheStats = this.getCacheHitRatio();
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    if (cacheStats.ratio < 80) {
      recommendations.push('Consider increasing cache TTL for frequently accessed data');
    }
    
    if (slowQueries.length > 0) {
      recommendations.push('Review and optimize slow queries');
    }
    
    if (slowQueries.some(q => q.executionTime > 5000)) {
      recommendations.push('Some queries are extremely slow (>5s) - immediate attention required');
    }

    return {
      slowQueries,
      missingIndexes: [], // Would be populated by index analysis
      cacheStats,
      recommendations
    };
  }
}

// Create singleton instance
export const queryOptimizationService = new QueryOptimizationService();
export default queryOptimizationService;
