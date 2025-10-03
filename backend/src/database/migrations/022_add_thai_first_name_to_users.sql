-- Add thai_first_name column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS thai_first_name VARCHAR(100);

-- Add comment for documentation
COMMENT ON COLUMN users.thai_first_name IS 'Thai first name only (ชื่อภาษาไทย)';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_thai_first_name ON users(thai_first_name);
