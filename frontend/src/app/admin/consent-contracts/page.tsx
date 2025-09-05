"use client";

import React, { useState } from 'react';
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
  X
} from 'lucide-react';

// Mock data สำหรับเทมเพลตการยินยอม
const consentTemplates = [
  {
    id: 'CT001',
    name: 'การยินยอมพื้นฐานสำหรับการรักษา',
    description: 'เทมเพลตมาตรฐานสำหรับการขอข้อมูลเพื่อการรักษาต่อเนื่อง',
    category: 'medical',
    version: '2.1',
    language: 'th',
    status: 'active',
    createdBy: 'Admin',
    createdAt: '2024-01-01T00:00:00Z',
    lastModified: '2024-01-10T00:00:00Z',
    usageCount: 156,
    requiredFields: ['patient_name', 'requester_name', 'purpose', 'data_types', 'duration'],
    isDefault: true
  },
  {
    id: 'CT002',
    name: 'การยินยอมสำหรับการประกัน',
    description: 'เทมเพลตสำหรับบริษัทประกันขอข้อมูลเพื่อการจ่ายสิทธิ',
    category: 'insurance',
    version: '1.5',
    language: 'th',
    status: 'active',
    createdBy: 'Admin',
    createdAt: '2023-12-15T00:00:00Z',
    lastModified: '2024-01-05T00:00:00Z',
    usageCount: 89,
    requiredFields: ['patient_name', 'policy_number', 'claim_type', 'data_types'],
    isDefault: false
  },
  {
    id: 'CT003',
    name: 'การยินยอมสำหรับการวิจัย',
    description: 'เทมเพลตสำหรับสถาบันวิจัยขอข้อมูลเพื่อการศึกษา',
    category: 'research',
    version: '1.0',
    language: 'th',
    status: 'draft',
    createdBy: 'Dr. Smith',
    createdAt: '2024-01-12T00:00:00Z',
    lastModified: '2024-01-14T00:00:00Z',
    usageCount: 12,
    requiredFields: ['patient_name', 'research_title', 'institution', 'data_types', 'anonymization'],
    isDefault: false
  },
  {
    id: 'CT004',
    name: 'การยินยอมฉุกเฉิน',
    description: 'เทมเพลตสำหรับการเข้าถึงข้อมูลในสถานการณ์ฉุกเฉิน',
    category: 'emergency',
    version: '1.3',
    language: 'th',
    status: 'active',
    createdBy: 'Admin',
    createdAt: '2023-11-20T00:00:00Z',
    lastModified: '2024-01-08T00:00:00Z',
    usageCount: 34,
    requiredFields: ['patient_name', 'emergency_type', 'medical_facility', 'urgency_level'],
    isDefault: false
  }
];

// Mock data สำหรับการตั้งค่าการยินยอม
const consentPolicies = {
  defaultExpirationDays: 90,
  allowEmergencyAccess: true,
  requirePatientSignature: true,
  enableAutomaticReminder: true,
  reminderDaysBefore: 7,
  maxDataRetentionDays: 365,
  requireAuditLog: true,
  enableRealTimeNotification: true
};

export default function ConsentContracts() {
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
    { value: 'active', label: 'ใช้งานอยู่' },
    { value: 'draft', label: 'ร่าง' },
    { value: 'archived', label: 'เก็บในคลัง' }
  ];

  const filteredTemplates = consentTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || template.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'draft': return 'text-yellow-600 bg-yellow-100';
      case 'archived': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'medical': return <Users className="text-blue-600" size={16} />;
      case 'insurance': return <Building2 className="text-purple-600" size={16} />;
      case 'research': return <FileText className="text-green-600" size={16} />;
      case 'emergency': return <AlertTriangle className="text-red-600" size={16} />;
      default: return <FileText className="text-gray-600" size={16} />;
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
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Upload size={16} />
              <span className="hidden sm:inline">นำเข้าเทมเพลต</span>
            </button>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">สร้างเทมเพลตใหม่</span>
            </button>
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
                placeholder="ชื่อเทมเพลตหรือคำอธิบาย..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ประเภท</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
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

      {/* Templates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 mb-6">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {getCategoryIcon(template.category)}
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(template.status)}`}>
                  {template.status === 'active' && 'ใช้งานอยู่'}
                  {template.status === 'draft' && 'ร่าง'}
                  {template.status === 'archived' && 'เก็บในคลัง'}
                </span>
              </div>
              {template.isDefault && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                  ค่าเริ่มต้น
                </span>
              )}
            </div>

            <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description}</p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">เวอร์ชัน:</span>
                <span className="font-medium text-gray-900">{template.version}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">การใช้งาน:</span>
                <span className="font-medium text-gray-900">{template.usageCount} ครั้ง</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">แก้ไขล่าสุด:</span>
                <span className="font-medium text-gray-900">
                  {new Date(template.lastModified).toLocaleDateString('th-TH')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Eye size={16} />
                <span className="text-sm">ดู</span>
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                <Edit size={16} />
                <span className="text-sm">แก้ไข</span>
              </button>
              <button className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Copy size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Policy Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">การตั้งค่านโยบายการยินยอม</h3>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Settings size={16} />
            บันทึกการตั้งค่า
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">การหมดอายุเริ่มต้น</h4>
                <p className="text-sm text-gray-600">ระยะเวลาการยินยอมที่มีผลใช้ได้</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={consentPolicies.defaultExpirationDays}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                  readOnly
                />
                <span className="text-sm text-gray-600">วัน</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">การเข้าถึงฉุกเฉิน</h4>
                <p className="text-sm text-gray-600">อนุญาตให้เข้าถึงข้อมูลในกรณีฉุกเฉิน</p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={consentPolicies.allowEmergencyAccess}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  readOnly
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">ลายเซ็นผู้ป่วย</h4>
                <p className="text-sm text-gray-600">จำเป็นต้องมีลายเซ็นดิจิทัลของผู้ป่วย</p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={consentPolicies.requirePatientSignature}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  readOnly
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">การแจ้งเตือนอัตโนมัติ</h4>
                <p className="text-sm text-gray-600">ส่งการแจ้งเตือนก่อนการหมดอายุ</p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={consentPolicies.enableAutomaticReminder}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  readOnly
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">การแจ้งเตือนล่วงหน้า</h4>
                <p className="text-sm text-gray-600">จำนวนวันก่อนการหมดอายุ</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={consentPolicies.reminderDaysBefore}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                  readOnly
                />
                <span className="text-sm text-gray-600">วัน</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">การเก็บข้อมูลสูงสุด</h4>
                <p className="text-sm text-gray-600">ระยะเวลาสูงสุดในการเก็บข้อมูล</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={consentPolicies.maxDataRetentionDays}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                  readOnly
                />
                <span className="text-sm text-gray-600">วัน</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">บันทึกการตรวจสอบ</h4>
                <p className="text-sm text-gray-600">เก็บบันทึกการเข้าถึงทุกครั้ง</p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={consentPolicies.requireAuditLog}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  readOnly
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">การแจ้งเตือนแบบเรียลไทม์</h4>
                <p className="text-sm text-gray-600">ส่งการแจ้งเตือนทันทีเมื่อมีการเข้าถึง</p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={consentPolicies.enableRealTimeNotification}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Template Modal - Placeholder */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">สร้างเทมเพลตใหม่</h2>
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
                <p>ฟอร์มสร้างเทมเพลตจะถูกพัฒนาในเฟสถัดไป</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
