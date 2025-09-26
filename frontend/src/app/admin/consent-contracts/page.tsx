"use client";

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Plus, 
  Download,
  Upload,
  Copy,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  Calendar,
  Users,
  Building2,
  X,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { consentContractsService, ConsentContract, ConsentContractStats } from '@/services/consentContractsService';

// Remove mock data - will use real data from API

export default function ConsentContracts() {
  const [contracts, setContracts] = useState<ConsentContract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<ConsentContract[]>([]);
  const [stats, setStats] = useState<ConsentContractStats>({
    totalContracts: 0,
    activeContracts: 0,
    expiredContracts: 0,
    pendingContracts: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const categories = [
    { value: 'all', label: 'ทุกประเภท' },
    { value: 'medical', label: 'การรักษา' },
    { value: 'insurance', label: 'การประกัน' },
    { value: 'research', label: 'การวิจัย' },
    { value: 'emergency', label: 'ฉุกเฉิน' }
  ];

  const statuses = [
    { value: 'all', label: 'ทุกสถานะ' },
    { value: 'approved', label: 'อนุมัติแล้ว' },
    { value: 'pending', label: 'รออนุมัติ' },
    { value: 'expired', label: 'หมดอายุ' },
    { value: 'revoked', label: 'ยกเลิก' }
  ];

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Filter contracts when filters change
  useEffect(() => {
    let filtered = contracts;

    if (searchTerm) {
      filtered = filtered.filter(contract =>
        contract.contract_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.requester_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(contract => contract.status === selectedStatus);
    }

    setFilteredContracts(filtered);
  }, [contracts, searchTerm, selectedStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch contracts with fallback
      try {
        const contractsData = await consentContractsService.getAllContracts();
        setContracts(contractsData?.data?.contracts || []);
      } catch (contractsError) {
        console.warn('Could not fetch contracts, using fallback:', contractsError);
        setContracts([]);
      }

      // Try to fetch stats with fallback
      try {
        const statsData = await consentContractsService.getContractStats();
        setStats(statsData?.data || {
          totalContracts: 0,
          activeContracts: 0,
          expiredContracts: 0,
          pendingContracts: 0
        });
      } catch (statsError) {
        console.warn('Could not fetch contract stats, using fallback:', statsError);
        setStats({
          totalContracts: 0,
          activeContracts: 0,
          expiredContracts: 0,
          pendingContracts: 0
        });
      }
    } catch (err) {
      console.error('Failed to fetch consent contracts:', err);
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
      case 'approved': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'expired': return 'text-red-600 bg-red-100';
      case 'revoked': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'อนุมัติแล้ว';
      case 'pending': return 'รออนุมัติ';
      case 'expired': return 'หมดอายุ';
      case 'revoked': return 'ยกเลิก';
      default: return status;
    }
  };

  return (
    <div className="w-full h-full bg-gray-50 p-3 sm:p-4 lg:p-6 overflow-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              จัดการสัญญาและเทมเพลตการยินยอม
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              สร้างและจัดการเทมเพลตสำหรับการขอความยินยอมในการเข้าถึงข้อมูล
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              <span className="hidden sm:inline">รีเฟรช</span>
            </button>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">สร้างสัญญาใหม่</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8 min-w-0">
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">สัญญาทั้งหมด</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{stats.totalContracts}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="text-blue-600" size={16} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">ใช้งานอยู่</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">{stats.activeContracts}</p>
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
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-600">{stats.pendingContracts}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="text-yellow-600" size={16} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">หมดอายุ</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600">{stats.expiredContracts}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <XCircle className="text-red-600" size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ค้นหา</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Contract ID, ผู้ป่วย, หรือผู้ขอข้อมูล..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statuses.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">การดำเนินการ</label>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Download size={16} />
              ส่งออกรายงาน
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <span className="ml-2 text-gray-600">กำลังโหลดข้อมูล...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="text-red-600 mr-2" size={20} />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Contracts Table */}
      {!loading && !error && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-3 sm:px-6 text-sm font-medium text-gray-900">Contract ID</th>
                  <th className="text-left py-3 px-3 sm:px-6 text-sm font-medium text-gray-900">ผู้ป่วย</th>
                  <th className="text-left py-3 px-3 sm:px-6 text-sm font-medium text-gray-900">ผู้ขอข้อมูล</th>
                  <th className="text-left py-3 px-3 sm:px-6 text-sm font-medium text-gray-900">ประเภทข้อมูล</th>
                  <th className="text-left py-3 px-3 sm:px-6 text-sm font-medium text-gray-900">วันหมดอายุ</th>
                  <th className="text-left py-3 px-3 sm:px-6 text-sm font-medium text-gray-900">สถานะ</th>
                  <th className="text-left py-3 px-3 sm:px-6 text-sm font-medium text-gray-900">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-500">
                      <FileText className="mx-auto mb-2" size={32} />
                      <p>ไม่พบข้อมูลสัญญาการยินยอม</p>
                    </td>
                  </tr>
                ) : (
                  filteredContracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-gray-50">
                      <td className="py-4 px-3 sm:px-6 text-sm font-medium text-gray-900">
                        {contract.contract_id}
                      </td>
                      <td className="py-4 px-3 sm:px-6 text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{contract.patient_name}</div>
                          <div className="text-gray-500">HN: {contract.patient_hn}</div>
                        </div>
                      </td>
                      <td className="py-4 px-3 sm:px-6 text-sm text-gray-900">
                        {contract.requester_name}
                      </td>
                      <td className="py-4 px-3 sm:px-6 text-sm text-gray-900">
                        <div className="flex flex-wrap gap-1">
                          {contract.allowed_data_types?.slice(0, 2).map((type, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {type}
                            </span>
                          ))}
                          {contract.allowed_data_types?.length > 2 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              +{contract.allowed_data_types.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-3 sm:px-6 text-sm text-gray-900">
                        {contract.valid_until ? new Date(contract.valid_until).toLocaleString('th-TH') : 'ไม่จำกัด'}
                      </td>
                      <td className="py-4 px-3 sm:px-6">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(contract.status)}`}>
                          {getStatusText(contract.status)}
                        </span>
                      </td>
                      <td className="py-4 px-3 sm:px-6 text-sm">
                        <div className="flex items-center gap-2">
                          <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                            <Eye size={16} />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                            <Edit size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="text-center text-gray-500 py-8">
          <Settings size={48} className="mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">การตั้งค่านโยบายการยินยอม</h3>
          <p>ฟีเจอร์การตั้งค่านโยบายจะถูกพัฒนาในเฟสถัดไป</p>
        </div>
      </div>

      {/* Create Contract Modal - Placeholder */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">สร้างสัญญาการยินยอมใหม่</h2>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center text-gray-500 py-8">
                <FileText size={48} className="mx-auto mb-4" />
                <p>ฟอร์มสร้างสัญญาการยินยอมจะถูกพัฒนาในเฟสถัดไป</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
