-- Create appointment_types table
CREATE TABLE appointment_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL,
    color VARCHAR(7) NOT NULL, -- Hex color code
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create appointments table
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id),
    doctor_id UUID NOT NULL REFERENCES users(id),
    type_id INTEGER NOT NULL REFERENCES appointment_types(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled', -- scheduled, completed, cancelled, no-show
    notes TEXT,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_by UUID REFERENCES users(id),
    cancellation_reason TEXT,
    
    -- Add constraints
    CONSTRAINT valid_appointment_time CHECK (end_time > start_time),
    CONSTRAINT valid_status CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no-show'))
);

-- Create index for faster queries
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_start_time ON appointments(start_time);
CREATE INDEX idx_appointments_status ON appointments(status);

-- Insert default appointment types
INSERT INTO appointment_types (name, description, duration_minutes, color) VALUES
('ตรวจทั่วไป', 'การตรวจรักษาทั่วไป', 15, '#4CAF50'),
('ตรวจติดตามอาการ', 'การตรวจติดตามผลการรักษา', 30, '#2196F3'),
('ตรวจละเอียด', 'การตรวจรักษาแบบละเอียด', 60, '#9C27B0'),
('ฉุกเฉิน', 'กรณีฉุกเฉิน', 30, '#F44336');
