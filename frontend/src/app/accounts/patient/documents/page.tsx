"use client";
import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { AlertCircle, FileText, User, Download, Upload, RefreshCw, Eye } from "lucide-react";
import { logger } from '@/lib/logger';

interface MedicalDocument {
  id: string;
  document_name: string;
  document_type: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  description?: string;
  tags: string[];
  is_confidential: boolean;
  upload_date: string;
  created_at: string;
  updated_at: string;
  uploaded_by: {
    name: string;
  };
  visit?: {
    number: string;
    date: string;
  } | null;
}

export default function MedicalDocuments() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [selectedCategory] = useState("all");
  const [selectedStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<MedicalDocument | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const fetchDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (user?.id) {
        const response = await apiClient.getPatientDocuments(user.id);
        if (response.statusCode === 200 && response.data) {
          // ตรวจสอบว่าข้อมูลเป็น array หรือไม่
          const documentsData = response.data;
          if (Array.isArray(documentsData)) {
            setDocuments(documentsData as unknown as MedicalDocument[]);
          } else if (documentsData && typeof documentsData === 'object' && Array.isArray((documentsData as any).documents)) {
            // กรณีที่ข้อมูลอยู่ใน documents property (ตามโครงสร้าง backend)
            setDocuments((documentsData as any).documents as unknown as MedicalDocument[]);
          } else {
            // ถ้าไม่มีข้อมูลหรือไม่ใช่ array ให้ตั้งเป็น array ว่าง
            setDocuments([]);
            logger.warn('Documents data is not an array:', documentsData);
          }
        } else {
          setError(response.error?.message || "ไม่สามารถดึงข้อมูลเอกสารได้");
        }
      }
    } catch (err) {
      logger.error("Error fetching documents:", err);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูลเอกสาร");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchDocuments();
    }
  }, [user, fetchDocuments]);

  const filteredDocuments = documents.filter(document => {
    const matchesSearch = document.document_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (document.description && document.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         document.uploaded_by.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || document.document_type === selectedCategory;
    // Note: status matching removed as backend doesn't have status field for documents
    
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'draft': return 'text-gray-800 bg-gray-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      case 'expired': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-800 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'เสร็จสิ้น';
      case 'pending': return 'รอดำเนินการ';
      case 'draft': return 'ร่าง';
      case 'cancelled': return 'ยกเลิก';
      case 'expired': return 'หมดอายุ';
      default: return status;
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'lab_result': return 'ผลตรวจทางห้องปฏิบัติการ';
      case 'prescription': return 'ใบสั่งยา';
      case 'medical_certificate': return 'ใบรับรองแพทย์';
      case 'imaging': return 'ภาพถ่ายทางการแพทย์';
      case 'medical_report': return 'รายงานการรักษา';
      case 'consent_form': return 'เอกสารความยินยอม';
      case 'discharge_summary': return 'ใบสรุปการรักษา';
      case 'insurance': return 'เอกสารประกันสุขภาพ';
      case 'referral': return 'ใบส่งตัว';
      case 'vaccination': return 'ใบรับรองการฉีดวัคซีน';
      case 'other': return 'อื่นๆ';
      default: return category;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDocumentClick = (document: MedicalDocument) => {
    setSelectedDocument(document);
    setIsModalOpen(true);
  };

  const handleDownload = (document: MedicalDocument) => {
    logger.debug('Downloading document:', document.id);
    alert(`กำลังดาวน์โหลด: ${document.document_name}`);
  };

  const handleUpload = () => {
    setIsUploadModalOpen(true);
  };

  return (
    <AppLayout title="เอกสารแพทย์" userType="patient">
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">เอกสารแพทย์</h1>
              <p className="text-gray-600 mt-1">จัดเก็บและจัดการเอกสารทางการแพทย์ของคุณ</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleUpload}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Upload className="h-4 w-4" />
                อัปโหลดเอกสาร
              </button>
              <button
                onClick={fetchDocuments}
                disabled={isLoading}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                รีเฟรช
              </button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-200">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">กำลังโหลดข้อมูล...</span>
            </div>
          </div>
        )}

        {/* Documents Grid */}
        {!isLoading && !error && (
          <div className="grid gap-4">
            {filteredDocuments.map((document) => (
              <div
                key={document.id}
                className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{document.document_name}</h3>
                        {document.is_confidential && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                            ความลับ
                          </span>
                        )}
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                          {document.mime_type.split('/')[1]?.toUpperCase() || 'FILE'}
                        </span>
                      </div>
                      
                      {document.description && (
                        <p className="text-gray-800 mb-3">{document.description}</p>
                      )}
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-700">หมวดหมู่:</span>
                          <span className="ml-1 font-medium">{getCategoryText(document.document_type)}</span>
                        </div>
                        <div>
                          <span className="text-gray-700">วันที่อัปโหลด:</span>
                          <span className="ml-1 font-medium">{new Date(document.upload_date).toLocaleDateString('th-TH')}</span>
                        </div>
                        <div>
                          <span className="text-gray-700">ขนาดไฟล์:</span>
                          <span className="ml-1 font-medium">{formatFileSize(document.file_size)}</span>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex items-center gap-2 text-sm text-gray-700">
                        <User className="h-4 w-4" />
                        <span>อัปโหลดโดย: {document.uploaded_by.name}</span>
                      </div>
                      
                      {document.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {document.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {document.visit && (
                        <div className="mt-2 text-sm text-gray-700">
                          <span>เข้ารับการรักษาครั้งที่: {document.visit.number} ({new Date(document.visit.date).toLocaleDateString('th-TH')})</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDocumentClick(document)}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      ดูรายละเอียด
                    </button>
                    <button
                      onClick={() => handleDownload(document)}
                      className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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

        {/* No Results */}
        {!isLoading && !error && filteredDocuments.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-200 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบเอกสาร</h3>
            <p className="text-gray-600 mb-4">ยังไม่มีเอกสารในระบบ</p>
            <button
              onClick={handleUpload}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mx-auto transition-colors"
            >
              <Upload className="h-4 w-4" />
              อัปโหลดเอกสารแรก
            </button>
          </div>
        )}

        {/* Modal for Document Details */}
        {isModalOpen && selectedDocument && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedDocument.document_name}</h2>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-700 hover:text-gray-900"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">ข้อมูลเอกสาร</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-700">หมวดหมู่:</span>
                        <span className="ml-1">{getCategoryText(selectedDocument.document_type)}</span>
                      </div>
                      <div>
                        <span className="text-gray-700">รูปแบบ:</span>
                        <span className="ml-1">{selectedDocument.mime_type}</span>
                      </div>
                      <div>
                        <span className="text-gray-700">ขนาดไฟล์:</span>
                        <span className="ml-1">{formatFileSize(selectedDocument.file_size)}</span>
                      </div>
                      <div>
                        <span className="text-gray-700">วันที่อัปโหลด:</span>
                        <span className="ml-1">{new Date(selectedDocument.upload_date).toLocaleDateString('th-TH')}</span>
                      </div>
                      {selectedDocument.is_confidential && (
                        <div>
                          <span className="text-gray-700">สถานะ:</span>
                          <span className="ml-1 text-red-600 font-medium">เอกสารความลับ</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">ผู้อัปโหลด</h3>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-gray-700" />
                      <span>{selectedDocument.uploaded_by.name}</span>
                    </div>
                  </div>

                  {selectedDocument.tags.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">แท็ก</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedDocument.tags.map((tag, index) => (
                          <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedDocument.visit && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">การเข้ารับการรักษา</h3>
                      <div className="text-sm">
                        <span>ครั้งที่: {selectedDocument.visit.number}</span>
                        <span className="ml-4">วันที่: {new Date(selectedDocument.visit.date).toLocaleDateString('th-TH')}</span>
                      </div>
                    </div>
                  )}

                  {selectedDocument.description && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">คำอธิบาย</h3>
                      <p className="text-sm text-gray-700">{selectedDocument.description}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => handleDownload(selectedDocument)}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      <Download className="h-4 w-4" />
                      ดาวน์โหลด
                    </button>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                    >
                      ปิด
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Modal */}
        {isUploadModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">อัปโหลดเอกสาร</h2>
                <div className="text-center py-8">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-800 mb-4">คุณสมบัติการอัปโหลดเอกสารยังไม่พร้อมใช้งาน</p>
                  <p className="text-sm text-gray-700">กรุณาติดต่อแพทย์หรือเจ้าหน้าที่เพื่อช่วยเหลือ</p>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setIsUploadModalOpen(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    ปิด
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
