"use client";
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Search, Filter, RefreshCw } from 'lucide-react';
import { DoctorService, Doctor, CreateDoctorRequest } from '@/services/doctorService';
import { logger } from '@/lib/logger';

export default function DoctorsManagement() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  // Form data for create/edit
  const [formData, setFormData] = useState<CreateDoctorRequest>({
    userId: '',
    medicalLicenseNumber: '',
    specialization: '',
    department: '',
    position: '',
    yearsOfExperience: 0,
    consultationFee: 0,
    availability: null
  });

  // Load doctors on component mount
  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      setError(null);
      
      logger.('🔄 Loading doctors...');
      const response = await DoctorService.getDoctors({
        limit: 100 // Load all doctors
      });
      
      if (response.statusCode === 200 && response.data) {
        setDoctors(response.data as Doctor[]);
        logger.('✅ Doctors loaded successfully:', response.data);
      } else {
        throw new Error('Failed to load doctors');
      }
    } catch (error) {
      logger.error('❌ Error loading doctors:', error);
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูลแพทย์');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDoctor = async () => {
    try {
      setLoading(true);
      
      logger.('🔄 Creating doctor:', formData);
      const response = await DoctorService.createDoctor(formData);
      
      if (response.statusCode === 201) {
        logger.('✅ Doctor created successfully');
        setShowCreateModal(false);
        resetForm();
        await loadDoctors(); // Reload the list
      } else {
        throw new Error('Failed to create doctor');
      }
    } catch (error) {
      logger.error('❌ Error creating doctor:', error);
      setError('เกิดข้อผิดพลาดในการสร้างแพทย์');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDoctor = async () => {
    if (!selectedDoctor) return;
    
    try {
      setLoading(true);
      
      logger.('🔄 Updating doctor:', selectedDoctor.id, formData);
      const response = await DoctorService.updateDoctor(selectedDoctor.id, formData);
      
      if (response.statusCode === 200) {
        logger.('✅ Doctor updated successfully');
        setShowEditModal(false);
        setSelectedDoctor(null);
        resetForm();
        await loadDoctors(); // Reload the list
      } else {
        throw new Error('Failed to update doctor');
      }
    } catch (error) {
      logger.error('❌ Error updating doctor:', error);
      setError('เกิดข้อผิดพลาดในการอัปเดตแพทย์');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDoctor = async (doctor: Doctor) => {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบแพทย์ ${doctor.name}?`)) {
      return;
    }
    
    try {
      setLoading(true);
      
      logger.('🔄 Deleting doctor:', doctor.id);
      const response = await DoctorService.deleteDoctor(doctor.id);
      
      if (response.statusCode === 200) {
        logger.('✅ Doctor deleted successfully');
        await loadDoctors(); // Reload the list
      } else {
        throw new Error('Failed to delete doctor');
      }
    } catch (error) {
      logger.error('❌ Error deleting doctor:', error);
      setError('เกิดข้อผิดพลาดในการลบแพทย์');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (doctor: Doctor) => {
    try {
      setLoading(true);
      
      logger.('🔄 Toggling availability for doctor:', doctor.id);
      const response = await DoctorService.updateAvailability(doctor.id, !doctor.isAvailable);
      
      if (response.statusCode === 200) {
        logger.('✅ Doctor availability updated successfully');
        await loadDoctors(); // Reload the list
      } else {
        throw new Error('Failed to update availability');
      }
    } catch (error) {
      logger.error('❌ Error updating availability:', error);
      setError('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      medicalLicenseNumber: '',
      specialization: '',
      department: '',
      position: '',
      yearsOfExperience: 0,
      consultationFee: 0,
      availability: null
    });
  };

  const openEditModal = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setFormData({
      userId: doctor.id, // This should be the user ID, not doctor ID
      medicalLicenseNumber: doctor.medicalLicenseNumber || '',
      specialization: doctor.specialization,
      department: doctor.department,
      position: doctor.position || '',
      yearsOfExperience: doctor.yearsOfExperience || 0,
      consultationFee: doctor.consultationFee || 0,
      availability: doctor.availability
    });
    setShowEditModal(true);
  };

  // Filter doctors based on search and department
  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.medicalLicenseNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !departmentFilter || doctor.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  // Get unique departments for filter
  const departments = [...new Set(doctors.map(doctor => doctor.department))];

  if (loading && doctors.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">กำลังโหลดข้อมูลแพทย์...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">จัดการแพทย์</h1>
          <p className="text-gray-600">จัดการข้อมูลแพทย์ในระบบ EMR</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="h-5 w-5 text-red-400">⚠️</div>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหาแพทย์ (ชื่อ, ความเชี่ยวชาญ, ใบอนุญาต)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Department Filter */}
            <div className="lg:w-64">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">ทุกแผนก</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={loadDoctors}
                disabled={loading}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                รีเฟรช
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                เพิ่มแพทย์
              </button>
            </div>
          </div>
        </div>

        {/* Doctors Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    แพทย์
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    แผนก/ความเชี่ยวชาญ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ตำแหน่ง/ประสบการณ์
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    คิว/สถานะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ค่าตรวจ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การจัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDoctors.map((doctor) => (
                  <tr key={doctor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{doctor.name}</div>
                        <div className="text-sm text-gray-500">{doctor.medicalLicenseNumber}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{doctor.department}</div>
                        <div className="text-sm text-gray-500">{doctor.specialization}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{doctor.position}</div>
                        <div className="text-sm text-gray-500">{doctor.yearsOfExperience} ปี</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          doctor.isAvailable 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {doctor.isAvailable ? 'พร้อมตรวจ' : 'ไม่พร้อม'}
                        </span>
                        <div className="text-sm text-gray-500">
                          คิว: {doctor.currentQueue} | รอ: {doctor.estimatedWaitTime}นาที
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ฿{doctor.consultationFee?.toLocaleString() || 'ไม่ระบุ'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleAvailability(doctor)}
                          className={`px-3 py-1 text-xs rounded-full ${
                            doctor.isAvailable
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {doctor.isAvailable ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                        </button>
                        <button
                          onClick={() => openEditModal(doctor)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDoctor(doctor)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredDoctors.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Filter className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบแพทย์</h3>
              <p className="text-gray-500">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
            </div>
          )}
        </div>

        {/* Create Doctor Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">เพิ่มแพทย์ใหม่</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      User ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.userId}
                      onChange={(e) => setFormData({...formData, userId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="ID ของผู้ใช้ในระบบ"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      หมายเลขใบอนุญาต <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.medicalLicenseNumber}
                      onChange={(e) => setFormData({...formData, medicalLicenseNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="เช่น MD001"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        แผนก <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.department}
                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">เลือกแผนก</option>
                        <option value="อายุรกรรม">อายุรกรรม</option>
                        <option value="กุมารเวชกรรม">กุมารเวชกรรม</option>
                        <option value="ศัลยกรรม">ศัลยกรรม</option>
                        <option value="สูติ-นรีเวช">สูติ-นรีเวช</option>
                        <option value="จักษุวิทยา">จักษุวิทยา</option>
                        <option value="หูคอจมูก">หูคอจมูก</option>
                        <option value="ผิวหนัง">ผิวหนัง</option>
                        <option value="จิตเวช">จิตเวช</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ความเชี่ยวชาญ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.specialization}
                        onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="เช่น โรคหัวใจ"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ตำแหน่ง
                      </label>
                      <input
                        type="text"
                        value={formData.position}
                        onChange={(e) => setFormData({...formData, position: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="เช่น แพทย์ผู้เชี่ยวชาญ"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ประสบการณ์ (ปี)
                      </label>
                      <input
                        type="number"
                        value={formData.yearsOfExperience}
                        onChange={(e) => setFormData({...formData, yearsOfExperience: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ค่าตรวจ (บาท)
                    </label>
                    <input
                      type="number"
                      value={formData.consultationFee}
                      onChange={(e) => setFormData({...formData, consultationFee: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleCreateDoctor}
                    disabled={loading || !formData.userId || !formData.medicalLicenseNumber || !formData.department || !formData.specialization}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'กำลังสร้าง...' : 'สร้างแพทย์'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Doctor Modal */}
        {showEditModal && selectedDoctor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">แก้ไขข้อมูลแพทย์</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      หมายเลขใบอนุญาต <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.medicalLicenseNumber}
                      onChange={(e) => setFormData({...formData, medicalLicenseNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        แผนก <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.department}
                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">เลือกแผนก</option>
                        <option value="อายุรกรรม">อายุรกรรม</option>
                        <option value="กุมารเวชกรรม">กุมารเวชกรรม</option>
                        <option value="ศัลยกรรม">ศัลยกรรม</option>
                        <option value="สูติ-นรีเวช">สูติ-นรีเวช</option>
                        <option value="จักษุวิทยา">จักษุวิทยา</option>
                        <option value="หูคอจมูก">หูคอจมูก</option>
                        <option value="ผิวหนัง">ผิวหนัง</option>
                        <option value="จิตเวช">จิตเวช</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ความเชี่ยวชาญ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.specialization}
                        onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ตำแหน่ง
                      </label>
                      <input
                        type="text"
                        value={formData.position}
                        onChange={(e) => setFormData({...formData, position: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ประสบการณ์ (ปี)
                      </label>
                      <input
                        type="number"
                        value={formData.yearsOfExperience}
                        onChange={(e) => setFormData({...formData, yearsOfExperience: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ค่าตรวจ (บาท)
                    </label>
                    <input
                      type="number"
                      value={formData.consultationFee}
                      onChange={(e) => setFormData({...formData, consultationFee: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedDoctor(null);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleUpdateDoctor}
                    disabled={loading || !formData.medicalLicenseNumber || !formData.department || !formData.specialization}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'กำลังอัปเดต...' : 'อัปเดตข้อมูล'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
