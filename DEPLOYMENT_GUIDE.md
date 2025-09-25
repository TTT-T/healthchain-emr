# 🚀 คู่มือการ Deploy - EMR System

## 🌐 การ Deploy สำหรับ Production

### ข้อกำหนดสำหรับ Production
- **Server**: Ubuntu 20.04+ หรือ CentOS 8+
- **RAM**: อย่างน้อย 4GB
- **Storage**: อย่างน้อย 20GB
- **CPU**: 2 cores ขึ้นไป
- **Domain**: สำหรับ HTTPS

---

## 🐳 การ Deploy ด้วย Docker (แนะนำ)

### 1. เตรียม Server
```bash
# อัปเดตระบบ
sudo apt update && sudo apt upgrade -y

# ติดตั้ง Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# ติดตั้ง Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# เพิ่ม user เข้า docker group
sudo usermod -aG docker $USER
```

### 2. โคลนโปรเจก
```bash
git clone https://github.com/TTT-T/healthchain-emr.git
cd healthchain-emr
git checkout production
```

### 3. สร้างไฟล์ Environment สำหรับ Production
```bash
# Backend
cp backend/env.example backend/.env.production

# Frontend
cp frontend/.env.example frontend/.env.production
```

### 4. แก้ไขการตั้งค่า Production
```bash
# backend/.env.production
NODE_ENV=production
PORT=3001
DB_HOST=postgres
DB_PORT=5432
DB_NAME=emr_production
DB_USER=emr_user
DB_PASSWORD=<strong-password>
JWT_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<strong-random-secret>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
FRONTEND_URL=https://yourdomain.com
```

### 5. สร้าง Docker Compose สำหรับ Production
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: emr_postgres_prod
    environment:
      POSTGRES_DB: emr_production
      POSTGRES_USER: emr_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/src/database/migrations:/docker-entrypoint-initdb.d
    networks:
      - emr_network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: emr_redis_prod
    volumes:
      - redis_data:/data
    networks:
      - emr_network
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.production
    container_name: emr_backend_prod
    env_file:
      - ./backend/.env.production
    depends_on:
      - postgres
      - redis
    networks:
      - emr_network
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.production
    container_name: emr_frontend_prod
    env_file:
      - ./frontend/.env.production
    depends_on:
      - backend
    networks:
      - emr_network
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: emr_nginx_prod
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    networks:
      - emr_network
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:

networks:
  emr_network:
    driver: bridge
```

### 6. สร้าง Nginx Configuration
```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3001;
    }

    upstream frontend {
        server frontend:3000;
    }

    server {
        listen 80;
        server_name yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location /api {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### 7. Deploy
```bash
# Build และเริ่มต้น
docker-compose -f docker-compose.prod.yml up -d --build

# ตรวจสอบ logs
docker-compose -f docker-compose.prod.yml logs -f

# ตรวจสอบสถานะ
docker-compose -f docker-compose.prod.yml ps
```

---

## 🔧 การ Deploy แบบ Manual

### 1. เตรียม Server
```bash
# ติดตั้ง Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# ติดตั้ง PostgreSQL
sudo apt install postgresql postgresql-contrib

# ติดตั้ง Redis
sudo apt install redis-server

# ติดตั้ง PM2
sudo npm install -g pm2
```

### 2. ตั้งค่าฐานข้อมูล
```sql
sudo -u postgres psql
CREATE DATABASE emr_production;
CREATE USER emr_user WITH PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE emr_production TO emr_user;
\q
```

### 3. Deploy Backend
```bash
cd backend
npm install --production
npm run build
npm run migrate

# เริ่มต้นด้วย PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 4. Deploy Frontend
```bash
cd frontend
npm install --production
npm run build:production
npm run start:prod

# เริ่มต้นด้วย PM2
pm2 start "npm run start:prod" --name "emr-frontend"
pm2 save
```

### 5. ตั้งค่า Nginx
```bash
sudo apt install nginx
sudo cp nginx.conf /etc/nginx/sites-available/emr
sudo ln -s /etc/nginx/sites-available/emr /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔒 การตั้งค่า SSL/HTTPS

### ใช้ Let's Encrypt (ฟรี)
```bash
# ติดตั้ง Certbot
sudo apt install certbot python3-certbot-nginx

# ขอ SSL Certificate
sudo certbot --nginx -d yourdomain.com

# ทดสอบ auto-renewal
sudo certbot renew --dry-run
```

---

## 📊 การ Monitor และ Logging

### ตั้งค่า PM2 Monitoring
```bash
# ติดตั้ง PM2 Plus
pm2 install pm2-server-monit

# ดู monitoring dashboard
pm2 monit
```

### ตั้งค่า Log Rotation
```bash
# ติดตั้ง logrotate
sudo apt install logrotate

# สร้างไฟล์ config
sudo nano /etc/logrotate.d/emr
```

```bash
# /etc/logrotate.d/emr
/var/log/emr/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

## 🔄 การ Update ระบบ

### ใช้ Docker
```bash
# Pull changes
git pull origin production

# Rebuild และ restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

### ใช้ PM2
```bash
# Pull changes
git pull origin production

# Update backend
cd backend
npm install --production
npm run build
pm2 restart emr-backend

# Update frontend
cd frontend
npm install --production
npm run build:production
pm2 restart emr-frontend
```

---

## 🛡️ การ Backup

### Backup ฐานข้อมูล
```bash
# สร้าง backup script
nano backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/emr"
mkdir -p $BACKUP_DIR

# Backup database
docker exec emr_postgres_prod pg_dump -U emr_user emr_production > $BACKUP_DIR/db_backup_$DATE.sql

# Backup files
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz /var/lib/docker/volumes/emr_postgres_data

# ลบ backup เก่า (เก็บไว้ 30 วัน)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

```bash
# ทำให้ script executable
chmod +x backup.sh

# ตั้งค่า cron job (backup ทุกวันเวลา 2:00 AM)
crontab -e
# เพิ่มบรรทัดนี้:
0 2 * * * /path/to/backup.sh
```

---

## 🚨 การแก้ไขปัญหา

### ตรวจสอบสถานะ
```bash
# Docker
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f

# PM2
pm2 status
pm2 logs

# System resources
htop
df -h
free -h
```

### ปัญหาที่พบบ่อย
1. **Memory ไม่พอ**: เพิ่ม swap หรือ upgrade RAM
2. **Disk เต็ม**: ลบ logs เก่า หรือเพิ่ม storage
3. **Database connection**: ตรวจสอบ PostgreSQL status
4. **SSL certificate**: ตรวจสอบ certificate expiry

---

## 📈 การ Optimize Performance

### Database
```sql
-- ตั้งค่า connection pooling
-- เปิดใช้งาน query caching
-- สร้าง indexes ที่จำเป็น
```

### Application
```bash
# ตั้งค่า PM2 cluster mode
pm2 start ecosystem.config.js -i max

# เปิดใช้งาน gzip compression
# ตั้งค่า CDN สำหรับ static files
```

---

## 🔐 Security Checklist

- [ ] เปลี่ยน default passwords
- [ ] ตั้งค่า firewall
- [ ] เปิดใช้งาน HTTPS
- [ ] ตั้งค่า rate limiting
- [ ] เปิดใช้งาน CORS
- [ ] ตั้งค่า security headers
- [ ] เปิดใช้งาน database SSL
- [ ] ตั้งค่า backup strategy
- [ ] เปิดใช้งาน monitoring
- [ ] ตั้งค่า log rotation

---

**หมายเหตุ**: คู่มือนี้ครอบคลุมการ deploy พื้นฐาน สำหรับ production environment ที่ซับซ้อนมากขึ้น อาจต้องมีการตั้งค่าเพิ่มเติม เช่น load balancer, database clustering, หรือ microservices architecture
