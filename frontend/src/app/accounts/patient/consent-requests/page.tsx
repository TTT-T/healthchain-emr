"use client";
import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { logger } from '@/lib/logger';

interface ConsentRequest {
  id: string;
  patient_id: string;
  requester_name: string;
  requester_organization: string;
  purpose: string;
  data_types_requested: string[];
  request_status: string;
  priority: string;
  requested_date: string;
  expiry_date: string;
  response_deadline: string;
  justification: string;
  data_sensitivity: string;
  retention_period: string;
  created_at: string;
  updated_at: string;
}

export default function ConsentRequests() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [consentRequests, setConsentRequests] = useState<ConsentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConsentRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (user?.id) {
        const response = await apiClient.getPatientConsentRequests(user.id);
        if (response.statusCode === 200 && response.data) {
          const requestsData = response.data;
          if (Array.isArray(requestsData)) {
            setConsentRequests(requestsData as any);
          } else if (requestsData && typeof requestsData === 'object' && Array.isArray((requestsData as any).consentRequests)) {
            setConsentRequests((requestsData as any).consentRequests as any);
          } else {
            setConsentRequests([]);
            logger.warn('Consent requests data is not an array:', requestsData);
          }
        } else {
          setError(response.error?.message || "ไม่สามารถดึงข้อมูลคำขอการเข้าถึงได้");
        }
      }
    } catch (err) {
      logger.error("Error fetching consent requests:", err);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูลคำขอการเข้าถึง");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchConsentRequests();
    }
  }, [user, fetchConsentRequests]);

  const approveRequest = async (requestId: string) => {
    try {
      // Update local state immediately
      setConsentRequests(prev => 
        prev.map(request => 
          request.id === requestId 
            ? { ...request, request_status: "approved" }
            : request
        )
      );
      
      // TODO: Call API to approve request
      // await apiClient.approveConsentRequest(requestId);
    } catch (err) {
      logger.error("Error approving consent request:", err);
    }
  };

  const rejectRequest = async (requestId: string) => {
    try {
      setConsentRequests(prev => 
        prev.map(request => 
          request.id === requestId 
            ? { ...request, request_status: "rejected" }
            : request
        )
      );
      
      // TODO: Call API to reject request
      // await apiClient.rejectConsentRequest(requestId);
    } catch (err) {
      logger.error("Error rejecting consent request:", err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return "⏳";
      case "approved": return "✅";
      case "rejected": return "❌";
      case "expired": return "⏰";
      case "revoked": return "🚫";
      default: return "📋";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "approved": return "bg-green-50 text-green-700 border-green-200";
      case "rejected": return "bg-red-50 text-red-700 border-red-200";
      case "expired": return "bg-gray-50 text-gray-700 border-gray-200";
      case "revoked": return "bg-purple-50 text-purple-700 border-purple-200";
      default: return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "รอการตอบกลับ";
      case "approved": return "อนุมัติแล้ว";
      case "rejected": return "ปฏิเสธแล้ว";
      case "expired": return "หมดอายุ";
      case "revoked": return "ยกเลิกแล้ว";
      default: return "ไม่ระบุ";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "border-red-200 bg-red-50";
      case "medium": return "border-yellow-200 bg-yellow-50";
      case "low": return "border-green-200 bg-green-50";
      default: return "border-gray-200 bg-gray-50";
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "high": return "สำคัญมาก";
      case "medium": return "สำคัญปานกลาง";
      case "low": return "สำคัญน้อย";
      default: return "ปกติ";
    }
  };

  const getSensitivityColor = (sensitivity: string) => {
    switch (sensitivity) {
      case "high": return "text-red-600";
      case "medium": return "text-yellow-600";
      case "low": return "text-green-600";
      default: return "text-gray-600";
    }
  };

  const filteredRequests = Array.isArray(consentRequests) 
    ? consentRequests.filter(request => {
        if (activeTab === "all") return true;
        return request.request_status === activeTab;
      })
    : [];

  const pendingCount = Array.isArray(consentRequests) 
    ? consentRequests.filter(r => r.request_status === "pending").length 
    : 0;
  const approvedCount = Array.isArray(consentRequests) 
    ? consentRequests.filter(r => r.request_status === "approved").length 
    : 0;

  return (
    <AppLayout title={"คำขอการเข้าถึงข้อมูล"} userType={"patient"}>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">คำขอการเข้าถึงข้อมูล</h1>
              <p className="text-gray-600 mt-1">จัดการคำขอเข้าถึงข้อมูลสุขภาพของคุณ</p>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-gray-50 transition-colors">
                ดูประวัติ
              </button>
              <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5-5-5h5v-12"/>
                </svg>
                รีเฟรช
              </button>
            </div>
          </div>
        </div>
          
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">ทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">{consentRequests.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-xl">📋</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">รอการตอบกลับ</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-xl">⏳</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">อนุมัติแล้ว</p>
                <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-xl">✅</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">เดือนนี้</p>
                <p className="text-2xl font-bold text-purple-600">{consentRequests.filter(r => {
                  const requestDate = new Date(r.requested_date);
                  const now = new Date();
                  return requestDate.getMonth() === now.getMonth() && requestDate.getFullYear() === now.getFullYear();
                }).length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-xl">📅</div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-200">
            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: "ทั้งหมด", icon: "📋", count: consentRequests.length },
                { id: "pending", label: "รอการตอบกลับ", icon: "⏳", count: pendingCount },
                { id: "approved", label: "อนุมัติแล้ว", icon: "✅", count: approvedCount },
                { id: "rejected", label: "ปฏิเสธแล้ว", icon: "❌" },
                { id: "expired", label: "หมดอายุ", icon: "⏰" },
                { id: "revoked", label: "ยกเลิกแล้ว", icon: "🚫" }
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
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      activeTab === tab.id 
                        ? "bg-blue-500 text-white" 
                        : "bg-gray-200 text-gray-700"
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Consent Requests List */}
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
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่มีคำขอการเข้าถึงข้อมูล</h3>
            <p className="text-gray-600">
              {activeTab === "all" 
                ? "ยังไม่มีคำขอการเข้าถึงข้อมูลในระบบ" 
                : `ไม่มีคำขอที่มีสถานะ ${getStatusText(activeTab)}`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div 
                key={request.id} 
                className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow ${getPriorityColor(request.priority)}`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-xl">
                        {getStatusIcon(request.request_status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {request.requester_name}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.request_status)}`}>
                            {getStatusText(request.request_status)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            request.priority === "high" 
                              ? "bg-red-100 text-red-700"
                              : request.priority === "medium"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                          }`}>
                            {getPriorityText(request.priority)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                          <div>
                            <p><span className="font-medium text-gray-700">องค์กร:</span> <span className="text-gray-900">{request.requester_organization}</span></p>
                            <p><span className="font-medium text-gray-700">วัตถุประสงค์:</span> <span className="text-gray-900">{request.purpose}</span></p>
                            <p><span className="font-medium text-gray-700">ระดับความลับ:</span> <span className={`font-medium ${getSensitivityColor(request.data_sensitivity)}`}>{request.data_sensitivity}</span></p>
                          </div>
                          <div>
                            <p><span className="font-medium text-gray-700">วันที่ขอ:</span> <span className="text-gray-900">{new Date(request.requested_date).toLocaleDateString('th-TH')}</span></p>
                            <p><span className="font-medium text-gray-700">กำหนดตอบกลับ:</span> <span className="text-gray-900">{new Date(request.response_deadline).toLocaleDateString('th-TH')}</span></p>
                            <p><span className="font-medium text-gray-700">ระยะเวลาเก็บ:</span> <span className="text-gray-900">{request.retention_period}</span></p>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">ข้อมูลที่ขอเข้าถึง:</p>
                          <div className="flex flex-wrap gap-2">
                            {request.data_types_requested.map((type, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                                {type}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        {request.justification && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm">
                              <span className="font-medium text-gray-700">เหตุผล:</span> <span className="text-gray-900">{request.justification}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      {request.request_status === "pending" && (
                        <>
                          <button 
                            onClick={() => approveRequest(request.id)}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            อนุมัติ
                          </button>
                          <button 
                            onClick={() => rejectRequest(request.id)}
                            className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            ปฏิเสธ
                          </button>
                        </>
                      )}
                      <button className="px-3 py-1 text-sm border border-slate-300 rounded-lg hover:bg-gray-50 transition-colors">
                        รายละเอียด
                      </button>
                    </div>
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