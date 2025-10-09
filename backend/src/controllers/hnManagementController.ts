import { Request, Response } from 'express';
import { HnGenerationService } from '../services/hnGenerationService';
import { logger } from '../utils/logger';
import { successResponse, errorResponse } from '../utils/response';

/**
 * Hospital Number (HN) Management Controller
 * จัดการหมายเลข HN สำหรับระบบ EMR
 */

/**
 * Generate a new hospital number
 * POST /api/admin/hn/generate
 */
export const generateHospitalNumber = async (req: Request, res: Response) => {
  try {
    const { year } = req.body;
    
    const result = await HnGenerationService.generateHospitalNumber(year);
    
    res.status(201).json(successResponse(
      'Hospital number generated successfully',
      result,
      201
    ));
  } catch (error) {
    logger.error('Error generating hospital number:', error);
    res.status(500).json(errorResponse(
      'Failed to generate hospital number',
      500,
      error.message
    ));
  }
};

/**
 * Validate hospital number format
 * POST /api/admin/hn/validate
 */
export const validateHospitalNumber = async (req: Request, res: Response) => {
  try {
    const { hn } = req.body;
    
    if (!hn) {
      return res.status(400).json(errorResponse(
        'Hospital number is required',
        400
      ));
    }
    
    const isValid = HnGenerationService.validateHospitalNumber(hn);
    const exists = await HnGenerationService.hospitalNumberExists(hn);
    
    res.json(successResponse(
      'Hospital number validation completed',
      {
        hn,
        isValid,
        exists,
        status: isValid ? (exists ? 'exists' : 'available') : 'invalid'
      }
    ));
  } catch (error) {
    logger.error('Error validating hospital number:', error);
    res.status(500).json(errorResponse(
      'Failed to validate hospital number',
      500,
      error.message
    ));
  }
};

/**
 * Get hospital number statistics
 * GET /api/admin/hn/stats
 */
export const getHospitalNumberStats = async (req: Request, res: Response) => {
  try {
    const { year } = req.query;
    const targetYear = year ? parseInt(year as string) : undefined;
    
    const stats = await HnGenerationService.getHospitalNumberStats(targetYear);
    
    res.json(successResponse(
      'Hospital number statistics retrieved successfully',
      stats
    ));
  } catch (error) {
    logger.error('Error getting hospital number statistics:', error);
    res.status(500).json(errorResponse(
      'Failed to get hospital number statistics',
      500,
      error.message
    ));
  }
};

/**
 * Get hospital numbers for a specific year
 * GET /api/admin/hn/list
 */
export const getHospitalNumbers = async (req: Request, res: Response) => {
  try {
    const { year, limit = 100 } = req.query;
    const targetYear = year ? parseInt(year as string) : undefined;
    const limitNum = parseInt(limit as string);
    
    const hns = await HnGenerationService.getHospitalNumbersForYear(targetYear, limitNum);
    
    res.json(successResponse(
      'Hospital numbers retrieved successfully',
      {
        year: targetYear || new Date().getFullYear(),
        count: hns.length,
        hospitalNumbers: hns
      }
    ));
  } catch (error) {
    logger.error('Error getting hospital numbers:', error);
    res.status(500).json(errorResponse(
      'Failed to get hospital numbers',
      500,
      error.message
    ));
  }
};

/**
 * Check if hospital number exists
 * GET /api/admin/hn/check/:hn
 */
export const checkHospitalNumber = async (req: Request, res: Response) => {
  try {
    const { hn } = req.params;
    
    if (!hn) {
      return res.status(400).json(errorResponse(
        'Hospital number is required',
        400
      ));
    }
    
    const exists = await HnGenerationService.hospitalNumberExists(hn);
    const isValid = HnGenerationService.validateHospitalNumber(hn);
    
    res.json(successResponse(
      'Hospital number check completed',
      {
        hn,
        exists,
        isValid,
        status: isValid ? (exists ? 'exists' : 'available') : 'invalid'
      }
    ));
  } catch (error) {
    logger.error('Error checking hospital number:', error);
    res.status(500).json(errorResponse(
      'Failed to check hospital number',
      500,
      error.message
    ));
  }
};

export default {
  generateHospitalNumber,
  validateHospitalNumber,
  getHospitalNumberStats,
  getHospitalNumbers,
  checkHospitalNumber
};
