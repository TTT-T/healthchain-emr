export interface APIResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: string[];
}

export interface AppointmentType {
    id: number;
    name: string;
    description: string;
    durationMinutes: number;
    color: string;
}

export interface Doctor {
    id: number;
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
    id: number;
    patientId: number;
    doctorId: number;
    typeId: number;
    startTime: string;
    endTime: string;
    status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
    reason: string;
    notes?: string;
    doctor: Doctor;
    type: AppointmentType;
    createdAt: string;
    updatedAt: string;
    cancelledAt?: string;
    cancelledBy?: number;
    cancellationReason?: string;
}
