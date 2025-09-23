import { MigrationManager } from '../database/migrations';

/**
 * Run database migrations
 */
async function runMigrations() {
  try {
    const migrationManager = MigrationManager.getInstance();
    await migrationManager.initialize();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

export { runMigrations };