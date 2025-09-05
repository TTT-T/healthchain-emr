import { apiClient } from '@/lib/api';
import { Appointment, CreateAppointmentRequest, APIResponse } from '@/types/api';

export class AppointmentService {
  static async getAvailableTimeSlots(params: { 
    doctorId: number; 
    date: string; 
    typeId: number; 
  }): Promise<APIResponse<TimeSlot[]>> {
    try {
      const { doctorId, date, typeId } = params;
      const response = await apiClient.get(`/appointments/available-slots/${doctorId}/${date}/${typeId}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch available time slots',
        errors: error.response?.data?.errors || error.message
      };
    }
  }
  
  static async getAppointments(patientId: string): Promise<APIResponse<Appointment[]>> {
    try {
      const response = await apiClient.getPatientAppointments(patientId);
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch appointments',
        errors: error.response?.data?.errors || error.message
      };
    }
  }

  static async getAppointment(appointmentId: string): Promise<APIResponse<Appointment>> {
    try {
      const response = await apiClient.getAppointment(appointmentId);
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch appointment',
        errors: error.response?.data?.errors || error.message
      };
    }
  }

  static async createAppointment(appointmentData: CreateAppointmentRequest): Promise<APIResponse<Appointment>> {
    try {
      const response = await apiClient.createAppointment(appointmentData);
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create appointment',
        errors: error.response?.data?.errors || error.message
      };
    }
  }

  static async updateAppointment(appointmentId: string, appointmentData: Partial<Appointment>): Promise<APIResponse<Appointment>> {
    try {
      const response = await apiClient.updateAppointment(appointmentId, appointmentData);
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update appointment',
        errors: error.response?.data?.errors || error.message
      };
    }
  }

  static async cancelAppointment(appointmentId: string): Promise<APIResponse<void>> {
    try {
      const response = await apiClient.cancelAppointment(appointmentId);
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to cancel appointment',
        errors: error.response?.data?.errors || error.message
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
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to reschedule appointment',
        errors: error.response?.data?.errors || error.message
      };
    }
  }
}
