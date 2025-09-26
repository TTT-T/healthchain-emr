-- Create database management tables for admin panel
-- This migration creates tables needed for database backup, optimization, and monitoring

-- Database Backup Logs Table
CREATE TABLE IF NOT EXISTS database_backup_logs (
    id VARCHAR(50) PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    size_bytes BIGINT,
    size_mb DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'in_progress' 
        CHECK (status IN ('in_progress', 'completed', 'failed', 'cancelled')),
    type VARCHAR(20) DEFAULT 'full' 
        CHECK (type IN ('full', 'incremental', 'differential')),
    description TEXT,
    created_by UUID REFERENCES users(id),
    error_message TEXT,
    backup_path VARCHAR(500)
);

-- System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_name VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(20) DEFAULT 'string' 
        CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    is_encrypted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id)
);

-- Database Performance Metrics Table
CREATE TABLE IF NOT EXISTS database_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_unit VARCHAR(20),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    additional_data JSONB
);

-- Database Maintenance Logs Table
CREATE TABLE IF NOT EXISTS database_maintenance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation_type VARCHAR(50) NOT NULL 
        CHECK (operation_type IN ('vacuum', 'analyze', 'reindex', 'backup', 'restore', 'optimize')),
    status VARCHAR(20) DEFAULT 'started' 
        CHECK (status IN ('started', 'completed', 'failed', 'cancelled')),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    duration_ms INTEGER,
    affected_tables TEXT[],
    error_message TEXT,
    performed_by UUID REFERENCES users(id),
    additional_info JSONB
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_database_backup_logs_created_at ON database_backup_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_database_backup_logs_status ON database_backup_logs(status);
CREATE INDEX IF NOT EXISTS idx_database_backup_logs_type ON database_backup_logs(type);

CREATE INDEX IF NOT EXISTS idx_system_settings_name ON system_settings(setting_name);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);

CREATE INDEX IF NOT EXISTS idx_database_performance_metrics_name ON database_performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_database_performance_metrics_recorded_at ON database_performance_metrics(recorded_at);

CREATE INDEX IF NOT EXISTS idx_database_maintenance_logs_operation ON database_maintenance_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_database_maintenance_logs_started_at ON database_maintenance_logs(started_at);
CREATE INDEX IF NOT EXISTS idx_database_maintenance_logs_status ON database_maintenance_logs(status);

-- Insert default system settings
INSERT INTO system_settings (setting_name, setting_value, setting_type, description, category) VALUES
('backup_frequency', 'daily', 'string', 'How often to perform automatic backups', 'backup'),
('backup_retention', '30', 'number', 'Number of days to retain backup files', 'backup'),
('backup_compression', 'true', 'boolean', 'Whether to compress backup files', 'backup'),
('backup_encryption', 'true', 'boolean', 'Whether to encrypt backup files', 'backup'),
('backup_location', '/backups', 'string', 'Default location for backup files', 'backup'),
('maintenance_window_start', '02:00', 'string', 'Start time for maintenance operations', 'maintenance'),
('maintenance_window_end', '04:00', 'string', 'End time for maintenance operations', 'maintenance'),
('auto_vacuum_enabled', 'true', 'boolean', 'Whether automatic vacuum is enabled', 'maintenance'),
('auto_analyze_enabled', 'true', 'boolean', 'Whether automatic analyze is enabled', 'maintenance'),
('performance_monitoring_enabled', 'true', 'boolean', 'Whether performance monitoring is enabled', 'monitoring')
ON CONFLICT (setting_name) DO NOTHING;

-- Add trigger for updated_at
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_system_settings_updated_at') THEN
        CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

COMMENT ON TABLE database_backup_logs IS 'Logs of database backup operations';
COMMENT ON TABLE system_settings IS 'System configuration settings';
COMMENT ON TABLE database_performance_metrics IS 'Database performance monitoring metrics';
COMMENT ON TABLE database_maintenance_logs IS 'Logs of database maintenance operations';
