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
    appointmentTypeId: string;
    startTime: string;
    endTime: string;
    reasonForVisit: string;
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
    created_at: string;
    updated_at: string;
    cancelledAt?: string;
    cancelledBy?: number;
    cancellationReason?: string;
}
