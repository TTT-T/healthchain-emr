import { apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';

// Interface สำหรับ Queue History Record
export interface QueueHistoryRecord {
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
export interface QueueStatistics {
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

// Interface สำหรับ API Response
interface QueueHistoryResponse {
  data: QueueHistoryRecord[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  error: null;
  statusCode: number;
}

interface QueueStatisticsResponse {
  data: QueueStatistics;
  meta: {
    generatedAt: string;
    filters: {
      dateFrom?: string;
      dateTo?: string;
      department?: string;
      doctorId?: string;
    };
  };
  error: null;
  statusCode: number;
}

interface SingleQueueResponse {
  data: QueueHistoryRecord;
  meta: null;
  error: null;
  statusCode: number;
}

// Interface สำหรับ Query Parameters
export interface QueueHistoryQuery {
  page?: number;
  limit?: number;
  status?: string;
  department?: string;
  doctorId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface StatisticsQuery {
  dateFrom?: string;
  dateTo?: string;
  department?: string;
  doctorId?: string;
  format?: 'json' | 'pdf';
}

/**
 * ดึงประวัติคิวทั้งหมด
 */
export const getAllQueueHistory = async (query: QueueHistoryQuery = {}): Promise<QueueHistoryResponse> => {
  try {
    logger.info('Fetching all queue history', query);
    
    const params = new URLSearchParams();
    
    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.status) params.append('status', query.status);
    if (query.department) params.append('department', query.department);
    if (query.doctorId) params.append('doctorId', query.doctorId);
    if (query.dateFrom) params.append('dateFrom', query.dateFrom);
    if (query.dateTo) params.append('dateTo', query.dateTo);
    if (query.search) params.append('search', query.search);

    const response = await apiClient.get(`/medical/queue-history?${params.toString()}`);
    
    logger.debug('Queue history fetched successfully', response.data);
    return response.data;
  } catch (error) {
    logger.error('Error fetching queue history:', error);
    throw error;
  }
};

/**
 * ดึงประวัติคิวตามผู้ป่วย
 */
export const getQueueHistoryByPatient = async (
  patientId: string, 
  query: Omit<QueueHistoryQuery, 'patientId'> = {}
): Promise<QueueHistoryResponse> => {
  try {
    logger.info('Fetching queue history by patient', { patientId, ...query });
    
    const params = new URLSearchParams();
    
    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.dateFrom) params.append('dateFrom', query.dateFrom);
    if (query.dateTo) params.append('dateTo', query.dateTo);

    const response = await apiClient.get(`/medical/queue-history/patients/${patientId}?${params.toString()}`);
    
    logger.debug('Patient queue history fetched successfully', response.data);
    return response.data;
  } catch (error) {
    logger.error('Error fetching patient queue history:', error);
    throw error;
  }
};

/**
 * ดึงประวัติคิวตามแพทย์
 */
export const getQueueHistoryByDoctor = async (
  doctorId: string, 
  query: Omit<QueueHistoryQuery, 'doctorId'> = {}
): Promise<QueueHistoryResponse> => {
  try {
    logger.info('Fetching queue history by doctor', { doctorId, ...query });
    
    const params = new URLSearchParams();
    
    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.dateFrom) params.append('dateFrom', query.dateFrom);
    if (query.dateTo) params.append('dateTo', query.dateTo);

    const response = await apiClient.get(`/medical/queue-history/doctors/${doctorId}?${params.toString()}`);
    
    logger.debug('Doctor queue history fetched successfully', response.data);
    return response.data;
  } catch (error) {
    logger.error('Error fetching doctor queue history:', error);
    throw error;
  }
};

/**
 * ดึงข้อมูลคิวตาม ID
 */
export const getQueueHistoryById = async (id: string): Promise<SingleQueueResponse> => {
  try {
    logger.info('Fetching queue history by ID', { id });
    
    const response = await apiClient.get(`/medical/queue-history/${id}`);
    
    logger.debug('Queue history by ID fetched successfully', response.data);
    return response.data;
  } catch (error) {
    logger.error('Error fetching queue history by ID:', error);
    throw error;
  }
};

/**
 * ดึงสถิติคิว
 */
export const getQueueStatistics = async (query: StatisticsQuery = {}): Promise<QueueStatisticsResponse> => {
  try {
    logger.info('Fetching queue statistics', query);
    
    const params = new URLSearchParams();
    
    if (query.dateFrom) params.append('dateFrom', query.dateFrom);
    if (query.dateTo) params.append('dateTo', query.dateTo);
    if (query.department) params.append('department', query.department);
    if (query.doctorId) params.append('doctorId', query.doctorId);
    if (query.format) params.append('format', query.format);

    const response = await apiClient.get(`/medical/queue-history/statistics?${params.toString()}`);
    
    logger.debug('Queue statistics fetched successfully', response.data);
    return response.data;
  } catch (error) {
    logger.error('Error fetching queue statistics:', error);
    throw error;
  }
};

/**
 * ดาวน์โหลดรายงาน PDF
 */
export const downloadQueueReport = async (id: string, format: 'json' | 'pdf' = 'pdf'): Promise<any> => {
  try {
    logger.info('Downloading queue report', { id, format });
    
    const response = await apiClient.get(`/medical/queue-history/${id}/report?format=${format}`, {
      responseType: format === 'pdf' ? 'blob' : 'json'
    });
    
    if (format === 'pdf') {
      // Create download link for PDF
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `queue-report-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
    
    logger.debug('Queue report downloaded successfully', { id, format });
    return response.data;
  } catch (error) {
    logger.error('Error downloading queue report:', error);
    throw error;
  }
};

/**
 * สร้างรายงานสถิติ
 */
export const generateStatisticsReport = async (query: StatisticsQuery = {}): Promise<any> => {
  try {
    logger.info('Generating statistics report', query);
    
    const params = new URLSearchParams();
    
    if (query.dateFrom) params.append('dateFrom', query.dateFrom);
    if (query.dateTo) params.append('dateTo', query.dateTo);
    if (query.department) params.append('department', query.department);
    if (query.doctorId) params.append('doctorId', query.doctorId);
    if (query.format) params.append('format', query.format);

    const response = await apiClient.get(`/medical/queue-history/statistics/report?${params.toString()}`, {
      responseType: query.format === 'pdf' ? 'blob' : 'json'
    });
    
    if (query.format === 'pdf') {
      // Create download link for PDF
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `queue-statistics-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
    
    logger.debug('Statistics report generated successfully', query);
    return response.data;
  } catch (error) {
    logger.error('Error generating statistics report:', error);
    throw error;
  }
};

/**
 * ค้นหาคิวด้วย HN หรือ National ID
 */
export const searchQueueByPatient = async (searchTerm: string): Promise<QueueHistoryRecord[]> => {
  try {
    logger.info('Searching queue by patient', { searchTerm });
    
    const response = await getAllQueueHistory({ search: searchTerm, limit: 50 });
    
    logger.debug('Queue search completed', { searchTerm, results: response.data.length });
    return response.data;
  } catch (error) {
    logger.error('Error searching queue by patient:', error);
    throw error;
  }
};

/**
 * ดึงข้อมูลคิวสำหรับวันนี้
 */
export const getTodayQueueHistory = async (): Promise<QueueHistoryRecord[]> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await getAllQueueHistory({ 
      dateFrom: today, 
      dateTo: today,
      limit: 100 
    });
    
    logger.debug('Today queue history fetched', { count: response.data.length });
    return response.data;
  } catch (error) {
    logger.error('Error fetching today queue history:', error);
    throw error;
  }
};

/**
 * ดึงข้อมูลคิวที่รออยู่
 */
export const getWaitingQueues = async (): Promise<QueueHistoryRecord[]> => {
  try {
    const response = await getAllQueueHistory({ 
      status: 'waiting',
      limit: 100 
    });
    
    logger.debug('Waiting queues fetched', { count: response.data.length });
    return response.data;
  } catch (error) {
    logger.error('Error fetching waiting queues:', error);
    throw error;
  }
};

/**
 * ดึงข้อมูลคิวที่เสร็จสิ้นแล้ว
 */
export const getCompletedQueues = async (dateFrom?: string, dateTo?: string): Promise<QueueHistoryRecord[]> => {
  try {
    const response = await getAllQueueHistory({ 
      status: 'completed',
      dateFrom,
      dateTo,
      limit: 100 
    });
    
    logger.debug('Completed queues fetched', { count: response.data.length });
    return response.data;
  } catch (error) {
    logger.error('Error fetching completed queues:', error);
    throw error;
  }
};

/**
 * จัดรูปแบบข้อมูลคิวสำหรับการแสดงผล
 */
export const formatQueueData = (queue: QueueHistoryRecord) => {
  return {
    ...queue,
    formattedVisitTime: new Date(queue.visitTime).toLocaleString('th-TH'),
    formattedCreatedAt: new Date(queue.createdAt).toLocaleString('th-TH'),
    formattedUpdatedAt: new Date(queue.updatedAt).toLocaleString('th-TH'),
    statusLabel: getStatusLabel(queue.status),
    statusColor: getStatusColor(queue.status)
  };
};

/**
 * ดึงป้ายกำกับสถานะ
 */
export const getStatusLabel = (status: string): string => {
  const statusLabels: { [key: string]: string } = {
    waiting: 'รอคิว',
    in_progress: 'กำลังตรวจ',
    completed: 'เสร็จสิ้น',
    cancelled: 'ยกเลิก'
  };
  return statusLabels[status] || status;
};

/**
 * ดึงสีสถานะ
 */
export const getStatusColor = (status: string): string => {
  const statusColors: { [key: string]: string } = {
    waiting: 'text-yellow-600 bg-yellow-100',
    in_progress: 'text-blue-600 bg-blue-100',
    completed: 'text-green-600 bg-green-100',
    cancelled: 'text-red-600 bg-red-100'
  };
  return statusColors[status] || 'text-gray-600 bg-gray-100';
};

/**
 * คำนวณเวลารอเฉลี่ย
 */
export const calculateAverageWaitTime = (queues: QueueHistoryRecord[]): number => {
  const completedQueues = queues.filter(q => q.status === 'completed');
  
  if (completedQueues.length === 0) return 0;
  
  const totalWaitTime = completedQueues.reduce((sum, queue) => {
    const visitTime = new Date(queue.visitTime);
    const completedTime = new Date(queue.updatedAt);
    return sum + (completedTime.getTime() - visitTime.getTime()) / (1000 * 60); // minutes
  }, 0);
  
  return Math.round(totalWaitTime / completedQueues.length);
};

/**
 * สร้างข้อมูลตัวอย่างสำหรับการทดสอบ
 */
export const getSampleQueueData = (): QueueHistoryRecord[] => {
  return [
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
};
