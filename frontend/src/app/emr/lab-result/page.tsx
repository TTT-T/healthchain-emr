"use client";
import { useState } from "react";
import { Search, FileText, Plus, Trash2, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PatientService } from '@/services/patientService';
import { LabResultService } from '@/services/labResultService';
import { NotificationService } from '@/services/notificationService';
import { PatientDocumentService } from '@/services/patientDocumentService';
import { MedicalPatient } from '@/types/api';
import { logger } from '@/lib/logger';

interface TestResult {
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
  const [searchType, setSearchType] = useState<"hn" | "queue">("queue");
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

  const [labResultData, setLabResultData] = useState({
    testType: '',
    testName: '',
    testResults: [] as TestResult[],
    overallResult: 'normal',
    interpretation: '',
    recommendations: '',
    attachments: [] as any[],
    notes: '',
    testedTime: new Date().toISOString().slice(0, 16)
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

  const addTestResult = () => {
    const newTestResult = {
      parameter: '',
      value: '',
      unit: '',
      normalRange: '',
      status: 'normal',
      notes: ''
    };
    
    setLabResultData(prev => ({
      ...prev,
      testResults: [...prev.testResults, newTestResult]
    }));
  };

  const removeTestResult = (index: number) => {
    setLabResultData(prev => ({
      ...prev,
      testResults: prev.testResults.filter((_, i) => i !== index)
    }));
  };

  const updateTestResult = (index: number, field: string, value: any) => {
    setLabResultData(prev => {
      const updatedTestResults = [...prev.testResults];
      updatedTestResults[index] = { ...updatedTestResults[index], [field]: value };
      
      return {
        ...prev,
        testResults: updatedTestResults
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
      testedBy: user?.thaiName || `${user?.firstName} ${user?.lastName}` || 'เจ้าหน้าที่แลบ'
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
        user?.thaiName || `${user?.firstName} ${user?.lastName}` || 'เจ้าหน้าที่แลบ'
      );
      
      const response = await LabResultService.createLabResult(formattedData);
      
      if (response.statusCode === 201 && response.data) {
        await sendPatientNotification(selectedPatient, response.data);
        
        // Create document for patient
        await createPatientDocument(selectedPatient, response.data);
        
        setSuccess("บันทึกผลแลบสำเร็จ!\n\n✅ ระบบได้ส่งการแจ้งเตือนและเอกสารให้ผู้ป่วยแล้ว");
        
        // Reset form
        setTimeout(() => {
          setSelectedPatient(null);
          setSearchQuery("");
          setLabResultData(LabResultService.createEmptyLabResultData());
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
        patientHn: patient.hn || patient.hospitalNumber || '',
        patientNationalId: patient.nationalId || '',
        patientName: patient.thaiName || `${patient.firstName} ${patient.lastName}`,
        patientPhone: patient.phone || '',
        patientEmail: patient.email || '',
        recordType: 'lab_result',
        recordId: labResultRecord.id,
        chiefComplaint: `ผลแลบ: ${labResultRecord.testName}`,
        recordedBy: labResultRecord.testedBy,
        recordedTime: labResultRecord.testedTime,
        message: `มีผลแลบใหม่สำหรับคุณ ${patient.thaiName || `${patient.firstName} ${patient.lastName}`} โดย ${labResultRecord.testedBy}`
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
          patientHn: patient.hn || '',
          patientNationalId: patient.nationalId || '',
          patientName: patient.thaiName || ''
        },
        user?.id || '',
        user?.thaiName || `${user?.firstName} ${user?.lastName}` || 'เจ้าหน้าที่แลบ'
      );
      
      logger.info('Patient document created successfully for lab result', { 
        patientHn: patient.hn,
        recordType: 'lab_result'
      });
    } catch (error) {
      logger.error('Error creating patient document for lab result:', error);
      // ไม่ throw error เพื่อไม่ให้กระทบการบันทึกผลแลบ
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="กรอก HN หรือหมายเลขคิว"
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

          {/* Patient Info */}
          {selectedPatient && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-purple-800 mb-2">ข้อมูลผู้ป่วย</h3>
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

          {/* Lab Result Form */}
          {selectedPatient && (
            <div className="space-y-6">
              {/* Test Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ประเภทการตรวจ *
                  </label>
                  <input
                    type="text"
                    value={labResultData.testType}
                    onChange={(e) => setLabResultData(prev => ({ ...prev, testType: e.target.value }))}
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
                    value={labResultData.testName}
                    onChange={(e) => setLabResultData(prev => ({ ...prev, testName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="เช่น CBC, Urinalysis"
                  />
                </div>
              </div>

              {/* Test Results */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">ผลการตรวจ</h3>
                  <button
                    onClick={addTestResult}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    เพิ่มผลการตรวจ
                  </button>
                </div>

                {labResultData.testResults.map((testResult, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium text-gray-900">ผลการตรวจ {index + 1}</h4>
                      <button
                        onClick={() => removeTestResult(index)}
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
                          value={testResult.parameter}
                          onChange={(e) => updateTestResult(index, 'parameter', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="เช่น Hemoglobin, Glucose"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ค่า *</label>
                        <input
                          type="text"
                          value={testResult.value}
                          onChange={(e) => updateTestResult(index, 'value', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="เช่น 12.5, 95"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">หน่วย</label>
                        <input
                          type="text"
                          value={testResult.unit}
                          onChange={(e) => updateTestResult(index, 'unit', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="เช่น g/dL, mg/dL"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ค่าปกติ</label>
                        <input
                          type="text"
                          value={testResult.normalRange}
                          onChange={(e) => updateTestResult(index, 'normalRange', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="เช่น 12-16 g/dL"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ *</label>
                        <select
                          value={testResult.status}
                          onChange={(e) => updateTestResult(index, 'status', e.target.value)}
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
                        value={testResult.notes}
                        onChange={(e) => updateTestResult(index, 'notes', e.target.value)}
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

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !labResultData.testType || !labResultData.testName || labResultData.testResults.length === 0}
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