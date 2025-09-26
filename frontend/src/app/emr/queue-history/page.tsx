"use client";
import { useState, useEffect } from "react";
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Download, Eye, Calendar, Clock, User, Stethoscope, Search, Filter, BarChart3, RefreshCw } from 'lucide-react';
import { 
  getAllQueueHistory, 
  getQueueStatistics, 
  searchQueueByPatient, 
  downloadQueueReport, 
  generaatisticsReport, 
  getSampleQueueData,
  QueueHistoryRecord, 
  QueueStatistics, 
  QueueHistoryQuery 
} from '@/services/queueHistoryService';
import { PDFStorageService } from '@/services/pdfStorageService';
import { PatientDocumentService } from '@/services/patientDocumentService';
import { logger } from '@/lib/logger';

export default function QueueHistory() {
  const { user } = useAuth();
  const [queueRecords, setQueueRecords] = useState<QueueHistoryRecord[]>([]);
  const [statistics, setStatistics] = useState<QueueStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<QueueHistoryRecord | null>(null);
  const [showStatistics, setShowStatistics] = useState(false);
  const [filters, setFilters] = useState<QueueHistoryQuery>({
    page: 1,
    limit: 20,
    status: '',
    department: '',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    loadQueueRecords();
    loadStatistics();
  }, []);

  const loadQueueRecords = async () => {
    try {
      setIsLoading(true);
      
      // ดึงข้อมูลจาก PDF Storage Service
      const storedPDFs = PDFStorageService.getStoredPDFs();
      
      // แปลงข้อมูล PDF เป็น Queue Records
      const queueRecordsFromPDFs = storedPDFs.map(pdf => ({
        id: pdf.id,
        queueNumber: pdf.queueNumber,
        patientHn: pdf.patientHn,
        patientName: pdf.patientName,
        patientNationalId: 'ไม่ระบุ',
        treatmentType: pdf.treatmentType,
        doctorName: pdf.doctorName,
        doctorId: 'DOC001',
        department: pdf.department,
        visitTime: pdf.created_at,
        status: 'completed' as const,
        created_at: pdf.created_at,
        updated_at: pdf.created_at,
        pdfUrl: pdf.fileUrl,
        symptoms: 'ไม่ระบุ',
        notes: 'ไม่ระบุ',
        visitId: pdf.id
      }));

      // ดึงข้อมูลจาก API
      try {
        const apiResponse = await getAllQueueHistory(filters);
        const allRecords = [...apiResponse.data, ...queueRecordsFromPDFs];
        setQueueRecords(allRecords);
      } catch (apiError) {
        logger.warn('API not available, using sample data', apiError);
        const sampleData = getSampleQueueData();
        const allRecords = [...sampleData, ...queueRecordsFromPDFs];
        setQueueRecords(allRecords);
      }
    } catch (error) {
      logger.error('Error loading queue records:', error);
      const sampleData = getSampleQueueData();
      setQueueRecords(sampleData);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      setIsLoadingStats(true);
      const response = await getQueueStatistics();
      setStatistics(response.data);
    } catch (error) {
      logger.warn('Statistics API not available, using sample data', error);
      // สร้างข้อมูลสถิติตัวอย่าง
      setStatistics({
        totalQueues: queueRecords.length,
        completedQueues: queueRecords.filter(r => r.status === 'completed').length,
        waitingQueues: queueRecords.filter(r => r.status === 'waiting').length,
        inProgressQueues: queueRecords.filter(r => r.status === 'in_progress').length,
        cancelledQueues: queueRecords.filter(r => r.status === 'cancelled').length,
        averageWaitTime: 45,
        todayQueues: queueRecords.filter(r => {
          const today = new Date().toLocaleString();
          return new Date(r.created_at).toLocaleString() === today;
        }).length,
        weeklyQueues: queueRecords.length,
        monthlyQueues: queueRecords.length
      });
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadQueueRecords();
      return;
    }

    try {
      setIsLoading(true);
      const results = await searchQueueByPatient(searchQuery);
      setQueueRecords(results);
    } catch (error) {
      logger.error('Error searching queue records:', error);
      // Fallback to local search
      const filtered = queueRecords.filter(record =>
        record.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.patientHn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.patientNationalId.includes(searchQuery) ||
        record.queueNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setQueueRecords(filtered);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: keyof QueueHistoryQuery, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = async () => {
    try {
      setIsLoading(true);
      const response = await getAllQueueHistory(filters);
      setQueueRecords(response.data);
    } catch (error) {
      logger.error('Error applying filters:', error);
      // Fallback to local filtering
      let filtered = [...queueRecords];
      
      if (filters.status) {
        filtered = filtered.filter(r => r.status === filters.status);
      }
      if (filters.department) {
        filtered = filtered.filter(r => 
          r.department.toLowerCase().includes(filters.department!.toLowerCase())
        );
      }
      if (filters.dateFrom) {
        filtered = filtered.filter(r => 
          new Date(r.created_at) >= new Date(filters.dateFrom!)
        );
      }
      if (filters.dateTo) {
        filtered = filtered.filter(r => 
          new Date(r.created_at) <= new Date(filters.dateTo!)
        );
      }
      
      setQueueRecords(filtered);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadReport = async (record: QueueHistoryRecord) => {
    try {
      if (record.pdfUrl) {
        // ดาวน์โหลด PDF ที่มีอยู่แล้ว
        const link = document.createElement('a');
        link.href = record.pdfUrl;
        link.download = `queue-report-${record.queueNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // สร้างรายงานใหม่
        await downloadQueueReport(record.id);
      }
      
      // สร้างเอกสารให้ผู้ป่วย
      await createPatientDocument(record);
    } catch (error) {
      logger.error('Error downloading report:', error);
      alert('ไม่สามารถดาวน์โหลดรายงานได้');
    }
  };

  const handleDownloadStatistics = async () => {
    try {
      await generaatisticsReport({ format: 'pdf' });
    } catch (error) {
      logger.error('Error downloading statistics:', error);
      alert('ไม่สามารถดาวน์โหลดรายงานสถิติได้');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      waiting: { label: 'รอคิว', color: 'bg-yellow-100 text-yellow-800' },
      in_progress: { label: 'กำลังตรวจ', color: 'bg-blue-100 text-blue-800' },
      completed: { label: 'เสร็จสิ้น', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'ยกเลิก', color: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
                   { label: status, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDateTime = (daring: string) => {
    return new Date(daring).toLocaleString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * สร้างเอกสารให้ผู้ป่วย
   */
  const createPatientDocument = async (record: QueueHistoryRecord) => {
    try {
      await PatientDocumentService.createDocumentFromMedicalRecord(
        'queue_report',
        record,
        {
          patientHn: record.patientHn || '',
          patientNationalId: record.patientNationalId || '',
          patientName: record.patientName || ''
        },
        user?.id || '',
        user?.thaiName || `${user?.firstName} ${user?.lastName}` || 'เจ้าหน้าที่'
      );
      
      logger.info('Patient document created successfully for queue report', { 
        patientHn: record.patientHn,
        recordType: 'queue_report'
      });
    } catch (error) {
      logger.error('Error creating patient document for queue report:', error);
      // ไม่ throw error เพื่อไม่ให้กระทบการดาวน์โหลดรายงาน
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="w-full">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="h-6 w-6 text-blue-600" />
                ประวัติคิวและรายงาน
              </h1>
              <p className="text-gray-600 mt-1">
                ดูประวัติคิวทั้งหมดและดาวน์โหลดรายงาน PDF
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowStatistics(!showStatistics)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <BarChart3 className="h-4 w-4" />
                สถิติ
              </button>
              <button
                onClick={loadQueueRecords}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                รีเฟรช
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Panel */}
        {showStatistics && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">สถิติคิว</h2>
              <button
                onClick={handleDownloadStatistics}
                className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Download className="h-4 w-4" />
                ดาวน์โหลดรายงาน
              </button>
            </div>
            
            {isLoadingStats ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : statistics ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{statistics.totalQueues}</div>
                  <div className="text-sm text-gray-600">ทั้งหมด</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{statistics.completedQueues}</div>
                  <div className="text-sm text-gray-600">เสร็จสิ้น</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{statistics.waitingQueues}</div>
                  <div className="text-sm text-gray-600">รอคิว</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{statistics.inProgressQueues}</div>
                  <div className="text-sm text-gray-600">กำลังตรวจ</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{statistics.cancelledQueues}</div>
                  <div className="text-sm text-gray-600">ยกเลิก</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{statistics.averageWaitTime}</div>
                  <div className="text-sm text-gray-600">นาที (เฉลี่ย)</div>
                </div>
                <div className="text-center p-3 bg-indigo-50 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">{statistics.todayQueues}</div>
                  <div className="text-sm text-gray-600">วันนี้</div>
                </div>
                <div className="text-center p-3 bg-pink-50 rounded-lg">
                  <div className="text-2xl font-bold text-pink-600">{statistics.weeklyQueues}</div>
                  <div className="text-sm text-gray-600">สัปดาห์นี้</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                ไม่สามารถโหลดข้อมูลสถิติได้
              </div>
            )}
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ค้นหา</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="HN, ชื่อ, เลขบัตรประชาชน, หมายเลขคิว"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">ทั้งหมด</option>
                <option value="waiting">รอคิว</option>
                <option value="in_progress">กำลังตรวจ</option>
                <option value="completed">เสร็จสิ้น</option>
                <option value="cancelled">ยกเลิก</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">แผนก</label>
              <select
                value={filters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">ทั้งหมด</option>
                <option value="อายุรกรรม">อายุรกรรม</option>
                <option value="กุมารเวชกรรม">กุมารเวชกรรม</option>
                <option value="เวชศาสตร์ป้องกัน">เวชศาสตร์ป้องกัน</option>
                <option value="ศัลยกรรม">ศัลยกรรม</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Search className="h-4 w-4" />
                ค้นหา
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วันที่เริ่มต้น</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วันที่สิ้นสุด</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={applyFilters}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Filter className="h-4 w-4" />
                ใช้ตัวกรอง
              </button>
            </div>
          </div>
        </div>

        {/* Queue Records Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              รายการประวัติคิว ({queueRecords.length} รายการ)
            </h2>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : queueRecords.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>ไม่พบข้อมูลคิว</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      หมายเลขคิว
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ผู้ป่วย
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      แพทย์/แผนก
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ประเภทการรักษา
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      สถานะ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      เวลา
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      การดำเนินการ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {queueRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {record.queueNumber}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {record.patientName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {record.patientHn}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {record.doctorName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {record.department}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {record.treatmentType}
                        </div>
                        {record.symptoms && (
                          <div className="text-sm text-gray-500">
                            อาการ: {record.symptoms}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(record.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">
                            {formatDateTime(record.visitTime)}
                          </div>
                          <div className="text-sm text-gray-500">
                            สร้าง: {formatDateTime(record.created_at)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedRecord(record)}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            ดู
                          </button>
                          <button
                            onClick={() => handleDownloadReport(record)}
                            className="text-green-600 hover:text-green-900 flex items-center gap-1"
                          >
                            <Download className="h-4 w-4" />
                            ดาวน์โหลด
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Record Details Modal */}
        {selectedRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    รายละเอียดคิว {selectedRecord.queueNumber}
                  </h3>
                  <button
                    onClick={() => setSelectedRecord(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">ปิด</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">หมายเลขคิว</label>
                      <p className="text-sm text-gray-900">{selectedRecord.queueNumber}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">สถานะ</label>
                      <div className="mt-1">{getStatusBadge(selectedRecord.status)}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">ชื่อผู้ป่วย</label>
                      <p className="text-sm text-gray-900">{selectedRecord.patientName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">หมายเลข HN</label>
                      <p className="text-sm text-gray-900">{selectedRecord.patientHn}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">แพทย์ผู้ตรวจ</label>
                      <p className="text-sm text-gray-900">{selectedRecord.doctorName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">แผนก</label>
                      <p className="text-sm text-gray-900">{selectedRecord.department}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ประเภทการรักษา</label>
                    <p className="text-sm text-gray-900">{selectedRecord.treatmentType}</p>
                  </div>
                  
                  {selectedRecord.symptoms && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">อาการ</label>
                      <p className="text-sm text-gray-900">{selectedRecord.symptoms}</p>
                    </div>
                  )}
                  
                  {selectedRecord.notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">หมายเหตุ</label>
                      <p className="text-sm text-gray-900">{selectedRecord.notes}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">เวลานัด</label>
                      <p className="text-sm text-gray-900">{formatDateTime(selectedRecord.visitTime)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">เวลาสร้าง</label>
                      <p className="text-sm text-gray-900">{formatDateTime(selectedRecord.created_at)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    onClick={() => setSelectedRecord(null)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    ปิด
                  </button>
                  <button
                    onClick={() => handleDownloadReport(selectedRecord)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    ดาวน์โหลดรายงาน
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}