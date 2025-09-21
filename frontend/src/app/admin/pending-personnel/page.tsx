'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
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
  Building,
  RefreshCw,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { 
  pendingPersonnelService, 
  PendingUser, 
  ApprovalStatsResponse 
} from '@/services/pendingPersonnelService';

export default function PendingPersonnelPage() {
  const [personnel, setPersonnel] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [stats, setStats] = useState<ApprovalStatsResponse['data'] | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch pending users and stats
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch pending users with fallback
      let usersResponse;
      try {
        usersResponse = await pendingPersonnelService.getPendingUsers({
          page: pagination.page,
          limit: pagination.limit,
          role: roleFilter === 'all' ? undefined : roleFilter,
          search: searchTerm || undefined
        });
        setPersonnel(usersResponse?.data?.users || []);
        setPagination(usersResponse?.data?.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        });
      } catch (usersError) {
        console.warn('Could not fetch pending users, using fallback:', usersError);
        setPersonnel([]);
        setPagination({
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        });
      }

      // Try to fetch approval stats with fallback
      try {
        const statsResponse = await pendingPersonnelService.getApprovalStats();
        setStats(statsResponse?.data || null);
      } catch (statsError) {
        console.warn('Could not fetch approval stats, using fallback:', statsError);
        setStats(null);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.page, roleFilter, searchTerm]);

  // Handle approve user
  const handleApprove = async (userId: string) => {
    try {
      setActionLoading(userId);
      await pendingPersonnelService.approveUser(userId, {
        approvalNotes: 'อนุมัติโดยผู้ดูแลระบบ'
      });
      
      // Refresh data after approval
      await fetchData();
    } catch (err: any) {
      console.error('Error approving user:', err);
      setError('ไม่สามารถอนุมัติผู้ใช้ได้');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle reject user
  const handleReject = async (userId: string) => {
    const reason = prompt('กรุณาระบุเหตุผลในการปฏิเสธ:');
    if (!reason) return;

    try {
      setActionLoading(userId);
      await pendingPersonnelService.rejectUser(userId, {
        rejectionReason: reason
      });
      
      // Refresh data after rejection
      await fetchData();
    } catch (err: any) {
      console.error('Error rejecting user:', err);
      setError('ไม่สามารถปฏิเสธผู้ใช้ได้');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle search with debounce
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getStatusBadge = () => {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3 mr-1" />
        รอการอนุมัติ
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'doctor':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            แพทย์
          </span>
        );
      case 'nurse':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            พยาบาล
          </span>
        );
      case 'staff':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            เจ้าหน้าที่
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {role}
          </span>
        );
    }
  };

  const pendingCount = stats?.summary.totalPending || 0;
  const approvedCount = stats?.summary.totalApproved || 0;
  const totalCount = personnel.length;

  if (error) {
    return (
      <div className="w-full h-full bg-gray-50 p-2 lg:p-4 overflow-auto flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">เกิดข้อผิดพลาด</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchData}
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
      <div className="flex items-center justify-between mb-4 lg:mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการบุคลากร</h1>
          <p className="text-sm text-gray-600 mt-1">
            อนุมัติ ปฏิเสธ และจัดการบัญชีบุคลากรในระบบ
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            รีเฟรช
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200">
            <Download className="w-4 h-4 mr-2" />
            ส่งออก
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 mb-4 lg:mb-6 min-w-0">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">รอการอนุมัติ</p>
              <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">อนุมัติแล้ว</p>
              <p className="text-2xl font-bold text-gray-900">{approvedCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">แสดงในหน้านี้</p>
              <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ค้นหา</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="ชื่อ, อีเมล, หรือเลขใบอนุญาต..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ตำแหน่ง</label>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">ทั้งหมด</option>
              <option value="doctor">แพทย์</option>
              <option value="nurse">พยาบาล</option>
              <option value="staff">เจ้าหน้าที่</option>
            </select>
          </div>

          <div className="flex items-end">
            <button 
              onClick={fetchData}
              disabled={loading}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
            >
              <Filter className="w-4 h-4 mr-2" />
              กรอง
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  บุคลากร
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ตำแหน่ง
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  หน่วยงาน
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  วันที่สมัคร
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  การดำเนินการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="animate-pulse h-4 bg-gray-200 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="animate-pulse h-4 bg-gray-200 rounded w-32"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="animate-pulse h-6 bg-gray-200 rounded-full w-24"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="animate-pulse h-4 bg-gray-200 rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="animate-pulse h-8 bg-gray-200 rounded w-20 ml-auto"></div>
                    </td>
                  </tr>
                ))
              ) : personnel.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Users className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-sm font-medium text-gray-900 mb-1">
                        ไม่พบข้อมูลบุคลากร
                      </h3>
                      <p className="text-sm text-gray-500">
                        ลองเปลี่ยนเงื่อนไขการค้นหาหรือกรองข้อมูล
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                personnel.map((person) => (
                  <tr key={person.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {person.name}
                        </div>
                        <div className="text-sm text-gray-500">{person.email}</div>
                        {person.professionalInfo.licenseNumber && (
                          <div className="text-xs text-gray-400 mt-1">
                            ใบอนุญาต: {person.professionalInfo.licenseNumber}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(person.role)}
                      {person.professionalInfo.specialization && (
                        <div className="text-xs text-gray-500 mt-1">
                          {person.professionalInfo.specialization}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{person.professionalInfo.department}</div>
                      {person.professionalInfo.position && (
                        <div className="text-sm text-gray-500">{person.professionalInfo.position}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge()}
                      <div className="text-xs text-green-600 mt-1 flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        ยืนยันตัวตนแล้ว
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(person.createdAt).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button className="inline-flex items-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <button 
                          onClick={() => handleApprove(person.id)}
                          disabled={actionLoading === person.id}
                          className="inline-flex items-center p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg disabled:opacity-50"
                        >
                          {actionLoading === person.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                        <button 
                          onClick={() => handleReject(person.id)}
                          disabled={actionLoading === person.id}
                          className="inline-flex items-center p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg disabled:opacity-50"
                        >
                          {actionLoading === person.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </button>
                        
                        <button className="inline-flex items-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                          <MoreHorizontal className="w-4 h-4" />
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

      {/* Pagination */}
      {personnel.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              แสดง <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> ถึง <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> จากทั้งหมด <span className="font-medium">{pagination.total}</span> รายการ
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page <= 1 || loading}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ก่อนหน้า
              </button>
              <span className="px-3 py-2 text-sm text-gray-700">
                หน้า {pagination.page} จาก {pagination.totalPages}
              </span>
              <button 
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages || loading}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ถัดไป
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
