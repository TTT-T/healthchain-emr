# 👨‍💻 EMR System - คู่มือนักพัฒนา (Developer Guide)

**เวอร์ชัน:** 1.0.0  
**วันที่อัปเดต:** 5 กันยายน 2025

---

## 🎯 ภาพรวมการพัฒนา

คู่มือนี้สำหรับนักพัฒนาที่ต้องการ:
- เข้าใจโครงสร้างของระบบ EMR
- พัฒนาและปรับปรุงฟีเจอร์ใหม่
- บำรุงรักษาและแก้ไขบัค
- เข้าใจ API และการเชื่อมต่อ

---

## 🏗️ สถาปัตยกรรมระบบ

### โครงสร้างโปรเจค
```
EMR-System/
├── backend/                 # Backend API Server
│   ├── src/
│   │   ├── controllers/     # API Controllers
│   │   ├── routes/         # API Routes
│   │   ├── middleware/     # Middleware Functions
│   │   ├── database/       # Database Configuration
│   │   ├── services/       # Business Logic Services
│   │   ├── utils/          # Utility Functions
│   │   ├── types/          # TypeScript Types
│   │   └── tests/          # Test Files
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # Frontend React App
│   ├── src/
│   │   ├── app/           # Next.js App Router
│   │   ├── components/    # React Components
│   │   ├── lib/          # Utility Libraries
│   │   ├── hooks/        # Custom Hooks
│   │   ├── contexts/     # React Contexts
│   │   └── types/        # TypeScript Types
│   ├── package.json
│   └── next.config.ts
└── docs/                  # Documentation
```

### เทคโนโลยีที่ใช้

#### Backend
- **Node.js**: Runtime environment
- **TypeScript**: Programming language
- **Express.js**: Web framework
- **PostgreSQL**: Database
- **JWT**: Authentication
- **bcrypt**: Password hashing
- **Jest**: Testing framework

#### Frontend
- **Next.js 15**: React framework
- **React 19**: UI library
- **TypeScript**: Programming language
- **Tailwind CSS**: Styling
- **Axios**: HTTP client
- **React Hook Form**: Form handling

---

## 🚀 การติดตั้งและตั้งค่า

### Prerequisites
- **Node.js**: v18.0.0 หรือใหม่กว่า
- **PostgreSQL**: v14.0 หรือใหม่กว่า
- **npm**: v8.0.0 หรือใหม่กว่า

### การติดตั้ง Backend
```bash
# Clone repository
git clone <repository-url>
cd EMR-System/backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# แก้ไข .env ตามการตั้งค่าของคุณ

# Setup database
npm run db:init
npm run db:migrate
npm run seed

# Start development server
npm run dev
```

### การติดตั้ง Frontend
```bash
cd ../frontend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# แก้ไข .env.local ตามการตั้งค่าของคุณ

# Start development server
npm run dev
```

### Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/emr_system
DB_HOST=localhost
DB_PORT=5432
DB_NAME=emr_system
DB_USER=username
DB_PASSWORD=password

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=3001
NODE_ENV=development

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=EMR System
```

---

## 🗄️ โครงสร้างฐานข้อมูล

### ตารางหลัก

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('patient', 'doctor', 'nurse', 'admin', 'external_user')),
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Patients Table
```sql
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
  phone VARCHAR(20),
  address TEXT,
  emergency_contact JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Medical Records Table
```sql
CREATE TABLE medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  diagnosis TEXT NOT NULL,
  symptoms TEXT,
  treatment TEXT,
  notes TEXT,
  date TIMESTAMP NOT NULL,
  doctor_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Relationships
- **Users** → **Patients** (1:1)
- **Patients** → **Medical Records** (1:many)
- **Patients** → **Appointments** (1:many)
- **Patients** → **Lab Results** (1:many)
- **Patients** → **Prescriptions** (1:many)

---

## 🔌 API Documentation

### Base URL
```
Development: http://localhost:3001
Production: https://api.emrsystem.com
```

### Authentication
ระบบใช้ JWT (JSON Web Tokens) สำหรับการยืนยันตัวตน

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Response
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "patient"
    },
    "tokens": {
      "accessToken": "jwt-token",
      "refreshToken": "refresh-token"
    }
  }
}
```

### API Endpoints

#### Authentication APIs
- `POST /api/auth/register` - ลงทะเบียนผู้ใช้ใหม่
- `POST /api/auth/login` - เข้าสู่ระบบ
- `POST /api/auth/logout` - ออกจากระบบ
- `POST /api/auth/refresh-token` - รีเฟรช token
- `GET /api/auth/profile` - ดูข้อมูลโปรไฟล์
- `PUT /api/auth/profile` - แก้ไขโปรไฟล์

#### Patient Portal APIs
- `GET /api/patients/{id}/records` - ดูประวัติการรักษา
- `POST /api/patients/{id}/records` - สร้างบันทึกใหม่
- `GET /api/patients/{id}/lab-results` - ดูผลแล็บ
- `GET /api/patients/{id}/appointments` - ดูนัดหมาย
- `POST /api/patients/{id}/appointments` - สร้างนัดหมาย
- `GET /api/patients/{id}/medications` - ดูยาที่ใช้
- `GET /api/patients/{id}/notifications` - ดูการแจ้งเตือน
- `GET /api/patients/{id}/ai-insights` - ดู AI insights
- `GET /api/patients/{id}/consent-requests` - ดูคำขอ consent

#### EMR System APIs
- `GET /api/medical/patients` - รายชื่อผู้ป่วย
- `POST /api/medical/patients` - สร้างผู้ป่วยใหม่
- `GET /api/medical/visits` - รายการ visits
- `POST /api/medical/visits` - สร้าง visit ใหม่
- `POST /api/medical/vital-signs` - บันทึกสัญญาณชีพ
- `POST /api/medical/lab-orders` - สั่งแล็บ
- `POST /api/medical/prescriptions` - จ่ายยา

#### Admin APIs
- `GET /api/admin/users` - รายชื่อผู้ใช้
- `POST /api/admin/users` - สร้างผู้ใช้ใหม่
- `GET /api/admin/system/health` - สถานะระบบ
- `GET /api/admin/audit-logs` - บันทึกการทำงาน

#### External Requesters APIs
- `POST /api/external-requesters/requests` - สร้างคำขอข้อมูล
- `GET /api/external-requesters/requests` - รายการคำขอ
- `POST /api/external-requesters/requests/{id}/approve` - อนุมัติคำขอ

### Error Handling
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information",
  "statusCode": 400
}
```

---

## 🧪 การทดสอบ

### Backend Testing
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.ts

# Run tests in watch mode
npm run test:watch
```

### Frontend Testing
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Structure
```
tests/
├── unit/              # Unit tests
│   ├── controllers/   # Controller tests
│   ├── middleware/    # Middleware tests
│   └── utils/         # Utility tests
├── integration/       # Integration tests
│   └── api/          # API tests
└── e2e/              # End-to-end tests
```

### Example Test
```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { login } from '../controllers/authController';

describe('Auth Controller', () => {
  beforeEach(() => {
    // Setup test data
  });

  it('should login user with valid credentials', async () => {
    const req = {
      body: {
        email: 'test@example.com',
        password: 'password123'
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Login successful'
    });
  });
});
```

---

## 🔧 การพัฒนา

### การเพิ่ม API ใหม่

#### 1. สร้าง Controller
```typescript
// src/controllers/newController.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';

export const getNewData = asyncHandler(async (req: Request, res: Response) => {
  // Implementation
  res.json({
    success: true,
    data: result
  });
});
```

#### 2. สร้าง Route
```typescript
// src/routes/new.ts
import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getNewData } from '../controllers/newController';

const router = Router();

router.get('/new-data', authenticate, authorize(['admin']), getNewData);

export default router;
```

#### 3. เพิ่มใน app.ts
```typescript
import newRoutes from './routes/new';
this.app.use('/api/new', newRoutes);
```

### การเพิ่ม Frontend Component

#### 1. สร้าง Component
```typescript
// src/components/NewComponent.tsx
import React from 'react';

interface NewComponentProps {
  data: any;
  onUpdate: (data: any) => void;
}

export const NewComponent: React.FC<NewComponentProps> = ({ data, onUpdate }) => {
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
};
```

#### 2. สร้าง Page
```typescript
// src/app/new/page.tsx
import { NewComponent } from '@/components/NewComponent';

export default function NewPage() {
  return (
    <div>
      <h1>New Page</h1>
      <NewComponent />
    </div>
  );
}
```

### การเพิ่ม Database Table

#### 1. สร้าง Migration
```typescript
// src/database/migrations/001_create_new_table.sql
CREATE TABLE new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. อัปเดต Migration Runner
```typescript
// src/database/migrations.ts
export const createNewTable = async (db: DatabaseManager) => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS new_table (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};
```

---

## 🚀 การ Deploy

### Development Environment
```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

### Production Environment

#### Backend Deployment
```bash
# Build
npm run build

# Start
npm start
```

#### Frontend Deployment
```bash
# Build
npm run build

# Start
npm start
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Environment Configuration
```env
# Production
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db:5432/emr_system
JWT_SECRET=production-secret-key
```

---

## 🔍 การ Debug

### Backend Debugging
```bash
# Run with debug mode
npm run dev:debug

# Use VS Code debugger
# Add breakpoints in code
# Press F5 to start debugging
```

### Frontend Debugging
```bash
# Use browser dev tools
# React Developer Tools
# Redux DevTools (if using Redux)
```

### Database Debugging
```bash
# Connect to database
psql -h localhost -U username -d emr_system

# View logs
tail -f /var/log/postgresql/postgresql.log
```

---

## 📊 Performance Monitoring

### Backend Performance
```bash
# Run performance tests
npm run perf:api
npm run perf:db
npm run perf:concurrent
```

### Frontend Performance
```bash
# Run Lighthouse tests
npm run perf:lighthouse

# Bundle analysis
npm run perf:bundle
```

### Monitoring Tools
- **Application Performance Monitoring**: New Relic, DataDog
- **Error Tracking**: Sentry
- **Log Management**: ELK Stack, Splunk

---

## 🔒 Security Best Practices

### Authentication & Authorization
- ใช้ JWT tokens ที่ปลอดภัย
- ตั้งค่า token expiration
- ใช้ HTTPS ใน production
- ตรวจสอบ permissions ทุก request

### Data Protection
- เข้ารหัสข้อมูลสำคัญ
- ใช้ prepared statements
- ตรวจสอบ input validation
- ใช้ rate limiting

### Code Security
- ตรวจสอบ dependencies
- ใช้ environment variables
- ไม่เก็บ secrets ใน code
- ใช้ linting tools

---

## 📚 Resources และ Tools

### Documentation
- **API Docs**: `/api-docs` (Swagger UI)
- **Database Schema**: `DATABASE_SUMMARY.md`
- **User Manual**: `USER_MANUAL.md`
- **Admin Guide**: `ADMIN_GUIDE.md`

### Development Tools
- **VS Code**: Recommended IDE
- **Postman**: API testing
- **pgAdmin**: Database management
- **Git**: Version control

### Useful Commands
```bash
# Database
npm run db:init          # Initialize database
npm run db:migrate       # Run migrations
npm run db:seed          # Seed sample data
npm run db:reset         # Reset database

# Testing
npm test                 # Run tests
npm run test:coverage    # Run with coverage
npm run test:watch       # Watch mode

# Performance
npm run perf:api         # API performance
npm run perf:db          # Database performance
npm run perf:concurrent  # Concurrent users

# Linting
npm run lint             # Run linter
npm run lint:fix         # Fix linting issues
```

---

## 🤝 Contributing

### Git Workflow
1. **Fork repository**
2. **Create feature branch**: `git checkout -b feature/new-feature`
3. **Make changes**
4. **Run tests**: `npm test`
5. **Commit changes**: `git commit -m "Add new feature"`
6. **Push to branch**: `git push origin feature/new-feature`
7. **Create Pull Request**

### Code Standards
- ใช้ TypeScript
- ใช้ ESLint และ Prettier
- เขียน tests สำหรับ code ใหม่
- ใช้ meaningful commit messages
- ใช้ conventional commits

### Pull Request Guidelines
- อธิบายการเปลี่ยนแปลง
- เพิ่ม tests ถ้าจำเป็น
- อัปเดต documentation
- ตรวจสอบว่า tests ผ่าน

---

## 📞 การติดต่อและสนับสนุน

### ทีมพัฒนา
- **Lead Developer**: dev-lead@emrsystem.com
- **Backend Team**: backend@emrsystem.com
- **Frontend Team**: frontend@emrsystem.com
- **DevOps Team**: devops@emrsystem.com

### การขอความช่วยเหลือ
- **GitHub Issues**: สำหรับ bug reports และ feature requests
- **Slack**: #emr-development
- **Email**: dev-support@emrsystem.com

### การฝึกอบรม
- **Code Review Sessions**: ทุกสัปดาห์
- **Technical Talks**: ทุกเดือน
- **Workshops**: ตามความต้องการ

---

**📝 หมายเหตุ:** คู่มือนี้ครอบคลุมการพัฒนาเบื้องต้น หากต้องการข้อมูลเพิ่มเติม กรุณาติดต่อทีมพัฒนา
