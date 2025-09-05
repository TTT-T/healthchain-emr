"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from '@/contexts/AuthContext';
import { PatientService } from '@/services/patientService';
import { PharmacyService } from '@/services/pharmacyService';
import { VisitService } from '@/services/visitService';
import { MedicalPrescription } from '@/types/api';

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

interface DrugPrescription {
  id: string;
  name: string;
  dose: string;
  quantity: string;
  usage: string;
  status: "pending" | "dispensed";
  originalQuantity?: string;
  notes?: string;
}

interface PrescriptionData {
  prescriptionId: string;
  patient: Patient;
  prescribedBy: string;
  prescribedDate: string;
  diagnosis: string;
  drugs: DrugPrescription[];
  status: "pending" | "in_progress" | "completed";
  dispensedBy?: string;
  dispensedDate?: string;
  pharmacistNotes?: string;
}

export default function Pharmacy() {
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"hn" | "queue" | "prescription">("queue");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pharmacistName, setPharmacistName] = useState(user?.thai_name || "เภสัชกรสมใจ รักษาดี");
  const [pharmacistNotes, setPharmacistNotes] = useState("");
  const [editingDrug, setEditingDrug] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError("กรุณากรอกข้อมูลที่ต้องการค้นหา");
      return;
    }

    setIsSearching(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log(`🔍 Searching for prescription by ${searchType}:`, searchQuery);
      
      // For now, use mock data since we don't have prescription search API yet
      // TODO: Replace with real API call when prescription endpoint is available
      
      // Mock prescription data (this would come from API)
      const mockPrescription: PrescriptionData = {
        prescriptionId: `RX${new Date().getFullYear()}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        patient: {
          hn: searchQuery.startsWith('HN') ? searchQuery : "HN2025001",
          nationalId: "1234567890123",
          thaiName: "นายสมชาย ใจดี",
          gender: "ชาย",
          birthDate: "1985-05-15",
          queueNumber: searchQuery.startsWith('Q') ? searchQuery : "Q001",
          treatmentType: "OPD - ตรวจรักษาทั่วไป",
          assignedDoctor: "นพ.สมชาย วงศ์แพทย์"
        },
        prescribedBy: "นพ.สมชาย วงศ์แพทย์",
        prescribedDate: new Date().toISOString().slice(0, 16),
        diagnosis: "Upper Respiratory Tract Infection (J06.9)",
        drugs: [
          {
            id: "1",
            name: "Paracetamol 500mg",
            dose: "500mg",
            quantity: "20",
            usage: "1 เม็ด 3 ครั้ง/วัน หลังอาหาร",
            status: "pending"
          },
          {
            id: "2",
            name: "Amoxicillin 250mg",
            dose: "250mg",
            quantity: "21",
            usage: "1 แคปซูล 3 ครั้ง/วัน ก่อนอาหาร",
            status: "pending"
          },
          {
            id: "3",
            name: "Loratadine 10mg",
            dose: "10mg",
            quantity: "7",
            usage: "1 เม็ด 1 ครั้ง/วัน ก่อนนอน",
            status: "pending"
          }
        ],
        status: "pending"
      };

      // Simulate random search result
      if (Math.random() > 0.1) { // Increase success rate for testing
        setSelectedPrescription(mockPrescription);
        setSuccess("พบใบสั่งยาแล้ว");
      } else {
        setSelectedPrescription(null);
        setError("ไม่พบใบสั่งยาในระบบ กรุณาตรวจสอบข้อมูล");
      }
      
    } catch (error) {
      console.error("❌ Error searching prescription:", error);
      setError("เกิดข้อผิดพลาดในการค้นหา กรุณาลองอีกครั้ง");
      setSelectedPrescription(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDrugEdit = (drugId: string, field: keyof DrugPrescription, value: string) => {
    if (!selectedPrescription) return;
    
    setSelectedPrescription(prev => ({
      ...prev!,
      drugs: prev!.drugs.map(drug => 
        drug.id === drugId 
          ? { ...drug, [field]: value }
          : drug
      )
    }));
  };

  const handleDispenseDrug = (drugId: string) => {
    if (!selectedPrescription) return;
    
    setSelectedPrescription(prev => ({
      ...prev!,
      drugs: prev!.drugs.map(drug => 
        drug.id === drugId 
          ? { ...drug, status: "dispensed" as const }
          : drug
      )
    }));
  };

  const handleUndispenseDrug = (drugId: string) => {
    if (!selectedPrescription) return;
    
    setSelectedPrescription(prev => ({
      ...prev!,
      drugs: prev!.drugs.map(drug => 
        drug.id === drugId 
          ? { ...drug, status: "pending" as const }
          : drug
      )
    }));
  };

  const handleCompleteDispensing = async () => {
    if (!selectedPrescription) return;
    
    const pendingDrugs = selectedPrescription.drugs.filter(drug => drug.status === "pending");
    if (pendingDrugs.length > 0) {
      const confirmComplete = confirm(`ยังมียา ${pendingDrugs.length} รายการที่ยังไม่ได้จ่าย ต้องการจ่ายครบหรือไม่?`);
      if (confirmComplete) {
        // Mark all drugs as dispensed
        setSelectedPrescription(prev => ({
          ...prev!,
          drugs: prev!.drugs.map(drug => ({ ...drug, status: "dispensed" as const }))
        }));
      } else {
        return;
      }
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log("📋 Completing prescription:", {
        prescription: selectedPrescription,
        pharmacistName,
        pharmacistNotes,
        dispensedDate: new Date().toISOString()
      });
      
      // TODO: Replace with real API call when pharmacy endpoint is available
      // await PharmacyService.completePrescription(selectedPrescription.prescriptionId, {
      //   pharmacistName,
      //   pharmacistNotes,
      //   dispensedDate: new Date().toISOString()
      // });
      
      setSuccess("จ่ายยาเสร็จสมบูรณ์! ใบสั่งยาได้รับการประมวลผลแล้ว");
      
      // Reset form
      setSelectedPrescription(null);
      setSearchQuery("");
      setPharmacistNotes("");
      
    } catch (error) {
      console.error("❌ Error completing prescription:", error);
      setError("เกิดข้อผิดพลาด กรุณาลองอีกครั้ง");
    } finally {
      setIsProcessing(false);
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

  const getTotalDrugs = () => selectedPrescription?.drugs.length || 0;
  const getDispensedDrugs = () => selectedPrescription?.drugs.filter(drug => drug.status === "dispensed").length || 0;
  const getPendingDrugs = () => selectedPrescription?.drugs.filter(drug => drug.status === "pending").length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/emr"
                className="flex items-center text-slate-600 hover:text-slate-800 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                กลับ
              </Link>
              <div className="h-6 w-px bg-slate-200" />
              <h1 className="text-xl font-bold text-slate-800">จ่ายยา</h1>
              <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                Pharmacy
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span>ออนไลน์</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Search Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              ค้นหาใบสั่งยา
            </h2>
            <p className="text-slate-600">ค้นหาใบสั่งยาที่ต้องการจ่าย</p>
          </div>

          <div className="space-y-4">
            {/* Search Type Selection */}
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="queue"
                  checked={searchType === "queue"}
                  onChange={(e) => setSearchType(e.target.value as "hn" | "queue" | "prescription")}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-slate-700">หมายเลขคิว</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="hn"
                  checked={searchType === "hn"}
                  onChange={(e) => setSearchType(e.target.value as "hn" | "queue" | "prescription")}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-slate-700">หมายเลข HN</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="prescription"
                  checked={searchType === "prescription"}
                  onChange={(e) => setSearchType(e.target.value as "hn" | "queue" | "prescription")}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-slate-700">เลขที่ใบสั่งยา</span>
              </label>
            </div>

            {/* Search Input */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder={
                    searchType === "queue" ? "Q001" : 
                    searchType === "hn" ? "HN2025001" : "RX2025001"
                  }
                  disabled={isSearching}
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  isSearching || !searchQuery.trim()
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {isSearching ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    ค้นหา...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    ค้นหา
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Prescription Details */}
        {selectedPrescription && (
          <>
            {/* Patient & Prescription Info */}
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800">ข้อมูลใบสั่งยา</h2>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    selectedPrescription.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                    selectedPrescription.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                    "bg-green-100 text-green-800"
                  }`}>
                    {selectedPrescription.status === "pending" ? "รอจ่าย" :
                     selectedPrescription.status === "in_progress" ? "กำลังจ่าย" : "จ่ายแล้ว"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Patient Info */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">ข้อมูลผู้ป่วย</h3>
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-600">คิว:</span>
                        <span className="ml-2 font-bold text-purple-600 text-lg">{selectedPrescription.patient.queueNumber}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">HN:</span>
                        <span className="ml-2 font-medium text-slate-800">{selectedPrescription.patient.hn}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-600">ชื่อ:</span>
                      <span className="ml-2 font-medium text-slate-800">{selectedPrescription.patient.thaiName}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">อายุ:</span>
                      <span className="ml-2 font-medium text-slate-800">{calculateAge(selectedPrescription.patient.birthDate)} ปี</span>
                    </div>
                    <div>
                      <span className="text-slate-600">เลขบัตรประชาชน:</span>
                      <span className="ml-2 font-medium text-slate-800">{selectedPrescription.patient.nationalId}</span>
                    </div>
                  </div>
                </div>

                {/* Prescription Info */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">ข้อมูลใบสั่งยา</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-slate-600">เลขที่ใบสั่งยา:</span>
                      <span className="ml-2 font-medium text-slate-800">{selectedPrescription.prescriptionId}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">แพทย์ผู้สั่ง:</span>
                      <span className="ml-2 font-medium text-slate-800">{selectedPrescription.prescribedBy}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">วันที่สั่ง:</span>
                      <span className="ml-2 font-medium text-slate-800">
                        {new Date(selectedPrescription.prescribedDate).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600">การวินิจฉัย:</span>
                      <span className="ml-2 font-medium text-slate-800">{selectedPrescription.diagnosis}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="mt-6 pt-6 border-t">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{getTotalDrugs()}</div>
                    <div className="text-sm text-purple-800">รายการยาทั้งหมด</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{getDispensedDrugs()}</div>
                    <div className="text-sm text-green-800">จ่ายแล้ว</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">{getPendingDrugs()}</div>
                    <div className="text-sm text-yellow-800">รอจ่าย</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Drug Dispensing */}
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-6">
              <h2 className="text-xl font-bold text-slate-800 mb-6">รายการยา</h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-purple-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-purple-800 uppercase tracking-wider">ชื่อยา</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-purple-800 uppercase tracking-wider">ขนาด</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-purple-800 uppercase tracking-wider">จำนวน</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-purple-800 uppercase tracking-wider">วิธีใช้</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-purple-800 uppercase tracking-wider">สถานะ</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-purple-800 uppercase tracking-wider">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {selectedPrescription.drugs.map((drug) => (
                      <tr key={drug.id} className={drug.status === "dispensed" ? "bg-green-50" : "bg-white"}>
                        <td className="px-4 py-4">
                          {editingDrug === drug.id ? (
                            <input
                              type="text"
                              value={drug.name}
                              onChange={(e) => handleDrugEdit(drug.id, "name", e.target.value)}
                              className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                              onBlur={() => setEditingDrug(null)}
                              onKeyPress={(e) => e.key === 'Enter' && setEditingDrug(null)}
                              autoFocus
                            />
                          ) : (
                            <div 
                              className="font-medium text-slate-900 cursor-pointer hover:text-purple-600"
                              onClick={() => setEditingDrug(drug.id)}
                            >
                              {drug.name}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700">{drug.dose}</td>
                        <td className="px-4 py-4">
                          {editingDrug === drug.id ? (
                            <input
                              type="text"
                              value={drug.quantity}
                              onChange={(e) => handleDrugEdit(drug.id, "quantity", e.target.value)}
                              className="w-16 px-2 py-1 border border-slate-300 rounded text-sm"
                              onBlur={() => setEditingDrug(null)}
                              onKeyPress={(e) => e.key === 'Enter' && setEditingDrug(null)}
                            />
                          ) : (
                            <span 
                              className="text-sm text-slate-700 cursor-pointer hover:text-purple-600"
                              onClick={() => setEditingDrug(drug.id)}
                            >
                              {drug.quantity} {drug.name.includes('แคปซูล') ? 'แคปซูล' : 'เม็ด'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {editingDrug === drug.id ? (
                            <input
                              type="text"
                              value={drug.usage}
                              onChange={(e) => handleDrugEdit(drug.id, "usage", e.target.value)}
                              className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                              onBlur={() => setEditingDrug(null)}
                              onKeyPress={(e) => e.key === 'Enter' && setEditingDrug(null)}
                            />
                          ) : (
                            <span 
                              className="text-sm text-slate-700 cursor-pointer hover:text-purple-600"
                              onClick={() => setEditingDrug(drug.id)}
                            >
                              {drug.usage}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            drug.status === "dispensed" 
                              ? "bg-green-100 text-green-800" 
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {drug.status === "dispensed" ? "จ่ายแล้ว" : "รอจ่าย"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex space-x-2">
                            {drug.status === "pending" ? (
                              <button
                                onClick={() => handleDispenseDrug(drug.id)}
                                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                              >
                                จ่าย
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUndispenseDrug(drug.id)}
                                className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
                              >
                                ยกเลิก
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pharmacist Information */}
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-6">ข้อมูลเภสัชกร</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      ชื่อเภสัชกร
                    </label>
                    <input
                      type="text"
                      value={pharmacistName}
                      onChange={(e) => setPharmacistName(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="ชื่อเภสัชกรผู้จ่ายยา"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      วันที่จ่าย
                    </label>
                    <input
                      type="datetime-local"
                      value={new Date().toISOString().slice(0, 16)}
                      readOnly
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    หมายเหตุจากเภสัชกร
                  </label>
                  <textarea
                    value={pharmacistNotes}
                    onChange={(e) => setPharmacistNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="หมายเหตุเพิ่มเติม เช่น การเปลี่ยนแปลงยา คำแนะนำการใช้ยา"
                  />
                </div>

                {/* Complete Dispensing Button */}
                <div className="border-t pt-6">
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => {
                        setSelectedPrescription(null);
                        setSearchQuery("");
                        setPharmacistNotes("");
                      }}
                      className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleCompleteDispensing}
                      disabled={isProcessing}
                      className={`px-8 py-3 rounded-lg font-medium transition-all ${
                        isProcessing
                          ? 'bg-purple-400 text-white cursor-not-allowed'
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                    >
                      {isProcessing ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          กำลังประมวลผล...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          เสร็จสิ้นการจ่ายยา
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Help Text */}
        <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-purple-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-purple-800">
              <p className="font-medium mb-1">คำแนะนำการจ่ายยา:</p>
              <ul className="space-y-1 text-purple-700">
                <li>• คลิกที่ชื่อยา/จำนวน/วิธีใช้ เพื่อแก้ไขข้อมูล</li>
                <li>• ตรวจสอบความถูกต้องของใบสั่งยาก่อนจ่าย</li>
                <li>• กดปุ่ม "จ่าย" เพื่อเปลี่ยนสถานะยาแต่ละรายการ</li>
                <li>• กดปุ่ม "เสร็จสิ้นการจ่ายยา" เมื่อจ่ายยาครบแล้ว</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
