"use client";
import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { logger } from '@/lib/logger';

interface MedicalRecord {
  id: string;
  visit_number: string;
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
                  {records.length > 0 ? new Date(records[0].visit_date).toLocaleDateString('th-TH') : '-'}
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
                          การรักษาครั้งที่ {record.visit_number}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRecordColor(record.visit_type)}`}>
                          {record.visit_type}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                          {getStatusText(record.visit_status)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <p><span className="font-medium text-gray-700">วันที่:</span> <span className="text-gray-900">{new Date(record.visit_date).toLocaleDateString('th-TH')}</span></p>
                          <p><span className="font-medium text-gray-700">เวลา:</span> <span className="text-gray-900">{record.visit_time}</span></p>
                          <p><span className="font-medium text-gray-700">อาการหลัก:</span> <span className="text-gray-900">{record.chief_complaint}</span></p>
                        </div>
                        <div>
                          <p><span className="font-medium text-gray-700">การวินิจฉัย:</span> <span className="text-gray-900">{record.diagnosis}</span></p>
                          <p><span className="font-medium text-gray-700">แผนการรักษา:</span> <span className="text-gray-900">{record.treatment_plan}</span></p>
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
                          <span className="font-medium">นัดติดตาม:</span> {new Date(record.follow_up_date).toLocaleDateString('th-TH')}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    <button className="px-3 py-1 text-sm border border-slate-300 rounded-lg hover:bg-gray-50 transition-colors">
                      ดูรายละเอียด
                    </button>
                    <button className="px-3 py-1 text-sm border border-slate-300 rounded-lg hover:bg-gray-50 transition-colors">
                      พิมพ์
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}