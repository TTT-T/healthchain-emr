"use client";

import React, { useState, useEffect } from 'react';
import { Database, Server, HardDrive, RefreshCw, Download, Upload, AlertTriangle, CheckCircle, XCircle, Settings, Monitor, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';

interface DatabaseStats {
  name: string;
  size: string;
  tables: number;
  records: number;
  status: 'healthy' | 'warning' | 'error';
  lastBackup: string;
}

interface TableInfo {
  name: string;
  records: number;
  size: string;
  sizeBytes?: number;
  lastUpdated: string;
  status: 'active' | 'inactive';
}

const mockDatabaseStats: DatabaseStats[] = [
  {
    name: 'healthchain_main',
    size: '2.4 GB',
    tables: 28,
    records: 125430,
    status: 'healthy',
    lastBackup: '2024-12-19 03:00:00'
  },
  {
    name: 'healthchain_logs',
    size: '890 MB',
    tables: 8,
    records: 45920,
    status: 'healthy',
    lastBackup: '2024-12-19 03:00:00'
  },
  {
    name: 'healthchain_analytics',
    size: '1.2 GB',
    tables: 15,
    records: 67840,
    status: 'warning',
    lastBackup: '2024-12-18 03:00:00'
  }
];

const mockTableInfo: TableInfo[] = [
  { name: 'users', records: 12540, size: '45 MB', lastUpdated: '2024-12-19 14:30:00', status: 'active' },
  { name: 'patient_records', records: 8920, size: '234 MB', lastUpdated: '2024-12-19 14:25:00', status: 'active' },
  { name: 'medical_history', records: 15680, size: '156 MB', lastUpdated: '2024-12-19 14:20:00', status: 'active' },
  { name: 'appointments', records: 3420, size: '28 MB', lastUpdated: '2024-12-19 14:15:00', status: 'active' },
  { name: 'prescriptions', records: 9870, size: '67 MB', lastUpdated: '2024-12-19 14:10:00', status: 'active' },
  { name: 'lab_results', records: 6540, size: '89 MB', lastUpdated: '2024-12-19 14:05:00', status: 'active' },
  { name: 'temp_sessions', records: 245, size: '2 MB', lastUpdated: '2024-12-19 12:00:00', status: 'inactive' }
];

export default function DatabasePage() {
  const [databases, setDatabases] = useState<DatabaseStats[]>([]);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string>('');
  const [isBackupRunning, setIsBackupRunning] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [databaseStatus, setDatabaseStatus] = useState<any>(null);
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDatabaseData();
  }, []);

  const loadDatabaseData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load database status
      const statusResponse = await apiClient.getDatabaseStatus();
      if (statusResponse.statusCode === 200) {
        setDatabaseStatus(statusResponse.data);
        
        // Map database status to DatabaseStats format
        const dbData = statusResponse.data as any;
        const connectionInfo = dbData.connection || {};
        const tablesData = dbData.tables || {};
        
        const mappedDatabases: DatabaseStats[] = [{
          name: connectionInfo.database_name || 'postgres',
          size: connectionInfo.database_size || 'Unknown',
          tables: tablesData.statistics?.length || 0,
          records: tablesData.statistics?.reduce((sum: number, table: any) => sum + (parseInt(table.live_tuples) || 0), 0) || 0,
          status: dbData.status === 'healthy' ? 'healthy' : 'error',
          lastBackup: 'Never'
        }];
        setDatabases(mappedDatabases);
        
        if (mappedDatabases.length > 0) {
          setSelectedDatabase(mappedDatabases[0].name);
        }
      }

      // Load table information from database status
      if (statusResponse.statusCode === 200) {
        const dbData = statusResponse.data as any;
        const tablesData = dbData.tables || {};
        const tableSizes = tablesData.sizes || [];
        const tableStats = tablesData.statistics || [];
        
        // Map table statistics to TableInfo format
        const mappedTables: TableInfo[] = tableStats.map((table: any) => {
          const sizeInfo = tableSizes.find((size: any) => size.tablename === table.tablename);
          const tableSize = sizeInfo?.size || 'Unknown';
          const tableSizeBytes = parseInt(sizeInfo?.size_bytes) || 0;
          
          // Debug: Log size information
          if (tableSizeBytes > 0) {
            console.log(`Table ${table.tablename}: ${tableSize} (${tableSizeBytes} bytes)`);
          }
          
          return {
            name: table.tablename,
            records: parseInt(table.live_tuples) || 0,
            size: tableSize,
            sizeBytes: tableSizeBytes, // Store bytes for accurate calculation
            lastUpdated: table.last_analyze ? new Date(table.last_analyze).toLocaleString() : 'Unknown',
            status: 'active'
          };
        });
        setTables(mappedTables);
      }

      // Load backups
      // const backupsResponse = await apiClient.getDatabaseBackups();
      // if (backupsResponse.success) {
      //   setBackups(backupsResponse.data.backups || []);
      // }
    } catch (error) {
      logger.error('Failed to load database data:', error);
      setError('ไม่สามารถโหลดข้อมูลฐานข้อมูลได้');
      
      // Fallback to mock data if API fails
      setDatabases(mockDatabaseStats);
      setTables(mockTableInfo);
      setSelectedDatabase('healthchain_main');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    loadDatabaseData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'error': return 'text-red-600 bg-red-50';
      case 'active': return 'text-green-600 bg-green-50';
      case 'inactive': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'active':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-yellow-600" />;
      case 'error':
        return <XCircle size={16} className="text-red-600" />;
      case 'inactive':
        return <XCircle size={16} className="text-gray-600" />;
      default:
        return <CheckCircle size={16} className="text-gray-600" />;
    }
  };

  const handleBackup = async () => {
    setIsBackupRunning(true);
    try {
      const response = await apiClient.createDatabaseBackup({
        type: 'full',
        description: 'Manual backup created from admin panel'
      });
      
      if (response.statusCode === 200) {
        logger.debug('Backup created:', response.data);
        // Refresh all data
        refreshData();
      } else {
        logger.error('Backup failed:', response.error);
        setError('ไม่สามารถสร้าง backup ได้: ' + (response.error?.message || 'ไม่ทราบสาเหตุ'));
      }
    } catch (error) {
      logger.error('Backup error:', error);
      setError('เกิดข้อผิดพลาดในการสร้าง backup');
    } finally {
      setIsBackupRunning(false);
    }
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      const response = await apiClient.optimizeDatabase({
        tables: []
      });
      
      if (response.statusCode === 200) {
        logger.debug('Database optimized:', response.data);
        // Refresh all data
        refreshData();
      } else {
        logger.error('Optimization failed:', response.error);
        setError('ไม่สามารถ optimize ฐานข้อมูลได้: ' + (response.error?.message || 'ไม่ทราบสาเหตุ'));
      }
    } catch (error) {
      logger.error('Optimization error:', error);
      setError('เกิดข้อผิดพลาดในการ optimize ฐานข้อมูล');
    } finally {
      setIsOptimizing(false);
    }
  };

  const totalRecords = tables.reduce((sum, table) => sum + table.records, 0);
  const totalSize = tables.reduce((sum, table) => {
    // Use sizeBytes if available for accurate calculation
    if (table.sizeBytes && table.sizeBytes > 0) {
      const sizeInGB = table.sizeBytes / (1024 * 1024 * 1024);
      console.log(`Table ${table.name}: ${table.sizeBytes} bytes -> ${sizeInGB.toFixed(6)} GB`);
      return sum + sizeInGB;
    }
    
    // Fallback to parsing size string if sizeBytes not available
    if (!table.size || table.size === 'Unknown') {
      console.log(`Table ${table.name}: No size information available`);
      return sum;
    }
    
    const sizeStr = table.size.replace(' GB', '').replace(' MB', '').replace(' KB', '').replace(' bytes', '');
    const size = parseFloat(sizeStr);
    if (isNaN(size)) {
      console.log(`Table ${table.name}: Invalid size format: ${table.size}`);
      return sum;
    }
    
    let sizeInGB = 0;
    
    // Convert to GB if needed
    if (table.size.includes(' MB')) {
      sizeInGB = size / 1024;
    } else if (table.size.includes(' KB')) {
      sizeInGB = size / (1024 * 1024);
    } else if (table.size.includes(' bytes')) {
      sizeInGB = size / (1024 * 1024 * 1024);
    } else if (table.size.includes(' GB')) {
      sizeInGB = size; // Already in GB
    } else {
      // If no unit specified, assume it's already in GB
      sizeInGB = size;
    }
    
    console.log(`Table ${table.name}: ${table.size} -> ${sizeInGB.toFixed(6)} GB (fallback)`);
    return sum + sizeInGB;
  }, 0);

  // Debug: Log total size calculation
  console.log(`🔍 Total Size Calculation: ${totalSize.toFixed(6)} GB`);
  console.log(`🔍 Total Size Rounded: ${totalSize.toFixed(3)} GB`);
  
  // Format total size for display
  const formatTotalSize = (sizeInGB: number): string => {
    if (sizeInGB >= 1) {
      return `${sizeInGB.toFixed(2)} GB`;
    } else if (sizeInGB >= 0.001) {
      return `${(sizeInGB * 1024).toFixed(1)} MB`;
    } else {
      return `${(sizeInGB * 1024 * 1024).toFixed(0)} KB`;
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full bg-gray-50 p-2 lg:p-4 overflow-auto flex items-center justify-center">
        <div className="text-center">
          <RefreshCw size={48} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">กำลังโหลดข้อมูลฐานข้อมูล...</p>
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
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Database className="text-blue-600" />
              Database Management
            </h1>
            <p className="text-gray-600 mt-2">Monitor and manage system databases</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={refreshData}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            <button
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
            >
              {isOptimizing ? <RefreshCw size={16} className="animate-spin" /> : <Settings size={16} />}
              {isOptimizing ? 'Optimizing...' : 'Optimize'}
            </button>
            <button
              onClick={handleBackup}
              disabled={isBackupRunning}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
            >
              {isBackupRunning ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
              {isBackupRunning ? 'Backing up...' : 'Backup'}
            </button>
          </div>
        </div>
      </div>

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

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4 lg:mb-6 min-w-0">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Databases</p>
              <p className="text-2xl font-bold text-gray-900">{databases.length}</p>
            </div>
            <Database className="text-blue-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">{totalRecords.toLocaleString()}</p>
            </div>
            <HardDrive className="text-green-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Size</p>
              <p className="text-2xl font-bold text-gray-900">{formatTotalSize(totalSize)}</p>
            </div>
            <Server className="text-purple-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Health Status</p>
              <p className="text-2xl font-bold text-green-600">Good</p>
            </div>
            <Monitor className="text-green-600" size={24} />
          </div>
        </div>
      </div>

      {/* Database Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4 lg:mb-6">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Database Overview</h2>
          <p className="text-gray-600 mt-1">Status and statistics for all databases</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Database Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tables
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Records
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Backup
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {databases.map((db) => (
                <tr key={db.name} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Database className="text-gray-400" size={16} />
                      <span className="font-medium text-gray-900">{db.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{db.size}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{db.tables}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{db.records.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(db.status)}`}>
                      {getStatusIcon(db.status)}
                      {db.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{db.lastBackup}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setSelectedDatabase(db.name)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                      >
                        <Monitor size={16} />
                      </button>
                      <button className="text-green-600 hover:text-green-900 transition-colors">
                        <Download size={16} />
                      </button>
                      <button className="text-red-600 hover:text-red-900 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Database Tables */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Tables in {selectedDatabase}</h2>
              <p className="text-gray-600 mt-1">Detailed information about database tables</p>
            </div>
            <select
              value={selectedDatabase}
              onChange={(e) => setSelectedDatabase(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {databases.map(db => (
                <option key={db.name} value={db.name}>{db.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Table Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Records
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
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
              {tables.length > 0 ? (
                tables.map((table) => (
                  <tr key={table.name} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">{table.name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {table.records.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{table.size}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{table.lastUpdated}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(table.status)}`}>
                        {getStatusIcon(table.status)}
                        {table.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button className="text-blue-600 hover:text-blue-900 transition-colors">
                          <Monitor size={16} />
                        </button>
                        <button className="text-green-600 hover:text-green-900 transition-colors">
                          <Download size={16} />
                        </button>
                        <button className="text-yellow-600 hover:text-yellow-900 transition-colors">
                          <Settings size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <Database size={48} className="mx-auto mb-2 text-gray-300" />
                    <p>ไม่มีข้อมูลตาราง</p>
                    <p className="text-sm">กดปุ่ม Refresh เพื่อโหลดข้อมูลใหม่</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Backup & Maintenance */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={handleBackup}
              disabled={isBackupRunning}
              className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {isBackupRunning ? <RefreshCw size={20} className="animate-spin text-blue-600" /> : <Download size={20} className="text-blue-600" />}
              <div className="text-left">
                <div className="font-medium text-gray-900">Full Database Backup</div>
                <div className="text-sm text-gray-500">Create a complete backup of all databases</div>
              </div>
            </button>
            <button 
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {isOptimizing ? <RefreshCw size={20} className="animate-spin text-green-600" /> : <Settings size={20} className="text-green-600" />}
              <div className="text-left">
                <div className="font-medium text-gray-900">Optimize Database</div>
                <div className="text-sm text-gray-500">Optimize tables and rebuild indexes</div>
              </div>
            </button>
            <button className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Upload size={20} className="text-purple-600" />
              <div className="text-left">
                <div className="font-medium text-gray-900">Import Data</div>
                <div className="text-sm text-gray-500">Import data from backup or CSV files</div>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Schedule</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div>
                <div className="font-medium text-green-900">Daily Backup</div>
                <div className="text-sm text-green-700">Next: Today at 3:00 AM</div>
              </div>
              <CheckCircle className="text-green-600" size={20} />
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div>
                <div className="font-medium text-blue-900">Weekly Optimization</div>
                <div className="text-sm text-blue-700">Next: Sunday at 2:00 AM</div>
              </div>
              <Settings className="text-blue-600" size={20} />
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div>
                <div className="font-medium text-yellow-900">Monthly Archive</div>
                <div className="text-sm text-yellow-700">Next: 1st of next month</div>
              </div>
              <AlertTriangle className="text-yellow-600" size={20} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
