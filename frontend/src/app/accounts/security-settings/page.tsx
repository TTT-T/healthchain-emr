"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import MedicalHeader from "@/components/MedicalHeader";
import Link from "next/link";

interface SecuritySettings {
  twoFactorEnabled: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  loginAlerts: boolean;
  sessionTimeout: number;
  requirePasswordChange: boolean;
  passwordChangeInterval: number;
  deviceTrust: boolean;
  locationTracking: boolean;
}

interface UserSession {
  id: string;
  deviceInfo: string;
  ipAddress: string;
  userAgent: string;
  location: string;
  isActive: boolean;
  lastActivity: string;
  createdAt: string;
}

export default function SecuritySettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    emailNotifications: true,
    smsNotifications: false,
    loginAlerts: true,
    sessionTimeout: 60,
    requirePasswordChange: false,
    passwordChangeInterval: 90,
    deviceTrust: false,
    locationTracking: false
  });

  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load security settings and sessions
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [settingsResponse, sessionsResponse] = await Promise.all([
          apiClient.getSecuritySettings(),
          apiClient.getUserSessions()
        ]);

        if (settingsResponse.data && !settingsResponse.error) {
          setSettings(settingsResponse.data);
        }

        if (sessionsResponse.data && !sessionsResponse.error) {
          setSessions(sessionsResponse.data);
        }
      } catch (error) {
        console.error('Error loading security data:', error);
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSettingChange = (key: keyof SecuritySettings, value: boolean | number) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await apiClient.updateSecuritySettings(settings);
      
      if (response.data && !response.error) {
        setSuccess('บันทึกการตั้งค่าความปลอดภัยเรียบร้อยแล้ว');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.error?.message || 'เกิดข้อผิดพลาดในการบันทึก');
      }
    } catch (error: any) {
      console.error('Error saving security settings:', error);
      setError('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setLoading(false);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    try {
      const response = await apiClient.terminateSession(sessionId);
      
      if (response.data && !response.error) {
        setSessions(prev => prev.map(session => 
          session.id === sessionId ? { ...session, isActive: false } : session
        ));
        setSuccess('ยกเลิกเซสชันเรียบร้อยแล้ว');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.error?.message || 'เกิดข้อผิดพลาดในการยกเลิกเซสชัน');
      }
    } catch (error: any) {
      console.error('Error terminating session:', error);
      setError('เกิดข้อผิดพลาดในการยกเลิกเซสชัน');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDeviceIcon = (userAgent: string) => {
    if (userAgent.includes('Mobile')) return '📱';
    if (userAgent.includes('Tablet')) return '📱';
    if (userAgent.includes('Windows')) return '💻';
    if (userAgent.includes('Mac')) return '💻';
    if (userAgent.includes('Linux')) return '💻';
    return '🖥️';
  };

  if (isLoading) {
    return (
      <>
        <MedicalHeader 
          title="การตั้งค่าความปลอดภัย" 
          backHref="/accounts/patient/profile" 
          userType={user?.role || "patient"} 
        />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <MedicalHeader 
        title="การตั้งค่าความปลอดภัย" 
        backHref="/accounts/patient/profile" 
        userType={user?.role || "patient"} 
      />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{success}</p>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-white text-xl">
                  🔒
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">การตั้งค่าความปลอดภัย</h2>
                  <p className="text-slate-600">จัดการการตั้งค่าความปลอดภัยและความเป็นส่วนตัว</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Two-Factor Authentication */}
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 text-lg">🔐</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">การยืนยันตัวตน 2 ขั้นตอน</h3>
                      <p className="text-sm text-slate-600">เพิ่มความปลอดภัยด้วยการยืนยันตัวตน 2 ขั้นตอน</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.twoFactorEnabled}
                      onChange={(e) => handleSettingChange('twoFactorEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Email Notifications */}
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600 text-lg">📧</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">การแจ้งเตือนทางอีเมล</h3>
                      <p className="text-sm text-slate-600">รับการแจ้งเตือนเกี่ยวกับกิจกรรมบัญชีทางอีเมล</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Login Alerts */}
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                      <span className="text-amber-600 text-lg">🚨</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">การแจ้งเตือนการเข้าสู่ระบบ</h3>
                      <p className="text-sm text-slate-600">รับการแจ้งเตือนเมื่อมีการเข้าสู่ระบบจากอุปกรณ์ใหม่</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.loginAlerts}
                      onChange={(e) => handleSettingChange('loginAlerts', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Session Timeout */}
                <div className="p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-purple-600 text-lg">⏰</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">ระยะเวลาเซสชัน (นาที)</h3>
                      <p className="text-sm text-slate-600">ระยะเวลาที่เซสชันจะหมดอายุเมื่อไม่มีการใช้งาน</p>
                    </div>
                  </div>
                  <select
                    value={settings.sessionTimeout}
                    onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={15}>15 นาที</option>
                    <option value={30}>30 นาที</option>
                    <option value={60}>1 ชั่วโมง</option>
                    <option value={120}>2 ชั่วโมง</option>
                    <option value={240}>4 ชั่วโมง</option>
                    <option value={480}>8 ชั่วโมง</option>
                  </select>
                </div>

                {/* Password Change Interval */}
                <div className="p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <span className="text-red-600 text-lg">🔄</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">ระยะเวลาเปลี่ยนรหัสผ่าน (วัน)</h3>
                      <p className="text-sm text-slate-600">ระยะเวลาที่แนะนำให้เปลี่ยนรหัสผ่าน</p>
                    </div>
                  </div>
                  <select
                    value={settings.passwordChangeInterval}
                    onChange={(e) => handleSettingChange('passwordChangeInterval', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={30}>30 วัน</option>
                    <option value={60}>60 วัน</option>
                    <option value={90}>90 วัน</option>
                    <option value={180}>180 วัน</option>
                    <option value={365}>1 ปี</option>
                  </select>
                </div>
              </div>

              {/* Save Button */}
              <div className="mt-8 pt-6 border-t border-slate-200">
                <button
                  onClick={handleSaveSettings}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      กำลังบันทึก...
                    </div>
                  ) : (
                    "บันทึกการตั้งค่า"
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Active Sessions */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center text-white text-xl">
                  📱
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">เซสชันที่ใช้งานอยู่</h2>
                  <p className="text-slate-600">จัดการอุปกรณ์ที่เข้าสู่ระบบบัญชีของคุณ</p>
                </div>
              </div>

              <div className="space-y-4">
                {sessions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-500">ไม่พบเซสชันที่ใช้งานอยู่</p>
                  </div>
                ) : (
                  sessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">{getDeviceIcon(session.userAgent)}</div>
                        <div>
                          <h3 className="font-semibold text-slate-800">{session.deviceInfo || 'อุปกรณ์ไม่ทราบ'}</h3>
                          <p className="text-sm text-slate-600">
                            {session.location || 'ตำแหน่งไม่ทราบ'} • {session.ipAddress}
                          </p>
                          <p className="text-xs text-slate-500">
                            เข้าสู่ระบบล่าสุด: {formatDate(session.lastActivity)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {session.isActive && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            ใช้งานอยู่
                          </span>
                        )}
                        {session.isActive && (
                          <button
                            onClick={() => handleTerminateSession(session.id)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
                          >
                            ยกเลิก
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Back to Profile Link */}
          <div className="text-center">
            <Link
              href="/accounts/patient/profile"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
            >
              ← กลับไปยังโปรไฟล์
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
