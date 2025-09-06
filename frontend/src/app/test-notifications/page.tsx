import AlertTestComponent from '@/components/AlertTestComponent';
import ErrorTestComponent from '@/components/ErrorTestComponent';

export default function TestNotificationsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">ทดสอบระบบการแจ้งเตือน</h1>
          <p className="text-gray-600 text-lg">
            ทดสอบระบบ Alert และ Error Handling ที่ครอบคลุม
          </p>
        </div>
        
        <div className="space-y-12">
          <AlertTestComponent />
          <ErrorTestComponent />
        </div>
      </div>
    </div>
  );
}
