"use client";
import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { apiClient } from "@/lib/api";
import { logger } from '@/lib/logger';

interface Notification {
  id: string;
  patient_id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  read_status: boolean;
  actionRequired: boolean;
  created_at: string;
  updated_at: string;
}

export default function Notifications() {
  const { user } = useAuth();
  const { refreshNotificationCount } = useNotifications();
  const [activeTab, setActiveTab] = useState("all");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (user?.id) {
        const response = await apiClient.getPatientNotifications(user.id);
        if (response.statusCode === 200 && response.data) {
          const notificationsData = response.data;
          if (Array.isArray(notificationsData)) {
            setNotifications(notificationsData as any);
          } else if (notificationsData && typeof notificationsData === 'object' && Array.isArray((notificationsData as any).notifications)) {
            setNotifications((notificationsData as any).notifications as any);
          } else {
            setNotifications([]);
            logger.warn('Notifications data is not an array:', notificationsData);
          }
        } else {
          setError(response.error?.message || "ไม่สามารถดึงข้อมูลการแจ้งเตือนได้");
        }
      }
    } catch (err) {
      logger.error("Error fetching notifications:", err);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูลการแจ้งเตือน");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      // Refresh notification count when visiting the page
      setTimeout(() => {
        refreshNotificationCount();
      }, 1000);
    }
  }, [user, fetchNotifications, refreshNotificationCount]);

  const markAsRead = async (notificationId: string) => {
    try {
      // Update local state immediately
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read_status: true }
            : notification
        )
      );
      
      // Refresh notification count
      await refreshNotificationCount();
      
      // TODO: Call API to mark as read
      // await apiClient.markNotificationAsRead(notificationId);
    } catch (err) {
      logger.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read_status: true }))
      );
      
      // Refresh notification count
      await refreshNotificationCount();
      
      // TODO: Call API to mark all as read
      // await apiClient.markAllNotificationsAsRead(user.id);
    } catch (err) {
      logger.error("Error marking all notifications as read:", err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "appointment": return "📅";
      case "medication": return "💊";
      case "lab_result": return "🧪";
      case "system": return "⚙️";
      case "reminder": return "⏰";
      case "alert": return "🚨";
      default: return "📢";
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
      default: return "ปกติ";
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case "appointment": return "การนัดหมาย";
      case "medication": return "ยา";
      case "lab_result": return "ผลตรวจ";
      case "system": return "ระบบ";
      case "reminder": return "การแจ้งเตือน";
      case "alert": return "แจ้งเตือนสำคัญ";
      default: return "ทั่วไป";
    }
  };

  const filteredNotifications = Array.isArray(notifications) 
    ? notifications.filter(notification => {
        if (activeTab === "all") return true;
        if (activeTab === "unread") return !notification.read_status;
        if (activeTab === "action") return notification.actionRequired;
        return notification.type === activeTab;
      })
    : [];

  const unreadCount = Array.isArray(notifications) 
    ? notifications.filter(n => !n.read_status).length 
    : 0;
  const actionRequiredCount = Array.isArray(notifications) 
    ? notifications.filter(n => n.actionRequired).length 
    : 0;

  return (
    <AppLayout title={"การแจ้งเตือน"} userType={"patient"}>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">การแจ้งเตือน</h1>
              <p className="text-gray-600 mt-1">ติดตามการแจ้งเตือนและข้อความสำคัญของคุณ</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={markAllAsRead}
                className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ทำเครื่องหมายอ่านทั้งหมด
              </button>
              <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5-5-5h5v-12"/>
                </svg>
                รีเฟรช
              </button>
            </div>
          </div>
        </div>
          
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">ทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-xl">📢</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">ยังไม่อ่าน</p>
                <p className="text-2xl font-bold text-red-600">{unreadCount}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-xl">🔔</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">ต้องดำเนินการ</p>
                <p className="text-2xl font-bold text-orange-600">{actionRequiredCount}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-xl">⚡</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">วันนี้</p>
                <p className="text-2xl font-bold text-green-600">{notifications.filter(n => {
                  const notificationDate = new Date(n.created_at);
                  const today = new Date();
                  return notificationDate.toDateString() === today.toDateString();
                }).length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-xl">📅</div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-200">
            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: "ทั้งหมด", icon: "📋", count: notifications.length },
                { id: "unread", label: "ยังไม่อ่าน", icon: "🔔", count: unreadCount },
                { id: "action", label: "ต้องดำเนินการ", icon: "⚡", count: actionRequiredCount },
                { id: "appointment", label: "การนัดหมาย", icon: "📅" },
                { id: "medication", label: "ยา", icon: "💊" },
                { id: "lab_result", label: "ผลตรวจ", icon: "🧪" },
                { id: "system", label: "ระบบ", icon: "⚙️" }
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
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      activeTab === tab.id 
                        ? "bg-blue-500 text-white" 
                        : "bg-gray-200 text-gray-700"
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications List */}
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
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่มีการแจ้งเตือน</h3>
            <p className="text-gray-600">
              {activeTab === "all" 
                ? "ยังไม่มีการแจ้งเตือนในระบบ" 
                : `ไม่มีการแจ้งเตือนประเภท ${[
                    { id: "unread", label: "ยังไม่อ่าน" },
                    { id: "action", label: "ต้องดำเนินการ" },
                    { id: "appointment", label: "การนัดหมาย" },
                    { id: "medication", label: "ยา" },
                    { id: "lab_result", label: "ผลตรวจ" },
                    { id: "system", label: "ระบบ" }
                  ].find(t => t.id === activeTab)?.label}`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow ${
                  !notification.read_status 
                    ? "border-blue-200 bg-blue-50" 
                    : "border-slate-200"
                } ${getPriorityColor(notification.priority)}`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-xl">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={`text-lg font-semibold ${
                            !notification.read_status ? "text-blue-900" : "text-gray-900"
                          }`}>
                            {notification.title}
                          </h3>
                          {!notification.read_status && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                          )}
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                            {getTypeText(notification.type)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            notification.priority === "high" 
                              ? "bg-red-100 text-red-700"
                              : notification.priority === "medium"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                          }`}>
                            {getPriorityText(notification.priority)}
                          </span>
                          {notification.actionRequired && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                              ต้องดำเนินการ
                            </span>
                          )}
                        </div>
                        
                        <p className={`text-sm mb-3 ${
                          !notification.read_status ? "text-blue-800" : "text-gray-700"
                        }`}>
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">
                            {new Date(notification.created_at).toLocaleString('th-TH', {
                              year: 'numeric',
                              month: 'long', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      {!notification.read_status && (
                        <button 
                          onClick={() => markAsRead(notification.id)}
                          className="px-3 py-1 text-sm border border-slate-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          ทำเครื่องหมายอ่านแล้ว
                        </button>
                      )}
                      {notification.actionRequired && (
                        <button className="px-3 py-1 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                          ดำเนินการ
                        </button>
                      )}
                      <button className="px-3 py-1 text-sm border border-slate-300 rounded-lg hover:bg-gray-50 transition-colors">
                        รายละเอียด
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}