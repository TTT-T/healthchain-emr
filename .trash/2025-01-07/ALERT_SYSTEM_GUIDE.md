# Unified Alert System Guide

## Overview

This project now uses a unified Alert Box system that replaces all `console.log`, `alert()`, and custom notification implementations with a consistent, modern notification system.

## Features

- **Four Alert Types**: Error, Information, Confirmation, and Warning
- **Consistent Design**: All alerts use the same styling and behavior
- **Centralized Management**: Single import for all alert functions
- **Extensible**: Easy to add new alert types in the future
- **Accessible**: Proper ARIA labels and keyboard navigation
- **Customizable**: Support for custom duration, position, and actions

## Installation

The system uses `react-hot-toast` which has been installed:

```bash
npm install react-hot-toast
```

## Usage

### Basic Import

```typescript
import { 
  showError, 
  showSuccess, 
  showWarning, 
  showInfo,
  showFeatureComingSoon 
} from '@/lib/alerts';
```

### Alert Functions

#### 1. Error Alerts
```typescript
showError('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการดำเนินการ');
```

#### 2. Success/Confirmation Alerts
```typescript
showSuccess('สำเร็จ', 'การดำเนินการเสร็จสิ้นเรียบร้อย');
// or
showConfirmation('ยืนยัน', 'ข้อมูลได้รับการบันทึกแล้ว');
```

#### 3. Warning Alerts
```typescript
showWarning('คำเตือน', 'กรุณาตรวจสอบข้อมูลของคุณ');
```

#### 4. Information Alerts
```typescript
showInfo('ข้อมูล', 'นี่คือข้อมูลเพิ่มเติม');
```

#### 5. Feature Coming Soon
```typescript
showFeatureComingSoon('ฟีเจอร์ใหม่');
```

### Advanced Usage

#### Custom Configuration
```typescript
import { showAlert } from '@/lib/alerts';

showAlert({
  type: 'error',
  title: 'ข้อผิดพลาด',
  message: 'เกิดข้อผิดพลาดในการดำเนินการ',
  duration: 6000,
  position: 'top-center',
  showCloseButton: true,
  action: {
    label: 'ลองใหม่',
    onClick: () => {
      // Retry logic
    }
  }
});
```

#### Common Alert Messages
```typescript
import { CommonAlerts, showCommonAlert } from '@/lib/alerts';

// Use predefined messages
showCommonAlert('LOGIN_SUCCESS');
showCommonAlert('NETWORK_ERROR', 'error');
showCommonAlert('SAVE_SUCCESS', 'confirmation');
```

#### API Error Handling
```typescript
import { showAPIError } from '@/lib/alerts';

try {
  await apiCall();
} catch (error) {
  showAPIError(error, 'ไม่สามารถบันทึกข้อมูลได้');
}
```

#### Form Validation Errors
```typescript
import { showValidationError } from '@/lib/alerts';

const errors = { email: 'อีเมลไม่ถูกต้อง' };
showValidationError(errors);
```

### Utility Functions

#### Dismiss Alerts
```typescript
import { dismissAllAlerts, dismissAlert } from '@/lib/alerts';

// Dismiss all alerts
dismissAllAlerts();

// Dismiss specific alert
const alertId = showError('Error', 'Message');
dismissAlert(alertId);
```

## Alert Types

### Error
- **Color**: Red
- **Icon**: AlertCircle
- **Duration**: 6 seconds
- **Use Case**: Critical errors, failed operations

### Information
- **Color**: Blue
- **Icon**: Info
- **Duration**: 4 seconds
- **Use Case**: General information, tips

### Confirmation/Success
- **Color**: Green
- **Icon**: CheckCircle
- **Duration**: 4 seconds
- **Use Case**: Successful operations, confirmations

### Warning
- **Color**: Yellow
- **Icon**: AlertTriangle
- **Duration**: 5 seconds
- **Use Case**: Warnings, important notices

## Configuration

### AlertProvider Setup

The `AlertProvider` is already configured in `app/layout.tsx`:

```typescript
import { AlertProvider } from '@/components/ui/alert-system';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ReactQueryProvider>
          <AuthProvider>
            <AlertProvider>
              {children}
            </AlertProvider>
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
```

### Customization

You can customize the alert system by modifying `frontend/src/components/ui/alert-system.tsx`:

- **Colors**: Modify `alertColors` object
- **Icons**: Update `alertIcons` object
- **Default Duration**: Change default values in functions
- **Position**: Modify `AlertProvider` configuration

## Migration Guide

### Before (Old Way)
```typescript
// Console logging
console.log('Success message');
console.error('Error message');

// Browser alerts
alert('Feature coming soon');

// Custom notifications
setError('Error message');
setSuccessMessage('Success message');
```

### After (New Way)
```typescript
import { showError, showSuccess, showFeatureComingSoon } from '@/lib/alerts';

// Unified alerts
showSuccess('สำเร็จ', 'การดำเนินการเสร็จสิ้น');
showError('ข้อผิดพลาด', 'เกิดข้อผิดพลาด');
showFeatureComingSoon('ฟีเจอร์ใหม่');
```

## Testing

### Test Page
Visit `/test-alerts` to test all alert types:

```typescript
// Test all alert types
showError('Test Error', 'This is a test error message');
showSuccess('Test Success', 'This is a test success message');
showWarning('Test Warning', 'This is a test warning message');
showInfo('Test Info', 'This is a test info message');
showFeatureComingSoon('Test Feature');
```

### Test Component
Use `AlertTestComponent` for development testing:

```typescript
import AlertTestComponent from '@/components/AlertTestComponent';

// In your component
<AlertTestComponent />
```

## Best Practices

1. **Use Appropriate Types**: Choose the right alert type for the message
2. **Clear Messages**: Write clear, concise messages in Thai
3. **Consistent Titles**: Use consistent title patterns
4. **Don't Overuse**: Avoid showing too many alerts at once
5. **Handle Errors Gracefully**: Always provide meaningful error messages
6. **Test Thoroughly**: Test alerts in different scenarios

## Common Patterns

### Login/Logout
```typescript
// Login success
showSuccess('เข้าสู่ระบบสำเร็จ', 'ยินดีต้อนรับสู่ระบบ');

// Login error
showError('เข้าสู่ระบบไม่สำเร็จ', 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');

// Logout
showSuccess('ออกจากระบบสำเร็จ', 'ขอบคุณที่ใช้บริการ');
```

### Form Operations
```typescript
// Save success
showSuccess('บันทึกสำเร็จ', 'ข้อมูลได้รับการบันทึกแล้ว');

// Save error
showError('บันทึกไม่สำเร็จ', 'ไม่สามารถบันทึกข้อมูลได้');

// Validation error
showError('ข้อมูลไม่ถูกต้อง', 'กรุณาตรวจสอบข้อมูลที่กรอก');
```

### Network Operations
```typescript
// Network error
showError('ข้อผิดพลาดเครือข่าย', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');

// API error
showAPIError(error, 'ไม่สามารถดึงข้อมูลได้');
```

## Troubleshooting

### Alerts Not Showing
1. Check if `AlertProvider` is properly configured in layout
2. Verify imports are correct
3. Check browser console for errors

### Styling Issues
1. Ensure Tailwind CSS is properly configured
2. Check if `cn` utility function is working
3. Verify Lucide React icons are installed

### Performance Issues
1. Avoid showing too many alerts simultaneously
2. Use `dismissAllAlerts()` when appropriate
3. Consider reducing alert duration for less critical messages

## Future Enhancements

The system is designed to be easily extensible:

1. **New Alert Types**: Add new types to `AlertType` and `alertIcons`
2. **Custom Animations**: Modify transition classes
3. **Sound Notifications**: Add audio feedback
4. **Persistent Alerts**: Add alerts that persist across page reloads
5. **Alert History**: Track and display alert history

## Support

For issues or questions about the alert system:

1. Check this documentation
2. Review the test page at `/test-alerts`
3. Examine the source code in `frontend/src/components/ui/alert-system.tsx`
4. Check the utility functions in `frontend/src/lib/alerts.ts`
