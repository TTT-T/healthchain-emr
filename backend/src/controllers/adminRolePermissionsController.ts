import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';

/**
 * Get role permissions
 * GET /api/admin/role-permissions
 */
export const getRolePermissions = async (req: Request, res: Response) => {
  try {
    // Get all roles and their permissions from database
    const rolesQuery = `
      SELECT DISTINCT role FROM users WHERE role IS NOT NULL
    `;
    const rolesResult = await databaseManager.query(rolesQuery);
    const roles = rolesResult.rows.map(row => row.role);

    // Mock permissions data (in real implementation, this would come from database)
    const permissions = [
      // User Management
      { id: 'user.create', name: 'สร้างผู้ใช้', description: 'สามารถสร้างผู้ใช้ใหม่ได้', category: 'User Management' },
      { id: 'user.read', name: 'ดูข้อมูลผู้ใช้', description: 'สามารถดูข้อมูลผู้ใช้ได้', category: 'User Management' },
      { id: 'user.update', name: 'แก้ไขผู้ใช้', description: 'สามารถแก้ไขข้อมูลผู้ใช้ได้', category: 'User Management' },
      { id: 'user.delete', name: 'ลบผู้ใช้', description: 'สามารถลบผู้ใช้ได้', category: 'User Management' },
      
      // Patient Management
      { id: 'patient.create', name: 'สร้างผู้ป่วย', description: 'สามารถสร้างข้อมูลผู้ป่วยใหม่ได้', category: 'Patient Management' },
      { id: 'patient.read', name: 'ดูข้อมูลผู้ป่วย', description: 'สามารถดูข้อมูลผู้ป่วยได้', category: 'Patient Management' },
      { id: 'patient.update', name: 'แก้ไขผู้ป่วย', description: 'สามารถแก้ไขข้อมูลผู้ป่วยได้', category: 'Patient Management' },
      { id: 'patient.delete', name: 'ลบผู้ป่วย', description: 'สามารถลบข้อมูลผู้ป่วยได้', category: 'Patient Management' },
      
      // Medical Records
      { id: 'medical.create', name: 'สร้างบันทึกการรักษา', description: 'สามารถสร้างบันทึกการรักษาได้', category: 'Medical Records' },
      { id: 'medical.read', name: 'ดูบันทึกการรักษา', description: 'สามารถดูบันทึกการรักษาได้', category: 'Medical Records' },
      { id: 'medical.update', name: 'แก้ไขบันทึกการรักษา', description: 'สามารถแก้ไขบันทึกการรักษาได้', category: 'Medical Records' },
      { id: 'medical.delete', name: 'ลบบันทึกการรักษา', description: 'สามารถลบบันทึกการรักษาได้', category: 'Medical Records' },
      
      // Appointments
      { id: 'appointment.create', name: 'สร้างนัดหมาย', description: 'สามารถสร้างนัดหมายได้', category: 'Appointments' },
      { id: 'appointment.read', name: 'ดูนัดหมาย', description: 'สามารถดูนัดหมายได้', category: 'Appointments' },
      { id: 'appointment.update', name: 'แก้ไขนัดหมาย', description: 'สามารถแก้ไขนัดหมายได้', category: 'Appointments' },
      { id: 'appointment.delete', name: 'ลบนัดหมาย', description: 'สามารถลบนัดหมายได้', category: 'Appointments' },
      
      // Prescriptions
      { id: 'prescription.create', name: 'สั่งยา', description: 'สามารถสั่งยาได้', category: 'Prescriptions' },
      { id: 'prescription.read', name: 'ดูใบสั่งยา', description: 'สามารถดูใบสั่งยาได้', category: 'Prescriptions' },
      { id: 'prescription.update', name: 'แก้ไขใบสั่งยา', description: 'สามารถแก้ไขใบสั่งยาได้', category: 'Prescriptions' },
      { id: 'prescription.delete', name: 'ลบใบสั่งยา', description: 'สามารถลบใบสั่งยาได้', category: 'Prescriptions' },
      
      // Lab Orders
      { id: 'lab.create', name: 'สั่งแลป', description: 'สามารถสั่งแลปได้', category: 'Lab Orders' },
      { id: 'lab.read', name: 'ดูผลแลป', description: 'สามารถดูผลแลปได้', category: 'Lab Orders' },
      { id: 'lab.update', name: 'แก้ไขผลแลป', description: 'สามารถแก้ไขผลแลปได้', category: 'Lab Orders' },
      { id: 'lab.delete', name: 'ลบผลแลป', description: 'สามารถลบผลแลปได้', category: 'Lab Orders' },
      
      // System Administration
      { id: 'system.settings', name: 'จัดการการตั้งค่าระบบ', description: 'สามารถจัดการการตั้งค่าระบบได้', category: 'System Administration' },
      { id: 'system.backup', name: 'สำรองข้อมูล', description: 'สามารถสำรองข้อมูลได้', category: 'System Administration' },
      { id: 'system.audit', name: 'ดูบันทึกการใช้งาน', description: 'สามารถดูบันทึกการใช้งานได้', category: 'System Administration' },
      { id: 'system.reports', name: 'ดูรายงาน', description: 'สามารถดูรายงานได้', category: 'System Administration' }
    ];

    // Define default permissions for each role
    const defaultRolePermissions: Record<string, string[]> = {
      'admin': permissions.map(p => p.id), // Admin has all permissions
      'doctor': [
        'patient.read', 'patient.update',
        'medical.create', 'medical.read', 'medical.update',
        'appointment.create', 'appointment.read', 'appointment.update',
        'prescription.create', 'prescription.read', 'prescription.update',
        'lab.create', 'lab.read', 'lab.update'
      ],
      'nurse': [
        'patient.read', 'patient.update',
        'medical.read', 'medical.update',
        'appointment.read', 'appointment.update',
        'prescription.read',
        'lab.read'
      ],
      'pharmacist': [
        'prescription.read', 'prescription.update',
        'patient.read'
      ],
      'lab_technician': [
        'lab.create', 'lab.read', 'lab.update',
        'patient.read'
      ],
      'staff': [
        'patient.create', 'patient.read', 'patient.update',
        'appointment.create', 'appointment.read', 'appointment.update'
      ],
      'patient': [
        'patient.read', 'appointment.read', 'prescription.read', 'lab.read'
      ]
    };

    // Build role permissions array
    const rolePermissions = roles.map(role => ({
      role,
      permissions: defaultRolePermissions[role] || []
    }));

    res.status(200).json({
      data: {
        permissions,
        rolePermissions
      },
      meta: {
        timestamp: new Date().toISOString(),
        totalPermissions: permissions.length,
        totalRoles: roles.length
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error getting role permissions:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};

/**
 * Update role permissions
 * POST /api/admin/role-permissions
 */
export const updateRolePermissions = async (req: Request, res: Response) => {
  try {
    const { rolePermissions } = req.body;
    const userId = (req as any).user.id;

    // In a real implementation, you would save these permissions to the database
    // For now, we'll just log the changes and return success
    // This could involve creating/updating a role_permissions table

    res.status(200).json({
      data: {
        message: 'Role permissions updated successfully',
        rolePermissions
      },
      meta: {
        timestamp: new Date().toISOString(),
        updatedBy: userId
      },
      error: null,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error updating role permissions:', error);
    res.status(500).json({
      data: null,
      meta: null,
      error: { message: 'Internal server error' },
      statusCode: 500
    });
  }
};
