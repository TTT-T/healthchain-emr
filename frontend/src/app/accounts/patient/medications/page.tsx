'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
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
  name: string;
  genericName: string;
  dosage: string;
  frequency: string;
  route: string;
  instructions: string;
  startDate: string;
  endDate?: string;
  prescribedBy: string;
  indication: string;
  category: string;
  isControlled: boolean;
  isActive: boolean;
  remainingDays?: number;
  sideEffects?: string[];
  warnings?: string[];
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
          if (response.success && response.data) {
            setMedications(response.data);
          } else {
            setError(response.error?.message || "ไม่สามารถดึงข้อมูลยาได้");
          }
        }
      } catch (err) {
        console.error('Error fetching medications:', err);
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูลยา');
      } finally {
        setLoading(false);
      }
    };

    fetchMedications();
  }, [user]);

  const filteredMedications = medications.filter(medication =>
    medication.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medication.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medication.indication.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medication.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeMedications = filteredMedications.filter(med => med.isActive);
  const expiringSoon = activeMedications.filter(med => med.remainingDays && med.remainingDays <= 7);
  const controlledMedications = activeMedications.filter(med => med.isControlled);

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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ยาและการรักษา</h1>
            <p className="text-gray-800 mt-1">
              จัดการและติดตามยาที่ได้รับการสั่งจ่าย
            </p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Pill className="h-4 w-4 mr-2" />
            เพิ่มยา
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Pill className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-800">ยาทั้งหมด</p>
                  <p className="text-2xl font-bold">{activeMedications.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-800">ใกล้หมด</p>
                  <p className="text-2xl font-bold">{expiringSoon.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-800">ยาควบคุม</p>
                  <p className="text-2xl font-bold">{controlledMedications.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-800">ยาปกติ</p>
                  <p className="text-2xl font-bold">{activeMedications.filter(med => !med.isControlled).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ค้นหายา, ชื่อสามัญ, หรือการใช้งาน..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Medications List */}
        <div className="grid gap-4">
          {filteredMedications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-700">
                  {searchTerm ? 'ไม่มียาที่ตรงกับเงื่อนไขการค้นหา' : 'ยังไม่มียาที่ได้รับการสั่งจ่าย'}
                </p>
                {!searchTerm && (
                  <p className="text-gray-500 text-sm mt-2">
                    ข้อมูลยาจะแสดงที่นี่เมื่อแพทย์สั่งจ่ายยาให้คุณ
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredMedications.map((medication) => (
              <Card key={medication.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {medication.name}
                        </h3>
                        <div className="flex gap-2">
                          {medication.isControlled && (
                            <Badge className="bg-red-100 text-red-800">
                              <Shield className="h-3 w-3 mr-1" />
                              ยาควบคุม
                            </Badge>
                          )}
                          {medication.remainingDays && medication.remainingDays <= 7 && (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              ใกล้หมด
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <p><span className="font-medium">ชื่อสามัญ:</span> {medication.genericName}</p>
                          <p><span className="font-medium">ความเข้มข้น:</span> {medication.dosage}</p>
                          <p><span className="font-medium">ความถี่:</span> {medication.frequency}</p>
                          <p><span className="font-medium">วิธีใช้:</span> {medication.route}</p>
                        </div>
                        <div className="space-y-1">
                          <p><span className="font-medium">สำหรับ:</span> {medication.indication}</p>
                          <p><span className="font-medium">แพทย์:</span> {medication.prescribedBy}</p>
                          <p><span className="font-medium">ประเภท:</span> {medication.category}</p>
                          {medication.remainingDays && (
                            <p><span className="font-medium">เหลือ:</span> {medication.remainingDays} วัน</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm">
                          <span className="font-medium">วิธีการใช้:</span> {medication.instructions}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => showMedicationDetails(medication)}
                      >
                        <Info className="h-4 w-4 mr-1" />
                        รายละเอียด
                      </Button>
                      <Button size="sm" variant="outline">
                        <Calendar className="h-4 w-4 mr-1" />
                        แจ้งเตือน
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

      {/* Medication Details Modal */}
      {showModal && selectedMedication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{selectedMedication.name}</h2>
              <Button variant="outline" size="sm" onClick={() => setShowModal(false)}>
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">ชื่อสามัญ:</p>
                  <p className="text-gray-800">{selectedMedication.genericName}</p>
                </div>
                <div>
                  <p className="font-medium">ความเข้มข้น:</p>
                  <p className="text-gray-800">{selectedMedication.dosage}</p>
                </div>
                <div>
                  <p className="font-medium">ความถี่:</p>
                  <p className="text-gray-800">{selectedMedication.frequency}</p>
                </div>
                <div>
                  <p className="font-medium">วิธีใช้:</p>
                  <p className="text-gray-800">{selectedMedication.route}</p>
                </div>
              </div>
              
              <div>
                <p className="font-medium">วิธีการใช้:</p>
                <p className="text-gray-800">{selectedMedication.instructions}</p>
              </div>
              
              {selectedMedication.sideEffects && selectedMedication.sideEffects.length > 0 && (
                <div>
                  <p className="font-medium text-yellow-600">ผลข้างเคียง:</p>
                  <ul className="list-disc pl-5 text-gray-800">
                    {selectedMedication.sideEffects.map((effect, index) => (
                      <li key={index}>{effect}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {selectedMedication.warnings && selectedMedication.warnings.length > 0 && (
                <div>
                  <p className="font-medium text-red-600">คำเตือน:</p>
                  <ul className="list-disc pl-5 text-gray-800">
                    {selectedMedication.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </AppLayout>
  );
};

export default PatientMedications;
