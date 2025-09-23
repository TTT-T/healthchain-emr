"use client";

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Eye, 
  Check, 
  X, 
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Users,
  Calendar,
  Shield,
  Zap,
  Building2,
  User,
  Mail,
  Phone
} from 'lucide-react';
import { consentRequestsService, ConsentRequest, ConsentRequestStats } from '@/services/consentRequestsService';

// Remove mock data - will use real data from API

export default function ConsentRequestsPage() {
  const [requests, setRequests] = useState<ConsentRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ConsentRequest[]>([]);
  const [stats, setStats] = useState<ConsentRequestStats>({
    totalRequests: 0,
    pendingRequests: 0,
    reviewingRequests: 0,
    emergencyRequests: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<ConsentRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Filter requests when filters change
  useEffect(() => {
    let filtered = requests;

    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.requester_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.patient_hn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.request_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    if (typeFilter) {
      filtered = filtered.filter(request => request.request_type === typeFilter);
    }

    if (urgencyFilter) {
      filtered = filtered.filter(request => request.urgency_level === urgencyFilter);
    }

    setFilteredRequests(filtered);
  }, [searchTerm, statusFilter, typeFilter, urgencyFilter, requests]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [requestsData, statsData] = await Promise.all([
        consentRequestsService.getAllRequests(),
        consentRequestsService.getRequestStats()
      ]);

      setRequests(requestsData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch consent requests:', err);
      setError('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50 border-green-200';
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'patient_reviewing': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'sent_to_patient': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'rejected': return 'text-red-600 bg-red-50 border-red-200';
      case 'expired': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'cancelled': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle size={16} className="text-green-600" />;
      case 'pending': return <Clock size={16} className="text-yellow-600" />;
      case 'patient_reviewing': return <User size={16} className="text-blue-600" />;
      case 'sent_to_patient': return <Mail size={16} className="text-purple-600" />;
      case 'rejected': return <XCircle size={16} className="text-red-600" />;
      case 'expired': return <XCircle size={16} className="text-gray-600" />;
      case 'cancelled': return <XCircle size={16} className="text-gray-600" />;
      default: return <Clock size={16} className="text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'รออนุมัติ',
      sent_to_patient: 'ส่งให้ผู้ป่วยแล้ว',
      patient_reviewing: 'ผู้ป่วยกำลังพิจารณา',
      approved: 'อนุมัติแล้ว',
      rejected: 'ปฏิเสธ',
      expired: 'หมดอายุ',
      cancelled: 'ยกเลิก'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return 'text-red-600 bg-red-50 border-red-200';
      case 'urgent': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'normal': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getUrgencyLabel = (urgency: string) => {
    const labels = {
      emergency: 'ฉุกเฉิน',
      urgent: 'เร่งด่วน',
      normal: 'ปกติ'
    };
    return labels[urgency as keyof typeof labels] || urgency;
  };

  const getRequesterTypeLabel = (type: string) => {
    const types = {
      hospital: 'โรงพยาบาล',
      clinic: 'คลินิก',
      insurance: 'บริษัทประกัน',
      research: 'สถาบันวิจัย',
      government: 'หน่วยงานราชการ',
      legal: 'หน่วยงานกฎหมาย'
    };
    return types[type as keyof typeof types] || type;
  };

  const getRequestTypeLabel = (type: string) => {
    const types = {
      hospital_transfer: 'ส่งต่อการรักษา',
      insurance_claim: 'เคลมประกัน',
      research: 'การวิจัย',
      legal: 'กระบวนการทางกฎหมาย',
      emergency: 'เหตุฉุกเฉิน'
    };
    return types[type as keyof typeof types] || type;
  };

  const getDataTypeLabel = (type: string) => {
    const types = {
      medical_history: 'ประวัติการรักษา',
      lab_results: 'ผลตรวจทางห้องปฏิบัติการ',
      vital_signs: 'สัญญาณชีพ',
      current_medications: 'ยาที่ใช้ปัจจุบัน',
      diagnosis: 'การวินิจฉัย',
      treatment_cost: 'ค่ารักษา',
      discharge_summary: 'สรุปการจำหน่าย',
      allergies: 'ประวัติแพ้ยา',
      blood_type: 'หมู่เลือด',
      anonymized_diagnosis: 'การวินิจฉัย (ไม่ระบุตัวตน)',
      age_group: 'กลุ่มอายุ',
      treatment_outcome: 'ผลการรักษา'
    };
    return types[type as keyof typeof types] || type;
  };

  const handleApprove = async (id: string) => {
    try {
      await consentRequestsService.approveRequest(id, 'อนุมัติโดย Admin');
      await fetchData(); // Refresh data
    } catch (err) {
      console.error('Failed to approve request:', err);
      setError('ไม่สามารถอนุมัติคำขอได้');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await consentRequestsService.rejectRequest(id, 'ปฏิเสธโดย Admin');
      await fetchData(); // Refresh data
    } catch (err) {
      console.error('Failed to reject request:', err);
      setError('ไม่สามารถปฏิเสธคำขอได้');
    }
  };

  const handleViewDetails = (request: ConsentRequest) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const totalRequests = stats.totalRequests;
  const pendingRequests = stats.pendingRequests;
  const reviewingRequests = stats.reviewingRequests;
  const emergencyRequests = stats.emergencyRequests;

  if (loading && requests.length === 0) {
    return (
      <div className="w-full h-full bg-gray-50 p-2 lg:p-4 overflow-auto flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full bg-gray-50 p-2 lg:p-4 overflow-auto flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-4 text-red-600" size={48} />
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-50 p-2 lg:p-4 overflow-auto">
      {/* Header */}
      <div className="mb-4 lg:mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="text-blue-600" />
              จัดการคำขอ Consent
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              ตรวจสอบและอนุมัติคำขอการเข้าถึงข้อมูลทางการแพทย์
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              รีเฟรช
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
              <Download size={16} />
              ส่งออก
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8 min-w-0">
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">คำขอทั้งหมด</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{totalRequests}</p>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 hidden sm:block">ทุกสถานะ</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="text-blue-600" size={16} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">รออนุมัติ</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-600">{pendingRequests}</p>
              <p className="text-xs sm:text-sm text-yellow-600 mt-1 hidden sm:block">ต้องตรวจสอบ</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="text-yellow-600" size={16} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">ผู้ป่วยพิจารณา</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600">{reviewingRequests}</p>
              <p className="text-xs sm:text-sm text-blue-600 mt-1 hidden sm:block">รอตอบกลับ</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <User className="text-blue-600" size={16} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">ฉุกเฉิน</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600">{emergencyRequests}</p>
              <p className="text-xs sm:text-sm text-red-600 mt-1 hidden sm:block">ต้องเร่งด่วน</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="text-red-600" size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="ค้นหาผู้ขอ, ผู้ป่วย, HN, Request ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">ทุกสถานะ</option>
            <option value="pending">รออนุมัติ</option>
            <option value="sent_to_patient">ส่งให้ผู้ป่วยแล้ว</option>
            <option value="patient_reviewing">ผู้ป่วยกำลังพิจารณา</option>
            <option value="approved">อนุมัติแล้ว</option>
            <option value="rejected">ปฏิเสธ</option>
            <option value="expired">หมดอายุ</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">ทุกประเภท</option>
            <option value="hospital_transfer">ส่งต่อการรักษา</option>
            <option value="insurance_claim">เคลมประกัน</option>
            <option value="research">การวิจัย</option>
            <option value="legal">กระบวนการทางกฎหมาย</option>
            <option value="emergency">เหตุฉุกเฉิน</option>
          </select>

          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">ทุกระดับความเร่งด่วน</option>
            <option value="emergency">ฉุกเฉิน</option>
            <option value="urgent">เร่งด่วน</option>
            <option value="normal">ปกติ</option>
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Request ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">ผู้ขอ</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">ผู้ป่วย</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">ประเภท</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">ความเร่งด่วน</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">สถานะ</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">วันที่สร้าง</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="font-medium text-blue-600">{request.request_id}</div>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-medium text-gray-900">{request.requester_name}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Building2 size={12} />
                        {getRequesterTypeLabel(request.requester_type)}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-medium text-gray-900">{request.patient_name}</div>
                      <div className="text-sm text-gray-500">{request.patient_hn}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
                      {getRequestTypeLabel(request.request_type)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getUrgencyColor(request.urgency_level)}`}>
                      {getUrgencyLabel(request.urgency_level)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(request.status)}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                        {getStatusLabel(request.status)}
                      </span>
                    </div>
                    {!request.is_compliant && (
                      <div className="text-xs text-red-600 flex items-center gap-1 mt-1">
                        <AlertTriangle size={10} />
                        ไม่ผ่าน Compliance
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-500">
                    {new Date(request.created_at).toLocaleDateString('th-TH', {
                      timeZone: 'Asia/Bangkok',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewDetails(request)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                      >
                        <Eye size={14} />
                        ดูรายละเอียด
                      </button>
                      
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(request.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
                          >
                            <Check size={14} />
                            อนุมัติ
                          </button>
                          <button
                            onClick={() => handleReject(request.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                          >
                            <X size={14} />
                            ปฏิเสธ
                          </button>
                        </>
                      )}
                      
                      {request.urgency_level === 'emergency' && request.status !== 'approved' && (
                        <button
                          onClick={() => handleApprove(request.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                        >
                          <Zap size={14} />
                          อนุมัติฉุกเฉิน
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  รายละเอียดคำขอ: {selectedRequest.request_id}
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <Building2 size={18} />
                    ข้อมูลผู้ขอ
                  </h4>
                  <div className="space-y-3 pl-6">
                    <div>
                      <label className="text-sm font-medium text-gray-600">ชื่อองค์กร</label>
                      <p className="text-gray-900">{selectedRequest.requester_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">ประเภท</label>
                      <p className="text-gray-900">{getRequesterTypeLabel(selectedRequest.requester_type)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <User size={18} />
                    ข้อมูลผู้ป่วย
                  </h4>
                  <div className="space-y-3 pl-6">
                    <div>
                      <label className="text-sm font-medium text-gray-600">ชื่อผู้ป่วย</label>
                      <p className="text-gray-900">{selectedRequest.patient_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">เลข HN</label>
                      <p className="text-gray-900">{selectedRequest.patient_hn}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Request Details */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <FileText size={18} />
                  รายละเอียดคำขอ
                </h4>
                <div className="pl-6 space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">ประเภทคำขอ</label>
                      <p className="text-gray-900">{getRequestTypeLabel(selectedRequest.request_type)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">ความเร่งด่วน</label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getUrgencyColor(selectedRequest.urgency_level)}`}>
                        {getUrgencyLabel(selectedRequest.urgency_level)}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">สถานะ</label>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(selectedRequest.status)}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(selectedRequest.status)}`}>
                          {getStatusLabel(selectedRequest.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">วัตถุประสงค์</label>
                    <p className="text-gray-900 bg-gray-50 rounded-lg p-3 mt-1">{selectedRequest.purpose}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">ข้อมูลที่ขอ</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedRequest.requested_data_types.map((type, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200">
                          {getDataTypeLabel(type)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Compliance & Timeline */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <Shield size={18} />
                    การปฏิบัติตามกฎเกณฑ์
                  </h4>
                  <div className="space-y-3 pl-6">
                    <div>
                      <label className="text-sm font-medium text-gray-600">สถานะ Compliance</label>
                      <div className="flex items-center gap-2 mt-1">
                        {selectedRequest.is_compliant ? (
                          <>
                            <CheckCircle className="text-green-600" size={16} />
                            <span className="text-green-600">ผ่านการตรวจสอบ</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="text-red-600" size={16} />
                            <span className="text-red-600">ไม่ผ่านการตรวจสอบ</span>
                          </>
                        )}
                      </div>
                    </div>
                    {selectedRequest.compliance_notes && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">หมายเหตุ Compliance</label>
                        <p className="text-red-600 bg-red-50 border border-red-200 rounded p-2 mt-1 text-sm">
                          {selectedRequest.compliance_notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <Calendar size={18} />
                    Timeline
                  </h4>
                  <div className="space-y-3 pl-6">
                    <div>
                      <label className="text-sm font-medium text-gray-600">วันที่สร้างคำขอ</label>
                      <p className="text-gray-900">
                        {new Date(selectedRequest.created_at).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">วันหมดอายุ</label>
                      <p className="text-gray-900">
                        {new Date(selectedRequest.expires_at).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    {selectedRequest.validated_at && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">วันที่ตรวจสอบ</label>
                        <p className="text-gray-900">
                          {new Date(selectedRequest.validated_at).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {selectedRequest.validated_by && (
                          <p className="text-sm text-gray-500">โดย: {selectedRequest.validated_by}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ปิด
                </button>
                {selectedRequest.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        handleReject(selectedRequest.id);
                        setShowDetailsModal(false);
                      }}
                      className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      ปฏิเสธ
                    </button>
                    <button
                      onClick={() => {
                        handleApprove(selectedRequest.id);
                        setShowDetailsModal(false);
                      }}
                      className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      อนุมัติ
                    </button>
                  </div>
                )}
                {selectedRequest.urgency_level === 'emergency' && selectedRequest.status !== 'approved' && (
                  <button
                    onClick={() => {
                      handleApprove(selectedRequest.id);
                      setShowDetailsModal(false);
                    }}
                    className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    อนุมัติฉุกเฉิน
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
