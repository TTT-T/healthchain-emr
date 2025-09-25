const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');
const cors = require('cors');

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: '12345',
  port: 5432,
});

/**
 * Web Admin Setup Script
 * สคริปต์สำหรับสร้าง admin user ผ่าน web interface
 * 
 * ⚠️ ข้อควรระวังด้านความปลอดภัย:
 * 1. สคริปต์นี้ควรรันในสภาพแวดล้อมที่ปลอดภัยเท่านั้น
 * 2. ควรลบสคริปต์นี้หลังจากใช้งานเสร็จ
 * 3. ควรเก็บ credentials ไว้อย่างปลอดภัย
 * 4. ควรตรวจสอบ logs หลังจากใช้งาน
 */

const app = express();
const PORT = 3005; // ใช้ port ที่ไม่ซ้ำกับระบบหลัก

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  if (password.length < 1) {
    return { valid: false, message: 'Password cannot be empty' };
  }
  
  return { valid: true, message: 'Password is valid' };
}

// Routes
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Setup - HealthChain</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            
            .container {
                background: white;
                border-radius: 20px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                padding: 40px;
                width: 100%;
                max-width: 500px;
            }
            
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            
            .header h1 {
                color: #333;
                font-size: 2.5em;
                margin-bottom: 10px;
            }
            
            .header p {
                color: #666;
                font-size: 1.1em;
            }
            
            .form-group {
                margin-bottom: 20px;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 8px;
                color: #333;
                font-weight: 600;
            }
            
            .form-group input {
                width: 100%;
                padding: 15px;
                border: 2px solid #e1e5e9;
                border-radius: 10px;
                font-size: 16px;
                transition: border-color 0.3s ease;
            }
            
            .form-group input:focus {
                outline: none;
                border-color: #667eea;
            }
            
            .help-text {
                font-size: 0.9em;
                color: #666;
                margin-top: 5px;
            }
            
            .btn {
                width: 100%;
                padding: 15px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 10px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s ease;
            }
            
            .btn:hover {
                transform: translateY(-2px);
            }
            
            .btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
            }
            
            .alert {
                padding: 15px;
                border-radius: 10px;
                margin-bottom: 20px;
                display: none;
            }
            
            .alert.success {
                background-color: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }
            
            .alert.error {
                background-color: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }
            
            .loading {
                display: none;
                text-align: center;
                margin-top: 20px;
            }
            
            .spinner {
                border: 4px solid #f3f3f3;
                border-top: 4px solid #667eea;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 0 auto 10px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .footer {
                text-align: center;
                margin-top: 30px;
                color: #666;
                font-size: 0.9em;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Admin Setup</h1>
                <p>Create a new admin user for HealthChain</p>
            </div>
            
            <div id="alert" class="alert"></div>
            
            <form id="adminForm">
                <div class="form-group">
                    <label for="username">Username *</label>
                    <input type="text" id="username" name="username" required>
                    <div class="help-text">3-20 characters, must be unique</div>
                </div>
                
                <div class="form-group">
                    <label for="email">Email Address *</label>
                    <input type="email" id="email" name="email" required>
                    <div class="help-text">Valid email format, must be unique</div>
                </div>
                
                <div class="form-group">
                    <label for="firstName">First Name *</label>
                    <input type="text" id="firstName" name="firstName" required>
                </div>
                
                <div class="form-group">
                    <label for="lastName">Last Name *</label>
                    <input type="text" id="lastName" name="lastName" required>
                </div>
                
                <div class="form-group">
                    <label for="password">Password *</label>
                    <input type="password" id="password" name="password" required>
                    <div class="help-text">Enter any password you prefer</div>
                </div>
                
                <div class="form-group">
                    <label for="confirmPassword">Confirm Password *</label>
                    <input type="password" id="confirmPassword" name="confirmPassword" required>
                </div>
                
                <div class="form-group">
                    <label for="phone">Phone Number</label>
                    <input type="tel" id="phone" name="phone">
                    <div class="help-text">Optional contact number</div>
                </div>
                
                <div class="form-group">
                    <label for="department">Department</label>
                    <input type="text" id="department" name="department">
                    <div class="help-text">Optional department name</div>
                </div>
                
                <button type="submit" class="btn" id="submitBtn">Create Admin User</button>
            </form>
            
            <div class="loading" id="loading">
                <div class="spinner"></div>
                <p>Creating admin user...</p>
            </div>
            
            <div class="footer">
                <p>⚠️ Remember to delete this script after use for security</p>
            </div>
        </div>
        
        <script>
            document.getElementById('adminForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const formData = new FormData(this);
                const data = Object.fromEntries(formData);
                
                // Validate password match
                if (data.password !== data.confirmPassword) {
                    showAlert('Passwords do not match!', 'error');
                    return;
                }
                
                // Show loading
                document.getElementById('loading').style.display = 'block';
                document.getElementById('submitBtn').disabled = true;
                
                try {
                    const response = await fetch('/create-admin', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(data)
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        showAlert('Admin user created successfully!', 'success');
                        document.getElementById('adminForm').reset();
                    } else {
                        showAlert(result.error || 'Failed to create admin user', 'error');
                    }
                } catch (error) {
                    showAlert('Network error: ' + error.message, 'error');
                } finally {
                    document.getElementById('loading').style.display = 'none';
                    document.getElementById('submitBtn').disabled = false;
                }
            });
            
            function showAlert(message, type) {
                const alert = document.getElementById('alert');
                alert.textContent = message;
                alert.className = 'alert ' + type;
                alert.style.display = 'block';
                
                setTimeout(() => {
                    alert.style.display = 'none';
                }, 5000);
            }
        </script>
    </body>
    </html>
  `);
});

app.post('/create-admin', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { username, email, firstName, lastName, password, phone, department } = req.body;
    
    // Validate input
    if (!username || !email || !firstName || !lastName || !password) {
      return res.json({ success: false, error: 'All required fields must be filled' });
    }
    
    if (username.length < 3 || username.length > 20) {
      return res.json({ success: false, error: 'Username must be 3-20 characters long' });
    }
    
    if (!validateEmail(email)) {
      return res.json({ success: false, error: 'Please enter a valid email address' });
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.json({ success: false, error: passwordValidation.message });
    }
    
    // Check if username or email already exists
    const existingUser = await client.query(
      'SELECT username, email FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.json({ success: false, error: 'Username or email already exists' });
    }
    
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Generate user ID
    const userId = uuidv4();
    
    // Create admin user
    const insertQuery = `
      INSERT INTO users (
        id, username, email, password_hash, first_name, last_name,
        role, is_active, profile_completed, email_verified,
        phone, department, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW() AT TIME ZONE 'Asia/Bangkok', NOW() AT TIME ZONE 'Asia/Bangkok')
      RETURNING id, username, email, first_name, last_name, role, created_at
    `;
    
    const result = await client.query(insertQuery, [
      userId,
      username,
      email,
      hashedPassword,
      firstName,
      lastName,
      'admin',
      true,
      true,
      true,
      phone || null,
      department || null // User re-added this
    ]);
    
    const newAdmin = result.rows[0];
    
    // Note: Admin creation completed successfully
    
    res.json({
      success: true,
      admin: {
        ...newAdmin,
        password: '***' // Don't send password hash back
      }
    });
    
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.json({ success: false, error: 'Database error: ' + error.message });
  } finally {
    client.release();
  }
});

// Security validation
function validateEnvironment() {
  console.log('🔍 Validating environment security...');
  
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️  WARNING: Running in production environment!');
    console.log('   Make sure this is intentional and secure.');
  }
  
  if (!pool) {
    throw new Error('Database connection not available');
  }
  
  console.log('✅ Environment validation passed');
}

// Start server
async function startServer() {
  try {
    validateEnvironment();
    
    app.listen(PORT, () => {
      console.log('🚀 Web Admin Setup Server');
      console.log('==========================');
      console.log(`🌐 Server running on: http://localhost:${PORT}`);
      console.log('📝 Open the URL in your browser to create admin user');
      console.log('⚠️  Remember to delete this script after use for security');
      console.log('🛑 Press Ctrl+C to stop the server');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
