import NodeCache from 'node-cache';

/**
 * Cache Service
 * จัดการ caching สำหรับ API responses และ database queries
 */

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  checkperiod?: number; // Check period in seconds
  useClones?: boolean;
}

class CacheService {
  private cache: NodeCache;
  private defaultTTL = 300; // 5 minutes default

  constructor(options: CacheOptions = {}) {
    this.cache = new NodeCache({
      stdTTL: options.ttl || this.defaultTTL,
      checkperiod: options.checkperiod || 60,
      useClones: options.useClones || false
    });

    this.setupEventListeners();
  }

  /**
   * Setup cache event listeners
   */
  private setupEventListeners(): void {
    this.cache.on('set', (key, value) => {
    });

    this.cache.on('del', (key, value) => {
    });

    this.cache.on('expired', (key, value) => {
    });

    this.cache.on('flush', () => {
    });
  }

  /**
   * Set cache value
   */
  public set(key: string, value: any, ttl?: number): boolean {
    return this.cache.set(key, value, ttl || this.defaultTTL);
  }

  /**
   * Get cache value
   */
  public get<T = any>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  /**
   * Get cache value or set if not exists
   */
  public getOrSet<T = any>(
    key: string, 
    fetchFunction: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== undefined) {
      return Promise.resolve(cached);
    }

    return fetchFunction().then(value => {
      this.set(key, value, ttl);
      return value;
    });
  }

  /**
   * Delete cache value
   */
  public del(key: string): number {
    return this.cache.del(key);
  }

  /**
   * Delete multiple cache values
   */
  public delMultiple(keys: string[]): number {
    return this.cache.del(keys);
  }

  /**
   * Check if key exists
   */
  public has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Get all keys
   */
  public keys(): string[] {
    return this.cache.keys();
  }

  /**
   * Get cache statistics
   */
  public getStats(): NodeCache.Stats {
    return this.cache.getStats();
  }

  /**
   * Flush all cache
   */
  public flushAll(): void {
    this.cache.flushAll();
  }

  /**
   * Cache API response
   */
  public cacheApiResponse(
    endpoint: string, 
    params: any, 
    response: any, 
    ttl?: number
  ): void {
    const key = this.generateApiKey(endpoint, params);
    this.set(key, response, ttl);
  }

  /**
   * Get cached API response
   */
  public getCachedApiResponse<T = any>(endpoint: string, params: any): T | undefined {
    const key = this.generateApiKey(endpoint, params);
    return this.get<T>(key);
  }

  /**
   * Generate cache key for API endpoint
   */
  private generateApiKey(endpoint: string, params: any): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `api:${endpoint}:${Buffer.from(paramString).toString('base64')}`;
  }

  /**
   * Cache database query result
   */
  public cacheQueryResult(
    query: string, 
    params: any[], 
    result: any, 
    ttl?: number
  ): void {
    const key = this.generateQueryKey(query, params);
    this.set(key, result, ttl);
  }

  /**
   * Get cached database query result
   */
  public getCachedQueryResult<T = any>(query: string, params: any[]): T | undefined {
    const key = this.generateQueryKey(query, params);
    return this.get<T>(key);
  }

  /**
   * Generate cache key for database query
   */
  private generateQueryKey(query: string, params: any[]): string {
    const paramString = params ? JSON.stringify(params) : '';
    const queryHash = Buffer.from(query).toString('base64').substring(0, 16);
    return `query:${queryHash}:${Buffer.from(paramString).toString('base64')}`;
  }

  /**
   * Cache user session data
   */
  public cacheUserSession(userId: string, sessionData: any, ttl?: number): void {
    const key = `session:${userId}`;
    this.set(key, sessionData, ttl || 3600); // 1 hour default for sessions
  }

  /**
   * Get cached user session
   */
  public getCachedUserSession<T = any>(userId: string): T | undefined {
    const key = `session:${userId}`;
    return this.get<T>(key);
  }

  /**
   * Invalidate user session
   */
  public invalidateUserSession(userId: string): void {
    const key = `session:${userId}`;
    this.del(key);
  }

  /**
   * Cache system settings
   */
  public cacheSystemSettings(settings: any, ttl?: number): void {
    this.set('system:settings', settings, ttl || 1800); // 30 minutes default
  }

  /**
   * Get cached system settings
   */
  public getCachedSystemSettings<T = any>(): T | undefined {
    return this.get<T>('system:settings');
  }

  /**
   * Invalidate system settings cache
   */
  public invalidateSystemSettings(): void {
    this.del('system:settings');
  }

  /**
   * Cache dashboard data
   */
  public cacheDashboardData(role: string, data: any, ttl?: number): void {
    const key = `dashboard:${role}`;
    this.set(key, data, ttl || 300); // 5 minutes default
  }

  /**
   * Get cached dashboard data
   */
  public getCachedDashboardData<T = any>(role: string): T | undefined {
    const key = `dashboard:${role}`;
    return this.get<T>(key);
  }

  /**
   * Invalidate dashboard cache
   */
  public invalidateDashboardCache(role?: string): void {
    if (role) {
      const key = `dashboard:${role}`;
      this.del(key);
    } else {
      // Invalidate all dashboard caches
      const keys = this.keys().filter(key => key.startsWith('dashboard:'));
      this.delMultiple(keys);
    }
  }

  /**
   * Cache patient data
   */
  public cachePatientData(patientId: string, data: any, ttl?: number): void {
    const key = `patient:${patientId}`;
    this.set(key, data, ttl || 600); // 10 minutes default
  }

  /**
   * Get cached patient data
   */
  public getCachedPatientData<T = any>(patientId: string): T | undefined {
    const key = `patient:${patientId}`;
    return this.get<T>(key);
  }

  /**
   * Invalidate patient data cache
   */
  public invalidatePatientData(patientId: string): void {
    const key = `patient:${patientId}`;
    this.del(key);
  }

  /**
   * Cache external requester data
   */
  public cacheExternalRequesterData(requesterId: string, data: any, ttl?: number): void {
    const key = `external_requester:${requesterId}`;
    this.set(key, data, ttl || 1800); // 30 minutes default
  }

  /**
   * Get cached external requester data
   */
  public getCachedExternalRequesterData<T = any>(requesterId: string): T | undefined {
    const key = `external_requester:${requesterId}`;
    return this.get<T>(key);
  }

  /**
   * Invalidate external requester data cache
   */
  public invalidateExternalRequesterData(requesterId: string): void {
    const key = `external_requester:${requesterId}`;
    this.del(key);
  }

  /**
   * Cache with pattern matching
   */
  public invalidateByPattern(pattern: string): void {
    const keys = this.keys().filter(key => key.includes(pattern));
    if (keys.length > 0) {
      this.delMultiple(keys);
    }
  }

  /**
   * Get cache memory usage
   */
  public getMemoryUsage(): { keys: number; hits: number; misses: number; ksize: number; vsize: number } {
    const stats = this.getStats();
    return {
      keys: stats.keys,
      hits: stats.hits,
      misses: stats.misses,
      ksize: stats.ksize,
      vsize: stats.vsize
    };
  }

  /**
   * Warm up cache with frequently accessed data
   */
  public async warmUpCache(): Promise<void> {
    // This would typically load frequently accessed data
    // For now, we'll just log that warming up is complete
  }
}

// Create singleton instance
export const cacheService = new CacheService({
  ttl: 300, // 5 minutes default
  checkperiod: 60, // Check for expired keys every minute
  useClones: false // Don't clone objects for better performance
});

export default cacheService;
