# 🗄️ Database Migration Guide

## 📋 Overview

This guide explains how to solve the common issue where database columns and tables are missing when running the project on a new machine.

## 🔍 Problem Description

**Issue**: When cloning the project to a new machine, the database often has missing columns or tables, causing 500 errors.

**Root Cause**: Database migrations are not running automatically when starting the application.

## ✅ Solution

We've implemented an **Automatic Migration System** that ensures all database migrations run before the application starts.

## 🚀 Quick Start

### Option 1: Using Docker (Recommended)

```bash
# Start the entire system with automatic migrations
docker-compose up

# Or start with rebuild
docker-compose up --build
```

The system will automatically:
1. Wait for PostgreSQL to be ready
2. Run all pending migrations
3. Verify database health
4. Start the application

### Option 2: Manual Setup

```bash
# 1. Start PostgreSQL and Redis
docker-compose up postgres redis -d

# 2. Run migrations manually
cd backend
npm run auto-migrate

# 3. Start the application
npm run dev
```

## 🛠️ Available Commands

### Migration Commands

```bash
# Run automatic migrations
npm run auto-migrate

# Check migration status
npm run auto-migrate:status

# Reset and re-run all migrations (development only)
npm run auto-migrate:reset
```

### Health Check Commands

```bash
# Check database health
npm run db:health-check

# Auto-fix common issues
npm run db:health-check:fix
```

### Startup Commands

```bash
# Start with full health check (development)
npm run start:with-migrations:dev

# Start with minimal logging (production)
npm run start:with-migrations:prod

# Quick start (skip health check)
npm run start:with-migrations:quick
```

## 🔧 How It Works

### 1. Automatic Migration System

The system includes:
- **Migration Manager**: Tracks and runs all database migrations
- **Health Checker**: Verifies database integrity
- **Startup Manager**: Ensures healthy startup

### 2. Docker Integration

```yaml
# docker-compose.yml
backend:
  command: sh -c "npm run start:with-migrations:dev"
  depends_on:
    postgres:
      condition: service_healthy
```

### 3. Health Check Process

1. **Database Connection**: Verify PostgreSQL is accessible
2. **Migration Status**: Check if all migrations are executed
3. **Table Verification**: Ensure all required tables exist
4. **Column Verification**: Check for missing columns
5. **Constraint Check**: Verify foreign key constraints
6. **Auto-Fix**: Automatically fix common issues

## 📊 Migration Status

### Check Current Status

```bash
npm run auto-migrate:status
```

Output example:
```
📊 Migration Status Report:
==================================================
Total Migrations: 21
Executed: 21
Failed: 0
Pending: 0

📋 Migration Details:
   ✅ 001_initial_schema (45ms)
   ✅ 002_create_ai_tables (23ms)
   ✅ 003_create_consent_tables (67ms)
   ...

📊 System Status:
Database Connected: ✅
Tables: 15
Users: 0
Patients: 0
Departments: 0
```

### Health Check Report

```bash
npm run db:health-check
```

Output example:
```
📊 DATABASE HEALTH CHECK RESULTS
============================================================

✅ Status: HEALTHY

💡 Recommendations:
   - Database is healthy - no action required

📊 Details:
   - Database Connected: ✅
   - Tables: 15
   - Missing Tables: 0
   - Missing Columns: 0
   - Migrations Executed: 21
   - Migrations Failed: 0
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Database Connection Failed

**Error**: `Database not ready after 30 attempts`

**Solution**:
```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

#### 2. Migration Failed

**Error**: `Migration 021_add_current_address_to_users failed`

**Solution**:
```bash
# Check migration status
npm run auto-migrate:status

# Reset migrations (development only)
npm run auto-migrate:reset

# Or fix manually
npm run db:health-check:fix
```

#### 3. Missing Columns

**Error**: `Missing columns: patients.thai_last_name`

**Solution**:
```bash
# Run health check
npm run db:health-check

# Auto-fix
npm run db:health-check:fix

# Or run migrations manually
npm run auto-migrate
```

### Manual Database Reset

⚠️ **Warning**: Only for development!

```bash
# Reset entire database
npm run auto-migrate:reset

# Or reset via Docker
docker-compose down -v
docker-compose up --build
```

## 🔄 Development Workflow

### Adding New Migrations

1. **Create Migration File**:
   ```sql
   -- backend/src/database/migrations/022_add_new_feature.sql
   ALTER TABLE users ADD COLUMN new_field VARCHAR(100);
   ```

2. **Add to Migration Manager**:
   ```typescript
   // backend/src/database/migrations.ts
   {
     name: '022_add_new_feature',
     description: 'Add new feature field',
     up: async () => {
       await this.runSqlMigration('022_add_new_feature.sql');
     }
   }
   ```

3. **Test Migration**:
   ```bash
   npm run auto-migrate:reset
   npm run db:health-check
   ```

### Testing on Fresh Environment

1. **Clone Project**:
   ```bash
   git clone <repository>
   cd project
   ```

2. **Start with Docker**:
   ```bash
   docker-compose up --build
   ```

3. **Verify Health**:
   ```bash
   # In another terminal
   cd backend
   npm run db:health-check
   ```

## 📈 Production Deployment

### Environment Variables

```bash
# .env.production
NODE_ENV=production
DB_HOST=your-production-db-host
DB_PORT=5432
DB_NAME=emr_production
DB_USER=your-db-user
DB_PASSWORD=your-secure-password
```

### Production Startup

```bash
# Use production startup command
npm run start:with-migrations:prod
```

### Health Monitoring

```bash
# Regular health checks
npm run db:health-check

# Check migration status
npm run auto-migrate:status
```

## 🎯 Best Practices

### 1. Always Use Docker

- Ensures consistent environment
- Automatic migration execution
- Easy to reproduce issues

### 2. Regular Health Checks

```bash
# Add to CI/CD pipeline
npm run db:health-check
```

### 3. Backup Before Major Changes

```bash
# Backup database
docker-compose exec postgres pg_dump -U postgres emr_development > backup.sql

# Restore if needed
docker-compose exec -T postgres psql -U postgres emr_development < backup.sql
```

### 4. Test Migrations

```bash
# Test on fresh environment
docker-compose down -v
docker-compose up --build
```

## 📞 Support

If you encounter issues:

1. **Check Health Status**: `npm run db:health-check`
2. **Check Migration Status**: `npm run auto-migrate:status`
3. **Try Auto-Fix**: `npm run db:health-check:fix`
4. **Reset if Development**: `npm run auto-migrate:reset`

## 🎉 Success Indicators

✅ **System is working correctly when you see**:
- All migrations executed successfully
- No missing tables or columns
- Database health check passes
- Application starts without 500 errors
- EMR Dashboard loads properly

---

**Last Updated**: 2025-01-03
**Version**: 1.0.0
