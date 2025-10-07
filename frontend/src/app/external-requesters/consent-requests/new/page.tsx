'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  User, 
  FileText, 
  Calendar, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Search,
  Plus,
  Trash2
} from 'lucide-react';

interface Patient {
  id: string;
  hn: string;
  name: string;
  age: number;
  gender: string;
}

interface ConsentRequestForm {
  patient_id: string;
  request_type: string;
  purpose: string;
  data_types: string[];
  urgency_level: 'emergency' | 'urgent' | 'normal';
  expires_in_days: number;
  additional_notes: string;
}

const requestTypeOptions = [
  { value: 'patient_data', label: 'ข้อมูลผู้ป่วย' },
  { value: 'medical_records', label: 'ประวัติการรักษา' },
  { value: 'lab_results', label: 'ผลการตรวจ' },
  { value: 'prescriptions', label: 'ใบสั่งยา' },
  { value: 'appointments', label: 'ข้อมูลนัดหมาย' },
  { value: 'research_data', label: 'ข้อมูลเพื่อการวิจัย' }
];

const dataTypeOptions = [
  { value: 'personal_info', label: 'ข้อมูลส่วนตัว' },
  { value: 'medical_history', label: 'ประวัติการรักษา' },
  { value: 'diagnosis', label: 'การวินิจฉัยโรค' },
  { value: 'lab_results', label: 'ผลการตรวจทางห้องปฏิบัติการ' },
  { value: 'imaging_results', label: 'ผลการตรวจภาพ' },
  { value: 'medications', label: 'ยาที่ใช้' },
  { value: 'allergies', label: 'ประวัติการแพ้ยา' },
  { value: 'vital_signs', label: 'สัญญาณชีพ' },
  { value: 'appointments', label: 'ข้อมูลนัดหมาย' },
  { value: 'emergency_contacts', label: 'ข้อมูลผู้ติดต่อฉุกเฉิน' }
];

const urgencyOptions = [
  { value: 'normal', label: 'ปกติ', description: 'คำขอทั่วไป' },
  { value: 'urgent', label: 'ด่วน', description: 'คำขอที่ต้องการการตอบสนองเร็ว' },
  { value: 'emergency', label: 'ฉุกเฉิน', description: 'คำขอเพื่อการรักษาเร่งด่วน' }
];

export default function NewConsentRequestPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [form, setForm] = useState<ConsentRequestForm>({
    patient_id: '',
    request_type: '',
    purpose: '',
    data_types: [],
    urgency_level: 'normal',
    expires_in_days: 30,
    additional_notes: ''
  });
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Redirect if not authenticated or not external requester
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user || !['external_requester', 'external_admin'].includes(user.role))) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Search patients
  const searchPatients = async (query: string) => {
    if (query.length < 2) {
      setPatients([]);
      return;
    }

    try {
      const response = await fetch(`/api/external-requesters/search/patients?query=${encodeURIComponent(query)}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to search patients');
      }

      const data = await response.json();
      setPatients(data.data.patients || []);
    } catch (err) {
      console.error('Error searching patients:', err);
      setPatients([]);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchPatients(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setForm(prev => ({ ...prev, patient_id: patient.id }));
    setSearchQuery(patient.name);
    setPatients([]);
  };

  const handleDataTypeToggle = (dataType: string) => {
    setForm(prev => ({
      ...prev,
      data_types: prev.data_types.includes(dataType)
        ? prev.data_types.filter(dt => dt !== dataType)
        : [...prev.data_types, dataType]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatient) {
      setError('กรุณาเลือกผู้ป่วย');
      return;
    }

    if (!form.request_type) {
      setError('กรุณาเลือกประเภทคำขอ');
      return;
    }

    if (!form.purpose.trim()) {
      setError('กรุณาระบุวัตถุประสงค์');
      return;
    }

    if (form.data_types.length === 0) {
      setError('กรุณาเลือกประเภทข้อมูลอย่างน้อย 1 ประเภท');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/external-requesters/consent-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(form)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create consent request');
      }

      const data = await response.json();
      setSuccess(true);
      
      // Redirect to consent requests list after 2 seconds
      setTimeout(() => {
        router.push('/external-requesters/consent-requests');
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">H</span>
          </div>
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ส่งคำขอเข้าถึงข้อมูลใหม่</h1>
              <p className="text-gray-600 mt-1">กรอกข้อมูลเพื่อส่งคำขอเข้าถึงข้อมูลผู้ป่วย</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {success ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <div className="text-green-600 mb-4">
              <CheckCircle className="h-16 w-16 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">ส่งคำขอสำเร็จ!</h2>
            <p className="text-gray-600 mb-4">
              คำขอเข้าถึงข้อมูลของคุณถูกส่งไปยังผู้ป่วยแล้ว และจะได้รับการแจ้งเตือนทางอีเมล
            </p>
            <p className="text-sm text-gray-500">
              กำลังเปลี่ยนเส้นทางไปยังหน้ารายการคำขอ...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Patient Selection */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                เลือกผู้ป่วย
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ค้นหาผู้ป่วย
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="ค้นหาด้วยชื่อ, HN, หรือหมายเลขบัตรประชาชน..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {selectedPatient && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-blue-900">{selectedPatient.name}</h4>
                        <p className="text-sm text-blue-700">
                          HN: {selectedPatient.hn} | อายุ: {selectedPatient.age} ปี | เพศ: {selectedPatient.gender}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPatient(null);
                          setForm(prev => ({ ...prev, patient_id: '' }));
                          setSearchQuery('');
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}

                {patients.length > 0 && !selectedPatient && (
                  <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                    {patients.map((patient) => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => handlePatientSelect(patient)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{patient.name}</div>
                        <div className="text-sm text-gray-500">
                          HN: {patient.hn} | อายุ: {patient.age} ปี | เพศ: {patient.gender}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Request Details */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                รายละเอียดคำขอ
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ประเภทคำขอ *
                  </label>
                  <select
                    value={form.request_type}
                    onChange={(e) => setForm(prev => ({ ...prev, request_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">เลือกประเภทคำขอ</option>
                    {requestTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ระดับความเร่งด่วน
                  </label>
                  <select
                    value={form.urgency_level}
                    onChange={(e) => setForm(prev => ({ ...prev, urgency_level: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {urgencyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label} - {option.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  วัตถุประสงค์การใช้งาน *
                </label>
                <textarea
                  value={form.purpose}
                  onChange={(e) => setForm(prev => ({ ...prev, purpose: e.target.value }))}
                  placeholder="อธิบายวัตถุประสงค์การใช้งานข้อมูลอย่างละเอียด..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ประเภทข้อมูลที่ต้องการ *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {dataTypeOptions.map((option) => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={form.data_types.includes(option.value)}
                        onChange={() => handleDataTypeToggle(option.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
                {form.data_types.length === 0 && (
                  <p className="text-sm text-red-600 mt-2">กรุณาเลือกประเภทข้อมูลอย่างน้อย 1 ประเภท</p>
                )}
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ระยะเวลาหมดอายุ (วัน)
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={form.expires_in_days}
                  onChange={(e) => setForm(prev => ({ ...prev, expires_in_days: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  คำขอจะหมดอายุใน {form.expires_in_days} วัน ({new Date(Date.now() + form.expires_in_days * 24 * 60 * 60 * 1000).toLocaleDateString('th-TH')})
                </p>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  หมายเหตุเพิ่มเติม
                </label>
                <textarea
                  value={form.additional_notes}
                  onChange={(e) => setForm(prev => ({ ...prev, additional_notes: e.target.value }))}
                  placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  <p className="text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    กำลังส่ง...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    ส่งคำขอ
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
