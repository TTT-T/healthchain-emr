"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import AppLayout from "@/components/AppLayout";

interface ConsentRequest {
  id: string;
  requestId: string;
  requesterName: string;
  requesterType: 'hospital' | 'clinic' | 'insurance' | 'research' | 'government';
  requesterLicense: string;
  requestType: 'hospital_transfer' | 'insurance_claim' | 'research' | 'legal' | 'emergency';
  purposeOfRequest: string;
  requestedDataTypes: string[];
  urgencyLevel: 'emergency' | 'urgent' | 'normal';
  submittedAt: string;
  expiresAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  supportingDocuments?: string[];
  contactInfo: {
    email: string;
    phone: string;
    address: string;
  };
}

export default function ConsentRequests() {
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedRequest, setSelectedRequest] = useState<ConsentRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [consentRequests, setConsentRequests] = useState<ConsentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchConsentRequests = async () => {
      try {
        if (user?.id) {
          const response = await apiClient.getPatientConsentRequests(user.id);
          if (response.success && response.data) {
            setConsentRequests(response.data);
          } else {
            setError(response.error?.message || "ไม่สามารถดึงข้อมูลคำขอ consent ได้");
          }
        }
      } catch (err) {
        console.error('Error fetching consent requests:', err);
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูลคำขอ');
      } finally {
        setLoading(false);
      }
    };

    fetchConsentRequests();
  }, [user]);

  const getRequesterTypeLabel = (type: string) => {
    const types = {
      hospital: "โรงพยาบาล",
      clinic: "คลินิก", 
      insurance: "บริษัทประกัน",
      research: "สถาบันวิจัย",
      government: "หน่วยงานราชการ"
    };
    return types[type as keyof typeof types] || type;
  };

  const getRequestTypeLabel = (type: string) => {
    const types = {
      hospital_transfer: "การรักษาต่อเนื่อง",
      insurance_claim: "การเคลมประกัน", 
      research: "การวิจัย",
      legal: "กระบวนการทางกฎหมาย",
      emergency: "เหตุฉุกเฉิน"
    };
    return types[type as keyof typeof types] || type;
  };

  const getDataTypeLabel = (type: string) => {
    const types = {
      medical_history: "ประวัติการรักษา",
      lab_results: "ผลตรวจทางห้องปฏิบัติการ",
      medications: "ข้อมูลการใช้ยา",
      vital_signs: "สัญญาณชีพ",
      diagnosis: "การวินิจฉัย",
      treatment_summary: "สรุปการรักษา", 
      billing_records: "บันทึกค่าใช้จ่าย",
      demographic_data: "ข้อมูลประชากรศาสตร์",
      diabetes_history: "ประวัติโรคเบาหวาน",
      lab_results_hba1c: "ผลตรวจ HbA1c"
    };
    return types[type as keyof typeof types] || type;
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "emergency": return "bg-red-100 text-red-800 border-red-200";
      case "urgent": return "bg-orange-100 text-orange-800 border-orange-200";
      case "normal": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getUrgencyText = (urgency: string) => {
    switch (urgency) {
      case "emergency": return "ฉุกเฉิน";
      case "urgent": return "เร่งด่วน";
      case "normal": return "ปกติ";
      default: return "ปกติ";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "approved": return "bg-green-100 text-green-800 border-green-200";
      case "rejected": return "bg-red-100 text-red-800 border-red-200";
      case "expired": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "รอพิจารณา";
      case "approved": return "อนุมัติแล้ว";
      case "rejected": return "ปฏิเสธ";
      case "expired": return "หมดอายุ";
      default: return "ไม่ระบุ";
    }
  };

  const handleApprove = (requestId: string) => {
    console.log("Approving request:", requestId);
    // TODO: Implement approval logic
    alert("อนุมัติคำขอเรียบร้อยแล้ว");
    setShowDetailsModal(false);
  };

  const handleReject = (requestId: string) => {
    const reason = prompt("กรุณาระบุเหตุผลในการปฏิเสธ:");
    if (reason) {
      console.log("Rejecting request:", requestId, "Reason:", reason);
      // TODO: Implement rejection logic
      alert("ปฏิเสธคำขอเรียบร้อยแล้ว");
      setShowDetailsModal(false);
    }
  };

  const filteredRequests = consentRequests.filter(request => {
    if (activeTab === "all") return true;
    return request.status === activeTab;
  });

  const pendingCount = consentRequests.filter(r => r.status === 'pending').length;
  const approvedCount = consentRequests.filter(r => r.status === 'approved').length;

  if (loading) {
    return (
      <AppLayout title="คำขอการเข้าถึงข้อมูล" userType="patient">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-800">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout title="คำขอการเข้าถึงข้อมูล" userType="patient">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="คำขอการเข้าถึงข้อมูล" userType="patient">
      <div className="bg-slate-50 min-h-screen p-3 sm:p-4 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          
          {/* Header */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 mb-2">คำขอการเข้าถึงข้อมูล</h2>
                <p className="text-slate-800">จัดการคำขอเข้าถึงข้อมูลสุขภาพของคุณจากหน่วยงานภายนอก</p>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-slate-800">{pendingCount} คำขอรอพิจารณา</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-lg sm:rounded-xl border border-slate-200 p-4 text-center">
              <div className="text-2xl font-bold text-slate-800">{consentRequests.length}</div>
              <div className="text-sm text-slate-800">คำขอทั้งหมด</div>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl border border-slate-200 p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
              <div className="text-sm text-slate-800">รอพิจารณา</div>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl border border-slate-200 p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
              <div className="text-sm text-slate-800">อนุมัติแล้ว</div>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl border border-slate-200 p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{consentRequests.filter(r => r.requesterType === 'hospital').length}</div>
              <div className="text-sm text-slate-800">จากโรงพยาบาล</div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="bg-white rounded-lg sm:rounded-xl border border-slate-200 shadow-sm">
            <div className="p-4 border-b border-slate-200">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "all", label: "ทั้งหมด", icon: "📋" },
                  { id: "pending", label: "รอพิจารณา", icon: "⏳", count: pendingCount },
                  { id: "approved", label: "อนุมัติแล้ว", icon: "✅" },
                  { id: "rejected", label: "ปฏิเสธ", icon: "❌" },
                  { id: "expired", label: "หมดอายุ", icon: "⏰" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ease-out flex items-center gap-2 ${
                      activeTab === tab.id
                        ? "bg-blue-500 text-white shadow-md"
                        : "text-slate-800 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                    {tab.count && tab.count > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        activeTab === tab.id 
                          ? "bg-white/20 text-white" 
                          : "bg-slate-200 text-slate-800"
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Requests List */}
            <div className="p-4">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📄</div>
                  <h3 className="text-lg font-medium text-slate-800 mb-2">
                    {activeTab === "all" ? "ไม่มีคำขอการเข้าถึงข้อมูล" : "ไม่มีคำขอในหมวดนี้"}
                  </h3>
                  <p className="text-slate-800">
                    {activeTab === "all" 
                      ? "ยังไม่มีองค์กรใดขอเข้าถึงข้อมูลของคุณ" 
                      : "ยังไม่มีคำขอการเข้าถึงข้อมูลในสถานะนี้"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRequests.map((request) => (
                    <div key={request.id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                            🏥
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-800 mb-1">{request.requesterName}</h3>
                            <p className="text-sm text-slate-800 mb-2">{getRequesterTypeLabel(request.requesterType)} • {request.requestId}</p>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                                {getStatusText(request.status)}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(request.urgencyLevel)}`}>
                                {getUrgencyText(request.urgencyLevel)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowDetailsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          ดูรายละเอียด →
                        </button>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm text-slate-800 mb-2">ประเภทคำขอ: <span className="font-medium">{getRequestTypeLabel(request.requestType)}</span></p>
                        <p className="text-sm text-slate-700">{request.purposeOfRequest}</p>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm text-slate-800 mb-2">ข้อมูลที่ขอเข้าถึง:</p>
                        <div className="flex flex-wrap gap-2">
                          {request.requestedDataTypes.map((dataType, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200">
                              {getDataTypeLabel(dataType)}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-slate-700">
                        <span>ส่งคำขอ: {new Date(request.submittedAt).toLocaleDateString('th-TH')}</span>
                        <span>หมดอายุ: {new Date(request.expiresAt).toLocaleDateString('th-TH')}</span>
                      </div>
                      
                      {request.status === 'pending' && (
                        <div className="mt-4 pt-4 border-t border-slate-200 flex gap-3">
                          <button
                            onClick={() => handleApprove(request.id)}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            อนุมัติ
                          </button>
                          <button
                            onClick={() => handleReject(request.id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            ปฏิเสธ
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800">รายละเอียดคำขอ</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-slate-600 hover:text-slate-800"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Requester Info */}
              <div>
                <h4 className="font-medium text-slate-800 mb-3">ข้อมูลผู้ขอ</h4>
                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                  <p><span className="font-medium">ชื่อหน่วยงาน:</span> {selectedRequest.requesterName}</p>
                  <p><span className="font-medium">ประเภท:</span> {getRequesterTypeLabel(selectedRequest.requesterType)}</p>
                  <p><span className="font-medium">ใบอนุญาต:</span> {selectedRequest.requesterLicense}</p>
                  <p><span className="font-medium">อีเมล:</span> {selectedRequest.contactInfo.email}</p>
                  <p><span className="font-medium">โทรศัพท์:</span> {selectedRequest.contactInfo.phone}</p>
                  <p><span className="font-medium">ที่อยู่:</span> {selectedRequest.contactInfo.address}</p>
                </div>
              </div>

              {/* Request Details */}
              <div>
                <h4 className="font-medium text-slate-800 mb-3">รายละเอียดคำขอ</h4>
                <div className="space-y-3">
                  <p><span className="font-medium">รหัสคำขอ:</span> {selectedRequest.requestId}</p>
                  <p><span className="font-medium">ประเภทคำขอ:</span> {getRequestTypeLabel(selectedRequest.requestType)}</p>
                  <p><span className="font-medium">วัตถุประสงค์:</span></p>
                  <div className="bg-slate-50 rounded-lg p-4">
                    {selectedRequest.purposeOfRequest}
                  </div>
                </div>
              </div>

              {/* Data Types */}
              <div>
                <h4 className="font-medium text-slate-800 mb-3">ข้อมูลที่ขอเข้าถึง</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedRequest.requestedDataTypes.map((dataType, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-blue-800">{getDataTypeLabel(dataType)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Supporting Documents */}
              {selectedRequest.supportingDocuments && selectedRequest.supportingDocuments.length > 0 && (
                <div>
                  <h4 className="font-medium text-slate-800 mb-3">เอกสารประกอบ</h4>
                  <div className="space-y-2">
                    {selectedRequest.supportingDocuments.map((doc, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                        <span className="text-blue-600">📎</span>
                        <span className="text-sm">{doc}</span>
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium ml-auto">
                          ดาวน์โหลด
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {selectedRequest.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => handleApprove(selectedRequest.id)}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium transition-colors"
                  >
                    อนุมัติคำขอ
                  </button>
                  <button
                    onClick={() => handleReject(selectedRequest.id)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition-colors"
                  >
                    ปฏิเสธคำขอ
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
