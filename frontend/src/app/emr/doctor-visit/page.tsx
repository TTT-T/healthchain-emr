"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from '@/contexts/AuthContext';
import { PatientService } from '@/services/patientService';
import { VisitService } from '@/services/visitService';
import { PharmacyService } from '@/services/pharmacyService';
import { LabService } from '@/services/labService';
import { MedicalPatient, CreatePrescriptionRequest, CreateLabOrderRequest } from '@/types/api';
import { CheckCircle, AlertCircle, Search, User, FileText, Plus, Trash2 } from 'lucide-react';
import { logger } from '@/lib/logger';

interface DrugOrder {
  name: string;
  dose: string;
  quantity: string;
  usage: string;
}

interface LabOrder {
  cbc: boolean;
  fbs: boolean;
}

interface DoctorVisitForm {
  physicalExam: string;
  diagnosis: string;
  advice: string;
  drugs: DrugOrder[];
  labs: LabOrder;
}

export default function DoctorVisit() {
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"hn" | "queue">("queue");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<MedicalPatient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<DoctorVisitForm>({
    physicalExam: "",
    diagnosis: "",
    advice: "",
    drugs: [],
    labs: { cbc: false, fbs: false }
  });
  const [errors, setErrors] = useState<any>({});
  const [newDrug, setNewDrug] = useState<DrugOrder>({ name: "", dose: "", quantity: "", usage: "" });

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError("กรุณากรอกข้อมูลที่ต้องการค้นหา");
      return;
    }

    setIsSearching(true);
    setError(null);
    setSelectedPatient(null);
    
    try {
      const response = await PatientService.searchPatients(searchQuery, searchType);
      
      if (response.statusCode === 200 && response.data && response.data.length > 0) {
        const exactMatch = response.data.find(p => 
          searchType === "hn" ? p.hn === searchQuery : p.hn === searchQuery
        );
        
        if (exactMatch) {
          setSelectedPatient(exactMatch);
          setSuccess("พบข้อมูลผู้ป่วยแล้ว");
        } else {
          setError("ไม่พบข้อมูลผู้ป่วยในคิว กรุณาตรวจสอบข้อมูล");
        }
      } else {
        setError("ไม่พบข้อมูลผู้ป่วยในคิว กรุณาตรวจสอบข้อมูล");
      }
      
    } catch (error) {
      logger.error("Error searching patient:", error);
      setError("เกิดข้อผิดพลาดในการค้นหา กรุณาลองอีกครั้ง");
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (field: keyof DoctorVisitForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev: any) => ({ ...prev, [field]: undefined }));
  };

  const handleDrugChange = (field: keyof DrugOrder, value: string) => {
    setNewDrug(prev => ({ ...prev, [field]: value }));
  };

  const addDrug = () => {
    if (!newDrug.name || !newDrug.dose || !newDrug.quantity || !newDrug.usage) {
      setError("กรุณากรอกข้อมูลยาให้ครบถ้วน");
      return;
    }
    setForm(prev => ({ ...prev, drugs: [...prev.drugs, newDrug] }));
    setNewDrug({ name: "", dose: "", quantity: "", usage: "" });
  };

  const removeDrug = (idx: number) => {
    setForm(prev => ({ ...prev, drugs: prev.drugs.filter((_, i) => i !== idx) }));
  };

  const validateForm = (): boolean => {
    const newErrors: any = {};
    if (!selectedPatient) {
      setError("กรุณาเลือกผู้ป่วย");
      return false;
    }
    if (!form.physicalExam.trim()) newErrors.physicalExam = "กรุณากรอกผลการตรวจร่างกาย";
    if (!form.diagnosis.trim()) newErrors.diagnosis = "กรุณากรอกการวินิจฉัย";
    if (!form.advice.trim()) newErrors.advice = "กรุณากรอกคำแนะนำ";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);
    
    try {
      // Create visit record
      const visitData = {
        patientId: selectedPatient!.id,
        chiefComplaint: form.diagnosis,
        presentIllness: form.physicalExam,
        diagnosis: form.diagnosis,
        advice: form.advice,
        visitType: 'walk_in' as const,
        status: 'completed'
      };

      const visitResponse = await VisitService.createVisit(visitData);
      
      if (visitResponse.statusCode !== 200 || !visitResponse.data) {
        throw new Error('Failed to create visit record');
      }

      // Create prescriptions if any drugs are prescribed
      if (form.drugs.length > 0) {
        const prescriptionData: CreatePrescriptionRequest = {
          patientId: selectedPatient!.id,
          visitId: visitResponse.data.id,
          medications: form.drugs.map(drug => ({
            medicationName: drug.name,
            dosage: drug.dose,
            frequency: "ตามแพทย์สั่ง",
            duration: "7 days",
            instructions: drug.usage,
            quantity: parseInt(drug.quantity) || 1
          })),
          prescriberId: user?.id || 'doctor'
        };

        const prescriptionResponse = await PharmacyService.createPrescription(prescriptionData);
        
        if (prescriptionResponse.statusCode !== 200) {
          logger.error('Failed to create prescription:', prescriptionResponse.error);
        }
      }

      // Create lab orders if any labs are ordered
      if (form.labs.cbc || form.labs.fbs) {
        const labTests = [];
        if (form.labs.cbc) labTests.push({ testName: 'CBC', testCategory: 'blood' as const });
        if (form.labs.fbs) labTests.push({ testName: 'FBS', testCategory: 'blood' as const });

        // Create separate lab order for each test
        for (const test of labTests) {
          const labOrderData: CreateLabOrderRequest = {
            patientId: selectedPatient!.id,
            visitId: visitResponse.data.id,
            testCategory: test.testCategory,
            testName: test.testName,
            orderedBy: user?.id || 'doctor',
            priority: 'routine'
          };

          const labResponse = await LabService.createLabOrder(labOrderData);
          
          if (labResponse.statusCode !== 200) {
            logger.error(`Failed to create lab order for ${test.testName}:`, labResponse.error);
          }
        }
      }

      setSuccess("บันทึกการตรวจของแพทย์สำเร็จ");
      
      // Reset form
      setTimeout(() => {
        setSelectedPatient(null);
        setSearchQuery("");
        setForm({
          physicalExam: "",
          diagnosis: "",
          advice: "",
          drugs: [],
          labs: { cbc: false, fbs: false }
        });
        setSuccess(null);
      }, 3000);
      
    } catch (error) {
      logger.error("Error saving doctor visit:", error);
      setError("เกิดข้อผิดพลาดในการบันทึก กรุณาลองอีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
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
              <h1 className="text-2xl font-bold text-gray-900">ระบบตรวจรักษาของแพทย์</h1>
              <p className="text-gray-600 mt-1">บันทึกการตรวจรักษาและสั่งยา</p>
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
                onKeyPress={handleKeyPress}
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
                  <p className="text-sm text-gray-900">{searchQuery}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">HN</label>
                  <p className="text-sm text-gray-900">{selectedPatient.hn}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">ชื่อ-นามสกุล</label>
                  <p className="text-sm text-gray-900">{selectedPatient.thai_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">อายุ</label>
                  <p className="text-sm text-gray-900">{selectedPatient.birth_date ? calculateAge(selectedPatient.birth_date) : 'ไม่ระบุ'} ปี</p>
                </div>
              </div>
            </div>

            {/* Doctor Visit Form */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <FileText className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">บันทึกการตรวจรักษา</h3>
              </div>
              
              <div className="space-y-6">
                {/* Physical Examination */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ผลการตรวจร่างกาย *</label>
                  <textarea
                    value={form.physicalExam}
                    onChange={(e) => handleInputChange('physicalExam', e.target.value)}
                    rows={4}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.physicalExam ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="บันทึกผลการตรวจร่างกาย..."
                  />
                  {errors.physicalExam && <p className="text-red-600 text-sm mt-1">{errors.physicalExam}</p>}
                </div>

                {/* Diagnosis */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">การวินิจฉัยโรค *</label>
                  <textarea
                    value={form.diagnosis}
                    onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                    rows={3}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.diagnosis ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="บันทึกการวินิจฉัยโรค..."
                  />
                  {errors.diagnosis && <p className="text-red-600 text-sm mt-1">{errors.diagnosis}</p>}
                </div>

                {/* Advice */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">คำแนะนำ *</label>
                  <textarea
                    value={form.advice}
                    onChange={(e) => handleInputChange('advice', e.target.value)}
                    rows={3}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.advice ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="คำแนะนำสำหรับผู้ป่วย..."
                  />
                  {errors.advice && <p className="text-red-600 text-sm mt-1">{errors.advice}</p>}
                </div>

                {/* Prescription */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">การสั่งยา</label>
                  
                  {/* Add Drug Form */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <input
                      type="text"
                      value={newDrug.name}
                      onChange={(e) => handleDrugChange('name', e.target.value)}
                      placeholder="ชื่อยา"
                      className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={newDrug.dose}
                      onChange={(e) => handleDrugChange('dose', e.target.value)}
                      placeholder="ขนาด"
                      className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={newDrug.quantity}
                      onChange={(e) => handleDrugChange('quantity', e.target.value)}
                      placeholder="จำนวน"
                      className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newDrug.usage}
                        onChange={(e) => handleDrugChange('usage', e.target.value)}
                        placeholder="วิธีใช้"
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={addDrug}
                        className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Drug List */}
                  {form.drugs.length > 0 && (
                    <div className="space-y-2">
                      {form.drugs.map((drug, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="grid grid-cols-4 gap-4 flex-1">
                            <span className="text-sm font-medium">{drug.name}</span>
                            <span className="text-sm">{drug.dose}</span>
                            <span className="text-sm">{drug.quantity}</span>
                            <span className="text-sm">{drug.usage}</span>
                          </div>
                          <button
                            onClick={() => removeDrug(index)}
                            className="ml-4 text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Lab Orders */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">การสั่งตรวจ</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={form.labs.cbc}
                        onChange={(e) => handleInputChange('labs', { ...form.labs, cbc: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm">CBC (Complete Blood Count)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={form.labs.fbs}
                        onChange={(e) => handleInputChange('labs', { ...form.labs, fbs: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm">FBS (Fasting Blood Sugar)</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setSelectedPatient(null);
                  setSearchQuery("");
                  setForm({
                    physicalExam: "",
                    diagnosis: "",
                    advice: "",
                    drugs: [],
                    labs: { cbc: false, fbs: false }
                  });
                }}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  isSubmitting
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
                  'บันทึกการตรวจรักษา'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
