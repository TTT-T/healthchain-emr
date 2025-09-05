"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from '@/contexts/AuthContext';
import { PatientService } from '@/services/patientService';
import { LabService } from '@/services/labService';
import { VisitService } from '@/services/visitService';
import { MedicalLabOrder, CreateLabOrderRequest } from '@/types/api';
import { Search, FileText, Plus, Trash2, CheckCircle, AlertCircle, Clock, User } from 'lucide-react';

interface Patient {
  hn: string;
  nationalId: string;
  thaiName: string;
  gender: string;
  birthDate: string;
  queueNumber: string;
  treatmentType: string;
  assignedDoctor: string;
}

interface LabTest {
  id: string;
  testName: string;
  testCategory: string;
  priority: 'routine' | 'urgent' | 'stat';
  status: 'pending' | 'collected' | 'processing' | 'completed' | 'cancelled';
  orderedBy: string;
  orderedDate: string;
  notes?: string;
}

export default function LabResultPage() {
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"hn" | "queue">("queue");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [newTest, setNewTest] = useState<Partial<LabTest>>({
    testName: "",
    testCategory: "blood",
    priority: "routine",
    notes: ""
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError("กรุณากรอกข้อมูลที่ต้องการค้นหา");
      return;
    }

    setIsSearching(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log(`🔍 Searching for patient by ${searchType}:`, searchQuery);
      
      // ค้นหาผู้ป่วยจาก API
      const response = await PatientService.searchPatients(searchQuery, searchType);
      
      if (response.data && response.data.length > 0) {
        const patient = response.data[0];
        
        // Map ข้อมูลผู้ป่วยจาก API response
        const mappedPatient: Patient = {
          hn: patient.hn,
          nationalId: patient.national_id || '',
          thaiName: patient.thai_name || 'ไม่ระบุชื่อ',
          gender: patient.gender || 'ไม่ระบุ',
          birthDate: patient.birth_date || '',
          queueNumber: 'Q001', // Default queue number
          treatmentType: 'OPD - ตรวจรักษาทั่วไป', // Default treatment
          assignedDoctor: 'นพ.สมชาย วงศ์แพทย์' // Default doctor
        };

        setSelectedPatient(mappedPatient);
        setSuccess('พบข้อมูลผู้ป่วยแล้ว');
        console.log('✅ Patient found:', mappedPatient);
      } else {
        setSelectedPatient(null);
        setError("ไม่พบข้อมูลผู้ป่วยในระบบ กรุณาตรวจสอบข้อมูล");
      }
      
    } catch (error: any) {
      console.error('❌ Error searching patient:', error);
      setError(error.message || "เกิดข้อผิดพลาดในการค้นหา กรุณาลองอีกครั้ง");
      setSelectedPatient(null);
    } finally {
      setIsSearching(false);
    }
  };

  const addLabTest = () => {
    if (!newTest.testName) {
      setError("กรุณากรอกชื่อการตรวจ");
      return;
    }

    const test: LabTest = {
      id: Date.now().toString(),
      testName: newTest.testName!,
      testCategory: newTest.testCategory!,
      priority: newTest.priority!,
      status: 'pending',
      orderedBy: user?.thai_name || 'แพทย์',
      orderedDate: new Date().toISOString().slice(0, 16),
      notes: newTest.notes
    };

    setLabTests(prev => [...prev, test]);
    setNewTest({
      testName: "",
      testCategory: "blood",
      priority: "routine",
      notes: ""
    });
  };

  const removeLabTest = (id: string) => {
    setLabTests(prev => prev.filter(test => test.id !== id));
  };

  const handleSubmit = async () => {
    if (!selectedPatient || labTests.length === 0) {
      setError("กรุณาเลือกผู้ป่วยและเพิ่มการตรวจ");
      return;
    }

    setIsSubmitting(true);
    try {
      // สร้าง visit ก่อน (ถ้าไม่มี)
      const visitData = {
        patientId: selectedPatient.hn, // จะใช้ HN หา patient ID
        visitType: 'walk_in' as const,
        chiefComplaint: 'สั่งตรวจแล็บ',
        priority: 'normal' as const
      };
      
      // สร้าง visit
      const visitResponse = await VisitService.createVisit(visitData);
      
      if (!visitResponse.success || !visitResponse.data) {
        throw new Error('ไม่สามารถสร้าง visit ได้');
      }
      
      const visit = visitResponse.data;
      
      // สร้าง lab orders สำหรับแต่ละ test
      for (const test of labTests) {
        const labOrderData: CreateLabOrderRequest = {
          patientId: selectedPatient.hn,
          visitId: visit.id,
          testCategory: test.testCategory as 'blood' | 'urine' | 'stool' | 'imaging' | 'other',
          testName: test.testName,
          orderedBy: user?.id || 'doctor',
          priority: test.priority,
          notes: test.notes
        };

        const labResponse = await LabService.createLabOrder(labOrderData);
        
        if (!labResponse.success) {
          console.error(`Failed to create lab order for ${test.testName}:`, labResponse.errors);
        }
      }

      setSuccess("สั่งตรวจแล็บสำเร็จ");
      
      // Reset form
      setTimeout(() => {
        setSelectedPatient(null);
        setSearchQuery("");
        setLabTests([]);
        setSuccess(null);
      }, 3000);
      
    } catch (error: any) {
      console.error("Error creating lab orders:", error);
      setError(error.message || "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'routine': return 'text-green-600 bg-green-100';
      case 'urgent': return 'text-orange-600 bg-orange-100';
      case 'stat': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'collected': return 'text-blue-600 bg-blue-100';
      case 'processing': return 'text-orange-600 bg-orange-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">กรุณาเข้าสู่ระบบ</h1>
          <Link href="/login" className="text-blue-600 hover:text-blue-800">
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ระบบสั่งตรวจแล็บ</h1>
              <p className="text-gray-600 mt-1">สั่งตรวจแล็บและติดตามผล</p>
            </div>
            <div className="flex space-x-4">
              <Link href="/emr/dashboard" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                กลับสู่หน้าหลัก
              </Link>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            {success}
          </div>
        )}

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center mb-4">
            <Search className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">ค้นหาผู้ป่วย</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ประเภทการค้นหา</label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as "hn" | "queue")}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="queue">หมายเลขคิว</option>
                <option value="hn">HN</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {searchType === "hn" ? "หมายเลข HN" : "หมายเลขคิว"}
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={searchType === "hn" ? "ใส่หมายเลข HN" : "ใส่หมายเลขคิว"}
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  isSearching || !searchQuery.trim()
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isSearching ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    กำลังค้นหา...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Search className="h-4 w-4 mr-2" />
                    ค้นหา
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Patient Information */}
        {selectedPatient && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <User className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">ข้อมูลผู้ป่วย</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">คิว</label>
                  <p className="text-sm text-gray-900">{selectedPatient.queueNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">HN</label>
                  <p className="text-sm text-gray-900">{selectedPatient.hn}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">ชื่อ-นามสกุล</label>
                  <p className="text-sm text-gray-900">{selectedPatient.thaiName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">อายุ</label>
                  <p className="text-sm text-gray-900">{calculateAge(selectedPatient.birthDate)} ปี</p>
                </div>
              </div>
            </div>

            {/* Lab Orders Form */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <FileText className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">สั่งตรวจแล็บ</h3>
              </div>
              
              <div className="space-y-6">
                {/* Add New Test */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-900 mb-4">เพิ่มการตรวจใหม่</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อการตรวจ</label>
                      <input
                        type="text"
                        value={newTest.testName || ""}
                        onChange={(e) => setNewTest(prev => ({ ...prev, testName: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="เช่น CBC, FBS, UA"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ประเภท</label>
                      <select
                        value={newTest.testCategory || "blood"}
                        onChange={(e) => setNewTest(prev => ({ ...prev, testCategory: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="blood">ตรวจเลือด</option>
                        <option value="urine">ตรวจปัสสาวะ</option>
                        <option value="stool">ตรวจอุจจาระ</option>
                        <option value="imaging">ตรวจทางภาพ</option>
                        <option value="other">อื่นๆ</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ความสำคัญ</label>
                      <select
                        value={newTest.priority || "routine"}
                        onChange={(e) => setNewTest(prev => ({ ...prev, priority: e.target.value as any }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="routine">ปกติ</option>
                        <option value="urgent">เร่งด่วน</option>
                        <option value="stat">ฉุกเฉิน</option>
                      </select>
                    </div>
                    
                    <div className="flex items-end">
                      <button
                        onClick={addLabTest}
                        className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">หมายเหตุ</label>
                    <input
                      type="text"
                      value={newTest.notes || ""}
                      onChange={(e) => setNewTest(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="หมายเหตุเพิ่มเติม"
                    />
                  </div>
                </div>

                {/* Lab Tests List */}
                {labTests.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">รายการตรวจที่สั่ง</h4>
                    <div className="space-y-2">
                      {labTests.map((test) => (
                        <div key={test.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="grid grid-cols-4 gap-4 flex-1">
                            <span className="text-sm font-medium">{test.testName}</span>
                            <span className="text-sm">{test.testCategory}</span>
                            <span className={`text-sm px-2 py-1 rounded ${getPriorityColor(test.priority)}`}>
                              {test.priority}
                            </span>
                            <span className={`text-sm px-2 py-1 rounded ${getStatusColor(test.status)}`}>
                              {test.status}
                            </span>
                          </div>
                          <button
                            onClick={() => removeLabTest(test.id)}
                            className="ml-4 text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setSelectedPatient(null);
                  setSearchQuery("");
                  setLabTests([]);
                }}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || labTests.length === 0}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  isSubmitting || labTests.length === 0
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    กำลังบันทึก...
                  </div>
                ) : (
                  'สั่งตรวจแล็บ'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
