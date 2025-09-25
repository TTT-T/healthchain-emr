# 🏥 EMR System - โครงสร้างไฟล์ทั้งหมด

## 📋 ภาพรวมโปรเจค
ระบบ EMR (Electronic Medical Records) ที่พัฒนาด้วย Next.js, Express.js, และ PostgreSQL

---

## 🗂️ โครงสร้างไฟล์หลัก

```
Project/
├── 📁 backend/                    # Backend API Server (Express.js + TypeScript)
├── 📁 frontend/                   # Frontend Application (Next.js + React)
├── 📁 scripts/                    # Utility Scripts
├── 📄 docker-compose.yml          # Docker Configuration
├── 📄 README.md                   # Project Documentation
├── 📄 AI_Diabetes_Risk_Assessment_System.md
├── 📄 Machine_Learning_Integration_Potential.md
└── 📄 PROJECT_STRUCTURE.md        # This File
```

---

## 🔧 Backend Structure (`/backend`)

### 📁 Core Files
```
backend/
├── 📄 package.json                # Dependencies & Scripts
├── 📄 tsconfig.json               # TypeScript Configuration
├── 📄 nodemon.json                # Development Server Config
├── 📄 ecosystem.config.js         # PM2 Configuration
├── 📄 Dockerfile                  # Docker Image Config
├── 📄 env.example                 # Environment Variables Template
└── 📄 server.ts                   # Main Server Entry Point
```

### 📁 Source Code (`/src`)
```
src/
├── 📄 app.ts                      # Express App Configuration
├── 📄 server.ts                   # Server Startup
│
├── 📁 config/                     # Configuration Files
│   ├── 📄 config.ts               # Main Configuration
│   ├── 📄 index.ts                # Config Exports
│   └── 📄 swagger.ts              # API Documentation
│
├── 📁 controllers/                # API Controllers (58 files)
│   ├── 📄 authController.ts       # Authentication
│   ├── 📄 patientManagementController.ts
│   ├── 📄 historyTakingController.ts
│   ├── 📄 appointmentsController.ts
│   ├── 📄 notificationsController.ts
│   ├── 📄 aiDashboardController.ts
│   ├── 📄 adminUserManagementController.ts
│   └── ... (51 more controllers)
│
├── 📁 database/                   # Database Layer
│   ├── 📄 connection.ts           # Database Connection
│   ├── 📄 init.ts                 # Database Initialization
│   ├── 📄 migrations.ts           # Migration Runner
│   ├── 📄 doctors.ts              # Doctor Data Access
│   └── 📁 migrations/             # Database Migrations (30 files)
│       ├── 📄 001_medical_tables.sql
│       ├── 📄 019_create_notifications_table.sql
│       ├── 📄 025_fix_timezone_to_thailand.sql
│       └── ... (27 more migrations)
│
├── 📁 middleware/                 # Express Middleware
│   ├── 📄 auth.ts                 # Authentication Middleware
│   ├── 📄 cors.ts                 # CORS Configuration
│   ├── 📄 errorHandler.ts         # Error Handling
│   └── 📄 requestLogger.ts        # Request Logging
│
├── 📁 routes/                     # API Routes
│   ├── 📄 admin.ts                # Admin Routes
│   ├── 📄 auth.ts                 # Authentication Routes
│   ├── 📄 medical.ts              # Medical API Routes
│   ├── 📄 appointments.ts         # Appointment Routes
│   └── ... (6 more route files)
│
├── 📁 schemas/                    # Data Validation Schemas
│   ├── 📄 user.ts                 # User Validation
│   ├── 📄 profile.ts              # Profile Validation
│   └── 📄 common.ts               # Common Schemas
│
├── 📁 services/                   # Business Logic Services
│   ├── 📄 notificationService.ts  # Notification System
│   ├── 📄 emailService.ts         # Email Service
│   ├── 📄 diabetesRiskAssessmentService.ts
│   └── ... (3 more services)
│
├── 📁 scripts/                    # Database Scripts
│   ├── 📄 seed.ts                 # Database Seeding
│   ├── 📄 createDefaultUsers.ts   # Default User Creation
│   └── ... (4 more scripts)
│
├── 📁 tests/                      # Test Files
│   ├── 📁 unit/                   # Unit Tests
│   ├── 📁 integration/            # Integration Tests
│   └── 📁 e2e/                    # End-to-End Tests
│
├── 📁 types/                      # TypeScript Type Definitions
│   └── 📄 index.ts
│
└── 📁 utils/                      # Utility Functions
    ├── 📄 logger.ts               # Logging Utility
    ├── 📄 thailandTime.ts         # Timezone Utilities
    └── ... (3 more utilities)
```

### 📁 Development Files
```
backend/
├── 📁 dist/                       # Compiled JavaScript
├── 📁 logs/                       # Application Logs
├── 📁 node_modules/               # Dependencies
├── 📁 postman/                    # API Testing Collection
│
├── 📄 check-*.js                  # Database Check Scripts (15 files)
├── 📄 test-*.js                   # Test Scripts (25 files)
├── 📄 fix-*.js                    # Fix Scripts (8 files)
└── 📄 *SUMMARY.md                 # Fix Documentation (8 files)
```

---

## 🎨 Frontend Structure (`/frontend`)

### 📁 Core Files
```
frontend/
├── 📄 package.json                # Dependencies & Scripts
├── 📄 next.config.ts              # Next.js Configuration
├── 📄 tsconfig.json               # TypeScript Configuration
├── 📄 tailwind.config.js          # Tailwind CSS Config
├── 📄 postcss.config.mjs          # PostCSS Configuration
├── 📄 eslint.config.mjs           # ESLint Configuration
├── 📄 jest.config.js              # Jest Testing Config
├── 📄 Dockerfile                  # Docker Image Config
└── 📄 Dockerfile.production       # Production Docker Config
```

### 📁 Source Code (`/src`)
```
src/
├── 📄 middleware.ts               # Next.js Middleware
├── 📄 globals.css                 # Global Styles
│
├── 📁 app/                        # Next.js App Router
│   ├── 📄 layout.tsx              # Root Layout
│   ├── 📄 page.tsx                # Home Page
│   │
│   ├── 📁 accounts/               # User Account Pages
│   │   ├── 📁 patient/            # Patient Account (15 files)
│   │   │   ├── 📄 dashboard/page.tsx
│   │   │   ├── 📄 notifications/page.tsx
│   │   │   ├── 📄 profile/page.tsx
│   │   │   └── ... (12 more pages)
│   │   ├── 📁 doctor/             # Doctor Account (3 files)
│   │   ├── 📁 nurse/              # Nurse Account (3 files)
│   │   └── 📁 security-settings/  # Security Settings
│   │
│   ├── 📁 admin/                  # Admin Panel (25+ files)
│   │   ├── 📄 layout.tsx          # Admin Layout
│   │   ├── 📄 page.tsx            # Admin Dashboard
│   │   ├── 📁 dashboard/          # Dashboard Variants
│   │   ├── 📁 consent-requests/   # Consent Management
│   │   ├── 📁 user-management/    # User Management
│   │   └── ... (20+ more admin pages)
│   │
│   ├── 📁 emr/                    # EMR System (19 files)
│   │   ├── 📄 dashboard/page.tsx  # EMR Dashboard
│   │   ├── 📄 history-taking/page.tsx
│   │   ├── 📄 doctor-visit/page.tsx
│   │   ├── 📄 pharmacy/page.tsx
│   │   ├── 📄 appointments/page.tsx
│   │   ├── 📄 lab-result/page.tsx
│   │   └── ... (13 more EMR pages)
│   │
│   ├── 📁 external-requesters/    # External Users (14 files)
│   ├── 📁 api/                    # API Routes (20+ files)
│   ├── 📁 login/                  # Authentication Pages
│   ├── 📁 register/               # Registration Pages
│   └── ... (15+ more page directories)
│
├── 📁 components/                 # React Components
│   ├── 📄 AppLayout.tsx           # Main App Layout
│   ├── 📄 AdminSidebar.tsx        # Admin Navigation
│   ├── 📄 EMRSidebar.tsx          # EMR Navigation
│   ├── 📄 Header.tsx              # Main Header
│   ├── 📄 ErrorBoundary.tsx       # Error Handling
│   ├── 📁 ui/                     # UI Components (17 files)
│   │   ├── 📄 Button.tsx
│   │   ├── 📄 Modal.tsx
│   │   ├── 📄 Table.tsx
│   │   └── ... (14 more UI components)
│   └── ... (10+ more components)
│
├── 📁 contexts/                   # React Contexts
│   ├── 📄 AuthContext.tsx         # Authentication Context
│   ├── 📄 NotificationContext.tsx # Notification Context
│   ├── 📄 AdminAuthContext.tsx    # Admin Auth Context
│   └── 📄 ExternalAuthContext.tsx # External User Context
│
├── 📁 hooks/                      # Custom React Hooks
│   ├── 📄 useAuth.ts              # Authentication Hook
│   ├── 📄 useAPIClient.ts         # API Client Hook
│   ├── 📄 useTokenExpiry.ts       # Token Management
│   └── ... (4 more hooks)
│
├── 📁 services/                   # API Services (25+ files)
│   ├── 📄 patientService.ts       # Patient API
│   ├── 📄 appointmentService.ts   # Appointment API
│   ├── 📄 notificationService.ts  # Notification API
│   ├── 📄 aiDashboardService.ts   # AI Dashboard API
│   └── ... (21+ more services)
│
├── 📁 lib/                        # Utility Libraries
│   ├── 📄 api.ts                  # API Client
│   ├── 📄 config.ts               # Configuration
│   ├── 📄 logger.ts               # Logging
│   └── ... (5 more utilities)
│
├── 📁 types/                      # TypeScript Types
│   ├── 📄 index.ts                # Main Types
│   ├── 📄 user.ts                 # User Types
│   ├── 📄 appointment.ts          # Appointment Types
│   └── 📄 api.ts                  # API Types
│
├── 📁 utils/                      # Utility Functions
│   ├── 📄 dateUtils.ts            # Date Utilities
│   ├── 📄 thailandTime.ts         # Timezone Utilities
│   └── ... (3 more utilities)
│
└── 📁 templates/                  # Email Templates
    └── 📄 emailTemplates.ts
```

### 📁 Development Files
```
frontend/
├── 📁 public/                     # Static Assets
├── 📁 node_modules/               # Dependencies
├── 📁 .next/                      # Next.js Build Cache
│
├── 📄 fix-all-issues*.js          # Issue Fix Scripts (10 files)
├── 📄 fix-comprehensive-errors.js
├── 📄 fix-final-errors.js
└── 📄 fix-remaining-errors.js
```

---

## 🗄️ Database Structure

### 📊 Main Tables
- **users** - ผู้ใช้ระบบ (แพทย์, พยาบาล, ผู้ป่วย, แอดมิน)
- **patients** - ข้อมูลผู้ป่วย
- **doctors** - ข้อมูลแพทย์
- **nurses** - ข้อมูลพยาบาล
- **medical_records** - บันทึกทางการแพทย์
- **appointments** - นัดหมาย
- **notifications** - การแจ้งเตือน
- **consent_requests** - คำขอเข้าถึงข้อมูล
- **ai_research_data** - ข้อมูลวิจัย AI
- **ai_insights** - ข้อมูลเชิงลึก AI

### 🔄 Migration Files (30 files)
```
migrations/
├── 📄 001_medical_tables.sql      # ตารางหลักทางการแพทย์
├── 📄 002_add_patient_fields.sql  # เพิ่มฟิลด์ผู้ป่วย
├── 📄 003_appointments_tables.sql # ตารางนัดหมาย
├── 📄 019_create_notifications_table.sql # ตารางการแจ้งเตือน
├── 📄 025_fix_timezone_to_thailand.sql # แก้ไข timezone
├── 📄 027_create_ai_research_data_table.sql # ตารางข้อมูล AI
└── ... (24 more migrations)
```

---

## 🚀 Key Features

### 👥 User Management
- **Multi-role System**: Patient, Doctor, Nurse, Admin, External Requester
- **Authentication**: JWT-based with refresh tokens
- **Profile Management**: Complete user profiles with Thai/English names
- **Approval System**: Admin approval for new users

### 🏥 EMR System
- **History Taking**: Comprehensive patient history recording
- **Doctor Visits**: Visit management and documentation
- **Appointments**: Scheduling and management
- **Lab Results**: Laboratory result management
- **Pharmacy**: Medication dispensing
- **Notifications**: Real-time patient notifications

### 🤖 AI Integration
- **Risk Assessment**: Diabetes risk assessment
- **Research Data**: AI research data collection
- **Insights Dashboard**: AI-powered insights
- **Machine Learning**: ML model integration potential

### 🔐 Security & Compliance
- **Consent Management**: GDPR-compliant consent system
- **Audit Logs**: Complete activity logging
- **Data Protection**: Secure data handling
- **Role-based Access**: Granular permissions

### 📊 Admin Panel
- **User Management**: Complete user administration
- **System Monitoring**: Performance and health monitoring
- **Database Management**: Database administration tools
- **Compliance Dashboard**: Regulatory compliance tracking

---

## 🛠️ Technology Stack

### Backend
- **Node.js** + **Express.js** - Server framework
- **TypeScript** - Type safety
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Swagger** - API documentation

### Frontend
- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Context** - State management
- **Axios** - HTTP client

### DevOps
- **Docker** - Containerization
- **PM2** - Process management
- **Jest** - Testing
- **ESLint** - Code quality

---

## 📝 Development Notes

### 🔧 Scripts
- **Fix Scripts**: Multiple scripts for fixing various issues
- **Test Scripts**: Comprehensive testing utilities
- **Migration Scripts**: Database migration tools
- **Seed Scripts**: Database seeding utilities

### 📋 Documentation
- **Fix Summaries**: Detailed documentation of all fixes applied
- **API Documentation**: Swagger-based API docs
- **User Guides**: Registration and usage guides
- **System Documentation**: Comprehensive system documentation

### 🧪 Testing
- **Unit Tests**: Component and function testing
- **Integration Tests**: API integration testing
- **E2E Tests**: End-to-end workflow testing
- **Contract Tests**: API contract validation

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Docker (optional)

### Installation
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### Environment Setup
```bash
# Copy environment files
cp backend/env.example backend/.env
# Configure database and other settings
```

---

*📅 Last Updated: 2025-01-25*
*🔄 Version: 1.0.0*
*👨‍💻 Maintained by: Development Team*
