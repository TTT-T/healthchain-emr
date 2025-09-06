"use client";

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { 
  Building2, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Check, 
  X, 
  UserCheck, 
  UserX, 
  Clock,
  Mail,
  Phone,
  Calendar,
  Award,
  Shield,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  FileText,
  MapPin,
  Briefcase
} from 'lucide-react';

interface ExternalRequester {
  id: string;
  organizationName: string;
  organizationType: string;
  registrationNumber?: string;
  licenseNumber?: string;
  taxId?: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone?: string;
  address?: {
    streetAddress: string;
    subDistrict: string;
    district: string;
    province: string;
    postalCode: string;
    country: string;
  };
  status: 'active' | 'pending' | 'suspended';
  dataAccessLevel: 'basic' | 'standard' | 'premium';
  maxConcurrentRequests: number;
  allowedRequestTypes: string[];
  complianceCertifications: string[];
  dataProtectionCertification?: string;
  isVerified: boolean;
  verificationDate?: string;
  lastComplianceAudit?: string;
  createdAt: string;
  updatedAt: string;
}

const mockExternalRequesters: ExternalRequester[] = [
  {
    id: '1',
    organizationName: 'โรงพยาบาลจุฬาลงกรณ์',
    organizationType: 'hospital',
    registrationNumber: 'REG-2024-001',
    licenseNumber: 'LIC-12345',
    taxId: '0123456789012',
    primaryContactName: 'นพ. สมชาย ใจดี',
    primaryContactEmail: 'contact@chula.ac.th',
    primaryContactPhone: '02-123-4567',
    address: {
      streetAddress: '1873 ถนนพระราม 4',
      subDistrict: 'ปทุมวัน',
      district: 'ปทุมวัน',
      province: 'กรุงเทพมหานคร',
      postalCode: '10330',
      country: 'Thailand'
    },
    status: 'active',
    dataAccessLevel: 'premium',
    maxConcurrentRequests: 50,
    allowedRequestTypes: ['medical_records', 'lab_results', 'imaging', 'prescriptions'],
    complianceCertifications: ['ISO 27001', 'PDPA'],
    dataProtectionCertification: 'PDPA-2024-001',
    isVerified: true,
    verificationDate: '2024-01-15T00:00:00Z',
    lastComplianceAudit: '2024-11-15T00:00:00Z',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-12-19T10:30:00Z'
  },
  {
    id: '2',
    organizationName: 'บริษัท เอไอเอ จำกัด (มหาชน)',
    organizationType: 'insurance',
    registrationNumber: 'REG-2024-002',
    taxId: '0123456789013',
    primaryContactName: 'คุณสมหญิง รักดี',
    primaryContactEmail: 'contact@aia.co.th',
    primaryContactPhone: '02-234-5678',
    address: {
      streetAddress: '456 ถนนสุขุมวิท',
      subDistrict: 'คลองตัน',
      district: 'วัฒนา',
      province: 'กรุงเทพมหานคร',
      postalCode: '10110',
      country: 'Thailand'
    },
    status: 'pending',
    dataAccessLevel: 'standard',
    maxConcurrentRequests: 20,
    allowedRequestTypes: ['medical_records', 'lab_results'],
    complianceCertifications: ['PDPA'],
    isVerified: false,
    createdAt: '2024-12-01T00:00:00Z',
    updatedAt: '2024-12-18T14:20:00Z'
  },
  {
    id: '3',
    organizationName: 'สถาบันวิจัยจุฬาภรณ์',
    organizationType: 'research',
    registrationNumber: 'REG-2024-003',
    taxId: '0123456789014',
    primaryContactName: 'รศ.ดร.สมศักดิ์ วิจัยดี',
    primaryContactEmail: 'research@chulabhorn.org',
    primaryContactPhone: '02-345-6789',
    address: {
      streetAddress: '54 ถนนวิภาวดีรังสิต',
      subDistrict: 'ลาดยาว',
      district: 'จตุจักร',
      province: 'กรุงเทพมหานคร',
      postalCode: '10900',
      country: 'Thailand'
    },
    status: 'active',
    dataAccessLevel: 'premium',
    maxConcurrentRequests: 30,
    allowedRequestTypes: ['medical_records', 'lab_results', 'imaging', 'prescriptions', 'vital_signs'],
    complianceCertifications: ['ISO 27001', 'PDPA', 'IRB'],
    dataProtectionCertification: 'PDPA-2024-002',
    isVerified: true,
    verificationDate: '2024-02-20T00:00:00Z',
    lastComplianceAudit: '2024-10-30T00:00:00Z',
    createdAt: '2024-02-15T00:00:00Z',
    updatedAt: '2024-12-19T09:15:00Z'
  },
  {
    id: '4',
    organizationName: 'คลินิกหมอสมหมาย',
    organizationType: 'clinic',
    registrationNumber: 'REG-2024-004',
    licenseNumber: 'LIC-54321',
    taxId: '0123456789015',
    primaryContactName: 'นพ.สมหมาย รักษาดี',
    primaryContactEmail: 'doctor@sommai-clinic.com',
    primaryContactPhone: '02-456-7890',
    address: {
      streetAddress: '789 ถนนลาดพร้าว',
      subDistrict: 'จอมพล',
      district: 'จตุจักร',
      province: 'กรุงเทพมหานคร',
      postalCode: '10900',
      country: 'Thailand'
    },
    status: 'suspended',
    dataAccessLevel: 'basic',
    maxConcurrentRequests: 5,
    allowedRequestTypes: ['medical_records'],
    complianceCertifications: [],
    isVerified: false,
    suspensionReason: 'ไม่ได้ส่งเอกสารการรับรองตามกำหนด',
    createdAt: '2024-11-28T13:45:00Z',
    updatedAt: '2024-12-18T10:20:00Z'
  }
];

export default function ExternalRequestersPage() {
  const [requesters, setRequesters] = useState<ExternalRequester[]>([]);
  const [filteredRequesters, setFilteredRequesters] = useState<ExternalRequester[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [accessLevelFilter, setAccessLevelFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRequester, setSelectedRequester] = useState<ExternalRequester | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load external requesters data
  useEffect(() => {
    loadExternalRequesters();
  }, []);

  // Filter requesters when filters change
  useEffect(() => {
    let filtered = requesters;

    if (searchTerm) {
      filtered = filtered.filter(requester =>
        requester.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        requester.primaryContactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        requester.primaryContactEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(requester => requester.status === statusFilter);
    }

    if (typeFilter) {
      filtered = filtered.filter(requester => requester.organizationType === typeFilter);
    }

    if (accessLevelFilter) {
      filtered = filtered.filter(requester => requester.dataAccessLevel === accessLevelFilter);
    }

    setFilteredRequesters(filtered);
  }, [requesters, searchTerm, statusFilter, typeFilter, accessLevelFilter]);

  const loadExternalRequesters = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getAdminExternalRequesters();
      if (response.success && response.data) {
        // Map API response to ExternalRequester format
        const mappedRequesters: ExternalRequester[] = response.data.requesters?.map((req: any) => ({
          id: req.id,
          organizationName: req.organization_name || req.organizationName,
          organizationType: req.organization_type || req.organizationType,
          registrationNumber: req.registration_number || req.registrationNumber,
          licenseNumber: req.license_number || req.licenseNumber,
          taxId: req.tax_id || req.taxId,
          primaryContactName: req.primary_contact_name || req.primaryContactName,
          primaryContactEmail: req.primary_contact_email || req.primaryContactEmail,
          primaryContactPhone: req.primary_contact_phone || req.primaryContactPhone,
          address: req.address,
          status: req.status || 'pending',
          dataAccessLevel: req.data_access_level || req.dataAccessLevel || 'basic',
          maxConcurrentRequests: req.max_concurrent_requests || req.maxConcurrentRequests || 5,
          allowedRequestTypes: req.allowed_request_types || req.allowedRequestTypes || [],
          complianceCertifications: req.compliance_certifications || req.complianceCertifications || [],
          dataProtectionCertification: req.data_protection_certification || req.dataProtectionCertification,
          isVerified: req.is_verified || req.isVerified || false,
          verificationDate: req.verification_date || req.verificationDate,
          lastComplianceAudit: req.last_compliance_audit || req.lastComplianceAudit,
          createdAt: req.created_at || req.createdAt,
          updatedAt: req.updated_at || req.updatedAt
        })) || [];
        
        setRequesters(mappedRequesters);
      } else {
        setError('ไม่สามารถโหลดข้อมูล External Requesters ได้');
        // Fallback to mock data if API fails
        setRequesters(mockExternalRequesters);
      }
    } catch (error) {
      console.error('Failed to load external requesters:', error);
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      // Fallback to mock data if API fails
      setRequesters(mockExternalRequesters);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (requesterId: string, newStatus: string) => {
    try {
      const response = await apiClient.updateExternalRequesterStatus(requesterId, newStatus);
      if (response.success) {
        setRequesters(prev => prev.map(req => 
          req.id === requesterId ? { ...req, status: newStatus as any } : req
        ));
      } else {
        setError('ไม่สามารถอัปเดตสถานะได้: ' + (response.error?.message || 'ไม่ทราบสาเหตุ'));
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      setError('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
  };

  const refreshData = () => {
    loadExternalRequesters();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">อนุมัติแล้ว</span>;
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">รอการตรวจสอบ</span>;
      case 'suspended':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">ถูกระงับ</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeMap: { [key: string]: string } = {
      hospital: 'โรงพยาบาล',
      clinic: 'คลินิก',
      insurance: 'บริษัทประกัน',
      research: 'สถาบันวิจัย',
      government: 'หน่วยงานรัฐ'
    };
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{typeMap[type] || type}</span>;
  };

  const getAccessLevelBadge = (level: string) => {
    const levelMap: { [key: string]: { text: string; color: string } } = {
      basic: { text: 'พื้นฐาน', color: 'bg-gray-100 text-gray-800' },
      standard: { text: 'มาตรฐาน', color: 'bg-blue-100 text-blue-800' },
      premium: { text: 'พรีเมียม', color: 'bg-purple-100 text-purple-800' }
    };
    const config = levelMap[level] || { text: level, color: 'bg-gray-100 text-gray-800' };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>{config.text}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw size={48} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">กำลังโหลดข้อมูล External Requesters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-red-800">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-red-600 hover:text-red-800"
                >
                  <XCircle size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">จัดการ External Requesters</h1>
                <p className="mt-2 text-gray-600">จัดการและติดตามองค์กรที่ขอเข้าถึงข้อมูล</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={refreshData}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  เพิ่มองค์กรใหม่
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">ทั้งหมด</p>
                  <p className="text-2xl font-bold text-gray-900">{requesters.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">อนุมัติแล้ว</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {requesters.filter(r => r.status === 'active').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">รอการตรวจสอบ</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {requesters.filter(r => r.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">ถูกระงับ</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {requesters.filter(r => r.status === 'suspended').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ค้นหา
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="ชื่อองค์กร, ผู้ติดต่อ, อีเมล..."
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    สถานะ
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">ทั้งหมด</option>
                    <option value="active">อนุมัติแล้ว</option>
                    <option value="pending">รอการตรวจสอบ</option>
                    <option value="suspended">ถูกระงับ</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ประเภทองค์กร
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">ทั้งหมด</option>
                    <option value="hospital">โรงพยาบาล</option>
                    <option value="clinic">คลินิก</option>
                    <option value="insurance">บริษัทประกัน</option>
                    <option value="research">สถาบันวิจัย</option>
                    <option value="government">หน่วยงานรัฐ</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ระดับการเข้าถึง
                  </label>
                  <select
                    value={accessLevelFilter}
                    onChange={(e) => setAccessLevelFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">ทั้งหมด</option>
                    <option value="basic">พื้นฐาน</option>
                    <option value="standard">มาตรฐาน</option>
                    <option value="premium">พรีเมียม</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      องค์กร
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ผู้ติดต่อ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ประเภท
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      สถานะ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ระดับการเข้าถึง
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      วันที่ลงทะเบียน
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      การดำเนินการ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequesters.map((requester) => (
                    <tr key={requester.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Building2 className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {requester.organizationName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {requester.organizationType}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{requester.primaryContactName}</div>
                        <div className="text-sm text-gray-500">{requester.primaryContactEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTypeBadge(requester.organizationType)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(requester.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getAccessLevelBadge(requester.dataAccessLevel)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(requester.createdAt).toLocaleDateString('th-TH')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedRequester(requester);
                              setShowDetailsModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="ดูรายละเอียด"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {requester.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(requester.id, 'active')}
                                className="text-green-600 hover:text-green-900"
                                title="อนุมัติ"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleStatusChange(requester.id, 'suspended')}
                                className="text-red-600 hover:text-red-900"
                                title="ระงับ"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredRequesters.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่พบข้อมูล</h3>
              <p className="mt-1 text-sm text-gray-500">ลองเปลี่ยนเงื่อนไขการค้นหา</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}