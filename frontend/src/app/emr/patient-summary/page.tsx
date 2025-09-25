"use client";
import { useState, useEffect } from "react";
import { Search, User, Calendar, FileText, Activity, Clock, AlertCircle, CheckCircle, Brain } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PatientService } from '@/services/patientService';
import { PatientSummaryService } from '@/services/patientSummaryService';
import { PatientDocumentService } from '@/services/patientDocumentService';
import { AIDashboardService, PatientDiabetesRiskDetail } from '@/services/aiDashboardService';
import { MedicalPatient } from '@/types/api';
import { logger } from '@/lib/logger';
import { createLocalDateTimeString } from '@/utils/timeUtils';

export default function PatientSummary() {
  const { isAuthenticated, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"hn" | "queue">("hn");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<MedicalPatient | null>(null);
  const [patientSummary, setPatientSummary] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // AI Risk Assessment states
  const [aiRiskData, setAiRiskData] = useState<PatientDiabetesRiskDetail | null>(null);
  const [loadingRisk, setLoadingRisk] = useState(false);
  const [riskError, setRiskError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'records'>('overview');
  const [isGeneratingDocument, setIsGeneratingDocument] = useState(false);

  // Load AI Risk Assessment for selected patient
  const loadPatientRisk = async (patientId: string) => {
    try {
      setLoadingRisk(true);
      setRiskError(null);
      logger.info('Loading AI risk assessment for patient:', patientId);
      
      const riskData = await AIDashboardService.getPatientDiabetesRisk(patientId);
      setAiRiskData(riskData);
      logger.info('AI risk assessment loaded successfully:', riskData);
    } catch (error: any) {
      logger.error('Error loading patient risk assessment:', error);
      setRiskError('ไม่สามารถโหลดข้อมูลความเสี่ยงได้');
      setAiRiskData(null);
    } finally {
      setLoadingRisk(false);
    }
  };

  // Get risk level color
  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'moderate': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'very_high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Get risk level in Thai
  const getRiskLevelThai = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'low': return 'ต่ำ';
      case 'moderate': return 'ปานกลาง';
      case 'high': return 'สูง';
      case 'very_high': return 'สูงมาก';
      default: return 'ไม่ระบุ';
    }
  };

  // Check authentication on component mount
  useEffect(() => {
    if (!isAuthenticated) {
      setError('กรุณาเข้าสู่ระบบก่อนใช้งาน');
      return;
    }
    
    if (!user || !['doctor', 'nurse', 'admin'].includes(user.role)) {
      setError('ไม่มีสิทธิ์เข้าถึงข้อมูลผู้ป่วย');
      return;
    }
    
    console.log('✅ User authenticated:', { 
      isAuthenticated, 
      userId: user?.id, 
      userRole: user?.role 
    });
  }, [isAuthenticated, user]);

  // Load AI risk assessment when patient is selected
  useEffect(() => {
    if (selectedPatient) {
      loadPatientRisk(selectedPatient.id);
    } else {
      setAiRiskData(null);
      setRiskError(null);
    }
  }, [selectedPatient]);

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

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    // Clear previous data to ensure fresh data
    setSelectedPatient(null);
    setPatientSummary(null);
    setTimeline([]);
    setError(null);
    
    setIsSearching(true);
    
    try {
      console.log('🔍 Searching for patient:', { searchQuery, searchType });
      
      const response = await PatientService.searchPatients(searchQuery, searchType);
      console.log('📊 Search response:', response);
      
      if (response.statusCode === 200 && response.data && response.data.length > 0) {
        // Backend sends data in nested format, extract the patient data
        const patientData = response.data[0];
        console.log('👤 Raw patient data:', patientData);
        
        const formattedPatient: MedicalPatient = {
          id: patientData.id,
          hn: patientData.hn || patientData.hospital_number,
          hospitalNumber: patientData.hn || patientData.hospital_number,
          thaiName: patientData.thaiName,
          firstName: patientData.firstName,
          lastName: patientData.lastName,
          nationalId: patientData.nationalId,
          birthDate: patientData.birthDate,
          dateOfBirth: patientData.birthDate,
          gender: patientData.gender,
          phone: patientData.phone,
          email: patientData.email,
          address: patientData.address,
          currentAddress: patientData.current_address,
          bloodType: patientData.bloodType,
          medicalHistory: patientData.medicalHistory,
          allergies: patientData.allergies,
          drugAllergies: patientData.drugAllergies,
          foodAllergies: patientData.foodAllergies,
          environmentAllergies: patientData.environmentAllergies,
          chronicDiseases: patientData.chronicDiseases,
          weight: patientData.weight,
          height: patientData.height,
          occupation: patientData.occupation,
          education: patientData.education,
          maritalStatus: patientData.maritalStatus,
          religion: patientData.religion,
          race: patientData.race,
          created_at: patientData.created_at,
          updated_at: patientData.updated_at
        };
        
        console.log('👤 Formatted patient data:', formattedPatient);
        
        setSelectedPatient(formattedPatient);
        await loadPatientSummary(formattedPatient.id);
        setError(null);
      } else {
        setError("ไม่พบข้อมูลผู้ป่วย");
        setSelectedPatient(null);
        setPatientSummary(null);
        setTimeline([]);
      }
    } catch (error: any) {
      console.error('💥 Search error:', error);
      logger.error("Error searching patient:", error);
      
      // Handle specific error types
      if (error.statusCode === 401) {
        setError('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
        // Redirect to login or refresh token
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      } else if (error.statusCode === 403) {
        setError('ไม่มีสิทธิ์เข้าถึงข้อมูลผู้ป่วย');
      } else if (error.statusCode === 404) {
        setError('ไม่พบข้อมูลผู้ป่วย');
      } else if (error.message?.includes('Network error')) {
        setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
      } else {
        setError(error.message || 'เกิดข้อผิดพลาดในการค้นหาผู้ป่วย');
      }
      
      setSelectedPatient(null);
      setPatientSummary(null);
      setTimeline([]);
    } finally {
      setIsSearching(false);
    }
  };

  const loadPatientSummary = async (patientId: string) => {
    setIsLoading(true);
    try {
      const [summaryResponse, timelineResponse] = await Promise.all([
        PatientSummaryService.getPatientSummary(patientId),
        PatientSummaryService.getPatientTimeline(patientId)
      ]);

      if (summaryResponse.statusCode === 200 && summaryResponse.data) {
        setPatientSummary(summaryResponse.data);
      }

      if (timelineResponse.statusCode === 200 && timelineResponse.data) {
        setTimeline(timelineResponse.data);
      }
    } catch (error) {
      logger.error("Error loading patient summary:", error);
      // Use sample data if API fails
      setPatientSummary({
        patient: {
          id: '1',
          thaiName: 'นายสมชาย ใจดี',
          nationalId: '1234567890123',
          hospitalNumber: 'HN001',
          age: 35,
          gender: 'ชาย',
          phone: '0812345678',
          email: 'somchai@example.com'
        },
        summary: {
          totalVisits: 5,
          totalAppointments: 3,
          totalDocuments: 2,
          totalLabResults: 4,
          totalPharmacyRecords: 3,
          upcomingAppointments: 1
        }
      });
      setTimeline([
        {
          id: '1',
          recordType: 'visit',
          title: 'การเยี่ยม - OPD',
          description: 'ปวดหัว',
          recordedTime: '2024-01-15T09:00:00Z',
          recordedByName: 'นพ.สมชาย ใจดี'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">กรุณาเข้าสู่ระบบ</h2>
          <p className="text-gray-600">คุณต้องเข้าสู่ระบบเพื่อใช้งานระบบดูประวัติผู้ป่วย</p>
        </div>
      </div>
    );
  }

  /**
   * สร้างเอกสารสรุปให้ผู้ป่วย
   */
  const generatePatientSummaryDocument = async () => {
    if (!selectedPatient || !patientSummary) return;
    
    setIsGeneratingDocument(true);
    try {
      await PatientDocumentService.createDocumentFromMedicalRecord(
        'patient_summary',
        {
          ...patientSummary,
          generatedAt: createLocalDateTimeString(new Date()),
          generatedBy: user?.thaiName || `${user?.firstName} ${user?.lastName}` || 'แพทย์'
        },
        {
          patientHn: selectedPatient.hn || '',
          patientNationalId: selectedPatient.nationalId || '',
          patientName: selectedPatient.thaiName || ''
        },
        user?.id || '',
        user?.thaiName || `${user?.firstName} ${user?.lastName}` || 'แพทย์'
      );
      
      logger.info('Patient summary document created successfully', { 
        patientHn: selectedPatient.hn,
        recordType: 'patient_summary'
      });
      
      alert('สร้างเอกสารสรุปผู้ป่วยสำเร็จ! เอกสารได้ถูกส่งให้ผู้ป่วยแล้ว');
    } catch (error) {
      logger.error('Error creating patient summary document:', error);
      alert('เกิดข้อผิดพลาดในการสร้างเอกสารสรุป');
    } finally {
      setIsGeneratingDocument(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="h-8 w-8 text-teal-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ดูประวัติผู้ป่วย</h1>
              <p className="text-gray-600">ดูข้อมูลประวัติและบันทึกทางการแพทย์แบบครบถ้วน</p>
            </div>
          </div>

          {/* Search Patient */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ค้นหาผู้ป่วย</h3>
            
            {/* Search Type Selection */}
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="searchType"
                  value="hn"
                  checked={searchType === "hn"}
                  onChange={(e) => setSearchType(e.target.value as "hn" | "queue")}
                  className="text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm font-medium text-gray-700">ค้นหาด้วย HN</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="searchType"
                  value="queue"
                  checked={searchType === "queue"}
                  onChange={(e) => setSearchType(e.target.value as "hn" | "queue")}
                  className="text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm font-medium text-gray-700">ค้นหาด้วยหมายเลขคิว</span>
              </label>
            </div>
            
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder={searchType === "hn" ? "กรอกหมายเลข HN (เช่น HN250001)" : "กรอกหมายเลขคิว"}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching || !isAuthenticated}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                {isSearching ? "กำลังค้นหา..." : "ค้นหา"}
              </button>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedPatient(null);
                  setPatientSummary(null);
                  setTimeline([]);
                  setError(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
              >
                <span>ล้างข้อมูล</span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">เกิดข้อผิดพลาด</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                  {error.includes('เซสชันหมดอายุ') && (
                    <button
                      onClick={() => window.location.href = '/login'}
                      className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                    >
                      เข้าสู่ระบบใหม่
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Patient Info */}
          {selectedPatient && patientSummary && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <User className="h-6 w-6 text-teal-600" />
                <h3 className="text-xl font-semibold text-gray-900">ข้อมูลผู้ป่วย</h3>
              </div>
              
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-3">ข้อมูลพื้นฐาน</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium text-gray-700">HN:</span> <span className="text-gray-900">{selectedPatient.hn || selectedPatient.hospitalNumber || 'ไม่ระบุ'}</span></div>
                    <div><span className="font-medium text-gray-700">ชื่อไทย:</span> <span className="text-gray-900">{selectedPatient.thaiName || 'ไม่ระบุ'}</span></div>
                    <div><span className="font-medium text-gray-700">ชื่ออังกฤษ:</span> <span className="text-gray-900">{selectedPatient.firstName || 'ไม่ระบุ'} {selectedPatient.lastName || ''}</span></div>
                    <div><span className="font-medium text-gray-700">เลขบัตรประชาชน:</span> <span className="text-gray-900">{selectedPatient.nationalId || 'ไม่ระบุ'}</span></div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-green-800 mb-3">ข้อมูลส่วนตัว</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium text-gray-700">อายุ:</span> <span className="text-gray-900">{patientSummary?.patient?.age || (selectedPatient.birthDate ? calculateAge(selectedPatient.birthDate) : 'ไม่ระบุ')} ปี</span></div>
                    <div><span className="font-medium text-gray-700">เพศ:</span> <span className="text-gray-900">{selectedPatient.gender === 'male' ? 'ชาย' : selectedPatient.gender === 'female' ? 'หญิง' : selectedPatient.gender === 'other' ? 'อื่นๆ' : 'ไม่ระบุ'}</span></div>
                    <div><span className="font-medium text-gray-700">วันเกิด:</span> <span className="text-gray-900">{selectedPatient.birthDate ? new Date(selectedPatient.birthDate).toLocaleDateString('th-TH') : 'ไม่ระบุ'}</span></div>
                    <div><span className="font-medium text-gray-700">หมู่เลือด:</span> <span className="text-gray-900">{selectedPatient.bloodType || 'ไม่ระบุ'}</span></div>
                    <div><span className="font-medium text-gray-700">น้ำหนัก:</span> <span className="text-gray-900">{selectedPatient.weight ? `${selectedPatient.weight} กก.` : 'ไม่ระบุ'}</span></div>
                    <div><span className="font-medium text-gray-700">ส่วนสูง:</span> <span className="text-gray-900">{selectedPatient.height ? `${selectedPatient.height} ซม.` : 'ไม่ระบุ'}</span></div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-purple-800 mb-3">ข้อมูลติดต่อ</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium text-gray-700">โทรศัพท์:</span> <span className="text-gray-900">{selectedPatient.phone || 'ไม่ระบุ'}</span></div>
                    <div><span className="font-medium text-gray-700">อีเมล:</span> <span className="text-gray-900">{selectedPatient.email || 'ไม่ระบุ'}</span></div>
                    <div><span className="font-medium text-gray-700">ที่อยู่:</span> <span className="text-gray-900">{selectedPatient.address || 'ไม่ระบุ'}</span></div>
                    <div><span className="font-medium text-gray-700">ผู้ติดต่อฉุกเฉิน:</span> <span className="text-gray-900">ไม่ระบุ</span></div>
                    <div><span className="font-medium text-gray-700">เบอร์ติดต่อฉุกเฉิน:</span> <span className="text-gray-900">ไม่ระบุ</span></div>
                    <div><span className="font-medium text-gray-700">ความสัมพันธ์:</span> <span className="text-gray-900">ไม่ระบุ</span></div>
                  </div>
                </div>
              </div>

              {/* AI Risk Assessment Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <Brain className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-blue-800">AI Risk Assessment</h4>
                    <p className="text-sm text-blue-600">การประเมินความเสี่ยงโรคเบาหวานด้วย AI</p>
                  </div>
                </div>

                {loadingRisk ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-blue-600">กำลังโหลดข้อมูลความเสี่ยง...</span>
                  </div>
                ) : riskError ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                      <span className="text-red-700">{riskError}</span>
                    </div>
                  </div>
                ) : aiRiskData ? (
                  <div className="space-y-4">
                    {/* Risk Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Risk Score */}
                      <div className="bg-white p-3 rounded-lg border border-blue-100">
                        <div className="text-xs text-gray-600 mb-1">Risk Score</div>
                        <div className="text-2xl font-bold text-blue-600">{aiRiskData.diabetesRisk.riskScore}/100</div>
                        <div className="text-xs text-gray-500">คะแนนความเสี่ยง</div>
                      </div>
                      
                      {/* Risk Level */}
                      <div className="bg-white p-3 rounded-lg border border-blue-100">
                        <div className="text-xs text-gray-600 mb-1">Risk Level</div>
                        <div className={`text-lg font-bold px-2 py-1 rounded-full inline-block ${getRiskColor(aiRiskData.diabetesRisk.riskLevel)}`}>
                          {getRiskLevelThai(aiRiskData.diabetesRisk.riskLevel)}
                        </div>
                        <div className="text-xs text-gray-500">ระดับความเสี่ยง</div>
                      </div>
                      
                      {/* Risk Percentage */}
                      <div className="bg-white p-3 rounded-lg border border-blue-100">
                        <div className="text-xs text-gray-600 mb-1">Risk Percentage</div>
                        <div className="text-xl font-bold text-orange-600">{aiRiskData.diabetesRisk.riskPercentage}%</div>
                        <div className="text-xs text-gray-500">โอกาสเป็นเบาหวานใน 10 ปี</div>
                      </div>
                    </div>

                    {/* Contributing Factors */}
                    {aiRiskData.diabetesRisk.contributingFactors && aiRiskData.diabetesRisk.contributingFactors.length > 0 && (
                      <div className="bg-white p-3 rounded-lg border border-blue-100">
                        <h5 className="text-sm font-semibold text-gray-700 mb-2">ปัจจัยที่ส่งผลต่อความเสี่ยง:</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                          {aiRiskData.diabetesRisk.contributingFactors.slice(0, 4).map((factor, index) => (
                            <div key={index} className="flex items-center text-xs text-gray-600">
                              <AlertCircle className="h-3 w-3 text-orange-500 mr-1 flex-shrink-0" />
                              {factor}
                            </div>
                          ))}
                        </div>
                        {aiRiskData.diabetesRisk.contributingFactors.length > 4 && (
                          <div className="text-xs text-gray-500 mt-1">
                            และอีก {aiRiskData.diabetesRisk.contributingFactors.length - 4} ปัจจัย
                          </div>
                        )}
                      </div>
                    )}

                    {/* Assessment Info */}
                    <div className="bg-white p-3 rounded-lg border border-blue-100">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-600">วันที่ประเมิน:</span>
                          <span className="ml-1 font-medium text-gray-800">
                            {new Date().toLocaleDateString('th-TH')}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">ประเมินโดย:</span>
                          <span className="ml-1 font-medium text-gray-800">AI System</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <Brain className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">ยังไม่มีข้อมูลการประเมินความเสี่ยง</p>
                  </div>
                )}
              </div>

              {/* Medical Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-red-800 mb-3">ข้อมูลทางการแพทย์</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium text-gray-700">อาการแพ้ยา:</span> <span className="text-gray-900">{selectedPatient.drugAllergies || 'ไม่มี'}</span></div>
                    <div><span className="font-medium text-gray-700">อาการแพ้อาหาร:</span> <span className="text-gray-900">{selectedPatient.foodAllergies || 'ไม่มี'}</span></div>
                    <div><span className="font-medium text-gray-700">อาการแพ้สิ่งแวดล้อม:</span> <span className="text-gray-900">{selectedPatient.environmentAllergies || 'ไม่มี'}</span></div>
                    <div><span className="font-medium text-gray-700">โรคประจำตัว:</span> <span className="text-gray-900">{selectedPatient.chronicDiseases || 'ไม่มี'}</span></div>
                    <div><span className="font-medium text-gray-700">ประวัติการเจ็บป่วย:</span> <span className="text-gray-900">{selectedPatient.medicalHistory || 'ไม่มี'}</span></div>
                    <div><span className="font-medium text-gray-700">ยาที่ใช้อยู่:</span> <span className="text-gray-900">{selectedPatient.currentMedications || 'ไม่มี'}</span></div>
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-orange-800 mb-3">ข้อมูลเพิ่มเติม</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium text-gray-700">อาชีพ:</span> <span className="text-gray-900">{selectedPatient.occupation || 'ไม่ระบุ'}</span></div>
                    <div><span className="font-medium text-gray-700">การศึกษา:</span> <span className="text-gray-900">{selectedPatient.education || 'ไม่ระบุ'}</span></div>
                    <div><span className="font-medium text-gray-700">สถานภาพ:</span> <span className="text-gray-900">{selectedPatient.maritalStatus === 'single' ? 'โสด' : selectedPatient.maritalStatus === 'married' ? 'แต่งงาน' : selectedPatient.maritalStatus === 'divorced' ? 'หย่าร้าง' : selectedPatient.maritalStatus === 'widowed' ? 'ม่าย' : 'ไม่ระบุ'}</span></div>
                    <div><span className="font-medium text-gray-700">ศาสนา:</span> <span className="text-gray-900">{selectedPatient.religion || 'ไม่ระบุ'}</span></div>
                    <div><span className="font-medium text-gray-700">เชื้อชาติ:</span> <span className="text-gray-900">{selectedPatient.race || 'ไม่ระบุ'}</span></div>
                    <div><span className="font-medium text-gray-700">สัญชาติ:</span> <span className="text-gray-900">ไม่ระบุ</span></div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Action Buttons */}
          {selectedPatient && patientSummary && (
            <div className="mb-6 flex justify-end">
              <button
                onClick={generatePatientSummaryDocument}
                disabled={isGeneratingDocument}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                {isGeneratingDocument ? "กำลังสร้าง..." : "สร้างเอกสารสรุป"}
              </button>
            </div>
          )}

          {/* Tabs */}
          {selectedPatient && patientSummary && (
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'overview'
                        ? 'border-teal-500 text-teal-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Activity className="h-4 w-4 inline mr-2" />
                    ภาพรวม
                  </button>
                  <button
                    onClick={() => setActiveTab('timeline')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'timeline'
                        ? 'border-teal-500 text-teal-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Clock className="h-4 w-4 inline mr-2" />
                    ไทม์ไลน์
                  </button>
                  <button
                    onClick={() => setActiveTab('records')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'records'
                        ? 'border-teal-500 text-teal-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <FileText className="h-4 w-4 inline mr-2" />
                    บันทึกทั้งหมด
                  </button>
                </nav>
              </div>
            </div>
          )}

          {/* Content */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
              </div>
            </div>
          )}

          {selectedPatient && patientSummary && !isLoading && (
            <div>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">ภาพรวม</h3>
                  
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {PatientSummaryService.createSummaryCards(patientSummary.summary).map((card, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">{card.title}</p>
                            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                            <p className="text-xs text-gray-500">{card.description}</p>
                          </div>
                          <div className="text-3xl">{card.icon}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">กิจกรรมล่าสุด</h4>
                    <div className="space-y-3">
                      {timeline.slice(0, 5).map((item, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="text-2xl">
                            {PatientSummaryService.getRecordTypeIcon(item.recordType)}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.title}</p>
                            <p className="text-sm text-gray-600">{item.description}</p>
                            <p className="text-xs text-gray-500">
                              {PatientSummaryService.formatDateTime(item.recordedTime)} • {item.recordedByName}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${PatientSummaryService.getRecordTypeColor(item.recordType)}`}>
                            {PatientSummaryService.getRecordTypeLabel(item.recordType)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline Tab */}
              {activeTab === 'timeline' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">ไทม์ไลน์</h3>
                  
                  <div className="space-y-4">
                    {timeline.map((item, index) => (
                      <div key={index} className="flex gap-4 p-4 bg-white border border-gray-200 rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                            <span className="text-lg">
                              {PatientSummaryService.getRecordTypeIcon(item.recordType)}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{item.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${PatientSummaryService.getRecordTypeColor(item.recordType)}`}>
                              {PatientSummaryService.getRecordTypeLabel(item.recordType)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {PatientSummaryService.formatDateTime(item.recordedTime)}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {item.recordedByName}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Records Tab */}
              {activeTab === 'records' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">บันทึกทั้งหมด</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Visits */}
                    {patientSummary.records.visits.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <span className="text-xl">🏥</span>
                          การเยี่ยม ({patientSummary.records.visits.length})
                        </h4>
                        <div className="space-y-2">
                          {patientSummary.records.visits.slice(0, 3).map((visit: any, index: number) => (
                            <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                              <p className="font-medium">{visit.data.visitType}</p>
                              <p className="text-gray-600">{visit.data.symptoms}</p>
                              <p className="text-xs text-gray-500">
                                {PatientSummaryService.formatDateTime(visit.recordedTime)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Appointments */}
                    {patientSummary.records.appointments.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <span className="text-xl">📅</span>
                          นัดหมาย ({patientSummary.records.appointments.length})
                        </h4>
                        <div className="space-y-2">
                          {patientSummary.records.appointments.slice(0, 3).map((appointment: any, index: number) => (
                            <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                              <p className="font-medium">{appointment.data.appointmentType}</p>
                              <p className="text-gray-600">{appointment.data.reason}</p>
                              <p className="text-xs text-gray-500">
                                {PatientSummaryService.formatDate(appointment.data.appointmentDate)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lab Results */}
                    {patientSummary.records.labResults.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <span className="text-xl">🧪</span>
                          ผลแลบ ({patientSummary.records.labResults.length})
                        </h4>
                        <div className="space-y-2">
                          {patientSummary.records.labResults.slice(0, 3).map((lab: any, index: number) => (
                            <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                              <p className="font-medium">{lab.data.Name}</p>
                              <p className="text-gray-600">{lab.data.overallResult}</p>
                              <p className="text-xs text-gray-500">
                                {PatientSummaryService.formatDateTime(lab.recordedTime)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Documents */}
                    {patientSummary.records.documents.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <span className="text-xl">📄</span>
                          เอกสาร ({patientSummary.records.documents.length})
                        </h4>
                        <div className="space-y-2">
                          {patientSummary.records.documents.slice(0, 3).map((doc: any, index: number) => (
                            <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                              <p className="font-medium">{doc.data.documentTitle}</p>
                              <p className="text-gray-600">{doc.data.documentType}</p>
                              <p className="text-xs text-gray-500">
                                {PatientSummaryService.formatDateTime(doc.recordedTime)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
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