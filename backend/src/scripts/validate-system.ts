#!/usr/bin/env node

/**
 * System Validation Script
 * Comprehensive validation of all cross-layer fixes
 */

import { config } from '../config/index';
import { databaseManager } from '../database/connection';
import { migrationManager } from '../database/migrations';
import axios from 'axios';

interface ValidationResult {
  category: string;
  test: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  duration: number;
}

class SystemValidator {
  private results: ValidationResult[] = [];
  private baseUrl = `http://localhost:${config.server.port}`;

  async runValidation(testName: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    try {
      await testFn();
      this.results.push({
        category: 'System',
        test: testName,
        status: 'PASS',
        message: 'Validation passed',
        duration: Date.now() - startTime
      });
      console.log(`✅ ${testName} - PASS (${Date.now() - startTime}ms)`);
    } catch (error) {
      this.results.push({
        category: 'System',
        test: testName,
        status: 'FAIL',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      });
      console.log(`❌ ${testName} - FAIL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async validateConfiguration(): Promise<void> {
    // Test configuration validation
    if (!config.jwt.secret || config.jwt.secret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters');
    }

    if (!config.jwt.refreshSecret || config.jwt.refreshSecret.length < 32) {
      throw new Error('JWT_REFRESH_SECRET must be at least 32 characters');
    }

    if (!config.database.host || !config.database.database) {
      throw new Error('Database configuration is incomplete');
    }

    if (config.cors.origins.length === 0) {
      throw new Error('CORS origins must be specified');
    }

    console.log('✅ Configuration validation passed');
  }

  async validateDatabase(): Promise<void> {
    // Test database connection
    await databaseManager.testConnection();

    // Test migration status
    const status = await migrationManager.getMigrationStatus();
    
    if (status.failed > 0) {
      throw new Error(`${status.failed} migrations have failed`);
    }

    // Check if required migrations are applied
    const requiredMigrations = ['001_medical_tables', '002_add_patient_fields', '004_fix_field_names'];
    const appliedMigrations = status.migrations
      .filter(m => m.success)
      .map(m => m.name);

    for (const migration of requiredMigrations) {
      if (!appliedMigrations.includes(migration)) {
        throw new Error(`Required migration ${migration} not applied`);
      }
    }

    console.log('✅ Database validation passed');
  }

  async validateAPIEndpoints(): Promise<void> {
    // Test health check endpoint
    const healthResponse = await axios.get(`${this.baseUrl}/health`);
    
    if (healthResponse.status !== 200) {
      throw new Error(`Health check returned status ${healthResponse.status}`);
    }

    const healthData = healthResponse.data;
    
    // Validate response format
    if (!healthData.data || !healthData.data.status) {
      throw new Error('Health check response format is incorrect');
    }

    if (healthData.data.status !== 'ok') {
      throw new Error(`Health check status is ${healthData.data.status}, expected 'ok'`);
    }

    // Test /healthz endpoint
    const healthzResponse = await axios.get(`${this.baseUrl}/healthz`);
    
    if (healthzResponse.status !== 200) {
      throw new Error(`Healthz check returned status ${healthzResponse.status}`);
    }

    console.log('✅ API endpoints validation passed');
  }

  async validateCORS(): Promise<void> {
    // Test CORS preflight
    const corsResponse = await axios.options(`${this.baseUrl}/api/medical/patients`, {
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Authorization'
      }
    });

    if (corsResponse.status !== 200) {
      throw new Error(`CORS preflight returned status ${corsResponse.status}`);
    }

    const allowOrigin = corsResponse.headers['access-control-allow-origin'];
    if (!allowOrigin) {
      throw new Error('CORS headers missing');
    }

    console.log('✅ CORS validation passed');
  }

  async validateErrorHandling(): Promise<void> {
    try {
      // Test 404 error handling
      await axios.get(`${this.baseUrl}/api/medical/patients/non-existent-id`);
    } catch (error: any) {
      if (error.response?.status === 401) {
        // Expected auth error, check response format
        const response = error.response.data;
        
        if (!response.data || response.data !== null) {
          throw new Error('Error response data should be null');
        }

        if (!response.error || !response.error.code || !response.error.message) {
          throw new Error('Error response missing required fields');
        }

        if (typeof response.statusCode !== 'number') {
          throw new Error('Error response missing statusCode');
        }

        console.log('✅ Error handling validation passed');
        return;
      }
      
      throw new Error(`Unexpected error response: ${error.response?.status}`);
    }
  }

  async validateResponseFormat(): Promise<void> {
    try {
      // Test invalid request to trigger validation error
      await axios.post(`${this.baseUrl}/api/medical/patients`, {
        invalidField: 'test'
      });
    } catch (error: any) {
      const response = error.response?.data;
      
      if (!response) {
        throw new Error('No response data received');
      }

      // Check standardized error response format
      if (typeof response.data !== 'object' || response.data !== null) {
        throw new Error('Error response data should be null');
      }

      if (!response.error || !response.error.code || !response.error.message) {
        throw new Error('Error response missing required fields');
      }

      if (typeof response.statusCode !== 'number') {
        throw new Error('Error response missing statusCode');
      }

      console.log('✅ Response format validation passed');
    }
  }

  async validateFieldMapping(): Promise<void> {
    // Test database field mapping by checking if the migration was applied
    const result = await databaseManager.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'patients' 
      AND column_name IN ('hospital_number', 'patient_number')
    `);

    const columns = result.rows.map(row => row.column_name);
    
    if (columns.includes('patient_number')) {
      throw new Error('Old field name "patient_number" still exists');
    }

    if (!columns.includes('hospital_number')) {
      throw new Error('New field name "hospital_number" not found');
    }

    console.log('✅ Field mapping validation passed');
  }

  async validatePerformance(): Promise<void> {
    const startTime = Date.now();
    
    // Test multiple health check requests
    const promises = Array(10).fill(null).map(() => 
      axios.get(`${this.baseUrl}/healthz`)
    );
    
    await Promise.all(promises);
    
    const duration = Date.now() - startTime;
    const avgResponseTime = duration / 10;
    
    if (avgResponseTime > 1000) {
      this.results.push({
        category: 'Performance',
        test: 'Response Time',
        status: 'WARN',
        message: `Average response time is ${avgResponseTime.toFixed(1)}ms (expected < 1000ms)`,
        duration: avgResponseTime
      });
      console.log(`⚠️ Performance warning: Average response time is ${avgResponseTime.toFixed(1)}ms`);
    } else {
      console.log(`✅ Performance validation passed: Average response time is ${avgResponseTime.toFixed(1)}ms`);
    }
  }

  async runAllValidations(): Promise<void> {
    console.log('🔍 Starting System Validation...\n');

    await this.runValidation('Configuration', () => this.validateConfiguration());
    await this.runValidation('Database', () => this.validateDatabase());
    await this.runValidation('API Endpoints', () => this.validateAPIEndpoints());
    await this.runValidation('CORS', () => this.validateCORS());
    await this.runValidation('Error Handling', () => this.validateErrorHandling());
    await this.runValidation('Response Format', () => this.validateResponseFormat());
    await this.runValidation('Field Mapping', () => this.validateFieldMapping());
    await this.runValidation('Performance', () => this.validatePerformance());

    this.printSummary();
  }

  printSummary(): void {
    console.log('\n📊 Validation Summary');
    console.log('====================');
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const warnings = this.results.filter(r => r.status === 'WARN').length;
    const total = this.results.length;
    
    console.log(`Total Validations: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Warnings: ${warnings}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Validations:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => {
          console.log(`  - ${r.test}: ${r.message}`);
        });
    }
    
    if (warnings > 0) {
      console.log('\n⚠️ Warnings:');
      this.results
        .filter(r => r.status === 'WARN')
        .forEach(r => {
          console.log(`  - ${r.test}: ${r.message}`);
        });
    }
    
    console.log('\n⏱️ Performance:');
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / total;
    console.log(`Average Validation Time: ${avgDuration.toFixed(1)}ms`);
    
    if (passed === total) {
      console.log('\n🎉 All validations passed! System is ready for production.');
    } else if (failed === 0) {
      console.log('\n✅ All critical validations passed! System is ready with warnings.');
    } else {
      console.log('\n❌ Some validations failed. Please fix the issues before proceeding.');
      process.exit(1);
    }
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  const validator = new SystemValidator();
  validator.runAllValidations().catch(console.error);
}

export { SystemValidator };
