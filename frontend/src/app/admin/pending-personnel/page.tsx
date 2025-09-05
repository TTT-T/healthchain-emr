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
  XCircle
} from 'lucide-react';

interface Personnel {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  id_card: string;
  phone: string;
  license_number: string;
  department?: string;
  hospital?: string;
  specialization?: string;
  experience_years?: number;
  is_verified: boolean;
  is_approved: boolean;
  approval_status: string;
  created_at: string;
  prefix: string;
  birth_date: string;
}

export default function PendingPersonnelPage() {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  // Mock data
  useEffect(() => {
    setTimeout(() => {
      setPersonnel([
        {
          id: 1,
          email: 'somchai@hospital.com',
          first_name: 'สมชาย',
          last_name: 'ใจดี',
          role: 'doctor',
          id_card: '1234567890123',
          phone: '0812345678',
          license_number: 'DOC12345',
          department: 'อายุรกรรม',
          hospital: 'โรงพยาบาลศิริราช',
          specialization: 'โรคหัวใจ',
          experience_years: 8,
          is_verified: false,
          is_approved: false,
          approval_status: 'pending',
          created_at: '2024-01-15T10:30:00Z',
          prefix: 'นาย',
          birth_date: '1985-03-15'
        },
        {
          id: 2,
          email: 'malee@hospital.com',
          first_name: 'มาลี',
          last_name: 'สุขใส',
          role: 'nurse',
          id_card: '1234567890124',
          phone: '0823456789',
          license_number: 'NUR67890',
          department: 'อุบัติเหตุฉุกเฉิน',
          hospital: 'โรงพยาบาลรามาธิบดี',
          specialization: 'พยาบาลวิกฤต',
          experience_years: 5,
          is_verified: true,
          is_approved: false,
          approval_status: 'pending',
          created_at: '2024-01-14T14:20:00Z',
          prefix: 'นางสาว',
          birth_date: '1990-07-22'
        },
        {
          id: 3,
          email: 'prasert@hospital.com',
          first_name: 'ประเสริฐ',
          last_name: 'เก่งกาจ',
          role: 'doctor',
          id_card: '1234567890125',
          phone: '0834567890',
          license_number: 'DOC54321',
          department: 'ศัลยกรรม',
          hospital: 'โรงพยาบาลจุฬาลงกรณ์',
          specialization: 'ศัลยกรรมหัวใจ',
          experience_years: 12,
          is_verified: true,
          is_approved: true,
          approval_status: 'approved',
          created_at: '2024-01-13T09:15:00Z',
          prefix: 'นาย',
          birth_date: '1978-11-08'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter personnel based on search and filters
  const filteredPersonnel = personnel.filter(person => {
    const matchesSearch = 
      person.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.license_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || person.approval_status === statusFilter;
    const matchesRole = roleFilter === 'all' || person.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleApprove = (id: number) => {
    setPersonnel(prev => 
      prev.map(person => 
        person.id === id 
          ? { ...person, approval_status: 'approved', is_approved: true }
          : person
      )
    );
  };

  const handleReject = (id: number) => {
    setPersonnel(prev => 
      prev.map(person => 
        person.id === id 
          ? { ...person, approval_status: 'rejected', is_approved: false }
          : person
      )
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            รอการอนุมัติ
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            อนุมัติแล้ว
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            ถูกปฏิเสธ
          </span>
        );
      default:
        return null;
    }
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
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {role}
          </span>
        );
    }
  };

  const pendingCount = personnel.filter(p => p.approval_status === 'pending').length;
  const approvedCount = personnel.filter(p => p.approval_status === 'approved').length;
  const rejectedCount = personnel.filter(p => p.approval_status === 'rejected').length;

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
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200">
            <RefreshCw className="w-4 h-4 mr-2" />
            รีเฟรช
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200">
            <Download className="w-4 h-4 mr-2" />
            ส่งออก
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4 lg:mb-6 min-w-0">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">ทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900">{personnel.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-yellow-600" />
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
              <UserX className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">ถูกปฏิเสธ</p>
              <p className="text-2xl font-bold text-gray-900">{rejectedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ค้นหา</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ชื่อ, อีเมล, หรือเลขใบอนุญาต..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">ทั้งหมด</option>
              <option value="pending">รอการอนุมัติ</option>
              <option value="approved">อนุมัติแล้ว</option>
              <option value="rejected">ถูกปฏิเสธ</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ตำแหน่ง</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">ทั้งหมด</option>
              <option value="doctor">แพทย์</option>
              <option value="nurse">พยาบาล</option>
            </select>
          </div>

          <div className="flex items-end">
            <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200">
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
              ) : filteredPersonnel.length === 0 ? (
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
                filteredPersonnel.map((person) => (
                  <tr key={person.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {person.prefix} {person.first_name} {person.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{person.email}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          ใบอนุญาต: {person.license_number}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(person.role)}
                      {person.specialization && (
                        <div className="text-xs text-gray-500 mt-1">
                          {person.specialization}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{person.department}</div>
                      <div className="text-sm text-gray-500">{person.hospital}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(person.approval_status)}
                      {person.is_verified && (
                        <div className="text-xs text-green-600 mt-1 flex items-center">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          ยืนยันตัวตนแล้ว
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(person.created_at).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button className="inline-flex items-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {person.approval_status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleApprove(person.id)}
                              className="inline-flex items-center p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleReject(person.id)}
                              className="inline-flex items-center p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
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
      {filteredPersonnel.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              แสดง <span className="font-medium">1</span> ถึง <span className="font-medium">{filteredPersonnel.length}</span> จากทั้งหมด <span className="font-medium">{personnel.length}</span> รายการ
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                ก่อนหน้า
              </button>
              <button className="px-3 py-2 text-sm text-white bg-blue-600 border border-blue-600 rounded-lg">
                1
              </button>
              <button className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                ถัดไป
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
