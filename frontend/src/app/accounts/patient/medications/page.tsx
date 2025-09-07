'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import { logger } from '@/lib/logger';
import { 
  Pill, 
  AlertTriangle,
  Search,
  AlertCircle,
  Info,
  Calendar,
  Shield,
  Activity
} from 'lucide-react';

interface Medication {
  id: string;
  medication_name: string;
  strength: string;
  dosage_form: string;
  quantity_prescribed: number;
  unit: string;
  dosage_instructions: string;
  duration_days: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  prescription: {
    id: string;
    number: string;
    date: string;
    status: string;
    general_instructions?: string;
    prescribed_by: {
      name: string;
    };
  };
  visit: {
    number?: string;
    date?: string;
    diagnosis?: string;
  };
}

const PatientMedications = () => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
  const fetchMedications = async () => {
    try {
      if (user?.id) {
        const response = await apiClient.getPatientMedications(user.id);
        if (response.statusCode === 200 && response.data) {
          // ตรวจสอบว่าข้อมูลเป็น array หรือไม่
          const medicationsData = response.data;
          if (Array.isArray(medicationsData)) {
            setMedications(medicationsData as Medication[]);
          } else if (medicationsData && typeof medicationsData === 'object' && Array.isArray((medicationsData as any).medications)) {
            // กรณีที่ข้อมูลอยู่ใน medications property (ตามโครงสร้าง backend)
            setMedications((medicationsData as any).medications as Medication[]);
          } else {
            // ถ้าไม่มีข้อมูลหรือไม่ใช่ array ให้ตั้งเป็น array ว่าง
            setMedications([]);
            logger.warn('Medications data is not an array:', medicationsData);
          }
        } else {
          setMedications([]);
          setError(response.error?.message || "ไม่สามารถดึงข้อมูลยาได้");
        }
      }
    } catch (err) {
      logger.error('Error fetching medications:', err);
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูลยา');
    } finally {
      setLoading(false);
    }
  };

    fetchMedications();
  }, [user]);

  const filteredMedications = Array.isArray(medications) ? medications.filter(medication =>
    medication.medication_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medication.dosage_form?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medication.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medication.visit?.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const activeMedications = filteredMedications.filter(med => med.status === 'prescribed' || med.status === 'active');
  const expiringSoon = activeMedications.filter(med => med.duration_days && med.duration_days <= 7);
  const controlledMedications = activeMedications.filter(med => med.notes?.toLowerCase().includes('ควบคุม') || med.medication_name?.toLowerCase().includes('morphine') || med.medication_name?.toLowerCase().includes('tramadol'));

  const showMedicationDetails = (medication: Medication) => {
    setSelectedMedication(medication);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-800">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            ลองใหม่อีกครั้ง
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AppLayout title="ยาและการรักษา" userType="patient">
        <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">ยาและการรักษา</h1>
              <p className="text-gray-600 mt-1">
                จัดการและติดตามยาที่ได้รับการสั่งจ่าย
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              <Pill className="h-4 w-4" />
              เพิ่มยา
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center">
              <Pill className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">ยาทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">{activeMedications.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">ใกล้หมด</p>
                <p className="text-2xl font-bold text-gray-900">{expiringSoon.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">ยาควบคุม</p>
                <p className="text-2xl font-bold text-gray-900">{controlledMedications.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">ยาปกติ</p>
                <p className="text-2xl font-bold text-gray-900">{activeMedications.filter(med => !controlledMedications.some(cm => cm.id === med.id)).length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหายา, รูปแบบ, หมายเหตุ, หรือการวินิจฉัย..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Medications List */}
        <div className="grid gap-4">
          {filteredMedications.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm text-center">
              <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-700">
                {searchTerm ? 'ไม่มียาที่ตรงกับเงื่อนไขการค้นหา' : 'ยังไม่มียาที่ได้รับการสั่งจ่าย'}
              </p>
              {!searchTerm && (
                <p className="text-gray-500 text-sm mt-2">
                  ข้อมูลยาจะแสดงที่นี่เมื่อแพทย์สั่งจ่ายยาให้คุณ
                </p>
              )}
            </div>
          ) : (
            filteredMedications.map((medication) => (
              <div key={medication.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {medication.medication_name}
                      </h3>
                      <div className="flex gap-2">
                        {controlledMedications.some(m => m.id === medication.id) && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                            <Shield className="h-3 w-3" />
                            ยาควบคุม
                          </span>
                        )}
                        {medication.duration_days && medication.duration_days <= 7 && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                            <AlertTriangle className="h-3 w-3" />
                            ใกล้หมด
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <p><span className="font-medium text-gray-700">ความเข้มข้น:</span> <span className="text-gray-900">{medication.strength}</span></p>
                        <p><span className="font-medium text-gray-700">รูปแบบ:</span> <span className="text-gray-900">{medication.dosage_form}</span></p>
                        <p><span className="font-medium text-gray-700">จำนวน:</span> <span className="text-gray-900">{medication.quantity_prescribed} {medication.unit}</span></p>
                        <p><span className="font-medium text-gray-700">ระยะเวลา:</span> <span className="text-gray-900">{medication.duration_days} วัน</span></p>
                      </div>
                      <div className="space-y-1">
                        <p><span className="font-medium text-gray-700">สถานะ:</span> <span className="text-gray-900">{medication.status}</span></p>
                        <p><span className="font-medium text-gray-700">แพทย์:</span> <span className="text-gray-900">{medication.prescription.prescribed_by.name}</span></p>
                        <p><span className="font-medium text-gray-700">วันที่สั่งจ่าย:</span> <span className="text-gray-900">{new Date(medication.prescription.date).toLocaleDateString('th-TH')}</span></p>
                        {medication.visit.diagnosis && (
                          <p><span className="font-medium text-gray-700">การวินิจฉัย:</span> <span className="text-gray-900">{medication.visit.diagnosis}</span></p>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm">
                        <span className="font-medium text-gray-700">วิธีการใช้:</span> <span className="text-gray-900">{medication.dosage_instructions}</span>
                      </p>
                      {medication.notes && (
                        <p className="text-sm mt-2">
                          <span className="font-medium text-gray-700">หมายเหตุ:</span> <span className="text-gray-900">{medication.notes}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => showMedicationDetails(medication)}
                      className="flex items-center gap-1 px-3 py-1 text-sm border border-slate-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Info className="h-4 w-4" />
                      รายละเอียด
                    </button>
                    <button className="flex items-center gap-1 px-3 py-1 text-sm border border-slate-300 rounded-lg hover:bg-gray-50 transition-colors">
                      <Calendar className="h-4 w-4" />
                      แจ้งเตือน
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Medication Details Modal */}
        {showModal && selectedMedication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">{selectedMedication.medication_name}</h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-gray-700">ความเข้มข้น:</p>
                    <p className="text-gray-900">{selectedMedication.strength}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">รูปแบบ:</p>
                    <p className="text-gray-900">{selectedMedication.dosage_form}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">จำนวน:</p>
                    <p className="text-gray-900">{selectedMedication.quantity_prescribed} {selectedMedication.unit}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">ระยะเวลา:</p>
                    <p className="text-gray-900">{selectedMedication.duration_days} วัน</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">สถานะ:</p>
                    <p className="text-gray-900">{selectedMedication.status}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">แพทย์:</p>
                    <p className="text-gray-900">{selectedMedication.prescription.prescribed_by.name}</p>
                  </div>
                </div>
                
                <div>
                  <p className="font-medium text-gray-700">วิธีการใช้:</p>
                  <p className="text-gray-900">{selectedMedication.dosage_instructions}</p>
                </div>
                
                {selectedMedication.prescription.general_instructions && (
                  <div>
                    <p className="font-medium text-gray-700">คำแนะนำทั่วไป:</p>
                    <p className="text-gray-900">{selectedMedication.prescription.general_instructions}</p>
                  </div>
                )}
                
                {selectedMedication.notes && (
                  <div>
                    <p className="font-medium text-gray-700">หมายเหตุ:</p>
                    <p className="text-gray-900">{selectedMedication.notes}</p>
                  </div>
                )}
                
                {selectedMedication.visit.diagnosis && (
                  <div>
                    <p className="font-medium text-gray-700">การวินิจฉัย:</p>
                    <p className="text-gray-900">{selectedMedication.visit.diagnosis}</p>
                  </div>
                )}
                
                <div className="text-sm text-gray-500 pt-4 border-t border-gray-200">
                  <p>วันที่สั่งจ่าย: {new Date(selectedMedication.prescription.date).toLocaleDateString('th-TH')}</p>
                  <p>เลขที่ใบสั่งยา: {selectedMedication.prescription.number}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </AppLayout>
  );
};

export default PatientMedications;
