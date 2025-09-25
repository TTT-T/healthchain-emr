"use client";

import React, { useState } from 'react';
import { Settings, User, Bell, Shield, Database, Mail, Globe, Palette, Save, RefreshCw, Key, Lock, Wrench, AlertTriangle } from 'lucide-react';
import { logger } from '@/lib/logger';

interface SettingSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
}

const settingSections: SettingSection[] = [
  {
    id: 'general',
    title: 'General Settings',
    icon: <Settings size={20} />,
    description: 'Basic system configuration and preferences'
  },
  {
    id: 'users',
    title: 'User Management',
    icon: <User size={20} />,
    description: 'Configure user roles and permissions'
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: <Bell size={20} />,
    description: 'Email and system notification settings'
  },
  {
    id: 'security',
    title: 'Security',
    icon: <Shield size={20} />,
    description: 'Security policies and authentication settings'
  },
  {
    id: 'database',
    title: 'Database',
    icon: <Database size={20} />,
    description: 'Database configuration and backup settings'
  },
  {
    id: 'email',
    title: 'Email Configuration',
    icon: <Mail size={20} />,
    description: 'SMTP settings and email templates'
  },
  {
    id: 'advanced',
    title: 'Advanced Settings',
    icon: <Wrench size={20} />,
    description: 'Advanced system configuration (Disabled)'
  },
  {
    id: 'maintenance',
    title: 'System Maintenance',
    icon: <AlertTriangle size={20} />,
    description: 'System maintenance and diagnostics (Disabled)'
  }
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    // General Settings
    systemName: 'HealthChain System',
    systemDescription: 'Medical Records Management System',
    timezone: 'Asia/Bangkok',
    language: 'th',
    dateFormat: 'DD/MM/YYYY',
    
    // User Management
    allowRegistration: true,
    requireEmailVerification: true,
    passwordMinLength: 8,
    passwordRequireSpecial: true,
    sessionTimeout: 24,
    
    // Notifications
    emailNotifications: true,
    systemAlerts: true,
    backupNotifications: true,
    maintenanceNotifications: true,
    
    // Security
    twoFactorAuth: false,
    loginAttempts: 5,
    lockoutDuration: 30,
    encryptionLevel: 'AES-256',
    auditLogging: true,
    
    // Database
    autoBackup: true,
    backupFrequency: 'daily',
    retentionPeriod: 90,
    compressionEnabled: true,
    
    // Email
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: 'system@healthchain.com',
    smtpPassword: '',
    fromName: 'HealthChain System',
    fromEmail: 'noreply@healthchain.com'
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      logger.info('Settings saved:', settings);
      // Show success message
      alert('Settings saved successfully!');
    } catch (error) {
      logger.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleManageKeys = () => {
    alert('API Keys management feature coming soon!');
  };

  const handleSecurityAudit = () => {
    alert('Security audit feature coming soon!');
  };

  const handleSystemReset = () => {
    if (confirm('Are you sure you want to reset all settings to default? This action cannot be undone.')) {
      setSettings({
        systemName: 'HealthChain System',
        systemDescription: 'Medical Records Management System',
        timezone: 'Asia/Bangkok',
        language: 'th',
        dateFormat: 'DD/MM/YYYY',
        allowRegistration: true,
        requireEmailVerification: true,
        passwordMinLength: 8,
        passwordRequireSpecial: true,
        sessionTimeout: 24,
        emailNotifications: true,
        systemAlerts: true,
        backupNotifications: true,
        maintenanceNotifications: true,
        twoFactorAuth: false,
        loginAttempts: 5,
        lockoutDuration: 30,
        encryptionLevel: 'AES-256',
        auditLogging: true,
        autoBackup: true,
        backupFrequency: 'daily',
        retentionPeriod: 90,
        compressionEnabled: true,
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpUser: 'system@healthchain.com',
        smtpPassword: '',
        fromName: 'HealthChain System',
        fromEmail: 'noreply@healthchain.com'
      });
      alert('Settings reset to default values!');
    }
  };

  const handleEmail = () => {
    alert(' email sent! Check your inbox.');
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">System Name</label>
          <input
            type="text"
            value={settings.systemName}
            onChange={(e) => handleSettingChange('systemName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
          <select
            value={settings.timezone}
            onChange={(e) => handleSettingChange('timezone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Asia/Bangkok">Asia/Bangkok</option>
            <option value="UTC">UTC</option>
            <option value="America/New_York">America/New_York</option>
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">System Description</label>
        <textarea
          value={settings.systemDescription}
          onChange={(e) => handleSettingChange('systemDescription', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
          <select
            value={settings.language}
            onChange={(e) => handleSettingChange('language', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="th">ไทย (Thai)</option>
            <option value="en">English</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
          <select
            value={settings.dateFormat}
            onChange={(e) => handleSettingChange('dateFormat', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderUserSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-gray-900">Allow User Registration</h4>
          <p className="text-sm text-gray-500">Allow new users to register for accounts</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.allowRegistration}
            onChange={(e) => handleSettingChange('allowRegistration', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-gray-900">Require Email Verification</h4>
          <p className="text-sm text-gray-500">New users must verify their email address</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.requireEmailVerification}
            onChange={(e) => handleSettingChange('requireEmailVerification', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Password Length</label>
          <input
            type="number"
            min="6"
            max="32"
            value={settings.passwordMinLength}
            onChange={(e) => handleSettingChange('passwordMinLength', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (hours)</label>
          <input
            type="number"
            min="1"
            max="168"
            value={settings.sessionTimeout}
            onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      {[
        { key: 'emailNotifications', title: 'Email Notifications', desc: 'Receive notifications via email' },
        { key: 'systemAlerts', title: 'System Alerts', desc: 'Important system alerts and warnings' },
        { key: 'backupNotifications', title: 'Backup Notifications', desc: 'Notifications about backup operations' },
        { key: 'maintenanceNotifications', title: 'Maintenance Notifications', desc: 'Scheduled maintenance reminders' }
      ].map((item) => (
        <div key={item.key} className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">{item.title}</h4>
            <p className="text-sm text-gray-500">{item.desc}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings[item.key as keyof typeof settings] as boolean}
              onChange={(e) => handleSettingChange(item.key, e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      ))}
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
          <p className="text-sm text-gray-500">Require 2FA for admin accounts</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.twoFactorAuth}
            onChange={(e) => handleSettingChange('twoFactorAuth', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Max Login Attempts</label>
          <input
            type="number"
            min="3"
            max="10"
            value={settings.loginAttempts}
            onChange={(e) => handleSettingChange('loginAttempts', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Lockout Duration (minutes)</label>
          <input
            type="number"
            min="5"
            max="120"
            value={settings.lockoutDuration}
            onChange={(e) => handleSettingChange('lockoutDuration', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Encryption Level</label>
        <select
          value={settings.encryptionLevel}
          onChange={(e) => handleSettingChange('encryptionLevel', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="AES-128">AES-128</option>
          <option value="AES-256">AES-256</option>
        </select>
      </div>
    </div>
  );

  const renderDatabaseSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-gray-900">Automatic Backup</h4>
          <p className="text-sm text-gray-500">Enable automatic database backups</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.autoBackup}
            onChange={(e) => handleSettingChange('autoBackup', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Backup Frequency</label>
          <select
            value={settings.backupFrequency}
            onChange={(e) => handleSettingChange('backupFrequency', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Retention Period (days)</label>
          <input
            type="number"
            min="1"
            max="365"
            value={settings.retentionPeriod}
            onChange={(e) => handleSettingChange('retentionPeriod', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-gray-900">Compression</h4>
          <p className="text-sm text-gray-500">Enable backup compression to save space</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.compressionEnabled}
            onChange={(e) => handleSettingChange('compressionEnabled', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
    </div>
  );

  const renderEmailSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Host</label>
          <input
            type="text"
            value={settings.smtpHost}
            onChange={(e) => handleSettingChange('smtpHost', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="smtp.gmail.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Port</label>
          <input
            type="number"
            value={settings.smtpPort}
            onChange={(e) => handleSettingChange('smtpPort', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="587"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Username</label>
          <input
            type="text"
            value={settings.smtpUser}
            onChange={(e) => handleSettingChange('smtpUser', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="your-email@gmail.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Password</label>
          <input
            type="password"
            value={settings.smtpPassword}
            onChange={(e) => handleSettingChange('smtpPassword', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="••••••••"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">From Name</label>
          <input
            type="text"
            value={settings.fromName}
            onChange={(e) => handleSettingChange('fromName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="System Name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">From Email</label>
          <input
            type="email"
            value={settings.fromEmail}
            onChange={(e) => handleSettingChange('fromEmail', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="noreply@example.com"
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Mail className="text-blue-600" size={16} />
          <h4 className="font-medium text-blue-900"> Email Configuration</h4>
        </div>
        <p className="text-sm text-blue-700 mb-3">Send a  email to verify your SMTP settings</p>
        <button 
          onClick={handleEmail}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Send  Email
        </button>
      </div>
    </div>
  );

  const renderAdvancedSettings = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <Wrench className="mx-auto text-gray-400 mb-4" size={48} />
        <h3 className="text-lg font-medium text-gray-500 mb-2">Advanced Settings</h3>
        <p className="text-gray-400 mb-4">This feature is currently disabled and not available in the current version.</p>
        <div className="text-sm text-gray-400">
          <p>• Performance tuning</p>
          <p>• Custom integrations</p>
          <p>• Developer tools</p>
        </div>
      </div>
    </div>
  );

  const renderMaintenanceSettings = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <AlertTriangle className="mx-auto text-gray-400 mb-4" size={48} />
        <h3 className="text-lg font-medium text-gray-500 mb-2">System Maintenance</h3>
        <p className="text-gray-400 mb-4">This feature is currently disabled and not available in the current version.</p>
        <div className="text-sm text-gray-400">
          <p>• System diagnostics</p>
          <p>• Performance monitoring</p>
          <p>• Maintenance scheduling</p>
        </div>
      </div>
    </div>
  );

  const renderCurrentSection = () => {
    switch (activeSection) {
      case 'general': return renderGeneralSettings();
      case 'users': return renderUserSettings();
      case 'notifications': return renderNotificationSettings();
      case 'security': return renderSecuritySettings();
      case 'database': return renderDatabaseSettings();
      case 'email': return renderEmailSettings();
      case 'advanced': return renderAdvancedSettings();
      case 'maintenance': return renderMaintenanceSettings();
      default: return renderGeneralSettings();
    }
  };

  return (
    <div className="w-full h-full bg-gray-50 p-2 lg:p-4 overflow-auto">
      {/* Header */}
      <div className="mb-4 lg:mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Settings className="text-blue-600" />
              System Settings
            </h1>
            <p className="text-gray-600 mt-2">Configure system preferences and settings</p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
          >
            {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6 mb-4 lg:mb-6 min-w-0">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Settings Categories</h3>
            <nav className="space-y-2">
              {settingSections.map((section) => {
                const isDisabled = section.id === 'advanced' || section.id === 'maintenance';
                return (
                  <button
                    key={section.id}
                    onClick={() => !isDisabled && setActiveSection(section.id)}
                    disabled={isDisabled}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      isDisabled
                        ? 'text-gray-400 cursor-not-allowed opacity-60'
                        : activeSection === section.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className={isDisabled ? 'text-gray-400' : ''}>{section.icon}</div>
                    <div>
                      <div className={`font-medium ${isDisabled ? 'text-gray-400' : ''}`}>{section.title}</div>
                      <div className={`text-xs mt-1 ${isDisabled ? 'text-gray-400' : 'text-gray-500'}`}>{section.description}</div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {settingSections.find(s => s.id === activeSection)?.title}
              </h2>
              <p className="text-gray-600 mt-1">
                {settingSections.find(s => s.id === activeSection)?.description}
              </p>
            </div>

            {renderCurrentSection()}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-4">
            <Key className="text-blue-600" size={24} />
            <h3 className="font-semibold text-gray-900">API Keys</h3>
          </div>
          <p className="text-gray-600 mb-4">Manage API keys and access tokens</p>
          <button 
            onClick={handleManageKeys}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Manage Keys
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="text-green-600" size={24} />
            <h3 className="font-semibold text-gray-900">Security Audit</h3>
          </div>
          <p className="text-gray-600 mb-4">Review security logs and policies</p>
          <button 
            onClick={handleSecurityAudit}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            View Audit
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-4">
            <RefreshCw className="text-red-600" size={24} />
            <h3 className="font-semibold text-gray-900">System Reset</h3>
          </div>
          <p className="text-gray-600 mb-4">Reset system to default settings</p>
          <button 
            onClick={handleSystemReset}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Reset System
          </button>
        </div>
      </div>
    </div>
  );
}
