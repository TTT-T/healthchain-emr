"use client";
import { useState } from "react";
import { Search, Pill, Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PatientService } from '@/services/patientService';
import { PharmacyService } from '@/services/pharmacyService';
import { NotificationService } from '@/services/notificationService';
import { PatientDocumentService } from '@/services/patientDocumentService';
import { MedicalPatient } from '@/types/api';
import { logger } from '@/lib/logger';

export default function Pharmacy() {
  const { isAuthenticated, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"hn" | "queue">("queue");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<MedicalPatient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [pharmacyData, setPharmacyData] = useState({
    medications: [],
    totalAmount: 0,
    paymentMethod: 'cash',
    notes: '',
    dispensedTime: new Date().toISOString().slice(0, 16)
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setError(null);
    
    try {
      const response = await PatientService.searchPatients(searchQuery, searchType);
      
      if (response.statusCode === 200 && response.data && response.data.length > 0) {
        setSelectedPatient(response.data[0]);
        setError(null);
      } else {
        setError("ไม่พบข้อมูลผู้ป่วย");
        setSelectedPatient(null);
      }
    } catch (error) {
      logger.error("Error searching patient:", error);
      setError("เกิดข้อผิดพลาดในการค้นหาผู้ป่วย");
      setSelectedPatient(null);
    } finally {
      setIsSearching(false);
    }
  };

  const addMedication = () => {
    const newMedication = {
      medicationName: '',
      dosage: '',
      frequency: '',
      duration: '',
      quantity: 1,
      unit: 'tablet',
      instructions: '',
      dispensedQuantity: 1,
      price: 0
    };
    
    setPharmacyData(prev => ({
      ...prev,
      medications: [...prev.medications, newMedication]
    }));
  };

  const removeMedication = (index: number) => {
    setPharmacyData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index),
      totalAmount: PharmacyService.calculateTotalAmount(prev.medications.filter((_, i) => i !== index))
    }));
  };

  const updateMedication = (index: number, field: string, value: any) => {
    setPharmacyData(prev => {
      const updatedMedications = [...prev.medications];
      updatedMedications[index] = { ...updatedMedications[index], [field]: value };
      
      return {
        ...prev,
        medications: updatedMedications,
        totalAmount: PharmacyService.calculateTotalAmount(updatedMedications)
      };
    });
  };

  const handleSubmit = async () => {
    if (!selectedPatient) return;
    
    // Validate data
    const validation = PharmacyService.validatePharmacyData({
      ...pharmacyData,
      dispensedBy: user?.thaiName || `${user?.firstName} ${user?.lastName}` || 'เภสัชกร'
    });
    
    if (!validation.isValid) {
      setError(validation.errors.join('\n'));
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const formattedData = PharmacyService.formatPharmacyDataForAPI(
        pharmacyData,
        selectedPatient.id,
        user?.thaiName || `${user?.firstName} ${user?.lastName}` || 'เภสัชกร'
      );
      
      const response = await PharmacyService.createPharmacyDispensing(formattedData);
      
      if (response.statusCode === 201 && response.data) {
        await sendPatientNotification(selectedPatient, response.data);
        
        // Create document for patient
        await createPatientDocument(selectedPatient, response.data);
        
        setSuccess("บันทึกการจ่ายยาสำเร็จ!\n\n✅ ระบบได้ส่งการแจ้งเตือนและเอกสารให้ผู้ป่วยแล้ว");
        
        // Reset form
        setTimeout(() => {
          setSelectedPatient(null);
          setSearchQuery("");
          setPharmacyData(PharmacyService.createEmptyPharmacyData());
          setSuccess(null);
        }, 3000);
      } else {
        setError("เกิดข้อผิดพลาดในการบันทึกการจ่ายยา");
      }
    } catch (error) {
      logger.error("Error saving pharmacy dispensing:", error);
      setError("เกิดข้อผิดพลาดในการบันทึกการจ่ายยา");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendPatientNotification = async (patient: MedicalPatient, dispensingRecord: any) => {
    try {
      const notificationData = {
        patientHn: patient.hn || patient.hospital_number || '',
        patientNationalId: patient.national_id || '',
        patientName: patient.thai_name || `${patient.firstName} ${patient.lastName}`,
        patientPhone: patient.phone || '',
        patientEmail: patient.email || '',
        recordType: 'pharmacy_dispensing',
        recordId: dispensingRecord.id,
        chiefComplaint: `จ่ายยา ${dispensingRecord.medications.length} รายการ`,
        recordedBy: dispensingRecord.dispensedBy,
        recordedTime: dispensingRecord.dispensedTime,
        message: `มีการจ่ายยาใหม่สำหรับคุณ ${patient.thai_name || `${patient.firstName} ${patient.lastName}`} โดย ${dispensingRecord.dispensedBy}`
      };

      await NotificationService.notifyPatientRecordUpdate(notificationData);
      logger.info('Patient notification sent for pharmacy dispensing', {
        patientHn: notificationData.patientHn,
        recordId: dispensingRecord.id
      });
    } catch (error) {
      logger.error('Failed to send patient notification for pharmacy dispensing:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">กรุณาเข้าสู่ระบบ</h2>
          <p className="text-gray-600">คุณต้องเข้าสู่ระบบเพื่อใช้งานระบบจ่ายยา</p>
        </div>
      </div>
    );
  }

  /**
   * สร้างเอกสารให้ผู้ป่วย
   */
  const createPatientDocument = async (patient: MedicalPatient, pharmacyData: any) => {
    try {
      await PatientDocumentService.createDocumentFromMedicalRecord(
        'prescription',
        pharmacyData,
        {
          patientHn: patient.hn || '',
          patientNationalId: patient.national_id || '',
          patientName: patient.thai_name || ''
        },
        user?.id || '',
        user?.thaiName || `${user?.firstName} ${user?.lastName}` || 'เภสัชกร'
      );
      
      logger.info('Patient document created successfully for pharmacy', { 
        patientHn: patient.hn,
        recordType: 'prescription'
      });
    } catch (error) {
      logger.error('Error creating patient document for pharmacy:', error);
      // ไม่ throw error เพื่อไม่ให้กระทบการบันทึกการจ่ายยา
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Pill className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">จ่ายยา</h1>
              <p className="text-gray-600">บันทึกการจ่ายยาและจัดการรายการยา</p>
            </div>
          </div>

          {/* Search Patient */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ค้นหาผู้ป่วย</h3>
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="กรอก HN หรือหมายเลขคิว"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                {isSearching ? "กำลังค้นหา..." : "ค้นหา"}
              </button>
            </div>
          </div>

          {/* Patient Info */}
          {selectedPatient && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-green-800 mb-2">ข้อมูลผู้ป่วย</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">HN:</span> {selectedPatient.hn || selectedPatient.hospital_number}
                </div>
                <div>
                  <span className="font-medium">ชื่อ:</span> {selectedPatient.thai_name || `${selectedPatient.firstName} ${selectedPatient.lastName}`}
                </div>
                <div>
                  <span className="font-medium">อายุ:</span> {selectedPatient.age || 'ไม่ระบุ'}
                </div>
                <div>
                  <span className="font-medium">เพศ:</span> {selectedPatient.gender || 'ไม่ระบุ'}
                </div>
              </div>
            </div>
          )}

          {/* Medications */}
          {selectedPatient && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">รายการยา</h3>
                <button
                  onClick={addMedication}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  เพิ่มยา
                </button>
              </div>

              {pharmacyData.medications.map((medication, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900">ยา {index + 1}</h4>
                    <button
                      onClick={() => removeMedication(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อยา *</label>
                      <input
                        type="text"
                        value={medication.medicationName}
                        onChange={(e) => updateMedication(index, 'medicationName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="กรอกชื่อยา"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ขนาดยา *</label>
                      <input
                        type="text"
                        value={medication.dosage}
                        onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="เช่น 500mg"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ความถี่ *</label>
                      <input
                        type="text"
                        value={medication.frequency}
                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="เช่น วันละ 3 ครั้ง"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ระยะเวลา *</label>
                      <input
                        type="text"
                        value={medication.duration}
                        onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="เช่น 7 วัน"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">จำนวน *</label>
                      <input
                        type="number"
                        value={medication.quantity}
                        onChange={(e) => updateMedication(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        min="1"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">หน่วย</label>
                      <select
                        value={medication.unit}
                        onChange={(e) => updateMedication(index, 'unit', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="tablet">เม็ด</option>
                        <option value="capsule">แคปซูล</option>
                        <option value="ml">มิลลิลิตร</option>
                        <option value="mg">มิลลิกรัม</option>
                        <option value="g">กรัม</option>
                        <option value="piece">ชิ้น</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">วิธีใช้</label>
                    <textarea
                      value={medication.instructions}
                      onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      rows={2}
                      placeholder="กรอกวิธีใช้ยา"
                    />
                  </div>
                </div>
              ))}

              {/* Payment Info */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">ข้อมูลการชำระเงิน</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ยอดรวม</label>
                    <input
                      type="number"
                      value={pharmacyData.totalAmount}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">วิธีการชำระเงิน</label>
                    <select
                      value={pharmacyData.paymentMethod}
                      onChange={(e) => setPharmacyData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="cash">เงินสด</option>
                      <option value="card">บัตรเครดิต</option>
                      <option value="insurance">ประกันสุขภาพ</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">หมายเหตุ</label>
                <textarea
                  value={pharmacyData.notes}
                  onChange={(e) => setPharmacyData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                  placeholder="กรอกหมายเหตุเพิ่มเติม"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || pharmacyData.medications.length === 0}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <CheckCircle className="h-5 w-5" />
                  {isSubmitting ? "กำลังบันทึก..." : "บันทึกการจ่ายยา"}
                </button>
              </div>
            </div>
          )}

          {/* Success/Error Messages */}
          {success && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="text-green-800 whitespace-pre-line">{success}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-800 whitespace-pre-line">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}