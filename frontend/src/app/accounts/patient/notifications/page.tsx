"use client";
import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";

interface Notification {
  id: string;
  type: 'appointment' | 'lab_result' | 'medication' | 'system' | 'consent' | 'billing';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  actionRequired?: boolean;
  relatedId?: string;
}

export default function Notifications() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (user?.id) {
        const response = await apiClient.getPatientNotifications(user.id);
        if (response.success && response.data) {
          setNotifications(response.data);
        } else {
          setError(response.error?.message || "ไม่สามารถดึงข้อมูลการแจ้งเตือนได้");
        }
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูลการแจ้งเตือน");
    } finally {
      setIsLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "consent": return "🔐";
      case "lab_result": return "🧪";
      case "appointment": return "📅";
      case "medication": return "💊";
      case "billing": return "💳";
      case "system": return "⚙️";
      default: return "📢";
    }
  };

  const getNotificationColor = (type: string, isRead: boolean) => {
    const colors = {
      consent: isRead ? "bg-purple-50 border-purple-200" : "bg-purple-100 border-purple-300",
      lab_result: isRead ? "bg-green-50 border-green-200" : "bg-green-100 border-green-300",
      appointment: isRead ? "bg-blue-50 border-blue-200" : "bg-blue-100 border-blue-300",
      medication: isRead ? "bg-orange-50 border-orange-200" : "bg-orange-100 border-orange-300",
      billing: isRead ? "bg-yellow-50 border-yellow-200" : "bg-yellow-100 border-yellow-300",
      system: isRead ? "bg-gray-50 border-gray-200" : "bg-gray-100 border-gray-300"
    };
    return colors[type as keyof typeof colors] || "bg-gray-50 border-gray-200";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "text-red-600 bg-red-50 border-red-200";
      case "high": return "text-orange-600 bg-orange-50 border-orange-200";
      case "normal": return "text-blue-600 bg-blue-50 border-blue-200";
      case "low": return "text-gray-800 bg-gray-50 border-gray-200";
      default: return "text-gray-800 bg-gray-50 border-gray-200";
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "urgent": return "ด่วนมาก";
      case "high": return "สำคัญ";
      case "normal": return "ปกติ";
      case "low": return "ไม่เร่งด่วน";
      default: return "ปกติ";
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(notifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, isRead: true }
        : notification
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, isRead: true })));
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(notifications.filter(notification => notification.id !== notificationId));
  };

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !notification.isRead;
    if (activeTab === "action") return notification.actionRequired;
    return notification.type === activeTab;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const actionRequiredCount = notifications.filter(n => n.actionRequired).length;

  return (
    <AppLayout title="การแจ้งเตือน" userType="patient">
      <div className="bg-slate-50 min-h-screen p-3 sm:p-4 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          
          {/* Header */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 mb-2">การแจ้งเตือน</h2>
                <p className="text-slate-800">ติดตามข่าวสารและการแจ้งเตือนสำคัญของคุณ</p>
              </div>
              
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    อ่านทั้งหมด ({unreadCount})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-lg sm:rounded-xl border border-slate-200 p-4 text-center">
              <div className="text-2xl font-bold text-slate-800">{notifications.length}</div>
              <div className="text-sm text-slate-800">ทั้งหมด</div>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl border border-slate-200 p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{unreadCount}</div>
              <div className="text-sm text-slate-600">ยังไม่อ่าน</div>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl border border-slate-200 p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{actionRequiredCount}</div>
              <div className="text-sm text-slate-600">ต้องดำเนินการ</div>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl border border-slate-200 p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{notifications.filter(n => n.type === 'lab_result').length}</div>
              <div className="text-sm text-slate-600">ผลตรวจ</div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="bg-white rounded-lg sm:rounded-xl border border-slate-200 shadow-sm">
            <div className="p-4 border-b border-slate-200">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "all", label: "ทั้งหมด", icon: "📋", count: notifications.length },
                  { id: "unread", label: "ยังไม่อ่าน", icon: "🆕", count: unreadCount },
                  { id: "action", label: "ต้องดำเนินการ", icon: "⚡", count: actionRequiredCount },
                  { id: "consent", label: "การยินยอม", icon: "🔐" },
                  { id: "appointment", label: "นัดหมาย", icon: "📅" },
                  { id: "lab_result", label: "ผลตรวจ", icon: "🧪" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ease-out flex items-center gap-2 ${
                      activeTab === tab.id
                        ? "bg-blue-500 text-white shadow-md"
                        : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        activeTab === tab.id 
                          ? "bg-white/20 text-white" 
                          : "bg-slate-200 text-slate-600"
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications List */}
            <div className="p-4">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📭</div>
                  <h3 className="text-lg font-medium text-slate-800 mb-2">ไม่มีการแจ้งเตือน</h3>
                  <p className="text-slate-600">ยังไม่มีการแจ้งเตือนในหมวดนี้</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredNotifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                        getNotificationColor(notification.type, notification.isRead)
                      } ${!notification.isRead ? 'ring-2 ring-blue-100' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="text-2xl flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className={`font-medium ${!notification.isRead ? 'text-slate-900 font-semibold' : 'text-slate-800'}`}>
                                {notification.title}
                              </h3>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(notification.priority)}`}>
                                  {getPriorityText(notification.priority)}
                                </span>
                                {notification.actionRequired && (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                                    ต้องดำเนินการ
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <p className={`text-sm mb-3 ${!notification.isRead ? 'text-slate-700' : 'text-slate-600'}`}>
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-700">
                                {new Date(notification.timestamp).toLocaleDateString('th-TH', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              
                              <div className="flex items-center gap-2">
                                {notification.actionRequired && (
                                  <button className="text-xs bg-blue-500 text-white px-3 py-1 rounded-full hover:bg-blue-600 transition-colors">
                                    ดำเนินการ
                                  </button>
                                )}
                                {!notification.isRead && (
                                  <button
                                    onClick={() => markAsRead(notification.id)}
                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                  >
                                    ทำเครื่องหมายว่าอ่านแล้ว
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteNotification(notification.id)}
                                  className="text-xs text-red-600 hover:text-red-800 font-medium"
                                >
                                  ลบ
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
