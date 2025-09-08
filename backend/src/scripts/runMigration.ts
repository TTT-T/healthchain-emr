import { MigrationManager } from '../database/migrations';

/**
 * Run database migrations
 */
async function runMigrations() {
  console.log('🔄 Running database migrations...');
  
  try {
    const migrationManager = MigrationManager.getInstance();
    await migrationManager.initialize();
    
    console.log('✅ All migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('✅ Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

export { runMigrations };