"use client";
import { useState } from "react";
import { Search, Stethoscope, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PatientService } from '@/services/patientService';
import { DoctorVisitService } from '@/services/doctorVisitService';
import { NotificationService } from '@/services/notificationService';
import { PatientDocumentService } from '@/services/patientDocumentService';
import { MedicalPatient } from '@/types/api';
import { logger } from '@/lib/logger';

export default function DoctorVisit() {
  const { isAuthenticated, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"hn" | "queue">("queue");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<MedicalPatient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };
  const [success, setSuccess] = useState<string | null>(null);

  const [doctorVisitData, setDoctorVisitData] = useState({
    chiefComplaint: '',
    presentIllness: '',
    physicalExamination: {
      generalAppearance: '',
      vitalSigns: '',
      headNeck: '',
      chest: '',
      cardiovascular: '',
      abdomen: '',
      extremities: '',
      neurological: '',
      other: ''
    },
    diagnosis: {
      primaryDiagnosis: '',
      secondaryDiagnosis: [],
      differentialDiagnosis: [],
      icd10Code: ''
    },
    treatmentPlan: {
      medications: [],
      procedures: [],
      lifestyleModifications: [],
      followUpInstructions: ''
    },
    advice: '',
    followUp: {
      scheduledDate: '',
      interval: '',
      purpose: '',
      notes: ''
    },
    notes: '',
    examinedTime: new Date().toISOString().slice(0, 16)
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setError(null);
    
    try {
      const response = await PatientService.searchPatients(searchQuery, searchType);
      
      if (response.statusCode === 200 && response.data && response.data.length > 0) {
        setSelectedPatient(response.data[0]);
        setError(null);
      } else {
        setError("ไม่พบข้อมูลผู้ป่วย");
        setSelectedPatient(null);
      }
    } catch (error) {
      logger.error("Error searching patient:", error);
      setError("เกิดข้อผิดพลาดในการค้นหาผู้ป่วย");
      setSelectedPatient(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPatient) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const formattedData = DoctorVisitService.formatDoctorVisitDataForAPI(
        doctorVisitData,
        selectedPatient.id,
        user?.thaiName || `${user?.firstName} ${user?.lastName}` || 'แพทย์'
      );
      
      const response = await DoctorVisitService.createDoctorVisit(formattedData);
      
      if (response.statusCode === 201 && response.data) {
        await sendPatientNotification(selectedPatient, response.data);
        
        // Create document for patient
        await createPatientDocument(selectedPatient, response.data);
        
        setSuccess("บันทึกการตรวจโดยแพทย์สำเร็จ!\n\n✅ ระบบได้ส่งการแจ้งเตือนและเอกสารให้ผู้ป่วยแล้ว");
      } else {
        setError("เกิดข้อผิดพลาดในการบันทึกการตรวจ");
      }
    } catch (error) {
      logger.error("Error saving doctor visit:", error);
      setError("เกิดข้อผิดพลาดในการบันทึกการตรวจ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendPatientNotification = async (patient: MedicalPatient, visitRecord: any) => {
    try {
      const notificationData = {
        patientHn: patient.hn || patient.hospitalNumber || '',
        patientNationalId: patient.nationalId || '',
        patientName: patient.thaiName || `${patient.firstName} ${patient.lastName}`,
        patientPhone: patient.phone || '',
        patientEmail: patient.email || '',
        recordType: 'doctor_visit',
        recordId: visitRecord.id,
        chiefComplaint: visitRecord.chiefComplaint,
        recordedBy: visitRecord.examinedBy,
        recordedTime: visitRecord.examinedTime,
        message: `มีการบันทึกการตรวจโดยแพทย์ใหม่สำหรับคุณ ${patient.thaiName || `${patient.firstName} ${patient.lastName}`} โดย ${visitRecord.examinedBy}`
      };

      await NotificationService.notifyPatientRecordUpdate(notificationData);
      logger.info('Patient notification sent for doctor visit', {
        patientHn: notificationData.patientHn,
        recordId: visitRecord.id
      });
    } catch (error) {
      logger.error('Failed to send patient notification for doctor visit:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">กรุณาเข้าสู่ระบบ</h2>
          <p className="text-gray-600">คุณต้องเข้าสู่ระบบเพื่อใช้งานระบบตรวจโดยแพทย์</p>
        </div>
      </div>
    );
  }

  /**
   * สร้างเอกสารให้ผู้ป่วย
   */
  const createPatientDocument = async (patient: MedicalPatient, visitData: any) => {
    try {
      await PatientDocumentService.createDocumentFromMedicalRecord(
        'doctor_visit',
        visitData,
        {
          patientHn: patient.hn || '',
          patientNationalId: patient.nationalId || '',
          patientName: patient.thaiName || ''
        },
        user?.id || '',
        user?.thaiName || `${user?.firstName} ${user?.lastName}` || 'แพทย์'
      );
      
      logger.info('Patient document created successfully for doctor visit', { 
        patientHn: patient.hn,
        recordType: 'doctor_visit'
      });
    } catch (error) {
      logger.error('Error creating patient document for doctor visit:', error);
      // ไม่ throw error เพื่อไม่ให้กระทบการบันทึกการตรวจ
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Stethoscope className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ตรวจโดยแพทย์</h1>
              <p className="text-gray-600">บันทึกการตรวจและวินิจฉัยของแพทย์</p>
            </div>
          </div>

          {/* Search Patient */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ค้นหาผู้ป่วย</h3>
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="กรอก HN หรือหมายเลขคิว"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                {isSearching ? "กำลังค้นหา..." : "ค้นหา"}
              </button>
            </div>
          </div>

          {/* Patient Info */}
          {selectedPatient && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-green-800 mb-2">ข้อมูลผู้ป่วย</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">HN:</span> {selectedPatient.hn || selectedPatient.hospitalNumber}
                </div>
                <div>
                  <span className="font-medium">ชื่อ:</span> {selectedPatient.thaiName || `${selectedPatient.firstName} ${selectedPatient.lastName}`}
                </div>
                <div>
                  <span className="font-medium">อายุ:</span> {selectedPatient.birthDate ? calculateAge(selectedPatient.birthDate) : 'ไม่ระบุ'}
                </div>
                <div>
                  <span className="font-medium">เพศ:</span> {selectedPatient.gender || 'ไม่ระบุ'}
                </div>
              </div>
            </div>
          )}

          {/* Doctor Visit Form */}
          {selectedPatient && (
            <div className="space-y-6">
              {/* Chief Complaint */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  อาการหลัก (Chief Complaint) *
                </label>
                <textarea
                  value={doctorVisitData.chiefComplaint}
                  onChange={(e) => setDoctorVisitData(prev => ({ ...prev, chiefComplaint: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="กรอกอาการหลักของผู้ป่วย"
                />
              </div>

              {/* Present Illness */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ประวัติการเจ็บป่วยปัจจุบัน (Present Illness) *
                </label>
                <textarea
                  value={doctorVisitData.presentIllness}
                  onChange={(e) => setDoctorVisitData(prev => ({ ...prev, presentIllness: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="กรอกรายละเอียดประวัติการเจ็บป่วยปัจจุบัน"
                />
              </div>

              {/* Physical Examination */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  การตรวจร่างกาย (Physical Examination)
                </label>
                <textarea
                  value={doctorVisitData.physicalExamination.generalAppearance}
                  onChange={(e) => setDoctorVisitData(prev => ({
                    ...prev,
                    physicalExamination: { ...prev.physicalExamination, generalAppearance: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="กรอกผลการตรวจร่างกาย"
                />
              </div>

              {/* Diagnosis */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  การวินิจฉัย (Diagnosis) *
                </label>
                <input
                  type="text"
                  value={doctorVisitData.diagnosis.primaryDiagnosis}
                  onChange={(e) => setDoctorVisitData(prev => ({
                    ...prev,
                    diagnosis: { ...prev.diagnosis, primaryDiagnosis: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="กรอกการวินิจฉัยหลัก"
                />
              </div>

              {/* Treatment Plan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  แผนการรักษา (Treatment Plan)
                </label>
                <textarea
                  value={doctorVisitData.treatmentPlan.followUpInstructions}
                  onChange={(e) => setDoctorVisitData(prev => ({
                    ...prev,
                    treatmentPlan: { ...prev.treatmentPlan, followUpInstructions: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="กรอกแผนการรักษา"
                />
              </div>

              {/* Advice */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  คำแนะนำ (Advice) *
                </label>
                <textarea
                  value={doctorVisitData.advice}
                  onChange={(e) => setDoctorVisitData(prev => ({ ...prev, advice: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="กรอกคำแนะนำสำหรับผู้ป่วย"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !doctorVisitData.chiefComplaint || !doctorVisitData.presentIllness || !doctorVisitData.diagnosis.primaryDiagnosis || !doctorVisitData.advice}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <CheckCircle className="h-5 w-5" />
                  {isSubmitting ? "กำลังบันทึก..." : "บันทึกการตรวจ"}
                </button>
              </div>
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
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}