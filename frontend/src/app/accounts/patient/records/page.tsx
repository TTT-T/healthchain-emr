"use client";
import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { logger } from '@/lib/logger';

interface MedicalRecord {
  id: string;
  visitNumber: string;
  visit_date: string;
  visit_time: string;
  visit_type: string;
  chief_complaint: string;
  present_illness: string;
  diagnosis: string;
  treatment_plan: string;
  recommendations: string;
  follow_up_date: string;
  visit_status: string;
  status: string;
  created_at: string;
  updated_at: string;
  lab_results?: any[];
  prescriptions?: any[];
  vital_signs?: any[];
  visit_attachments?: any[];
}

export default function Records() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);

  // Helper function to format date and time correctly
  const formatVisitDateTime = (visitDate: string, visitTime: string) => {
    const date = new Date(visitDate);
    const formattedDate = date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return {
      date: formattedDate,
      time: visitTime
    };
  };

  const fetchRecords = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (user?.id) {
        const response = await apiClient.getPatientRecords(user.id);
        if (response.statusCode === 200 && response.data) {
          // ตรวจสอบว่าข้อมูลเป็น array หรือไม่
          const recordsData = response.data;
          if (Array.isArray(recordsData)) {
            setRecords(recordsData as any);
          } else if (recordsData && typeof recordsData === 'object' && Array.isArray((recordsData as any).records)) {
            // กรณีที่ข้อมูลอยู่ใน records property (ตามโครงสร้าง backend)
            setRecords((recordsData as any).records as any);
          } else {
            // ถ้าไม่มีข้อมูลหรือไม่ใช่ array ให้ตั้งเป็น array ว่าง
            setRecords([]);
            logger.warn('Records data is not an array:', recordsData);
          }
        } else {
          setError(response.error?.message || "ไม่สามารถดึงข้อมูลประวัติการรักษาได้");
        }
      }
    } catch (err) {
      logger.error("Error fetching records:", err);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูลประวัติการรักษา");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchRecords();
    }
  }, [user, fetchRecords]);

  const getRecordIcon = (type: string) => {
    switch (type) {
      case "checkup": return "🩺";
      case "consultation": return "🩺";
      case "follow_up": return "📅";
      case "emergency": return "🚨";
      case "surgery": return "🏥";
      default: return "📋";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "เสร็จสิ้น";
      case "in_progress": return "ดำเนินการ";
      case "scheduled": return "นัดหมายแล้ว";
      case "cancelled": return "ยกเลิก";
      default: return "ไม่ระบุ";
    }
  };

  const getRecordColor = (type: string) => {
    switch (type) {
      case "checkup": return "bg-green-50 text-green-700 border-green-200";
      case "treatment": return "bg-blue-50 text-blue-700 border-blue-200";
      case "prescription": return "bg-purple-50 text-purple-700 border-purple-200";
      default: return "bg-slate-50 text-slate-800 border-slate-200";
    }
  };

  const filteredRecords = records.filter(record => {
    if (activeTab === "all") return true;
    return record.visit_type === activeTab;
  });

  const handleViewDetails = (record: MedicalRecord) => {
    setSelectedRecord(record);
  };

  const handlePrint = (record: MedicalRecord) => {
    // สร้างหน้าต่างใหม่สำหรับพิมพ์
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>ประวัติการรักษา - ${record.visitNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .section { margin-bottom: 20px; }
              .label { font-weight: bold; color: #333; }
              .value { margin-left: 10px; }
              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>ประวัติการรักษา</h1>
              <h2>การรักษาครั้งที่ ${record.visitNumber}</h2>
              <p>หมายเลข Visit: ${record.visit_number}</p>
            </div>
            
            <div class="section">
              <h3>ข้อมูลการรักษา</h3>
              <div class="grid">
                <div>
                  <p><span class="label">วันที่:</span> <span class="value">${formatVisitDateTime(record.visit_date, record.visit_time).date}</span></p>
                  <p><span class="label">เวลา:</span> <span class="value">${record.visit_time}</span></p>
                  <p><span class="label">ประเภท:</span> <span class="value">${record.visit_type}</span></p>
                  <p><span class="label">สถานะ:</span> <span class="value">${getStatusText(record.status || record.visit_status)}</span></p>
                  <p><span class="label">แพทย์:</span> <span class="value">${record.doctor_first_name && record.doctor_last_name ? `${record.doctor_first_name} ${record.doctor_last_name}` : 'ไม่ระบุ'}</span></p>
                  <p><span class="label">ระดับความสำคัญ:</span> <span class="value">${record.priority || 'ไม่ระบุ'}</span></p>
                  <p><span class="label">แผนก:</span> <span class="value">${record.department_name || 'ไม่ระบุ'}</span></p>
                </div>
                <div>
                  <p><span class="label">อาการหลัก:</span> <span class="value">${record.chief_complaint || 'ไม่ระบุ'}</span></p>
                  <p><span class="label">การวินิจฉัย:</span> <span class="value">${record.diagnosis || 'ไม่ระบุ'}</span></p>
                  <p><span class="label">แผนการรักษา:</span> <span class="value">${record.treatment_plan || 'ไม่ระบุ'}</span></p>
                </div>
              </div>
            </div>
            
            ${record.present_illness ? `
            <div class="section">
              <h3>ประวัติการเจ็บป่วยปัจจุบัน</h3>
              <p>${record.present_illness}</p>
            </div>
            ` : ''}
            
            ${record.recommendations ? `
            <div class="section">
              <h3>คำแนะนำ</h3>
              <p>${record.recommendations}</p>
            </div>
            ` : ''}
            
            ${record.follow_up_date ? `
            <div class="section">
              <h3>นัดติดตาม</h3>
              <p>วันที่: ${new Date(record.follow_up_date).toLocaleString('th-TH')}</p>
            </div>
            ` : ''}
            
            <div class="section">
              <p><small>พิมพ์เมื่อ: ${new Date().toLocaleString('th-TH')}</small></p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <AppLayout title={"ประวัติการรักษา"} userType={"patient"}>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">ประวัติการรักษา</h1>
              <p className="text-gray-600 mt-1">ติดตามประวัติการรักษาและข้อมูลสุขภาพของคุณ</p>
            </div>
            <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
              เพิ่มบันทึก
            </button>
          </div>
        </div>
          
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">บันทึกทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">{records.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-xl">📊</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">เดือนนี้</p>
                <p className="text-2xl font-bold text-gray-900">{records.filter(r => {
                  const recordDate = new Date(r.visit_date);
                  const now = new Date();
                  return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
                }).length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-xl">📅</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">ครั้งล่าสุด</p>
                <p className="text-lg font-semibold text-gray-900">
                  {records.length > 0 ? formatVisitDateTime(records[0].visit_date, records[0].visit_time).date : '-'}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-xl">🕒</div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-200">
            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: "ทั้งหมด", icon: "📋" },
                { id: "checkup", label: "ตรวจสุขภาพ", icon: "🩺" },
                { id: "treatment", label: "การรักษา", icon: "💊" },
                { id: "follow_up", label: "ติดตามผล", icon: "📅" },
                { id: "emergency", label: "ฉุกเฉิน", icon: "🚨" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Records List */}
        {isLoading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <div className="text-red-500 text-2xl">⚠️</div>
            <span className="text-red-700">{error}</span>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบบันทึกการรักษา</h3>
            <p className="text-gray-600">
              {activeTab === "all" 
                ? "ยังไม่มีบันทึกการรักษาในระบบ" 
                : `ไม่มีบันทึกประเภท ${[
                    { id: "checkup", label: "ตรวจสุขภาพ" },
                    { id: "treatment", label: "การรักษา" },
                    { id: "follow_up", label: "ติดตามผล" },
                    { id: "emergency", label: "ฉุกเฉิน" }
                  ].find(t => t.id === activeTab)?.label}`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecords.map((record) => (
              <div key={record.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-xl">
                      {getRecordIcon(record.visit_type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          การรักษาครั้งที่ {record.visitNumber}
                        </h3>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {record.visit_number}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRecordColor(record.visit_type)}`}>
                          {record.visit_type}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                          {getStatusText(record.status || record.visit_status)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <p><span className="font-medium text-gray-700">วันที่:</span> <span className="text-gray-900">{formatVisitDateTime(record.visit_date, record.visit_time).date}</span></p>
                          <p><span className="font-medium text-gray-700">เวลา:</span> <span className="text-gray-900">{formatVisitDateTime(record.visit_date, record.visit_time).time}</span></p>
                          <p><span className="font-medium text-gray-700">อาการหลัก:</span> <span className="text-gray-900">{record.chief_complaint}</span></p>
                          <p><span className="font-medium text-gray-700">แพทย์:</span> <span className="text-gray-900">{record.doctor_first_name && record.doctor_last_name ? `${record.doctor_first_name} ${record.doctor_last_name}` : 'ไม่ระบุ'}</span></p>
                        </div>
                        <div>
                          <p><span className="font-medium text-gray-700">การวินิจฉัย:</span> <span className="text-gray-900">{record.diagnosis || 'ไม่ระบุ'}</span></p>
                          <p><span className="font-medium text-gray-700">แผนการรักษา:</span> <span className="text-gray-900">{record.treatment_plan || 'ไม่ระบุ'}</span></p>
                          <p><span className="font-medium text-gray-700">ระดับความสำคัญ:</span> <span className="text-gray-900">{record.priority || 'ไม่ระบุ'}</span></p>
                          <p><span className="font-medium text-gray-700">แผนก:</span> <span className="text-gray-900">{record.department_name || 'ไม่ระบุ'}</span></p>
                        </div>
                      </div>
                      
                      {record.recommendations && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm">
                            <span className="font-medium text-gray-700">คำแนะนำ:</span> <span className="text-gray-900">{record.recommendations}</span>
                          </p>
                        </div>
                      )}
                      
                      {record.follow_up_date && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">นัดติดตาม:</span> {new Date(record.follow_up_date).toLocaleString('th-TH')}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    <button 
                      onClick={() => handleViewDetails(record)}
                      className="px-3 py-1 text-sm border border-slate-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      ดูรายละเอียด
                    </button>
                    <button 
                      onClick={() => handlePrint(record)}
                      className="px-3 py-1 text-sm border border-slate-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      พิมพ์
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Record Details Modal */}
        {selectedRecord && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-300 shadow-lg">
              {/* Header Bar */}
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 rounded-t-lg">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-lg">
                      {getRecordIcon(selectedRecord.visit_type)}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        การรักษาครั้งที่ {selectedRecord.visitNumber}
                      </h2>
                      <p className="text-sm text-gray-600">หมายเลข Visit: {selectedRecord.visit_number}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedRecord(null)}
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
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">วันที่:</span>
                      <span className="text-gray-900">{formatVisitDateTime(selectedRecord.visit_date, selectedRecord.visit_time).date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">เวลา:</span>
                      <span className="text-gray-900">{formatVisitDateTime(selectedRecord.visit_date, selectedRecord.visit_time).time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">ประเภท:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRecordColor(selectedRecord.visit_type)}`}>
                        {selectedRecord.visit_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">สถานะ:</span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                        {getStatusText(selectedRecord.status || selectedRecord.visit_status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">แพทย์:</span>
                      <span className="text-gray-900">{selectedRecord.doctor_first_name && selectedRecord.doctor_last_name ? `${selectedRecord.doctor_first_name} ${selectedRecord.doctor_last_name}` : 'ไม่ระบุ'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">ระดับความสำคัญ:</span>
                      <span className="text-gray-900">{selectedRecord.priority || 'ไม่ระบุ'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">แผนก:</span>
                      <span className="text-gray-900">{selectedRecord.department_name || 'ไม่ระบุ'}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-700">อาการหลัก:</span>
                      <p className="text-gray-900 mt-1">{selectedRecord.chief_complaint || 'ไม่ระบุ'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">การวินิจฉัย:</span>
                      <p className="text-gray-900 mt-1">{selectedRecord.diagnosis || 'ไม่ระบุ'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">แผนการรักษา:</span>
                      <p className="text-gray-900 mt-1">{selectedRecord.treatment_plan || 'ไม่ระบุ'}</p>
                    </div>
                  </div>
                </div>

                {/* Present Illness */}
                {selectedRecord.present_illness && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-gray-900">ประวัติการเจ็บป่วยปัจจุบัน</h3>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-gray-800">{selectedRecord.present_illness}</p>
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {selectedRecord.recommendations && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-gray-900">คำแนะนำ</h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-gray-800">{selectedRecord.recommendations}</p>
                    </div>
                  </div>
                )}

                {/* Follow Up */}
                {selectedRecord.follow_up_date && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-gray-900">นัดติดตาม</h3>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-gray-800">
                        <span className="font-medium">วันที่:</span> {new Date(selectedRecord.follow_up_date).toLocaleString('th-TH')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setSelectedRecord(null)}
                    className="px-6 py-2 text-gray-600 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-medium"
                  >
                    ปิด
                  </button>
                  <button
                    onClick={() => handlePrint(selectedRecord)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors font-medium shadow-md hover:shadow-lg"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                    </svg>
                    พิมพ์
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