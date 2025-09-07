# โครงสร้างไฟล์และโฟลเดอร์

เอกสารนี้แสดงโครงสร้างไฟล์ทั้งหมดในโปรเจค EMR Patient Portal System พร้อมคำอธิบายหน้าที่ของแต่ละไฟล์และโฟลเดอร์

## โครงสร้างหลัก

```
Project/
├── backend/                    # Backend API Server
├── frontend/                   # Frontend Web Application
├── scripts/                    # Build และ Deployment Scripts
├── docker-compose.yml          # Docker Configuration
└── README.md                   # เอกสารหลักของโปรเจค
```

## Backend Structure

### Root Level
```
backend/
├── src/                        # Source Code
├── dist/                       # Compiled JavaScript (Auto-generated)
├── node_modules/               # Dependencies (Auto-generated)
├── package.json                # Node.js Dependencies และ Scripts
├── package-lock.json           # Lock file สำหรับ Dependencies
├── tsconfig.json               # TypeScript Configuration
├── nodemon.json                # Nodemon Configuration สำหรับ Development
├── ecosystem.config.js         # PM2 Configuration สำหรับ Production
├── Dockerfile                  # Docker Configuration สำหรับ Backend
└── env.production.example      # Environment Variables Template
```

### Source Code Structure
```
backend/src/
├── app.ts                      # Main Application Entry Point
├── server.ts                   # Server Configuration และ Startup
├── config/                     # Configuration Files
│   ├── index.ts                # Main Configuration Export
│   ├── config.ts               # Environment และ App Configuration
│   └── swagger.ts              # API Documentation Configuration
├── controllers/                # API Controllers (37 files)
│   ├── authController.ts       # Authentication Logic
│   ├── patientController.ts    # Patient Management Logic
│   ├── medicalController.ts    # Medical Records Logic
│   ├── appointmentController.ts # Appointment Management
│   ├── consentController.ts    # Consent Management
│   ├── externalRequesterController.ts # External API Logic
│   └── ... (31 more controllers)
├── database/                   # Database Configuration
│   ├── connection.ts           # Database Connection Setup
│   ├── index.ts                # Database Module Export
│   ├── init.ts                 # Database Initialization
│   ├── migrations.ts           # Database Migration Scripts
│   └── *.sql                   # SQL Schema Files (4 files)
├── middleware/                 # Express Middleware
│   ├── auth.ts                 # Authentication Middleware
│   ├── cors.ts                 # CORS Configuration
│   ├── errorHandler.ts         # Error Handling Middleware
│   └── requestLogger.ts        # Request Logging Middleware
├── routes/                     # API Routes (11 files)
│   ├── auth.ts                 # Authentication Routes
│   ├── patients.ts             # Patient Management Routes
│   ├── medical.ts              # Medical Records Routes
│   ├── appointments.ts         # Appointment Routes
│   ├── consent.ts              # Consent Management Routes
│   ├── external-requesters.ts  # External Requester Routes
│   ├── admin.ts                # Admin Routes
│   ├── ai.ts                   # AI Services Routes
│   ├── health.ts               # Health Check Routes
│   ├── profile.ts              # User Profile Routes
│   └── security.ts             # Security Routes
├── schemas/                    # Validation Schemas
│   └── common.ts               # Common Validation Schemas
├── services/                   # Business Logic Services (4 files)
│   ├── authService.ts          # Authentication Service
│   ├── patientService.ts       # Patient Management Service
│   ├── medicalService.ts       # Medical Records Service
│   └── consentService.ts       # Consent Management Service
├── types/                      # TypeScript Type Definitions
│   └── index.ts                # Main Type Definitions
├── utils/                      # Utility Functions
│   ├── index.ts                # General Utilities
│   └── serializer.ts           # Data Serialization Utilities
├── scripts/                    # Database และ Setup Scripts (6 files)
│   ├── seed.ts                 # Database Seeding Script
│   ├── migrate.ts              # Migration Script
│   ├── backup.ts               # Database Backup Script
│   ├── restore.ts              # Database Restore Script
│   ├── setup.ts                # Initial Setup Script
│   └── cleanup.ts              # Cleanup Script
└── tests/                      # Test Files (7 files)
    ├── setup.ts                # Test Setup Configuration
    ├── auth.test.ts            # Authentication Tests
    ├── patient.test.ts         # Patient Management Tests
    ├── medical.test.ts         # Medical Records Tests
    ├── consent.test.ts         # Consent Management Tests
    ├── integration.test.ts     # Integration Tests
    └── e2e.test.ts             # End-to-End Tests
```

### Compiled Output Structure
```
backend/dist/                   # Compiled JavaScript Output
├── app.js                      # Compiled Main Application
├── server.js                   # Compiled Server
├── config/                     # Compiled Configuration
├── controllers/                # Compiled Controllers
├── database/                   # Compiled Database Files
├── middleware/                 # Compiled Middleware
├── routes/                     # Compiled Routes
├── schemas/                    # Compiled Schemas
├── services/                   # Compiled Services
├── types/                      # Compiled Types
├── utils/                      # Compiled Utilities
├── scripts/                    # Compiled Scripts
└── tests/                      # Compiled Tests
```

## Frontend Structure

### Root Level
```
frontend/
├── src/                        # Source Code
├── public/                     # Static Assets
├── node_modules/               # Dependencies (Auto-generated)
├── package.json                # Node.js Dependencies และ Scripts
├── package-lock.json           # Lock file สำหรับ Dependencies
├── tsconfig.json               # TypeScript Configuration
├── tsconfig.production.json    # Production TypeScript Configuration
├── next.config.ts              # Next.js Configuration
├── next.config.production.js   # Production Next.js Configuration
├── tailwind.config.js          # Tailwind CSS Configuration
├── postcss.config.mjs          # PostCSS Configuration
├── eslint.config.mjs           # ESLint Configuration
├── jest.config.js              # Jest Testing Configuration
├── jest.setup.js               # Jest Setup
├── jest.setup.ts               # Jest TypeScript Setup
├── Dockerfile                  # Docker Configuration
├── Dockerfile.production       # Production Docker Configuration
├── env.production.example      # Environment Variables Template
└── PRODUCTION_READY.md         # Production Deployment Guide
```

### Source Code Structure
```
frontend/src/
├── app/                        # Next.js App Router (92 files)
│   ├── layout.tsx              # Root Layout Component
│   ├── page.tsx                # Home Page
│   ├── globals.css             # Global CSS Styles
│   ├── accounts/               # User Account Pages
│   │   ├── change-password/    # Change Password Page
│   │   ├── doctor/             # Doctor Account Pages
│   │   │   └── profile/        # Doctor Profile Page
│   │   ├── nurse/              # Nurse Account Pages
│   │   │   └── profile/        # Nurse Profile Page
│   │   └── patient/            # Patient Account Pages
│   │       ├── appointments/   # Patient Appointments
│   │       │   └── create-appointment-dialog.tsx
│   │       ├── consent-requests/ # Consent Requests
│   │       ├── lab-results/    # Lab Results
│   │       ├── medications/    # Medications
│   │       └── notifications/  # Notifications
│   ├── admin/                  # Admin Pages
│   │   ├── login/              # Admin Login
│   │   └── database-management/ # Database Management
│   ├── consent/                # Consent Management
│   │   └── dashboard/          # Consent Dashboard
│   ├── emr/                    # EMR System Pages
│   │   ├── checkin/            # Patient Check-in
│   │   ├── dashboard/          # EMR Dashboard
│   │   ├── doctor-visit/       # Doctor Visit
│   │   ├── history-taking/     # History Taking
│   │   ├── pharmacy/           # Pharmacy Management
│   │   └── register-patient/   # Patient Registration
│   ├── external-requesters/    # External Requester Pages
│   │   ├── dashboard/          # External Requester Dashboard
│   │   ├── login/              # External Requester Login
│   │   ├── my-requests/        # My Requests
│   │   ├── new-request/        # New Request
│   │   ├── notifications/      # Notifications
│   │   ├── page.tsx            # Main External Requester Page
│   │   ├── profile/            # Profile Management
│   │   ├── register/           # Registration
│   │   ├── reports/            # Reports
│   │   ├── search/             # Patient Search
│   │   └── settings/           # Settings
│   ├── forgot-password/        # Forgot Password
│   ├── reset-password/         # Reset Password
│   ├── setup-profile/          # Profile Setup
│   └── verify-email/           # Email Verification
├── components/                 # Reusable Components (36 files)
│   ├── ui/                     # UI Components
│   │   ├── alert.tsx           # Alert Component
│   │   ├── badge.tsx           # Badge Component
│   │   ├── button.tsx          # Button Component
│   │   ├── card.tsx            # Card Component
│   │   ├── input.tsx           # Input Component
│   │   ├── modal.tsx           # Modal Component
│   │   ├── table.tsx           # Table Component
│   │   └── ... (28 more UI components)
│   ├── forms/                  # Form Components
│   ├── layout/                 # Layout Components
│   └── common/                 # Common Components
├── contexts/                   # React Contexts (3 files)
│   ├── AuthContext.tsx         # Authentication Context
│   ├── ThemeContext.tsx        # Theme Context
│   └── NotificationContext.tsx # Notification Context
├── hooks/                      # Custom React Hooks (4 files)
│   ├── useAuth.ts              # Authentication Hook
│   ├── useApi.ts               # API Hook
│   ├── useWebSocket.ts         # WebSocket Hook
│   └── useLocalStorage.ts      # Local Storage Hook
├── lib/                        # Library Functions (8 files)
│   ├── api.ts                  # API Client
│   ├── auth.ts                 # Authentication Utilities
│   ├── logger.ts               # Logging Utilities
│   ├── errorHandler.ts         # Error Handling
│   ├── validation.ts           # Validation Utilities
│   ├── dateUtils.ts            # Date Utilities
│   ├── formatUtils.ts          # Formatting Utilities
│   └── constants.ts            # Application Constants
├── services/                   # Service Layer (8 files)
│   ├── authService.ts          # Authentication Service
│   ├── patientService.ts       # Patient Management Service
│   ├── medicalService.ts       # Medical Records Service
│   ├── appointmentService.ts   # Appointment Service
│   ├── consentService.ts       # Consent Service
│   ├── documentService.ts      # Document Service
│   ├── labService.ts           # Lab Service
│   └── pharmacyService.ts      # Pharmacy Service
├── types/                      # TypeScript Types (3 files)
│   ├── api.ts                  # API Types
│   ├── appointment.ts          # Appointment Types
│   └── index.ts                # Main Type Definitions
├── middleware.ts               # Next.js Middleware
├── __tests__/                  # Test Files
│   └── e2e/                    # End-to-End Tests
└── scripts/                    # Build Scripts (2 files)
    ├── build.js                # Build Script
    └── replace-console-logs.js # Console Log Replacement
```

### Public Assets
```
frontend/public/
├── ai-icon.svg                 # AI Icon
├── blockchain-icon.svg         # Blockchain Icon
├── file.svg                    # File Icon
├── globe.svg                   # Globe Icon
├── next.svg                    # Next.js Logo
├── vercel.svg                  # Vercel Logo
└── window.svg                  # Window Icon
```

## Scripts Structure

```
scripts/
└── build-production.sh         # Production Build Script
```

## ไฟล์ Configuration หลัก

### Backend Configuration
- **package.json**: Dependencies และ Scripts สำหรับ Backend
- **tsconfig.json**: TypeScript Configuration
- **nodemon.json**: Development Server Configuration
- **ecosystem.config.js**: PM2 Production Configuration
- **Dockerfile**: Docker Container Configuration

### Frontend Configuration
- **package.json**: Dependencies และ Scripts สำหรับ Frontend
- **tsconfig.json**: TypeScript Configuration
- **next.config.ts**: Next.js Configuration
- **tailwind.config.js**: Tailwind CSS Configuration
- **eslint.config.mjs**: Code Linting Configuration
- **jest.config.js**: Testing Configuration

### Project Configuration
- **docker-compose.yml**: Multi-container Docker Setup
- **README.md**: เอกสารหลักของโปรเจค
- **PROJECT_STRUCTURE.md**: เอกสารโครงสร้างไฟล์ (ไฟล์นี้)

## ไฟล์ที่ Auto-generated

### Backend
- **dist/**: โฟลเดอร์ที่สร้างโดย TypeScript Compiler
- **node_modules/**: Dependencies ที่ติดตั้งโดย npm

### Frontend
- **node_modules/**: Dependencies ที่ติดตั้งโดย npm
- **.next/**: Next.js Build Output (ไม่แสดงในโครงสร้าง)
- **tsconfig.tsbuildinfo**: TypeScript Build Cache

## ไฟล์ Environment

### Backend
- **.env**: Environment Variables (ไม่ commit)
- **env.production.example**: Template สำหรับ Production

### Frontend
- **.env.local**: Local Environment Variables (ไม่ commit)
- **env.production.example**: Template สำหรับ Production

## ไฟล์ Documentation

- **README.md**: เอกสารหลัก
- **PROJECT_STRUCTURE.md**: เอกสารโครงสร้างไฟล์
- **SYSTEM_DOCUMENTATION.md**: คู่มือระบบละเอียด
- **TODO_LIST.md**: รายการสิ่งที่ต้องทำ
- **ISSUES_NOT_WORKING.md**: ปัญหาที่ยังไม่ได้แก้ไข
- **BACKEND_DEVELOPMENT_ROADMAP.md**: แผนพัฒนา Backend
- **PRODUCTION_READY.md**: คู่มือ Production Deployment

## การใช้งานเอกสารนี้

เอกสารนี้ช่วยให้:
1. **เข้าใจโครงสร้าง**: รู้ว่าไฟล์ไหนอยู่ที่ไหน
2. **หาข้อมูลง่าย**: รู้ว่าไฟล์ไหนทำหน้าที่อะไร
3. **แก้ไขได้เร็ว**: รู้ว่าต้องแก้ไขไฟล์ไหน
4. **เพิ่มฟีเจอร์ใหม่**: รู้ว่าต้องเพิ่มไฟล์ที่ไหน
5. **Debug**: รู้ว่าปัญหาอาจมาจากไฟล์ไหน

## การอัพเดทเอกสาร

เมื่อมีการเปลี่ยนแปลงโครงสร้างโปรเจค:
1. อัพเดทโครงสร้างไฟล์ในเอกสารนี้
2. อัพเดทคำอธิบายหน้าที่ของไฟล์ใหม่
3. อัพเดทวันที่แก้ไขล่าสุด
4. Commit การเปลี่ยนแปลงพร้อมกับโค้ด
