import { MigrationManager } from '../database/migrations';
import { databaseManager } from '../database/connection';

/**
 * Migration Checker and Runner
 * ตรวจสอบและรัน migrations อัตโนมัติ
 */
export class MigrationChecker {
  private static instance: MigrationChecker;
  private migrationManager: MigrationManager;

  private constructor() {
    this.migrationManager = MigrationManager.getInstance();
  }

  public static getInstance(): MigrationChecker {
    if (!MigrationChecker.instance) {
      MigrationChecker.instance = new MigrationChecker();
    }
    return MigrationChecker.instance;
  }

  /**
   * ตรวจสอบและรัน migrations ทั้งหมด
   */
  public async checkAndRunMigrations(): Promise<{
    success: boolean;
    message: string;
    details: {
      total: number;
      executed: number;
      pending: number;
      failed: number;
      newMigrations: number;
    };
  }> {
    try {
      console.log('🔄 เริ่มตรวจสอบและรัน migrations...');
      
      // ตรวจสอบการเชื่อมต่อฐานข้อมูล
      await databaseManager.initialize();
      console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ');

      // ตรวจสอบสถานะ migrations ก่อน
      const beforeStatus = await this.migrationManager.getMigrationStatus();
      console.log(`📊 สถานะ migrations ก่อนรัน: ${beforeStatus.executed}/${beforeStatus.total} สำเร็จ, ${beforeStatus.failed} ล้มเหลว`);

      // รัน migrations
      await this.migrationManager.initialize();
      console.log('✅ รัน migrations สำเร็จ');

      // ตรวจสอบสถานะ migrations หลังรัน
      const afterStatus = await this.migrationManager.getMigrationStatus();
      const newMigrations = afterStatus.executed - beforeStatus.executed;

      console.log(`📊 สถานะ migrations หลังรัน: ${afterStatus.executed}/${afterStatus.total} สำเร็จ, ${afterStatus.failed} ล้มเหลว`);
      
      if (newMigrations > 0) {
        console.log(`🆕 รัน migrations ใหม่ ${newMigrations} ตัว`);
      }

      return {
        success: true,
        message: `Migrations ทำงานสำเร็จ! รัน migrations ใหม่ ${newMigrations} ตัว`,
        details: {
          total: afterStatus.total,
          executed: afterStatus.executed,
          pending: afterStatus.pending,
          failed: afterStatus.failed,
          newMigrations
        }
      };

    } catch (error) {
      console.error('❌ เกิดข้อผิดพลาดในการรัน migrations:', error);
      
      return {
        success: false,
        message: `เกิดข้อผิดพลาด: ${error instanceof Error ? error.message : String(error)}`,
        details: {
          total: 0,
          executed: 0,
          pending: 0,
          failed: 1,
          newMigrations: 0
        }
      };
    }
  }

  /**
   * ตรวจสอบสถานะ migrations โดยไม่รัน
   */
  public async checkMigrationStatus(): Promise<{
    success: boolean;
    message: string;
    details: {
      total: number;
      executed: number;
      pending: number;
      failed: number;
      migrations: Array<{
        name: string;
        executed_at: Date;
        execution_time_ms: number;
        success: boolean;
        error_message?: string;
      }>;
    };
  }> {
    try {
      console.log('🔍 ตรวจสอบสถานะ migrations...');
      
      // ตรวจสอบการเชื่อมต่อฐานข้อมูล
      await databaseManager.initialize();
      console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ');

      // ตรวจสอบสถานะ migrations
      const status = await this.migrationManager.getMigrationStatus();
      
      console.log(`📊 สถานะ migrations: ${status.executed}/${status.total} สำเร็จ, ${status.failed} ล้มเหลว`);

      return {
        success: true,
        message: `ตรวจสอบสถานะ migrations สำเร็จ`,
        details: status
      };

    } catch (error) {
      console.error('❌ เกิดข้อผิดพลาดในการตรวจสอบ migrations:', error);
      
      return {
        success: false,
        message: `เกิดข้อผิดพลาด: ${error instanceof Error ? error.message : String(error)}`,
        details: {
          total: 0,
          executed: 0,
          pending: 0,
          failed: 0,
          migrations: []
        }
      };
    }
  }

  /**
   * รีเซ็ต migrations (สำหรับ development เท่านั้น)
   */
  public async resetMigrations(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      console.log('⚠️  รีเซ็ต migrations (สำหรับ development เท่านั้น)...');
      
      // ตรวจสอบการเชื่อมต่อฐานข้อมูล
      await databaseManager.initialize();
      console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ');

      // รีเซ็ต migrations
      await this.migrationManager.resetMigrations();
      console.log('✅ รีเซ็ต migrations สำเร็จ');

      return {
        success: true,
        message: 'รีเซ็ต migrations สำเร็จ'
      };

    } catch (error) {
      console.error('❌ เกิดข้อผิดพลาดในการรีเซ็ต migrations:', error);
      
      return {
        success: false,
        message: `เกิดข้อผิดพลาด: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * ตรวจสอบว่ามี migrations ที่ล้มเหลวหรือไม่
   */
  public async hasFailedMigrations(): Promise<boolean> {
    try {
      const status = await this.migrationManager.getMigrationStatus();
      return status.failed > 0;
    } catch (error) {
      console.error('❌ เกิดข้อผิดพลาดในการตรวจสอบ migrations ที่ล้มเหลว:', error);
      return true; // ถ้าไม่สามารถตรวจสอบได้ ให้ถือว่ามีปัญหา
    }
  }

  /**
   * แสดงรายละเอียด migrations ทั้งหมด
   */
  public async showMigrationDetails(): Promise<void> {
    try {
      const status = await this.migrationManager.getMigrationStatus();
      
      console.log('\n📋 รายละเอียด Migrations:');
      console.log('=' .repeat(80));
      console.log(`📊 สถานะรวม: ${status.executed}/${status.total} สำเร็จ, ${status.failed} ล้มเหลว`);
      console.log('=' .repeat(80));
      
      if (status.migrations.length === 0) {
        console.log('📝 ไม่มี migrations');
        return;
      }

      status.migrations.forEach((migration, index) => {
        const statusIcon = migration.success ? '✅' : '❌';
        const timeStr = migration.execution_time_ms ? `${migration.execution_time_ms}ms` : 'N/A';
        const dateStr = migration.executed_at ? migration.executed_at.toLocaleString('th-TH') : 'N/A';
        
        console.log(`${index + 1}. ${statusIcon} ${migration.name}`);
        console.log(`   ⏰ เวลา: ${dateStr} (${timeStr})`);
        
        if (!migration.success && migration.error_message) {
          console.log(`   ❌ ข้อผิดพลาด: ${migration.error_message}`);
        }
        console.log('');
      });
      
    } catch (error) {
      console.error('❌ เกิดข้อผิดพลาดในการแสดงรายละเอียด migrations:', error);
    }
  }
}

/**
 * ฟังก์ชันหลักสำหรับรัน migrations
 */
async function runMigrationChecker() {
  const checker = MigrationChecker.getInstance();
  
  try {
    const result = await checker.checkAndRunMigrations();
    
    if (result.success) {
      console.log(`\n🎉 ${result.message}`);
      console.log(`📊 รายละเอียด: ${result.details.executed}/${result.details.total} สำเร็จ, ${result.details.failed} ล้มเหลว`);
      
      if (result.details.newMigrations > 0) {
        console.log(`🆕 รัน migrations ใหม่: ${result.details.newMigrations} ตัว`);
      }
      
      // แสดงรายละเอียด migrations
      await checker.showMigrationDetails();
      
    } else {
      console.log(`\n❌ ${result.message}`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการรัน migration checker:', error);
    process.exit(1);
  }
}

// รัน migrations ถ้าเรียกไฟล์นี้โดยตรง
if (require.main === module) {
  runMigrationChecker()
    .then(() => {
      console.log('\n✅ Migration checker เสร็จสิ้น');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration checker ล้มเหลว:', error);
      process.exit(1);
    });
}

export { runMigrationChecker };
