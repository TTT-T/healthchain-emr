"use client";
import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { CheckCircle, AlertCircle, FileText, Calendar, User, Download, Eye, Upload, Search, Filter, RefreshCw } from "lucide-react";

interface MedicalDocument {
  id: string;
  title: string;
  category: 'lab-results' | 'prescriptions' | 'certificates' | 'imaging' | 'reports' | 'consent' | 'discharge' | 'insurance' | 'other';
  dateCreated: string;
  dateModified: string;
  size: number;
  format: string;
  status: 'draft' | 'pending' | 'completed' | 'cancelled' | 'expired';
  physician: {
    name: string;
    specialty: string;
    department: string;
  };
  description: string;
  url: string;
  patientId: string;
  visitId?: string;
}

export default function MedicalDocuments() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<MedicalDocument | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchDocuments();
    }
  }, [user]);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (user?.id) {
        const response = await apiClient.getPatientDocuments(user.id);
        if (response.success && response.data) {
          setDocuments(response.data);
        } else {
          setError(response.error?.message || "ไม่สามารถดึงข้อมูลเอกสารได้");
        }
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูลเอกสาร");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDocuments = documents.filter(document => {
    const matchesSearch = document.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.physician.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || document.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || document.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
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
      case 'lab-results': return 'ผลตรวจทางห้องปฏิบัติการ';
      case 'prescriptions': return 'ใบสั่งยา';
      case 'certificates': return 'ใบรับรองแพทย์';
      case 'imaging': return 'ภาพถ่ายทางการแพทย์';
      case 'reports': return 'รายงานแพทย์';
      case 'consent': return 'ใบยินยอม';
      case 'discharge': return 'ใบสรุปการรักษา';
      case 'insurance': return 'เอกสารประกัน';
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
    console.log('Downloading document:', document.id);
    alert(`กำลังดาวน์โหลด: ${document.title}`);
  };

  const handleUpload = () => {
    setIsUploadModalOpen(true);
  };

  return (
    <AppLayout title="เอกสารแพทย์">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">เอกสารแพทย์</h1>
            <p className="text-gray-800 mt-1">จัดเก็บและจัดการเอกสารทางการแพทย์ของคุณ</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <Upload className="h-4 w-4" />
              อัปโหลดเอกสาร
            </button>
            <button
              onClick={fetchDocuments}
              disabled={isLoading}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              รีเฟรช
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-800">กำลังโหลดข้อมูล...</span>
            </div>
          </div>
        )}

        {/* Documents Grid */}
        {!isLoading && !error && (
          <div className="grid gap-4">
            {filteredDocuments.map((document) => (
              <div
                key={document.id}
                className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{document.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                          {getStatusText(document.status)}
                        </span>
                      </div>
                      
                      <p className="text-gray-800 mb-3">{document.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-700">หมวดหมู่:</span>
                          <span className="ml-1 font-medium">{getCategoryText(document.category)}</span>
                        </div>
                        <div>
                          <span className="text-gray-700">วันที่สร้าง:</span>
                          <span className="ml-1 font-medium">{new Date(document.dateCreated).toLocaleDateString('th-TH')}</span>
                        </div>
                        <div>
                          <span className="text-gray-700">ขนาดไฟล์:</span>
                          <span className="ml-1 font-medium">{formatFileSize(document.size)}</span>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex items-center gap-2 text-sm text-gray-700">
                        <User className="h-4 w-4" />
                        <span>{document.physician.name}</span>
                        <span>({document.physician.specialty})</span>
                      </div>
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
          <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบเอกสาร</h3>
            <p className="text-gray-800 mb-4">ยังไม่มีเอกสารในระบบ</p>
            <button
              onClick={handleUpload}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mx-auto"
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
                  <h2 className="text-2xl font-bold text-gray-900">{selectedDocument.title}</h2>
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
                        <span className="ml-1">{getCategoryText(selectedDocument.category)}</span>
                      </div>
                      <div>
                        <span className="text-gray-700">รูปแบบ:</span>
                        <span className="ml-1">{selectedDocument.format}</span>
                      </div>
                      <div>
                        <span className="text-gray-700">ขนาดไฟล์:</span>
                        <span className="ml-1">{formatFileSize(selectedDocument.size)}</span>
                      </div>
                      <div>
                        <span className="text-gray-700">สถานะ:</span>
                        <span className="ml-1">{getStatusText(selectedDocument.status)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">แพทย์ผู้ดูแล</h3>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-gray-700" />
                      <span>{selectedDocument.physician.name}</span>
                      <span className="text-gray-700">({selectedDocument.physician.specialty})</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">คำอธิบาย</h3>
                    <p className="text-sm text-gray-700">{selectedDocument.description}</p>
                  </div>

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
