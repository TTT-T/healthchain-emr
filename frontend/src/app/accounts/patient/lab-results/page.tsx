"use client";
import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { CheckCircle, AlertCircle, FileText, Calendar, User, Download, TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";
import { logger } from '@/lib/logger';

interface LabResult {
  id: string;
  test_type: string;
  test_name: string;
  test_results: Array<{
    parameter: string;
    value: string;
    unit: string;
    normalRange: string;
    status: string;
    notes: string;
  }>;
  overall_result: string;
  interpretation: string;
  recommendations: string;
  attachments: any[];
  notes: string;
  result_date: string;
  tested_by: {
    name: string;
  };
  visit: {
    number: string;
    date: string;
    diagnosis: string;
  };
  created_at: string;
  updated_at: string;
}

export default function LabResults() {
  const { user } = useAuth();
  const [results, setResults] = useState<LabResult[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedResult, setSelectedResult] = useState<LabResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchLabResults = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (user?.id) {
        const response = await apiClient.getPatientLabResults(user.id);
        if (response.statusCode === 200 && response.data) {
          // ตรวจสอบว่าข้อมูลเป็น array หรือไม่
          const labResultsData = response.data;
          if (Array.isArray(labResultsData)) {
            setResults(labResultsData as LabResult[]);
          } else if (labResultsData && typeof labResultsData === 'object' && Array.isArray((labResultsData as any).lab_results)) {
            // กรณีที่ข้อมูลอยู่ใน lab_results property (ตามโครงสร้าง backend)
            setResults((labResultsData as any).lab_results as LabResult[]);
          } else {
            // ถ้าไม่มีข้อมูลหรือไม่ใช่ array ให้ตั้งเป็น array ว่าง
            setResults([]);
            logger.warn('Lab results data is not an array:', labResultsData);
          }
        } else {
          setResults([]);
          setError(response.error?.message || "ไม่สามารถดึงข้อมูลผลแลปได้");
        }
      }
      
    } catch (err) {
      logger.error('Error fetching lab results:', err);
      setError('เกิดข้อผิดพลาดในการโหลดผลการตรวจทางห้องปฏิบัติการ');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchLabResults();
    }
  }, [user, fetchLabResults]);

  const getCategoryText = (category: string) => {
    const categoryMap = {
      'blood': 'ตรวจเลือด',
      'urine': 'ตรวจปัสสาวะ',
      'chemistry': 'เคมีคลินิก',
      'microbiology': 'จุลชีววิทยา',
      'pathology': 'พยาธิวิทยา',
      'radiology': 'รังสีวิทยา',
      'other': 'อื่นๆ'
    };
    return categoryMap[category as keyof typeof categoryMap] || category;
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      'pending': 'รอตรวจ',
      'collected': 'เก็บตัวอย่างแล้ว',
      'processing': 'กำลังตรวจ',
      'completed': 'เสร็จสิ้น',
      'cancelled': 'ยกเลิก'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'collected': 'bg-blue-100 text-blue-800',
      'processing': 'bg-purple-100 text-purple-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colorMap[status as keyof typeof colorMap] || 'bg-gray-100 text-gray-800';
  };

  const getValueStatusColor = (status: string) => {
    const colorMap = {
      'normal': 'text-green-600',
      'high': 'text-red-600',
      'low': 'text-orange-600',
      'critical': 'text-red-700 font-bold'
    };
    return colorMap[status as keyof typeof colorMap] || 'text-gray-600';
  };

  const getValueStatusIcon = (status: string) => {
    switch (status) {
      case 'high':
        return <TrendingUp className="h-4 w-4 text-red-600" />;
      case 'low':
        return <TrendingDown className="h-4 w-4 text-orange-600" />;
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-700" />;
      default:
        return <Minus className="h-4 w-4 text-green-600" />;
    }
  };

  const filteredResults = results.filter(result => {
    const matchesSearch = result.test_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         result.tested_by.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (result.interpretation && result.interpretation.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || result.test_type === selectedCategory;
    const matchesStatus = selectedStatus === "all" || result.overall_result === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleResultClick = (result: LabResult) => {
    setSelectedResult(result);
    setIsModalOpen(true);
  };

  const handleDownload = (result: LabResult) => {
    // TODO: Implement download functionality
    logger.debug('Download result:', result.lab_order.id);
  };

  if (isLoading) {
    return (
      <AppLayout title="ผลการตรวจทางห้องปฏิบัติการ" userType="patient">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-800">กำลังโหลดข้อมูลผลการตรวจ...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout title="ผลการตรวจทางห้องปฏิบัติการ" userType="patient">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => fetchLabResults()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="h-4 w-4" />
              ลองใหม่อีกครั้ง
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="ผลการตรวจทางห้องปฏิบัติการ" userType="patient">
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ผลการตรวจทางห้องปฏิบัติการ</h1>
            <p className="text-gray-600 mt-1">ดูผลการตรวจและข้อมูลการวินิจฉัยของคุณ</p>
          </div>
          <button
            onClick={() => fetchLabResults()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            รีเฟรช
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">ผลการตรวจทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">{results.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">เสร็จสิ้น</p>
                <p className="text-2xl font-bold text-gray-900">
                  {results.filter(r => r.overall_result === 'normal' || r.overall_result === 'abnormal').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">รอผล</p>
                <p className="text-2xl font-bold text-gray-900">
                  {results.filter(r => r.overall_result === 'pending' || r.overall_result === 'processing').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">ผิดปกติ</p>
                <p className="text-2xl font-bold text-gray-900">
                  {results.filter(r => r.overall_result === 'abnormal' && r.test_results.some(v => v.status === 'abnormal')).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ค้นหา</label>
              <input
                type="text"
                placeholder="ค้นหาชื่อการตรวจ หรือ ชื่อแพทย์..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ประเภทการตรวจ</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">ทั้งหมด</option>
                <option value="เลือด">ตรวจเลือด</option>
                <option value="ปัสสาวะ">ตรวจปัสสาวะ</option>
                <option value="เคมีคลินิก">เคมีคลินิก</option>
                <option value="จุลชีววิทยา">จุลชีววิทยา</option>
                <option value="พยาธิวิทยา">พยาธิวิทยา</option>
                <option value="รังสีวิทยา">รังสีวิทยา</option>
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">ทั้งหมด</option>
                <option value="normal">ปกติ</option>
                <option value="abnormal">ผิดปกติ</option>
                <option value="pending">รอผล</option>
                <option value="processing">กำลังตรวจ</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {filteredResults.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || selectedCategory !== "all" || selectedStatus !== "all" 
                  ? "ไม่พบผลการตรวจที่ตรงกับเงื่อนไข"
                  : "ยังไม่มีผลการตรวจทางห้องปฏิบัติการ"
                }
              </h3>
              <p className="text-gray-600">
                {searchTerm || selectedCategory !== "all" || selectedStatus !== "all"
                  ? "ลองปรับเปลี่ยนเงื่อนไขการค้นหา"
                  : "ผลการตรวจจะแสดงที่นี่เมื่อแพทย์สั่งตรวจและมีผลออกมาแล้ว"
                }
              </p>
            </div>
          ) : (
            filteredResults.map((result) => (
              <div
                key={result.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleResultClick(result)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{result.test_name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        <span>{result.test_type}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(result.result_date).toLocaleDateString('th-TH')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{result.tested_by.name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.overall_result)}`}>
                      {getStatusText(result.overall_result)}
                    </span>
                    {(result.overall_result === 'normal' || result.overall_result === 'abnormal') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(result);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                {(result.overall_result === 'normal' || result.overall_result === 'abnormal') && result.test_results.length > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">ผลการตรวจ (แสดงบางส่วน)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {result.test_results.slice(0, 3).map((value, index) => (
                        <div key={index} className="text-sm">
                          <span className="font-medium">{value.parameter}:</span>
                          <span className={`ml-1 ${getValueStatusColor(value.status || 'normal')}`}>
                            {value.value} {value.unit || ''}
                          </span>
                          {value.status && value.status !== 'normal' && (
                            <span className="ml-1">
                              {getValueStatusIcon(value.status)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal */}
        {isModalOpen && selectedResult && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-300 shadow-lg">
              {/* Header Bar */}
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 rounded-t-lg">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-gray-600" />
                    <h2 className="text-xl font-bold text-gray-900">{selectedResult.test_name}</h2>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <span className="sr-only">ปิด</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-500" />
                    <span className="font-medium">ประเภท:</span>
                    <span>{selectedResult.test_type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <span className="font-medium">วันที่ตรวจ:</span>
                    <span>{new Date(selectedResult.result_date).toLocaleDateString('th-TH')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-gray-500" />
                    <span className="font-medium">สถานะ:</span>
                    <span>{getStatusText(selectedResult.overall_result)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-gray-500" />
                    <span className="font-medium">แพทย์ผู้ตรวจ:</span>
                    <span>{selectedResult.tested_by.name}</span>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">ข้อมูลการตรวจ</h3>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="font-medium">การวินิจฉัย: {selectedResult.interpretation || 'ไม่ระบุ'}</p>
                    {selectedResult.recommendations && (
                      <p className="text-gray-600 mt-2">คำแนะนำ: {selectedResult.recommendations}</p>
                    )}
                    {selectedResult.notes && (
                      <p className="text-gray-600 mt-2">หมายเหตุ: {selectedResult.notes}</p>
                    )}
                  </div>
                </div>

                {selectedResult.test_results.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      ผลการตรวจ
                    </h3>
                    <div className="overflow-x-auto border border-gray-300 rounded-lg">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-300">
                            <th className="px-4 py-3 text-left font-semibold text-gray-900">พารามิเตอร์</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-900">ค่า</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-900">หน่วย</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-900">ค่าปกติ</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-900">สถานะ</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-900">หมายเหตุ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedResult.test_results.map((value, index) => (
                            <tr key={index} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                              <td className="px-4 py-3 font-medium border-b border-gray-200">
                                {value.parameter}
                              </td>
                              <td className={`px-4 py-3 font-medium border-b border-gray-200 ${getValueStatusColor(value.status || 'normal')}`}>
                                {value.value}
                              </td>
                              <td className="px-4 py-3 border-b border-gray-200">{value.unit || '-'}</td>
                              <td className="px-4 py-3 border-b border-gray-200">{value.normalRange || '-'}</td>
                              <td className="px-4 py-3 border-b border-gray-200">
                                <div className="flex items-center gap-2">
                                  {getValueStatusIcon(value.status || 'normal')}
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    value.status === 'abnormal' 
                                      ? 'bg-red-100 text-red-800' 
                                      : 'bg-green-100 text-green-800'
                                  }`}>
                                    {value.status === 'abnormal' ? 'ผิดปกติ' : 'ปกติ'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 border-b border-gray-200">{value.notes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Additional information */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">ข้อมูลเพิ่มเติม</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div>
                      <span className="font-medium">รหัสการตรวจ:</span>
                      <span className="ml-2">{selectedResult.id}</span>
                    </div>
                    <div>
                      <span className="font-medium">วันที่สร้าง:</span>
                      <span className="ml-2">{new Date(selectedResult.created_at).toLocaleDateString('th-TH')}</span>
                    </div>
                    <div>
                      <span className="font-medium">วันที่อัปเดต:</span>
                      <span className="ml-2">{new Date(selectedResult.updated_at).toLocaleDateString('th-TH')}</span>
                    </div>
                    <div>
                      <span className="font-medium">สถานะ:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusColor(selectedResult.overall_result)}`}>
                        {getStatusText(selectedResult.overall_result)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2 text-gray-600 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-medium"
                  >
                    ปิด
                  </button>
                  {(selectedResult.overall_result === 'normal' || selectedResult.overall_result === 'abnormal') && (
                    <button
                      onClick={() => handleDownload(selectedResult)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors font-medium shadow-md hover:shadow-lg"
                    >
                      <Download className="h-4 w-4" />
                      ดาวน์โหลด
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
