import { apiClient } from '@/lib/api';
import { Appointment, CreateAppointmentRequest, APIResponse, TimeSlot } from '@/types/api';

export class AppointmentService {
  static async getAvailableTimeSlots(params: { 
    doctorId: number; 
    date: string; 
    typeId: number; 
  }): Promise<APIResponse<TimeSlot[]>> {
    try {
      const { doctorId, date, typeId } = params;
      const response = await apiClient.get(`/appointments/available-slots/${doctorId}/${date}/${typeId}`);
      return response as APIResponse<TimeSlot[]>;
    } catch (error: unknown) {
      return {
        data: null,
        meta: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch available time slots'
        },
        statusCode: 500
      };
    }
  }
  
  static async getAppointments(patientId: string): Promise<APIResponse<Appointment[]>> {
    try {
      const response = await apiClient.getPatientAppointments(patientId);
      return response;
    } catch (error: unknown) {
      return {
        data: null,
        meta: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch appointments'
        },
        statusCode: 500
      };
    }
  }

  static async getAppointment(appointmentId: string): Promise<APIResponse<Appointment>> {
    try {
      const response = await apiClient.getAppointment(appointmentId);
      return response;
    } catch (error: unknown) {
      return {
        data: null,
        meta: null,
        error: {
          code: 'FETCH_ERROR',
          message: (error as any).response?.data?.message || 'Failed to fetch appointment',
          details: (error as any).response?.data?.errors || (error as any).message
        },
        statusCode: (error as any).response?.status || 500
      };
    }
  }

  static async createAppointment(appointmentData: CreateAppointmentRequest): Promise<APIResponse<Appointment>> {
    try {
      const response = await apiClient.createAppointment(appointmentData);
      return response;
    } catch (error: unknown) {
      return {
        data: null,
        meta: null,
        error: {
          code: 'CREATE_ERROR',
          message: (error as any).response?.data?.message || 'Failed to create appointment',
          details: (error as any).response?.data?.errors || (error as any).message
        },
        statusCode: (error as any).response?.status || 500
      };
    }
  }

  static async updateAppointment(appointmentId: string, appointmentData: Partial<Appointment>): Promise<APIResponse<Appointment>> {
    try {
      const response = await apiClient.updateAppointment(appointmentId, appointmentData);
      return response;
    } catch (error: unknown) {
      return {
        data: null,
        meta: null,
        error: {
          code: 'UPDATE_ERROR',
          message: (error as any).response?.data?.message || 'Failed to update appointment',
          details: (error as any).response?.data?.errors || (error as any).message
        },
        statusCode: (error as any).response?.status || 500
      };
    }
  }

  static async cancelAppointment(appointmentId: string): Promise<APIResponse<void>> {
    try {
      const response = await apiClient.cancelAppointment(appointmentId);
      return response;
    } catch (error: unknown) {
      return {
        data: null,
        meta: null,
        error: {
          code: 'CANCEL_ERROR',
          message: (error as any).response?.data?.message || 'Failed to cancel appointment',
          details: (error as any).response?.data?.errors || (error as any).message
        },
        statusCode: (error as any).response?.status || 500
      };
    }
  }

  static async rescheduleAppointment(appointmentId: string, newDate: string, newTime: string): Promise<APIResponse<Appointment>> {
    try {
      const response = await apiClient.updateAppointment(appointmentId, {
        date: newDate,
        time: newTime,
        status: 'rescheduled'
      });
      return response;
    } catch (error: unknown) {
      return {
        data: null,
        meta: null,
        error: {
          code: 'RESCHEDULE_ERROR',
          message: (error as any).response?.data?.message || 'Failed to reschedule appointment',
          details: (error as any).response?.data?.errors || (error as any).message
        },
        statusCode: (error as any).response?.status || 500
      };
    }
  }
}
