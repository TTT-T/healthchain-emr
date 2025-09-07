"use client";
import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { logger } from '@/lib/logger';

interface AIInsight {
  id: string;
  patient_id: string;
  insight_type: string;
  insight_data: any;
  confidence_score: number;
  recommendations: string[];
  risk_level: string;
  created_at: string;
  updated_at: string;
}

interface HealthMetric {
  name: string;
  value: string;
  status: 'normal' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

interface Prediction {
  condition: string;
  probability: number;
  timeframe: string;
  factors: string[];
}

interface Recommendation {
  category: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
}

export default function AIInsights() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for real data from API
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [healthScore, setHealthScore] = useState<number>(0);
  const [riskLevel, setRiskLevel] = useState<string>("unknown");

  const fetchInsights = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (user?.id) {
        const response = await apiClient.getPatientAIInsights(user.id);
        if (response.statusCode === 200 && response.data) {
          const insightsData = response.data;
          
          // Process AI insights data
          if (Array.isArray(insightsData)) {
            setInsights(insightsData as any);
          } else if (insightsData && typeof insightsData === 'object' && Array.isArray((insightsData as any).insights)) {
            setInsights((insightsData as any).insights as any);
          } else {
            setInsights([]);
          }

          // Extract and process health metrics from real data or create placeholder
          await processHealthData(insightsData);
          
        } else {
          setError(response.error?.message || "ไม่สามารถดึงข้อมูล AI Insights ได้");
          // Set default values when no data available
          setDefaultValues();
        }
      }
    } catch (err) {
      logger.error("Error fetching AI insights:", err);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูล AI Insights");
      setDefaultValues();
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const processHealthData = async (data: any) => {
    try {
      // Try to fetch additional health data from other endpoints
      if (user?.id) {
        // Fetch lab results for health metrics
        const labResponse = await apiClient.getPatientLabResults(user.id);
        const medicationResponse = await apiClient.getPatientMedications(user.id);
        
        // Process health metrics from lab results
        const metrics = await generateHealthMetrics(labResponse.data, medicationResponse.data);
        setHealthMetrics(metrics);
        
        // Generate AI predictions based on available data
        const aiPredictions = await generatePredictions(data, labResponse.data);
        setPredictions(aiPredictions);
        
        // Generate recommendations
        const aiRecommendations = await generateRecommendations(metrics, aiPredictions);
        setRecommendations(aiRecommendations);
        
        // Calculate health score
        const score = calculateHealthScore(metrics);
        setHealthScore(score);
        
        // Determine risk level
        const risk = determineRiskLevel(aiPredictions, score);
        setRiskLevel(risk);
      }
    } catch (err) {
      logger.warn("Error processing health data, using defaults:", err);
      setDefaultValues();
    }
  };

  const generateHealthMetrics = async (labData: any, medicationData: any): Promise<HealthMetric[]> => {
    const metrics: HealthMetric[] = [];
    
    // If we have lab results, extract relevant metrics
    if (labData && Array.isArray(labData.labResults)) {
      // Process lab results to extract health metrics
      labData.labResults.forEach((result: any) => {
        if (result.test_name?.toLowerCase().includes('glucose') || result.test_name?.toLowerCase().includes('sugar')) {
          metrics.push({
            name: "น้ำตาลในเลือด",
            value: `${result.result_value} ${result.unit || 'mg/dL'}`,
            status: parseLabStatus(result.result_value, 'glucose'),
            trend: "stable"
          });
        }
        if (result.test_name?.toLowerCase().includes('cholesterol')) {
          metrics.push({
            name: "คอเลสเตอรอล",
            value: `${result.result_value} ${result.unit || 'mg/dL'}`,
            status: parseLabStatus(result.result_value, 'cholesterol'),
            trend: "stable"
          });
        }
      });
    }
    
    // Add default metrics if none found
    if (metrics.length === 0) {
      metrics.push(
        { name: "ความดันโลหิต", value: "รอข้อมูล", status: "normal", trend: "stable" },
        { name: "น้ำตาลในเลือด", value: "รอข้อมูล", status: "normal", trend: "stable" },
        { name: "คอเลสเตอรอล", value: "รอข้อมูล", status: "normal", trend: "stable" },
        { name: "น้ำหนัก", value: "รอข้อมูล", status: "normal", trend: "stable" }
      );
    }
    
    return metrics;
  };

  const generatePredictions = async (aiData: any, labData: any): Promise<Prediction[]> => {
    const predictions: Prediction[] = [];
    
    // If we have AI insights, use them
    if (aiData && Array.isArray(aiData.insights)) {
      aiData.insights.forEach((insight: any) => {
        if (insight.insight_type === 'risk_prediction') {
          predictions.push({
            condition: insight.title || "ไม่ระบุ",
            probability: insight.confidence_score || 0,
            timeframe: "รอการประมวลผลจาก AI",
            factors: insight.recommendations || ["รอการวิเคราะห์ข้อมูล"]
          });
        }
      });
    }
    
    // Add placeholder predictions if none found
    if (predictions.length === 0) {
      predictions.push(
        {
          condition: "การประเมินความเสี่ยง",
          probability: 0,
          timeframe: "รอข้อมูลเพิ่มเติม",
          factors: ["ต้องการข้อมูลสุขภาพเพิ่มเติม", "รอการประมวลผลจาก AI"]
        }
      );
    }
    
    return predictions;
  };

  const generateRecommendations = async (metrics: HealthMetric[], predictions: Prediction[]): Promise<Recommendation[]> => {
    const recommendations: Recommendation[] = [];
    
    // Generate recommendations based on health metrics
    metrics.forEach(metric => {
      if (metric.status === "warning" || metric.status === "critical") {
        recommendations.push({
          category: "การติดตาม",
          title: `ติดตาม${metric.name}`,
          description: `ควรติดตามและตรวจสอบ${metric.name}อย่างสม่ำเสมอ`,
          priority: metric.status === "critical" ? "high" : "medium",
          actionable: true
        });
      }
    });
    
    // Add general recommendations if none specific found
    if (recommendations.length === 0) {
      recommendations.push(
        {
          category: "การตรวจสุขภาพ",
          title: "ตรวจสุขภาพประจำปี",
          description: "ควรตรวจสุขภาพประจำปีเพื่อติดตามสุขภาพโดยรวม",
          priority: "medium",
          actionable: true
        },
        {
          category: "ไลฟ์สไตล์",
          title: "ดูแลสุขภาพทั่วไป",
          description: "รักษาการออกกำลังกายและการรับประทานอาหารที่สมดุล",
          priority: "low",
          actionable: true
        }
      );
    }
    
    return recommendations;
  };

  const parseLabStatus = (value: any, type: string): "normal" | "warning" | "critical" => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return "normal";
    
    switch (type) {
      case 'glucose':
        if (numValue < 70 || numValue > 140) return "warning";
        if (numValue < 50 || numValue > 200) return "critical";
        return "normal";
      case 'cholesterol':
        if (numValue > 200) return "warning";
        if (numValue > 240) return "critical";
        return "normal";
      default:
        return "normal";
    }
  };

  const calculateHealthScore = (metrics: HealthMetric[]): number => {
    if (metrics.length === 0) return 75; // Default score
    
    const normalCount = metrics.filter(m => m.status === "normal").length;
    const warningCount = metrics.filter(m => m.status === "warning").length;
    const criticalCount = metrics.filter(m => m.status === "critical").length;
    
    let score = 100;
    score -= warningCount * 10;
    score -= criticalCount * 25;
    
    return Math.max(0, Math.min(100, score));
  };

  const determineRiskLevel = (predictions: Prediction[], healthScore: number): string => {
    if (healthScore < 50) return "สูง";
    if (healthScore < 75) return "ปานกลาง";
    return "ต่ำ";
  };

  const setDefaultValues = () => {
    setHealthMetrics([
      { name: "ความดันโลหิต", value: "รอข้อมูล", status: "normal", trend: "stable" },
      { name: "น้ำตาลในเลือด", value: "รอข้อมูล", status: "normal", trend: "stable" },
      { name: "คอเลสเตอรอล", value: "รอข้อมูล", status: "normal", trend: "stable" },
      { name: "น้ำหนัก", value: "รอข้อมูล", status: "normal", trend: "stable" }
    ]);
    
    setPredictions([
      {
        condition: "การประเมินความเสี่ยง",
        probability: 0,
        timeframe: "รอข้อมูลเพิ่มเติม",
        factors: ["ต้องการข้อมูลสุขภาพเพิ่มเติม", "รอการประมวลผลจาก AI"]
      }
    ]);
    
    setRecommendations([
      {
        category: "การตรวจสุขภาพ",
        title: "ตรวจสุขภาพประจำปี",
        description: "ควรตรวจสุขภาพประจำปีเพื่อติดตามสุขภาพโดยรวม",
        priority: "medium",
        actionable: true
      }
    ]);
    
    setHealthScore(75);
    setRiskLevel("ไม่ทราบ");
  };

  useEffect(() => {
    if (user?.id) {
      fetchInsights();
    }
  }, [user, fetchInsights]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal": return "text-green-600 bg-green-50";
      case "warning": return "text-yellow-600 bg-yellow-50";
      case "critical": return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return "📈";
      case "down": return "📉";
      case "stable": return "➡️";
      default: return "❓";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "border-red-200 bg-red-50";
      case "medium": return "border-yellow-200 bg-yellow-50";
      case "low": return "border-green-200 bg-green-50";
      default: return "border-gray-200 bg-gray-50";
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "high": return "สำคัญมาก";
      case "medium": return "สำคัญปานกลาง";
      case "low": return "สำคัญน้อย";
      default: return "ไม่ระบุ";
    }
  };

  return (
    <AppLayout title={"AI Health Insights"} userType={"patient"}>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">AI Health Insights</h1>
              <p className="text-blue-100 mt-1">ข้อมูลเชิงลึกด้านสุขภาพจาก AI</p>
            </div>
            <div className="text-6xl opacity-20">🤖</div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">คะแนนสุขภาพ</p>
                <p className={`text-2xl font-bold ${
                  healthScore >= 80 ? "text-green-600" : 
                  healthScore >= 60 ? "text-yellow-600" : "text-red-600"
                }`}>
                  {healthScore}/100
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${
                healthScore >= 80 ? "bg-green-100" : 
                healthScore >= 60 ? "bg-yellow-100" : "bg-red-100"
              }`}>
                {healthScore >= 80 ? "💚" : healthScore >= 60 ? "💛" : "❤️"}
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">ระดับความเสี่ยง</p>
                <p className={`text-2xl font-bold ${
                  riskLevel === "ต่ำ" ? "text-green-600" : 
                  riskLevel === "ปานกลาง" ? "text-yellow-600" : 
                  riskLevel === "สูง" ? "text-red-600" : "text-gray-600"
                }`}>
                  {riskLevel}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${
                riskLevel === "ต่ำ" ? "bg-green-100" : 
                riskLevel === "ปานกลาง" ? "bg-yellow-100" : 
                riskLevel === "สูง" ? "bg-red-100" : "bg-gray-100"
              }`}>
                {riskLevel === "ต่ำ" ? "✅" : riskLevel === "ปานกลาง" ? "⚠️" : riskLevel === "สูง" ? "🚨" : "❓"}
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">คำแนะนำ</p>
                <p className="text-2xl font-bold text-blue-600">{recommendations.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-xl">💡</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">การติดตาม</p>
                <p className="text-2xl font-bold text-purple-600">{healthMetrics.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-xl">📊</div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-200">
            <div className="flex flex-wrap gap-2">
              {[
                { id: "overview", label: "ภาพรวม", icon: "📊" },
                { id: "metrics", label: "ตัวชี้วัดสุขภาพ", icon: "📈" },
                { id: "predictions", label: "การทำนาย", icon: "🔮" },
                { id: "recommendations", label: "คำแนะนำ", icon: "💡" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ML Processing Status */}
        {!isLoading && !error && insights.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-xl">🤖</div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900">AI กำลังประมวลผลข้อมูลสุขภาพของคุณ</h3>
                <p className="text-blue-700">ระบบปัญญาประดิษฐ์กำลังวิเคราะห์ข้อมูลเพื่อสร้างข้อมูลเชิงลึกที่เป็นประโยชน์</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">✓</div>
                <span className="text-sm text-gray-700">ข้อมูลผลตรวจห้องปฏิบัติการ</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">✓</div>
                <span className="text-sm text-gray-700">ข้อมูลยาและการรักษา</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <div className="animate-spin w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full"></div>
                </div>
                <span className="text-sm text-gray-700">การวิเคราะห์ AI</span>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">ความคืบหน้า</span>
                <span className="text-sm text-gray-600">75%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: "75%" }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">กำลังสร้างคำแนะนำเฉพาะบุคคล...</p>
            </div>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <div className="text-red-500 text-2xl">⚠️</div>
            <span className="text-red-700">{error}</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span>📊</span>
                    สรุปสุขภาพ
                  </h3>
                  <div className="space-y-4">
                    {healthMetrics.slice(0, 3).map((metric, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{metric.name}</p>
                          <p className="text-sm text-gray-600">{metric.value}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(metric.status)}`}>
                            {metric.status === "normal" ? "ปกติ" : metric.status === "warning" ? "เตือน" : "วิกฤต"}
                          </span>
                          <span className="text-lg">{getTrendIcon(metric.trend)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span>⚠️</span>
                    ความเสี่ยงที่ควรติดตาม
                  </h3>
                  <div className="space-y-3">
                    {predictions.slice(0, 2).map((prediction, index) => (
                      <div key={index} className="p-4 border-l-4 border-yellow-400 bg-yellow-50 rounded-r-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{prediction.condition}</h4>
                          <span className="text-sm font-medium text-yellow-700">{prediction.probability}%</span>
                        </div>
                        <p className="text-sm text-gray-600">ช่วงเวลา: {prediction.timeframe}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Health Metrics Tab */}
            {activeTab === "metrics" && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <span>📈</span>
                  ตัวชี้วัดสุขภาพทั้งหมด
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {healthMetrics.map((metric, index) => (
                    <div key={index} className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{metric.name}</h4>
                        <span className="text-2xl">{getTrendIcon(metric.trend)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xl font-semibold text-gray-900">{metric.value}</p>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(metric.status)}`}>
                          {metric.status === "normal" ? "ปกติ" : metric.status === "warning" ? "เตือน" : "วิกฤต"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Predictions Tab */}
            {activeTab === "predictions" && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <span>🔮</span>
                  การทำนายความเสี่ยง
                </h3>
                <div className="space-y-4">
                  {predictions.map((prediction, index) => (
                    <div key={index} className="p-6 border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium text-gray-900">{prediction.condition}</h4>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-orange-600">{prediction.probability}%</p>
                          <p className="text-sm text-gray-600">ความน่าจะเป็น</p>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-3">ช่วงเวลาที่คาดการณ์: <span className="font-medium">{prediction.timeframe}</span></p>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">ปัจจัยเสี่ยง:</p>
                        <div className="flex flex-wrap gap-2">
                          {prediction.factors.map((factor, factorIndex) => (
                            <span key={factorIndex} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                              {factor}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations Tab */}
            {activeTab === "recommendations" && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <span>💡</span>
                  คำแนะนำสำหรับสุขภาพ
                </h3>
                <div className="space-y-4">
                  {recommendations.map((rec, index) => (
                    <div key={index} className={`p-6 border rounded-lg ${getPriorityColor(rec.priority)}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-600">{rec.category}</span>
                            <span className="text-xs px-2 py-1 bg-white rounded-full font-medium">
                              {getPriorityText(rec.priority)}
                            </span>
                          </div>
                          <h4 className="text-lg font-medium text-gray-900">{rec.title}</h4>
                        </div>
                        {rec.actionable && (
                          <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                            ดำเนินการ
                          </button>
                        )}
                      </div>
                      <p className="text-gray-700">{rec.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}