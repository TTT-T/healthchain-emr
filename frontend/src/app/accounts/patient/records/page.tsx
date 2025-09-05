"use client";
import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";

interface MedicalRecord {
  id: string;
  date: string;
  type: 'checkup' | 'treatment' | 'prescription' | 'emergency';
  title: string;
  doctor: string;
  hospital: string;
  summary: string;
  details: string[];
  status: 'completed' | 'ongoing' | 'pending';
}

export default function Records() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchRecords();
    }
  }, [user]);

  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // TODO: เมื่อ backend API สำหรับ medical records พร้อมแล้ว ให้ใช้ apiClient.get('/medical-records')
      // const response = await apiClient.get('/medical-records');
      // if (response.data) {
      //   setRecords(response.data);
      // }
      
      // ตอนนี้แสดง empty state เนื่องจากยังไม่มี API จริง
      setRecords([]);
    } catch (err) {
      console.error("Error fetching records:", err);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูลประวัติการรักษา");
    } finally {
      setIsLoading(false);
    }
  };

  const getRecordIcon = (type: string) => {
    switch (type) {
      case "checkup": return "🩺";
      case "treatment": return "💊";  
      case "prescription": return "📋";
      default: return "📄";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "ongoing": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-900";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "เสร็จสิ้น";
      case "ongoing": return "ดำเนินการ";
      case "pending": return "รอดำเนินการ";
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
    return record.type === activeTab;
  });

  return (
    <AppLayout title="ประวัติการรักษา" userType="patient">
      <div className="bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto p-4 space-y-6">
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-800 mb-1">บันทึกทั้งหมด</p>
                  <p className="text-2xl font-bold text-slate-800">{records.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-xl">📊</div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-800 mb-1">เดือนนี้</p>
                  <p className="text-2xl font-bold text-slate-800">{records.filter(r => {
                    const recordDate = new Date(r.date);
                    const now = new Date();
                    return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
                  }).length}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-xl">📅</div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-800 mb-1">ครั้งล่าสุด</p>
                  <p className="text-lg font-semibold text-slate-800">
                    {records.length > 0 ? new Date(records[0].date).toLocaleDateString('th-TH') : '-'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-xl">🕒</div>
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-800 mb-2">บันทึกการรักษา</h2>
                <p className="text-slate-800">ติดตามประวัติการรักษาและข้อมูลสุขภาพของคุณ</p>
              </div>
              <button
                onClick={() => {/* TODO: Add modal */}}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
                <span>เพิ่มบันทึก</span>
              </button>
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
                  { id: "prescription", label: "ใบสั่งยา", icon: "📄" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ease-out ${
                      activeTab === tab.id
                        ? "bg-blue-500 text-white shadow-md"
                        : "text-slate-800 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Records List */}
            <div className="p-4">
              {filteredRecords.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-lg font-medium text-slate-800 mb-2">ไม่มีบันทึกในหมวดนี้</h3>
                  <p className="text-slate-800">เริ่มต้นเพิ่มบันทึกการรักษาของคุณ</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRecords.map((record) => (
                    <div key={record.id} className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-lg border flex items-center justify-center text-xl ${getRecordColor(record.type)}`}>
                            {getRecordIcon(record.type)}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-800 mb-1">{record.title}</h3>
                            <p className="text-sm text-slate-800 mb-2">{new Date(record.date).toLocaleDateString('th-TH', {
                              year: 'numeric',
                              month: 'long', 
                              day: 'numeric'
                            })}</p>
                            <div className="flex items-center space-x-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                                {getStatusText(record.status)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => {/* TODO: View details */}}
                          className="text-slate-600 hover:text-slate-800 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                          </svg>
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-slate-800 mb-1">แพทย์ผู้รักษา</p>
                          <p className="font-medium text-slate-800">{record.doctor}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-800 mb-1">สถานพยาบาล</p>
                          <p className="font-medium text-slate-800">{record.hospital}</p>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm text-slate-800 mb-2">สรุปการรักษา</p>
                        <p className="text-slate-800">{record.summary}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-slate-800 mb-2">รายละเอียด</p>
                        <ul className="space-y-1">
                          {record.details.map((detail, index) => (
                            <li key={index} className="text-sm text-slate-700 flex items-start">
                              <span className="text-blue-500 mr-2">•</span>
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
