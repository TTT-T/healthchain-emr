# 🚀 คู่มือการ Deploy ระบบ EMR

## 📋 สรุปสถานะปัจจุบัน

### ✅ สิ่งที่แก้ไขแล้ว:
- **ESLint Warnings**: ลดลงจาก 200+ เหลือประมาณ 100+ warnings (ลดลง 50%+)
- **Type Safety**: แก้ไข any types เป็น unknown/types ที่ชัดเจน
- **Code Quality**: แก้ไข unused imports, variables, และ React Hooks dependencies
- **Build Process**: ระบบสามารถ build ได้แต่ยังมี warnings เหลืออยู่

### ⚠️ สิ่งที่ยังต้องแก้ไข:
- **ESLint Warnings**: ยังมีประมาณ 100+ warnings เหลืออยู่
- **Build Process**: ต้องแก้ไข warnings ให้หมดหรือปิด ESLint rules บางตัว

## 🎯 ตัวเลือกการ Deploy

### ตัวเลือก 1: แก้ไข ESLint Warnings ให้หมด (แนะนำ)
```bash
# 1. แก้ไข warnings ที่เหลืออยู่
npm run lint

# 2. แก้ไขไฟล์ที่มี warnings มากที่สุด:
# - src/lib/api.ts (any types)
# - src/app/emr/*.tsx (unused variables)
# - src/app/external-requesters/*.tsx (unused variables)

# 3. ทดสอบ build
npm run build
```

### ตัวเลือก 2: ปิด ESLint Rules บางตัว (เร็ว)
```javascript
// ในไฟล์ eslint.config.mjs
export default [
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn", // เปลี่ยนจาก error เป็น warn
      "@typescript-eslint/no-unused-vars": "warn", // เปลี่ยนจาก error เป็น warn
      "react-hooks/exhaustive-deps": "warn", // เปลี่ยนจาก error เป็น warn
    }
  }
];
```

### ตัวเลือก 3: ปิด ESLint ใน Build Process
```javascript
// ในไฟล์ next.config.js
module.exports = {
  eslint: {
    ignoreDuringBuilds: true, // ปิด ESLint ใน build
  },
};
```

## 🛠️ ขั้นตอนการ Deploy

### 1. เตรียม Environment
```bash
# 1. ติดตั้ง dependencies
npm install

# 2. ตั้งค่า environment variables
cp .env.example .env.local
# แก้ไขค่าใน .env.local ตาม environment ที่ต้องการ

# 3. ทดสอบ build
npm run build
```

### 2. Deploy Frontend (Next.js)
```bash
# ใช้ Vercel (แนะนำ)
npm install -g vercel
vercel --prod

# หรือใช้ Docker
docker build -t emr-frontend .
docker run -p 3000:3000 emr-frontend
```

### 3. Deploy Backend (Node.js)
```bash
# ใช้ PM2
npm install -g pm2
pm2 start ecosystem.config.js

# หรือใช้ Docker
docker build -t emr-backend .
docker run -p 5000:5000 emr-backend
```

### 4. Deploy Database (PostgreSQL)
```bash
# ใช้ Docker Compose
docker-compose up -d postgres redis

# หรือใช้ managed database (AWS RDS, Google Cloud SQL)
```

## 🔧 การตั้งค่า Production

### Environment Variables
```bash
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NEXT_PUBLIC_WS_URL=wss://your-ws-domain.com

# Backend (.env)
DATABASE_URL=postgresql://user:password@host:port/database
REDIS_URL=redis://host:port
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=production
```

### Security Settings
```bash
# 1. ตั้งค่า CORS
# 2. ตั้งค่า Rate Limiting
# 3. ตั้งค่า HTTPS
# 4. ตั้งค่า Firewall
# 5. ตั้งค่า SSL Certificate
```

## 📊 Monitoring & Logging

### 1. Application Monitoring
```bash
# ใช้ PM2 monitoring
pm2 monit

# หรือใช้ external services
# - New Relic
# - DataDog
# - Sentry
```

### 2. Database Monitoring
```bash
# ใช้ pgAdmin หรือ similar tools
# Monitor query performance
# Monitor connection pool
```

### 3. Log Management
```bash
# ใช้ Winston หรือ similar
# Centralized logging
# Log rotation
```

## 🚨 Troubleshooting

### Common Issues:
1. **Build Fails**: แก้ไข ESLint warnings หรือปิด ESLint
2. **Database Connection**: ตรวจสอบ connection string และ network
3. **CORS Issues**: ตั้งค่า CORS ใน backend
4. **Memory Issues**: เพิ่ม memory limit หรือ optimize code

### Performance Optimization:
1. **Code Splitting**: ใช้ dynamic imports
2. **Image Optimization**: ใช้ Next.js Image component
3. **Caching**: ตั้งค่า Redis caching
4. **CDN**: ใช้ CDN สำหรับ static assets

## 📝 Checklist ก่อน Deploy

- [ ] แก้ไข ESLint warnings หรือปิด ESLint
- [ ] ทดสอบ build ให้ผ่าน
- [ ] ตั้งค่า environment variables
- [ ] ทดสอบ API endpoints
- [ ] ทดสอบ database connection
- [ ] ตั้งค่า SSL certificate
- [ ] ตั้งค่า monitoring
- [ ] ทดสอบ performance
- [ ] Backup database
- [ ] Deploy to staging environment
- [ ] ทดสอบใน staging
- [ ] Deploy to production

## 🎉 หลัง Deploy

1. **Monitor**: ตรวจสอบ logs และ performance
2. **Test**: ทดสอบ functionality ทั้งหมด
3. **Backup**: สร้าง backup ข้อมูล
4. **Documentation**: อัปเดต documentation
5. **Team**: แจ้งทีมเกี่ยวกับการ deploy

---

## 📞 Support

หากมีปัญหาการ deploy สามารถติดต่อ:
- **Technical Lead**: [ชื่อ]
- **DevOps Team**: [ชื่อ]
- **Emergency Contact**: [เบอร์โทร]

---

**หมายเหตุ**: คู่มือนี้จะอัปเดตตามการเปลี่ยนแปลงของระบบ
