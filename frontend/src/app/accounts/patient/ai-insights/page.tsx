"use client";
import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";

interface HealthInsight {
  riskLevel: string;
  riskScore: number;
  lastUpdate: string;
  predictions: Array<{
    condition: string;
    risk: string;
    percentage: number;
    factors: string[];
    color: string;
  }>;
  recommendations: Array<{
    type: string;
    title: string;
    description: string;
    priority: string;
    icon: string;
  }>;
}

export default function AIInsights() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [healthData, setHealthData] = useState<HealthInsight | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchHealthInsights();
    }
  }, [user]);

  const fetchHealthInsights = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (user?.id) {
        const response = await apiClient.getPatientAIInsights(user.id);
        if (response.success && response.data) {
          setHealthData(response.data);
        } else {
          setError(response.error?.message || "ไม่สามารถดึงข้อมูล AI insights ได้");
        }
      }
    } catch (err) {
      console.error("Error fetching health insights:", err);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูลการวิเคราะห์สุขภาพ");
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "ต่ำ": case "low": return "text-green-600 bg-green-50 border-green-200";
      case "ปานกลาง": case "medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "สูง": case "high": return "text-red-600 bg-red-50 border-red-200";
      default: return "text-gray-800 bg-gray-50 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high": return "text-red-600 bg-red-50 border-red-200";
      case "medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low": return "text-green-600 bg-green-50 border-green-200";
      default: return "text-gray-800 bg-gray-50 border-gray-200";
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high": return "สำคัญมาก";
      case "medium": return "สำคัญปานกลาง";
      case "low": return "สำคัญน้อย";
      default: return "ไม่ระบุ";
    }
  };

  return (
    <AppLayout title="AI Health Insights" userType="patient">
      <div className="bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto p-4 space-y-6">
          
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-2">การวิเคราะห์สุขภาพด้วย AI</h1>
                <p className="text-blue-100">ระบบปัญญาประดิษฐ์วิเคราะห์ข้อมูลสุขภาพและให้คำแนะนำเฉพาะตัว</p>
              </div>
              <div className="text-6xl">🤖</div>
            </div>
          </div>

          {/* Risk Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-3xl">💚</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">ระดับความเสี่ยงรวม</h3>
                <div className="text-3xl font-bold text-green-600 mb-1">{healthData?.riskLevel || 'N/A'}</div>
                <div className="text-sm text-slate-800">คะแนน: {healthData?.riskScore || 0}/100</div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-3xl">📊</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">การคาดการณ์</h3>
                <div className="text-3xl font-bold text-blue-600 mb-1">{healthData?.predictions?.length || 0}</div>
                <div className="text-sm text-slate-800">โรคที่วิเคราะห์</div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-3xl">💡</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">คำแนะนำ</h3>
                <div className="text-3xl font-bold text-purple-600 mb-1">{healthData?.recommendations?.length || 0}</div>
                <div className="text-sm text-slate-800">ข้อแนะนำสำหรับคุณ</div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="border-b border-slate-200">
              <div className="flex space-x-1 p-4">
                {[
                  { id: "overview", label: "ภาพรวม", icon: "📊" },
                  { id: "predictions", label: "การคาดการณ์", icon: "🔮" },
                  { id: "recommendations", label: "คำแนะนำ", icon: "💡" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ease-out ${
                      activeTab === tab.id
                        ? "bg-blue-500 text-white shadow-md"
                        : "text-slate-800 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-slate-800">ภาพรวมสุขภาพ</h2>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Risk Chart */}
                    <div className="bg-slate-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4">แผนภูมิความเสี่ยง</h3>
                      <div className="space-y-4">
                        {healthData?.predictions?.map((prediction, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-slate-700">{prediction.condition}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    prediction.percentage <= 25 ? 'bg-green-500' :
                                    prediction.percentage <= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${prediction.percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-slate-800">{prediction.percentage}%</span>
                            </div>
                          </div>
                        )) || <div className="text-slate-500">ไม่มีข้อมูลการคาดการณ์</div>}
                      </div>
                    </div>

                    {/* Health Trends */}
                    <div className="bg-slate-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4">แนวโน้มสุขภาพ</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">📈</span>
                            <span className="text-slate-700">ระดับการออกกำลังกาย</span>
                          </div>
                          <span className="text-green-600 font-semibold">ดีขึ้น</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">🍎</span>
                            <span className="text-slate-700">คุณภาพอาหาร</span>
                          </div>
                          <span className="text-yellow-600 font-semibold">เปลี่ยนแปลงเล็กน้อย</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">😴</span>
                            <span className="text-slate-700">คุณภาพการนอน</span>
                          </div>
                          <span className="text-green-600 font-semibold">ดีขึ้น</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "predictions" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-slate-800">การคาดการณ์ความเสี่ยง</h2>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {healthData?.predictions?.map((prediction, index) => (
                      <div key={index} className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-slate-800">{prediction.condition}</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(prediction.risk)}`}>
                            {prediction.risk}
                          </span>
                        </div>
                        
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-800">ความเสี่ยง</span>
                            <span className="font-semibold text-slate-800">{prediction.percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                prediction.percentage <= 25 ? 'bg-green-500' :
                                prediction.percentage <= 50 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${prediction.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-slate-800 mb-2">ปัจจัยที่มีผล:</p>
                          <ul className="space-y-1">
                            {prediction.factors.map((factor, factorIndex) => (
                              <li key={factorIndex} className="text-sm text-slate-700 flex items-start">
                                <span className="text-blue-500 mr-2">•</span>
                                {factor}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "recommendations" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-slate-800">คำแนะนำสำหรับคุณ</h2>
                  
                  <div className="space-y-4">
                    {healthData?.recommendations?.map((rec, index) => (
                      <div key={index} className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start space-x-4">
                          <div className="text-3xl">{rec.icon}</div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-lg font-semibold text-slate-800">{rec.title}</h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(rec.priority)}`}>
                                {getPriorityText(rec.priority)}
                              </span>
                            </div>
                            <p className="text-slate-800 mb-4">{rec.description}</p>
                            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                              ดูรายละเอียด
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-center text-sm text-slate-700">
            อัปเดตล่าสุด: {healthData?.lastUpdate ? new Date(healthData.lastUpdate).toLocaleDateString('th-TH', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : 'ไม่ทราบ'}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
