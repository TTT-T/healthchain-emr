export interface APIResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: string[];
}

export interface AppointmentType {
    id: string; // Changed from number to string (UUID)
    name: string;
    description: string;
    durationMinutes: number;
    color: string;
}

export interface Doctor {
    id: string; // Changed from number to string (UUID)
    firstName: string;
    lastName: string;
    speciality: string;
}

export interface TimeSlot {
    startTime: string;
    endTime: string;
    isAvailable: boolean;
}

export interface CreateAppointmentRequest {
    doctorId: string;
    typeId: string;
    startTime: string;
    endTime: string;
    reason: string;
}

export interface Appointment {
    id: string; // Changed from number to string (UUID)
    patientId: string; // Changed from number to string (UUID)
    doctorId: string; // Changed from number to string (UUID)
    typeId: string; // Changed from number to string (UUID)
    startTime: string;
    endTime: string;
    status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
    reason: string;
    notes?: string;
    doctor: Doctor;
    type: AppointmentType;
    created_at: string;
    updated_at: string;
    cancelledAt?: string;
    cancelledBy?: string; // Changed from number to string (UUID)
    cancellationReason?: string;
}
