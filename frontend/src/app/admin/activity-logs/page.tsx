"use client";

import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, RefreshCw, User, Clock, Activity, Eye } from 'lucide-react';

interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  userRole: string;
  action: string;
  module: string;
  details: string;
  ipAddress: string;
  status: 'success' | 'warning' | 'error';
}

const mockActivityLogs: ActivityLog[] = [
  {
    id: '1',
    timestamp: '2024-12-19 14:30:45',
    user: 'John Doe',
    userRole: 'Admin',
    action: 'User Created',
    module: 'User Management',
    details: 'Created new patient account for Jane Smith',
    ipAddress: '192.168.1.100',
    status: 'success'
  },
  {
    id: '2',
    timestamp: '2024-12-19 14:28:12',
    user: 'Dr. Sarah Wilson',
    userRole: 'Doctor',
    action: 'Record Updated',
    module: 'Medical Records',
    details: 'Updated medical record #MR-2024-001',
    ipAddress: '192.168.1.105',
    status: 'success'
  },
  {
    id: '3',
    timestamp: '2024-12-19 14:25:33',
    user: 'System',
    userRole: 'System',
    action: 'Login Failed',
    module: 'Authentication',
    details: 'Failed login attempt for user: admin@hospital.com',
    ipAddress: '203.154.123.45',
    status: 'warning'
  },
  {
    id: '4',
    timestamp: '2024-12-19 14:20:18',
    user: 'Mike Johnson',
    userRole: 'Nurse',
    action: 'Data Export',
    module: 'Reports',
    details: 'Exported patient list report',
    ipAddress: '192.168.1.110',
    status: 'success'
  },
  {
    id: '5',
    timestamp: '2024-12-19 14:15:22',
    user: 'System',
    userRole: 'System',
    action: 'Database Error',
    module: 'Database',
    details: 'Connection timeout while accessing patient records',
    ipAddress: '127.0.0.1',
    status: 'error'
  }
];

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>(mockActivityLogs);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>(mockActivityLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [dateRange, setDateRange] = useState('today');

  const modules = [...new Set(logs.map(log => log.module))];
  const users = [...new Set(logs.map(log => log.user))];

  useEffect(() => {
    let filtered = logs;

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterModule) {
      filtered = filtered.filter(log => log.module === filterModule);
    }

    if (filterStatus) {
      filtered = filtered.filter(log => log.status === filterStatus);
    }

    if (filterUser) {
      filtered = filtered.filter(log => log.user === filterUser);
    }

    setFilteredLogs(filtered);
  }, [searchTerm, filterModule, filterStatus, filterUser, logs]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✓';
      case 'warning': return '⚠';
      case 'error': return '✗';
      default: return '•';
    }
  };

  const handleExport = () => {
    console.log('Exporting activity logs...');
  };

  const handleRefresh = () => {
    console.log('Refreshing logs...');
  };

  return (
    <div className="w-full h-full bg-gray-50 p-2 lg:p-4 overflow-auto">
      {/* Header */}
      <div className="mb-4 lg:mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Activity className="text-blue-600" />
              Activity Logs
            </h1>
            <p className="text-gray-600 mt-2">Monitor system activities and user actions</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
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
              <p className="text-sm font-medium text-gray-600">Total Activities</p>
              <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
            </div>
            <Activity className="text-blue-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {Math.round((logs.filter(l => l.status === 'success').length / logs.length) * 100)}%
              </p>
            </div>
            <div className="text-green-600 text-xl">✓</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Warnings</p>
              <p className="text-2xl font-bold text-yellow-600">
                {logs.filter(l => l.status === 'warning').length}
              </p>
            </div>
            <div className="text-yellow-600 text-xl">⚠</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Errors</p>
              <p className="text-2xl font-bold text-red-600">
                {logs.filter(l => l.status === 'error').length}
              </p>
            </div>
            <div className="text-red-600 text-xl">✗</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Module Filter */}
          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Modules</option>
            {modules.map(module => (
              <option key={module} value={module}>{module}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>

          {/* User Filter */}
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Users</option>
            {users.map(user => (
              <option key={user} value={user}>{user}</option>
            ))}
          </select>

          {/* Date Range */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* Activity Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Module
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Clock className="text-gray-400" size={14} />
                      <span className="text-sm text-gray-900">{log.timestamp}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <User className="text-gray-400" size={14} />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{log.user}</div>
                        <div className="text-sm text-gray-500">{log.userRole}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{log.action}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {log.module}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{log.details}</span>
                    <div className="text-xs text-gray-500 mt-1">IP: {log.ipAddress}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                      {getStatusIcon(log.status)} {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button className="text-blue-600 hover:text-blue-900 transition-colors">
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <Activity className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredLogs.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {filteredLogs.length} of {logs.length} activities
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
              Previous
            </button>
            <button className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg">
              1
            </button>
            <button className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
              2
            </button>
            <button className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
