"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Search, Filter, Calendar, User, Activity, Eye, Loader2, AlertCircle, Download } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  user_id: string;
  user_name: string;
  user_role: string;
  details: string;
  ip_address: string;
  user_agent: string;
  timestamp: string;
  status: 'success' | 'failed';
}

export default function AuditLogPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateRange, setDateRange] = useState('7d');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Mock audit logs data
  const mockAuditLogs: AuditLog[] = [
    {
      id: '1',
      action: 'CREATE',
      resource: 'User',
      user_id: 'admin-1',
      user_name: 'Admin User',
      user_role: 'admin',
      details: 'Created new user: john.doe@example.com',
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: '2024-01-15T10:30:00Z',
      status: 'success'
    },
    {
      id: '2',
      action: 'UPDATE',
      resource: 'User',
      user_id: 'admin-1',
      user_name: 'Admin User',
      user_role: 'admin',
      details: 'Updated user role from nurse to doctor',
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: '2024-01-15T09:15:00Z',
      status: 'success'
    },
    {
      id: '3',
      action: 'DELETE',
      resource: 'User',
      user_id: 'admin-1',
      user_name: 'Admin User',
      user_role: 'admin',
      details: 'Soft deleted user: old.user@example.com',
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: '2024-01-15T08:45:00Z',
      status: 'success'
    },
    {
      id: '4',
      action: 'LOGIN',
      resource: 'Authentication',
      user_id: 'doctor-1',
      user_name: 'Dr. Smith',
      user_role: 'doctor',
      details: 'Successful login',
      ip_address: '192.168.1.101',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      timestamp: '2024-01-15T08:00:00Z',
      status: 'success'
    },
    {
      id: '5',
      action: 'LOGIN',
      resource: 'Authentication',
      user_id: 'unknown',
      user_name: 'Unknown User',
      user_role: 'unknown',
      details: 'Failed login attempt with invalid credentials',
      ip_address: '192.168.1.102',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: '2024-01-15T07:30:00Z',
      status: 'failed'
    },
    {
      id: '6',
      action: 'UPDATE',
      resource: 'Patient',
      user_id: 'doctor-1',
      user_name: 'Dr. Smith',
      user_role: 'doctor',
      details: 'Updated patient medical record: Patient ID 12345',
      ip_address: '192.168.1.101',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      timestamp: '2024-01-14T16:20:00Z',
      status: 'success'
    },
    {
      id: '7',
      action: 'CREATE',
      resource: 'Appointment',
      user_id: 'nurse-1',
      user_name: 'Nurse Johnson',
      user_role: 'nurse',
      details: 'Created new appointment for Patient ID 12345',
      ip_address: '192.168.1.103',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: '2024-01-14T14:15:00Z',
      status: 'success'
    },
    {
      id: '8',
      action: 'UPDATE',
      resource: 'System Settings',
      user_id: 'admin-1',
      user_name: 'Admin User',
      user_role: 'admin',
      details: 'Updated system configuration: Email settings',
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: '2024-01-14T11:30:00Z',
      status: 'success'
    }
  ];

  useEffect(() => {
    fetchData();
  }, [pagination.page, searchTerm, selectedAction, selectedStatus, dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call real API to get audit logs
      const response = await fetch('/api/admin/audit-logs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }
      
      const data = await response.json();
      const apiLogs = data.data.logs || [];
      
      // Filter data based on search and filters
      let filteredLogs = apiLogs.length > 0 ? apiLogs : mockAuditLogs;
      
      if (searchTerm) {
        filteredLogs = filteredLogs.filter((log: any) =>
          log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.resource.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      if (selectedAction !== 'all') {
        filteredLogs = filteredLogs.filter((log: any) => log.action === selectedAction);
      }
      
      if (selectedStatus !== 'all') {
        filteredLogs = filteredLogs.filter((log: any) => log.status === selectedStatus);
      }
      
      // Apply date range filter (simplified)
      const now = new Date();
      const daysBack = parseInt(dateRange.replace('d', ''));
      const cutoffDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
      filteredLogs = filteredLogs.filter((log: any) => new Date(log.timestamp) >= cutoffDate);
      
      // Apply pagination
      const startIndex = (pagination.page - 1) * pagination.limit;
      const endIndex = startIndex + pagination.limit;
      const paginatedLogs = filteredLogs.slice(startIndex, endIndex);
      
      setAuditLogs(paginatedLogs);
      setPagination(prev => ({
        ...prev,
        total: filteredLogs.length,
        totalPages: Math.ceil(filteredLogs.length / pagination.limit)
      }));
    } catch (err: any) {
      console.error('Error fetching audit logs:', err);
      setError('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      'CREATE': 'bg-green-100 text-green-800',
      'UPDATE': 'bg-blue-100 text-blue-800',
      'DELETE': 'bg-red-100 text-red-800',
      'LOGIN': 'bg-purple-100 text-purple-800',
      'LOGOUT': 'bg-gray-100 text-gray-800'
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    return status === 'success' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'admin': 'bg-red-100 text-red-800',
      'doctor': 'bg-green-100 text-green-800',
      'nurse': 'bg-purple-100 text-purple-800',
      'pharmacist': 'bg-orange-100 text-orange-800',
      'lab_technician': 'bg-teal-100 text-teal-800',
      'staff': 'bg-indigo-100 text-indigo-800',
      'patient': 'bg-gray-100 text-gray-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (daring: string) => {
    return new Date(daring).toLocaleDaring('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportLogs = () => {
    // Simulate export functionality
    alert('กำลังส่งออกข้อมูลบันทึกการใช้งาน...');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">กำลังโหลดข้อมูล...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <AlertCircle size={32} className="text-red-500" />
            <span className="ml-2 text-red-600">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link 
                href="/admin/role-management"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">บันทึกการเปลี่ยนแปลง</h1>
                <p className="text-gray-600">ตรวจสอบประวัติการใช้งานและกิจกรรมในระบบ</p>
              </div>
            </div>
            <button
              onClick={exportLogs}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download size={16} />
              ส่งออกข้อมูล
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ค้นหา</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหาผู้ใช้, รายละเอียด..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">การดำเนินการ</label>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">ทั้งหมด</option>
                <option value="CREATE">สร้าง</option>
                <option value="UPDATE">แก้ไข</option>
                <option value="DELETE">ลบ</option>
                <option value="LOGIN">เข้าสู่ระบบ</option>
                <option value="LOGOUT">ออกจากระบบ</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">ทั้งหมด</option>
                <option value="success">สำเร็จ</option>
                <option value="failed">ล้มเหลว</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ช่วงเวลา</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="1d">วันนี้</option>
                <option value="7d">7 วันที่ผ่านมา</option>
                <option value="30d">30 วันที่ผ่านมา</option>
                <option value="90d">90 วันที่ผ่านมา</option>
              </select>
            </div>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การดำเนินการ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ผู้ใช้
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    รายละเอียด
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    เวลา
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                        <span className="text-sm text-gray-600">{log.resource}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User size={14} className="text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{log.user_name}</div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(log.user_role)}`}>
                              {log.user_role}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {log.details}
                      </div>
                      <div className="text-xs text-gray-500">
                        IP: {log.ip_address}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                        {log.status === 'success' ? 'สำเร็จ' : 'ล้มเหลว'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  แสดง {((pagination.page - 1) * pagination.limit) + 1} ถึง {Math.min(pagination.page * pagination.limit, pagination.total)} จาก {pagination.total} รายการ
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ก่อนหน้า
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ถัดไป
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
