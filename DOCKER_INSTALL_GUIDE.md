# 🐳 คู่มือการติดตั้ง Docker Desktop

## 📋 ข้อกำหนดระบบ

### Windows
- Windows 10 64-bit: Pro, Enterprise, or Education (Build 15063 หรือใหม่กว่า)
- Windows 11 64-bit: Home หรือ Pro
- WSL 2 feature enabled
- Virtualization enabled in BIOS

### macOS
- macOS 10.15 หรือใหม่กว่า
- Apple Silicon (M1/M2) หรือ Intel processor

### Linux
- Ubuntu 18.04 หรือใหม่กว่า
- CentOS 7 หรือใหม่กว่า
- หรือ Linux distribution อื่นๆ ที่รองรับ

---

## 🪟 Windows - การติดตั้ง Docker Desktop

### วิธีที่ 1: ดาวน์โหลดจากเว็บไซต์ (แนะนำ)

1. **ไปที่เว็บไซต์ Docker Desktop**
   ```
   https://www.docker.com/products/docker-desktop
   ```

2. **คลิก "Download for Windows"**

3. **รอให้ดาวน์โหลดเสร็จ** (ประมาณ 500MB)

4. **ดับเบิลคลิกไฟล์ที่ดาวน์โหลด** (Docker Desktop Installer.exe)

5. **ทำตามขั้นตอนการติดตั้ง:**
   - ✅ เปิดใช้งาน "Use WSL 2 instead of Hyper-V"
   - ✅ เปิดใช้งาน "Add shortcut to desktop"
   - คลิก "Install"

6. **รอให้การติดตั้งเสร็จ** (ประมาณ 5-10 นาที)

7. **คลิก "Restart"** เมื่อเสร็จแล้ว

8. **เปิด Docker Desktop** จาก Desktop หรือ Start Menu

9. **รอให้ Docker เริ่มต้น** (ประมาณ 1-2 นาที)

10. **ทดสอบการติดตั้ง:**
    ```cmd
    docker --version
    docker-compose --version
    ```

### วิธีที่ 2: ใช้ Chocolatey (สำหรับผู้ใช้ขั้นสูง)

```powershell
# ติดตั้ง Chocolatey (ถ้ายังไม่มี)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# ติดตั้ง Docker Desktop
choco install docker-desktop
```

### วิธีที่ 3: ใช้ Winget (Windows Package Manager)

```cmd
winget install Docker.DockerDesktop
```

---

## 🍎 macOS - การติดตั้ง Docker Desktop

### วิธีที่ 1: ดาวน์โหลดจากเว็บไซต์ (แนะนำ)

1. **ไปที่เว็บไซต์ Docker Desktop**
   ```
   https://www.docker.com/products/docker-desktop
   ```

2. **คลิก "Download for Mac"**

3. **เลือกเวอร์ชันที่เหมาะสม:**
   - **Apple Silicon (M1/M2)**: Docker Desktop for Mac with Apple silicon
   - **Intel**: Docker Desktop for Mac with Intel chip

4. **รอให้ดาวน์โหลดเสร็จ**

5. **เปิดไฟล์ .dmg ที่ดาวน์โหลด**

6. **ลาก Docker.app ไปยัง Applications folder**

7. **เปิด Docker Desktop** จาก Applications

8. **ทำตามขั้นตอนการตั้งค่า:**
   - ยอมรับ License Agreement
   - ใส่รหัสผ่าน macOS เมื่อถูกถาม

9. **รอให้ Docker เริ่มต้น**

10. **ทดสอบการติดตั้ง:**
    ```bash
    docker --version
    docker-compose --version
    ```

### วิธีที่ 2: ใช้ Homebrew

```bash
# ติดตั้ง Homebrew (ถ้ายังไม่มี)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# ติดตั้ง Docker Desktop
brew install --cask docker
```

---

## 🐧 Linux - การติดตั้ง Docker

### Ubuntu/Debian

```bash
# อัปเดต package index
sudo apt update

# ติดตั้ง packages ที่จำเป็น
sudo apt install apt-transport-https ca-certificates curl gnupg lsb-release

# เพิ่ม Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# เพิ่ม Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# อัปเดต package index อีกครั้ง
sudo apt update

# ติดตั้ง Docker Engine
sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# เพิ่ม user เข้า docker group
sudo usermod -aG docker $USER

# เริ่มต้น Docker service
sudo systemctl start docker
sudo systemctl enable docker

# ติดตั้ง Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# ทดสอบการติดตั้ง
docker --version
docker-compose --version
```

### CentOS/RHEL/Fedora

```bash
# ติดตั้ง packages ที่จำเป็น
sudo yum install -y yum-utils

# เพิ่ม Docker repository
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# ติดตั้ง Docker Engine
sudo yum install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# เริ่มต้น Docker service
sudo systemctl start docker
sudo systemctl enable docker

# เพิ่ม user เข้า docker group
sudo usermod -aG docker $USER

# ติดตั้ง Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# ทดสอบการติดตั้ง
docker --version
docker-compose --version
```

---

## ✅ การทดสอบการติดตั้ง

### 1. ตรวจสอบเวอร์ชัน
```bash
docker --version
docker-compose --version
```

### 2. ทดสอบ Docker
```bash
docker run hello-world
```

### 3. ทดสอบ Docker Compose
```bash
docker-compose --version
```

---

## 🚀 หลังจากติดตั้ง Docker เสร็จแล้ว

### 1. เริ่มต้น EMR System
```bash
# โคลนโปรเจก
git clone https://github.com/TTT-T/healthchain-emr.git
cd healthchain-emr

# เริ่มต้นระบบ
start.bat  # Windows
./start.sh # Mac/Linux
```

### 2. หรือใช้คำสั่งเดียว
```bash
docker-compose -f docker-compose.simple.yml up --build
```

---

## 🆘 การแก้ไขปัญหา

### Windows

#### ปัญหา: WSL 2 ไม่ได้เปิดใช้งาน
```powershell
# เปิดใช้งาน WSL 2
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# รีสตาร์ทคอมพิวเตอร์
shutdown /r /t 0
```

#### ปัญหา: Virtualization ไม่ได้เปิดใช้งาน
1. เข้า BIOS/UEFI
2. เปิดใช้งาน Intel VT-x หรือ AMD-V
3. เปิดใช้งาน Intel VT-d หรือ AMD IOMMU

#### ปัญหา: Docker Desktop ไม่เริ่มต้น
```cmd
# เริ่มต้น Docker service
net start com.docker.service
```

### macOS

#### ปัญหา: Docker Desktop ไม่เริ่มต้น
```bash
# เริ่มต้น Docker Desktop
open -a Docker
```

#### ปัญหา: Permission denied
```bash
# เพิ่ม user เข้า docker group
sudo dseditgroup -o edit -a $(whoami) -t user docker
```

### Linux

#### ปัญหา: Permission denied
```bash
# เพิ่ม user เข้า docker group
sudo usermod -aG docker $USER

# ออกจากระบบและเข้าอีกครั้ง
logout
```

#### ปัญหา: Docker service ไม่เริ่มต้น
```bash
# เริ่มต้น Docker service
sudo systemctl start docker
sudo systemctl enable docker
```

---

## 📞 การขอความช่วยเหลือ

หากพบปัญหาการติดตั้ง:

1. **ตรวจสอบข้อกำหนดระบบ** - ให้แน่ใจว่าระบบของคุณรองรับ Docker
2. **ดู Docker Documentation** - https://docs.docker.com/get-docker/
3. **ตรวจสอบ Docker Status** - ดูว่า Docker Desktop ทำงานอยู่หรือไม่
4. **รีสตาร์ท Docker** - ปิดและเปิด Docker Desktop ใหม่
5. **ติดต่อทีมพัฒนา** - หากยังแก้ไขไม่ได้

---

## 🎯 ขั้นตอนถัดไป

หลังจากติดตั้ง Docker เสร็จแล้ว:

1. **ทดสอบการติดตั้ง** - รัน `docker --version`
2. **เริ่มต้น EMR System** - ใช้ `start.bat` หรือ `./start.sh`
3. **เข้าถึงระบบ** - ไปที่ http://localhost:3000
4. **ทดสอบบัญชี** - ใช้บัญชีทดสอบที่ให้มา

---

**หมายเหตุ**: การติดตั้ง Docker Desktop อาจใช้เวลาประมาณ 10-15 นาที ขึ้นอยู่กับความเร็วอินเทอร์เน็ตและประสิทธิภาพของเครื่อง
