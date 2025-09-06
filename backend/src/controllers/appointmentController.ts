import { Request, Response } from 'express';
import { databaseManager } from '../database/connection';

export class AppointmentController {
    // Get all appointments for a patient
    async getPatientAppointments(req: Request, res: Response) {
        try {
            const patientId = req.user?.id;
            const { status, startDate, endDate } = req.query;

            let query = `
                SELECT 
                    a.*,
                    at.name as type_name,
                    at.color as type_color,
                    at.duration_minutes,
                    d.first_name as doctor_first_name,
                    d.last_name as doctor_last_name
                FROM appointments a
                JOIN appointment_types at ON a.type_id = at.id
                JOIN users d ON a.doctor_id = d.id
                WHERE a.patient_id = $1
            `;

            const queryParams: any[] = [patientId];
            
            if (status) {
                query += ` AND a.status = $${queryParams.length + 1}`;
                queryParams.push(status);
            }

            if (startDate) {
                query += ` AND a.start_time >= $${queryParams.length + 1}`;
                queryParams.push(startDate);
            }

            if (endDate) {
                query += ` AND a.start_time <= $${queryParams.length + 1}`;
                queryParams.push(endDate);
            }

            query += ' ORDER BY a.start_time DESC';

            const { rows } = await databaseManager.query(query, queryParams);
            res.json({ success: true, data: rows });
        } catch (error) {
            console.error('Error fetching appointments:', error);
            res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการนัดหมาย' });
        }
    }

    // Create new appointment
    async createAppointment(req: Request, res: Response) {
        try {
            const patientId = req.user?.id;
            const { doctorId, typeId, startTime, endTime, reason } = req.body;

            // Validate appointment data
            // Basic validation - replace with proper validation logic
            const validationError = null; // TODO: Implement proper validation

            if (validationError) {
                return res.status(400).json({ success: false, error: validationError });
            }

            // Check for time slot availability
            const conflictQuery = `
                SELECT COUNT(*) 
                FROM appointments 
                WHERE doctor_id = $1 
                AND status = 'scheduled'
                AND (
                    (start_time <= $2 AND end_time > $2)
                    OR (start_time < $3 AND end_time >= $3)
                    OR (start_time >= $2 AND end_time <= $3)
                )
            `;

            const { rows: [{ count }] } = await databaseManager.query(conflictQuery, [
                doctorId,
                startTime,
                endTime
            ]);

            if (parseInt(count) > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'ช่วงเวลานี้ไม่ว่าง กรุณาเลือกเวลาอื่น'
                });
            }

            // Create appointment
            const insertQuery = `
                INSERT INTO appointments (
                    patient_id, doctor_id, type_id, 
                    start_time, end_time, reason
                )
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `;

            const { rows: [appointment] } = await databaseManager.query(insertQuery, [
                patientId,
                doctorId,
                typeId,
                startTime,
                endTime,
                reason
            ]);

            res.status(201).json({ success: true, data: appointment });
        } catch (error) {
            console.error('Error creating appointment:', error);
            res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการสร้างการนัดหมาย' });
        }
    }

    // Cancel appointment
    async cancelAppointment(req: Request, res: Response) {
        try {
            const { appointmentId } = req.params;
            const userId = req.user?.id;
            const { reason } = req.body;

            const updateQuery = `
                UPDATE appointments 
                SET 
                    status = 'cancelled',
                    cancelled_at = CURRENT_TIMESTAMP,
                    cancelled_by = $1,
                    cancellation_reason = $2
                WHERE id = $3 AND (patient_id = $1 OR doctor_id = $1)
                RETURNING *
            `;

            const { rows: [appointment] } = await databaseManager.query(updateQuery, [
                userId,
                reason,
                appointmentId
            ]);

            if (!appointment) {
                return res.status(404).json({
                    success: false,
                    error: 'ไม่พบการนัดหมายหรือคุณไม่มีสิทธิ์ยกเลิกการนัดหมายนี้'
                });
            }

            res.json({ success: true, data: appointment });
        } catch (error) {
            console.error('Error cancelling appointment:', error);
            res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการยกเลิกการนัดหมาย' });
        }
    }

    // Get available time slots
    async getAvailableTimeSlots(req: Request, res: Response) {
        try {
            const { doctorId, date, typeId } = req.query;

            // Get doctor's working hours and appointment type duration
            const { rows: [appointmentType] } = await databaseManager.query(
                'SELECT duration_minutes FROM appointment_types WHERE id = $1',
                [typeId]
            );

            // Get existing appointments for the day
            const existingAppointments = await databaseManager.query(
                `SELECT start_time, end_time 
                FROM appointments 
                WHERE doctor_id = $1 
                AND DATE(start_time) = DATE($2)
                AND status = 'scheduled'
                ORDER BY start_time`,
                [doctorId, date]
            );

            // Calculate available slots
            // Note: This is a simplified version. In production, you'd need to consider
            // doctor's working hours, breaks, etc.
            const slots = this.calculateAvailableTimeSlots(
                date as string,
                appointmentType.duration_minutes,
                existingAppointments.rows
            );

            res.json({ success: true, data: slots });
        } catch (error) {
            console.error('Error getting available time slots:', error);
            res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูลช่วงเวลาที่ว่าง' });
        }
    }

    private calculateAvailableTimeSlots(date: string, durationMinutes: number, existingAppointments: any[]) {
        // This is a simplified implementation
        // In production, you'd need more sophisticated logic considering:
        // - Doctor's working hours
        // - Breaks
        // - Hospital/clinic operation hours
        // - Holidays
        // etc.

        const startHour = 9; // 9 AM
        const endHour = 17; // 5 PM
        const slots = [];
        
        const dayStart = new Date(`${date}T${startHour}:00:00`);
        const dayEnd = new Date(`${date}T${endHour}:00:00`);
        
        let currentSlot = dayStart;
        
        while (currentSlot < dayEnd) {
            const slotEnd = new Date(currentSlot.getTime() + durationMinutes * 60000);
            
            // Check if slot conflicts with existing appointments
            const hasConflict = existingAppointments.some(appt => {
                const apptStart = new Date(appt.start_time);
                const apptEnd = new Date(appt.end_time);
                return (
                    (currentSlot >= apptStart && currentSlot < apptEnd) ||
                    (slotEnd > apptStart && slotEnd <= apptEnd)
                );
            });
            
            if (!hasConflict) {
                slots.push({
                    start: currentSlot.toISOString(),
                    end: slotEnd.toISOString()
                });
            }
            
            currentSlot = slotEnd;
        }
        
        return slots;
    }
}

export default new AppointmentController();
