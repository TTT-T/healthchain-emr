#!/usr/bin/env node

/**
 * EMR System - Automatic Setup Script
 * สคริปต์นี้จะตั้งค่าระบบอัตโนมัติสำหรับเครื่องใหม่
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 EMR System - Automatic Setup');
console.log('================================');
console.log();

// ตรวจสอบ Docker
function checkDocker() {
    console.log('[1/6] Checking Docker installation...');
    try {
        execSync('docker --version', { stdio: 'pipe' });
        console.log('✅ Docker is installed');
        return true;
    } catch (error) {
        console.log('❌ Docker is not installed!');
        console.log('Please install Docker Desktop from: https://www.docker.com/products/docker-desktop');
        return false;
    }
}

// ตรวจสอบ Docker Compose
function checkDockerCompose() {
    console.log('[2/6] Checking Docker Compose...');
    try {
        execSync('docker-compose --version', { stdio: 'pipe' });
        console.log('✅ Docker Compose is available');
        return true;
    } catch (error) {
        console.log('❌ Docker Compose is not available!');
        return false;
    }
}

// สร้างไฟล์ Environment
function createEnvFiles() {
    console.log('[3/6] Creating environment files...');
    
    // Backend .env
    const backendEnvPath = path.join(__dirname, 'backend', '.env');
    const backendEnvDefaultPath = path.join(__dirname, 'backend', 'env.default');
    
    if (!fs.existsSync(backendEnvPath) && fs.existsSync(backendEnvDefaultPath)) {
        fs.copyFileSync(backendEnvDefaultPath, backendEnvPath);
        console.log('✅ Backend .env created');
    }
    
    // Frontend .env.local
    const frontendEnvPath = path.join(__dirname, 'frontend', '.env.local');
    const frontendEnvDefaultPath = path.join(__dirname, 'frontend', 'env.default');
    
    if (!fs.existsSync(frontendEnvPath) && fs.existsSync(frontendEnvDefaultPath)) {
        fs.copyFileSync(frontendEnvDefaultPath, frontendEnvPath);
        console.log('✅ Frontend .env.local created');
    }
}

// ตรวจสอบไฟล์ที่จำเป็น
function checkRequiredFiles() {
    console.log('[4/6] Checking required files...');
    
    const requiredFiles = [
        'docker-compose.simple.yml',
        'backend/package.json',
        'frontend/package.json'
    ];
    
    let allFilesExist = true;
    requiredFiles.forEach(file => {
        if (fs.existsSync(path.join(__dirname, file))) {
            console.log(`✅ ${file} exists`);
        } else {
            console.log(`❌ ${file} is missing!`);
            allFilesExist = false;
        }
    });
    
    return allFilesExist;
}

// เริ่มต้นระบบ
function startSystem() {
    console.log('[5/6] Starting EMR System...');
    console.log('This may take a few minutes on first run...');
    console.log();
    
    try {
        // เริ่มต้นฐานข้อมูลและ Redis ก่อน
        console.log('Starting database and cache...');
        execSync('docker-compose -f docker-compose.simple.yml up postgres redis -d', { 
            stdio: 'inherit',
            cwd: __dirname 
        });
        
        // รอให้ฐานข้อมูลพร้อม
        console.log('Waiting for database to be ready...');
        execSync('timeout 30 bash -c "until docker exec emr_postgres pg_isready -U postgres; do sleep 1; done"', { 
            stdio: 'pipe' 
        });
        
        // เริ่มต้น Backend และ Frontend
        console.log('Starting backend and frontend...');
        execSync('docker-compose -f docker-compose.simple.yml up backend frontend', { 
            stdio: 'inherit',
            cwd: __dirname 
        });
        
    } catch (error) {
        console.log('❌ Error starting system:', error.message);
        return false;
    }
    
    return true;
}

// แสดงข้อมูลการเข้าถึง
function showAccessInfo() {
    console.log();
    console.log('🎉 EMR System Started Successfully!');
    console.log('=====================================');
    console.log();
    console.log('🌐 Frontend: http://localhost:3000');
    console.log('🔧 Backend API: http://localhost:3001');
    console.log('📚 API Docs: http://localhost:3001/api-docs');
    console.log();
    console.log('Test Accounts:');
    console.log('👨‍💼 Admin: admin@example.com / admin123');
    console.log('👨‍⚕️ Doctor: doctor@example.com / doctor123');
    console.log('👩‍⚕️ Nurse: nurse@example.com / nurse123');
    console.log('🏥 Patient: patient@example.com / patient123');
    console.log();
    console.log('Press Ctrl+C to stop the system...');
}

// ฟังก์ชันหลัก
function main() {
    try {
        // ตรวจสอบข้อกำหนด
        if (!checkDocker()) {
            process.exit(1);
        }
        
        if (!checkDockerCompose()) {
            process.exit(1);
        }
        
        // สร้างไฟล์ Environment
        createEnvFiles();
        
        // ตรวจสอบไฟล์ที่จำเป็น
        if (!checkRequiredFiles()) {
            console.log('❌ Some required files are missing!');
            process.exit(1);
        }
        
        // เริ่มต้นระบบ
        if (startSystem()) {
            showAccessInfo();
        }
        
    } catch (error) {
        console.log('❌ Setup failed:', error.message);
        process.exit(1);
    }
}

// รันสคริปต์
if (require.main === module) {
    main();
}

module.exports = { main };
