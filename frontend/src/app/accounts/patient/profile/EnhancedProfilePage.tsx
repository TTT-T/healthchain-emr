"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  User, 
  Edit3, 
  Save, 
  X, 
  Camera, 
  Heart, 
  Phone, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Calendar, 
  Activity,
  AlertTriangle,
  Shield,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/api';
import AppLayout from '@/components/AppLayout';
import { ProfileFormTabs } from './ProfileFormTabs';

// Comprehensive Profile Interface
interface CompleteProfile {
  // Basic Info
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  
  // Names (4 fields)
  thaiFirstName?: string;
  thaiLastName?: string;
  englishFirstName?: string;
  englishLastName?: string;
  
  // Personal Info
  nationalId?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other';
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  
  // Address Info
  address?: string;
  idCardAddress?: string;
  currentAddress?: string;
  province?: string;
  district?: string;
  postalCode?: string;
  
  // Contact Info
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  
  // Medical Info
  allergies?: string;
  drugAllergies?: string;
  foodAllergies?: string;
  environmentAllergies?: string;
  medicalHistory?: string;
  currentMedications?: string;
  chronicDiseases?: string;
  
  // Physical Info
  weight?: number;
  height?: number;
  bmi?: number;
  
  // Additional Info
  occupation?: string;
  education?: string;
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
  religion?: string;
  race?: string;
  
  // Insurance Info
  insuranceType?: string;
  insuranceNumber?: string;
  insuranceExpiryDate?: string;
  
  // System Info
  profileImage?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  profileCompleted?: boolean;
  
  // Computed
  isProfileComplete?: boolean;
  completionPercentage?: number;
}

interface CompletionStatus {
  completionPercentage: number;
  requiredComplete: boolean;
  missingRequired: string[];
  missingOptional: string[];
  totalFields: number;
  completedFields: number;
}

const EnhancedProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CompleteProfile | null>(null);
  const [completion, setCompletion] = useState<CompletionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<Partial<CompleteProfile>>({});

  // Fetch complete profile
  const fetchCompleteProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // API call using apiClient
      const response = await apiClient.getCompleteProfile();
      
      if (response.statusCode === 200 && response.data) {
        setProfile(response.data);
        setEditedData(response.data);
      } else {
        // Fallback to current user data
        if (user) {
          const fallbackProfile: CompleteProfile = {
            id: user.id,
            username: user.username || '',
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone || '',
            profileCompleted: user.profileCompleted
          };
          setProfile(fallbackProfile);
          setEditedData(fallbackProfile);
        }
      }
      
    } catch (err) {
      logger.error('Error fetching complete profile:', err);
      setError('ไม่สามารถโหลดข้อมูล Profile ได้');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch completion status
  const fetchCompletionStatus = useCallback(async () => {
    try {
      const response = await apiClient.getProfileCompletion();
      
      if (response.statusCode === 200 && response.data) {
        setCompletion(response.data);
      }
    } catch (err) {
      logger.error('Error fetching completion status:', err);
    }
  }, []);

  useEffect(() => {
    fetchCompleteProfile();
    fetchCompletionStatus();
  }, [fetchCompleteProfile, fetchCompletionStatus]);

  // Handle input changes
  const handleInputChange = (field: string, value: any) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save profile
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      const response = await apiClient.updateCompleteProfile(editedData);
      
      if (response.statusCode === 200 && response.data) {
        setProfile(response.data);
        setSuccess('บันทึกข้อมูลสำเร็จ');
        setIsEditing(false);
        
        // Refresh completion status
        await fetchCompletionStatus();
      } else {
        setError(response.error?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch (err) {
      logger.error('Error saving profile:', err);
      setError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setEditedData(profile || {});
    setIsEditing(false);
    setError(null);
  };

  // Delete field
  const handleDeleteField = async (fieldName: string) => {
    if (!window.confirm(`คุณต้องการลบข้อมูล ${fieldName} หรือไม่?`)) {
      return;
    }

    try {
      const response = await apiClient.deleteProfileField(fieldName);

      if (response.statusCode === 200) {
        await fetchCompleteProfile();
        setSuccess(`ลบข้อมูล ${fieldName} สำเร็จ`);
      } else {
        setError('ไม่สามารถลบข้อมูลได้');
      }
    } catch (err) {
      logger.error('Error deleting field:', err);
      setError('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="ข้อมูลส่วนตัว" userType="patient">
        <div className="p-4 md:p-6 space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg p-6">
              <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="ข้อมูลส่วนตัว" userType="patient">
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">ข้อมูลส่วนตัว</h1>
              <p className="text-gray-600">จัดการข้อมูลส่วนตัวและการตั้งค่าของคุณ</p>
            </div>
            <div className="flex items-center gap-4">
              {completion && (
                <div className="text-right">
                  <div className="text-sm text-gray-500">ความสมบูรณ์ของข้อมูล</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {completion.completionPercentage}%
                  </div>
                </div>
              )}
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit3 className="h-4 w-4" />
                  แก้ไขข้อมูล
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Completion Progress */}
          {completion && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">ความสมบูรณ์ของข้อมูล</span>
                <span className="text-sm text-gray-500">
                  {completion.completedFields}/{completion.totalFields} ฟิลด์
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completion.completionPercentage}%` }}
                ></div>
              </div>
              {completion.missingRequired.length > 0 && (
                <div className="mt-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  ข้อมูลที่จำเป็นที่ยังขาด: {completion.missingRequired.join(', ')}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-700">{success}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex flex-wrap gap-4 px-6 pt-6">
              {[
                { key: 'personal', label: 'ข้อมูลส่วนตัว', icon: User },
                { key: 'contact', label: 'ข้อมูลติดต่อ', icon: Phone },
                { key: 'medical', label: 'ข้อมูลทางการแพทย์', icon: Heart },
                { key: 'additional', label: 'ข้อมูลเพิ่มเติม', icon: Briefcase },
                { key: 'insurance', label: 'ประกันสุขภาพ', icon: Shield }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`py-3 px-4 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                      activeTab === tab.key
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            {/* Profile Image */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg p-6 text-center border border-slate-200">
                <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                    {profile?.profileImage ? (
                      <img 
                        src={profile.profileImage} 
                        alt="Profile" 
                        className="w-32 h-32 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-3xl">
                        {profile?.firstName?.[0] || 'U'}{profile?.lastName?.[0] || 'N'}
                      </span>
                    )}
                  </div>
                  {isEditing && (
                    <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg transition-colors">
                      <Camera className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {profile?.firstName} {profile?.lastName}
                </h3>
                {(profile?.thaiFirstName || profile?.thaiLastName) && (
                  <p className="text-gray-600 mb-2">
                    {profile.thaiFirstName} {profile.thaiLastName}
                  </p>
                )}
                <p className="text-sm text-gray-500 mb-2">{profile?.email}</p>
                {profile?.occupation && (
                  <p className="text-sm text-gray-500 flex items-center justify-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    {profile.occupation}
                  </p>
                )}
              </div>
            </div>

            {/* Profile Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg p-6 border border-slate-200">
                <ProfileFormTabs
                  activeTab={activeTab}
                  data={editedData}
                  onChange={handleInputChange}
                  onDeleteField={handleDeleteField}
                  isEditing={isEditing}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default EnhancedProfilePage;