import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Apply authentication to all AI routes
router.use(authenticate);

/**
 * 2. AI Risk Assessment System
 * ระบบคาดการณ์ความเสี่ยงที่แสดงผลบนหน้าเว็บไซต์
 */

// Diabetes risk assessment
router.post('/risk-assessment/diabetes', authorize(['doctor', 'nurse', 'admin']), (req, res) => {
  // Mock AI analysis
  const riskData = {
    patientId: req.body.patientId,
    riskLevel: 'moderate', // low, moderate, high
    probability: 0.65, // 65% chance
    factors: [
      { factor: 'BMI', value: 28.5, risk: 'moderate' },
      { factor: 'Age', value: 45, risk: 'low' },
      { factor: 'Family History', value: true, risk: 'high' },
      { factor: 'Blood Pressure', value: '140/90', risk: 'moderate' }
    ],
    recommendations: [
      'Regular exercise routine',
      'Dietary modifications',
      'Blood glucose monitoring',
      'Follow-up in 3 months'
    ],
    analysisDate: new Date().toISOString()
  };
  
  res.json({
    success: true,
    message: 'Diabetes risk assessment completed',
    data: riskData
  });
});

// Hypertension risk assessment
router.post('/risk-assessment/hypertension', authorize(['doctor', 'nurse', 'admin']), (req, res) => {
  // Mock AI analysis
  const riskData = {
    patientId: req.body.patientId,
    riskLevel: 'high', // low, moderate, high
    probability: 0.78, // 78% chance
    factors: [
      { factor: 'Current BP', value: '160/100', risk: 'high' },
      { factor: 'Age', value: 55, risk: 'moderate' },
      { factor: 'Smoking', value: true, risk: 'high' },
      { factor: 'Cholesterol', value: 240, risk: 'moderate' }
    ],
    recommendations: [
      'Immediate lifestyle changes',
      'Medication consultation',
      'Daily BP monitoring',
      'Follow-up in 2 weeks'
    ],
    analysisDate: new Date().toISOString()
  };
  
  res.json({
    success: true,
    message: 'Hypertension risk assessment completed',
    data: riskData
  });
});

// Heart disease risk assessment
router.post('/risk-assessment/heart-disease', authorize(['doctor', 'nurse', 'admin']), (req, res) => {
  // Mock AI analysis
  const riskData = {
    patientId: req.body.patientId,
    riskLevel: 'low', // low, moderate, high
    probability: 0.25, // 25% chance
    factors: [
      { factor: 'Cholesterol', value: 180, risk: 'low' },
      { factor: 'Exercise', value: 'regular', risk: 'low' },
      { factor: 'Diet', value: 'healthy', risk: 'low' },
      { factor: 'Stress Level', value: 'moderate', risk: 'moderate' }
    ],
    recommendations: [
      'Continue current lifestyle',
      'Annual checkups',
      'Stress management',
      'Monitor cholesterol levels'
    ],
    analysisDate: new Date().toISOString()
  };
  
  res.json({
    success: true,
    message: 'Heart disease risk assessment completed',
    data: riskData
  });
});

// Get patient risk history
router.get('/risk-assessment/history/:patientId', authorize(['doctor', 'nurse', 'admin']), (req, res) => {
  // Mock historical data
  const historyData = [
    {
      id: '1',
      type: 'diabetes',
      riskLevel: 'moderate',
      probability: 0.65,
      date: '2024-01-15',
      doctor: 'Dr. Smith'
    },
    {
      id: '2',
      type: 'hypertension',
      riskLevel: 'high',
      probability: 0.78,
      date: '2024-01-10',
      doctor: 'Dr. Johnson'
    }
  ];
  
  res.json({
    success: true,
    message: 'Risk assessment history retrieved',
    data: historyData
  });
});

// Real-time risk monitoring dashboard
router.get('/dashboard/risk-overview', authorize(['doctor', 'nurse', 'admin']), (req, res) => {
  // Mock dashboard data
  const dashboardData = {
    totalPatients: 1250,
    highRiskPatients: 87,
    moderateRiskPatients: 234,
    lowRiskPatients: 929,
    recentAssessments: [
      { id: 1, patientName: 'John Doe', riskType: 'diabetes', level: 'high', date: '2024-01-20' },
      { id: 2, patientName: 'Jane Smith', riskType: 'hypertension', level: 'moderate', date: '2024-01-19' }
    ],
    riskTrends: {
      diabetes: { trend: 'increasing', percentage: 12.5 },
      hypertension: { trend: 'stable', percentage: 18.7 },
      heartDisease: { trend: 'decreasing', percentage: 8.3 }
    }
  };
  
  res.json({
    success: true,
    message: 'Risk overview dashboard data retrieved',
    data: dashboardData
  });
});

export default router;
