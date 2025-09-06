'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  showError, 
  showSuccess, 
  showWarning, 
  showInfo,
  showFeatureComingSoon,
  dismissAllAlerts 
} from '@/lib/alerts';

export default function AlertTestComponent() {
  const handleTestError = () => {
    showError('ข้อผิดพลาด', 'นี่คือข้อความแสดงข้อผิดพลาด');
  };

  const handleTestSuccess = () => {
    showSuccess('สำเร็จ', 'การดำเนินการเสร็จสิ้นเรียบร้อย');
  };

  const handleTestWarning = () => {
    showWarning('คำเตือน', 'กรุณาตรวจสอบข้อมูลของคุณ');
  };

  const handleTestInfo = () => {
    showInfo('ข้อมูล', 'นี่คือข้อมูลเพิ่มเติม');
  };

  const handleTestFeature = () => {
    showFeatureComingSoon('ฟีเจอร์ใหม่');
  };

  const handleDismissAll = () => {
    dismissAllAlerts();
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold mb-4">ทดสอบระบบแจ้งเตือน</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Button onClick={handleTestError} variant="destructive">
          ทดสอบ Error
        </Button>
        <Button onClick={handleTestSuccess} variant="default" className="bg-green-600 hover:bg-green-700">
          ทดสอบ Success
        </Button>
        <Button onClick={handleTestWarning} variant="outline" className="border-yellow-500 text-yellow-600 hover:bg-yellow-50">
          ทดสอบ Warning
        </Button>
        <Button onClick={handleTestInfo} variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
          ทดสอบ Info
        </Button>
        <Button onClick={handleTestFeature} variant="outline" className="border-purple-500 text-purple-600 hover:bg-purple-50">
          ทดสอบ Feature Coming Soon
        </Button>
        <Button onClick={handleDismissAll} variant="secondary">
          ปิดการแจ้งเตือนทั้งหมด
        </Button>
      </div>
    </div>
  );
}
