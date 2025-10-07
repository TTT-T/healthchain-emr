"use client";
import { useState, useEffect } from "react";
import { Search, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PatientService } from '@/services/patientService';
import { HistoryTakingService } from '@/services/historyTakingService';
import { NotificationService } from '@/services/notificationService';
import { PatientDocumentService } from '@/services/patientDocumentService';
import { EnhancedDataService } from '@/services/enhancedDataService';
import { MedicalPatient } from '@/types/api';
import { logger } from '@/lib/logger';
import { getCurrentThailandDateTimeLocal } from '@/utils/thailandTime';

interface Patient {
  id: string;
  hn: string;
  nationalId: string;
  thaiName: string;
  thaiLastName?: string;
  firstName?: string;
  lastName?: string;
  gender: string;
  birth_date: string;
  birthDate?: string;
  birth_year?: number;
  birth_month?: number;
  birth_day?: number;
  queueNumber: string;
  treatmentType: string;
  assignedDoctor: string;
  bloodType?: string;
  drugAllergies?: string;
  foodAllergies?: string;
  chronicDiseases?: string;
  currentMedications?: string;
  weight?: number;
  height?: number;
  vitalSigns?: {
    weight: string;
    height: string;
    bmi: string;
    systolic_bp: string;
    diastolic_bp: string;
    temperature: string;
    heart_rate: string;
    general_condition: string;
  };
}

interface MedicalHistory {
  chiefComplaint: string;
  hpi: string;
  pmh: {
    previousIllness: string;
    surgicalHistory: string;
    hospitalization: string;
  };
  drugAllergy: {
    hasAllergy: string;
    allergyDetails: string;
  };
  currentMedications: string;
  familyHistory: {
    diabetes: boolean;
    hypertension: boolean;
    heartDisease: boolean;
    cancer: boolean;
    other: string;
  };
  socialHistory: {
    smoking: string;
    alcohol: string;
    occupation: string;
    exercise: string;
    other: string;
  };
  pregnancyHistory?: {
    hasBeenPregnant: boolean;
    gestationalDiabetes: boolean;
    polycysticOvarySyndrome: boolean;
    numberOfPregnancies: string;
    largestBabyWeight: string;
    pregnancyComplications: string;
  };
  dietaryHistory: {
    dailySugarIntake: string;
    processedFoodFrequency: string;
    fruitVegetableServings: string;
    fastFoodFrequency: string;
    mealFrequency: string;
  };
    lifestyleFactors: {
      sleepDuration: string;
      sleepQuality: string;
      stressLevel: string;
      physicalActivityDetails: string;
      sedentaryHours: string;
    };
    detailedNutrition: {
      dailyCalorieIntake: string;
      carbohydrateIntake: string;
      proteinIntake: string;
      fatIntake: string;
      fiberIntake: string;
      sugarIntake: string;
      sodiumIntake: string;
      waterIntake: string;
      mealFrequency: string;
      snackingFrequency: string;
      eatingOutFrequency: string;
      processedFoodConsumption: string;
      organicFoodConsumption: string;
      supplementUse: string;
      alcoholConsumption: string;
      caffeineConsumption: string;
    };
    detailedExercise: {
      exerciseType: string;
      exerciseDuration: string;
      exerciseFrequency: string;
      exerciseIntensity: string;
      mets: string;
      heartRateZones: string;
      vo2Max: string;
      strengthTraining: string;
      flexibilityTraining: string;
      balanceTraining: string;
      sportsParticipation: string;
      physicalActivityAtWork: string;
      transportationMethod: string;
      stairsUsage: string;
      walkingSteps: string;
    };
  reviewOfSystems: {
    general: string;
    cardiovascular: string;
    respiratory: string;
    gastroininal: string;
    genitourinary: string;
    neurological: string;
    musculoskeletal: string;
    dermatological: string;
  };
  recordedBy: string;
  recordedTime: string;
  notes: string;
}

export default function HistoryTaking() {
  const { isAuthenticated, user } = useAuth();
  
  // Debug authentication status
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    logger.info('Authentication status:', { 
      isAuthenticated, 
      user: user ? { id: user.id, role: user.role, username: user.username } : null,
      hasToken: !!token,
      tokenLength: token ? token.length : 0
    });
  }, [isAuthenticated, user]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"hn" | "queue">("hn");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<MedicalPatient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("cc");
  
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory>({
    chiefComplaint: "",
    hpi: "",
    pmh: {
      previousIllness: "",
      surgicalHistory: "",
      hospitalization: ""
    },
    drugAllergy: {
      hasAllergy: "no",
      allergyDetails: ""
    },
    currentMedications: "",
    familyHistory: {
      diabetes: false,
      hypertension: false,
      heartDisease: false,
      cancer: false,
      other: ""
    },
    socialHistory: {
      smoking: "never",
      alcohol: "never",
      occupation: "",
      exercise: "none",
      other: ""
    },
    pregnancyHistory: {
      hasBeenPregnant: false,
      gestationalDiabetes: false,
      polycysticOvarySyndrome: false,
      numberOfPregnancies: "",
      largestBabyWeight: "",
      pregnancyComplications: ""
    },
    dietaryHistory: {
      dailySugarIntake: "moderate",
      processedFoodFrequency: "sometimes",
      fruitVegetableServings: "",
      fastFoodFrequency: "monthly",
      mealFrequency: "3"
    },
    lifestyleFactors: {
      sleepDuration: "",
      sleepQuality: "good",
      stressLevel: "moderate",
      physicalActivityDetails: "",
      sedentaryHours: ""
    },
    detailedNutrition: {
      dailyCalorieIntake: "",
      carbohydrateIntake: "",
      proteinIntake: "",
      fatIntake: "",
      fiberIntake: "",
      sugarIntake: "",
      sodiumIntake: "",
      waterIntake: "",
      mealFrequency: "",
      snackingFrequency: "",
      eatingOutFrequency: "",
      processedFoodConsumption: "",
      organicFoodConsumption: "",
      supplementUse: "",
      alcoholConsumption: "",
      caffeineConsumption: ""
    },
    detailedExercise: {
      exerciseType: "",
      exerciseDuration: "",
      exerciseFrequency: "",
      exerciseIntensity: "",
      mets: "",
      heartRateZones: "",
      vo2Max: "",
      strengthTraining: "",
      flexibilityTraining: "",
      balanceTraining: "",
      sportsParticipation: "",
      physicalActivityAtWork: "",
      transportationMethod: "",
      stairsUsage: "",
      walkingSteps: ""
    },
    reviewOfSystems: {
      general: "",
      cardiovascular: "",
      respiratory: "",
      gastroininal: "",
      genitourinary: "",
      neurological: "",
      musculoskeletal: "",
      dermatological: ""
    },
    recordedBy: user?.thaiName || `${user?.firstName} ${user?.lastName}` || "เจ้าหน้าที่",
    recordedTime: getCurrentThailandDateTimeLocal(),
    notes: ""
  });

  const [errors, setErrors] = useState<any>({});

  // Update recordedBy when user changes
  useEffect(() => {
    if (user) {
      const userName = user.thaiName || `${user.firstName} ${user.lastName}` || "เจ้าหน้าที่";
      setMedicalHistory(prev => ({
        ...prev,
        recordedBy: userName
      }));
    }
  }, [user]);

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
        // Find exact match
        const exactMatch = response.data.find((p: any) =>
          searchType === "hn" ? p.hn === searchQuery : p.hn === searchQuery
        );
        
        if (exactMatch) {
          setSelectedPatient(exactMatch);
          setSuccess("พบข้อมูลผู้ป่วยแล้ว");
        } else {
          setError("ไม่พบข้อมูลผู้ป่วย กรุณาตรวจสอบข้อมูล");
        }
      } else {
        setError("ไม่พบข้อมูลผู้ป่วย กรุณาตรวจสอบข้อมูล");
      }
      
    } catch (error) {
      logger.error("Error searching patient:", error);
      setError("เกิดข้อผิดพลาดในการค้นหา กรุณาลองอีกครั้ง");
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    const keys = field.split('.');
    if (keys.length === 1) {
      setMedicalHistory(prev => ({ ...prev, [field]: value }));
    } else if (keys.length === 2) {
      setMedicalHistory(prev => ({
        ...prev,
        [keys[0]]: {
          ...(prev[keys[0] as keyof MedicalHistory] as any),
          [keys[1]]: value
        }
      }));
    }
    
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: any = {};

    if (!selectedPatient) {
      alert("กรุณาเลือกผู้ป่วย");
      return false;
    }

    // Required fields
    if (!medicalHistory.chiefComplaint.trim()) {
      newErrors.chiefComplaint = "กรุณากรอกอาการสำคัญที่มาพบแพทย์";
    }
    if (!medicalHistory.hpi.trim()) {
      newErrors.hpi = "กรุณากรอกประวัติอาการปัจจุบัน";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Create medical history record using VisitService
      const historyData = {
        patientId: selectedPatient!.id,
        chiefComplaint: medicalHistory.chiefComplaint,
        presentIllness: medicalHistory.hpi,
        pastMedicalHistory: medicalHistory.pmh.previousIllness,
        surgicalHistory: medicalHistory.pmh.surgicalHistory,
        drugAllergies: medicalHistory.drugAllergy.hasAllergy === 'yes' ? medicalHistory.drugAllergy.allergyDetails : 'ไม่แพ้ยา',
        currentMedications: medicalHistory.currentMedications,
        familyHistory: JSON.stringify(medicalHistory.familyHistory),
        socialHistory: JSON.stringify(medicalHistory.socialHistory),
        notes: medicalHistory.notes,
        recordedBy: user?.id || 'system'
      };
      
      // Format data for API
      const formattedData = HistoryTakingService.formatHistoryDataForAPI(
        medicalHistory,
        selectedPatient!.id,
        user?.id || 'system'
      );
      
      // Create medical history record using HistoryTakingService
      const response = await HistoryTakingService.createHistoryTaking(formattedData);
      
      if (response.statusCode === 201 && response.data) {
        // Send notification to patient
        await sendPatientNotification(selectedPatient!, response.data);
        
        // Create document for patient
        await createPatientDocument(selectedPatient!, response.data);
        
        setSuccess("🎉 บันทึกประวัติผู้ป่วยสำเร็จ! พร้อมสำหรับขั้นตอนการตรวจร่างกาย\n\n✅ ระบบได้ส่งการแจ้งเตือนและเอกสารให้ผู้ป่วยแล้ว");
        
        // Save detailed nutrition and exercise data for AI analysis
        try {
          // Save detailed nutrition
          const nutritionData = {
            dailyCalories: medicalHistory.detailedNutrition.dailyCalorieIntake ? parseFloat(medicalHistory.detailedNutrition.dailyCalorieIntake) : undefined,
            carbohydrateGrams: medicalHistory.detailedNutrition.carbohydrateIntake ? parseFloat(medicalHistory.detailedNutrition.carbohydrateIntake) : undefined,
            proteinGrams: medicalHistory.detailedNutrition.proteinIntake ? parseFloat(medicalHistory.detailedNutrition.proteinIntake) : undefined,
            fatGrams: medicalHistory.detailedNutrition.fatIntake ? parseFloat(medicalHistory.detailedNutrition.fatIntake) : undefined,
            fiberGrams: medicalHistory.detailedNutrition.fiberIntake ? parseFloat(medicalHistory.detailedNutrition.fiberIntake) : undefined,
            sugarGrams: medicalHistory.detailedNutrition.sugarIntake ? parseFloat(medicalHistory.detailedNutrition.sugarIntake) : undefined,
            sodiumMg: medicalHistory.detailedNutrition.sodiumIntake ? parseFloat(medicalHistory.detailedNutrition.sodiumIntake) : undefined,
            waterIntakeLiters: medicalHistory.detailedNutrition.waterIntake ? parseFloat(medicalHistory.detailedNutrition.waterIntake) : undefined,
            mealFrequency: medicalHistory.detailedNutrition.mealFrequency ? parseInt(medicalHistory.detailedNutrition.mealFrequency) : undefined,
            dietQualityScore: medicalHistory.detailedNutrition.dietQualityScore ? parseInt(medicalHistory.detailedNutrition.dietQualityScore) : undefined,
            eatingOutFrequency: medicalHistory.detailedNutrition.eatingOutFrequency,
            processedFoodConsumption: medicalHistory.detailedNutrition.processedFoodConsumption,
            organicFoodConsumption: medicalHistory.detailedNutrition.organicFoodConsumption,
            supplementUse: medicalHistory.detailedNutrition.supplementUse,
            alcoholConsumption: medicalHistory.detailedNutrition.alcoholConsumption ? parseFloat(medicalHistory.detailedNutrition.alcoholConsumption) : undefined,
            caffeineConsumption: medicalHistory.detailedNutrition.caffeineConsumption ? parseFloat(medicalHistory.detailedNutrition.caffeineConsumption) : undefined,
            assessmentDate: new Date().toISOString(),
            visitId: undefined // Don't link to visits table since this is history-taking data
          };
          
          // Save detailed exercise
          const exerciseData = {
            exerciseType: medicalHistory.detailedExercise.exerciseType,
            durationMinutes: medicalHistory.detailedExercise.exerciseDuration ? parseFloat(medicalHistory.detailedExercise.exerciseDuration) : undefined,
            frequencyPerWeek: medicalHistory.detailedExercise.exerciseFrequency ? parseInt(medicalHistory.detailedExercise.exerciseFrequency) : undefined,
            intensityLevel: medicalHistory.detailedExercise.exerciseIntensity,
            caloriesBurned: medicalHistory.detailedExercise.caloriesBurned ? parseInt(medicalHistory.detailedExercise.caloriesBurned) : undefined,
            heartRateAvg: medicalHistory.detailedExercise.heartRateAvg ? parseInt(medicalHistory.detailedExercise.heartRateAvg) : undefined,
            heartRateMax: medicalHistory.detailedExercise.heartRateMax ? parseInt(medicalHistory.detailedExercise.heartRateMax) : undefined,
            assessmentDate: new Date().toISOString(),
            visitId: undefined // Don't link to visits table since this is history-taking data
          };
          
          // Only save if there's actual data and user is authenticated
          const token = localStorage.getItem('access_token');
          if (isAuthenticated && user && token) {
            logger.info('User appears authenticated with valid token, attempting to save enhanced data...');
            
            const hasNutritionData = Object.values(nutritionData).some(value => 
              value !== undefined && value !== null && value !== ''
            );
            
            const hasExerciseData = Object.values(exerciseData).some(value => 
              value !== undefined && value !== null && value !== ''
            );
            
            let enhancedDataSaved = false;
            
            if (hasNutritionData) {
              try {
                await EnhancedDataService.saveDetailedNutrition(selectedPatient!.id, nutritionData);
                logger.info('Detailed nutrition data saved for AI analysis');
                enhancedDataSaved = true;
              } catch (nutritionError) {
                logger.error('Failed to save nutrition data:', nutritionError);
                // Don't throw - just log the error
              }
            }
            
            if (hasExerciseData) {
              try {
                await EnhancedDataService.saveDetailedExercise(selectedPatient!.id, exerciseData);
                logger.info('Detailed exercise data saved for AI analysis');
                enhancedDataSaved = true;
              } catch (exerciseError) {
                logger.error('Failed to save exercise data:', exerciseError);
                // Don't throw - just log the error
              }
            }
            
            // Update success message if enhanced data was saved
            if (enhancedDataSaved) {
              setSuccess(prev => prev + "\n\n📊 ข้อมูลเพิ่มเติมสำหรับการวิเคราะห์ AI ถูกบันทึกเรียบร้อยแล้ว");
            }
          } else {
            logger.warn('Skipping enhanced data save - user not authenticated or no token', { 
              isAuthenticated, 
              user: user?.id, 
              hasToken: !!token 
            });
          }
        } catch (enhancedError) {
          logger.warn('Failed to save enhanced data, but history was saved:', enhancedError);
          
          // Check if it's an authentication error
          if (enhancedError && typeof enhancedError === 'object' && 'response' in enhancedError) {
            const response = (enhancedError as any).response;
            if (response && response.status === 401) {
              logger.warn('Authentication error when saving enhanced data - user may need to log in again');
              // Don't show error to user as history was saved successfully
            } else {
              logger.warn('Other error when saving enhanced data:', response?.status, response?.data);
            }
          }
          // Don't throw error here as history was saved successfully
        }
        
      } else {
        setError("❌ เกิดข้อผิดพลาดในการบันทึกประวัติผู้ป่วย กรุณาลองใหม่อีกครั้ง");
      }
      
      // Reset form
      setTimeout(() => {
        setSelectedPatient(null);
        setSearchQuery("");
        setSuccess(null);
        setMedicalHistory({
          chiefComplaint: "",
          hpi: "",
          pmh: {
            previousIllness: "",
            surgicalHistory: "",
            hospitalization: ""
          },
          drugAllergy: {
            hasAllergy: "no",
            allergyDetails: ""
          },
          currentMedications: "",
          familyHistory: {
            diabetes: false,
            hypertension: false,
            heartDisease: false,
            cancer: false,
            other: ""
          },
          socialHistory: {
            smoking: "never",
            alcohol: "never",
            occupation: "",
            exercise: "none",
            other: ""
          },
          pregnancyHistory: {
            hasBeenPregnant: false,
            gestationalDiabetes: false,
            polycysticOvarySyndrome: false,
            numberOfPregnancies: "",
            largestBabyWeight: "",
            pregnancyComplications: ""
          },
          dietaryHistory: {
            dailySugarIntake: "moderate",
            processedFoodFrequency: "sometimes",
            fruitVegetableServings: "",
            fastFoodFrequency: "monthly",
            mealFrequency: "3"
          },
          lifestyleFactors: {
            sleepDuration: "",
            sleepQuality: "good",
            stressLevel: "moderate",
            physicalActivityDetails: "",
            sedentaryHours: ""
          },
          reviewOfSystems: {
            general: "",
            cardiovascular: "",
            respiratory: "",
            gastroininal: "",
            genitourinary: "",
            neurological: "",
            musculoskeletal: "",
            dermatological: ""
          },
          recordedBy: user?.thaiName || `${user?.firstName} ${user?.lastName}` || "เจ้าหน้าที่",
          recordedTime: getCurrentThailandDateTimeLocal(),
          notes: "",
          detailedNutrition: {
            dailyCalorieIntake: "",
            carbohydrateIntake: "",
            proteinIntake: "",
            fatIntake: "",
            fiberIntake: "",
            sugarIntake: "",
            sodiumIntake: "",
            waterIntake: "",
            mealFrequency: "",
            snackingFrequency: "",
            eatingOutFrequency: "",
            processedFoodConsumption: "",
            organicFoodConsumption: "",
            supplementUse: "",
            alcoholConsumption: "",
            caffeineConsumption: ""
          },
          detailedExercise: {
            exerciseType: "",
            exerciseDuration: "",
            exerciseFrequency: "",
            exerciseIntensity: "",
            mets: "",
            heartRateZones: "",
            vo2Max: "",
            strengthTraining: "",
            flexibilityTraining: "",
            balanceTraining: "",
            sportsParticipation: "",
            physicalActivityAtWork: "",
            transportationMethod: "",
            stairsUsage: "",
            walkingSteps: ""
          }
        });
      }, 3000);
      
    } catch (error) {
      logger.error("Error saving medical history:", error);
      setError("❌ เกิดข้อผิดพลาดในการบันทึกประวัติผู้ป่วย กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send notification to patient when history is recorded
  const sendPatientNotification = async (
    patient: MedicalPatient,
    historyRecord: any
  ) => {
    try {
      const notificationData = {
        patientHn: patient.hn || patient.hospitalNumber || '',
        patientNationalId: patient.nationalId || '',
        patientName: patient.thaiName && patient.thaiLastName 
          ? `${patient.thaiName} ${patient.thaiLastName}`
          : patient.thaiName || `${patient.firstName} ${patient.lastName}`,
        patientPhone: patient.phone || '',
        patientEmail: patient.email || '',
        recordType: 'history_taking',
        recordId: historyRecord.id,
        chiefComplaint: historyRecord.chiefComplaint,
        recordedBy: historyRecord.recordedBy,
        recordedTime: historyRecord.recordedTime,
        message: `มีการบันทึกประวัติการซักประวัติใหม่สำหรับคุณ ${patient.thaiName && patient.thaiLastName ? `${patient.thaiName} ${patient.thaiLastName}` : patient.thaiName || `${patient.firstName} ${patient.lastName}`} โดย ${user?.thaiName || `${user?.firstName} ${user?.lastName}` || 'เจ้าหน้าที่'}`
      };

      logger.info('History taking record created successfully', {
        patientHn: notificationData.patientHn,
        recordId: historyRecord.id
      });
    } catch (error) {
      logger.error('Failed to send patient notification for history taking:', error);
    }
  };

  const calculateAge = (birthDate: string, patient?: any): number => {
    // Try to use separate birth fields if birthDate is null or empty
    if ((!birthDate || birthDate === '') && patient) {
      if (patient.birth_year && patient.birth_month && patient.birth_day) {
        let birthYear = patient.birth_year;
        let birthMonth = patient.birth_month;
        let birthDay = patient.birth_day;
        
        // Convert Buddhist Era to Christian Era if year >= 2500
        if (birthYear >= 2500) {
          birthYear = birthYear - 543;
        }
        
        const today = new Date();
        let age = today.getFullYear() - birthYear;
        
        // Check if birthday has passed this year
        const currentMonth = today.getMonth() + 1;
        const currentDay = today.getDate();
        
        if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
          age--;
        }
        
        return Math.max(0, age);
      }
    }
    
    if (!birthDate || birthDate === '') return 0;
    
    try {
      let birthYear: number;
      let birthMonth: number;
      let birthDay: number;
      
      if (birthDate.includes('/')) {
        const parts = birthDate.split('/');
        if (parts.length >= 3) {
          birthDay = parseInt(parts[0]);
          birthMonth = parseInt(parts[1]) - 1;
          birthYear = parseInt(parts[2]);
          
          if (birthYear > 2500) {
            birthYear = birthYear - 543;
          }
        } else {
          return 0;
        }
      } else {
        const birth = new Date(birthDate);
        if (isNaN(birth.getTime())) return 0;
        
        birthYear = birth.getFullYear();
        birthMonth = birth.getMonth();
        birthDay = birth.getDate();
      }
      
      const today = new Date();
      let age = today.getFullYear() - birthYear;
      const monthDiff = today.getMonth() - birthMonth;
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDay)) {
        age--;
      }
      
      return Math.max(0, age);
    } catch (error) {
      console.error('Error calculating age:', error);
      return 0;
    }
  };

  const navigationSections = [
    { 
      id: "cc", 
      label: "CC", 
      title: "Chief Complaint", 
      subtitle: "อาการสำคัญ",
      icon: "💬",
      color: "purple",
      description: "อาการหลักที่ผู้ป่วยมาพบแพทย์"
    },
    { 
      id: "hpi", 
      label: "HPI", 
      title: "History of Present Illness", 
      subtitle: "ประวัติอาการปัจจุบัน",
      icon: "📋",
      color: "blue",
      description: "รายละเอียดของอาการปัจจุบัน"
    },
    { 
      id: "pmh", 
      label: "PMH", 
      title: "Past Medical History", 
      subtitle: "ประวัติการรักษา",
      icon: "🏥",
      color: "green",
      description: "โรคประจำตัวและการรักษาในอดีต"
    },
    { 
      id: "drugs", 
      label: "Drugs", 
      title: "Drug Allergy & Medications", 
      subtitle: "ยาและการแพ้",
      icon: "💊",
      color: "red",
      description: "ประวัติแพ้ยาและยาที่ใช้อยู่"
    },
    { 
      id: "family", 
      label: "Family", 
      title: "Family History", 
      subtitle: "ประวัติครอบครัว",
      icon: "👨‍👩‍👧‍👦",
      color: "indigo",
      description: "โรคทางพันธุกรรมในครอบครัว"
    },
    { 
      id: "social", 
      label: "Social", 
      title: "Social History", 
      subtitle: "ประวัติสังคม",
      icon: "🌍",
      color: "teal",
      description: "พฤติกรรมและวิถีชีวิต"
    },
    ...(selectedPatient?.gender === "female" ? [{ 
      id: "pregnancy", 
      label: "Pregnancy", 
      title: "Pregnancy History", 
      subtitle: "ประวัติการตั้งครรภ์",
      icon: "🤱",
      color: "pink",
      description: "ประวัติการตั้งครรภ์และภาวะแทรกซ้อน"
    }] : []),
    { 
      id: "dietary", 
      label: "Diet", 
      title: "Dietary History", 
      subtitle: "ประวัติอาหาร",
      icon: "🍎",
      color: "orange",
      description: "พฤติกรรมการรับประทานอาหาร"
    },
    { 
      id: "lifestyle", 
      label: "Lifestyle", 
      title: "Lifestyle Factors", 
      subtitle: "ปัจจัยวิถีชีวิต",
      icon: "💪",
      color: "yellow",
      description: "การนอน ความเครียด การออกกำลังกาย"
    },
    { 
      id: "ros", 
      label: "ROS", 
      title: "Review of Systems", 
      subtitle: "ตรวจสอบระบบ",
      icon: "🔍",
      color: "cyan",
      description: "การตรวจสอบระบบต่างๆ ของร่างกาย"
    }
  ];

  /**
   * สร้างเอกสารให้ผู้ป่วย
   */
  const createPatientDocument = async (patient: MedicalPatient, historyData: any) => {
    try {
      await PatientDocumentService.createDocumentFromMedicalRecord(
        'history_taking',
        historyData,
        {
          patientHn: patient.hn || '',
          patientNationalId: patient.nationalId || '',
          patientName: patient.thaiName && patient.thaiLastName 
            ? `${patient.thaiName} ${patient.thaiLastName}`
            : patient.thaiName || ''
        },
        user?.id || '',
        user?.thaiName || `${user?.firstName} ${user?.lastName}` || 'เจ้าหน้าที่'
      );
      
      logger.info('Patient document created successfully for history taking', { 
        patientHn: patient.hn,
        recordType: 'history_taking'
      });
    } catch (error) {
      logger.error('Error creating patient document for history taking:', error);
      // ไม่ throw error เพื่อไม่ให้กระทบการบันทึกประวัติ
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="w-full">
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Search className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ซักประวัติผู้ป่วย</h1>
              <p className="text-gray-600">ซักประวัติและบันทึกอาการของผู้ป่วย</p>
            </div>
          </div>
        </div>

        {/* Authentication Warning */}
        {(!isAuthenticated || !localStorage.getItem('access_token')) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">การแจ้งเตือน</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  คุณยังไม่ได้เข้าสู่ระบบหรือ token หมดอายุ การบันทึกข้อมูลเพิ่มเติมสำหรับการวิเคราะห์ AI อาจไม่ทำงาน
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  กรุณาเข้าสู่ระบบใหม่ที่ <a href="/login" className="underline">หน้าเข้าสู่ระบบ</a>
                </p>
              </div>
            </div>
          </div>
        )}

      <div className="space-y-4 md:space-y-6">
        {/* Patient Search Section */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-2">
              ค้นหาผู้ป่วย
            </h2>
            <p className="text-gray-600">ค้นหาผู้ป่วยที่ผ่านการวัดสัญญาณชีพแล้วเพื่อซักประวัติ</p>
          </div>

          <div className="space-y-4">
            {/* Search Type Selection */}
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="queue"
                  checked={searchType === "queue"}
                  onChange={(e) => setSearchType(e.target.value as "hn" | "queue")}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-slate-700">หมายเลขคิว</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="hn"
                  checked={searchType === "hn"}
                  onChange={(e) => setSearchType(e.target.value as "hn" | "queue")}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-slate-700">หมายเลข HN</span>
              </label>
            </div>

            {/* Search Input */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={searchType === "queue" ? "Q001" : "HN2025001"}
                  disabled={isSearching}
                />
              </div>
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

          {/* Selected Patient Info */}
          {selectedPatient && (
            <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-blue-800">ข้อมูลผู้ป่วยสำหรับการซักประวัติ</h3>
                  <p className="text-sm text-blue-600">ข้อมูลพื้นฐานที่จำเป็นสำหรับการซักประวัติ</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Basic Information */}
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                    </svg>
                    ข้อมูลพื้นฐาน
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">HN:</span>
                      <span className="font-bold text-blue-600">{selectedPatient.hn}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">ชื่อ-นามสกุล:</span>
                      <span className="font-medium text-slate-800">
                        {selectedPatient.thaiName && selectedPatient.thaiLastName
                          ? `${selectedPatient.thaiName} ${selectedPatient.thaiLastName}`
                          : selectedPatient.thaiName || selectedPatient.firstName
                          ? `${selectedPatient.thaiName || selectedPatient.firstName} ${selectedPatient.thaiLastName || selectedPatient.lastName || ''}`.trim()
                          : 'ไม่ระบุ'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">อายุ:</span>
                      <span className="font-medium text-slate-800">
                        {calculateAge(selectedPatient.birth_date || selectedPatient.birthDate, selectedPatient)} ปี
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">เพศ:</span>
                      <span className="font-medium text-slate-800">
                        {selectedPatient.gender === 'male' ? 'ชาย' : 
                         selectedPatient.gender === 'female' ? 'หญิง' : 
                         selectedPatient.gender || 'ไม่ระบุ'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                <div className="bg-white rounded-lg p-4 border border-red-100">
                  <h4 className="text-sm font-semibold text-red-800 mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    ข้อมูลทางการแพทย์
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">กรุ๊ปเลือด:</span>
                      <span className="font-medium text-slate-800">{selectedPatient.bloodType || 'ไม่ระบุ'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">แพ้ยา:</span>
                      <span className="font-medium text-red-600">{selectedPatient.drugAllergies || 'ไม่มี'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">แพ้อาหาร:</span>
                      <span className="font-medium text-red-600">{selectedPatient.foodAllergies || 'ไม่มี'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">โรคประจำตัว:</span>
                      <span className="font-medium text-slate-800">{selectedPatient.chronicDiseases || 'ไม่มี'}</span>
                    </div>
                  </div>
                </div>

                {/* Current Medications */}
                <div className="bg-white rounded-lg p-4 border border-green-100">
                  <h4 className="text-sm font-semibold text-green-800 mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    ยาที่ใช้อยู่
                  </h4>
                  <div className="text-sm">
                    <p className="text-slate-600 mb-2">ยาปัจจุบัน:</p>
                    <p className="font-medium text-slate-800 bg-green-50 p-2 rounded text-xs">
                      {selectedPatient.currentMedications || 'ไม่มี'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Vital Signs Information */}
              {/* Vital Signs Information - Disabled for now */}

              {/* Instructions */}
              <div className="mt-4 p-4 bg-blue-100 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">คำแนะนำสำหรับการซักประวัติ:</p>
                    <ul className="space-y-1 text-blue-700">
                      <li>• ตรวจสอบประวัติแพ้ยาและอาหารให้ละเอียดเพื่อความปลอดภัย</li>
                      <li>• ใช้ข้อมูลโรคประจำตัวและยาที่ใช้อยู่เป็นแนวทางในการซักประวัติ</li>
                      <li>• ข้อมูลสัญญาณชีพจะช่วยในการประเมินอาการของผู้ป่วย</li>
                      <li>• เริ่มจาก Chief Complaint แล้วตามด้วย HPI ตามลำดับ</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Medical History Form */}
        {selectedPatient && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Enhanced Tab Navigation */}
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
              <div className="p-4">
                <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  การซักประวัติทางการแพทย์
                </h2>
                <p className="text-sm text-slate-600 mb-4">เลือกหัวข้อการซักประวัติตามลำดับความสำคัญ</p>
                
                {/* Desktop Navigation */}
                <div className="hidden lg:grid lg:grid-cols-5 xl:grid-cols-10 gap-3">
                  {navigationSections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`group relative p-4 rounded-xl transition-all duration-200 border-2 ${
                        activeSection === section.id
                          ? `border-${section.color}-500 bg-${section.color}-50 shadow-lg transform scale-105`
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">{section.icon}</div>
                        <div className="font-bold text-sm text-slate-800 mb-1">{section.label}</div>
                        <div className="text-xs text-slate-600 leading-tight">{section.subtitle}</div>
                      </div>
                      
                      {/* Active indicator */}
                      {activeSection === section.id && (
                        <div className={`absolute -top-1 -right-1 w-3 h-3 bg-${section.color}-500 rounded-full border-2 border-white`}></div>
                      )}
                      
                      {/* Hover tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        {section.description}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Mobile/Tablet Navigation */}
                <div className="lg:hidden">
                  <div className="flex overflow-x-auto space-x-3 pb-2">
                    {navigationSections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`flex-shrink-0 p-3 rounded-lg transition-all duration-200 border-2 ${
                          activeSection === section.id
                            ? `border-${section.color}-500 bg-${section.color}-50 shadow-md`
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{section.icon}</span>
                          <div className="text-left">
                            <div className="font-bold text-sm text-slate-800">{section.label}</div>
                            <div className="text-xs text-slate-600">{section.subtitle}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Progress Indicator */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span>ความคืบหน้า</span>
                    <span>{navigationSections.findIndex(s => s.id === activeSection) + 1} / {navigationSections.length}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${((navigationSections.findIndex(s => s.id === activeSection) + 1) / navigationSections.length) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
                
                {/* Chief Complaint */}
                {activeSection === "cc" && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                          <span className="text-2xl">💬</span>
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-purple-800">Chief Complaint</h3>
                          <p className="text-purple-600">อาการสำคัญที่มาพบแพทย์</p>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-6 border border-purple-100">
                        <label className="block text-lg font-semibold text-slate-700 mb-3">
                          อาการหลักที่ผู้ป่วยมาพบแพทย์ <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={medicalHistory.chiefComplaint}
                          onChange={(e) => handleInputChange("chiefComplaint", e.target.value)}
                          rows={5}
                          className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg ${
                            errors.chiefComplaint ? 'border-red-500' : 'border-slate-300'
                          }`}
                          placeholder="เช่น ปวดท้อง, ไข้, ไอ, ปวดหัด เป็นต้น (อธิบายให้ละเอียด)"
                        />
                        {errors.chiefComplaint && <p className="text-red-500 text-sm mt-2 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {errors.chiefComplaint}
                        </p>}
                      </div>

                      <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                        <div className="flex items-start">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold text-blue-800 mb-3">แนวทางการซักประวัติ Chief Complaint:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-700">
                              <div className="flex items-start">
                                <span className="text-blue-500 mr-2">•</span>
                                <span>ใช้คำของผู้ป่วยเอง ไม่ใช่การวินิจฉัย</span>
                              </div>
                              <div className="flex items-start">
                                <span className="text-blue-500 mr-2">•</span>
                                <span>ระบุระยะเวลาที่มีอาการ</span>
                              </div>
                              <div className="flex items-start">
                                <span className="text-blue-500 mr-2">•</span>
                                <span>ถ้ามีหลายอาการ ให้เรียงตามลำดับความสำคัญ</span>
                              </div>
                              <div className="flex items-start">
                                <span className="text-blue-500 mr-2">•</span>
                                <span>หลีกเลี่ยงการใช้คำทางการแพทย์</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* History of Present Illness */}
                {activeSection === "hpi" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                        <span className="text-2xl mr-3">📋</span>
                        History of Present Illness (ประวัติอาการปัจจุบัน)
                      </h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          รายละเอียดของอาการปัจจุบัน <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={medicalHistory.hpi}
                          onChange={(e) => handleInputChange("hpi", e.target.value)}
                          rows={8}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.hpi ? 'border-red-500' : 'border-slate-300'
                          }`}
                          placeholder="อธิบายรายละเอียดของอาการ ใช้หลัก OPQRST หรือ SOCRATES..."
                        />
                        {errors.hpi && <p className="text-red-500 text-sm mt-1">{errors.hpi}</p>}
                      </div>

                      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start">
                          <svg className="w-5 h-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <div className="text-sm text-amber-800">
                            <p className="font-medium mb-2">OPQRST Framework สำหรับ HPI:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-amber-700">
                              <div><strong>O</strong>nset - เริ่มเมื่อไหร่, อย่างไร</div>
                              <div><strong>P</strong>rovocation - อะไรทำให้เพิ่ม/ลด</div>
                              <div><strong>Q</strong>uality - ลักษณะของอาการ</div>
                              <div><strong>R</strong>adiation - แพร่ไปที่ไหน</div>
                              <div><strong>S</strong>everity - ระดับความรุนแรง 1-10</div>
                              <div><strong>T</strong>ime - ระยะเวลา, ความถี่</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Past Medical History */}
                {activeSection === "pmh" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                        <span className="text-2xl mr-3">🏥</span>
                        Past Medical History (ประวัติการรักษาในอดีต)
                      </h3>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            โรคประจำตัว / โรคเก่า
                          </label>
                          <textarea
                            value={medicalHistory.pmh.previousIllness}
                            onChange={(e) => handleInputChange("pmh.previousIllness", e.target.value)}
                            rows={5}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="เบาหวาน, ความดันสูง, โรคหัวใจ, ไต เป็นต้น"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            ประวัติการผ่าตัด
                          </label>
                          <textarea
                            value={medicalHistory.pmh.surgicalHistory}
                            onChange={(e) => handleInputChange("pmh.surgicalHistory", e.target.value)}
                            rows={5}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="ระบุการผ่าตัด ปี และสาเหตุ"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            ประวัติการเข้าโรงพยาบาล
                          </label>
                          <textarea
                            value={medicalHistory.pmh.hospitalization}
                            onChange={(e) => handleInputChange("pmh.hospitalization", e.target.value)}
                            rows={5}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="เหตุผลในการเข้า รพ. และช่วงเวลา"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Drug Allergy & Current Medications */}
                {activeSection === "drugs" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                        <span className="text-2xl mr-3">💊</span>
                        Drug Allergy & Current Medications
                      </h3>
                      
                      <div className="space-y-6">
                        {/* Drug Allergy */}
                        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                          <h4 className="font-semibold text-red-800 mb-3">แพ้ยา</h4>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                มีประวัติแพ้ยาหรือไม่?
                              </label>
                              <div className="flex space-x-4">
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    value="no"
                                    checked={medicalHistory.drugAllergy.hasAllergy === "no"}
                                    onChange={(e) => handleInputChange("drugAllergy.hasAllergy", e.target.value)}
                                    className="mr-2"
                                  />
                                  <span className="text-sm">ไม่แพ้</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    value="yes"
                                    checked={medicalHistory.drugAllergy.hasAllergy === "yes"}
                                    onChange={(e) => handleInputChange("drugAllergy.hasAllergy", e.target.value)}
                                    className="mr-2"
                                  />
                                  <span className="text-sm">แพ้</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    value="unknown"
                                    checked={medicalHistory.drugAllergy.hasAllergy === "unknown"}
                                    onChange={(e) => handleInputChange("drugAllergy.hasAllergy", e.target.value)}
                                    className="mr-2"
                                  />
                                  <span className="text-sm">ไม่ทราบ</span>
                                </label>
                              </div>
                            </div>

                            {medicalHistory.drugAllergy.hasAllergy === "yes" && (
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                  รายละเอียดการแพ้ยา
                                </label>
                                <textarea
                                  value={medicalHistory.drugAllergy.allergyDetails}
                                  onChange={(e) => handleInputChange("drugAllergy.allergyDetails", e.target.value)}
                                  rows={3}
                                  className="w-full px-4 py-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                  placeholder="ระบุชื่อยาที่แพ้ และอาการที่เกิดขึ้น"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Current Medications */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            ยาที่ใช้ประจำ / ยาที่กำลังทาน
                          </label>
                          <textarea
                            value={medicalHistory.currentMedications}
                            onChange={(e) => handleInputChange("currentMedications", e.target.value)}
                            rows={4}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="ระบุชื่อยา ขนาด ความถี่ เช่น Amlodipine 5mg OD, Metformin 500mg BID"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Family History */}
                {activeSection === "family" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                        <span className="text-2xl mr-3">👨‍👩‍👧‍👦</span>
                        Family History (ประวัติครอบครัว)
                      </h3>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-3">
                            โรคทางพันธุกรรมในครอบครัว
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                              { key: "diabetes", label: "เบาหวาน (Diabetes)" },
                              { key: "hypertension", label: "ความดันโลหิตสูง (Hypertension)" },
                              { key: "heartDisease", label: "โรคหัวใจ (Heart Disease)" },
                              { key: "cancer", label: "มะเร็ง (Cancer)" }
                            ].map((disease) => (
                              <label key={disease.key} className="flex items-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                                <input
                                  type="checkbox"
                                  checked={medicalHistory.familyHistory[disease.key as keyof typeof medicalHistory.familyHistory] as boolean}
                                  onChange={(e) => handleInputChange(`familyHistory.${disease.key}`, e.target.checked)}
                                  className="mr-3"
                                />
                                <span className="text-sm">{disease.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            โรคอื่นๆ ในครอบครัว
                          </label>
                          <textarea
                            value={medicalHistory.familyHistory.other}
                            onChange={(e) => handleInputChange("familyHistory.other", e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="โรคอื่นๆ ที่สำคัญในครอบครัว"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Social History */}
                {activeSection === "social" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                        <span className="text-2xl mr-3">🌍</span>
                        Social History (ประวัติสังคม)
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Smoking */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            การสูบบุหรี่
                          </label>
                          <select
                            value={medicalHistory.socialHistory.smoking}
                            onChange={(e) => handleInputChange("socialHistory.smoking", e.target.value)}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="never">ไม่เคยสูบ</option>
                            <option value="former">เคยสูบ แต่เลิกแล้ว</option>
                            <option value="current">สูบอยู่ปัจจุบัน</option>
                          </select>
                        </div>

                        {/* Alcohol */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            การดื่มเครื่องดื่มแอลกอฮอล์
                          </label>
                          <select
                            value={medicalHistory.socialHistory.alcohol}
                            onChange={(e) => handleInputChange("socialHistory.alcohol", e.target.value)}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="never">ไม่เคยดื่ม</option>
                            <option value="occasional">ดื่มเป็นครั้งคราว</option>
                            <option value="regular">ดื่มเป็นประจำ</option>
                            <option value="former">เคยดื่ม แต่เลิกแล้ว</option>
                          </select>
                        </div>

                        {/* Occupation */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            อาชีพ
                          </label>
                          <input
                            type="text"
                            value={medicalHistory.socialHistory.occupation}
                            onChange={(e) => handleInputChange("socialHistory.occupation", e.target.value)}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="ระบุอาชีพและลักษณะงาน"
                          />
                        </div>

                        {/* Exercise */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            การออกกำลังกาย
                          </label>
                          <select
                            value={medicalHistory.socialHistory.exercise}
                            onChange={(e) => handleInputChange("socialHistory.exercise", e.target.value)}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="none">ไม่ออกกำลังกาย</option>
                            <option value="light">เบา (1-2 ครั้ง/สัปดาห์)</option>
                            <option value="moderate">ปานกลาง (3-4 ครั้ง/สัปดาห์)</option>
                            <option value="vigorous">หนัก (5+ ครั้ง/สัปดาห์)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          ข้อมูลสังคมอื่นๆ
                        </label>
                        <textarea
                          value={medicalHistory.socialHistory.other}
                          onChange={(e) => handleInputChange("socialHistory.other", e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="ข้อมูลเพิ่มเติม เช่น สภาพแวดล้อมในการทำงาน, ความเครียด, การเดินทาง"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Pregnancy History (for women only) */}
                {activeSection === "pregnancy" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                        <span className="text-2xl mr-3">🤱</span>
                        Pregnancy History (ประวัติการตั้งครรภ์) - สำหรับผู้หญิงเท่านั้น
                      </h3>
                      
                      <div className="space-y-4">
                        {/* Has been pregnant */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            เคยตั้งครรภ์หรือไม่
                          </label>
                          <div className="flex space-x-4">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="hasBeenPregnant"
                                value="true"
                                checked={medicalHistory.pregnancyHistory?.hasBeenPregnant === true}
                                onChange={(e) => handleInputChange("pregnancyHistory.hasBeenPregnant", e.target.value === "true")}
                                className="mr-2"
                              />
                              เคย
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="hasBeenPregnant"
                                value="false"
                                checked={medicalHistory.pregnancyHistory?.hasBeenPregnant === false}
                                onChange={(e) => handleInputChange("pregnancyHistory.hasBeenPregnant", e.target.value === "true")}
                                className="mr-2"
                              />
                              ไม่เคย
                            </label>
                          </div>
                        </div>

                        {medicalHistory.pregnancyHistory?.hasBeenPregnant && (
                          <>
                            {/* Gestational Diabetes */}
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                เคยเป็นเบาหวานขณะตั้งครรภ์หรือไม่ <span className="text-red-500 text-xs">(สำคัญมาก!)</span>
                              </label>
                              <div className="flex space-x-4">
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name="gestationalDiabetes"
                                    value="true"
                                    checked={medicalHistory.pregnancyHistory?.gestationalDiabetes === true}
                                    onChange={(e) => handleInputChange("pregnancyHistory.gestationalDiabetes", e.target.value === "true")}
                                    className="mr-2"
                                  />
                                  เคย
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name="gestationalDiabetes"
                                    value="false"
                                    checked={medicalHistory.pregnancyHistory?.gestationalDiabetes === false}
                                    onChange={(e) => handleInputChange("pregnancyHistory.gestationalDiabetes", e.target.value === "true")}
                                    className="mr-2"
                                  />
                                  ไม่เคย
                                </label>
                              </div>
                            </div>

                            {/* PCOS */}
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                เคยได้รับการวินิจฉัยว่าเป็น PCOS (Polycystic Ovary Syndrome) หรือไม่
                              </label>
                              <div className="flex space-x-4">
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name="polycysticOvarySyndrome"
                                    value="true"
                                    checked={medicalHistory.pregnancyHistory?.polycysticOvarySyndrome === true}
                                    onChange={(e) => handleInputChange("pregnancyHistory.polycysticOvarySyndrome", e.target.value === "true")}
                                    className="mr-2"
                                  />
                                  เคย
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name="polycysticOvarySyndrome"
                                    value="false"
                                    checked={medicalHistory.pregnancyHistory?.polycysticOvarySyndrome === false}
                                    onChange={(e) => handleInputChange("pregnancyHistory.polycysticOvarySyndrome", e.target.value === "true")}
                                    className="mr-2"
                                  />
                                  ไม่เคย
                                </label>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Number of pregnancies */}
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                  จำนวนครั้งที่ตั้งครรภ์
                                </label>
                                <input
                                  type="number"
                                  value={medicalHistory.pregnancyHistory?.numberOfPregnancies}
                                  onChange={(e) => handleInputChange("pregnancyHistory.numberOfPregnancies", e.target.value)}
                                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="จำนวนครั้ง"
                                  min="0"
                                />
                              </div>

                              {/* Largest baby weight */}
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                  น้ำหนักลูกที่คลอดมากที่สุด (กิโลกรัม) <span className="text-xs text-gray-500">(&gt;4 กก. = เสี่ยง)</span>
                                </label>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={medicalHistory.pregnancyHistory?.largestBabyWeight}
                                  onChange={(e) => handleInputChange("pregnancyHistory.largestBabyWeight", e.target.value)}
                                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="เช่น 3.2"
                                />
                              </div>
                            </div>

                            {/* Pregnancy complications */}
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                ภาวะแทรกซ้อนระหว่างตั้งครรภ์
                              </label>
                              <textarea
                                value={medicalHistory.pregnancyHistory?.pregnancyComplications}
                                onChange={(e) => handleInputChange("pregnancyHistory.pregnancyComplications", e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="เช่น ความดันสูง, เบาหวาน, คลื่นไส้อาเจียนรุนแรง"
                              />
                            </div>
                          </>
                        )}
                      </div>

                      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start">
                          <span className="text-amber-600 text-lg mr-2">⚠️</span>
                          <div className="text-sm text-amber-800">
                            <p className="font-medium mb-1">ความสำคัญของประวัติการตั้งครรภ์:</p>
                            <ul className="space-y-1 text-amber-700">
                              <li>• เบาหวานขณะตั้งครรภ์เพิ่มความเสี่ยงเบาหวาน Type 2 ในอนาคต</li>
                              <li>• PCOS เป็นปัจจัยเสี่ยงสำคัญต่อเบาหวาน</li>
                              <li>• ลูกน้ำหนักเกิน 4 กก. บ่งชี้ว่าแม่อาจมีน้ำตาลในเลือดสูง</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Dietary History */}
                {activeSection === "dietary" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                        <span className="text-2xl mr-3">🍎</span>
                        Dietary History (ประวัติการรับประทานอาหาร)
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Daily sugar intake */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              การบริโภคน้ำตาล/ของหวานต่อวัน
                            </label>
                            <select
                              value={medicalHistory.dietaryHistory.dailySugarIntake}
                              onChange={(e) => handleInputChange("dietaryHistory.dailySugarIntake", e.target.value)}
                              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="low">น้อย (1-2 ชิ้น/วัน)</option>
                              <option value="moderate">ปานกลาง (3-4 ชิ้น/วัน)</option>
                              <option value="high">มาก (5+ ชิ้น/วัน)</option>
                            </select>
                          </div>

                          {/* Processed food frequency */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              ความถี่การกินอาหารแปรรูป
                            </label>
                            <select
                              value={medicalHistory.dietaryHistory.processedFoodFrequency}
                              onChange={(e) => handleInputChange("dietaryHistory.processedFoodFrequency", e.target.value)}
                              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="rare">นาน ๆ ครั้ง</option>
                              <option value="sometimes">บางครั้ง (1-2 ครั้ง/สัปดาห์)</option>
                              <option value="often">บ่อย (3-4 ครั้ง/สัปดาห์)</option>
                              <option value="daily">ทุกวัน</option>
                            </select>
                          </div>

                          {/* Fruit & vegetable servings */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              ผักและผลไม้ต่อวัน (จำนวนส่วน)
                            </label>
                            <input
                              type="number"
                              value={medicalHistory.dietaryHistory.fruitVegetableServings}
                              onChange={(e) => handleInputChange("dietaryHistory.fruitVegetableServings", e.target.value)}
                              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="เช่น 5 (แนะนำ 5-9 ส่วน/วัน)"
                              min="0"
                            />
                          </div>

                          {/* Fast food frequency */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              ความถี่การกินอาหารจานด่วน
                            </label>
                            <select
                              value={medicalHistory.dietaryHistory.fastFoodFrequency}
                              onChange={(e) => handleInputChange("dietaryHistory.fastFoodFrequency", e.target.value)}
                              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="never">ไม่เคย</option>
                              <option value="monthly">เดือนละครั้ง</option>
                              <option value="weekly">สัปดาห์ละครั้ง</option>
                              <option value="daily">ทุกวัน</option>
                            </select>
                          </div>

                          {/* Meal frequency */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              จำนวนมื้ออาหารต่อวัน
                            </label>
                            <select
                              value={medicalHistory.dietaryHistory.mealFrequency}
                              onChange={(e) => handleInputChange("dietaryHistory.mealFrequency", e.target.value)}
                              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="1">1 มื้อ</option>
                              <option value="2">2 มื้อ</option>
                              <option value="3">3 มื้อ</option>
                              <option value="4">4+ มื้อ</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start">
                          <span className="text-green-600 text-lg mr-2">💡</span>
                          <div className="text-sm text-green-800">
                            <p className="font-medium mb-1">แนวทางการประเมินอาหาร:</p>
                            <ul className="space-y-1 text-green-700">
                              <li>• น้ำตาลสูง + อาหารแปรรูปบ่อย = เสี่ยงเบาหวาน</li>
                              <li>• ผักผลไม้น้อยกว่า 5 ส่วน/วัน = ขาดไฟเบอร์</li>
                              <li>• อาหารจานด่วนบ่อย = ไขมันและน้ำตาลสูง</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lifestyle Factors */}
                {activeSection === "lifestyle" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                        <span className="text-2xl mr-3">💪</span>
                        Lifestyle Factors (ปัจจัยวิถีชีวิต)
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Sleep duration */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              ชั่วโมงการนอนต่อคืน
                            </label>
                            <input
                              type="number"
                              step="0.5"
                              value={medicalHistory.lifestyleFactors.sleepDuration}
                              onChange={(e) => handleInputChange("lifestyleFactors.sleepDuration", e.target.value)}
                              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="เช่น 7.5"
                              min="0"
                              max="24"
                            />
                          </div>

                          {/* Sleep quality */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              คุณภาพการนอน
                            </label>
                            <select
                              value={medicalHistory.lifestyleFactors.sleepQuality}
                              onChange={(e) => handleInputChange("lifestyleFactors.sleepQuality", e.target.value)}
                              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="poor">แย่ (นอนไม่หลับ/ตื่นบ่อย)</option>
                              <option value="fair">ปานกลาง</option>
                              <option value="good">ดี</option>
                              <option value="excellent">ดีมาก</option>
                            </select>
                          </div>

                          {/* Stress level */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              ระดับความเครียด
                            </label>
                            <select
                              value={medicalHistory.lifestyleFactors.stressLevel}
                              onChange={(e) => handleInputChange("lifestyleFactors.stressLevel", e.target.value)}
                              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="low">น้อย</option>
                              <option value="moderate">ปานกลาง</option>
                              <option value="high">สูง</option>
                              <option value="severe">รุนแรง</option>
                            </select>
                          </div>

                          {/* Sedentary hours */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              ชั่วโมงการนั่งต่อวัน (ทำงาน/ดู TV)
                            </label>
                            <input
                              type="number"
                              step="0.5"
                              value={medicalHistory.lifestyleFactors.sedentaryHours}
                              onChange={(e) => handleInputChange("lifestyleFactors.sedentaryHours", e.target.value)}
                              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="เช่น 8"
                              min="0"
                              max="24"
                            />
                          </div>
                        </div>

                        {/* Physical activity details */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            รายละเอียดการออกกำลังกาย
                          </label>
                          <textarea
                            value={medicalHistory.lifestyleFactors.physicalActivityDetails}
                            onChange={(e) => handleInputChange("lifestyleFactors.physicalActivityDetails", e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="เช่น เดิน 30 นาที 3 ครั้ง/สัปดาห์, เล่นโยคะ, ว่ายน้ำ, ยิม"
                          />
                        </div>
                      </div>

                      <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-start">
                          <span className="text-purple-600 text-lg mr-2">🎯</span>
                          <div className="text-sm text-purple-800">
                            <p className="font-medium mb-1">ผลกระทบต่อความเสี่ยงเบาหวาน:</p>
                            <ul className="space-y-1 text-purple-700">
                              <li>• นอนน้อยกว่า 6 ชม. หรือมากกว่า 9 ชม. = เพิ่มความเสี่ยง</li>
                              <li>• ความเครียดสูง = ฮอร์โมน cortisol สูง → น้ำตาลในเลือดขึ้น</li>
                              <li>• นั่งนาน &gt;8 ชม./วัน = ลดการใช้น้ำตาล</li>
                              <li>• ออกกำลังกายสม่ำเสมอ = ลดความเสี่ยงมากถึง 50%</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Review of Systems */}
                {activeSection === "ros" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                        <span className="text-2xl mr-3">🔍</span>
                        Review of Systems (ตรวจสอบระบบต่างๆ)
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                          { key: "general", label: "ทั่วไป (General)", placeholder: "น้ำหนักลด/เพิ่ม, เหนื่อยง่าย, ไข้" },
                          { key: "cardiovascular", label: "หัวใจและหลอดเลือด", placeholder: "เจ็บแน่นหน้าอก, หายใจลำบาก, บวม" },
                          { key: "respiratory", label: "ระบบหายใจ", placeholder: "ไอ, เสียงแหบ, หายใจลำบาก" },
                          { key: "gastroininal", label: "ระบบทางเดินอาหาร", placeholder: "คลื่นไส้, อาเจียน, ท้องเสีย, ท้องผูก" },
                          { key: "genitourinary", label: "ระบบปัสสาวะและสืบพันธุ์", placeholder: "ปัสสาวะขัด, เจ็บปวด, เลือด" },
                          { key: "neurological", label: "ระบบประสาท", placeholder: "ปวดหัว, เวียนหัว, ชา, อ่อนแรง" },
                          { key: "musculoskeletal", label: "กล้ามเนื้อและกระดูก", placeholder: "ปวดข้อ, บวม, แข็งเกร็ง" },
                          { key: "dermatological", label: "ผิวหนัง", placeholder: "ผื่น, คัน, เปลี่ยนสี" }
                        ].map((system) => (
                          <div key={system.key}>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              {system.label}
                            </label>
                            <textarea
                              value={medicalHistory.reviewOfSystems[system.key as keyof typeof medicalHistory.reviewOfSystems]}
                              onChange={(e) => handleInputChange(`reviewOfSystems.${system.key}`, e.target.value)}
                              rows={3}
                              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder={system.placeholder}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Recording Information & Notes */}
                <div className="border-t pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        ผู้บันทึก
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={medicalHistory.recordedBy}
                          readOnly
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 cursor-not-allowed"
                          placeholder="ชื่อแพทย์ผู้บันทึก"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">แสดงชื่อของเจ้าหน้าที่ที่เข้าสู่ระบบ</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        เวลาที่บันทึก
                      </label>
                      <input
                        type="datetime-local"
                        value={medicalHistory.recordedTime}
                        onChange={(e) => handleInputChange("recordedTime", e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      หมายเหตุเพิ่มเติม
                    </label>
                    <textarea
                      value={medicalHistory.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ข้อมูลเพิ่มเติมที่สำคัญ"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="border-t pt-6">
                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPatient(null);
                        setSearchQuery("");
                      }}
                      className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`px-8 py-3 rounded-lg font-medium transition-all ${
                        isSubmitting
                          ? 'bg-blue-400 text-white cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          กำลังบันทึก...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          บันทึกประวัติผู้ป่วย
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-green-700 whitespace-pre-line">{success}</div>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">คำแนะนำการซักประวัติ:</p>
              <ul className="space-y-1 text-blue-700">
                <li>• ใช้ Tab Navigation ด้านบนเพื่อเปลี่ยนหัวข้อการซักประวัติ</li>
                <li>• Chief Complaint และ HPI เป็นข้อมูลที่จำเป็น</li>
                <li>• ตรวจสอบประวัติแพ้ยาให้ละเอียดเพื่อความปลอดภัย</li>
                <li>• ข้อมูลจะถูกส่งต่อให้การตรวจร่างกายในขั้นตอนถัดไป</li>
              </ul>
            </div>
          </div>          </div>
        </div>
      </div>
    </div>
  );
}
