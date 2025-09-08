import { Request, Response } from 'express';
import { databaseManager } from '../database';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

/**
 * Get comprehensive patient summary
 */
export const getPatientSummary = asyncHandler(async (req: Request, res: Response) => {
  const { patientId } = req.params;

  try {
    const client = await databaseManager.getClient();
    
    // Get patient basic information
    const patientQuery = `
      SELECT id, thai_name, first_name, last_name, national_id, hospital_number, 
             age, gender, phone, email, address, emergency_contact, 
             created_at, updated_at
      FROM users 
      WHERE id = $1 AND role = 'patient'
    `;
    const patientResult = await client.query(patientQuery, [patientId]);

    if (patientResult.rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Patient not found',
        data: null,
        error: {
          code: 'PATIENT_NOT_FOUND',
          message: 'Patient with the specified ID does not exist'
        }
      });
    }

    const patient = patientResult.rows[0];

    // Get all medical records for the patient
    const recordsQuery = `
      SELECT mr.*, 
             u.thai_name as recorded_by_name,
             d.thai_name as doctor_name
      FROM medical_records mr
      LEFT JOIN users u ON mr.recorded_by = u.id
      LEFT JOIN users d ON mr.doctor_id = d.id
      WHERE mr.patient_id = $1
      ORDER BY mr.recorded_time DESC
    `;
    const recordsResult = await client.query(recordsQuery, [patientId]);

    // Organize records by type
    const organizedRecords = {
      visits: [],
      vitalSigns: [],
      historyTaking: [],
      doctorVisits: [],
      pharmacy: [],
      labResults: [],
      appointments: [],
      documents: []
    };

    recordsResult.rows.forEach(record => {
      const recordData = {
        id: record.id,
        recordType: record.record_type,
        recordedBy: record.recorded_by,
        recordedByName: record.recorded_by_name,
        doctorName: record.doctor_name,
        recordedTime: record.recorded_time,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
        data: {}
      };

      // Parse JSON fields based on record type
      switch (record.record_type) {
        case 'visit':
          recordData.data = {
            visitType: record.visit_type,
            symptoms: record.symptoms,
            notes: record.notes,
            status: record.status
          };
          organizedRecords.visits.push(recordData);
          break;
        
        case 'vital_signs':
          recordData.data = {
            bloodPressure: record.blood_pressure,
            heartRate: record.heart_rate,
            temperature: record.temperature,
            respiratoryRate: record.respiratory_rate,
            oxygenSaturation: record.oxygen_saturation,
            weight: record.weight,
            height: record.height,
            bmi: record.bmi,
            notes: record.notes
          };
          organizedRecords.vitalSigns.push(recordData);
          break;
        
        case 'history_taking':
          recordData.data = {
            chiefComplaint: record.chief_complaint,
            presentIllness: record.present_illness,
            pastHistory: record.past_history,
            familyHistory: record.family_history,
            socialHistory: record.social_history,
            medications: record.medications ? JSON.parse(record.medications) : [],
            allergies: record.allergies ? JSON.parse(record.allergies) : [],
            notes: record.notes
          };
          organizedRecords.historyTaking.push(recordData);
          break;
        
        case 'doctor_visit':
          recordData.data = {
            physicalExam: record.physical_exam ? JSON.parse(record.physical_exam) : {},
            diagnosis: record.diagnosis ? JSON.parse(record.diagnosis) : [],
            treatmentPlan: record.treatment_plan ? JSON.parse(record.treatment_plan) : {},
            advice: record.advice,
            followUp: record.follow_up,
            notes: record.notes
          };
          organizedRecords.doctorVisits.push(recordData);
          break;
        
        case 'pharmacy_dispensing':
          recordData.data = {
            medications: record.medications ? JSON.parse(record.medications) : [],
            totalAmount: record.total_amount,
            paymentMethod: record.payment_method,
            notes: record.notes
          };
          organizedRecords.pharmacy.push(recordData);
          break;
        
        case 'lab_result':
          recordData.data = {
            testType: record.test_type,
            testName: record.test_name,
            testResults: record.test_results ? JSON.parse(record.test_results) : [],
            overallResult: record.overall_result,
            interpretation: record.interpretation,
            recommendations: record.recommendations,
            attachments: record.attachments ? JSON.parse(record.attachments) : [],
            notes: record.notes
          };
          organizedRecords.labResults.push(recordData);
          break;
        
        case 'appointment':
          recordData.data = {
            appointmentType: record.appointment_type,
            appointmentDate: record.appointment_date,
            appointmentTime: record.appointment_time,
            duration: record.duration,
            reason: record.reason,
            status: record.status,
            priority: record.priority,
            location: record.location,
            notes: record.notes
          };
          organizedRecords.appointments.push(recordData);
          break;
        
        case 'document':
          recordData.data = {
            documentType: record.document_type,
            documentTitle: record.document_title,
            content: record.content,
            status: record.status,
            issuedDate: record.issued_date,
            validUntil: record.valid_until,
            notes: record.notes
          };
          organizedRecords.documents.push(recordData);
          break;
      }
    });

    // Calculate summary statistics
    const summary = {
      totalVisits: organizedRecords.visits.length,
      totalAppointments: organizedRecords.appointments.length,
      totalDocuments: organizedRecords.documents.length,
      totalLabResults: organizedRecords.labResults.length,
      totalPharmacyRecords: organizedRecords.pharmacy.length,
      lastVisit: organizedRecords.visits.length > 0 ? organizedRecords.visits[0].recordedTime : null,
      lastAppointment: organizedRecords.appointments.length > 0 ? organizedRecords.appointments[0].recordedTime : null,
      upcomingAppointments: organizedRecords.appointments.filter(apt => 
        new Date(apt.data.appointmentDate) > new Date()
      ).length
    };

    logger.info('Patient summary retrieved successfully', {
      patientId,
      totalRecords: recordsResult.rows.length
    });

    res.status(200).json({
      statusCode: 200,
      message: 'Patient summary retrieved successfully',
      data: {
        patient: {
          id: patient.id,
          thaiName: patient.thai_name,
          firstName: patient.first_name,
          lastName: patient.last_name,
          nationalId: patient.national_id,
          hospitalNumber: patient.hospital_number,
          age: patient.age,
          gender: patient.gender,
          phone: patient.phone,
          email: patient.email,
          address: patient.address,
          emergencyContact: patient.emergency_contact,
          createdAt: patient.created_at,
          updatedAt: patient.updated_at
        },
        records: organizedRecords,
        summary
      }
    });

  } catch (error) {
    logger.error('Error retrieving patient summary:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve patient summary'
      }
    });
  }
});

/**
 * Get patient medical timeline
 */
export const getPatientTimeline = asyncHandler(async (req: Request, res: Response) => {
  const { patientId } = req.params;
  const { limit = 50, offset = 0 } = req.query;

  try {
    const client = await databaseManager.getClient();
    
    const query = `
      SELECT mr.*, 
             u.thai_name as recorded_by_name,
             d.thai_name as doctor_name
      FROM medical_records mr
      LEFT JOIN users u ON mr.recorded_by = u.id
      LEFT JOIN users d ON mr.doctor_id = d.id
      WHERE mr.patient_id = $1
      ORDER BY mr.recorded_time DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await client.query(query, [patientId, limit, offset]);

    const timeline = result.rows.map(record => ({
      id: record.id,
      recordType: record.record_type,
      recordedBy: record.recorded_by,
      recordedByName: record.recorded_by_name,
      doctorName: record.doctor_name,
      recordedTime: record.recorded_time,
      createdAt: record.created_at,
      title: getRecordTitle(record),
      description: getRecordDescription(record),
      data: getRecordData(record)
    }));

    res.status(200).json({
      statusCode: 200,
      message: 'Patient timeline retrieved successfully',
      data: timeline,
      meta: {
        total: timeline.length,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });

  } catch (error) {
    logger.error('Error retrieving patient timeline:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve patient timeline'
      }
    });
  }
});

/**
 * Helper function to get record title
 */
function getRecordTitle(record: any): string {
  switch (record.record_type) {
    case 'visit':
      return `การเยี่ยม - ${record.visit_type || 'ไม่ระบุ'}`;
    case 'vital_signs':
      return 'การวัดสัญญาณชีพ';
    case 'history_taking':
      return 'การซักประวัติ';
    case 'doctor_visit':
      return 'การตรวจโดยแพทย์';
    case 'pharmacy_dispensing':
      return 'การจ่ายยา';
    case 'lab_result':
      return `ผลแลบ - ${record.test_name || 'ไม่ระบุ'}`;
    case 'appointment':
      return `นัดหมาย - ${record.appointment_type || 'ไม่ระบุ'}`;
    case 'document':
      return `เอกสาร - ${record.document_title || 'ไม่ระบุ'}`;
    default:
      return 'บันทึกทางการแพทย์';
  }
}

/**
 * Helper function to get record description
 */
function getRecordDescription(record: any): string {
  switch (record.record_type) {
    case 'visit':
      return record.symptoms || 'ไม่มีอาการ';
    case 'vital_signs':
      return `BP: ${record.blood_pressure || 'N/A'}, HR: ${record.heart_rate || 'N/A'}, Temp: ${record.temperature || 'N/A'}`;
    case 'history_taking':
      return record.chief_complaint || 'ไม่มีอาการหลัก';
    case 'doctor_visit':
      return record.advice || 'ไม่มีคำแนะนำ';
    case 'pharmacy_dispensing':
      return `ยอดรวม: ${record.total_amount || 0} บาท`;
    case 'lab_result':
      return record.overall_result || 'ไม่ระบุผล';
    case 'appointment':
      return record.reason || 'ไม่มีเหตุผล';
    case 'document':
      return record.document_type || 'ไม่ระบุประเภท';
    default:
      return 'ไม่มีคำอธิบาย';
  }
}

/**
 * Helper function to get record data
 */
function getRecordData(record: any): any {
  const baseData = {
    notes: record.notes,
    recordedBy: record.recorded_by_name,
    doctorName: record.doctor_name
  };

  switch (record.record_type) {
    case 'visit':
      return {
        ...baseData,
        visitType: record.visit_type,
        symptoms: record.symptoms,
        status: record.status
      };
    case 'vital_signs':
      return {
        ...baseData,
        bloodPressure: record.blood_pressure,
        heartRate: record.heart_rate,
        temperature: record.temperature,
        respiratoryRate: record.respiratory_rate,
        oxygenSaturation: record.oxygen_saturation,
        weight: record.weight,
        height: record.height,
        bmi: record.bmi
      };
    case 'history_taking':
      return {
        ...baseData,
        chiefComplaint: record.chief_complaint,
        presentIllness: record.present_illness,
        pastHistory: record.past_history,
        familyHistory: record.family_history,
        socialHistory: record.social_history
      };
    case 'doctor_visit':
      return {
        ...baseData,
        physicalExam: record.physical_exam ? JSON.parse(record.physical_exam) : {},
        diagnosis: record.diagnosis ? JSON.parse(record.diagnosis) : [],
        treatmentPlan: record.treatment_plan ? JSON.parse(record.treatment_plan) : {},
        advice: record.advice,
        followUp: record.follow_up
      };
    case 'pharmacy_dispensing':
      return {
        ...baseData,
        medications: record.medications ? JSON.parse(record.medications) : [],
        totalAmount: record.total_amount,
        paymentMethod: record.payment_method
      };
    case 'lab_result':
      return {
        ...baseData,
        testType: record.test_type,
        testName: record.test_name,
        testResults: record.test_results ? JSON.parse(record.test_results) : [],
        overallResult: record.overall_result,
        interpretation: record.interpretation,
        recommendations: record.recommendations
      };
    case 'appointment':
      return {
        ...baseData,
        appointmentType: record.appointment_type,
        appointmentDate: record.appointment_date,
        appointmentTime: record.appointment_time,
        duration: record.duration,
        reason: record.reason,
        status: record.status,
        priority: record.priority,
        location: record.location
      };
    case 'document':
      return {
        ...baseData,
        documentType: record.document_type,
        documentTitle: record.document_title,
        content: record.content,
        status: record.status,
        issuedDate: record.issued_date,
        validUntil: record.valid_until
      };
    default:
      return baseData;
  }
}
