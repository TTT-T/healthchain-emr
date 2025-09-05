"use client";

import React, { useState, useEffect } from 'react';
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
  organizationType: 'hospital' | 'clinic' | 'insurance_company' | 'research_institute' | 'government_agency' | 'legal_entity' | 'audit_organization';
  registrationNumber: string;
  licenseNumber?: string;
  taxId: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  isVerified: boolean;
  verificationDate?: string;
  verifiedBy?: string;
  allowedRequestTypes: string[];
  dataAccessLevel: 'basic' | 'standard' | 'premium';
  maxConcurrentRequests: number;
  status: 'pending' | 'active' | 'suspended' | 'revoked';
  suspensionReason?: string;
  complianceCertifications: string[];
  dataProtectionCertification?: string;
  lastComplianceAudit?: string;
  createdAt: string;
  updatedAt: string;
}

const mockExternalRequesters: ExternalRequester[] = [
  {
    id: '1',
    organizationName: 'โรงพยาบาลศิริราช',
    organizationType: 'hospital',
    registrationNumber: 'HOS-2024-001',
    licenseNumber: 'MED-LIC-001',
    taxId: '0105537001234',
    primaryContactName: 'นพ.สมชาย ใจดี',
    primaryContactEmail: 'contact@siriraj.ac.th',
    primaryContactPhone: '02-419-7000',
    address: {
      street: '2 ถนนวังหลัง',
      city: 'บางกอกน้อย',
      province: 'กรุงเทพมหานคร',
      postalCode: '10700',
      country: 'ประเทศไทย'
    },
    isVerified: true,
    verificationDate: '2024-12-01T10:30:00Z',
    verifiedBy: 'Admin User',
    allowedRequestTypes: ['hospital_transfer', 'emergency'],
    dataAccessLevel: 'premium',
    maxConcurrentRequests: 20,
    status: 'active',
    complianceCertifications: ['ISO 27001', 'PDPA Certified'],
    dataProtectionCertification: 'PDPA-2022-001',
    lastComplianceAudit: '2024-11-15T09:00:00Z',
    createdAt: '2024-11-20T14:30:00Z',
    updatedAt: '2024-12-01T10:30:00Z'
  },
  {
    id: '2',
    organizationName: 'บริษัท ไทยประกันชีวิต จำกัด (มหาชน)',
    organizationType: 'insurance_company',
    registrationNumber: 'INS-2024-002',
    licenseNumber: 'INS-LIC-002',
    taxId: '0107537002345',
    primaryContactName: 'คุณสมหญิง ประกันใจ',
    primaryContactEmail: 'claims@thailife.com',
    primaryContactPhone: '02-777-8888',
    address: {
      street: '999/9 อาคารไทยประกัน ถนนพหลโยธิน',
      city: 'ลาดยาว',
      province: 'กรุงเทพมหานคร',
      postalCode: '10900',
      country: 'ประเทศไทย'
    },
    isVerified: false,
    allowedRequestTypes: ['insurance_claim'],
    dataAccessLevel: 'standard',
    maxConcurrentRequests: 10,
    status: 'pending',
    complianceCertifications: ['PDPA Certified'],
    createdAt: '2024-12-15T16:20:00Z',
    updatedAt: '2024-12-15T16:20:00Z'
  },
  {
    id: '3',
    organizationName: 'สถาบันวิจัยและพัฒนาแห่งชาติ',
    organizationType: 'research_institute',
    registrationNumber: 'RES-2024-003',
    taxId: '0994000123456',
    primaryContactName: 'ผศ.ดร.วิจัย นักคิด',
    primaryContactEmail: 'research@nrdi.go.th',
    primaryContactPhone: '02-590-7777',
    address: {
      street: '88/8 ถ.ติวานนท์',
      city: 'หลักสี่',
      province: 'กรุงเทพมหานคร',
      postalCode: '10210',
      country: 'ประเทศไทย'
    },
    isVerified: true,
    verificationDate: '2024-12-10T11:15:00Z',
    verifiedBy: 'Compliance Officer',
    allowedRequestTypes: ['research'],
    dataAccessLevel: 'basic',
    maxConcurrentRequests: 5,
    status: 'active',
    complianceCertifications: ['Research Ethics Approved', 'PDPA Certified'],
    dataProtectionCertification: 'PDPA-2022-003',
    lastComplianceAudit: '2024-12-05T14:00:00Z',
    createdAt: '2024-12-05T09:30:00Z',
    updatedAt: '2024-12-10T11:15:00Z'
  },
  {
    id: '4',
    organizationName: 'คลินิกการแพทย์แบบบูรณาการ',
    organizationType: 'clinic',
    registrationNumber: 'CLI-2024-004',
    licenseNumber: 'MED-LIC-004',
    taxId: '0135537004567',
    primaryContactName: 'นพ.บูรณ์ รักษาคน',
    primaryContactEmail: 'info@integratedclinic.com',
    primaryContactPhone: '02-123-4567',
    address: {
      street: '456 ถนนสุขุมวิท 21',
      city: 'วัฒนา',
      province: 'กรุงเทพมหานคร',
      postalCode: '10110',
      country: 'ประเทศไทย'
    },
    isVerified: false,
    allowedRequestTypes: ['hospital_transfer'],
    dataAccessLevel: 'standard',
    maxConcurrentRequests: 8,
    status: 'suspended',
    suspensionReason: 'ไม่ได้ส่งเอกสารการรับรองตามกำหนด',
    complianceCertifications: [],
    createdAt: '2024-11-28T13:45:00Z',
    updatedAt: '2024-12-18T10:20:00Z'
  }
];

export default function ExternalRequestersPage() {
  const [requesters, setRequesters] = useState<ExternalRequester[]>(mockExternalRequesters);
  const [filteredRequesters, setFilteredRequesters] = useState<ExternalRequester[]>(mockExternalRequesters);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [accessLevelFilter, setAccessLevelFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRequester, setSelectedRequester] = useState<ExternalRequester | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    let filtered = requesters;

    if (searchTerm) {
      filtered = filtered.filter(requester =>
        requester.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        requester.primaryContactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        requester.primaryContactEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        requester.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase())
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
  }, [searchTerm, statusFilter, typeFilter, accessLevelFilter, requesters]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50 border-green-200';
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'suspended': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'revoked': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle size={16} className="text-green-600" />;
      case 'pending': return <Clock size={16} className="text-yellow-600" />;
      case 'suspended': return <AlertTriangle size={16} className="text-orange-600" />;
      case 'revoked': return <XCircle size={16} className="text-red-600" />;
      default: return <Clock size={16} className="text-gray-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const types = {
      hospital: 'โรงพยาบาล',
      clinic: 'คลินิก',
      insurance_company: 'บริษัทประกัน',
      research_institute: 'สถาบันวิจัย',
      government_agency: 'หน่วยงานราชการ',
      legal_entity: 'หน่วยงานกฎหมาย',
      audit_organization: 'หน่วยงานตรวจสอบ'
    };
    return types[type as keyof typeof types] || type;
  };

  const getAccessLevelLabel = (level: string) => {
    const levels = {
      basic: 'พื้นฐาน',
      standard: 'มาตรฐาน',
      premium: 'พรีเมี่ยม'
    };
    return levels[level as keyof typeof levels] || level;
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'basic': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'standard': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'premium': return 'text-amber-600 bg-amber-50 border-amber-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleApprove = (id: string) => {
    setRequesters(prev => prev.map(req => 
      req.id === id 
        ? { 
            ...req, 
            status: 'active' as const,
            isVerified: true,
            verificationDate: new Date().toISOString(),
            verifiedBy: 'Admin User',
            updatedAt: new Date().toISOString()
          }
        : req
    ));
  };

  const handleReject = (id: string) => {
    setRequesters(prev => prev.map(req => 
      req.id === id 
        ? { 
            ...req, 
            status: 'revoked' as const,
            updatedAt: new Date().toISOString()
          }
        : req
    ));
  };

  const handleSuspend = (id: string, reason: string) => {
    setRequesters(prev => prev.map(req => 
      req.id === id 
        ? { 
            ...req, 
            status: 'suspended' as const,
            suspensionReason: reason,
            updatedAt: new Date().toISOString()
          }
        : req
    ));
  };

  const handleViewDetails = (requester: ExternalRequester) => {
    setSelectedRequester(requester);
    setShowDetailsModal(true);
  };

  const totalRequesters = requesters.length;
  const activeRequesters = requesters.filter(r => r.status === 'active').length;
  const pendingRequesters = requesters.filter(r => r.status === 'pending').length;
  const suspendedRequesters = requesters.filter(r => r.status === 'suspended').length;

  return (
    <div className="w-full h-full bg-gray-50 p-3 sm:p-4 lg:p-6 overflow-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Building2 className="text-blue-600" />
              จัดการผู้ขอข้อมูลภายนอก
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              อนุมัติและจัดการองค์กรภายนอกที่ขอเข้าถึงข้อมูลทางการแพทย์
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <RefreshCw size={16} />
              <span className="hidden sm:inline">รีเฟรช</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Download size={16} />
              <span className="hidden sm:inline">ส่งออก</span>
            </button>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">เพิ่มองค์กร</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8 min-w-0">
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">ทั้งหมด</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{totalRequesters}</p>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 hidden sm:block">องค์กรทั้งหมด</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="text-blue-600" size={16} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">ใช้งานได้</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">{activeRequesters}</p>
              <p className="text-xs sm:text-sm text-green-600 mt-1 hidden sm:block">อนุมัติแล้ว</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle className="text-green-600" size={16} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">รออนุมัติ</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-600">{pendingRequesters}</p>
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
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">ระงับ</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-600">{suspendedRequesters}</p>
              <p className="text-xs sm:text-sm text-orange-600 mt-1 hidden sm:block">ถูกระงับ</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="text-orange-600" size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ค้นหา</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="ชื่อองค์กร, ผู้ติดต่อ, อีเมล..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">ทุกสถานะ</option>
              <option value="active">ใช้งานได้</option>
              <option value="pending">รออนุมัติ</option>
              <option value="suspended">ระงับ</option>
              <option value="revoked">ปฏิเสธ</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ประเภทองค์กร</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">ทุกประเภท</option>
              <option value="hospital">โรงพยาบาล</option>
              <option value="clinic">คลินิก</option>
              <option value="insurance_company">บริษัทประกัน</option>
              <option value="research_institute">สถาบันวิจัย</option>
              <option value="government_agency">หน่วยงานราชการ</option>
              <option value="legal_entity">หน่วยงานกฎหมาย</option>
              <option value="audit_organization">หน่วยงานตรวจสอบ</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ระดับการเข้าถึง</label>
            <select
              value={accessLevelFilter}
              onChange={(e) => setAccessLevelFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">ทุกระดับการเข้าถึง</option>
              <option value="basic">พื้นฐาน</option>
              <option value="standard">มาตรฐาน</option>
              <option value="premium">พรีเมี่ยม</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requesters Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-900">องค์กร</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">ประเภท</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">ผู้ติดต่อหลัก</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">ระดับการเข้าถึง</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">สถานะ</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">วันที่สมัคร</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRequesters.map((requester) => (
                <tr key={requester.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-medium text-gray-900">{requester.organizationName}</div>
                      <div className="text-sm text-gray-500">{requester.registrationNumber}</div>
                      {requester.licenseNumber && (
                        <div className="text-xs text-gray-400">ใบอนุญาต: {requester.licenseNumber}</div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
                      {getTypeLabel(requester.organizationType)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-medium text-gray-900">{requester.primaryContactName}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Mail size={12} />
                        {requester.primaryContactEmail}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Phone size={12} />
                        {requester.primaryContactPhone}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getAccessLevelColor(requester.dataAccessLevel)}`}>
                      {getAccessLevelLabel(requester.dataAccessLevel)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(requester.status)}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(requester.status)}`}>
                        {requester.status === 'active' && 'ใช้งานได้'}
                        {requester.status === 'pending' && 'รออนุมัติ'}
                        {requester.status === 'suspended' && 'ระงับ'}
                        {requester.status === 'revoked' && 'ปฏิเสธ'}
                      </span>
                    </div>
                    {requester.isVerified && (
                      <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <Shield size={10} />
                        ยืนยันแล้ว
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-500">
                    {new Date(requester.createdAt).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewDetails(requester)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                      >
                        <Eye size={14} />
                        ดูรายละเอียด
                      </button>
                      
                      {requester.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(requester.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
                          >
                            <Check size={14} />
                            อนุมัติ
                          </button>
                          <button
                            onClick={() => handleReject(requester.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                          >
                            <X size={14} />
                            ปฏิเสธ
                          </button>
                        </>
                      )}
                      
                      {requester.status === 'active' && (
                        <button
                          onClick={() => handleSuspend(requester.id, 'ระงับโดย Admin')}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-md transition-colors"
                        >
                          <AlertTriangle size={14} />
                          ระงับ
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
      {showDetailsModal && selectedRequester && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  รายละเอียดองค์กร: {selectedRequester?.organizationName}
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
                    ข้อมูลองค์กร
                  </h4>
                  <div className="space-y-3 pl-6">
                    <div>
                      <label className="text-sm font-medium text-gray-600">ชื่อองค์กร</label>
                      <p className="text-gray-900">{selectedRequester?.organizationName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">ประเภท</label>
                      <p className="text-gray-900">{selectedRequester?.organizationType ? getTypeLabel(selectedRequester.organizationType) : ''}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">เลขทะเบียน</label>
                      <p className="text-gray-900">{selectedRequester?.registrationNumber}</p>
                    </div>
                    {selectedRequester?.licenseNumber && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">เลขใบอนุญาต</label>
                        <p className="text-gray-900">{selectedRequester.licenseNumber}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-600">เลขประจำตัวผู้เสียภาษี</label>
                      <p className="text-gray-900">{selectedRequester?.taxId}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <Mail size={18} />
                    ข้อมูลผู้ติดต่อ
                  </h4>
                  <div className="space-y-3 pl-6">
                    <div>
                      <label className="text-sm font-medium text-gray-600">ชื่อผู้ติดต่อหลัก</label>
                      <p className="text-gray-900">{selectedRequester?.primaryContactName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">อีเมล</label>
                      <p className="text-gray-900">{selectedRequester?.primaryContactEmail}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">โทรศัพท์</label>
                      <p className="text-gray-900">{selectedRequester?.primaryContactPhone}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <MapPin size={18} />
                  ที่อยู่
                </h4>
                <div className="pl-6">
                  <p className="text-gray-900">
                    {selectedRequester?.address?.street}, {selectedRequester?.address?.city}, {selectedRequester?.address?.province} {selectedRequester?.address?.postalCode}, {selectedRequester?.address?.country}
                  </p>
                </div>
              </div>

              {/* Access & Permissions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <Shield size={18} />
                    การเข้าถึงและสิทธิ์
                  </h4>
                  <div className="space-y-3 pl-6">
                    <div>
                      <label className="text-sm font-medium text-gray-600">ระดับการเข้าถึง</label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${selectedRequester?.dataAccessLevel ? getAccessLevelColor(selectedRequester.dataAccessLevel) : ''} ml-2`}>
                        {selectedRequester?.dataAccessLevel ? getAccessLevelLabel(selectedRequester.dataAccessLevel) : ''}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">จำนวนคำขอสูงสุด</label>
                      <p className="text-gray-900">{selectedRequester?.maxConcurrentRequests} คำขอ</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">ประเภทคำขอที่อนุญาต</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedRequester.allowedRequestTypes.map((type, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200">
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <Award size={18} />
                    การรับรองและการตรวจสอบ
                  </h4>
                  <div className="space-y-3 pl-6">
                    <div>
                      <label className="text-sm font-medium text-gray-600">สถานะการยืนยัน</label>
                      <div className="flex items-center gap-2 mt-1">
                        {selectedRequester.isVerified ? (
                          <>
                            <Shield className="text-green-600" size={16} />
                            <span className="text-green-600">ยืนยันแล้ว</span>
                          </>
                        ) : (
                          <>
                            <Clock className="text-yellow-600" size={16} />
                            <span className="text-yellow-600">รอการยืนยัน</span>
                          </>
                        )}
                      </div>
                    </div>
                    {selectedRequester.verificationDate && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">วันที่ยืนยัน</label>
                        <p className="text-gray-900">
                          {new Date(selectedRequester.verificationDate).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-600">การรับรองมาตรฐาน</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedRequester.complianceCertifications.map((cert, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-50 text-green-700 border border-green-200">
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status & Timeline */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Calendar size={18} />
                  ข้อมูลการใช้งาน
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pl-6">
                  <div>
                    <label className="text-sm font-medium text-gray-600">วันที่สมัคร</label>
                    <p className="text-gray-900">
                      {new Date(selectedRequester.createdAt).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">อัปเดตล่าสุด</label>
                    <p className="text-gray-900">
                      {new Date(selectedRequester.updatedAt).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  {selectedRequester.lastComplianceAudit && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">ตรวจสอบล่าสุด</label>
                      <p className="text-gray-900">
                        {new Date(selectedRequester.lastComplianceAudit).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                </div>
                {selectedRequester.suspensionReason && (
                  <div className="pl-6">
                    <label className="text-sm font-medium text-gray-600">เหตุผลการระงับ</label>
                    <p className="text-orange-600 bg-orange-50 border border-orange-200 rounded p-2 mt-1">
                      {selectedRequester.suspensionReason}
                    </p>
                  </div>
                )}
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
                {selectedRequester.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        handleReject(selectedRequester.id);
                        setShowDetailsModal(false);
                      }}
                      className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      ปฏิเสธ
                    </button>
                    <button
                      onClick={() => {
                        handleApprove(selectedRequester.id);
                        setShowDetailsModal(false);
                      }}
                      className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      อนุมัติ
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
