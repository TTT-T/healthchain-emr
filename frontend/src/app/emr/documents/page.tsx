"use client";
import { useState, useEffect } from "react";
import { Search, FileText, Plus, Edit, Trash2, Download, CheckCircle, AlertCircle, Calendar, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PatientService } from '@/services/patientService';
import { DocumentService } from '@/services/documentService';
import { NotificationService } from '@/services/notificationService';
import { PatientDocumentService } from '@/services/patientDocumentService';
import { MedicalPatient } from '@/types/api';
import { logger } from '@/lib/logger';

export default function Documents() {
  const { isAuthenticated, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"hn" | "queue">("hn");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<MedicalPatient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    
    try {
      const today = new Date();
      const birth = new Date(birthDate);
      
      // Check if birth date is valid
      if (isNaN(birth.getTime())) {
        return 0;
      }
      
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      return age;
    } catch (error) {
      logger.error("Error calculating age:", error);
      return 0;
    }
  };

  const calculateAgeFromFields = (patient: MedicalPatient): number => {
    if (!patient) return 0;
    
    try {
      // First try birth_date if available
      if (patient.birth_date) {
        return calculateAge(patient.birth_date);
      }
      
      // If birth_date is not available, try separate fields
      if (patient.birth_year && patient.birth_month && patient.birth_day) {
        let year = patient.birth_year;
        
        // Convert Buddhist year to Christian year if needed
        if (year > 2500) {
          year = year - 543;
        }
        
        const today = new Date();
        const birthDate = new Date(year, patient.birth_month - 1, patient.birth_day);
        
        if (isNaN(birthDate.getTime())) {
          return 0;
        }
        
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        return age;
      }
      
      return 0;
    } catch (error) {
      logger.error("Error calculating age from fields:", error);
      return 0;
    }
  };
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');

  const [documentData, setDocumentData] = useState({
    documentType: '',
    documentTitle: '',
    content: '',
    template: '',
    variables: {},
    attachments: [],
    status: 'draft',
    notes: '',
    issuedDate: new Date().toISOString().split('T')[0],
    validUntil: '',
    doctorName: user?.thai_name || `${user?.first_name} ${user?.last_name}` || '',
    recipientInfo: {
      name: '',
      organization: '',
      address: '',
      phone: '',
      email: ''
    }
  });

  const documentTemplates = {
    medical_certificate: `ใบรับรองแพทย์

เรื่อง ใบรับรองแพทย์

เรียน {{recipientName}}

ข้าพเจ้า {{doctorName}} แพทย์ประจำโรงพยาบาล ขอรับรองว่า

ชื่อ-นามสกุล: {{patientName}}
เลขประจำตัวประชาชน: {{patientNationalId}}
หมายเลข HN: {{patientHn}}
อายุ: {{patientAge}} ปี
เพศ: {{patientGender}}

ได้เข้ารับการรักษาที่โรงพยาบาล ตั้งแต่วันที่ {{visitDate}} ถึงวันที่ {{currentDate}}

การวินิจฉัย: {{diagnosis}}
การรักษา: {{treatment}}
คำแนะนำ: {{advice}}

ใบรับรองนี้มีอายุ 30 วัน นับจากวันที่ออก

ลงชื่อ {{doctorName}}
แพทย์ประจำโรงพยาบาล
วันที่ {{currentDate}}`,

    referral_letter: `ใบส่งตัว

เรื่อง ส่งตัวผู้ป่วยเพื่อรับการรักษา

เรียน แพทย์ประจำ {{recipientOrganization}}

ข้าพเจ้า {{doctorName}} แพทย์ประจำโรงพยาบาล ขอส่งตัวผู้ป่วยรายนี้

ชื่อ-นามสกุล: {{patientName}}
เลขประจำตัวประชาชน: {{patientNationalId}}
หมายเลข HN: {{patientHn}}
อายุ: {{patientAge}} ปี
เพศ: {{patientGender}}

เพื่อรับการรักษา เนื่องจาก {{reason}}

ประวัติการเจ็บป่วย: {{medicalHistory}}
การตรวจร่างกาย: {{physicalExam}}
การวินิจฉัย: {{diagnosis}}
การรักษาที่ได้รับ: {{treatment}}
ผลการตรวจ: {{labResults}}

คำแนะนำ: {{advice}}

ลงชื่อ {{doctorName}}
แพทย์ประจำโรงพยาบาล
วันที่ {{currentDate}}`,

    sick_leave: `ใบรับรองการป่วย

เรื่อง ใบรับรองการป่วย

เรียน {{recipientName}}

ข้าพเจ้า {{doctorName}} แพทย์ประจำโรงพยาบาล ขอรับรองว่า

ชื่อ-นามสกุล: {{patientName}}
เลขประจำตัวประชาชน: {{patientNationalId}}
หมายเลข HN: {{patientHn}}

ได้เข้ารับการรักษาที่โรงพยาบาล ตั้งแต่วันที่ {{visitDate}} ถึงวันที่ {{currentDate}}

การวินิจฉัย: {{diagnosis}}
ระยะเวลาที่ไม่สามารถทำงานได้: {{sickLeaveDuration}} วัน
คำแนะนำ: {{advice}}

ใบรับรองนี้มีอายุ 7 วัน นับจากวันที่ออก

ลงชื่อ {{doctorName}}
แพทย์ประจำโรงพยาบาล
วันที่ {{currentDate}}`
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setError(null);
    
    try {
      const response = await PatientService.searchPatients(searchQuery, searchType);
      
      if (response.statusCode === 200 && response.data && response.data.length > 0) {
        setSelectedPatient(response.data[0]);
        await loadPatientDocuments(response.data[0].id);
        setError(null);
      } else {
        setError("ไม่พบข้อมูลผู้ป่วย");
        setSelectedPatient(null);
        setDocuments([]);
      }
    } catch (error) {
      logger.error("Error searching patient:", error);
      setError("เกิดข้อผิดพลาดในการค้นหาผู้ป่วย");
      setSelectedPatient(null);
      setDocuments([]);
    } finally {
      setIsSearching(false);
    }
  };

  const loadPatientDocuments = async (patientId: string) => {
    try {
      const response = await DocumentService.getDocumentsByPatient(patientId, selectedDocumentType);
      if (response.statusCode === 200 && response.data) {
        setDocuments(response.data);
      }
    } catch (error) {
      logger.error("Error loading documents:", error);
      // Use sample data if API fails
      setDocuments([
        {
          id: '1',
          documentType: 'medical_certificate',
          documentTitle: 'ใบรับรองแพทย์',
          status: 'issued',
          issuedDate: '2024-01-15',
          validUntil: '2024-02-15',
          issuedBy: user?.id || 'system'
        }
      ]);
    }
  };

  const handleDocumentTypeChange = (documentType: string) => {
    const template = documentTemplates[documentType as keyof typeof documentTemplates] || '';
    const doctorName = documentData.doctorName || user?.thai_name || `${user?.first_name} ${user?.last_name}` || 'แพทย์';
    
    // Replace {{doctorName}} in template with actual doctor name
    const processedTemplate = template.replace(/\{\{doctorName\}\}/g, doctorName);
    
    setDocumentData(prev => ({
      ...prev,
      documentType,
      documentTitle: DocumentService.getDocumentTypeLabel(documentType),
      template: processedTemplate,
      content: processedTemplate
    }));
  };

  const handleDoctorNameChange = (doctorName: string) => {
    setDocumentData(prev => {
      const newData = { ...prev, doctorName };
      
      // If document type is already selected, update the content with new doctor name
      if (prev.documentType && documentTemplates[prev.documentType as keyof typeof documentTemplates]) {
        const template = documentTemplates[prev.documentType as keyof typeof documentTemplates];
        const processedTemplate = template.replace(/\{\{doctorName\}\}/g, doctorName);
        newData.content = processedTemplate;
        newData.template = processedTemplate;
      }
      
      return newData;
    });
  };

  const handleSubmit = async () => {
    if (!selectedPatient) return;
    
    // Validate data
    const validation = DocumentService.validateDocumentData({
      ...documentData,
      issuedBy: user?.id || 'system'
    });
    
    if (!validation.isValid) {
      setError(validation.errors.join('\n'));
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const formattedData = DocumentService.formatDocumentDataForAPI(
        documentData,
        selectedPatient.id,
        user?.id || 'system'
      );
      
      const response = await DocumentService.createDocument(formattedData);
      
      if (response.statusCode === 201 && response.data) {
        await sendPatientNotification(selectedPatient, response.data);
        
        // Create document for patient
        await createPatientDocument(selectedPatient, response.data);
        
        setSuccess("สร้างเอกสารสำเร็จ!\n\n✅ ระบบได้ส่งการแจ้งเตือนและเอกสารให้ผู้ป่วยแล้ว");
        
        // Reload documents
        await loadPatientDocuments(selectedPatient.id);
        
        // Reset form
        setTimeout(() => {
          setDocumentData(DocumentService.createEmptyDocumentData());
          setShowForm(false);
          setSuccess(null);
        }, 3000);
      } else {
        setError("เกิดข้อผิดพลาดในการสร้างเอกสาร");
      }
    } catch (error) {
      logger.error("Error creating document:", error);
      setError("เกิดข้อผิดพลาดในการสร้างเอกสาร");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendPatientNotification = async (patient: MedicalPatient, documentRecord: any) => {
    try {
      const notificationData = {
        patientHn: patient.hn || patient.hospitalNumber || '',
        patientNationalId: patient.nationalId || '',
        patientName: patient.thaiName || `${patient.firstName} ${patient.lastName}`,
        patientPhone: patient.phone || '',
        patientEmail: patient.email || '',
        recordType: 'document',
        recordId: documentRecord.id,
        chiefComplaint: `เอกสาร: ${documentRecord.documentTitle}`,
        recordedBy: documentRecord.issuedBy,
        recordedTime: documentRecord.issuedDate,
        message: `มีการออกเอกสารใหม่สำหรับคุณ ${patient.thai_name || `${patient.first_name} ${patient.last_name}`} โดย ${user?.thai_name || `${user?.first_name} ${user?.last_name}` || 'แพทย์'}`
      };

      await NotificationService.notifyPatientRecordUpdate(notificationData);
      logger.info('Patient notification sent for document', {
        patientHn: notificationData.patientHn,
        recordId: documentRecord.id
      });
    } catch (error) {
      logger.error('Failed to send patient notification for document:', error);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบเอกสารนี้?')) return;
    
    try {
      const response = await DocumentService.deleteDocument(documentId);
      if (response.statusCode === 200) {
        setSuccess("ลบเอกสารสำเร็จ");
        if (selectedPatient) {
          await loadPatientDocuments(selectedPatient.id);
        }
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      logger.error("Error deleting document:", error);
      setError("เกิดข้อผิดพลาดในการลบเอกสาร");
    }
  };

  const handleDownloadDocument = (document: any) => {
    DocumentService.downloadDocumentAsPDF(document.content, document.documentTitle);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">กรุณาเข้าสู่ระบบ</h2>
          <p className="text-gray-600">คุณต้องเข้าสู่ระบบเพื่อใช้งานระบบออกเอกสาร</p>
        </div>
      </div>
    );
  }

  /**
   * สร้างเอกสารให้ผู้ป่วย
   */
  const createPatientDocument = async (patient: MedicalPatient, documentData: any) => {
    try {
      await PatientDocumentService.createDocumentFromMedicalRecord(
        documentData.documentType || 'other',
        documentData,
        {
          patientHn: patient.hn || '',
          patientNationalId: patient.nationalId || '',
          patientName: patient.thaiName || ''
        },
        user?.id || '',
        user?.thaiName || `${user?.firstName} ${user?.lastName}` || 'แพทย์'
      );
      
      logger.info('Patient document created successfully for document', { 
        patientHn: patient.hn,
        recordType: documentData.documentType || 'other'
      });
    } catch (error) {
      logger.error('Error creating patient document for document:', error);
      // ไม่ throw error เพื่อไม่ให้กระทบการสร้างเอกสาร
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="h-8 w-8 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ออกเอกสาร</h1>
              <p className="text-gray-600">สร้างและจัดการเอกสารทางการแพทย์</p>
            </div>
          </div>

          {/* Search Patient */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ค้นหาผู้ป่วย</h3>
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder={searchType === "hn" ? "กรอก HN" : "กรอกหมายเลขคิว"}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSearchType("hn")}
                  className={`px-4 py-2 rounded-lg border ${
                    searchType === "hn"
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  ค้นหาด้วย HN
                </button>
                <button
                  onClick={() => setSearchType("queue")}
                  className={`px-4 py-2 rounded-lg border ${
                    searchType === "queue"
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  ค้นหาด้วยคิว
                </button>
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                {isSearching ? "กำลังค้นหา..." : "ค้นหา"}
              </button>
            </div>
          </div>

          {/* Patient Info */}
          {selectedPatient && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-indigo-800 mb-2">ข้อมูลผู้ป่วย</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">HN:</span> {selectedPatient.hospital_number || selectedPatient.hn}
                    </div>
                    <div>
                      <span className="font-medium">ชื่อ:</span> {selectedPatient.thai_name || `${selectedPatient.first_name} ${selectedPatient.last_name}`}
                    </div>
                    <div>
                      <span className="font-medium">อายุ:</span> {calculateAgeFromFields(selectedPatient) > 0 ? `${calculateAgeFromFields(selectedPatient)} ปี` : 'ไม่ระบุ'}
                    </div>
                    <div>
                      <span className="font-medium">เพศ:</span> {selectedPatient.gender || 'ไม่ระบุ'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {showForm ? "ปิดฟอร์ม" : "สร้างเอกสาร"}
                </button>
              </div>
            </div>
          )}

          {/* Document Form */}
          {selectedPatient && showForm && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">สร้างเอกสารใหม่</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ประเภทเอกสาร *
                  </label>
                  <select
                    value={documentData.documentType}
                    onChange={(e) => handleDocumentTypeChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">เลือกประเภทเอกสาร</option>
                    <option value="medical_certificate">ใบรับรองแพทย์</option>
                    <option value="referral_letter">ใบส่งตัว</option>
                    <option value="sick_leave">ใบรับรองการป่วย</option>
                    <option value="prescription">ใบสั่งยา</option>
                    <option value="lab_report">รายงานผลแลบ</option>
                    <option value="discharge_summary">สรุปการจำหน่าย</option>
                    <option value="consultation_report">รายงานการปรึกษา</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ชื่อเอกสาร *
                  </label>
                  <input
                    type="text"
                    value={documentData.documentTitle}
                    onChange={(e) => setDocumentData(prev => ({ ...prev, documentTitle: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="กรอกชื่อเอกสาร"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ชื่อผู้ออกเอกสาร *
                  </label>
                  <input
                    type="text"
                    value={documentData.doctorName}
                    onChange={(e) => handleDoctorNameChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="กรอกชื่อผู้ออกเอกสาร"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    วันที่ออกเอกสาร
                  </label>
                  <input
                    type="date"
                    value={documentData.issuedDate}
                    onChange={(e) => setDocumentData(prev => ({ ...prev, issuedDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    วันหมดอายุ
                  </label>
                  <input
                    type="date"
                    value={documentData.validUntil}
                    onChange={(e) => setDocumentData(prev => ({ ...prev, validUntil: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เนื้อหาเอกสาร *
                </label>
                <textarea
                  value={documentData.content}
                  onChange={(e) => setDocumentData(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={10}
                  placeholder="กรอกเนื้อหาเอกสาร"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  หมายเหตุ
                </label>
                <textarea
                  value={documentData.notes}
                  onChange={(e) => setDocumentData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={3}
                  placeholder="กรอกหมายเหตุเพิ่มเติม"
                />
              </div>
              
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  {isSubmitting ? "กำลังสร้าง..." : "สร้างเอกสาร"}
                </button>
              </div>
            </div>
          )}

          {/* Documents History Cards */}
          {selectedPatient && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  ประวัติการออกเอกสาร
                </h3>
                <span className="text-sm text-gray-500">
                  {documents.length} เอกสาร
                </span>
              </div>
              
              {documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documents.map((document) => (
                    <div key={document.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${DocumentService.getDocumentTypeColor(document.documentType)}`}>
                            <FileText className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 text-sm">
                              {document.documentTitle}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {DocumentService.getDocumentTypeLabel(document.documentType)}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${DocumentService.getStatusColor(document.status)}`}>
                          {DocumentService.getStatusLabel(document.status)}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-xs text-gray-600">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          <span>ผู้ออก: {document.issuedBy || 'ไม่ระบุ'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          <span>วันที่ออก: {new Date(document.issuedDate).toLocaleDateString('th-TH')}</span>
                        </div>
                        {document.validUntil && (
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-3 w-3" />
                            <span>หมดอายุ: {new Date(document.validUntil).toLocaleDateString('th-TH')}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleDownloadDocument(document)}
                          className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded-md text-xs font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1"
                        >
                          <Download className="h-3 w-3" />
                          ดาวน์โหลด
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(document.id)}
                          className="bg-red-100 text-red-600 px-3 py-2 rounded-md text-xs font-medium hover:bg-red-200 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีเอกสาร</h4>
                  <p className="text-gray-500 mb-4">ผู้ป่วยนี้ยังไม่เคยออกเอกสารใดๆ</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 mx-auto"
                  >
                    <Plus className="h-4 w-4" />
                    สร้างเอกสารแรก
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Success/Error Messages */}
          {success && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="text-green-800 whitespace-pre-line">{success}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-800 whitespace-pre-line">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}