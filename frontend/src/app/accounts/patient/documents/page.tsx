"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
// Define interface based on backend response
interface PatientDocument {
  id: string;
  patientId: string;
  visitId?: string;
  recordType: string;
  documentType: string;
  documentTitle: string;
  content: string;
  template?: string;
  variables: any;
  attachments: any[];
  status: string;
  notes?: string;
  issuedBy: string;
  issuedDate: string;
  validUntil?: string;
  recipientInfo?: any;
  created_at: string;
  updated_at: string;
  patient: {
    thaiName: string;
    nationalId: string;
    hospitalNumber: string;
  };
  // Additional fields for display
  fileName?: string;
  fileSize?: number;
  downloadCount?: number;
  doctorName?: string;
  department?: string;
  tags?: string[];
}

interface DocumentSearchQuery {
  documentType: string;
  dateFrom: string;
  dateTo: string;
  doctorName: string;
  department: string;
  page: number;
  limit: number;
}
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
  }, [user, filters, searchQuery]);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      
      if (!user?.id) {
        setDocuments([]);
        setTotalDocuments(0);
        return;
      }

      // Get patient ID first - try by user ID, then by email
      let patientId = user.id;
      let patientData = null;

      try {
        // First try to get patient by user ID
        const patientResponse = await apiClient.get(`/medical/patients/by-email/${encodeURIComponent(user.email || '')}`);
        if (patientResponse.statusCode === 200 && patientResponse.data) {
          patientData = patientResponse.data;
          patientId = patientData.id;
        }
      } catch (error) {
        // If not found by email, use user ID as patient ID
        patientId = user.id;
      }

      // Fetch all EMR documents for the patient
      const response = await apiClient.getPatientDocuments(patientId);

      if (response.statusCode === 200 && response.data) {
        // response.data is array of documents
        const documents = Array.isArray(response.data) ? response.data : [];
        
        // Map backend data to frontend format with enhanced EMR document information
        const mappedDocuments = documents.map((doc: any) => ({
          ...doc,
          fileName: doc.documentTitle || `${doc.documentType}_${doc.id}`,
          fileSize: doc.content ? doc.content.length : 0,
          downloadCount: 0,
          doctorName: doc.issuedBy || 'ไม่ระบุ',
          department: doc.department || 'ไม่ระบุ',
          tags: doc.tags || [],
          // Enhanced EMR-specific fields
          visitId: doc.visitId,
          recordType: doc.recordType,
          template: doc.template,
          variables: doc.variables,
          attachments: doc.attachments || [],
          validUntil: doc.validUntil,
          recipientInfo: doc.recipientInfo
        }));

        // Apply search and filters
        let filteredDocuments = mappedDocuments;

        // Apply search query
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          filteredDocuments = filteredDocuments.filter(doc => 
            doc.documentTitle?.toLowerCase().includes(query) ||
            doc.documentType?.toLowerCase().includes(query) ||
            doc.issuedBy?.toLowerCase().includes(query) ||
            doc.department?.toLowerCase().includes(query)
          );
        }

        // Apply document type filter
        if (filters.documentType) {
          filteredDocuments = filteredDocuments.filter(doc => 
            doc.documentType === filters.documentType
          );
        }

        // Apply date filters
        if (filters.dateFrom) {
          filteredDocuments = filteredDocuments.filter(doc => {
            const docDate = new Date(doc.issuedDate || doc.created_at);
            const fromDate = new Date(filters.dateFrom);
            return docDate >= fromDate;
          });
        }

        if (filters.dateTo) {
          filteredDocuments = filteredDocuments.filter(doc => {
            const docDate = new Date(doc.issuedDate || doc.created_at);
            const toDate = new Date(filters.dateTo);
            toDate.setHours(23, 59, 59, 999); // End of day
            return docDate <= toDate;
          });
        }

        // Apply pagination
        const startIndex = ((filters.page || 1) - 1) * (filters.limit || 20);
        const endIndex = startIndex + (filters.limit || 20);
        const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);

        setDocuments(paginatedDocuments);
        setTotalDocuments(filteredDocuments.length);
      } else if (response.statusCode === 404) {
        // Patient not found in EMR system
        setDocuments([]);
        setTotalDocuments(0);
      } else {
        setDocuments([]);
        setTotalDocuments(0);
      }
    } catch (error: any) {
      logger.error('Error loading patient documents:', error);
      
      // Check if it's a 404 error (patient not found)
      if (error?.response?.status === 404 || error?.statusCode === 404) {
        // Patient not found in EMR system - this is expected for new users
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
    // loadDocuments will be called automatically by useEffect when filters change
  };

  const handleFilterChange = (key: keyof DocumentSearchQuery, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleDownload = async (doc: PatientDocument) => {
    try {
      // สร้างไฟล์จากเนื้อหาเอกสาร
      const content = doc.content || 'ไม่มีเนื้อหา';
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${doc.documentTitle || doc.documentType}_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      logger.info('Document downloaded successfully');
    } catch (error) {
      logger.error('Error downloading document:', error);
      alert('ไม่สามารถดาวน์โหลดเอกสารได้');
    }
  };

  const handleViewOnline = async (doc: PatientDocument) => {
    try {
      // สำหรับเอกสารที่เก็บใน medical_records เราแสดงเนื้อหาใน modal
      setSelectedDocument(doc);
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
      'blood_': '🩸',
      'nurse_visit': '👩‍⚕️',
      'medication': '💉',
      'procedure': '🔬',
      'discharge_summary': '📋',
      'admission_note': '🏥',
      'progress_note': '📈',
      'consultation': '👥',
      'emergency_note': '🚨',
      'surgery_note': '⚕️',
      'radiology_report': '📊',
      'pathology_report': '🔬'
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
      'blood_': 'ผลตรวจเลือด',
      'nurse_visit': 'รายงานการเยี่ยมโดยพยาบาล',
      'medication': 'บันทึกการให้ยา',
      'procedure': 'บันทึกการทำหัตถการ',
      'discharge_summary': 'สรุปการจำหน่าย',
      'admission_note': 'บันทึกการรับไว้รักษา',
      'progress_note': 'บันทึกความคืบหน้า',
      'consultation': 'บันทึกการปรึกษา',
      'emergency_note': 'บันทึกฉุกเฉิน',
      'surgery_note': 'บันทึกการผ่าตัด',
      'radiology_report': 'รายงานรังสีวิทยา',
      'pathology_report': 'รายงานพยาธิวิทยา'
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

  const formatDateTime = (daring: string) => {
    return new Date(daring).toLocaleString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AppLayout title="เอกสารทางการแพทย์" userType="patient">
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="h-6 w-6 text-blue-600" />
                  เอกสารทางการแพทย์ของฉัน
                </h1>
                <p className="text-gray-600 mt-1">
                  เอกสารทั้งหมดที่เกี่ยวข้องกับการรักษาของคุณ ({totalDocuments} เอกสาร)
                </p>
                {totalDocuments > 0 && (
                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>เอกสารพร้อมใช้งาน</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-600">
                      <FileText className="h-4 w-4" />
                      <span>ประเภทเอกสาร: {new Set(documents.map(d => d.documentType)).size} ประเภท</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
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
                <option value="nurse_visit">รายงานการเยี่ยมโดยพยาบาล</option>
                <option value="medication">บันทึกการให้ยา</option>
                <option value="procedure">บันทึกการทำหัตถการ</option>
                <option value="discharge_summary">สรุปการจำหน่าย</option>
                <option value="admission_note">บันทึกการรับไว้รักษา</option>
                <option value="progress_note">บันทึกความคืบหน้า</option>
                <option value="consultation">บันทึกการปรึกษา</option>
                <option value="emergency_note">บันทึกฉุกเฉิน</option>
                <option value="surgery_note">บันทึกการผ่าตัด</option>
                <option value="radiology_report">รายงานรังสีวิทยา</option>
                <option value="pathology_report">รายงานพยาธิวิทยา</option>
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
          <div className="bg-white rounded-xl border border-slate-200 p-12 shadow-sm">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 shadow-sm">
            <div className="text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่มีเอกสาร</h3>
              <p className="text-gray-500 mb-4">ยังไม่มีเอกสารทางการแพทย์ในระบบ</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-blue-800">
                  เอกสารจะปรากฏที่นี่เมื่อแพทย์หรือเจ้าหน้าที่สร้างเอกสารทางการแพทย์ให้คุณ
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((document) => (
              <div key={document.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
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
                      <span>{formatDateTime(document.issuedDate || document.created_at)}</span>
                    </div>
                    
                    {document.issuedBy && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        <span>{document.issuedBy}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Stethoscope className="h-4 w-4" />
                      <span>{document.department || 'ไม่ระบุ'}</span>
                    </div>

                    {document.visitId && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>การเยี่ยม: {document.visitId.substring(0, 8)}...</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <File className="h-4 w-4" />
                      <span>{formatFileSize(document.fileSize || 0)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Tag className="h-4 w-4" />
                      <span>สถานะ: {document.status}</span>
                    </div>

                    {document.recordType && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FileText className="h-4 w-4" />
                        <span>ประเภทบันทึก: {document.recordType}</span>
                      </div>
                    )}
                  </div>

                  {document.tags && document.tags.length > 0 && (
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
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex justify-center">
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
          </div>
        )}

        {/* Document View Modal */}
        {selectedDocument && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-300 shadow-lg">
              {/* Header Bar */}
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 rounded-t-lg">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-gray-600" />
                    <h2 className="text-xl font-bold text-gray-900">{selectedDocument.documentTitle}</h2>
                  </div>
                  <button
                    onClick={() => setSelectedDocument(null)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <span className="sr-only">ปิด</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                {/* Document Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-500" />
                    <span className="font-medium">ประเภท:</span>
                    <span>{getDocumentTypeLabel(selectedDocument.documentType)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <span className="font-medium">วันที่ออก:</span>
                    <span>{formatDateTime(selectedDocument.issuedDate || selectedDocument.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-gray-500" />
                    <span className="font-medium">ผู้ออก:</span>
                    <span>{selectedDocument.issuedBy}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-gray-500" />
                    <span className="font-medium">สถานะ:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedDocument.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedDocument.status === 'completed' ? 'เสร็จสิ้น' : selectedDocument.status}
                    </span>
                  </div>
                </div>

                {/* Document Content */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    เนื้อหาเอกสาร
                  </h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                      {selectedDocument.content}
                    </pre>
                  </div>
                </div>

                {/* Notes */}
                {selectedDocument.notes && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">หมายเหตุ</h3>
                    <p className="text-gray-600">{selectedDocument.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setSelectedDocument(null)}
                    className="px-6 py-2 text-gray-600 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-medium"
                  >
                    ปิด
                  </button>
                  <button
                    onClick={() => handleDownload(selectedDocument)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors font-medium shadow-md hover:shadow-lg"
                  >
                    <Download className="h-4 w-4" />
                    ดาวน์โหลด
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}