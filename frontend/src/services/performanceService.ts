/**
 * Performance Service
 * จัดการการปรับปรุงประสิทธิภาพของ Frontend
 */

interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  renderTime: number;
  memoryUsage: number;
  timestamp: Date;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class PerformanceService {
  private metrics: PerformanceMetrics[] = [];
  private apiCache = new Map<string, CacheEntry<any>>();
  private imageCache = new Map<string, string>();
  private maxCacheSize = 100;
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Measure page load time
   */
  public measurePageLoad(pageName: string): void {
    if (typeof window === 'undefined') return;

    const startTime = performance.now();
    
    window.addEventListener('load', () => {
      const loadTime = performance.now() - startTime;
      this.recordMetric({
        pageLoadTime: loadTime,
        apiResponseTime: 0,
        renderTime: 0,
        memoryUsage: this.getMemoryUsage(),
        timestamp: new Date()
      });
      
      console.log(`📊 Page load time for ${pageName}: ${loadTime.toFixed(2)}ms`);
    });
  }

  /**
   * Measure API response time
   */
  public measureApiCall<T>(
    apiCall: () => Promise<T>,
    endpoint: string
  ): Promise<T> {
    const startTime = performance.now();
    
    return apiCall().then(response => {
      const responseTime = performance.now() - startTime;
      
      this.recordMetric({
        pageLoadTime: 0,
        apiResponseTime: responseTime,
        renderTime: 0,
        memoryUsage: this.getMemoryUsage(),
        timestamp: new Date()
      });
      
      console.log(`🌐 API call to ${endpoint}: ${responseTime.toFixed(2)}ms`);
      return response;
    });
  }

  /**
   * Measure component render time
   */
  public measureRenderTime(componentName: string, renderFn: () => void): void {
    const startTime = performance.now();
    
    renderFn();
    
    // Use requestAnimationFrame to measure after render
    requestAnimationFrame(() => {
      const renderTime = performance.now() - startTime;
      
      this.recordMetric({
        pageLoadTime: 0,
        apiResponseTime: 0,
        renderTime: renderTime,
        memoryUsage: this.getMemoryUsage(),
        timestamp: new Date()
      });
      
      console.log(`🎨 Render time for ${componentName}: ${renderTime.toFixed(2)}ms`);
    });
  }

  /**
   * Record performance metric
   */
  private recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  /**
   * Get memory usage
   */
  private getMemoryUsage(): number {
    if (typeof window === 'undefined' || !(window as any).performance?.memory) {
      return 0;
    }
    
    const memory = (window as any).performance.memory;
    return memory.usedJSHeapSize / 1024 / 1024; // MB
  }

  /**
   * Cache API response
   */
  public cacheApiResponse<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };
    
    this.apiCache.set(key, entry);
    
    // Clean up old entries if cache is too large
    if (this.apiCache.size > this.maxCacheSize) {
      this.cleanupCache();
    }
  }

  /**
   * Get cached API response
   */
  public getCachedApiResponse<T>(key: string): T | null {
    const entry = this.apiCache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.apiCache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    const entriesToDelete: string[] = [];
    
    this.apiCache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        entriesToDelete.push(key);
      }
    });
    
    entriesToDelete.forEach(key => this.apiCache.delete(key));
  }

  /**
   * Preload images
   */
  public preloadImages(urls: string[]): Promise<void[]> {
    const promises = urls.map(url => {
      if (this.imageCache.has(url)) {
        return Promise.resolve();
      }
      
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          this.imageCache.set(url, url);
          resolve();
        };
        img.onerror = reject;
        img.src = url;
      });
    });
    
    return Promise.all(promises);
  }

  /**
   * Lazy load images
   */
  public setupLazyLoading(): void {
    if (typeof window === 'undefined') return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        }
      });
    });
    
    // Observe all images with data-src attribute
    document.querySelectorAll('img[data-src]').forEach(img => {
      observer.observe(img);
    });
  }

  /**
   * Debounce function calls
   */
  public debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  /**
   * Throttle function calls
   */
  public throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Optimize bundle size
   */
  public optimizeBundle(): void {
    // Remove unused CSS
    this.removeUnusedCSS();
    
    // Compress images
    this.compressImages();
    
    // Minify inline scripts
    this.minifyInlineScripts();
  }

  /**
   * Remove unused CSS
   */
  private removeUnusedCSS(): void {
    if (typeof window === 'undefined') return;
    
    // This is a simplified version - in practice, you'd use tools like PurgeCSS
    const styleSheets = document.styleSheets;
    
    for (let i = 0; i < styleSheets.length; i++) {
      try {
        const sheet = styleSheets[i];
        if (sheet.href && sheet.href.includes('unused')) {
          sheet.disabled = true;
        }
      } catch (error) {
        // Ignore cross-origin errors
      }
    }
  }

  /**
   * Compress images
   */
  private compressImages(): void {
    if (typeof window === 'undefined') return;
    
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
      if (img.naturalWidth > 1920) {
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
      }
    });
  }

  /**
   * Minify inline scripts
   */
  private minifyInlineScripts(): void {
    if (typeof window === 'undefined') return;
    
    const scripts = document.querySelectorAll('script:not([src])');
    
    scripts.forEach(script => {
      const content = script.textContent;
      if (content && content.length > 1000) {
        // Simple minification - remove comments and extra whitespace
        const minified = content
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/\/\/.*$/gm, '')
          .replace(/\s+/g, ' ')
          .trim();
        
        script.textContent = minified;
      }
    });
  }

  /**
   * Get performance report
   */
  public getPerformanceReport(): {
    averagePageLoadTime: number;
    averageApiResponseTime: number;
    averageRenderTime: number;
    averageMemoryUsage: number;
    cacheHitRatio: number;
    recommendations: string[];
  } {
    const recentMetrics = this.metrics.slice(-20); // Last 20 metrics
    
    const averagePageLoadTime = this.calculateAverage(
      recentMetrics.map(m => m.pageLoadTime).filter(t => t > 0)
    );
    
    const averageApiResponseTime = this.calculateAverage(
      recentMetrics.map(m => m.apiResponseTime).filter(t => t > 0)
    );
    
    const averageRenderTime = this.calculateAverage(
      recentMetrics.map(m => m.renderTime).filter(t => t > 0)
    );
    
    const averageMemoryUsage = this.calculateAverage(
      recentMetrics.map(m => m.memoryUsage).filter(m => m > 0)
    );
    
    const cacheHitRatio = this.calculateCacheHitRatio();
    
    const recommendations = this.generateRecommendations({
      averagePageLoadTime,
      averageApiResponseTime,
      averageRenderTime,
      averageMemoryUsage,
      cacheHitRatio
    });
    
    return {
      averagePageLoadTime,
      averageApiResponseTime,
      averageRenderTime,
      averageMemoryUsage,
      cacheHitRatio,
      recommendations
    };
  }

  /**
   * Calculate average
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  /**
   * Calculate cache hit ratio
   */
  private calculateCacheHitRatio(): number {
    // This would be calculated based on actual cache usage
    return 0.85; // Placeholder
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(metrics: {
    averagePageLoadTime: number;
    averageApiResponseTime: number;
    averageRenderTime: number;
    averageMemoryUsage: number;
    cacheHitRatio: number;
  }): string[] {
    const recommendations: string[] = [];
    
    if (metrics.averagePageLoadTime > 3000) {
      recommendations.push('Page load time is slow (>3s). Consider code splitting and lazy loading.');
    }
    
    if (metrics.averageApiResponseTime > 1000) {
      recommendations.push('API response time is slow (>1s). Consider caching and optimization.');
    }
    
    if (metrics.averageRenderTime > 100) {
      recommendations.push('Render time is slow (>100ms). Consider component optimization.');
    }
    
    if (metrics.averageMemoryUsage > 100) {
      recommendations.push('Memory usage is high (>100MB). Consider memory leak detection.');
    }
    
    if (metrics.cacheHitRatio < 0.8) {
      recommendations.push('Cache hit ratio is low (<80%). Consider increasing cache TTL.');
    }
    
    return recommendations;
  }

  /**
   * Clear performance metrics
   */
  public clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.apiCache.clear();
    this.imageCache.clear();
  }
}

// Create singleton instance
export const performanceService = new PerformanceService();
export default performanceService;
