"use client";
import { useState, useEffect } from "react";
import { Search, FileText, Plus, Trash2, Upload, CheckCircle, AlertCircle, User, Heart, Activity, Brain, Database, Microscope, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PatientService } from '@/services/patientService';
import { LabResultService } from '@/services/labResultService';
import { NotificationService } from '@/services/notificationService';
import { PatientDocumentService } from '@/services/patientDocumentService';
import { EnhancedDataService } from '@/services/enhancedDataService';
import { MedicalPatient } from '@/types/api';
import { logger } from '@/lib/logger';

interface Result {
  parameter: string;
  value: string;
  unit: string;
  normalRange: string;
  status: string;
  notes: string;
}

export default function LabResult() {
  const { isAuthenticated, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"hn" | "queue">("hn");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<MedicalPatient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const calculateAgeFromFields = (patient: MedicalPatient): number => {
    logger.info("Calculating age for patient:", {
      birth_date: patient.birth_date,
      birthDate: patient.birthDate,
      birth_year: patient.birthYear,
      birth_month: patient.birthMonth,
      birth_day: patient.birthDay
    });
    
    // Try to calculate age from separate birth fields first
    if (patient.birthYear && patient.birthMonth && patient.birthDay) {
      const today = new Date();
      const birthYear = patient.birthYear > 2500 ? patient.birthYear - 543 : patient.birthYear;
      const birth = new Date(birthYear, patient.birthMonth - 1, patient.birthDay);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      logger.info("Calculated age from separate fields:", {
        age,
        birthYear,
        birthMonth: patient.birthMonth,
        birthDay: patient.birthDay
      });
      
      return age;
    }
    
    // Fallback to birth_date or birthDate
    if (patient.birth_date || patient.birthDate) {
      const birthDate = patient.birth_date || patient.birthDate;
      const age = calculateAge(birthDate);
      logger.info("Calculated age from birth_date:", { age, birth_date: birthDate });
      return age;
    }
    
    logger.info("No birth data available, returning 0");
    return 0;
  };

  // Update edBy when user changes
  useEffect(() => {
    if (user) {
      const labTechnicianName = user.thaiName || `${user.firstName} ${user.lastName}` || "เจ้าหน้าที่แลบ";
      setLabResultData(prev => ({
        ...prev,
        edBy: labTechnicianName
      }));
    }
  }, [user]);

  const [labResultData, setLabResultData] = useState({
    Type: '',
    Name: '',
    Results: [] as Result[],
    overallResult: 'normal',
    interpretation: '',
    recommendations: '',
    attachments: [] as any[],
    notes: '',
    edTime: new Date().toISOString().slice(0, 16),
    edBy: user?.thaiName || `${user?.firstName} ${user?.lastName}` || "เจ้าหน้าที่แลบ",
    
    // Critical Lab Values for AI Analysis
    criticalLabValues: {
      hba1c: '', // HbA1c - ระดับน้ำตาลเฉลี่ย 3 เดือน
      fastingInsulin: '', // Fasting Insulin - ระดับอินซูลินหลังอดอาหาร
      cPeptide: '', // C-Peptide - วัดการทำงานของตับอ่อน
      totalCholesterol: '', // Total Cholesterol
      hdlCholesterol: '', // HDL Cholesterol
      ldlCholesterol: '', // LDL Cholesterol
      triglycerides: '', // Triglycerides
      bun: '', // BUN - Blood Urea Nitrogen
      creatinine: '', // Creatinine
      egfr: '', // eGFR - Estimated Glomerular Filtration Rate
      alt: '', // ALT - Alanine Aminotransferase
      ast: '', // AST - Aspartate Aminotransferase
      alp: '', // ALP - Alkaline Phosphatase
      bilirubin: '', // Bilirubin
      tsh: '', // TSH - Thyroid Stimulating Hormone
      t3: '', // T3 - Triiodothyronine
      t4: '', // T4 - Thyroxine
      crp: '', // CRP - C-Reactive Protein
      esr: '', // ESR - Erythrocyte Sedimentation Rate
      vitaminD: '', // Vitamin D
      b12: '', // Vitamin B12
      folate: '', // Folate
      iron: '', // Iron
      ferritin: '', // Ferritin
      uricAcid: '' // Uric Acid
    },
    
    // AI Research Fields for Lab Results
    aiResearchData: {
      clinicalSignificance: '', // ความสำคัญทางคลินิก
      trendAnalysis: '', // การวิเคราะห์แนวโน้ม
      correlationWithSymptoms: '', // ความสัมพันธ์กับอาการ
      riskFactors: '', // ปัจจัยเสี่ยงที่เกี่ยวข้อง
      followUpRecommendations: '', // คำแนะนำการติดตาม
      referenceRanges: '', // ช่วงค่าอ้างอิง
      qualityControl: '', // การควบคุมคุณภาพ
      methodology: '', // วิธีการตรวจ
      limitations: '', // ข้อจำกัด
      clinicalDecisionSupport: '', // การสนับสนุนการตัดสินใจทางคลินิก
      researchNotes: '' // หมายเหตุสำหรับการวิจัย
    }
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setError(null);
    
    try {
      const response = await PatientService.searchPatients(searchQuery, searchType);
      
      if (response.statusCode === 200 && response.data && response.data.length > 0) {
        logger.info("Patient found:", response.data[0]);
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

  const addResult = () => {
    const newResult = {
      parameter: '',
      value: '',
      unit: '',
      normalRange: '',
      status: 'normal',
      notes: ''
    };
    
    setLabResultData(prev => ({
      ...prev,
      Results: [...prev.Results, newResult]
    }));
  };

  const removeResult = (index: number) => {
    setLabResultData(prev => ({
      ...prev,
      Results: prev.Results.filter((_, i) => i !== index)
    }));
  };

  const updateResult = (index: number, field: string, value: any) => {
    setLabResultData(prev => {
      const updatedResults = [...prev.Results];
      updatedResults[index] = { ...updatedResults[index], [field]: value };
      
      return {
        ...prev,
        Results: updatedResults
      };
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      const file = files[0];
      const processedFile = await LabResultService.processUploadedFile(file);
      
      setLabResultData(prev => ({
        ...prev,
        attachments: [...prev.attachments, processedFile]
      }));
    } catch (error) {
      logger.error('Error processing file:', error);
      setError('เกิดข้อผิดพลาดในการอัปโหลดไฟล์');
    }
  };

  const removeAttachment = (index: number) => {
    setLabResultData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!selectedPatient) return;
    
    // Validate data
    const validation = LabResultService.validateLabResultData({
      ...labResultData,
      edBy: user?.id || 'system'
    });
    
    if (!validation.isValid) {
      setError(validation.errors.join('\n'));
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const formattedData = LabResultService.formatLabResultDataForAPI(
        labResultData,
        selectedPatient.id,
        user?.id || 'system'
      );
      
      const response = await LabResultService.createLabResult(formattedData);
      
      if (response.statusCode === 201 && response.data) {
        await sendPatientNotification(selectedPatient, response.data);
        
        // Create document for patient
        await createPatientDocument(selectedPatient, response.data);
        
        setSuccess("บันทึกผลแลบสำเร็จ!\n\n✅ ระบบได้ส่งการแจ้งเตือนและเอกสารให้ผู้ป่วยแล้ว");
        
        // Save critical lab values for AI analysis
        try {
          const criticalLabData = {
            hba1c: labResultData.criticalLabValues.hba1c ? parseFloat(labResultData.criticalLabValues.hba1c) : undefined,
            fastingInsulin: labResultData.criticalLabValues.fastingInsulin ? parseFloat(labResultData.criticalLabValues.fastingInsulin) : undefined,
            cPeptide: labResultData.criticalLabValues.cPeptide ? parseFloat(labResultData.criticalLabValues.cPeptide) : undefined,
            totalCholesterol: labResultData.criticalLabValues.totalCholesterol ? parseFloat(labResultData.criticalLabValues.totalCholesterol) : undefined,
            hdlCholesterol: labResultData.criticalLabValues.hdlCholesterol ? parseFloat(labResultData.criticalLabValues.hdlCholesterol) : undefined,
            ldlCholesterol: labResultData.criticalLabValues.ldlCholesterol ? parseFloat(labResultData.criticalLabValues.ldlCholesterol) : undefined,
            triglycerides: labResultData.criticalLabValues.triglycerides ? parseFloat(labResultData.criticalLabValues.triglycerides) : undefined,
            bun: labResultData.criticalLabValues.bun ? parseFloat(labResultData.criticalLabValues.bun) : undefined,
            creatinine: labResultData.criticalLabValues.creatinine ? parseFloat(labResultData.criticalLabValues.creatinine) : undefined,
            egfr: labResultData.criticalLabValues.egfr ? parseFloat(labResultData.criticalLabValues.egfr) : undefined,
            alt: labResultData.criticalLabValues.alt ? parseFloat(labResultData.criticalLabValues.alt) : undefined,
            ast: labResultData.criticalLabValues.ast ? parseFloat(labResultData.criticalLabValues.ast) : undefined,
            alp: labResultData.criticalLabValues.alp ? parseFloat(labResultData.criticalLabValues.alp) : undefined,
            bilirubin: labResultData.criticalLabValues.bilirubin ? parseFloat(labResultData.criticalLabValues.bilirubin) : undefined,
            tsh: labResultData.criticalLabValues.tsh ? parseFloat(labResultData.criticalLabValues.tsh) : undefined,
            t3: labResultData.criticalLabValues.t3 ? parseFloat(labResultData.criticalLabValues.t3) : undefined,
            t4: labResultData.criticalLabValues.t4 ? parseFloat(labResultData.criticalLabValues.t4) : undefined,
            crp: labResultData.criticalLabValues.crp ? parseFloat(labResultData.criticalLabValues.crp) : undefined,
            esr: labResultData.criticalLabValues.esr ? parseFloat(labResultData.criticalLabValues.esr) : undefined,
            vitaminD: labResultData.criticalLabValues.vitaminD ? parseFloat(labResultData.criticalLabValues.vitaminD) : undefined,
            b12: labResultData.criticalLabValues.b12 ? parseFloat(labResultData.criticalLabValues.b12) : undefined,
            folate: labResultData.criticalLabValues.folate ? parseFloat(labResultData.criticalLabValues.folate) : undefined,
            iron: labResultData.criticalLabValues.iron ? parseFloat(labResultData.criticalLabValues.iron) : undefined,
            ferritin: labResultData.criticalLabValues.ferritin ? parseFloat(labResultData.criticalLabValues.ferritin) : undefined,
            uricAcid: labResultData.criticalLabValues.uricAcid ? parseFloat(labResultData.criticalLabValues.uricAcid) : undefined,
            testDate: new Date().toISOString(),
            labResultId: response.data.id
          };
          
          // Only save if there's actual data
          const hasCriticalData = Object.values(criticalLabData).some(value => 
            value !== undefined && value !== null && value !== ''
          );
          
          if (hasCriticalData) {
            await EnhancedDataService.saveCriticalLabValues(selectedPatient.id, criticalLabData);
            logger.info('Critical lab values saved for AI analysis');
          }
        } catch (enhancedError) {
          logger.warn('Failed to save critical lab values, but lab result was saved:', enhancedError);
          // Don't throw error here as lab result was saved successfully
        }
        
        // Reset form
        setTimeout(() => {
          setSelectedPatient(null);
          setSearchQuery("");
          setLabResultData({
            Type: '',
            Name: '',
            Results: [],
            overallResult: 'normal',
            interpretation: '',
            recommendations: '',
            attachments: [],
            notes: '',
            edTime: new Date().toISOString().slice(0, 16),
            edBy: user?.thaiName || `${user?.firstName} ${user?.lastName}` || "เจ้าหน้าที่แลบ",
            // Reset Critical Lab Values
            criticalLabValues: {
              hba1c: '',
              fastingInsulin: '',
              cPeptide: '',
              totalCholesterol: '',
              hdlCholesterol: '',
              ldlCholesterol: '',
              triglycerides: '',
              bun: '',
              creatinine: '',
              egfr: '',
              alt: '',
              ast: '',
              alp: '',
              bilirubin: '',
              tsh: '',
              t3: '',
              t4: '',
              crp: '',
              esr: '',
              vitaminD: '',
              b12: '',
              folate: '',
              iron: '',
              ferritin: '',
              uricAcid: ''
            },
            // Reset AI Research Data
            aiResearchData: {
              clinicalSignificance: '',
              trendAnalysis: '',
              correlationWithSymptoms: '',
              riskFactors: '',
              followUpRecommendations: '',
              referenceRanges: '',
              qualityControl: '',
              methodology: '',
              limitations: '',
              clinicalDecisionSupport: '',
              researchNotes: ''
            }
          });
          setSuccess(null);
        }, 3000);
      } else {
        setError("เกิดข้อผิดพลาดในการบันทึกผลแลบ");
      }
    } catch (error) {
      logger.error("Error saving lab result:", error);
      setError("เกิดข้อผิดพลาดในการบันทึกผลแลบ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendPatientNotification = async (patient: MedicalPatient, labResultRecord: any) => {
    try {
      const notificationData = {
        patientHn: patient.hospitalNumber || patient.hn || '',
        patientNationalId: patient.national_id || '',
        patientName: patient.thaiName || `${patient.firstName} ${patient.lastName}`,
        patientPhone: patient.phone || '',
        patientEmail: patient.email || '',
        recordType: 'lab_result',
        recordId: labResultRecord.id,
        chiefComplaint: `ผลแลบ: ${labResultRecord.Name}`,
        recordedBy: labResultRecord.edBy,
        recordedTime: labResultRecord.edTime,
        message: `มีผลแลบใหม่สำหรับคุณ ${patient.thaiName || `${patient.firstName} ${patient.lastName}`} โดย ${labResultRecord.edBy}`
      };

      await NotificationService.notifyPatientRecordUpdate(notificationData);
      logger.info('Patient notification sent for lab result', {
        patientHn: notificationData.patientHn,
        recordId: labResultRecord.id
      });
    } catch (error) {
      logger.error('Failed to send patient notification for lab result:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">กรุณาเข้าสู่ระบบ</h2>
          <p className="text-gray-600">คุณต้องเข้าสู่ระบบเพื่อใช้งานระบบผลแลบ</p>
        </div>
      </div>
    );
  }

  /**
   * สร้างเอกสารให้ผู้ป่วย
   */
  const createPatientDocument = async (patient: MedicalPatient, labData: any) => {
    try {
      await PatientDocumentService.createDocumentFromMedicalRecord(
        'lab_result',
        labData,
        {
          patientHn: patient.hospitalNumber || patient.hn || '',
          patientNationalId: patient.national_id || '',
          patientName: patient.thaiName || ''
        },
        user?.id || '',
        user?.thaiName || `${user?.firstName} ${user?.lastName}` || 'เจ้าหน้าที่แลบ'
      );
      
      logger.info('Patient document created successfully for lab result', { 
        patientHn: patient.hospitalNumber || patient.hn,
        recordType: 'lab_result'
      });
    } catch (error) {
      logger.error('Error creating patient document for lab result:', error);
      // ไม่ throw error เพื่อไม่ให้กระทบการบันทึกผลแลบ
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ผลแลบ / แนบไฟล์</h1>
              <p className="text-gray-600">บันทึกผลตรวจทางห้องปฏิบัติการและแนบไฟล์</p>
            </div>
          </div>

          {/* Search Patient */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ค้นหาผู้ป่วย</h3>
            
            {/* Search Type Selection */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setSearchType("hn")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  searchType === "hn"
                    ? "bg-purple-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                ค้นหาด้วย HN
              </button>
              <button
                onClick={() => setSearchType("queue")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  searchType === "queue"
                    ? "bg-purple-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                ค้นหาด้วยคิว
              </button>
            </div>
            
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder={searchType === "hn" ? "กรอก HN เช่น HN250001" : "กรอกหมายเลขคิว เช่น V2025090001"}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                {isSearching ? "กำลังค้นหา..." : "ค้นหา"}
              </button>
            </div>
          </div>

          {/* Comprehensive Patient Information for Lab Results */}
          {selectedPatient && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6 mb-6 shadow-sm">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                  <Microscope className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-purple-800">ข้อมูลผู้ป่วยสำหรับการตรวจแล็บ</h3>
                  <p className="text-purple-600">ข้อมูลครบถ้วนเพื่อการวิเคราะห์ผลการตรวจที่แม่นยำ</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Basic Information */}
                <div className="bg-white rounded-lg p-4 border border-purple-100">
                  <h4 className="text-sm font-semibold text-purple-800 mb-3 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    ข้อมูลพื้นฐาน
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">HN:</span>
                      <span className="font-bold text-purple-600">{selectedPatient.hospitalNumber || selectedPatient.hn}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">ชื่อ-นามสกุล:</span>
                      <span className="font-medium text-slate-800">
                        {selectedPatient.thaiName && selectedPatient.thaiLastName
                          ? `${selectedPatient.thaiName} ${selectedPatient.thaiLastName}`
                          : selectedPatient.thaiName || selectedPatient.firstName
                          ? `${selectedPatient.thaiName || selectedPatient.firstName} ${selectedPatient.thaiLastName || selectedPatient.lastName || ''}`.trim()
                          : 'ไม่ระบุ'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">อายุ:</span>
                      <span className="font-medium text-slate-800">
                        {(() => {
                          const age = calculateAgeFromFields(selectedPatient);
                          if (age > 0) {
                            return `${age} ปี`;
                          } else if (selectedPatient.birth_date || selectedPatient.birthDate || selectedPatient.birthYear) {
                            return 'ไม่สามารถคำนวณได้';
                          } else {
                            return 'ไม่ระบุ';
                          }
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">เพศ:</span>
                      <span className="font-medium text-slate-800">
                        {selectedPatient.gender === 'male' ? 'ชาย' : 
                         selectedPatient.gender === 'female' ? 'หญิง' : 
                         selectedPatient.gender || 'ไม่ระบุ'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">กรุ๊ปเลือด:</span>
                      <span className="font-medium text-slate-800">{selectedPatient.bloodType || 'ไม่ระบุ'}</span>
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                <div className="bg-white rounded-lg p-4 border border-red-100">
                  <h4 className="text-sm font-semibold text-red-800 mb-3 flex items-center">
                    <Heart className="h-4 w-4 mr-2" />
                    ข้อมูลทางการแพทย์
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">แพ้ยา:</span>
                      <span className="font-medium text-red-600">{selectedPatient.drugAllergies || 'ไม่มี'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">แพ้อาหาร:</span>
                      <span className="font-medium text-red-600">{selectedPatient.foodAllergies || 'ไม่มี'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">โรคประจำตัว:</span>
                      <span className="font-medium text-slate-800">{selectedPatient.chronicDiseases || 'ไม่มี'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">ยาที่ใช้อยู่:</span>
                      <span className="font-medium text-slate-800">{selectedPatient.currentMedications || 'ไม่มี'}</span>
                    </div>
                  </div>
                </div>

                {/* Current Status */}
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center">
                    <Activity className="h-4 w-4 mr-2" />
                    สถานะปัจจุบัน
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">น้ำหนัก:</span>
                      <span className="font-medium text-slate-800">{selectedPatient.weight ? `${selectedPatient.weight} กก.` : 'ไม่ระบุ'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">ส่วนสูง:</span>
                      <span className="font-medium text-slate-800">{selectedPatient.height ? `${selectedPatient.height} ซม.` : 'ไม่ระบุ'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">BMI:</span>
                      <span className="font-medium text-slate-800">
                        {selectedPatient.weight && selectedPatient.height 
                          ? (selectedPatient.weight / Math.pow(selectedPatient.height / 100, 2)).toFixed(1)
                          : 'ไม่ระบุ'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">สถานะ:</span>
                      <span className="font-medium text-blue-600">พร้อมตรวจแล็บ</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lab-Specific Information */}
              <div className="mt-4 bg-white rounded-lg p-4 border border-green-100">
                <h4 className="text-sm font-semibold text-green-800 mb-3 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  ข้อมูลสำหรับการตรวจแล็บ
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">ประวัติการตรวจแล็บ:</span>
                    <p className="text-slate-800 mt-1">ไม่มีข้อมูล</p>
                  </div>
                  <div>
                    <span className="text-slate-600">การเตรียมตัวก่อนตรวจ:</span>
                    <p className="text-slate-800 mt-1">ไม่มีข้อมูล</p>
                  </div>
                </div>
              </div>

              {/* Instructions for Lab Technician */}
              <div className="mt-4 p-4 bg-purple-100 border border-purple-200 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-purple-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-purple-800">
                    <p className="font-medium mb-1">คำแนะนำสำหรับเจ้าหน้าที่แล็บ:</p>
                    <ul className="space-y-1 text-purple-700">
                      <li>• ตรวจสอบประวัติการแพ้ยาและอาหารก่อนการตรวจ</li>
                      <li>• พิจารณาโรคประจำตัวและยาที่ใช้อยู่ในการแปลผล</li>
                      <li>• ใช้ข้อมูลน้ำหนักและส่วนสูงในการคำนวณค่าอ้างอิง</li>
                      <li>• บันทึกข้อมูลให้ครบถ้วนเพื่อการวิจัยและพัฒนาระบบ AI</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Lab Result Form */}
          {selectedPatient && (
            <div className="space-y-6">
              {/*  Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ประเภทการตรวจ *
                  </label>
                  <input
                    type="text"
                    value={labResultData.Type}
                    onChange={(e) => setLabResultData(prev => ({ ...prev, Type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="เช่น ตรวจเลือด, ตรวจปัสสาวะ"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ชื่อการตรวจ *
                  </label>
                  <input
                    type="text"
                    value={labResultData.Name}
                    onChange={(e) => setLabResultData(prev => ({ ...prev, Name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="เช่น CBC, Urinalysis"
                  />
                </div>
              </div>

              {/*  Results */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">ผลการตรวจ</h3>
                  <button
                    onClick={addResult}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    เพิ่มผลการตรวจ
                  </button>
                </div>

                {labResultData.Results.map((Result, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium text-gray-900">ผลการตรวจ {index + 1}</h4>
                      <button
                        onClick={() => removeResult(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">พารามิเตอร์ *</label>
                        <input
                          type="text"
                          value={Result.parameter}
                          onChange={(e) => updateResult(index, 'parameter', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="เช่น Hemoglobin, Glucose"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ค่า *</label>
                        <input
                          type="text"
                          value={Result.value}
                          onChange={(e) => updateResult(index, 'value', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="เช่น 12.5, 95"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">หน่วย</label>
                        <input
                          type="text"
                          value={Result.unit}
                          onChange={(e) => updateResult(index, 'unit', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="เช่น g/dL, mg/dL"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ค่าปกติ</label>
                        <input
                          type="text"
                          value={Result.normalRange}
                          onChange={(e) => updateResult(index, 'normalRange', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="เช่น 12-16 g/dL"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ *</label>
                        <select
                          value={Result.status}
                          onChange={(e) => updateResult(index, 'status', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="normal">ปกติ</option>
                          <option value="abnormal">ผิดปกติ</option>
                          <option value="critical">วิกฤต</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
                      <textarea
                        value={Result.notes}
                        onChange={(e) => updateResult(index, 'notes', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={2}
                        placeholder="กรอกหมายเหตุเพิ่มเติม"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Overall Result */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ผลการตรวจโดยรวม *
                </label>
                <select
                  value={labResultData.overallResult}
                  onChange={(e) => setLabResultData(prev => ({ ...prev, overallResult: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="normal">ปกติ</option>
                  <option value="abnormal">ผิดปกติ</option>
                  <option value="critical">วิกฤต</option>
                </select>
              </div>

              {/* Interpretation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  การแปลผล
                </label>
                <textarea
                  value={labResultData.interpretation}
                  onChange={(e) => setLabResultData(prev => ({ ...prev, interpretation: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  placeholder="กรอกการแปลผลการตรวจ"
                />
              </div>

              {/* Recommendations */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  คำแนะนำ
                </label>
                <textarea
                  value={labResultData.recommendations}
                  onChange={(e) => setLabResultData(prev => ({ ...prev, recommendations: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  placeholder="กรอกคำแนะนำ"
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  แนบไฟล์
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 inline-block"
                  >
                    เลือกไฟล์
                  </label>
                  <p className="text-sm text-gray-500 mt-2">
                    รองรับไฟล์ PDF, JPG, PNG, DOC, DOCX
                  </p>
                </div>
                
                {labResultData.attachments.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">ไฟล์ที่แนบ:</h4>
                    {labResultData.attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded mb-2">
                        <span className="text-sm text-gray-700">{file.fileName}</span>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">หมายเหตุ</label>
                <textarea
                  value={labResultData.notes}
                  onChange={(e) => setLabResultData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  placeholder="กรอกหมายเหตุเพิ่มเติม"
                />
              </div>

              {/* AI Research Data Section for Lab Results */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                    <Brain className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-purple-800">ข้อมูลสำหรับ AI และการวิจัยแล็บ</h3>
                    <p className="text-purple-600">ข้อมูลเพิ่มเติมเพื่อการพัฒนาระบบ AI และการวิจัยแล็บ</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Clinical Analysis */}
                  <div className="bg-white rounded-lg p-4 border border-purple-100">
                    <h4 className="text-sm font-semibold text-purple-800 mb-3">การวิเคราะห์ทางคลินิก</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          ความสำคัญทางคลินิก
                        </label>
                        <select
                          value={labResultData.aiResearchData.clinicalSignificance}
                          onChange={(e) => setLabResultData(prev => ({
                            ...prev,
                            aiResearchData: { ...prev.aiResearchData, clinicalSignificance: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">เลือกความสำคัญ</option>
                          <option value="critical">วิกฤต - ต้องดำเนินการทันที</option>
                          <option value="high">สูง - ต้องติดตามใกล้ชิด</option>
                          <option value="moderate">ปานกลาง - ต้องติดตาม</option>
                          <option value="low">ต่ำ - ติดตามตามปกติ</option>
                          <option value="normal">ปกติ - ไม่ต้องดำเนินการพิเศษ</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          การวิเคราะห์แนวโน้ม
                        </label>
                        <textarea
                          value={labResultData.aiResearchData.trendAnalysis}
                          onChange={(e) => setLabResultData(prev => ({
                            ...prev,
                            aiResearchData: { ...prev.aiResearchData, trendAnalysis: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          rows={3}
                          placeholder="เช่น ค่าเพิ่มขึ้นจากครั้งก่อน, มีแนวโน้มดีขึ้น"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          ความสัมพันธ์กับอาการ
                        </label>
                        <textarea
                          value={labResultData.aiResearchData.correlationWithSymptoms}
                          onChange={(e) => setLabResultData(prev => ({
                            ...prev,
                            aiResearchData: { ...prev.aiResearchData, correlationWithSymptoms: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          rows={3}
                          placeholder="เช่น สอดคล้องกับอาการที่ผู้ป่วยรายงาน, ไม่สอดคล้องกับอาการ"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quality & Methodology */}
                  <div className="bg-white rounded-lg p-4 border border-purple-100">
                    <h4 className="text-sm font-semibold text-purple-800 mb-3">คุณภาพและวิธีการ</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          การควบคุมคุณภาพ
                        </label>
                        <select
                          value={labResultData.aiResearchData.qualityControl}
                          onChange={(e) => setLabResultData(prev => ({
                            ...prev,
                            aiResearchData: { ...prev.aiResearchData, qualityControl: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">เลือกการควบคุมคุณภาพ</option>
                          <option value="excellent">ดีมาก - ผ่านการควบคุมคุณภาพทุกขั้นตอน</option>
                          <option value="good">ดี - ผ่านการควบคุมคุณภาพตามมาตรฐาน</option>
                          <option value="fair">ปานกลาง - มีการควบคุมคุณภาพพื้นฐาน</option>
                          <option value="poor">ไม่ดี - การควบคุมคุณภาพไม่เพียงพอ</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          วิธีการตรวจ
                        </label>
                        <textarea
                          value={labResultData.aiResearchData.methodology}
                          onChange={(e) => setLabResultData(prev => ({
                            ...prev,
                            aiResearchData: { ...prev.aiResearchData, methodology: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          rows={3}
                          placeholder="เช่น ใช้เครื่องมือ XYZ, วิธีการมาตรฐาน ISO"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          ข้อจำกัด
                        </label>
                        <textarea
                          value={labResultData.aiResearchData.limitations}
                          onChange={(e) => setLabResultData(prev => ({
                            ...prev,
                            aiResearchData: { ...prev.aiResearchData, limitations: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          rows={3}
                          placeholder="เช่น ตัวอย่างไม่เพียงพอ, สภาวะการเก็บรักษาไม่เหมาะสม"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional AI Research Fields */}
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      ปัจจัยเสี่ยงที่เกี่ยวข้อง
                    </label>
                    <textarea
                      value={labResultData.aiResearchData.riskFactors}
                      onChange={(e) => setLabResultData(prev => ({
                        ...prev,
                        aiResearchData: { ...prev.aiResearchData, riskFactors: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                      placeholder="เช่น อายุ, โรคประจำตัว, พฤติกรรมเสี่ยง"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      คำแนะนำการติดตาม
                    </label>
                    <textarea
                      value={labResultData.aiResearchData.followUpRecommendations}
                      onChange={(e) => setLabResultData(prev => ({
                        ...prev,
                        aiResearchData: { ...prev.aiResearchData, followUpRecommendations: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                      placeholder="เช่น ตรวจซ้ำใน 1 สัปดาห์, ติดตามอาการ"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    การสนับสนุนการตัดสินใจทางคลินิก
                  </label>
                  <textarea
                    value={labResultData.aiResearchData.clinicalDecisionSupport}
                    onChange={(e) => setLabResultData(prev => ({
                      ...prev,
                      aiResearchData: { ...prev.aiResearchData, clinicalDecisionSupport: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                    placeholder="เช่น ผลการตรวจสนับสนุนการวินิจฉัย X, ควรพิจารณาการตรวจเพิ่มเติม"
                  />
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    หมายเหตุสำหรับการวิจัยแล็บ
                  </label>
                  <textarea
                    value={labResultData.aiResearchData.researchNotes}
                    onChange={(e) => setLabResultData(prev => ({
                      ...prev,
                      aiResearchData: { ...prev.aiResearchData, researchNotes: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={4}
                    placeholder="ข้อมูลเพิ่มเติมที่สำคัญสำหรับการวิจัยแล็บและพัฒนาระบบ AI"
                  />
                </div>

                <div className="mt-4 p-4 bg-purple-100 border border-purple-200 rounded-lg">
                  <div className="flex items-start">
                    <Database className="w-5 h-5 text-purple-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="text-sm text-purple-800">
                      <p className="font-medium mb-1">ประโยชน์ของข้อมูล AI Research สำหรับแล็บ:</p>
                      <ul className="space-y-1 text-purple-700">
                        <li>• ช่วยพัฒนาระบบ AI ในการวิเคราะห์ผลแล็บและคาดการณ์โรค</li>
                        <li>• ใช้ในการวิจัยเพื่อหาความสัมพันธ์ระหว่างผลแล็บกับโรค</li>
                        <li>• ปรับปรุงการควบคุมคุณภาพและการแปลผล</li>
                        <li>• สร้างฐานข้อมูลสำหรับการวิเคราะห์แนวโน้มสุขภาพ</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !labResultData.Type || !labResultData.Name || labResultData.Results.length === 0}
                  className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <CheckCircle className="h-5 w-5" />
                  {isSubmitting ? "กำลังบันทึก..." : "บันทึกผลแลบ"}
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
                <p className="text-red-800 whitespace-pre-line">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}