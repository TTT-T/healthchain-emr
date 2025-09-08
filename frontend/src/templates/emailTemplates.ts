// Email Templates for Patient Notifications
// These templates are used by the NotificationService to send formatted emails

export interface EmailTemplateData {
  patientName: string;
  patientHn: string;
  hospitalName?: string;
  [key: string]: any;
}

export interface AppointmentEmailData extends EmailTemplateData {
  queueNumber: string;
  doctorName: string;
  department: string;
  visitTime: string;
  treatmentType: string;
  estimatedWaitTime?: string;
  symptoms?: string;
  notes?: string;
}

export interface RecordUpdateEmailData extends EmailTemplateData {
  recordType: string;
  recordTitle: string;
  recordDescription: string;
  recordDetails?: any;
  createdByName: string;
  createdAt: string;
}

export interface RegistrationEmailData extends EmailTemplateData {
  hospitalNumber: string;
  registrationDate: string;
  nextSteps: string;
}

// Base email template with common styling
const getBaseTemplate = (title: string, content: string, footerText?: string) => `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: 'Sarabun', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
        }
        .content {
            padding: 30px 20px;
        }
        .info-box {
            background-color: #f8f9fa;
            border-left: 4px solid #007bff;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .highlight {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 4px;
            margin: 15px 0;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 14px;
            color: #6c757d;
            border-top: 1px solid #e9ecef;
        }
        .button {
            display: inline-block;
            background-color: #007bff;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            margin: 10px 0;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        .table th, .table td {
            border: 1px solid #dee2e6;
            padding: 8px 12px;
            text-align: left;
        }
        .table th {
            background-color: #f8f9fa;
            font-weight: 600;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }
        .status-waiting { background-color: #fff3cd; color: #856404; }
        .status-completed { background-color: #d4edda; color: #155724; }
        .status-in-progress { background-color: #cce5ff; color: #004085; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${title}</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            ${footerText || `
                <p>นี่คืออีเมลอัตโนมัติจากระบบ EMR กรุณาอย่าตอบกลับอีเมลนี้</p>
                <p>หากมีคำถาม กรุณาติดต่อโรงพยาบาลโดยตรง</p>
            `}
        </div>
    </div>
</body>
</html>
`;

// Appointment notification email template
export const getAppointmentEmailTemplate = (data: AppointmentEmailData): string => {
  const content = `
    <h2>สวัสดี ${data.patientName}</h2>
    <p>คุณได้รับการนัดหมายใหม่จากโรงพยาบาล</p>
    
    <div class="info-box">
        <h3>📋 รายละเอียดการนัดหมาย</h3>
        <table class="table">
            <tr>
                <th>หมายเลขคิว</th>
                <td><strong>${data.queueNumber}</strong></td>
            </tr>
            <tr>
                <th>แพทย์ผู้ตรวจ</th>
                <td>${data.doctorName}</td>
            </tr>
            <tr>
                <th>แผนก</th>
                <td>${data.department}</td>
            </tr>
            <tr>
                <th>เวลานัด</th>
                <td>${new Date(data.visitTime).toLocaleString('th-TH')}</td>
            </tr>
            <tr>
                <th>ประเภทการรักษา</th>
                <td>${data.treatmentType}</td>
            </tr>
            ${data.estimatedWaitTime ? `
            <tr>
                <th>เวลารอโดยประมาณ</th>
                <td>${data.estimatedWaitTime} นาที</td>
            </tr>
            ` : ''}
        </table>
    </div>

    ${data.symptoms ? `
    <div class="highlight">
        <h4>🔍 อาการที่แจ้ง</h4>
        <p>${data.symptoms}</p>
    </div>
    ` : ''}

    ${data.notes ? `
    <div class="highlight">
        <h4>📝 หมายเหตุ</h4>
        <p>${data.notes}</p>
    </div>
    ` : ''}

    <div class="info-box">
        <h4>📌 หมายเลข HN ของคุณ</h4>
        <p style="font-size: 18px; font-weight: bold; color: #007bff;">${data.patientHn}</p>
        <p>กรุณานำหมายเลข HN นี้มาแสดงเมื่อมาถึงโรงพยาบาล</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
        <a href="#" class="button">ดูรายละเอียดเพิ่มเติม</a>
    </div>

    <div class="highlight">
        <h4>⚠️ ข้อควรระวัง</h4>
        <ul>
            <li>กรุณามาก่อนเวลานัด 15-30 นาที</li>
            <li>นำบัตรประชาชนและเอกสารที่เกี่ยวข้องมาด้วย</li>
            <li>หากไม่สามารถมาตามนัดได้ กรุณาแจ้งล่วงหน้า</li>
        </ul>
    </div>
  `;

  return getBaseTemplate(
    'การนัดหมายใหม่ - ระบบ EMR',
    content,
    `
        <p>นี่คืออีเมลแจ้งเตือนการนัดหมายจากระบบ EMR</p>
        <p>หากมีคำถามเกี่ยวกับการนัดหมาย กรุณาติดต่อโรงพยาบาล</p>
        <p>หมายเลข HN: ${data.patientHn}</p>
    `
  );
};

// Record update notification email template
export const getRecordUpdateEmailTemplate = (data: RecordUpdateEmailData): string => {
  const getRecordTypeIcon = (type: string): string => {
    const icons: { [key: string]: string } = {
      'vital_signs': '💓',
      'history_taking': '📋',
      'doctor_visit': '👨‍⚕️',
      'pharmacy': '💊',
      'lab_result': '🧪',
      'appointment': '📅',
      'document': '📄',
      'patient_registration': '👤'
    };
    return icons[type] || '📝';
  };

  const content = `
    <h2>สวัสดี ${data.patientName}</h2>
    <p>มีการอัปเดตข้อมูลในประวัติการรักษาของคุณ</p>
    
    <div class="info-box">
        <h3>${getRecordTypeIcon(data.recordType)} ${data.recordTitle}</h3>
        <p>${data.recordDescription}</p>
        
        <table class="table">
            <tr>
                <th>วันที่อัปเดต</th>
                <td>${new Date(data.createdAt).toLocaleString('th-TH')}</td>
            </tr>
            <tr>
                <th>อัปเดตโดย</th>
                <td>${data.createdByName}</td>
            </tr>
        </table>
    </div>

    ${data.recordDetails ? `
    <div class="highlight">
        <h4>📊 รายละเอียดข้อมูล</h4>
        ${Object.entries(data.recordDetails).map(([key, value]) => `
            <p><strong>${key}:</strong> ${value}</p>
        `).join('')}
    </div>
    ` : ''}

    <div class="info-box">
        <h4>📌 หมายเลข HN ของคุณ</h4>
        <p style="font-size: 18px; font-weight: bold; color: #007bff;">${data.patientHn}</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
        <a href="#" class="button">ดูประวัติการรักษา</a>
    </div>

    <div class="highlight">
        <h4>ℹ️ ข้อมูลเพิ่มเติม</h4>
        <p>ข้อมูลนี้เป็นส่วนหนึ่งของประวัติการรักษาของคุณในระบบ EMR</p>
        <p>หากมีคำถามเกี่ยวกับข้อมูลนี้ กรุณาติดต่อโรงพยาบาล</p>
    </div>
  `;

  return getBaseTemplate(
    'อัปเดตประวัติการรักษา - ระบบ EMR',
    content,
    `
        <p>นี่คืออีเมลแจ้งเตือนการอัปเดตข้อมูลจากระบบ EMR</p>
        <p>หมายเลข HN: ${data.patientHn}</p>
    `
  );
};

// Patient registration email template
export const getRegistrationEmailTemplate = (data: RegistrationEmailData): string => {
  const content = `
    <h2>ยินดีต้อนรับ ${data.patientName}</h2>
    <p>คุณได้ลงทะเบียนเป็นผู้ป่วยของโรงพยาบาลเรียบร้อยแล้ว</p>
    
    <div class="info-box">
        <h3>🎉 การลงทะเบียนสำเร็จ</h3>
        <table class="table">
            <tr>
                <th>หมายเลข HN</th>
                <td><strong style="font-size: 18px; color: #007bff;">${data.hospitalNumber}</strong></td>
            </tr>
            <tr>
                <th>วันที่ลงทะเบียน</th>
                <td>${new Date(data.registrationDate).toLocaleDateString('th-TH')}</td>
            </tr>
        </table>
    </div>

    <div class="highlight">
        <h4>📋 ขั้นตอนต่อไป</h4>
        <p>${data.nextSteps}</p>
        <ul>
            <li>เก็บหมายเลข HN ไว้เพื่อใช้ในการรับบริการ</li>
            <li>นำหมายเลข HN มาด้วยทุกครั้งที่มาหาแพทย์</li>
            <li>สามารถใช้หมายเลข HN เพื่อเช็คอินและรับบริการได้</li>
        </ul>
    </div>

    <div class="info-box">
        <h4>📌 หมายเลข HN ของคุณ</h4>
        <p style="font-size: 24px; font-weight: bold; color: #007bff; text-align: center; margin: 20px 0;">
            ${data.hospitalNumber}
        </p>
        <p style="text-align: center;">กรุณาจดหมายเลขนี้ไว้เพื่อใช้ในอนาคต</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
        <a href="#" class="button">เข้าสู่ระบบ EMR</a>
    </div>

    <div class="highlight">
        <h4>ℹ️ ข้อมูลสำคัญ</h4>
        <ul>
            <li>หมายเลข HN จะใช้แทนชื่อในการรับบริการ</li>
            <li>ข้อมูลส่วนตัวของคุณจะถูกเก็บรักษาอย่างปลอดภัย</li>
            <li>หากมีคำถาม กรุณาติดต่อโรงพยาบาล</li>
        </ul>
    </div>
  `;

  return getBaseTemplate(
    'ยินดีต้อนรับสู่ระบบ EMR',
    content,
    `
        <p>ยินดีต้อนรับสู่ระบบ EMR ของโรงพยาบาล</p>
        <p>หมายเลข HN: ${data.hospitalNumber}</p>
    `
  );
};

// Queue status update email template
export const getQueueStatusEmailTemplate = (data: {
  patientName: string;
  patientHn: string;
  queueNumber: string;
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled';
  doctorName: string;
  department: string;
  estimatedWaitTime?: string;
  currentPosition?: number;
}): string => {
  const getStatusInfo = (status: string) => {
    const statusMap = {
      waiting: { text: 'รอคิว', icon: '⏳', color: 'status-waiting' },
      in_progress: { text: 'กำลังตรวจ', icon: '👨‍⚕️', color: 'status-in-progress' },
      completed: { text: 'เสร็จสิ้น', icon: '✅', color: 'status-completed' },
      cancelled: { text: 'ยกเลิก', icon: '❌', color: 'status-cancelled' }
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.waiting;
  };

  const statusInfo = getStatusInfo(data.status);

  const content = `
    <h2>สวัสดี ${data.patientName}</h2>
    <p>สถานะคิวของคุณมีการเปลี่ยนแปลง</p>
    
    <div class="info-box">
        <h3>📋 สถานะคิวปัจจุบัน</h3>
        <table class="table">
            <tr>
                <th>หมายเลขคิว</th>
                <td><strong>${data.queueNumber}</strong></td>
            </tr>
            <tr>
                <th>สถานะ</th>
                <td>
                    <span class="status-badge ${statusInfo.color}">
                        ${statusInfo.icon} ${statusInfo.text}
                    </span>
                </td>
            </tr>
            <tr>
                <th>แพทย์ผู้ตรวจ</th>
                <td>${data.doctorName}</td>
            </tr>
            <tr>
                <th>แผนก</th>
                <td>${data.department}</td>
            </tr>
            ${data.currentPosition ? `
            <tr>
                <th>ลำดับในคิว</th>
                <td>${data.currentPosition}</td>
            </tr>
            ` : ''}
            ${data.estimatedWaitTime ? `
            <tr>
                <th>เวลารอโดยประมาณ</th>
                <td>${data.estimatedWaitTime} นาที</td>
            </tr>
            ` : ''}
        </table>
    </div>

    <div class="info-box">
        <h4>📌 หมายเลข HN ของคุณ</h4>
        <p style="font-size: 18px; font-weight: bold; color: #007bff;">${data.patientHn}</p>
    </div>

    ${data.status === 'in_progress' ? `
    <div class="highlight">
        <h4>👨‍⚕️ กำลังตรวจ</h4>
        <p>แพทย์กำลังตรวจคุณ กรุณารอในห้องตรวจ</p>
    </div>
    ` : ''}

    ${data.status === 'completed' ? `
    <div class="highlight">
        <h4>✅ เสร็จสิ้นการตรวจ</h4>
        <p>การตรวจเสร็จสิ้นแล้ว ขอบคุณที่ใช้บริการ</p>
    </div>
    ` : ''}

    <div style="text-align: center; margin: 30px 0;">
        <a href="#" class="button">ดูสถานะคิว</a>
    </div>
  `;

  return getBaseTemplate(
    'อัปเดตสถานะคิว - ระบบ EMR',
    content,
    `
        <p>นี่คืออีเมลแจ้งเตือนสถานะคิวจากระบบ EMR</p>
        <p>หมายเลข HN: ${data.patientHn}</p>
    `
  );
};

// Export all templates
export const emailTemplates = {
  appointment: getAppointmentEmailTemplate,
  recordUpdate: getRecordUpdateEmailTemplate,
  registration: getRegistrationEmailTemplate,
  queueStatus: getQueueStatusEmailTemplate
};
