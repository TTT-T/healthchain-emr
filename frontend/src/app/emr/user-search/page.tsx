"use client";
import { useState } from "react";
import { Search, User, Phone, Mail, Calendar, MapPin, ArrowRight, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/api';

interface UserData {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  phone: string;
  birthDate: string;
  gender: string;
  address: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function UserSearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'name' | 'nationalId' | 'phone' | 'email'>('name');
  const [searchResults, setSearchResults] = useState<UserData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError("กรุณากรอกข้อมูลที่ต้องการค้นหา");
      return;
    }

    setIsSearching(true);
    setError(null);
    setSuccess(null);
    
    try {
      logger.(`🔍 Searching for user by ${searchType}:`, searchQuery);
      
      // ค้นหา users จาก API
      const response = await apiClient.searchPatients(searchQuery);
      
      if (response.statusCode === 200 && response.data) {
        setSearchResults(response.data as UserData[]);
        setSuccess(`พบ ${(response.data as UserData[]).length} รายการ`);
        logger.('✅ Users found:', response.data);
      } else {
        setSearchResults([]);
        setError("ไม่พบข้อมูลผู้ใช้ในระบบ กรุณาตรวจสอบข้อมูล");
      }
      
    } catch (error: any) {
      logger.error('❌ Error searching users:', error);
      setError(error.message || "เกิดข้อผิดพลาดในการค้นหา กรุณาลองอีกครั้ง");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectUser = (user: UserData) => {
    // นำข้อมูล user ไปยังหน้า register patient
    const userData = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      nationalId: user.nationalId,
      birthDate: user.birthDate,
      gender: user.gender,
      address: user.address
    };
    
    // เก็บข้อมูลใน sessionStorage เพื่อส่งต่อไปยังหน้า register patient
    sessionStorage.setItem('selectedUserForPatientRegistration', JSON.stringify(userData));
    
    // ไปยังหน้า register patient
    router.push('/emr/register-patient');
  };

  const formatDate = (daring: string) => {
    return new Date(daring).toLocaleDaring('th-TH');
  };

  const getGenderText = (gender: string) => {
    switch (gender) {
      case 'male': return 'ชาย';
      case 'female': return 'หญิง';
      case 'other': return 'อื่นๆ';
      default: return 'ไม่ระบุ';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ค้นหาผู้ใช้เพื่อลงทะเบียนผู้ป่วย
          </h1>
          <p className="text-gray-600">
            ค้นหาผู้ใช้ที่สมัครสมาชิกแล้วเพื่อนำข้อมูลไปลงทะเบียนเป็นผู้ป่วยในระบบ EMR
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Type */}
            <div className="lg:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ประเภทการค้นหา
              </label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">ชื่อ-นามสกุล</option>
                <option value="nationalId">รหัสประจำตัวประชาชน</option>
                <option value="phone">เบอร์โทรศัพท์</option>
                <option value="email">อีเมล</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ข้อมูลที่ต้องการค้นหา
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`กรอก${searchType === 'name' ? 'ชื่อ-นามสกุล' : searchType === 'nationalId' ? 'รหัสประจำตัวประชาชน' : searchType === 'phone' ? 'เบอร์โทรศัพท์' : 'อีเมล'}`}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  {isSearching ? 'กำลังค้นหา...' : 'ค้นหา'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                ผลการค้นหา ({searchResults.length} รายการ)
              </h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {searchResults.map((user) => (
                <div key={user.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Mail className="w-4 h-4" />
                            <span>{user.email}</span>
                          </div>
                          
                          {user.phone && (
                            <div className="flex items-center space-x-1">
                              <Phone className="w-4 h-4" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                          
                          {user.nationalId && (
                            <div className="flex items-center space-x-1">
                              <User className="w-4 h-4" />
                              <span>{user.nationalId}</span>
                            </div>
                          )}
                          
                          {user.birthDate && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(user.birthDate)}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>{getGenderText(user.gender)}</span>
                          </div>
                          
                          {user.address && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span className="truncate">{user.address}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-2 text-xs text-gray-500">
                          สมัครสมาชิกเมื่อ: {formatDate(user.createdAt)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => handleSelectUser(user)}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        เลือกเพื่อลงทะเบียน
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {searchResults.length === 0 && !isSearching && searchQuery && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              ไม่พบข้อมูลผู้ใช้
            </h3>
            <p className="text-gray-600 mb-4">
              ไม่พบผู้ใช้ที่ตรงกับข้อมูลที่ค้นหา กรุณาลองค้นหาด้วยข้อมูลอื่น
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
                setError(null);
                setSuccess(null);
              }}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              ล้างการค้นหา
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
