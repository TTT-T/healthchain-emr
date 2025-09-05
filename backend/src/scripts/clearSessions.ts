import { db } from '../database/index.js';

async function clearOldSessions() {
  try {
    console.log('🧹 Clearing old sessions...');
    
    // Clear expired sessions
    const result = await db.query('DELETE FROM user_sessions WHERE expires_at < NOW()');
    console.log('✅ Cleared ' + result.rowCount + ' expired sessions');
    
    // Clear sessions with invalid user references
    const result2 = await db.query('DELETE FROM user_sessions WHERE user_id NOT IN (SELECT id FROM users)');
    console.log('✅ Cleared ' + result2.rowCount + ' orphaned sessions');
    
    // Clear all sessions for safety in development
    const result3 = await db.query('DELETE FROM user_sessions');
    console.log('✅ Cleared ' + result3.rowCount + ' remaining sessions');
    
    console.log('🎉 Session cleanup completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Session cleanup failed:', error);
    process.exit(1);
  }
}

clearOldSessions();
