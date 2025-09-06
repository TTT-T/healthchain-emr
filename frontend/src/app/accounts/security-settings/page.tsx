"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { useRouter } from "next/navigation";
import { 
  Shield, 
  Bell, 
  Smartphone, 
  Eye, 
  Lock, 
  AlertTriangle, 
  Check, 
  X,
  LogOut,
  Clock,
  MapPin,
  Monitor
} from "lucide-react";

export default function SecuritySettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    loginNotifications: true,
    securityAlerts: true,
    dataSharing: false,
    privacyLevel: 'private'
  });
  
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);

  // Load security settings
  useEffect(() => {
    const loadSecuritySettings = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getSecuritySettings();
        
        if (response.success && response.data) {
          const data = response.data;
          setSettings({
            emailNotifications: data.user?.emailNotifications ?? true,
            smsNotifications: data.user?.smsNotifications ?? false,
            loginNotifications: data.user?.loginNotifications ?? true,
            securityAlerts: data.user?.securityAlerts ?? true,
            dataSharing: data.user?.dataSharing ?? false,
            privacyLevel: data.user?.privacyLevel ?? 'private'
          });
          setLoginHistory(data.loginHistory || []);
          setActiveSessions(data.activeSessions || []);
        }
      } catch (error) {
        console.error("Error loading security settings:", error);
        setError("เกิดข้อผิดพลาดในการโหลดการตั้งค่าความปลอดภัย");
      } finally {
        setIsLoading(false);
      }
    };

    loadSecuritySettings();
  }, []);

  const handleSettingChange = (key: string, value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await apiClient.updateSecuritySettings(settings);
      
      if (response.success && response.data) {
        setSuccess('บันทึกการตั้งค่าความปลอดภัยสำเร็จ');
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

  const handleTerminateAllSessions = async () => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะยกเลิกเซสชันทั้งหมด? คุณจะต้องเข้าสู่ระบบใหม่')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.terminateAllSessions();
      
      if (response.success && response.data) {
        setSuccess('ยกเลิกเซสชันทั้งหมดสำเร็จ');
        // Reload active sessions
        const settingsResponse = await apiClient.getSecuritySettings();
        if (settingsResponse.success && settingsResponse.data) {
          setActiveSessions(settingsResponse.data.activeSessions || []);
        }
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.error?.message || 'เกิดข้อผิดพลาดในการยกเลิกเซสชัน');
      }
    } catch (error: any) {
      console.error('Error terminating sessions:', error);
      setError('เกิดข้อผิดพลาดในการยกเลิกเซสชัน');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('th-TH');
  };

  const getDeviceIcon = (userAgent: string) => {
    if (userAgent.includes('Mobile')) return <Smartphone className="h-4 w-4" />;
    if (userAgent.includes('Tablet')) return <Monitor className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">กรุณาเข้าสู่ระบบก่อน</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดการตั้งค่าความปลอดภัย...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">การตั้งค่าความปลอดภัย</h1>
              <p className="text-gray-600">จัดการการตั้งค่าความปลอดภัยและความเป็นส่วนตัว</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Lock className="h-4 w-4" />
            <span>ผู้ใช้: {user.firstName} {user.lastName}</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <X className="h-5 w-5 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-500" />
              <span className="text-green-700">{success}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notification Settings */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Bell className="h-5 w-5 text-blue-600" />
              <span>การแจ้งเตือน</span>
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">การแจ้งเตือนทางอีเมล</label>
                  <p className="text-xs text-gray-500">รับการแจ้งเตือนผ่านอีเมล</p>
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

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">การแจ้งเตือนทาง SMS</label>
                  <p className="text-xs text-gray-500">รับการแจ้งเตือนผ่าน SMS</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.smsNotifications}
                    onChange={(e) => handleSettingChange('smsNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">แจ้งเตือนการเข้าสู่ระบบ</label>
                  <p className="text-xs text-gray-500">แจ้งเตือนเมื่อมีการเข้าสู่ระบบใหม่</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.loginNotifications}
                    onChange={(e) => handleSettingChange('loginNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">การแจ้งเตือนความปลอดภัย</label>
                  <p className="text-xs text-gray-500">แจ้งเตือนเกี่ยวกับความปลอดภัย</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.securityAlerts}
                    onChange={(e) => handleSettingChange('securityAlerts', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Eye className="h-5 w-5 text-green-600" />
              <span>ความเป็นส่วนตัว</span>
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">ระดับความเป็นส่วนตัว</label>
                <select
                  value={settings.privacyLevel}
                  onChange={(e) => handleSettingChange('privacyLevel', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="private">ส่วนตัว</option>
                  <option value="friends">เพื่อน</option>
                  <option value="public">สาธารณะ</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">ควบคุมการเข้าถึงข้อมูลของคุณ</p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">การแชร์ข้อมูล</label>
                  <p className="text-xs text-gray-500">อนุญาตให้แชร์ข้อมูลเพื่อการวิจัย</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.dataSharing}
                    onChange={(e) => handleSettingChange('dataSharing', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Monitor className="h-5 w-5 text-purple-600" />
              <span>เซสชันที่ใช้งานอยู่ ({activeSessions.length})</span>
            </h2>
            <button
              onClick={handleTerminateAllSessions}
              disabled={loading || activeSessions.length === 0}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>ยกเลิกทั้งหมด</span>
            </button>
          </div>
          
          {activeSessions.length > 0 ? (
            <div className="space-y-3">
              {activeSessions.map((session, index) => (
                <div key={session.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getDeviceIcon(session.userAgent)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {session.userAgent.includes('Mobile') ? 'มือถือ' : 
                         session.userAgent.includes('Tablet') ? 'แท็บเล็ต' : 'คอมพิวเตอร์'}
                      </p>
                      <p className="text-xs text-gray-500">{session.ipAddress}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      ใช้งานล่าสุด: {formatDate(session.lastActivity)}
                    </p>
                    <p className="text-xs text-gray-500">
                      หมดอายุ: {formatDate(session.expiresAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">ไม่มีเซสชันที่ใช้งานอยู่</p>
          )}
        </div>

        {/* Login History */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Clock className="h-5 w-5 text-orange-600" />
            <span>ประวัติการเข้าสู่ระบบ</span>
          </h2>
          
          {loginHistory.length > 0 ? (
            <div className="space-y-3">
              {loginHistory.map((login, index) => (
                <div key={login.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {login.success ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {login.success ? 'เข้าสู่ระบบสำเร็จ' : 'เข้าสู่ระบบไม่สำเร็จ'}
                      </p>
                      <p className="text-xs text-gray-500">{login.ipAddress}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{formatDate(login.loginTime)}</p>
                    {login.location && (
                      <p className="text-xs text-gray-500 flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>{login.location}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">ไม่มีประวัติการเข้าสู่ระบบ</p>
          )}
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSaveSettings}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
          </button>
        </div>
      </div>
    </div>
  );
}