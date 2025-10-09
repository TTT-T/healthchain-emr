import { databaseManager } from '../database/connection';
import { logger } from '../utils/logger';

/**
 * Hospital Number (HN) Generation Service
 * Centralized service for generating unique hospital numbers
 * Format: HN + YY + 6-digit sequential number (e.g., HN250001, HN250002, ...)
 */

export interface HnGenerationResult {
  hn: string;
  year: string;
  sequenceNumber: number;
  generatedAt: Date;
}

export class HnGenerationService {
  private static readonly MAX_RETRIES = 5;
  private static readonly LOCK_TIMEOUT = 5000; // 5 seconds

  /**
   * Generate a unique hospital number
   * @param year Optional year (defaults to current year)
   * @returns Promise<HnGenerationResult>
   */
  static async generateHospitalNumber(year?: number): Promise<HnGenerationResult> {
    const targetYear = year || new Date().getFullYear();
    const yearSuffix = targetYear.toString().slice(-2);
    
    logger.info('Generating hospital number', { year: targetYear, yearSuffix });

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        // Get the next sequence number for this year
        const result = await databaseManager.query(`
          SELECT COALESCE(MAX(CAST(SUBSTRING(hn FROM 3 FOR 6) AS INTEGER)), 0) + 1 as next_number
          FROM patients 
          WHERE hn LIKE $1
        `, [`HN${yearSuffix}%`]);

        const nextNumber = result.rows[0]?.next_number || 1;
        const paddedNumber = nextNumber.toString().padStart(6, '0');
        const newHn = `HN${yearSuffix}${paddedNumber}`;

        // Double-check for uniqueness
        const duplicateCheck = await databaseManager.query(`
          SELECT id FROM patients WHERE hn = $1
        `, [newHn]);

        if (duplicateCheck.rows.length === 0) {
          logger.info('Hospital number generated successfully', { 
            hn: newHn, 
            year: targetYear, 
            sequenceNumber: nextNumber,
            attempt 
          });

          return {
            hn: newHn,
            year: yearSuffix,
            sequenceNumber: nextNumber,
            generatedAt: new Date()
          };
        } else {
          logger.warn('Duplicate HN found, retrying', { 
            hn: newHn, 
            attempt,
            duplicateId: duplicateCheck.rows[0].id 
          });
          
          // Wait a bit before retrying
          await this.delay(100 * attempt);
        }
      } catch (error) {
        logger.error('Error generating hospital number', { 
          error: error.message, 
          attempt,
          year: targetYear 
        });
        
        if (attempt === this.MAX_RETRIES) {
          throw new Error(`Failed to generate hospital number after ${this.MAX_RETRIES} attempts: ${error.message}`);
        }
        
        // Wait before retrying
        await this.delay(200 * attempt);
      }
    }

    throw new Error(`Failed to generate unique hospital number after ${this.MAX_RETRIES} attempts`);
  }

  /**
   * Validate hospital number format
   * @param hn Hospital number to validate
   * @returns boolean
   */
  static validateHospitalNumber(hn: string): boolean {
    // Format: HN + YY + 6-digit number
    const hnRegex = /^HN\d{2}\d{6}$/;
    return hnRegex.test(hn);
  }

  /**
   * Check if hospital number exists in database
   * @param hn Hospital number to check
   * @returns Promise<boolean>
   */
  static async hospitalNumberExists(hn: string): Promise<boolean> {
    try {
      const result = await databaseManager.query(`
        SELECT id FROM patients WHERE hn = $1
      `, [hn]);
      
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error checking hospital number existence', { error: error.message, hn });
      throw error;
    }
  }

  /**
   * Get hospital number statistics for a year
   * @param year Year to get statistics for
   * @returns Promise<object>
   */
  static async getHospitalNumberStats(year?: number): Promise<{
    year: string;
    totalCount: number;
    firstHn: string | null;
    lastHn: string | null;
    nextHn: string;
  }> {
    const targetYear = year || new Date().getFullYear();
    const yearSuffix = targetYear.toString().slice(-2);

    try {
      const result = await databaseManager.query(`
        SELECT 
          COUNT(*) as total_count,
          MIN(hn) as first_hn,
          MAX(hn) as last_hn,
          COALESCE(MAX(CAST(SUBSTRING(hn FROM 3 FOR 6) AS INTEGER)), 0) + 1 as next_number
        FROM patients 
        WHERE hn LIKE $1
      `, [`HN${yearSuffix}%`]);

      const stats = result.rows[0];
      const nextNumber = stats.next_number;
      const paddedNumber = nextNumber.toString().padStart(6, '0');
      const nextHn = `HN${yearSuffix}${paddedNumber}`;

      return {
        year: yearSuffix,
        totalCount: parseInt(stats.total_count),
        firstHn: stats.first_hn,
        lastHn: stats.last_hn,
        nextHn
      };
    } catch (error) {
      logger.error('Error getting hospital number statistics', { error: error.message, year: targetYear });
      throw error;
    }
  }

  /**
   * Get all hospital numbers for a year (for debugging)
   * @param year Year to get hospital numbers for
   * @param limit Maximum number of results
   * @returns Promise<string[]>
   */
  static async getHospitalNumbersForYear(year?: number, limit: number = 100): Promise<string[]> {
    const targetYear = year || new Date().getFullYear();
    const yearSuffix = targetYear.toString().slice(-2);

    try {
      const result = await databaseManager.query(`
        SELECT hn 
        FROM patients 
        WHERE hn LIKE $1
        ORDER BY hn
        LIMIT $2
      `, [`HN${yearSuffix}%`, limit]);

      return result.rows.map(row => row.hn);
    } catch (error) {
      logger.error('Error getting hospital numbers for year', { error: error.message, year: targetYear });
      throw error;
    }
  }

  /**
   * Utility function to add delay
   * @param ms Milliseconds to delay
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default HnGenerationService;
