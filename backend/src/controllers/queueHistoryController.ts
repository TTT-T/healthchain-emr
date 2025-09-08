import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

// Interface สำหรับ Queue History
interface QueueHistoryRecord {
  id: string;
  queueNumber: string;
  patientHn: string;
  patientName: string;
  patientNationalId: string;
  treatmentType: string;
  doctorName: string;
  doctorId: string;
  department: string;
  visitTime: string;
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  symptoms?: string;
  notes?: string;
  pdfUrl?: string;
  visitId?: string;
}

// Interface สำหรับ Queue Statistics
interface QueueStatistics {
  totalQueues: number;
  completedQueues: number;
  waitingQueues: number;
  inProgressQueues: number;
  cancelledQueues: number;
  averageWaitTime: number;
  todayQueues: number;
  weeklyQueues: number;
  monthlyQueues: number;
}

// Sample data - ในระบบจริงจะดึงจากฐานข้อมูล
const sampleQueueRecords: QueueHistoryRecord[] = [
  {
    id: '1',
    queueNumber: 'Q001',
    patientHn: 'HN2025001',
    patientName: 'นาย สมชาย ใจดี',
    patientNationalId: '1234567890123',
    treatmentType: 'OPD - ตรวจรักษาทั่วไป',
    doctorName: 'นพ. สมชาย ใจดี',
    doctorId: 'DOC001',
    department: 'อายุรกรรม',
    visitTime: '2025-01-08T09:00:00Z',
    status: 'completed',
    createdAt: '2025-01-08T08:30:00Z',
    updatedAt: '2025-01-08T10:30:00Z',
    symptoms: 'ปวดหัว',
    notes: 'ผู้ป่วยมาด้วยอาการปวดหัว',
    pdfUrl: '/api/medical/queue-history/1/pdf',
    visitId: 'VISIT001'
  },
  {
    id: '2',
    queueNumber: 'Q002',
    patientHn: 'HN2025002',
    patientName: 'นาง สมหญิง รักสุขภาพ',
    patientNationalId: '2345678901234',
    treatmentType: 'ตรวจสุขภาพ',
    doctorName: 'นพ. สมหญิง รักสุขภาพ',
    doctorId: 'DOC002',
    department: 'กุมารเวชกรรม',
    visitTime: '2025-01-08T10:30:00Z',
    status: 'completed',
    createdAt: '2025-01-08T10:00:00Z',
    updatedAt: '2025-01-08T12:00:00Z',
    symptoms: 'ตรวจสุขภาพประจำปี',
    notes: 'ตรวจสุขภาพประจำปี',
    pdfUrl: '/api/medical/queue-history/2/pdf',
    visitId: 'VISIT002'
  },
  {
    id: '3',
    queueNumber: 'Q003',
    patientHn: 'HN2025003',
    patientName: 'นาย วิชัย สุขภาพดี',
    patientNationalId: '3456789012345',
    treatmentType: 'ฉีดวัคซีน',
    doctorName: 'นพ. วิชัย สุขภาพดี',
    doctorId: 'DOC003',
    department: 'เวชศาสตร์ป้องกัน',
    visitTime: '2025-01-08T14:00:00Z',
    status: 'waiting',
    createdAt: '2025-01-08T13:30:00Z',
    updatedAt: '2025-01-08T13:30:00Z',
    symptoms: 'ฉีดวัคซีนไข้หวัดใหญ่',
    notes: 'ฉีดวัคซีนไข้หวัดใหญ่ประจำปี',
    visitId: 'VISIT003'
  }
];

/**
 * ดึงประวัติคิวทั้งหมด
 */
export const getAllQueueHistory = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      department, 
      doctorId, 
      dateFrom, 
      dateTo,
      search 
    } = req.query;

    logger.info('Getting all queue history', { 
      page, limit, status, department, doctorId, dateFrom, dateTo, search 
    });

    // Filter data based on query parameters
    let filteredRecords = [...sampleQueueRecords];

    if (status) {
      filteredRecords = filteredRecords.filter(record => record.status === status);
    }

    if (department) {
      filteredRecords = filteredRecords.filter(record => 
        record.department.toLowerCase().includes((department as string).toLowerCase())
      );
    }

    if (doctorId) {
      filteredRecords = filteredRecords.filter(record => record.doctorId === doctorId);
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom as string);
      filteredRecords = filteredRecords.filter(record => 
        new Date(record.createdAt) >= fromDate
      );
    }

    if (dateTo) {
      const toDate = new Date(dateTo as string);
      filteredRecords = filteredRecords.filter(record => 
        new Date(record.createdAt) <= toDate
      );
    }

    if (search) {
      const searchTerm = (search as string).toLowerCase();
      filteredRecords = filteredRecords.filter(record => 
        record.patientName.toLowerCase().includes(searchTerm) ||
        record.patientHn.toLowerCase().includes(searchTerm) ||
        record.patientNationalId.includes(searchTerm) ||
        record.queueNumber.toLowerCase().includes(searchTerm)
      );
    }

    // Sort by created date (newest first)
    filteredRecords.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

    const response = {
      data: paginatedRecords,
      meta: {
        total: filteredRecords.length,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(filteredRecords.length / limitNum),
        hasNext: endIndex < filteredRecords.length,
        hasPrev: pageNum > 1
      },
      error: null,
      statusCode: 200
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Error getting queue history:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'ไม่สามารถดึงประวัติคิวได้'
      },
      statusCode: 500
    });
  }
});

/**
 * ดึงประวัติคิวตามผู้ป่วย
 */
export const getQueueHistoryByPatient = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    logger.info('Getting queue history by patient', { patientId, page, limit });

    // Filter records by patient (HN or National ID)
    const patientRecords = sampleQueueRecords.filter(record => 
      record.patientHn === patientId || record.patientNationalId === patientId
    );

    // Sort by created date (newest first)
    patientRecords.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedRecords = patientRecords.slice(startIndex, endIndex);

    const response = {
      data: paginatedRecords,
      meta: {
        total: patientRecords.length,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(patientRecords.length / limitNum),
        hasNext: endIndex < patientRecords.length,
        hasPrev: pageNum > 1
      },
      error: null,
      statusCode: 200
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Error getting queue history by patient:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'ไม่สามารถดึงประวัติคิวของผู้ป่วยได้'
      },
      statusCode: 500
    });
  }
});

/**
 * ดึงประวัติคิวตามแพทย์
 */
export const getQueueHistoryByDoctor = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;
    const { page = 1, limit = 20, dateFrom, dateTo } = req.query;

    logger.info('Getting queue history by doctor', { doctorId, page, limit, dateFrom, dateTo });

    // Filter records by doctor
    let doctorRecords = sampleQueueRecords.filter(record => record.doctorId === doctorId);

    // Filter by date range if provided
    if (dateFrom) {
      const fromDate = new Date(dateFrom as string);
      doctorRecords = doctorRecords.filter(record => 
        new Date(record.createdAt) >= fromDate
      );
    }

    if (dateTo) {
      const toDate = new Date(dateTo as string);
      doctorRecords = doctorRecords.filter(record => 
        new Date(record.createdAt) <= toDate
      );
    }

    // Sort by created date (newest first)
    doctorRecords.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedRecords = doctorRecords.slice(startIndex, endIndex);

    const response = {
      data: paginatedRecords,
      meta: {
        total: doctorRecords.length,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(doctorRecords.length / limitNum),
        hasNext: endIndex < doctorRecords.length,
        hasPrev: pageNum > 1
      },
      error: null,
      statusCode: 200
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Error getting queue history by doctor:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'ไม่สามารถดึงประวัติคิวของแพทย์ได้'
      },
      statusCode: 500
    });
  }
});

/**
 * ดึงข้อมูลคิวตาม ID
 */
export const getQueueHistoryById = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    logger.info('Getting queue history by ID', { id });

    const queueRecord = sampleQueueRecords.find(record => record.id === id);

    if (!queueRecord) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: {
          code: 'NOT_FOUND',
          message: 'ไม่พบข้อมูลคิวที่ระบุ'
        },
        statusCode: 404
      });
    }

    const response = {
      data: queueRecord,
      meta: null,
      error: null,
      statusCode: 200
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Error getting queue history by ID:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'ไม่สามารถดึงข้อมูลคิวได้'
      },
      statusCode: 500
    });
  }
});

/**
 * ดึงสถิติคิว
 */
export const getQueueStatistics = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { dateFrom, dateTo, department, doctorId } = req.query;

    logger.info('Getting queue statistics', { dateFrom, dateTo, department, doctorId });

    // Filter records based on query parameters
    let filteredRecords = [...sampleQueueRecords];

    if (dateFrom) {
      const fromDate = new Date(dateFrom as string);
      filteredRecords = filteredRecords.filter(record => 
        new Date(record.createdAt) >= fromDate
      );
    }

    if (dateTo) {
      const toDate = new Date(dateTo as string);
      filteredRecords = filteredRecords.filter(record => 
        new Date(record.createdAt) <= toDate
      );
    }

    if (department) {
      filteredRecords = filteredRecords.filter(record => 
        record.department.toLowerCase().includes((department as string).toLowerCase())
      );
    }

    if (doctorId) {
      filteredRecords = filteredRecords.filter(record => record.doctorId === doctorId);
    }

    // Calculate statistics
    const totalQueues = filteredRecords.length;
    const completedQueues = filteredRecords.filter(r => r.status === 'completed').length;
    const waitingQueues = filteredRecords.filter(r => r.status === 'waiting').length;
    const inProgressQueues = filteredRecords.filter(r => r.status === 'in_progress').length;
    const cancelledQueues = filteredRecords.filter(r => r.status === 'cancelled').length;

    // Calculate average wait time (simplified)
    const completedRecords = filteredRecords.filter(r => r.status === 'completed');
    const averageWaitTime = completedRecords.length > 0 
      ? completedRecords.reduce((sum, record) => {
          const visitTime = new Date(record.visitTime);
          const completedTime = new Date(record.updatedAt);
          return sum + (completedTime.getTime() - visitTime.getTime()) / (1000 * 60); // minutes
        }, 0) / completedRecords.length
      : 0;

    // Calculate daily/weekly/monthly stats
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const todayQueues = filteredRecords.filter(r => 
      new Date(r.createdAt) >= todayStart
    ).length;

    const weeklyQueues = filteredRecords.filter(r => 
      new Date(r.createdAt) >= weekStart
    ).length;

    const monthlyQueues = filteredRecords.filter(r => 
      new Date(r.createdAt) >= monthStart
    ).length;

    const statistics: QueueStatistics = {
      totalQueues,
      completedQueues,
      waitingQueues,
      inProgressQueues,
      cancelledQueues,
      averageWaitTime: Math.round(averageWaitTime),
      todayQueues,
      weeklyQueues,
      monthlyQueues
    };

    const response = {
      data: statistics,
      meta: {
        generatedAt: new Date().toISOString(),
        filters: { dateFrom, dateTo, department, doctorId }
      },
      error: null,
      statusCode: 200
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Error getting queue statistics:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'ไม่สามารถดึงสถิติคิวได้'
      },
      statusCode: 500
    });
  }
});

/**
 * ดาวน์โหลดรายงาน PDF
 */
export const downloadQueueReport = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { format = 'pdf' } = req.query;

    logger.info('Downloading queue report', { id, format });

    const queueRecord = sampleQueueRecords.find(record => record.id === id);

    if (!queueRecord) {
      return res.status(404).json({
        data: null,
        meta: null,
        error: {
          code: 'NOT_FOUND',
          message: 'ไม่พบข้อมูลคิวที่ระบุ'
        },
        statusCode: 404
      });
    }

    // In a real system, this would generate and return the actual PDF
    // For now, we'll return the queue record data
    const reportData = {
      queueRecord,
      generatedAt: new Date().toISOString(),
      generatedBy: req.user?.id || 'system'
    };

    if (format === 'pdf') {
      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="queue-report-${queueRecord.queueNumber}.pdf"`);
      
      // In a real system, you would generate the actual PDF here
      // For now, return JSON data
      res.status(200).json({
        data: reportData,
        meta: {
          message: 'PDF report generated successfully',
          filename: `queue-report-${queueRecord.queueNumber}.pdf`
        },
        error: null,
        statusCode: 200
      });
    } else {
      // Return JSON format
      res.status(200).json({
        data: reportData,
        meta: null,
        error: null,
        statusCode: 200
      });
    }
  } catch (error) {
    logger.error('Error downloading queue report:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'ไม่สามารถดาวน์โหลดรายงานได้'
      },
      statusCode: 500
    });
  }
});

/**
 * สร้างรายงานสถิติ
 */
export const generateStatisticsReport = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { 
      dateFrom, 
      dateTo, 
      department, 
      doctorId, 
      format = 'json' 
    } = req.query;

    logger.info('Generating statistics report', { dateFrom, dateTo, department, doctorId, format });

    // Get statistics data
    const statisticsResponse = await getQueueStatistics(req, res);
    
    if (statisticsResponse.statusCode !== 200) {
      return statisticsResponse;
    }

    const statistics = statisticsResponse.data;

    // Generate additional report data
    const reportData = {
      statistics,
      generatedAt: new Date().toISOString(),
      generatedBy: req.user?.id || 'system',
      filters: { dateFrom, dateTo, department, doctorId },
      summary: {
        completionRate: statistics.totalQueues > 0 
          ? Math.round((statistics.completedQueues / statistics.totalQueues) * 100) 
          : 0,
        averageWaitTime: statistics.averageWaitTime,
        mostActiveDepartment: 'อายุรกรรม', // This would be calculated from actual data
        peakHours: ['09:00-10:00', '14:00-15:00'] // This would be calculated from actual data
      }
    };

    if (format === 'pdf') {
      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="queue-statistics-report-${new Date().toISOString().split('T')[0]}.pdf"`);
      
      // In a real system, you would generate the actual PDF here
      res.status(200).json({
        data: reportData,
        meta: {
          message: 'Statistics report generated successfully',
          filename: `queue-statistics-report-${new Date().toISOString().split('T')[0]}.pdf`
        },
        error: null,
        statusCode: 200
      });
    } else {
      // Return JSON format
      res.status(200).json({
        data: reportData,
        meta: null,
        error: null,
        statusCode: 200
      });
    }
  } catch (error) {
    logger.error('Error generating statistics report:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'ไม่สามารถสร้างรายงานสถิติได้'
      },
      statusCode: 500
    });
  }
});
