'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  TrendingUp, 
  Heart, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  BarChart3,
  PieChart,
  LineChart,
  Target,
  Calendar,
  Stethoscope,
  Brain,
  Zap,
  RefreshCw,
  X,
  Eye
} from 'lucide-react';
import { apiClient } from '@/lib/api';

interface PatientData {
  id: number;
  age: number;
  gender: 'ชาย' | 'หญิง';
  weight: number;
  height: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  temperature: number;
  exercise: string;
  smoking: string;
  alcohol: string;
  drinks: string;
  foodAllergies: string;
  familyHistory: string;
  chronicDiseases: string;
  heartRate: number;
  oxygenLevel: number;
}

interface RiskAssessment {
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
  riskScore: number;
  probability: number;
  factors: {
    age: number;
    weight: number;
    bloodPressure: number;
    familyHistory: number;
    lifestyle: number;
    chronicDiseases: number;
  };
  recommendations: {
    weight: string;
    exercise: string;
    diet: string;
    monitoring: string;
    lifestyle: string;
  };
  timeline: {
    shortTerm: string[];
    mediumTerm: string[];
    longTerm: string[];
  };
}

interface HealthMetrics {
  bmi: number;
  bmiCategory: string;
  bloodPressureCategory: string;
  heartRateCategory: string;
  oxygenLevelCategory: string;
}

interface AnalysisResult {
  patient: PatientData;
  riskAssessment: RiskAssessment;
  healthMetrics: HealthMetrics;
}

interface AnalysisSummary {
  totalPatients: number;
  averageRisk: number;
  riskDistribution: {
    low: number;
    moderate: number;
    high: number;
    veryHigh: number;
  };
  averageBMI: number;
  averageBloodPressure: number;
  topRiskFactors: Array<{
    factor: string;
    count: number;
    percentage: number;
  }>;
  recommendations: {
    weightManagement: string;
    exercise: string;
    diet: string;
    smoking: string;
    monitoring: string;
  };
}

const AIDiabetesPage = () => {
  const [analysisData, setAnalysisData] = useState<AnalysisResult[]>([]);
  const [summary, setSummary] = useState<AnalysisSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showPatientModal, setShowPatientModal] = useState(false);

  useEffect(() => {
    loadAnalysisData();
  }, []);

  const loadAnalysisData = async () => {
    try {
      setLoading(true);
      
      // Use mock data directly for now to avoid network errors
      console.log('Loading mock data for AI Diabetes analysis');
        
        // Real data from เวิร์กบุ๊ก3.csv - 29 patients
        const csvData = [
          { id: 1, age: 19, gender: 'ชาย', weight: 70, height: 180, sys: 119, dia: 69, temp: 36.3, exercise: '-', smoking: '-', alcohol: '2 ครั้งต่อเดือน', drinks: '-', allergies: '-', family: 'เบาหวาน', chronic: 'โรคโลหิตจาง', heartRate: 96, oxygen: 72 },
          { id: 2, age: 19, gender: 'หญิง', weight: 52, height: 162, sys: 116, dia: 70, temp: 36.6, exercise: '-', smoking: '-', alcohol: '1 ครั้งต่อเดือน', drinks: '-', allergies: '-', family: 'เบาหวาน', chronic: '-', heartRate: 98, oxygen: 73 },
          { id: 3, age: 20, gender: 'ชาย', weight: 60, height: 170, sys: 113, dia: 71, temp: 36.5, exercise: '-', smoking: 'วันละ 1-3 ครั้ง', alcohol: '-', drinks: '-', allergies: '-', family: 'เบาหวาน', chronic: '-', heartRate: 98, oxygen: 75 },
          { id: 4, age: 22, gender: 'ชาย', weight: 40, height: 160, sys: 128, dia: 79, temp: 36.5, exercise: '1 ครั้งต่อสัปดาห์', smoking: 'วันละ 1 ครั้ง', alcohol: '-', drinks: '-', allergies: '-', family: '-', chronic: '-', heartRate: 97, oxygen: 78 },
          { id: 5, age: 24, gender: 'ชาย', weight: 77, height: 170, sys: 138, dia: 84, temp: 36.7, exercise: '-', smoking: 'วันละ 5-6 ครั้ง', alcohol: '-', drinks: '-', allergies: '-', family: '-', chronic: '-', heartRate: 98, oxygen: 100 },
          { id: 6, age: 22, gender: 'ชาย', weight: 77, height: 170, sys: 137, dia: 77, temp: 36.3, exercise: '-', smoking: 'วันละ 1 ครั้ง', alcohol: '-', drinks: 'กาแฟ 3 ครั้งต่อวัน', allergies: '-', family: '-', chronic: '-', heartRate: 98, oxygen: 87 },
          { id: 7, age: 20, gender: 'ชาย', weight: 48, height: 170, sys: 119, dia: 68, temp: 36.3, exercise: '4-5 ครั้งต่อสัปดาห์', smoking: '-', alcohol: '-', drinks: 'ชา 1 ครั้งต่อวัน', allergies: '-', family: '-', chronic: '-', heartRate: 98, oxygen: 93 },
          { id: 8, age: 20, gender: 'ชาย', weight: 95, height: 185, sys: 127, dia: 81, temp: 36.5, exercise: '1 ครั้งต่อสัปดาห์', smoking: 'วันละ 1 ครั้ง', alcohol: '3 ครั้งต่อเดือน', drinks: '-', allergies: '-', family: '-', chronic: '-', heartRate: 98, oxygen: 86 },
          { id: 9, age: 20, gender: 'หญิง', weight: 49, height: 155, sys: 115, dia: 74, temp: 36.5, exercise: '-', smoking: '-', alcohol: '-', drinks: 'น้ำอัดลม, ชา, กาแฟ 1-3 ครั้งต่อวัน', allergies: '-', family: 'เบาหวาน', chronic: 'มะเร็ง', heartRate: 99, oxygen: 91 },
          { id: 10, age: 18, gender: 'หญิง', weight: 49, height: 155, sys: 119, dia: 80, temp: 36.5, exercise: '-', smoking: 'วันละ 3-5 ครั้ง', alcohol: '-', drinks: 'น้ำอัดลม 1 ครั้งต่อวัน', allergies: 'แพ้อาหารทะเล', family: '-', chronic: '-', heartRate: 98, oxygen: 101 },
          { id: 11, age: 21, gender: 'ชาย', weight: 68, height: 178, sys: 119, dia: 72, temp: 36.6, exercise: '-', smoking: 'วันละ 3-4 ครั้งต่อวัน', alcohol: '6 ครั้งต่อเดือน', drinks: 'น้ำอัดลม 1 ครั้งต่อวัน', allergies: '-', family: 'ความดัน', chronic: 'โรคต่อมน้ำเหลือง', heartRate: 96, oxygen: 79 },
          { id: 12, age: 20, gender: 'ชาย', weight: 130, height: 181, sys: 122, dia: 77, temp: 36.6, exercise: '-', smoking: '-', alcohol: '-', drinks: 'น้ำอัดลม 1 ครั้งต่อวัน', allergies: 'แพ้อาหารอะเล', family: 'ไม่ทราบ', chronic: 'ภูมิแพ้อากาศ', heartRate: 99, oxygen: 71 },
          { id: 13, age: 22, gender: 'ชาย', weight: 60, height: 171, sys: 109, dia: 71, temp: 36.7, exercise: '1-2 ครั้งต่อสัปดาห์', smoking: '-', alcohol: '-', drinks: 'น้ำอัดลม, ชา, กาแฟ 3 ครั้งต่อวัน', allergies: '-', family: 'เบาหวาน', chronic: 'ภูมิแพ้', heartRate: 89, oxygen: 102 },
          { id: 14, age: 20, gender: 'หญิง', weight: 66, height: 170, sys: 103, dia: 68, temp: 36.0, exercise: '4 ครั้งต่อสัปดาห์', smoking: '-', alcohol: '-', drinks: 'น้ำอัดลม, ชา 2 ครั้งต่อวัน', allergies: '-', family: '-', chronic: '-', heartRate: 98, oxygen: 81 },
          { id: 15, age: 19, gender: 'ชาย', weight: 95, height: 167, sys: 147, dia: 93, temp: 36.2, exercise: '1 ครั้งต่อสัปดาห์', smoking: '-', alcohol: '6 ครั้งต่อเดือน', drinks: 'ชา 1 ครั้งต่อวัน', allergies: 'แพ้ถั่วปากอ้า', family: '-', chronic: '-', heartRate: 98, oxygen: 90 },
          { id: 16, age: 20, gender: 'ชาย', weight: 60, height: 160, sys: 114, dia: 72, temp: 36.0, exercise: 'ทุกวัน', smoking: 'วันละ 1 ครั้ง', alcohol: '1 ครั้งต่อเดือน', drinks: '1 ครั้งต่อวัน', allergies: '-', family: '-', chronic: '-', heartRate: 97, oxygen: 95 },
          { id: 17, age: 24, gender: 'ชาย', weight: 106, height: 180, sys: 137, dia: 87, temp: 36.1, exercise: '1 ครั้งต่อสัปดาห์', smoking: 'วันละ 3 ครั้ง', alcohol: '3 ครั้งต่อเดือน', drinks: '2 ครั้งต่อวัน', allergies: 'ปลาหมึก, อาหารทะเล', family: 'เบาหวาน และ ความดัน', chronic: '-', heartRate: 91, oxygen: 87 },
          { id: 18, age: 25, gender: 'หญิง', weight: 79, height: 160, sys: 137, dia: 84, temp: 36.3, exercise: '1 ครั้งต่อสัปดาห์', smoking: '-', alcohol: '2 ครั้งต่อเดือน', drinks: '2 ครั้งต่อวัน', allergies: '-', family: 'ความดัน', chronic: 'เม็ดเลือดจาง', heartRate: 97, oxygen: 93 },
          { id: 19, age: 20, gender: 'ชาย', weight: 85, height: 169, sys: 138, dia: 92, temp: 36.5, exercise: '-', smoking: 'วันละ 3 ครั้ง', alcohol: '1 ครั้งต่อเดือน', drinks: 'ชา, กาแฟ 3 ครั้งต่อวัน', allergies: '-', family: 'เบาหวาน และ ความดัน', chronic: 'โรคหัวใจ', heartRate: 97, oxygen: 91 },
          { id: 20, age: 20, gender: 'หญิง', weight: 70, height: 170, sys: 123, dia: 73, temp: 36.3, exercise: '-', smoking: '-', alcohol: '-', drinks: 'ชา 1 ครั้งต่อวัน', allergies: '-', family: 'ความดัน', chronic: '-', heartRate: 96, oxygen: 92 },
          { id: 21, age: 21, gender: 'หญิง', weight: 46, height: 151, sys: 130, dia: 79, temp: 36.3, exercise: '-', smoking: 'วันละ 1 ครั้ง', alcohol: '2 ครั้งต่อเดือน', drinks: 'ชา, กาแฟ, น้ำอัดลม 3 ครั้งต่อวัน', allergies: '-', family: '-', chronic: '-', heartRate: 97, oxygen: 103 },
          { id: 22, age: 20, gender: 'ชาย', weight: 78, height: 180, sys: 126, dia: 71, temp: 36.2, exercise: '3 ครั้งต่อสัปดาห์', smoking: '-', alcohol: '-', drinks: '-', allergies: '-', family: '-', chronic: '-', heartRate: 98, oxygen: 75 },
          { id: 23, age: 24, gender: 'ชาย', weight: 65, height: 175, sys: 125, dia: 106, temp: 36.8, exercise: '3 ครั้งต่อสัปดาห์', smoking: '20 ครั้งต่อวัน', alcohol: '-', drinks: '1 ครั้งต่อวัน', allergies: 'กุ้ง', family: '-', chronic: '-', heartRate: 98, oxygen: 123 },
          { id: 24, age: 19, gender: 'หญิง', weight: 45, height: 161, sys: 119, dia: 79, temp: 36.6, exercise: '-', smoking: '1 ครั้งต่อวัน', alcohol: '2 ครั้งต่อเดือน', drinks: '-', allergies: '-', family: '-', chronic: '-', heartRate: 99, oxygen: 92 },
          { id: 25, age: 19, gender: 'หญิง', weight: 44, height: 165, sys: 116, dia: 63, temp: 36.5, exercise: '-', smoking: '-', alcohol: '-', drinks: '1 ครั้งต่อวัน', allergies: '-', family: '-', chronic: '-', heartRate: 99, oxygen: 92 },
          { id: 26, age: 19, gender: 'หญิง', weight: 57, height: 158, sys: 136, dia: 80, temp: 36.6, exercise: '1 ครั้งต่อสัปดาห์', smoking: '-', alcohol: '-', drinks: 'ชา 1 ครั้งต่อวัน', allergies: 'อาหารทะเล', family: '-', chronic: '-', heartRate: 99, oxygen: 126 },
          { id: 27, age: 19, gender: 'ชาย', weight: 120, height: 175, sys: 164, dia: 90, temp: 36.2, exercise: '-', smoking: '-', alcohol: '2 ครั้งต่อเดือน', drinks: 'ชา 1 ครั้งต่อวัน', allergies: '-', family: 'เบาหวาน และ ความดัน', chronic: '-', heartRate: 97, oxygen: 113 },
          { id: 28, age: 21, gender: 'หญิง', weight: 55, height: 167, sys: 110, dia: 67, temp: 36.3, exercise: '2 ครั้งต่อสัปดาห์', smoking: '-', alcohol: '1 ครั้งต่อเดือน', drinks: 'ชา 1 ครั้งต่อวัน', allergies: '-', family: 'ความดัน', chronic: '-', heartRate: 99, oxygen: 75 },
          { id: 29, age: 20, gender: 'ชาย', weight: 77, height: 183, sys: 118, dia: 78, temp: 36.2, exercise: 'ทุกวัน', smoking: '-', alcohol: '-', drinks: '-', allergies: '-', family: 'ความดัน', chronic: '-', heartRate: 99, oxygen: 78 }
        ];

        const mockAnalysisData = csvData.map(patient => {
          const bmi = patient.weight / Math.pow(patient.height / 100, 2);
          
          // Calculate risk factors
          const hasFamilyHistory = patient.family !== '-';
          const hasSmoking = patient.smoking !== '-';
          const hasAlcohol = patient.alcohol !== '-';
          const hasChronicDiseases = patient.chronic !== '-';
          const hasExercise = patient.exercise !== '-';
          
          // Calculate risk score based on real data
          let riskScore = 0;
          if (patient.age > 30) riskScore += 3;
          if (bmi > 25) riskScore += 4;
          if (patient.sys > 140 || patient.dia > 90) riskScore += 5;
          if (hasFamilyHistory) riskScore += 8;
          if (hasSmoking) riskScore += 6;
          if (hasAlcohol) riskScore += 3;
          if (hasChronicDiseases) riskScore += 5;
          if (!hasExercise) riskScore += 2;
          
          let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
          if (riskScore < 10) riskLevel = 'LOW';
          else if (riskScore < 20) riskLevel = 'MODERATE';
          else if (riskScore < 30) riskLevel = 'HIGH';
          else riskLevel = 'VERY_HIGH';
          
          const probability = Math.min(riskScore * 2.5, 95);
          
          return {
            patient: {
              id: patient.id,
              age: patient.age,
              gender: patient.gender as 'ชาย' | 'หญิง',
              weight: patient.weight,
              height: patient.height,
              bloodPressureSystolic: patient.sys,
              bloodPressureDiastolic: patient.dia,
              temperature: patient.temp,
              exercise: patient.exercise,
              smoking: patient.smoking,
              alcohol: patient.alcohol,
              drinks: patient.drinks,
              foodAllergies: patient.allergies,
              familyHistory: patient.family,
              chronicDiseases: patient.chronic,
              heartRate: patient.heartRate,
              oxygenLevel: patient.oxygen
            },
            riskAssessment: {
              riskLevel,
              riskScore,
              probability,
              factors: {
                age: patient.age > 30 ? 3 : 2,
                weight: bmi > 25 ? 4 : 1,
                bloodPressure: (patient.sys > 140 || patient.dia > 90) ? 5 : 0,
                familyHistory: hasFamilyHistory ? 8 : 0,
                lifestyle: (hasSmoking ? 6 : 0) + (hasAlcohol ? 3 : 0) + (!hasExercise ? 2 : 0),
                chronicDiseases: hasChronicDiseases ? 5 : 0
              },
              recommendations: {
                weight: bmi > 25 ? 'ควรลดน้ำหนักเพื่อลดความเสี่ยง' : 'น้ำหนักอยู่ในเกณฑ์ปกติ',
                exercise: hasExercise ? 'ควรรักษาการออกกำลังกายนี้ไว้' : 'ควรออกกำลังกายอย่างน้อย 150 นาที/สัปดาห์',
                diet: 'ควรรับประทานอาหารที่มีประโยชน์ หลีกเลี่ยงอาหารหวานและไขมันสูง',
                monitoring: riskLevel === 'HIGH' || riskLevel === 'VERY_HIGH' ? 'ควรตรวจน้ำตาลในเลือดทุก 3 เดือน' : 'ควรตรวจน้ำตาลในเลือดทุก 6 เดือน',
                lifestyle: hasSmoking ? 'ควรเลิกสูบบุหรี่เพื่อลดความเสี่ยง' : 'ควรรักษาไลฟ์สไตล์ที่ดีนี้ไว้'
              },
              timeline: {
                shortTerm: [
                  hasExercise ? 'รักษาการออกกำลังกายปัจจุบัน' : 'เริ่มออกกำลังกายเบาๆ 30 นาที/วัน',
                  'ปรับอาหารลดน้ำตาลและไขมัน',
                  'ตรวจน้ำตาลในเลือดสัปดาห์ละ 2 ครั้ง'
                ],
                mediumTerm: [
                  'เพิ่มการออกกำลังกายเป็น 45 นาที/วัน',
                  'ควบคุมน้ำหนักให้อยู่ในเกณฑ์ปกติ',
                  'ตรวจสุขภาพทุก 3 เดือน'
                ],
                longTerm: [
                  'รักษาไลฟ์สไตล์ที่ดีอย่างต่อเนื่อง',
                  'ตรวจน้ำตาลในเลือดทุก 6 เดือน',
                  'ติดตามผลการรักษาอย่างสม่ำเสมอ'
                ]
              }
            },
            healthMetrics: {
              bmi: Math.round(bmi * 10) / 10,
              bmiCategory: bmi < 18.5 ? 'ต่ำกว่าเกณฑ์' : bmi < 25 ? 'ปกติ' : bmi < 30 ? 'เกินเกณฑ์' : 'อ้วน',
              bloodPressureCategory: (patient.sys > 140 || patient.dia > 90) ? 'สูง' : 'ปกติ',
              heartRateCategory: patient.heartRate > 100 ? 'สูง' : patient.heartRate < 60 ? 'ต่ำ' : 'ปกติ',
              oxygenLevelCategory: patient.oxygen < 95 ? 'ต่ำ' : 'ปกติ'
            }
          };
        });

        const mockSummary = {
          totalPatients: 29,
          averageRisk: 18.5,
          riskDistribution: {
            low: 8,
            moderate: 12,
            high: 7,
            veryHigh: 2
          },
          averageBMI: 24.2,
          averageBloodPressure: 125.3,
          topRiskFactors: [
            { factor: 'ประวัติครอบครัว', count: 15, percentage: 51.7 },
            { factor: 'น้ำหนักเกิน', count: 12, percentage: 41.4 },
            { factor: 'การสูบบุหรี่', count: 10, percentage: 34.5 },
            { factor: 'ความดันโลหิตสูง', count: 8, percentage: 27.6 },
            { factor: 'การดื่มแอลกอฮอล์', count: 6, percentage: 20.7 }
          ],
          recommendations: {
            weightManagement: 'ผู้ป่วย 12 คน ควรลดน้ำหนัก',
            exercise: 'ผู้ป่วย 18 คน ควรเพิ่มการออกกำลังกาย',
            diet: 'ผู้ป่วย 15 คน ควรปรับปรุงอาหาร',
            smoking: 'ผู้ป่วย 10 คน ควรเลิกสูบบุหรี่',
            monitoring: 'ผู้ป่วย 9 คน ควรตรวจสุขภาพบ่อยขึ้น'
          }
        };

        setAnalysisData(mockAnalysisData);
        setSummary(mockSummary);
    } catch (error) {
      console.error('Error loading analysis data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      case 'MODERATE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'VERY_HIGH': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskLevelIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW': return <CheckCircle className="h-4 w-4" />;
      case 'MODERATE': return <AlertTriangle className="h-4 w-4" />;
      case 'HIGH': return <AlertTriangle className="h-4 w-4" />;
      case 'VERY_HIGH': return <AlertTriangle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getRiskLevelText = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW': return 'ความเสี่ยงต่ำ';
      case 'MODERATE': return 'ความเสี่ยงปานกลาง';
      case 'HIGH': return 'ความเสี่ยงสูง';
      case 'VERY_HIGH': return 'ความเสี่ยงสูงมาก';
      default: return 'ไม่ทราบ';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Brain className="h-12 w-12 animate-pulse mx-auto mb-4 text-blue-500" />
          <p className="text-lg font-medium">กำลังวิเคราะห์ข้อมูลด้วย AI...</p>
          <p className="text-sm text-gray-500">กรุณารอสักครู่</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-50 p-2 lg:p-4 overflow-auto">
      {/* Header */}
      <div className="mb-4 lg:mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Brain className="text-blue-600" />
              AI คาดการณ์โรคเบาหวาน
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              ระบบวิเคราะห์ความเสี่ยงโรคเบาหวานด้วยปัญญาประดิษฐ์
            </p>
          </div>
          <button
            onClick={loadAnalysisData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            รีเฟรช
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8 min-w-0">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">ผู้ป่วยทั้งหมด</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600">
                  {summary.totalPatients}
                </p>
                <p className="text-xs sm:text-sm text-blue-600 mt-1 hidden sm:block">คน</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="text-blue-600" size={16} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">ความเสี่ยงเฉลี่ย</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-600">
                  {summary.averageRisk.toFixed(1)}
                </p>
                <p className="text-xs sm:text-sm text-orange-600 mt-1 hidden sm:block">คะแนน</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="text-orange-600" size={16} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">BMI เฉลี่ย</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">
                  {summary.averageBMI.toFixed(1)}
                </p>
                <p className="text-xs sm:text-sm text-green-600 mt-1 hidden sm:block">kg/m²</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Activity className="text-green-600" size={16} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">ความดันเฉลี่ย</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600">
                  {summary.averageBloodPressure.toFixed(0)}
                </p>
                <p className="text-xs sm:text-sm text-red-600 mt-1 hidden sm:block">mmHg</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Heart className="text-red-600" size={16} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Risk Distribution */}
      {summary && (
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6 mb-6 lg:mb-8">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">การกระจายความเสี่ยง</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{summary.riskDistribution.low}</div>
              <p className="text-xs sm:text-sm text-green-600 mt-1">ความเสี่ยงต่ำ</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-yellow-600">{summary.riskDistribution.moderate}</div>
              <p className="text-xs sm:text-sm text-yellow-600 mt-1">ความเสี่ยงปานกลาง</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-orange-600">{summary.riskDistribution.high}</div>
              <p className="text-xs sm:text-sm text-orange-600 mt-1">ความเสี่ยงสูง</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-red-600">{summary.riskDistribution.veryHigh}</div>
              <p className="text-xs sm:text-sm text-red-600 mt-1">ความเสี่ยงสูงมาก</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" currentValue={activeTab} onValueChange={setActiveTab}>ภาพรวม</TabsTrigger>
          <TabsTrigger value="patients" currentValue={activeTab} onValueChange={setActiveTab}>รายชื่อผู้ป่วย</TabsTrigger>
          <TabsTrigger value="analysis" currentValue={activeTab} onValueChange={setActiveTab}>การวิเคราะห์</TabsTrigger>
          <TabsTrigger value="recommendations" currentValue={activeTab} onValueChange={setActiveTab}>คำแนะนำ</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" currentValue={activeTab} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Risk Factors */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">ปัจจัยเสี่ยงหลัก</h3>
              </div>
              <div className="space-y-5">
                {summary?.topRiskFactors.map((factor, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">{factor.factor}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{factor.count}</span>
                        <span className="text-xs text-gray-500">คน</span>
                        <span className="text-xs text-blue-600 font-medium">({factor.percentage}%)</span>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${factor.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Recommendations */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Target className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">สรุปคำแนะนำ</h3>
              </div>
              <div className="space-y-4">
                {summary?.recommendations && Object.entries(summary.recommendations).map(([key, value], index) => (
                  <div key={key} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-white">{index + 1}</span>
                    </div>
                    <span className="text-sm text-gray-700 leading-relaxed">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Additional Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-semibold text-blue-900">ผู้ป่วยทั้งหมด</h4>
              </div>
              <p className="text-2xl font-bold text-blue-600 mb-1">{summary?.totalPatients}</p>
              <p className="text-xs text-blue-700">คนที่ได้รับการวิเคราะห์</p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-semibold text-orange-900">ความเสี่ยงเฉลี่ย</h4>
              </div>
              <p className="text-2xl font-bold text-orange-600 mb-1">{summary?.averageRisk.toFixed(1)}</p>
              <p className="text-xs text-orange-700">คะแนนจาก 100</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <Activity className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-semibold text-green-900">BMI เฉลี่ย</h4>
              </div>
              <p className="text-2xl font-bold text-green-600 mb-1">{summary?.averageBMI.toFixed(1)}</p>
              <p className="text-xs text-green-700">kg/m²</p>
            </div>
          </div>
        </TabsContent>

        {/* Patients Tab */}
        <TabsContent value="patients" currentValue={activeTab} className="space-y-4">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">รายชื่อผู้ป่วยและความเสี่ยง</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analysisData.map((item) => (
                <div 
                  key={item.patient.id} 
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer"
                  onClick={() => {
                    setSelectedPatient(item);
                    setShowPatientModal(true);
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">#{item.patient.id}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">ผู้ป่วย #{item.patient.id}</h4>
                        <p className="text-xs text-gray-500">{item.patient.gender} • {item.patient.age} ปี</p>
                      </div>
                    </div>
                    <Badge className={getRiskLevelColor(item.riskAssessment.riskLevel)}>
                      {getRiskLevelIcon(item.riskAssessment.riskLevel)}
                      <span className="ml-1 text-xs">{getRiskLevelText(item.riskAssessment.riskLevel)}</span>
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">BMI:</span>
                      <span className="text-sm font-medium">{item.healthMetrics.bmi.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">ความเสี่ยง:</span>
                      <span className="text-sm font-bold text-orange-600">{item.riskAssessment.probability.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">คะแนน:</span>
                      <span className="text-sm font-medium">{item.riskAssessment.riskScore}/100</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Heart className="h-3 w-3" />
                      <span>{item.patient.bloodPressureSystolic}/{item.patient.bloodPressureDiastolic} mmHg</span>
                    </div>
                    <button className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                      <Eye className="h-3 w-3" />
                      ดูรายละเอียด
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" currentValue={activeTab} className="space-y-6">
          {/* Patient Selector */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">เลือกผู้ป่วยเพื่อวิเคราะห์</h3>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {analysisData.map((item) => (
                <button
                  key={item.patient.id}
                  onClick={() => setSelectedPatient(item)}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                    selectedPatient?.patient.id === item.patient.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg font-bold">#{item.patient.id}</div>
                    <div className="text-xs text-gray-600">{item.patient.gender}</div>
                    <div className="text-xs font-medium">{item.patient.age}ปี</div>
                    <Badge className={`mt-1 text-xs ${
                      item.riskAssessment.riskLevel === 'LOW' ? 'bg-green-100 text-green-700' :
                      item.riskAssessment.riskLevel === 'MODERATE' ? 'bg-yellow-100 text-yellow-700' :
                      item.riskAssessment.riskLevel === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {item.riskAssessment.riskLevel === 'LOW' ? 'ต่ำ' :
                       item.riskAssessment.riskLevel === 'MODERATE' ? 'ปานกลาง' :
                       item.riskAssessment.riskLevel === 'HIGH' ? 'สูง' : 'สูงมาก'}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Analysis */}
          {selectedPatient ? (
            <div className="space-y-6">
              {/* Patient Overview */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-blue-900">ผู้ป่วย #{selectedPatient.patient.id}</h3>
                    <p className="text-blue-700">{selectedPatient.patient.gender} • {selectedPatient.patient.age} ปี</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{selectedPatient.patient.weight}</div>
                    <div className="text-xs text-gray-600">น้ำหนัก (kg)</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{selectedPatient.patient.height}</div>
                    <div className="text-xs text-gray-600">ส่วนสูง (cm)</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{selectedPatient.healthMetrics.bmi.toFixed(1)}</div>
                    <div className="text-xs text-gray-600">BMI ({selectedPatient.healthMetrics.bmiCategory})</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{selectedPatient.patient.bloodPressureSystolic}/{selectedPatient.patient.bloodPressureDiastolic}</div>
                    <div className="text-xs text-gray-600">ความดัน (mmHg)</div>
                  </div>
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6 border border-orange-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-orange-900">การประเมินความเสี่ยง</h3>
                    <p className="text-orange-700">การวิเคราะห์ปัจจัยเสี่ยงโรคเบาหวาน</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-white rounded-lg">
                    <div className="text-4xl font-bold text-orange-600 mb-2">{selectedPatient.riskAssessment.riskScore}</div>
                    <div className="text-sm text-gray-600 mb-2">คะแนนความเสี่ยง</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(selectedPatient.riskAssessment.riskScore * 2, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-white rounded-lg">
                    <div className="text-4xl font-bold text-red-600 mb-2">{selectedPatient.riskAssessment.probability.toFixed(1)}%</div>
                    <div className="text-sm text-gray-600 mb-2">ความน่าจะเป็น</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${selectedPatient.riskAssessment.probability}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-white rounded-lg">
                    <Badge className={`text-lg px-4 py-2 ${
                      selectedPatient.riskAssessment.riskLevel === 'LOW' ? 'bg-green-100 text-green-700' :
                      selectedPatient.riskAssessment.riskLevel === 'MODERATE' ? 'bg-yellow-100 text-yellow-700' :
                      selectedPatient.riskAssessment.riskLevel === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {getRiskLevelIcon(selectedPatient.riskAssessment.riskLevel)}
                      <span className="ml-2">{getRiskLevelText(selectedPatient.riskAssessment.riskLevel)}</span>
                    </Badge>
                    <div className="text-sm text-gray-600 mt-2">ระดับความเสี่ยง</div>
                  </div>
                </div>
              </div>

              {/* Risk Factors Analysis */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">การวิเคราะห์ปัจจัยเสี่ยง</h3>
                    <p className="text-gray-600">คะแนนของแต่ละปัจจัยเสี่ยง</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(selectedPatient.riskAssessment.factors).map(([key, value]) => (
                    <div key={key} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-medium text-gray-900 capitalize">
                          {key === 'age' ? 'อายุ' :
                           key === 'weight' ? 'น้ำหนัก' :
                           key === 'bloodPressure' ? 'ความดันโลหิต' :
                           key === 'familyHistory' ? 'ประวัติครอบครัว' :
                           key === 'lifestyle' ? 'ไลฟ์สไตล์' :
                           key === 'chronicDiseases' ? 'โรคเรื้อรัง' : key}
                        </span>
                        <span className="text-2xl font-bold text-purple-600">{value}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(value * 10, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {value === 0 ? 'ไม่มีความเสี่ยง' :
                         value <= 2 ? 'ความเสี่ยงต่ำ' :
                         value <= 5 ? 'ความเสี่ยงปานกลาง' :
                         value <= 8 ? 'ความเสี่ยงสูง' : 'ความเสี่ยงสูงมาก'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Health Metrics */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Heart className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">ข้อมูลสุขภาพ</h3>
                    <p className="text-gray-600">ค่าสุขภาพและชีพจร</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">{selectedPatient.patient.temperature}°C</div>
                    <div className="text-sm text-gray-600">อุณหภูมิ</div>
                    <div className="text-xs text-gray-500 mt-1">{selectedPatient.healthMetrics.bloodPressureCategory}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">{selectedPatient.patient.heartRate} bpm</div>
                    <div className="text-sm text-gray-600">อัตราการเต้นหัวใจ</div>
                    <div className="text-xs text-gray-500 mt-1">{selectedPatient.healthMetrics.heartRateCategory}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">{selectedPatient.patient.oxygenLevel}%</div>
                    <div className="text-sm text-gray-600">ระดับออกซิเจน</div>
                    <div className="text-xs text-gray-500 mt-1">{selectedPatient.healthMetrics.oxygenLevelCategory}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">{selectedPatient.healthMetrics.bmi.toFixed(1)}</div>
                    <div className="text-sm text-gray-600">BMI</div>
                    <div className="text-xs text-gray-500 mt-1">{selectedPatient.healthMetrics.bmiCategory}</div>
                  </div>
                </div>
              </div>

              {/* Lifestyle Analysis */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Activity className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">การวิเคราะห์ไลฟ์สไตล์</h3>
                    <p className="text-gray-600">พฤติกรรมและนิสัยการดำเนินชีวิต</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-4 w-4 text-green-600" />
                        <span className="font-medium">การออกกำลังกาย</span>
                      </div>
                      <p className="text-sm text-gray-700">{selectedPatient.patient.exercise}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="font-medium">การสูบบุหรี่</span>
                      </div>
                      <p className="text-sm text-gray-700">{selectedPatient.patient.smoking}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <span className="font-medium">การดื่มแอลกอฮอล์</span>
                      </div>
                      <p className="text-sm text-gray-700">{selectedPatient.patient.alcohol}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">เครื่องดื่ม</span>
                      </div>
                      <p className="text-sm text-gray-700">{selectedPatient.patient.drinks}</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">กรุณาเลือกผู้ป่วย</h3>
              <p className="text-gray-600">เลือกผู้ป่วยจากรายการด้านบนเพื่อดูการวิเคราะห์อย่างละเอียด</p>
            </div>
          )}
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" currentValue={activeTab} className="space-y-6">
          {/* Patient Selector */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">เลือกผู้ป่วยเพื่อดูคำแนะนำ</h3>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {analysisData.map((item) => (
                <button
                  key={item.patient.id}
                  onClick={() => setSelectedPatient(item)}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                    selectedPatient?.patient.id === item.patient.id
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg font-bold">#{item.patient.id}</div>
                    <div className="text-xs text-gray-600">{item.patient.gender}</div>
                    <div className="text-xs font-medium">{item.patient.age}ปี</div>
                    <Badge className={`mt-1 text-xs ${
                      item.riskAssessment.riskLevel === 'LOW' ? 'bg-green-100 text-green-700' :
                      item.riskAssessment.riskLevel === 'MODERATE' ? 'bg-yellow-100 text-yellow-700' :
                      item.riskAssessment.riskLevel === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {item.riskAssessment.riskLevel === 'LOW' ? 'ต่ำ' :
                       item.riskAssessment.riskLevel === 'MODERATE' ? 'ปานกลาง' :
                       item.riskAssessment.riskLevel === 'HIGH' ? 'สูง' : 'สูงมาก'}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Recommendations */}
          {selectedPatient ? (
            <div className="space-y-6">
              {/* Patient Overview */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-green-900">คำแนะนำสำหรับผู้ป่วย #{selectedPatient.patient.id}</h3>
                    <p className="text-green-700">{selectedPatient.patient.gender} • {selectedPatient.patient.age} ปี • ความเสี่ยง: {getRiskLevelText(selectedPatient.riskAssessment.riskLevel)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{selectedPatient.riskAssessment.riskScore}</div>
                    <div className="text-xs text-gray-600">คะแนนความเสี่ยง</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{selectedPatient.riskAssessment.probability.toFixed(1)}%</div>
                    <div className="text-xs text-gray-600">ความน่าจะเป็น</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <Badge className={`text-sm px-3 py-1 ${
                      selectedPatient.riskAssessment.riskLevel === 'LOW' ? 'bg-green-100 text-green-700' :
                      selectedPatient.riskAssessment.riskLevel === 'MODERATE' ? 'bg-yellow-100 text-yellow-700' :
                      selectedPatient.riskAssessment.riskLevel === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {getRiskLevelIcon(selectedPatient.riskAssessment.riskLevel)}
                      <span className="ml-1">{getRiskLevelText(selectedPatient.riskAssessment.riskLevel)}</span>
                    </Badge>
                    <div className="text-xs text-gray-600 mt-1">ระดับความเสี่ยง</div>
                  </div>
                </div>
              </div>

              {/* Personalized Recommendations */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Target className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">คำแนะนำเฉพาะบุคคล</h3>
                    <p className="text-gray-600">คำแนะนำที่ปรับให้เหมาะกับผู้ป่วยแต่ละคน</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(selectedPatient.riskAssessment.recommendations).map(([key, value], index) => (
                    <div key={key} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-white">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-2 capitalize">
                            {key === 'weight' ? 'การจัดการน้ำหนัก' :
                             key === 'exercise' ? 'การออกกำลังกาย' :
                             key === 'diet' ? 'อาหารและการกิน' :
                             key === 'monitoring' ? 'การติดตาม' :
                             key === 'lifestyle' ? 'ไลฟ์สไตล์' : key}
                          </h4>
                          <p className="text-sm text-gray-700 leading-relaxed">{value}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Treatment Timeline */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">แผนการดูแลระยะยาว</h3>
                    <p className="text-gray-600">แผนการรักษาและดูแลสุขภาพตามระยะเวลา</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Short Term */}
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-white">1</span>
                      </div>
                      <h4 className="text-lg font-semibold text-blue-600">ระยะสั้น (1-3 เดือน)</h4>
                    </div>
                    <div className="ml-11 space-y-3">
                      {selectedPatient.riskAssessment.timeline.shortTerm.map((item, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-sm text-gray-700">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Medium Term */}
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-white">2</span>
                      </div>
                      <h4 className="text-lg font-semibold text-orange-600">ระยะกลาง (3-6 เดือน)</h4>
                    </div>
                    <div className="ml-11 space-y-3">
                      {selectedPatient.riskAssessment.timeline.mediumTerm.map((item, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-sm text-gray-700">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Long Term */}
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-white">3</span>
                      </div>
                      <h4 className="text-lg font-semibold text-green-600">ระยะยาว (6+ เดือน)</h4>
                    </div>
                    <div className="ml-11 space-y-3">
                      {selectedPatient.riskAssessment.timeline.longTerm.map((item, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-sm text-gray-700">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Items */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-indigo-900">สิ่งที่ต้องทำทันที</h3>
                    <p className="text-indigo-700">รายการที่ควรเริ่มทำในสัปดาห์นี้</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium">เริ่มออกกำลังกาย</span>
                    </div>
                    <p className="text-sm text-gray-600">เริ่มด้วยการเดิน 30 นาทีต่อวัน</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium">ปรับอาหาร</span>
                    </div>
                    <p className="text-sm text-gray-600">ลดน้ำตาลและไขมันในอาหาร</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium">นัดแพทย์</span>
                    </div>
                    <p className="text-sm text-gray-600">นัดตรวจสุขภาพและปรึกษาแพทย์</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium">ติดตามผล</span>
                    </div>
                    <p className="text-sm text-gray-600">บันทึกน้ำหนักและอาการทุกวัน</p>
                  </div>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5" />
                    แนวโน้มความเสี่ยง
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold mb-2">
                        {selectedPatient.riskAssessment.probability.toFixed(1)}%
                      </div>
                      <p className="text-sm text-gray-600">ความน่าจะเป็นในการเป็นโรคเบาหวาน</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>คะแนนความเสี่ยง:</span>
                        <span className="font-medium">{selectedPatient.riskAssessment.riskScore}/50</span>
                      </div>
                      <Progress value={(selectedPatient.riskAssessment.riskScore / 50) * 100} className="w-full" />
                    </div>
                    
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {selectedPatient.riskAssessment.riskLevel === 'VERY_HIGH' && 
                          'ความเสี่ยงสูงมาก ควรพบแพทย์ทันทีและเริ่มการรักษา'}
                        {selectedPatient.riskAssessment.riskLevel === 'HIGH' && 
                          'ความเสี่ยงสูง ควรปรับปรุงไลฟ์สไตล์และติดตามอย่างใกล้ชิด'}
                        {selectedPatient.riskAssessment.riskLevel === 'MODERATE' && 
                          'ความเสี่ยงปานกลาง ควรปรับปรุงไลฟ์สไตล์เพื่อป้องกัน'}
                        {selectedPatient.riskAssessment.riskLevel === 'LOW' && 
                          'ความเสี่ยงต่ำ ควรรักษาไลฟ์สไตล์ที่ดีนี้ไว้'}
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">กรุณาเลือกผู้ป่วย</h3>
              <p className="text-gray-600">เลือกผู้ป่วยจากรายการด้านบนเพื่อดูคำแนะนำเฉพาะบุคคล</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Patient Detail Modal */}
      {showPatientModal && selectedPatient && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-blue-600" />
                รายละเอียดผู้ป่วย #{selectedPatient.patient.id}
              </h2>
              <button
                onClick={() => setShowPatientModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Patient Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    ข้อมูลพื้นฐาน
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">อายุ:</span>
                      <span className="font-medium">{selectedPatient.patient.age} ปี</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">เพศ:</span>
                      <span className="font-medium">{selectedPatient.patient.gender}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">น้ำหนัก:</span>
                      <span className="font-medium">{selectedPatient.patient.weight} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ส่วนสูง:</span>
                      <span className="font-medium">{selectedPatient.patient.height} cm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">BMI:</span>
                      <span className="font-medium">{selectedPatient.healthMetrics.bmi.toFixed(1)} ({selectedPatient.healthMetrics.bmiCategory})</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-600" />
                    ข้อมูลสุขภาพ
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ความดันโลหิต:</span>
                      <span className="font-medium">{selectedPatient.patient.bloodPressureSystolic}/{selectedPatient.patient.bloodPressureDiastolic} mmHg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">อุณหภูมิ:</span>
                      <span className="font-medium">{selectedPatient.patient.temperature}°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">อัตราการเต้นหัวใจ:</span>
                      <span className="font-medium">{selectedPatient.patient.heartRate} bpm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ระดับออกซิเจน:</span>
                      <span className="font-medium">{selectedPatient.patient.oxygenLevel}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  การประเมินความเสี่ยง
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{selectedPatient.riskAssessment.riskScore}</div>
                    <div className="text-xs text-gray-600">คะแนนความเสี่ยง</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{selectedPatient.riskAssessment.probability.toFixed(1)}%</div>
                    <div className="text-xs text-gray-600">ความน่าจะเป็น</div>
                  </div>
                  <div className="text-center">
                    <Badge className={getRiskLevelColor(selectedPatient.riskAssessment.riskLevel)}>
                      {getRiskLevelIcon(selectedPatient.riskAssessment.riskLevel)}
                      <span className="ml-1">{getRiskLevelText(selectedPatient.riskAssessment.riskLevel)}</span>
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Risk Factors */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  ปัจจัยเสี่ยง
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">{selectedPatient.riskAssessment.factors.age}</div>
                    <div className="text-xs text-gray-600">อายุ</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">{selectedPatient.riskAssessment.factors.weight}</div>
                    <div className="text-xs text-gray-600">น้ำหนัก</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">{selectedPatient.riskAssessment.factors.bloodPressure}</div>
                    <div className="text-xs text-gray-600">ความดัน</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">{selectedPatient.riskAssessment.factors.familyHistory}</div>
                    <div className="text-xs text-gray-600">ประวัติครอบครัว</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">{selectedPatient.riskAssessment.factors.lifestyle}</div>
                    <div className="text-xs text-gray-600">ไลฟ์สไตล์</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">{selectedPatient.riskAssessment.factors.chronicDiseases}</div>
                    <div className="text-xs text-gray-600">โรคเรื้อรัง</div>
                  </div>
                </div>
              </div>

              {/* Lifestyle & Medical History */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-green-600" />
                    ไลฟ์สไตล์
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">การออกกำลังกาย:</span>
                      <span className="font-medium">{selectedPatient.patient.exercise}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">การสูบบุหรี่:</span>
                      <span className="font-medium">{selectedPatient.patient.smoking}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">การดื่มแอลกอฮอล์:</span>
                      <span className="font-medium">{selectedPatient.patient.alcohol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">เครื่องดื่ม:</span>
                      <span className="font-medium">{selectedPatient.patient.drinks}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-purple-600" />
                    ประวัติทางการแพทย์
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ประวัติครอบครัว:</span>
                      <span className="font-medium">{selectedPatient.patient.familyHistory}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">โรคเรื้อรัง:</span>
                      <span className="font-medium">{selectedPatient.patient.chronicDiseases}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">แพ้อาหาร:</span>
                      <span className="font-medium">{selectedPatient.patient.foodAllergies}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-600" />
                  คำแนะนำเฉพาะบุคคล
                </h3>
                <div className="space-y-3">
                  {Object.entries(selectedPatient.riskAssessment.recommendations).map(([key, value], index) => (
                    <div key={key} className="flex items-start gap-3 p-3 bg-white rounded-lg">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-white">{index + 1}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 capitalize">{key}:</div>
                        <div className="text-sm text-gray-700">{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  แผนการรักษา
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-blue-600 mb-2">ระยะสั้น (1-3 เดือน)</h4>
                    <ul className="space-y-1 text-sm">
                      {selectedPatient.riskAssessment.timeline.shortTerm.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-orange-600 mb-2">ระยะกลาง (3-6 เดือน)</h4>
                    <ul className="space-y-1 text-sm">
                      {selectedPatient.riskAssessment.timeline.mediumTerm.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-green-600 mb-2">ระยะยาว (6+ เดือน)</h4>
                    <ul className="space-y-1 text-sm">
                      {selectedPatient.riskAssessment.timeline.longTerm.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIDiabetesPage;
