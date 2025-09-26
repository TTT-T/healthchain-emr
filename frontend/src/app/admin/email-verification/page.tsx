"use client";

import React, { useState, useEffect } from 'react';
import { Mail, Send, RefreshCw, Check, X, Clock, User, Search, Filter, Download, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface EmailVerification {
  id: string;
  email: string;
  userName: string;
  userType: 'patient' | 'doctor' | 'nurse' | 'admin';
  status: 'pending' | 'verified' | 'expired' | 'failed';
  sentAt: string;
  verifiedAt?: string;
  expiresAt: string;
  attempts: number;
  lastAttempt?: string;
  ipAddress: string;
}

const mockEmailVerifications: EmailVerification[] = [
  {
    id: '1',
    email: 'john.patient@email.com',
    userName: 'John Patient',
    userType: 'patient',
    status: 'pending',
    sentAt: '2024-12-19 14:30:00',
    expiresAt: '2024-12-20 14:30:00',
    attempts: 0,
    ipAddress: '192.168.1.100'
  },
  {
    id: '2',
    email: 'dr.sarah@hospital.com',
    userName: 'Dr. Sarah Wilson',
    userType: 'doctor',
    status: 'verified',
    sentAt: '2024-12-19 10:15:00',
    verifiedAt: '2024-12-19 10:25:00',
    expiresAt: '2024-12-20 10:15:00',
    attempts: 1,
    lastAttempt: '2024-12-19 10:25:00',
    ipAddress: '192.168.1.105'
  },
  {
    id: '3',
    email: 'nurse.mike@hospital.com',
    userName: 'Mike Johnson',
    userType: 'nurse',
    status: 'expired',
    sentAt: '2024-12-18 16:20:00',
    expiresAt: '2024-12-19 16:20:00',
    attempts: 2,
    lastAttempt: '2024-12-19 15:45:00',
    ipAddress: '192.168.1.110'
  },
  {
    id: '4',
    email: 'admin.@system.com',
    userName: ' Admin',
    userType: 'admin',
    status: 'failed',
    sentAt: '2024-12-19 12:00:00',
    expiresAt: '2024-12-20 12:00:00',
    attempts: 3,
    lastAttempt: '2024-12-19 13:30:00',
    ipAddress: '192.168.1.50'
  },
  {
    id: '5',
    email: 'patient.jane@email.com',
    userName: 'Jane Doe',
    userType: 'patient',
    status: 'pending',
    sentAt: '2024-12-19 13:45:00',
    expiresAt: '2024-12-20 13:45:00',
    attempts: 1,
    lastAttempt: '2024-12-19 14:20:00',
    ipAddress: '203.154.123.45'
  }
];

export default function EmailVerificationPage() {
  const [verifications, setVerifications] = useState<EmailVerification[]>(mockEmailVerifications);
  const [filteredVerifications, setFilteredVerifications] = useState<EmailVerification[]>(mockEmailVerifications);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterUserType, setFilterUserType] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isResending, setIsResending] = useState<Set<string>>(new Set());

  useEffect(() => {
    let filtered = verifications;

    if (searchTerm) {
      filtered = filtered.filter(verification =>
        verification.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        verification.userName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus) {
      filtered = filtered.filter(verification => verification.status === filterStatus);
    }

    if (filterUserType) {
      filtered = filtered.filter(verification => verification.userType === filterUserType);
    }

    setFilteredVerifications(filtered);
  }, [searchTerm, filterStatus, filterUserType, verifications]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-600 bg-green-50 border-green-200';
      case 'pending': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'expired': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle size={14} />;
      case 'pending': return <Clock size={14} />;
      case 'expired': return <AlertTriangle size={14} />;
      case 'failed': return <XCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'patient': return 'text-blue-600 bg-blue-50';
      case 'doctor': return 'text-green-600 bg-green-50';
      case 'nurse': return 'text-purple-600 bg-purple-50';
      case 'admin': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredVerifications.map(v => v.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleResendEmail = async (id: string) => {
    setIsResending(prev => new Set([...prev, id]));
    
    // Simulate API call
    setTimeout(() => {
      setVerifications(prev => prev.map(verification =>
        verification.id === id
          ? {
              ...verification,
              status: 'pending' as const,
              sentAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19)
            }
          : verification
      ));
      setIsResending(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }, 2000);
  };

  const handleBulkResend = async () => {
    const selectedEmails = Array.from(selectedIds);
    for (const id of selectedEmails) {
      await handleResendEmail(id);
    }
    setSelectedIds(new Set());
  };

  const handleDeleteVerification = (id: string) => {
    setVerifications(prev => prev.filter(v => v.id !== id));
  };

  const pendingCount = verifications.filter(v => v.status === 'pending').length;
  const verifiedCount = verifications.filter(v => v.status === 'verified').length;
  const expiredCount = verifications.filter(v => v.status === 'expired').length;
  const failedCount = verifications.filter(v => v.status === 'failed').length;

  return (
    <div className="w-full h-full bg-gray-50 p-2 lg:p-4 overflow-auto">
      {/* Header */}
      <div className="mb-4 lg:mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Mail className="text-blue-600" />
              Email Verification
            </h1>
            <p className="text-gray-600 mt-2">Manage email verification requests and status</p>
          </div>
          <div className="flex gap-3">
            {selectedIds.size > 0 && (
              <button
                onClick={handleBulkResend}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Send size={16} />
                Resend Selected ({selectedIds.size})
              </button>
            )}
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              <Download size={16} />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4 lg:mb-6 min-w-0">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-blue-600">{pendingCount}</p>
            </div>
            <Clock className="text-blue-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Verified</p>
              <p className="text-2xl font-bold text-green-600">{verifiedCount}</p>
            </div>
            <CheckCircle className="text-green-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Expired</p>
              <p className="text-2xl font-bold text-yellow-600">{expiredCount}</p>
            </div>
            <AlertTriangle className="text-yellow-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">{failedCount}</p>
            </div>
            <XCircle className="text-red-600" size={24} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4 lg:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 min-w-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="expired">Expired</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={filterUserType}
            onChange={(e) => setFilterUserType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All User Types</option>
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
            <option value="nurse">Nurse</option>
            <option value="admin">Admin</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setFilterStatus('');
              setFilterUserType('');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw size={16} />
            Reset
          </button>
        </div>
      </div>

      {/* Email Verifications Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4 lg:mb-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredVerifications.length && filteredVerifications.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sent At
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attempts
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVerifications.map((verification) => (
                <tr key={verification.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(verification.id)}
                      onChange={(e) => handleSelectOne(verification.id, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <User className="text-gray-400" size={16} />
                      <div>
                        <div className="font-medium text-gray-900">{verification.userName}</div>
                        <div className="text-sm text-gray-500">{verification.ipAddress}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{verification.email}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUserTypeColor(verification.userType)}`}>
                      {verification.userType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(verification.status)}`}>
                      {getStatusIcon(verification.status)}
                      {verification.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {verification.sentAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {verification.expiresAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{verification.attempts}</div>
                    {verification.lastAttempt && (
                      <div className="text-xs text-gray-500">Last: {verification.lastAttempt}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {verification.status !== 'verified' && (
                        <button
                          onClick={() => handleResendEmail(verification.id)}
                          disabled={isResending.has(verification.id)}
                          className="text-green-600 hover:text-green-900 transition-colors disabled:opacity-50"
                          title="Resend Email"
                        >
                          {isResending.has(verification.id) ? 
                            <RefreshCw size={16} className="animate-spin" /> : 
                            <Send size={16} />
                          }
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteVerification(verification.id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Delete"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredVerifications.length === 0 && (
          <div className="text-center py-12">
            <Mail className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No verifications found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>

      {/* Email Templates & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Email Templates */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Templates</h3>
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Welcome Email</h4>
              <p className="text-sm text-gray-600 mb-3">Sent to new users after registration</p>
              <button className="text-blue-600 hover:text-blue-900 text-sm">Edit Template</button>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Verification Reminder</h4>
              <p className="text-sm text-gray-600 mb-3">Sent when verification is about to expire</p>
              <button className="text-blue-600 hover:text-blue-900 text-sm">Edit Template</button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Verification Activity</h3>
          <div className="space-y-3">
            {verifications.slice(0, 5).map(verification => (
              <div key={verification.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="text-gray-400" size={16} />
                  <div>
                    <div className="font-medium text-gray-900">{verification.email}</div>
                    <div className="text-sm text-gray-500">Sent: {verification.sentAt}</div>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(verification.status)}`}>
                  {getStatusIcon(verification.status)}
                  {verification.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
