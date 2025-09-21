"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PatientDocument, DocumentSearchQuery } from '@/services/patientDocumentService';
import { FileText, Download, Eye, Search, Filter, Calendar, User, Stethoscope, Tag, Clock, File } from 'lucide-react';
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/api';
import AppLayout from '@/components/AppLayout';

export default function PatientDocuments() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<DocumentSearchQuery>({
    documentType: '',
    dateFrom: '',
    dateTo: '',
    doctorName: '',
    department: '',
    page: 1,
    limit: 20
  });
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState<PatientDocument | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadDocuments();
    }
  }, [user, filters]);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      
      if (!user?.id) {
        setDocuments([]);
        setTotalDocuments(0);
        return;
      }

      // ใช้ apiClient method ที่มีอยู่แล้ว
      const response = await apiClient.getPatientDocuments(user.id);

      if (response.statusCode === 200 && response.data) {
        // response.data เป็น array ของ documents
        const documents = Array.isArray(response.data) ? response.data : [];
        setDocuments(documents as any);
        setTotalDocuments(documents.length);
      } else if (response.statusCode === 404) {
        // ไม่พบข้อมูล patient - ยังไม่ได้ลงทะเบียนในระบบ EMR
        setDocuments([]);
        setTotalDocuments(0);
      } else {
        setDocuments([]);
        setTotalDocuments(0);
      }
    } catch (error: any) {
      logger.error('Error loading patient documents:', error);
      
      // ตรวจสอบว่าเป็น error 404 หรือไม่
      if (error?.response?.status === 404 || error?.statusCode === 404) {
        // ไม่พบข้อมูล patient - ยังไม่ได้ลงทะเบียนในระบบ EMR
        setDocuments([]);
        setTotalDocuments(0);
      } else {
        setDocuments([]);
        setTotalDocuments(0);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
    loadDocuments();
  };

  const handleFilterChange = (key: keyof DocumentSearchQuery, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleDownload = async (doc: PatientDocument) => {
    try {
      // ใช้ fetch สำหรับการดาวน์โหลด blob
      const response = await fetch(`/api/patients/${user?.id}/documents/${doc.id}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        // รีเฟรชข้อมูล
        loadDocuments();
      } else {
        throw new Error('ไม่สามารถดาวน์โหลดเอกสารได้');
      }
    } catch (error) {
      logger.error('Error downloading document:', error);
      alert('ไม่สามารถดาวน์โหลดเอกสารได้');
    }
  };

  const handleViewOnline = async (doc: PatientDocument) => {
    try {
      // ใช้ apiClient สำหรับการดูเอกสารออนไลน์
      const response = await apiClient.get(`/patients/${user?.id}/documents/${doc.id}/view`);

      if (response.statusCode === 200 && (response.data as any)?.fileUrl) {
        window.open((response.data as any).fileUrl, '_blank');
        
        // รีเฟรชข้อมูล
        loadDocuments();
      } else {
        throw new Error('ไม่พบ URL ของเอกสาร');
      }
    } catch (error) {
      logger.error('Error viewing document online:', error);
      alert('ไม่สามารถเปิดเอกสารได้');
    }
  };

  const getDocumentTypeIcon = (type: string) => {
    const icons: { [key: string]: any } = {
      'vital_signs': '💓',
      'history_taking': '📋',
      'doctor_visit': '👨‍⚕️',
      'lab_result': '🧪',
      'prescription': '💊',
      'appointment': '📅',
      'medical_certificate': '📜',
      'referral': '📤',
      'xray': '📷',
      'blood_test': '🩸'
    };
    return icons[type] || '📄';
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'vital_signs': 'รายงานสัญญาณชีพ',
      'history_taking': 'รายงานการซักประวัติ',
      'doctor_visit': 'รายงานการตรวจโดยแพทย์',
      'lab_result': 'ผลการตรวจทางห้องปฏิบัติการ',
      'prescription': 'ใบสั่งยา',
      'appointment': 'ใบนัดหมาย',
      'medical_certificate': 'ใบรับรองแพทย์',
      'referral': 'ใบส่งตัว',
      'xray': 'ผล X-ray',
      'blood_test': 'ผลตรวจเลือด'
    };
    return labels[type] || 'เอกสารทางการแพทย์';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AppLayout title="เอกสารทางการแพทย์" userType="patient">
      <div className="p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="h-6 w-6 text-blue-600" />
                  เอกสารทางการแพทย์ของฉัน
                </h1>
                <p className="text-gray-600 mt-1">
                  เอกสารทั้งหมดที่เกี่ยวข้องกับการรักษาของคุณ ({totalDocuments} เอกสาร)
                </p>
              </div>
            </div>
          </div>

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
                  placeholder="ค้นหาจากชื่อเอกสาร, แพทย์, แผนก"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทเอกสาร</label>
              <select
                value={filters.documentType}
                onChange={(e) => handleFilterChange('documentType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">ทั้งหมด</option>
                <option value="vital_signs">รายงานสัญญาณชีพ</option>
                <option value="history_taking">รายงานการซักประวัติ</option>
                <option value="doctor_visit">รายงานการตรวจโดยแพทย์</option>
                <option value="lab_result">ผลการตรวจทางห้องปฏิบัติการ</option>
                <option value="prescription">ใบสั่งยา</option>
                <option value="appointment">ใบนัดหมาย</option>
                <option value="medical_certificate">ใบรับรองแพทย์</option>
                <option value="referral">ใบส่งตัว</option>
              </select>
            </div>
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
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleSearch}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Search className="h-4 w-4" />
              ค้นหา
            </button>
          </div>
        </div>

        {/* Documents Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่มีเอกสาร</h3>
            <p className="text-gray-500">ยังไม่มีเอกสารทางการแพทย์ในระบบ</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((document) => (
              <div key={document.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{getDocumentTypeIcon(document.documentType)}</div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {getDocumentTypeLabel(document.documentType)}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {document.fileName}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleViewOnline(document)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="ดูออนไลน์"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(document)}
                        className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                        title="ดาวน์โหลด"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDateTime(document.createdAt)}</span>
                    </div>
                    
                    {document.doctorName && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        <span>{document.doctorName}</span>
                      </div>
                    )}
                    
                    {document.department && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Stethoscope className="h-4 w-4" />
                        <span>{document.department}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <File className="h-4 w-4" />
                      <span>{formatFileSize(document.fileSize)}</span>
                    </div>

                    {document.downloadCount > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Download className="h-4 w-4" />
                        <span>ดาวน์โหลดแล้ว {document.downloadCount} ครั้ง</span>
                      </div>
                    )}
                  </div>

                  {document.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {document.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewOnline(document)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Eye className="h-4 w-4" />
                      ดูออนไลน์
                    </button>
                    <button
                      onClick={() => handleDownload(document)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      <Download className="h-4 w-4" />
                      ดาวน์โหลด
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalDocuments > (filters.limit || 20) && (
          <div className="mt-6 flex justify-center">
            <div className="flex gap-2">
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}
                disabled={!filters.page || filters.page <= 1}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                ก่อนหน้า
              </button>
              <span className="px-3 py-2 text-sm text-gray-600">
                หน้า {filters.page || 1} จาก {Math.ceil(totalDocuments / (filters.limit || 20))}
              </span>
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
                disabled={!filters.page || filters.page >= Math.ceil(totalDocuments / (filters.limit || 20))}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                ถัดไป
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </AppLayout>
  );
}