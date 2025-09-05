# 🏥 HealthChain EMR System - Setup Guide

## 📋 Overview

HealthChain EMR System เป็นระบบจัดการข้อมูลทางการแพทย์ที่ครบครัน ประกอบด้วย:

- **Backend API**: Node.js + Express + TypeScript + PostgreSQL
- **Frontend**: Next.js 15 + React + TypeScript + Tailwind CSS
- **Database**: PostgreSQL with comprehensive medical schema
- **Authentication**: JWT-based with role-based access control
- **Features**: Patient management, medical records, appointments, AI risk assessment, consent management

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 15+
- npm หรือ yarn
- Git

### 1. Clone Repository

```bash
git clone <repository-url>
cd emr-system
```

### 2. Database Setup

#### Install PostgreSQL
```bash
# Windows (using Chocolatey)
choco install postgresql

# macOS (using Homebrew)
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
```

#### Create Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE emr_development;
CREATE USER emr_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE emr_development TO emr_user;
\q
```

### 3. Environment Configuration

#### Backend Environment
สร้างไฟล์ `backend/.env`:
```env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=emr_development
DB_USER=postgres
DB_PASSWORD=12345
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-2025
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production-2025
```

#### Frontend Environment
สร้างไฟล์ `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 4. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 5. Database Migration

```bash
# Run database migrations
cd backend
npm run migrate

# Create default users
npm run create-default-users
```

### 6. Start Development Servers

#### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

#### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

### 7. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health

## 🐳 Docker Setup (Alternative)

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 👥 Default Users

หลังจากรัน migration จะมี default users:

| Role | Username | Password | Description |
|------|----------|----------|-------------|
| admin | admin | admin123 | System Administrator |
| doctor | doctor | doctor123 | Medical Doctor |
| nurse | nurse | nurse123 | Registered Nurse |
| patient | patient | patient123 | Patient User |

## 🔧 Development Commands

### Backend Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run migrate      # Run database migrations
npm run seed         # Seed database with sample data
npm run test         # Run tests
npm run lint         # Run ESLint
```

### Frontend Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

## 📁 Project Structure

```
emr-system/
├── backend/                 # Backend API
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── database/        # Database connection & migrations
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utility functions
│   ├── package.json
│   └── tsconfig.json
├── frontend/                # Frontend Application
│   ├── src/
│   │   ├── app/             # Next.js app directory
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # Utility libraries
│   │   ├── services/        # API services
│   │   └── types/           # TypeScript types
│   ├── package.json
│   └── next.config.ts
├── docker-compose.yml       # Docker configuration
└── README.md
```

## 🔐 Authentication & Authorization

### User Roles
- **admin**: Full system access
- **doctor**: Medical staff access
- **nurse**: Nursing staff access
- **patient**: Patient portal access
- **external_user**: External requester access

### API Authentication
```bash
# Login to get tokens
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Use token in requests
curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🏥 Medical Features

### Patient Management
- Patient registration and profile management
- Medical history tracking
- Insurance information
- Emergency contacts

### Medical Records
- Visit records
- Vital signs
- Lab orders and results
- Prescriptions
- Medical documents

### Appointments
- Appointment scheduling
- Doctor availability
- Patient notifications
- Calendar integration

### AI Risk Assessment
- Diabetes risk assessment
- Hypertension risk assessment
- Heart disease risk assessment
- Risk history tracking

### Consent Management
- Smart contracts for data sharing
- Consent tracking and audit
- External requester management
- Blockchain integration (future)

## 🛠️ Troubleshooting

### Common Issues

#### Database Connection Error
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Check connection
psql -U postgres -h localhost -p 5432
```

#### Port Already in Use
```bash
# Find process using port
lsof -i :3001
lsof -i :3000

# Kill process
kill -9 <PID>
```

#### Node Modules Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Logs and Debugging

#### Backend Logs
```bash
# View backend logs
cd backend
npm run dev

# Or with Docker
docker-compose logs backend
```

#### Frontend Logs
```bash
# View frontend logs
cd frontend
npm run dev

# Or with Docker
docker-compose logs frontend
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Patient Endpoints
- `GET /api/patients` - List patients
- `POST /api/patients` - Create patient
- `GET /api/patients/:id` - Get patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Medical Records Endpoints
- `GET /api/visits` - List visits
- `POST /api/visits` - Create visit
- `GET /api/vital-signs` - List vital signs
- `POST /api/vital-signs` - Create vital signs
- `GET /api/lab-orders` - List lab orders
- `POST /api/lab-orders` - Create lab order

## 🔒 Security Considerations

### Production Deployment
1. Change all default passwords
2. Use strong JWT secrets
3. Enable HTTPS
4. Configure CORS properly
5. Set up rate limiting
6. Enable audit logging
7. Regular security updates

### Environment Variables
```env
# Production environment variables
NODE_ENV=production
JWT_SECRET=your-very-strong-secret-key
DB_PASSWORD=your-strong-database-password
SMTP_PASSWORD=your-email-password
```

## 📞 Support

หากมีปัญหาหรือคำถาม:
1. ตรวจสอบ logs ใน console
2. ดู troubleshooting section
3. ตรวจสอบ environment variables
4. ติดต่อทีมพัฒนา

## 📄 License

This project is licensed under the MIT License.

---

**Happy Coding! 🚀**
