"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AIDashboardService, AIDashboardOverview, PatientWithRisk, DiabetesRiskResult } from "@/services/aiDashboardService";
import { 
  Brain, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Activity, 
  Heart, 
  Calendar,
  Search,
  Filter,
  RefreshCw,
  Eye,
  BarChart3,
  PieChart,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { logger } from '@/lib/logger';

export default function AIDashboard() {
  const { isAuthenticated, user } = useAuth();
  const [dashboardData, setDashboardData] = useState<AIDashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated, selectedRiskLevel]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      logger.info('Loading AI Dashboard data');
      
      const data = await AIDashboardService.getDashboardOverview({
        riskLevel: selectedRiskLevel || undefined,
        limit: 100
      });
      
      setDashboardData(data);
      logger.info('AI Dashboard data loaded successfully');
    } catch (error) {
      logger.error('Error loading AI Dashboard data:', error);
      setError('ไม่สามารถโหลดข้อมูล Dashboard ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleBulkAssess = async () => {
    if (!dashboardData) return;
    
    try {
      setRefreshing(true);
      const patientIds = dashboardData.patients
        .filter(p => !p.diabetesRisk || selectedRiskLevel === 'reassess')
        .map(p => p.id);
      
      if (patientIds.length > 0) {
        await AIDashboardService.bulkAssessDiabetesRisk(patientIds, true);
        await loadDashboardData();
      }
    } catch (error) {
      logger.error('Error in bulk assessment:', error);
      setError('ไม่สามารถประเมินความเสี่ยงได้');
    } finally {
      setRefreshing(false);
    }
  };

  const filteredPatients = dashboardData?.patients.filter(patient => {
    const matchesSearch = !searchQuery || 
      patient.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.thai_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.hospital_number.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRisk = !selectedRiskLevel || 
      patient.diabetesRisk?.riskLevel === selectedRiskLevel ||
      (selectedRiskLevel === 'no_data' && !patient.diabetesRisk);
    
    return matchesSearch && matchesRisk;
  }) || [];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="p-8 bg-white rounded-2xl shadow-lg border border-gray-100 max-w-md">
            <div className="p-4 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl w-fit mx-auto mb-6">
              <AlertCircle className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">กรุณาเข้าสู่ระบบ</h2>
            <p className="text-gray-600">คุณต้องเข้าสู่ระบบเพื่อดู AI Dashboard</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl w-fit mx-auto mb-6">
              <Brain className="h-12 w-12 text-white animate-pulse" />
            </div>
            <RefreshCw className="h-8 w-8 text-blue-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">กำลังโหลด AI Dashboard</h2>
            <p className="text-gray-600">กำลังประมวลผลข้อมูลความเสี่ยงโรคเบาหวาน...</p>
            <div className="mt-4 w-64 bg-gray-200 rounded-full h-2 mx-auto">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="p-8 bg-white rounded-2xl shadow-lg border border-gray-100 max-w-md">
            <div className="p-4 bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl w-fit mx-auto mb-6">
              <XCircle className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">เกิดข้อผิดพลาด</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={loadDashboardData}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg mx-auto"
            >
              <RefreshCw className="h-5 w-5" />
              ลองใหม่
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center py-8 gap-6">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <Brain className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Dashboard</h1>
                <p className="text-lg text-gray-600">ระบบประเมินความเสี่ยงโรคเบาหวานด้วย AI</p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    อัปเดตล่าสุด: {dashboardData?.overview.lastUpdated ? new Date(dashboardData.overview.lastUpdated).toLocaleString('th-TH') : 'ไม่ระบุ'}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
                รีเฟรชข้อมูล
              </button>
              <button
                onClick={handleBulkAssess}
                disabled={refreshing}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Activity className="h-5 w-5" />
                ประเมินความเสี่ยงทั้งหมด
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">ผู้ป่วยทั้งหมด</p>
                  <p className="text-4xl font-bold text-gray-900 mt-2">{dashboardData.overview.totalPatients}</p>
                  <p className="text-sm text-gray-500 mt-1">คน</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">ความเสี่ยงสูง</p>
                  <p className="text-4xl font-bold text-red-600 mt-2">{dashboardData.overview.highRiskCount}</p>
                  <p className="text-sm text-gray-500 mt-1">คน</p>
                </div>
                <div className="p-3 bg-red-100 rounded-xl">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">คะแนนเฉลี่ย</p>
                  <p className="text-4xl font-bold text-orange-600 mt-2">{dashboardData.summary.averageRiskScore.toFixed(1)}</p>
                  <p className="text-sm text-gray-500 mt-1">/ 100</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-xl">
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">ต้องติดตาม</p>
                  <p className="text-4xl font-bold text-yellow-600 mt-2">{dashboardData.summary.needsFollowUp}</p>
                  <p className="text-sm text-gray-500 mt-1">คน</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Risk Distribution */}
        {dashboardData && (
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
                <PieChart className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">การกระจายความเสี่ยง</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 hover:shadow-md transition-all duration-300">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <CheckCircle className="h-10 w-10 text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">ความเสี่ยงต่ำ</p>
                <p className="text-3xl font-bold text-green-600">{dashboardData.overview.riskStats.low}</p>
                <p className="text-xs text-gray-500 mt-1">คน</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 hover:shadow-md transition-all duration-300">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <AlertCircle className="h-10 w-10 text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">ความเสี่ยงปานกลาง</p>
                <p className="text-3xl font-bold text-yellow-600">{dashboardData.overview.riskStats.moderate}</p>
                <p className="text-xs text-gray-500 mt-1">คน</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 hover:shadow-md transition-all duration-300">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <AlertTriangle className="h-10 w-10 text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">ความเสี่ยงสูง</p>
                <p className="text-3xl font-bold text-orange-600">{dashboardData.overview.riskStats.high}</p>
                <p className="text-xs text-gray-500 mt-1">คน</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 hover:shadow-md transition-all duration-300">
                <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <XCircle className="h-10 w-10 text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">ความเสี่ยงสูงมาก</p>
                <p className="text-3xl font-bold text-red-600">{dashboardData.overview.riskStats.very_high}</p>
                <p className="text-xs text-gray-500 mt-1">คน</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200 hover:shadow-md transition-all duration-300">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-400 to-slate-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <BarChart3 className="h-10 w-10 text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">ไม่มีข้อมูล</p>
                <p className="text-3xl font-bold text-gray-600">{dashboardData.overview.riskStats.no_data}</p>
                <p className="text-xs text-gray-500 mt-1">คน</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg">
              <Filter className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">ค้นหาและกรองข้อมูล</h3>
          </div>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหาผู้ป่วยด้วยชื่อ, นามสกุล, ชื่อไทย หรือ HN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <select
                value={selectedRiskLevel}
                onChange={(e) => setSelectedRiskLevel(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 min-w-[200px]"
              >
                <option value="">ทุกระดับความเสี่ยง</option>
                <option value="low">ความเสี่ยงต่ำ</option>
                <option value="moderate">ความเสี่ยงปานกลาง</option>
                <option value="high">ความเสี่ยงสูง</option>
                <option value="very_high">ความเสี่ยงสูงมาก</option>
                <option value="no_data">ไม่มีข้อมูล</option>
                <option value="reassess">ประเมินใหม่</option>
              </select>
            </div>
          </div>
        </div>

        {/* Patients List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">รายการผู้ป่วย</h3>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                  {filteredPatients.length} คน
                </span>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">ผู้ป่วย</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">อายุ/เพศ</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">ระดับความเสี่ยง</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">คะแนน</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">ความเร่งด่วน</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">การติดตาม</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredPatients.map((patient) => (
                  <PatientRiskRow key={patient.id} patient={patient} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Patient Risk Row Component
function PatientRiskRow({ patient }: { patient: PatientWithRisk }) {
  const [showDetails, setShowDetails] = useState(false);

  const getRiskBadge = (risk: DiabetesRiskResult | null) => {
    if (!risk) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          ไม่มีข้อมูล
        </span>
      );
    }

    const colorClass = AIDashboardService.getRiskLevelColor(risk.riskLevel);
    const icon = AIDashboardService.getRiskLevelIcon(risk.riskLevel);
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
        {icon} {AIDashboardService.getRiskLevelDescription(risk.riskLevel)}
      </span>
    );
  };

  const getUrgencyBadge = (risk: DiabetesRiskResult | null) => {
    if (!risk) return null;

    const colorClass = AIDashboardService.getUrgencyLevelColor(risk.urgencyLevel);
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {AIDashboardService.getUrgencyLevelDescription(risk.urgencyLevel)}
      </span>
    );
  };

  return (
    <>
      <tr className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200">
        <td className="px-6 py-5 whitespace-nowrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-blue-600">
                {patient.thai_name ? patient.thai_name.charAt(0) : patient.first_name.charAt(0)}
              </span>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">
                {patient.thai_name || `${patient.first_name} ${patient.last_name}`}
              </div>
              <div className="text-sm text-gray-500">HN: {patient.hospital_number}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-5 whitespace-nowrap">
          <div className="text-sm font-medium text-gray-900">{patient.age} ปี</div>
          <div className="text-sm text-gray-500">{patient.gender === 'male' ? 'ชาย' : 'หญิง'}</div>
        </td>
        <td className="px-6 py-5 whitespace-nowrap">
          {getRiskBadge(patient.diabetesRisk)}
        </td>
        <td className="px-6 py-5 whitespace-nowrap">
          {patient.diabetesRisk ? (
            <div>
              <div className="text-lg font-bold text-gray-900">{patient.diabetesRisk.riskScore}/100</div>
              <div className="text-sm text-gray-500">
                {AIDashboardService.formatRiskPercentage(patient.diabetesRisk.riskPercentage)}
              </div>
            </div>
          ) : (
            <span className="text-sm text-gray-500">-</span>
          )}
        </td>
        <td className="px-6 py-5 whitespace-nowrap">
          {getUrgencyBadge(patient.diabetesRisk)}
        </td>
        <td className="px-6 py-5 whitespace-nowrap">
          {patient.diabetesRisk?.nextScreeningDate ? (
            <div className="text-sm font-medium text-gray-900">
              {new Date(patient.diabetesRisk.nextScreeningDate).toLocaleDateString('th-TH')}
            </div>
          ) : (
            <span className="text-sm text-gray-500">-</span>
          )}
        </td>
        <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Eye className="h-4 w-4" />
            {showDetails ? 'ซ่อน' : 'ดูรายละเอียด'}
          </button>
        </td>
      </tr>
      {showDetails && patient.diabetesRisk && (
        <tr>
          <td colSpan={7} className="px-6 py-6 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    ปัจจัยเสี่ยงที่สำคัญ
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    {patient.diabetesRisk.contributingFactors.map((factor, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></span>
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    คำแนะนำ
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    {patient.diabetesRisk.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></span>
                        {recommendation}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
