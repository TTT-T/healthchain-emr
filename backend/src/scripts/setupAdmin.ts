#!/usr/bin/env node

import { databaseManager } from '../database/connection';
import bcrypt from 'bcryptjs';
import * as readline from 'readline';

/**
 * Interactive Admin Setup Script
 */
class AdminSetup {
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * Setup admin user interactively
   */
  public async setupAdmin(): Promise<void> {
    try {
      console.log('\n🔧 EMR System - Admin Setup');
      console.log('=====================================\n');

      // Initialize database connection
      await databaseManager.initialize();

      // Check if admin already exists
      const existingAdmin = await databaseManager.query(
        'SELECT id FROM users WHERE role = $1 LIMIT 1',
        ['admin']
      );

      if (existingAdmin.rows.length > 0) {
        console.log('✅ Admin user already exists in the system.');
        console.log('   If you want to reset admin, please delete the existing admin first.\n');
        this.rl.close();
        return;
      }

      // Get admin information
      const adminInfo = await this.getAdminInfo();
      
      // Create admin user
      await this.createAdminUser(adminInfo);
      
      console.log('\n✅ Admin user created successfully!');
      console.log('=====================================');
      console.log(`Username: ${adminInfo.username}`);
      console.log(`Email: ${adminInfo.email}`);
      console.log(`Name: ${adminInfo.firstName} ${adminInfo.lastName}`);
      console.log('=====================================\n');

    } catch (error) {
      console.error('❌ Admin setup failed:', error);
      throw error;
    } finally {
      this.rl.close();
    }
  }

  /**
   * Get admin information from user input
   */
  private async getAdminInfo(): Promise<{
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }> {
    console.log('Please provide the following information for the admin user:\n');

    const username = await this.askQuestion('Username (default: admin): ') || 'admin';
    const email = await this.askQuestion('Email address: ');
    const firstName = await this.askQuestion('First name (default: System): ') || 'System';
    const lastName = await this.askQuestion('Last name (default: Administrator): ') || 'Administrator';
    
    let password: string;
    let confirmPassword: string;
    
    do {
      password = await this.askPassword('Password: ');
      confirmPassword = await this.askPassword('Confirm password: ');
      
      if (password !== confirmPassword) {
        console.log('❌ Passwords do not match. Please try again.\n');
      } else if (password.length < 6) {
        console.log('❌ Password must be at least 6 characters long.\n');
      }
    } while (password !== confirmPassword || password.length < 6);

    return {
      username,
      email,
      password,
      firstName,
      lastName
    };
  }

  /**
   * Create admin user in database
   */
  private async createAdminUser(adminInfo: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<void> {
    const hashedPassword = await bcrypt.hash(adminInfo.password, 12);

    await databaseManager.query(`
      INSERT INTO users (
        username, email, password_hash, first_name, last_name, 
        role, is_active, email_verified, profile_completed
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      adminInfo.username,
      adminInfo.email,
      hashedPassword,
      adminInfo.firstName,
      adminInfo.lastName,
      'admin',
      true,
      true,
      true
    ]);
  }

  /**
   * Ask a question and return the answer
   */
  private askQuestion(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  /**
   * Ask for password (hidden input)
   */
  private askPassword(question: string): Promise<string> {
    return new Promise((resolve) => {
      // For Windows, we'll use regular input (not hidden)
      // For production, you might want to use a library like 'read' for hidden input
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new AdminSetup();
  setup.setupAdmin()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Admin setup failed:', error);
      process.exit(1);
    });
}

export default AdminSetup;
