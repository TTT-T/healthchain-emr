import bcrypt from 'bcryptjs';

/**
 * Password utility functions for hashing and verification
 */

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @param saltRounds - Number of salt rounds (default: 12)
 * @returns Promise<string> - Hashed password
 */
export async function hashPassword(password: string, saltRounds: number = 12): Promise<string> {
  try {
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Verify a password against its hash
 * @param password - Plain text password
 * @param hashedPassword - Hashed password to compare against
 * @returns Promise<boolean> - True if password matches
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    console.error('Error verifying password:', error);
    throw new Error('Failed to verify password');
  }
}

/**
 * Generate a random password
 * @param length - Length of the password (default: 12)
 * @param includeSpecialChars - Include special characters (default: true)
 * @returns string - Generated password
 */
export function generateRandomPassword(length: number = 12, includeSpecialChars: boolean = true): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  let charset = lowercase + uppercase + numbers;
  if (includeSpecialChars) {
    charset += specialChars;
  }
  
  let password = '';
  
  // Ensure at least one character from each required set
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  
  if (includeSpecialChars) {
    password += specialChars[Math.floor(Math.random() * specialChars.length)];
  }
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns object - Validation result with score and feedback
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;
  
  // Length check
  if (password.length < 8) {
    feedback.push('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
  } else if (password.length >= 12) {
    score += 1;
  }
  
  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    feedback.push('รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว');
  } else {
    score += 1;
  }
  
  // Lowercase check
  if (!/[a-z]/.test(password)) {
    feedback.push('รหัสผ่านต้องมีตัวอักษรพิมพ์เล็กอย่างน้อย 1 ตัว');
  } else {
    score += 1;
  }
  
  // Number check
  if (!/\d/.test(password)) {
    feedback.push('รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว');
  } else {
    score += 1;
  }
  
  // Special character check
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    feedback.push('รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว');
  } else {
    score += 1;
  }
  
  // Common password check (simplified)
  const commonPasswords = ['password', '123456', 'qwerty', 'abc123', 'password123'];
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    feedback.push('รหัสผ่านนี้เป็นรหัสผ่านที่ใช้กันทั่วไป');
    score -= 1;
  }
  
  const isValid = score >= 4 && feedback.length === 0;
  
  return {
    isValid,
    score,
    feedback
  };
}

/**
 * Check if password meets minimum requirements
 * @param password - Password to check
 * @returns boolean - True if password meets requirements
 */
export function isPasswordValid(password: string): boolean {
  const validation = validatePasswordStrength(password);
  return validation.isValid;
}

/**
 * Get password strength level
 * @param password - Password to evaluate
 * @returns string - Strength level (weak, medium, strong, very-strong)
 */
export function getPasswordStrength(password: string): string {
  const validation = validatePasswordStrength(password);
  
  if (validation.score < 2) return 'weak';
  if (validation.score < 4) return 'medium';
  if (validation.score < 5) return 'strong';
  return 'very-strong';
}
