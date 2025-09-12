# 📊 System Monitoring Documentation

## ภาพรวม
หน้า `http://localhost:3000/admin/system-monitoring` แสดงข้อมูลการตรวจสอบระบบแบบเรียลไทม์ โดยแบ่งออกเป็น 4 ส่วนหลัก

---

## 🏗️ สถาปัตยกรรมระบบ

### Frontend (Next.js + React)
- **ไฟล์หลัก**: `frontend/src/app/admin/system-monitoring/page.tsx`
- **Service**: `frontend/src/services/systemMonitoringService.ts`
- **การจัดการ State**: `useState`, `useEffect`
- **UI Components**: Tailwind CSS + shadcn/ui

### Backend (Express.js + TypeScript)
- **Controller**: `backend/src/controllers/adminSystemMonitoringController.ts`
- **Routes**: `backend/src/routes/admin.ts`
- **Database**: PostgreSQL
- **System Info**: Node.js `os` module

---

## 📈 ส่วนประกอบหลัก

### 1. System Overview (ภาพรวมระบบ)

#### ข้อมูลที่แสดง:
- **System Health**: สถานะสุขภาพระบบ (Good/Warning/Critical)
- **Active Services**: จำนวนบริการที่ทำงานอยู่ (5/6)
- **Active Alerts**: จำนวนการแจ้งเตือนที่ยังไม่แก้ไข (3)
- **Uptime**: เวลาที่ระบบทำงานต่อเนื่อง (99.9%)

#### แหล่งข้อมูล:
- **API Endpoint**: `GET /api/admin/system-monitoring/overview`
- **การคำนวณ**:
  - System Health = วิเคราะห์จาก CPU, Memory, Disk usage และจำนวน alerts
  - Active Services = นับจาก services ที่มี status = 'running'
  - Active Alerts = นับจาก alerts ที่ resolved = false

#### วิธีการคำนวณ:
```typescript
const systemHealth = this.calculateSystemHealth(cpuUsage, memoryUsage, diskUsage, activeAlerts);
const healthyServices = services.filter(s => s.status === 'running').length;
const activeAlerts = alerts.filter(a => !a.resolved).length;
```

---

### 2. System Metrics (เมตริกซ์ระบบ)

#### ข้อมูลที่แสดง:
| Metric | Unit | Source | Description |
|--------|------|--------|-------------|
| CPU Usage | % | `os.cpus()` | การใช้งาน CPU |
| Memory Usage | % | `os.totalmem()`, `os.freemem()` | การใช้งาน RAM |
| Disk Usage | % | Simulated | การใช้งานพื้นที่เก็บข้อมูล |
| Network I/O | Mbps | `os.networkInterfaces()` | การรับส่งข้อมูลเครือข่าย |
| Database Connections | connections | `pg_stat_activity` | จำนวนการเชื่อมต่อฐานข้อมูล |
| API Response Time | ms | `SELECT 1` timing | เวลาตอบสนอง API |

#### แหล่งข้อมูล:
- **API Endpoint**: `GET /api/admin/system-monitoring/metrics`
- **Database Query**:
  ```sql
  SELECT count(*) as connection_count
  FROM pg_stat_activity
  WHERE state = 'active'
  ```

#### วิธีการคำนวณ:
```typescript
// CPU Usage
const cpus = os.cpus();
let totalIdle = 0, totalTick = 0;
cpus.forEach(cpu => {
  for (const type in cpu.times) {
    totalTick += cpu.times[type];
  }
  totalIdle += cpu.times.idle;
});
const usage = 100 - Math.round(100 * idle / total);

// Memory Usage
const totalMem = os.totalmem();
const freeMem = os.freemem();
const usage = Math.round(((totalMem - freeMem) / totalMem) * 100);
```

---

### 3. Services Status (สถานะบริการ)

#### ข้อมูลที่แสดง:
| Service | Status | Uptime | Response Time |
|---------|--------|--------|---------------|
| Web Server | running | 2 days, 5 hours | 100-150ms |
| Database Server | running | 2 days, 5 hours | 20-50ms |
| API Gateway | running | 2 days, 5 hours | 60-100ms |
| Authentication Service | running | 2 days, 5 hours | 40-70ms |
| File Storage | running | 2 days, 5 hours | 100-160ms |
| Email Service | stopped | 0 days, 0 hours | N/A |

#### แหล่งข้อมูล:
- **API Endpoint**: `GET /api/admin/system-monitoring/services`
- **การคำนวณ**:
  - Status: จำลองข้อมูล (ส่วนใหญ่เป็น 'running')
  - Uptime: ใช้ `os.uptime()` คำนวณเป็น days, hours
  - Response Time: จำลองข้อมูลแบบ random
  - Last Check: เวลาปัจจุบันในรูปแบบไทย

#### วิธีการคำนวณ:
```typescript
private getServiceUptime(): string {
  const uptime = os.uptime();
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  return `${days} days, ${hours} hours`;
}
```

---

### 4. System Alerts (การแจ้งเตือนระบบ)

#### ข้อมูลที่แสดง:
| Type | Message | Timestamp | Resolved |
|------|---------|-----------|----------|
| Warning | Memory usage is above 75% | 5 minutes ago | false |
| Error | Email service is not responding | 10 minutes ago | false |
| Info | Scheduled backup completed successfully | 1 hour ago | true |
| Warning | API response time is slower than usual | 30 minutes ago | false |

#### แหล่งข้อมูล:
- **API Endpoint**: `GET /api/admin/system-monitoring/alerts`
- **การคำนวณ**:
  - Type: จำลองข้อมูล (error, warning, info)
  - Message: ข้อความแจ้งเตือนที่จำลอง
  - Timestamp: เวลาที่เกิดเหตุการณ์ (ลบออกจากเวลาปัจจุบัน)
  - Resolved: สถานะการแก้ไข (true/false)

#### วิธีการคำนวณ:
```typescript
timestamp: new Date(Date.now() - 300000).toLocaleString('th-TH', { 
  timeZone: 'Asia/Bangkok',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
})
```

---

## 🔄 กระบวนการทำงาน

### 1. Frontend Process
```typescript
// เรียก API แบบ sequential
const overviewData = await systemMonitoringService.getSystemOverview()
const metricsData = await systemMonitoringService.getSystemMetrics()
const servicesData = await systemMonitoringService.getServiceStatus()
const alertsData = await systemMonitoringService.getSystemAlerts()
```

### 2. Backend Process
```typescript
// ใช้ Node.js os module
const cpuUsage = await this.getCpuUsage()        // os.cpus()
const memoryUsage = await this.getMemoryUsage()  // os.totalmem(), os.freemem()
const diskUsage = await this.getDiskUsage()      // จำลองข้อมูล
const networkStats = await this.getNetworkStats() // os.networkInterfaces()
const dbConnections = await this.getDatabaseConnections() // pg_stat_activity
const apiResponseTime = await this.getApiResponseTime()   // SELECT 1 timing
```

### 3. Database Queries
```sql
-- ตรวจสอบการเชื่อมต่อฐานข้อมูล
SELECT count(*) as connection_count
FROM pg_stat_activity
WHERE state = 'active'

-- วัดเวลาตอบสนอง
SELECT 1
```

---

## ⏰ การอัปเดตข้อมูล

### การจัดการเวลา:
- **Auto Refresh**: ไม่มี (ต้องกดปุ่ม Refresh เอง)
- **Manual Refresh**: กดปุ่ม Refresh เพื่อดึงข้อมูลใหม่
- **Timeout**: 30 วินาที (ป้องกันการโหลดนาน)
- **Fallback Data**: หาก API ล้มเหลว จะใช้ข้อมูลจำลอง

### การแสดงผลเวลา:
- **Timezone**: Asia/Bangkok
- **Format**: DD/MM/YYYY HH:mm:ss
- **Language**: Thai (th-TH)

---

## 🎨 การแสดงผล

### Status Colors:
- **เขียว (healthy)**: สถานะปกติ
- **เหลือง (warning)**: ข้อเตือน
- **แดง (critical)**: ข้อผิดพลาด

### Trend Icons:
- **⬆️ (up)**: เพิ่มขึ้น
- **⬇️ (down)**: ลดลง
- **➡️ (stable)**: คงที่

### Progress Bars:
- แสดงเปอร์เซ็นต์การใช้งาน
- สีเปลี่ยนตามสถานะ (เขียว/เหลือง/แดง)

---

## 🔧 การแก้ไขปัญหา

### ปัญหาที่พบและแก้ไข:
1. **Infinite Recursion**: เปลี่ยนชื่อ method จาก `getServiceStatus()` เป็น `getServiceStatusData()`
2. **Timezone Issues**: ใช้ `toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })`
3. **API Timeout**: เพิ่ม timeout เป็น 30 วินาที
4. **Data Structure Mismatch**: แก้ไข response structure ให้ตรงกับ frontend

### Error Handling:
```typescript
try {
  const data = await systemMonitoringService.getSystemOverview()
  setOverview(data)
} catch (error) {
  console.warn('⚠️ Overview API failed, using fallback:', error)
  setOverview(fallbackData)
}
```

---

## 📊 ข้อมูลสถิติ

### จาก Terminal Logs:
- **API Response Time**: 6-52ms
- **Database Query Time**: 0-42ms
- **Total Users**: 1
- **Active Connections**: 1
- **System Uptime**: 2 days, 5 hours

### Performance Metrics:
- **CPU Usage**: ~15-25%
- **Memory Usage**: ~60-80%
- **Disk Usage**: 40-70% (simulated)
- **Network I/O**: ~1-2 Mbps
- **Database Connections**: 1-2 active

---

## 🚀 การพัฒนาต่อ

### ข้อเสนอแนะ:
1. **Real-time Updates**: เพิ่ม WebSocket สำหรับอัปเดตแบบเรียลไทม์
2. **Historical Data**: เก็บข้อมูลย้อนหลังสำหรับกราฟ
3. **Alert Rules**: ตั้งกฎการแจ้งเตือนแบบกำหนดเอง
4. **Service Discovery**: ตรวจหาบริการใหม่อัตโนมัติ
5. **Performance Optimization**: ใช้ caching และ pagination

### การปรับปรุง:
- เพิ่มการตรวจสอบ disk usage จริง
- เชื่อมต่อกับ monitoring tools (Prometheus, Grafana)
- เพิ่มการแจ้งเตือนผ่าน email/SMS
- สร้าง dashboard แบบ customizable

---

## 📝 สรุป

หน้า System Monitoring ให้ข้อมูลแบบเรียลไทม์เกี่ยวกับสุขภาพและประสิทธิภาพของระบบ โดยใช้ข้อมูลจริงจากระบบปฏิบัติการและฐานข้อมูล พร้อมกับข้อมูลจำลองสำหรับส่วนที่ยังไม่มีการติดตั้ง monitoring tools จริง

ระบบนี้ช่วยให้ผู้ดูแลระบบสามารถติดตามสถานะของระบบได้อย่างมีประสิทธิภาพ และสามารถแก้ไขปัญหาได้อย่างรวดเร็ว
