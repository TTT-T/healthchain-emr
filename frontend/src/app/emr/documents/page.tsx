'use client';

import React, { useState, useEffect } from 'react';
import { FileText, User, Printer, Save, Search, X, Edit3, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PatientService } from '@/services/patientService';
import { logger } from '@/lib/logger';

interface Patient {
  id: string;
  hn: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  address: string;
  nationalId: string;
}

interface Doctor {
  id: string;
  name: string;
  position: string;
  license: string;
  department: string;
}

interface DocumentFormData {
  patientId: string;
  documentType: 'medical_certificate' | 'referral_letter' | 'appointment_slip' | 'sick_leave' | 'medical_report' | 'other';
  issueDate: string;
  expiryDate: string;
  doctorId: string;
  purpose: string;
  content: string;
  medicalCondition: string;
  recommendations: string;
  referralTo: string;
  additionalNotes: string;
}

interface CreatedDocument {
  id: string;
  documentNumber: string;
  patient: Patient;
  doctor: Doctor;
  documentType: 'medical_certificate' | 'referral_letter' | 'appointment_slip' | 'sick_leave' | 'medical_report' | 'other';
  issueDate: string;
  expiryDate: string;
  purpose: string;
  content: string;
  medicalCondition: string;
  recommendations: string;
  referralTo: string;
  additionalNotes: string;
  createdAt: string;
  createdBy: string;
  status: 'draft' | 'issued' | 'printed';
}

export default function Documents() {
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<DocumentFormData>({
    patientId: '',
    documentType: 'medical_certificate',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    doctorId: '',
    purpose: '',
    content: '',
    medicalCondition: '',
    recommendations: '',
    referralTo: '',
    additionalNotes: ''
  });

  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [createdDocument, setCreatedDocument] = useState<CreatedDocument | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (isAuthenticated) {
      loadPatientsAndDoctors();
    }
  }, [isAuthenticated]);

  const loadPatientsAndDoctors = async () => {
    setIsLoadingPatients(true);
    setIsLoadingDoctors(true);
    setError(null);
    
    try {
      logger.debug('📋 Loading patients and doctors...');
      
      // Load patients
      const patientsResponse = await PatientService.searchPatients('', 'name');
      if (patientsResponse.data && Array.isArray(patientsResponse.data)) {
        const convertedPatients = patientsResponse.data.map((patient: any) => ({
          id: patient.id,
          hn: patient.hn,
          name: patient.thai_name || 'ไม่ระบุชื่อ',
          age: patient.age || 0,
          gender: patient.gender || 'ไม่ระบุ',
          phone: patient.phone || '',
          address: patient.address || '',
          nationalId: patient.national_id || ''
        }));
        setPatients(convertedPatients);
      }

      // Load doctors (mock for now since we don't have doctor API)
      const mockDoctors: Doctor[] = [
        { id: '1', name: 'นพ.สมชาย ใจดี', position: 'อายุรแพทย์', license: 'MD12345', department: 'อายุรกรรม' },
        { id: '2', name: 'นพ.สมหญิง รักษาดี', position: 'กุมารแพทย์', license: 'MD12346', department: 'กุมารเวชกรรม' },
        { id: '3', name: 'นพ.วิชัย เก่งการแพทย์', position: 'ศัลยแพทย์', license: 'MD12347', department: 'ศัลยกรรม' },
        { id: '4', name: 'พญ.นิตยา ชำนาญการ', position: 'สูติแพทย์', license: 'MD12348', department: 'สูติ-นรีเวช' }
      ];
      setDoctors(mockDoctors);
      
      logger.debug('✅ Patients and doctors loaded successfully');
    } catch (error) {
      logger.error('❌ Error loading patients and doctors:', error);
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setIsLoadingPatients(false);
      setIsLoadingDoctors(false);
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.hn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.nationalId.includes(searchTerm)
  );

  useEffect(() => {
    if (selectedPatient) {
      setFormData(prev => ({ ...prev, patientId: selectedPatient.id }));
    }
  }, [selectedPatient]);

  useEffect(() => {
    if (selectedDoctor) {
      setFormData(prev => ({ ...prev, doctorId: selectedDoctor.id }));
    }
  }, [selectedDoctor]);

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    if (!selectedPatient) {
      errors.patient = 'กรุณาเลือกผู้ป่วย';
    }

    if (!selectedDoctor) {
      errors.doctor = 'กรุณาเลือกแพทย์';
    }

    if (!formData.issueDate) {
      errors.issueDate = 'กรุณาเลือกวันที่ออกเอกสาร';
    }

    if (!formData.purpose.trim()) {
      errors.purpose = 'กรุณากรอกจุดประสงค์';
    }

    if (!formData.content.trim()) {
      errors.content = 'กรุณากรอกเนื้อหาเอกสาร';
    }

    if (formData.documentType === 'medical_certificate' && !formData.medicalCondition.trim()) {
      errors.medicalCondition = 'กรุณากรอกอาการ/การวินิจฉัย';
    }

    if (formData.documentType === 'referral_letter' && !formData.referralTo.trim()) {
      errors.referralTo = 'กรุณากรอกสถานที่ส่งต่อ';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      logger.debug('📄 Creating document...');
      
      // Generate document number
      const documentNumber = `DOC${new Date().getFullYear()}${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
      
      const newDocument: CreatedDocument = {
        id: documentNumber,
        documentNumber,
        patient: selectedPatient!,
        doctor: selectedDoctor!,
        documentType: formData.documentType,
        issueDate: formData.issueDate,
        expiryDate: formData.expiryDate,
        purpose: formData.purpose,
        content: formData.content,
        medicalCondition: formData.medicalCondition,
        recommendations: formData.recommendations,
        referralTo: formData.referralTo,
        additionalNotes: formData.additionalNotes,
        createdAt: new Date().toISOString(),
        createdBy: user?.thaiName || 'ไม่ระบุ',
        status: 'issued'
      };

      // TODO: Replace with real API call when document endpoint is available
      // await apiClient.createDocument(newDocument);
      
      setCreatedDocument(newDocument);
      setShowDocumentPreview(true);
      setSuccess(`สร้างเอกสารสำเร็จ! หมายเลขเอกสาร: ${documentNumber}`);
      
    } catch (error) {
      logger.error('❌ Error creating document:', error);
      setError('เกิดข้อผิดพลาดในการสร้างเอกสาร');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewDocument = () => {
    setSelectedPatient(null);
    setSelectedDoctor(null);
    setCreatedDocument(null);
    setShowDocumentPreview(false);
    setSearchTerm('');
    setFormData({
      patientId: '',
      documentType: 'medical_certificate',
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      doctorId: '',
      purpose: '',
      content: '',
      medicalCondition: '',
      recommendations: '',
      referralTo: '',
      additionalNotes: ''
    });
    setValidationErrors({});
    setError(null);
    setSuccess(null);
  };

  const handlePrint = () => {
    if (!createdDocument) return;
    
    const printContent = `
      ${getDocumentTypeLabel(createdDocument.documentType)}
      หมายเลขเอกสาร: ${createdDocument.documentNumber}
      
      ข้อมูลผู้ป่วย:
      ชื่อ: ${createdDocument.patient.name}
      HN: ${createdDocument.patient.hn}
      
      ข้อมูลแพทย์:
      ชื่อ: ${createdDocument.doctor.name}
      ตำแหน่ง: ${createdDocument.doctor.position}
      
      วันที่ออกเอกสาร: ${formatDate(createdDocument.issueDate)}
      ${createdDocument.expiryDate ? `วันที่หมดอายุ: ${formatDate(createdDocument.expiryDate)}` : ''}
      
      จุดประสงค์: ${createdDocument.purpose}
      
      เนื้อหา:
      ${createdDocument.content}
      
      ${createdDocument.medicalCondition ? `อาการ/การวินิจฉัย: ${createdDocument.medicalCondition}` : ''}
      ${createdDocument.recommendations ? `คำแนะนำ: ${createdDocument.recommendations}` : ''}
      ${createdDocument.referralTo ? `ส่งต่อไปยัง: ${createdDocument.referralTo}` : ''}
      ${createdDocument.additionalNotes ? `หมายเหตุ: ${createdDocument.additionalNotes}` : ''}
    `;
    
    logger.debug('🖨️ Printing document:', printContent);
    setSuccess('กำลังพิมพ์เอกสาร...');
  };

  const getDocumentTypeLabel = (type: string): string => {
    const labels = {
      medical_certificate: 'ใบรับรองแพทย์',
      referral_letter: 'ใบส่งต่อ',
      appointment_slip: 'ใบนัดหมาย',
      sick_leave: 'ใบลาป่วย',
      medical_report: 'รายงานทางการแพทย์',
      other: 'อื่นๆ'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            กรุณาเข้าสู่ระบบ
          </h2>
          <p className="text-gray-600 mb-4">
            คุณต้องเข้าสู่ระบบก่อนเพื่อใช้งานระบบเอกสาร
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
          <FileText className="mr-2 md:mr-3 h-6 w-6 md:h-8 md:w-8" />
          ระบบเอกสาร
        </h1>
        <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">สร้างและออกเอกสารทางการแพทย์ประเภทต่างๆ</p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      {!showDocumentPreview ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Patient Selection */}
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold mb-4 flex items-center">
              <User className="mr-2 h-5 w-5" />
              เลือกผู้ป่วย
            </h2>
            
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหาผู้ป่วย (ชื่อ, HN, เลขบัตรประชาชน)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {isLoadingPatients ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-2">กำลังโหลดข้อมูลผู้ป่วย...</p>
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <p>ไม่พบข้อมูลผู้ป่วย</p>
                </div>
              ) : (
                filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => setSelectedPatient(patient)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedPatient?.id === patient.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{patient.name}</h3>
                        <p className="text-sm text-gray-600">HN: {patient.hn}</p>
                        <p className="text-sm text-gray-600">{patient.gender} • {patient.age} ปี</p>
                      </div>
                      {selectedPatient?.id === patient.id && (
                        <CheckCircle className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {validationErrors.patient && (
              <p className="mt-2 text-sm text-red-600">{validationErrors.patient}</p>
            )}
          </div>

          {/* Doctor Selection */}
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold mb-4 flex items-center">
              <User className="mr-2 h-5 w-5" />
              เลือกแพทย์
            </h2>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {isLoadingDoctors ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-2">กำลังโหลดข้อมูลแพทย์...</p>
                </div>
              ) : doctors.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <p>ไม่พบข้อมูลแพทย์</p>
                </div>
              ) : (
                doctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    onClick={() => setSelectedDoctor(doctor)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedDoctor?.id === doctor.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{doctor.name}</h3>
                        <p className="text-sm text-gray-600">{doctor.position}</p>
                        <p className="text-sm text-gray-600">{doctor.department}</p>
                      </div>
                      {selectedDoctor?.id === doctor.id && (
                        <CheckCircle className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {validationErrors.doctor && (
              <p className="mt-2 text-sm text-red-600">{validationErrors.doctor}</p>
            )}
          </div>

          {/* Document Form */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold mb-4 flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              ข้อมูลเอกสาร
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ประเภทเอกสาร
                </label>
                <select
                  value={formData.documentType}
                  onChange={(e) => setFormData({...formData, documentType: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="medical_certificate">ใบรับรองแพทย์</option>
                  <option value="referral_letter">ใบส่งต่อ</option>
                  <option value="appointment_slip">ใบนัดหมาย</option>
                  <option value="sick_leave">ใบลาป่วย</option>
                  <option value="medical_report">รายงานทางการแพทย์</option>
                  <option value="other">อื่นๆ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  วันที่ออกเอกสาร
                </label>
                <input
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => setFormData({...formData, issueDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {validationErrors.issueDate && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.issueDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  วันที่หมดอายุ (ถ้ามี)
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  จุดประสงค์
                </label>
                <input
                  type="text"
                  value={formData.purpose}
                  onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                  placeholder="เช่น เพื่อขอลาป่วย, เพื่อรับการรักษา"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {validationErrors.purpose && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.purpose}</p>
                )}
              </div>

              {formData.documentType === 'medical_certificate' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    อาการ/การวินิจฉัย
                  </label>
                  <input
                    type="text"
                    value={formData.medicalCondition}
                    onChange={(e) => setFormData({...formData, medicalCondition: e.target.value})}
                    placeholder="เช่น ไข้หวัดใหญ่, ปวดหลัง"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {validationErrors.medicalCondition && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.medicalCondition}</p>
                  )}
                </div>
              )}

              {formData.documentType === 'referral_letter' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ส่งต่อไปยัง
                  </label>
                  <input
                    type="text"
                    value={formData.referralTo}
                    onChange={(e) => setFormData({...formData, referralTo: e.target.value})}
                    placeholder="เช่น โรงพยาบาลชลบุรี, คลินิกเฉพาะทาง"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {validationErrors.referralTo && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.referralTo}</p>
                  )}
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เนื้อหาเอกสาร
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  rows={4}
                  placeholder="รายละเอียดเนื้อหาเอกสาร..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {validationErrors.content && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.content}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  คำแนะนำ
                </label>
                <textarea
                  value={formData.recommendations}
                  onChange={(e) => setFormData({...formData, recommendations: e.target.value})}
                  rows={2}
                  placeholder="คำแนะนำเพิ่มเติม..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  หมายเหตุเพิ่มเติม
                </label>
                <textarea
                  value={formData.additionalNotes}
                  onChange={(e) => setFormData({...formData, additionalNotes: e.target.value})}
                  rows={2}
                  placeholder="หมายเหตุเพิ่มเติม..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleNewDocument}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <X className="inline-block w-4 h-4 mr-2" />
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    กำลังสร้าง...
                  </>
                ) : (
                  <>
                    <Save className="inline-block w-4 h-4 mr-2" />
                    สร้างเอกสาร
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Document Preview */
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              ตัวอย่างเอกสาร
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Printer className="inline-block w-4 h-4 mr-2" />
                พิมพ์
              </button>
              <button
                onClick={handleNewDocument}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Edit3 className="inline-block w-4 h-4 mr-2" />
                เอกสารใหม่
              </button>
            </div>
          </div>

          {createdDocument && (
            <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  {getDocumentTypeLabel(createdDocument.documentType)}
                </h3>
                <p className="text-gray-600 mt-2">หมายเลขเอกสาร: {createdDocument.documentNumber}</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">ข้อมูลผู้ป่วย</h4>
                    <p className="text-gray-700">ชื่อ: {createdDocument.patient.name}</p>
                    <p className="text-gray-700">HN: {createdDocument.patient.hn}</p>
                    <p className="text-gray-700">เพศ: {createdDocument.patient.gender}</p>
                    <p className="text-gray-700">อายุ: {createdDocument.patient.age} ปี</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">ข้อมูลแพทย์</h4>
                    <p className="text-gray-700">ชื่อ: {createdDocument.doctor.name}</p>
                    <p className="text-gray-700">ตำแหน่ง: {createdDocument.doctor.position}</p>
                    <p className="text-gray-700">แผนก: {createdDocument.doctor.department}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-gray-700 mb-2">
                    <strong>วันที่ออกเอกสาร:</strong> {formatDate(createdDocument.issueDate)}
                  </p>
                  {createdDocument.expiryDate && (
                    <p className="text-gray-700 mb-2">
                      <strong>วันที่หมดอายุ:</strong> {formatDate(createdDocument.expiryDate)}
                    </p>
                  )}
                  <p className="text-gray-700 mb-2">
                    <strong>จุดประสงค์:</strong> {createdDocument.purpose}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">เนื้อหาเอกสาร</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{createdDocument.content}</p>
                </div>

                {createdDocument.medicalCondition && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-900 mb-2">อาการ/การวินิจฉัย</h4>
                    <p className="text-gray-700">{createdDocument.medicalCondition}</p>
                  </div>
                )}

                {createdDocument.recommendations && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-900 mb-2">คำแนะนำ</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{createdDocument.recommendations}</p>
                  </div>
                )}

                {createdDocument.referralTo && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-900 mb-2">ส่งต่อไปยัง</h4>
                    <p className="text-gray-700">{createdDocument.referralTo}</p>
                  </div>
                )}

                {createdDocument.additionalNotes && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-900 mb-2">หมายเหตุเพิ่มเติม</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{createdDocument.additionalNotes}</p>
                  </div>
                )}

                <div className="border-t pt-4 text-right">
                  <p className="text-gray-600 text-sm">
                    ออกเอกสารโดย: {createdDocument.createdBy}
                  </p>
                  <p className="text-gray-600 text-sm">
                    วันที่สร้าง: {formatDate(createdDocument.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
