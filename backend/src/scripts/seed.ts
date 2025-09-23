#!/usr/bin/env node

import { databaseManager } from '../database/connection';
import bcrypt from 'bcryptjs';

/**
 * Database Seeding Script
 */
class DatabaseSeeder {
  private static instance: DatabaseSeeder;

  private constructor() {}

  public static getInstance(): DatabaseSeeder {
    if (!DatabaseSeeder.instance) {
      DatabaseSeeder.instance = new DatabaseSeeder();
    }
    return DatabaseSeeder.instance;
  }

  /**
   * Seed database with sample data
   */
  public async seed(): Promise<void> {
    try {
      // Initialize database connection
      await databaseManager.initialize();

      // Seed data in order
      await this.seedUsers();
      await this.seedPatients();
      await this.seedDepartments();
      await this.seedVisits();
      await this.seedVitalSigns();
      await this.seedLabOrders();
      await this.seedPrescriptions();
      await this.seedAppointments();
      await this.seedRiskAssessments();
      await this.seedConsentContracts();
    } catch (error) {
      console.error('❌ Database seeding failed:', error);
      throw error;
    }
  }

  /**
   * Seed users
   */
  private async seedUsers(): Promise<void> {
    const users = [
      {
        username: 'admin',
        email: 'admin@healthchain.co.th',
        password: await bcrypt.hash('admin123', 12),
        firstName: 'System',
        lastName: 'Administrator',
        role: 'admin',
        isActive: true,
        emailVerified: true
      },
      {
        username: 'dr_smith',
        email: 'dr.smith@healthchain.co.th',
        password: await bcrypt.hash('doctor123', 12),
        firstName: 'Dr. John',
        lastName: 'Smith',
        role: 'doctor',
        isActive: true,
        emailVerified: true
      },
      {
        username: 'nurse_wilson',
        email: 'nurse.wilson@healthchain.co.th',
        password: await bcrypt.hash('nurse123', 12),
        firstName: 'Sarah',
        lastName: 'Wilson',
        role: 'nurse',
        isActive: true,
        emailVerified: true
      },
      {
        username: 'pharmacist_chen',
        email: 'pharmacist.chen@healthchain.co.th',
        password: await bcrypt.hash('pharmacist123', 12),
        firstName: 'Dr. Lisa',
        lastName: 'Chen',
        role: 'pharmacist',
        isActive: true,
        emailVerified: true
      },
      {
        username: 'patient_doe',
        email: 'john.doe@email.com',
        password: await bcrypt.hash('patient123', 12),
        firstName: 'John',
        lastName: 'Doe',
        role: 'patient',
        isActive: true,
        emailVerified: true
      },
      {
        username: 'patient_somchai',
        email: 'somchai@email.com',
        password: await bcrypt.hash('patient123', 12),
        firstName: 'สมชาย',
        lastName: 'ใจดี',
        role: 'patient',
        isActive: true,
        emailVerified: true
      },
      {
        username: 'dr_somchai',
        email: 'dr.somchai@healthchain.co.th',
        password: await bcrypt.hash('doctor123', 12),
        firstName: 'นพ.สมชาย',
        lastName: 'ใจดี',
        role: 'doctor',
        isActive: true,
        emailVerified: true
      }
    ];

    for (const user of users) {
      await databaseManager.query(`
        INSERT INTO users (
          username, email, password_hash, first_name, last_name, 
          role, is_active, email_verified, profile_completed
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (username) DO NOTHING
      `, [
        user.username,
        user.email,
        user.password,
        user.firstName,
        user.lastName,
        user.role,
        user.isActive,
        user.emailVerified,
        true
      ]);
    }
  }

  /**
   * Seed patients
   */
  private async seedPatients(): Promise<void> {
    const patients = [
      {
        hospitalNumber: '68-123456',
        nationalId: '1234567890123',
        firstName: 'John',
        lastName: 'Doe',
        thaiName: 'จอห์น โด',
        gender: 'male',
        birthDate: '1985-05-15',
        phone: '081-234-5678',
        email: 'john.doe@email.com',
        address: '123 Sukhumvit Road, Bangkok 10110',
        emergencyContactName: 'Jane Doe',
        emergencyContactPhone: '082-345-6789',
        emergencyContactRelationship: 'Wife',
        bloodType: 'O+',
        allergies: 'Penicillin, Shellfish',
        chronicConditions: ['Hypertension'],
        currentMedications: 'Amlodipine 5mg daily',
        insuranceProvider: 'Social Security',
        insurancePolicyNumber: 'SS-123456789'
      },
      {
        hospitalNumber: '68-123457',
        nationalId: '2345678901234',
        firstName: 'สมชาย',
        lastName: 'ใจดี',
        thaiName: 'สมชาย ใจดี',
        gender: 'male',
        birthDate: '1978-03-22',
        phone: '081-234-5679',
        email: 'somchai@email.com',
        address: '456 ถนนสุขุมวิท กรุงเทพฯ 10110',
        emergencyContactName: 'นางสมใจ ใจดี',
        emergencyContactPhone: '082-345-6790',
        emergencyContactRelationship: 'ภรรยา',
        bloodType: 'A+',
        allergies: '',
        chronicConditions: ['Diabetes Type 2'],
        currentMedications: 'Metformin 500mg twice daily',
        insuranceProvider: 'ประกันสังคม',
        insurancePolicyNumber: 'PS-234567890'
      },
      {
        hospitalNumber: '68-123458',
        nationalId: '3456789012345',
        firstName: 'Jane',
        lastName: 'Smith',
        thaiName: 'เจน สมิธ',
        gender: 'female',
        birthDate: '1990-12-08',
        phone: '081-234-5680',
        email: 'jane.smith@email.com',
        address: '789 Silom Road, Bangkok 10500',
        emergencyContactName: 'Robert Smith',
        emergencyContactPhone: '082-345-6791',
        emergencyContactRelationship: 'Husband',
        bloodType: 'B+',
        allergies: 'Latex',
        chronicConditions: [],
        currentMedications: '',
        insuranceProvider: 'Private Insurance',
        insurancePolicyNumber: 'PI-345678901'
      },
      {
        hospitalNumber: 'HN250001',
        nationalId: '1234567890123',
        firstName: 'น้ำ',
        lastName: 'หัวควย',
        thaiName: 'น้ำ หัวควย',
        gender: 'male',
        birthDate: '1956-05-15', // 68 years old
        phone: '081-234-5681',
        email: 'nam.huakuay@email.com',
        address: '123 ถนนสุขุมวิท กรุงเทพฯ 10110',
        emergencyContactName: 'นางสมใจ หัวควย',
        emergencyContactPhone: '082-345-6792',
        emergencyContactRelationship: 'ภรรยา',
        bloodType: 'A+',
        allergies: '',
        chronicConditions: ['Hypertension'],
        currentMedications: 'Amlodipine 5mg daily',
        insuranceProvider: 'ประกันสังคม',
        insurancePolicyNumber: 'PS-123456789'
      }
    ];

    for (const patient of patients) {
      await databaseManager.query(`
        INSERT INTO patients (
          hospital_number, first_name, last_name, thai_name,
          gender, date_of_birth, phone, email, address,
          emergency_contact_name, emergency_contact_phone,
          emergency_contact_relationship, blood_type, allergies, chronic_conditions,
          current_medications
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (hospital_number) DO NOTHING
      `, [
        patient.hospitalNumber,
        patient.firstName,
        patient.lastName,
        patient.thaiName,
        patient.gender,
        patient.birthDate,
        patient.phone,
        patient.email,
        patient.address,
        patient.emergencyContactName,
        patient.emergencyContactPhone,
        patient.emergencyContactRelationship,
        patient.bloodType,
        patient.allergies,
        patient.chronicConditions,
        patient.currentMedications
      ]);
    }
  }

  /**
   * Seed departments
   */
  private async seedDepartments(): Promise<void> {
    const departments = [
      { code: 'OPD', name: 'Out Patient Department', type: 'clinical' },
      { code: 'ER', name: 'Emergency Room', type: 'clinical' },
      { code: 'LAB', name: 'Laboratory', type: 'diagnostic' },
      { code: 'PHARM', name: 'Pharmacy', type: 'support' },
      { code: 'RADIO', name: 'Radiology', type: 'diagnostic' },
      { code: 'ADMIN', name: 'Administration', type: 'support' },
      { code: 'CARDIO', name: 'Cardiology', type: 'clinical' },
      { code: 'ENDO', name: 'Endocrinology', type: 'clinical' }
    ];

    for (const dept of departments) {
      await databaseManager.query(`
        INSERT INTO departments (department_code, department_name, department_type) 
        VALUES ($1, $2, $3) 
        ON CONFLICT (department_code) DO NOTHING
      `, [dept.code, dept.name, dept.type]);
    }
  }

  /**
   * Seed visits
   */
  private async seedVisits(): Promise<void> {
    // Get patient and doctor IDs
    const patients = await databaseManager.query('SELECT id FROM patients LIMIT 2');
    const doctors = await databaseManager.query('SELECT id FROM users WHERE role = \'doctor\' LIMIT 1');
    const nurses = await databaseManager.query('SELECT id FROM users WHERE role = \'nurse\' LIMIT 1');

    if (patients.rows.length === 0 || doctors.rows.length === 0) {
      return;
    }

    const visits = [
      {
        patientId: patients.rows[0].id,
        visitNumber: 'V-2025-001',
        visitDate: '2025-01-15',
        visitTime: '09:00',
        visitType: 'consultation',
        chiefComplaint: 'Chest pain and shortness of breath',
        presentIllness: 'Patient reports chest pain that started 2 days ago, worsens with exertion',
        physicalExamination: 'BP: 150/95, HR: 88, RR: 18, Temp: 36.8°C',
        diagnosis: 'Hypertension, possible angina',
        treatmentPlan: 'Start antihypertensive medication, lifestyle modifications',
        status: 'completed',
        priority: 'normal',
        attendingDoctorId: doctors.rows[0].id,
        assignedNurseId: nurses.rows[0].id
      },
      {
        patientId: patients.rows[0].id,
        visitNumber: 'V-2025-002',
        visitDate: '2025-01-22',
        visitTime: '10:30',
        visitType: 'follow_up',
        chiefComplaint: 'Follow-up for hypertension',
        presentIllness: 'Patient reports improvement in chest pain since starting medication',
        physicalExamination: 'BP: 135/85, HR: 82, RR: 16, Temp: 36.5°C',
        diagnosis: 'Hypertension - controlled',
        treatmentPlan: 'Continue current medication, monitor blood pressure',
        status: 'completed',
        priority: 'normal',
        attendingDoctorId: doctors.rows[0].id,
        assignedNurseId: nurses.rows[0].id
      }
    ];

    // Add visit for HN250001 patient if exists
    const hn250001Patient = patients.rows.find(p => p.hospital_number === 'HN250001');
    const drSomchai = doctors.rows.find(d => d.first_name === 'นพ.สมชาย' && d.last_name === 'ใจดี');
    if (hn250001Patient && drSomchai) {
      visits.push({
        patientId: hn250001Patient.id,
        visitNumber: 'Q001',
        visitDate: '2025-09-11',
        visitTime: '18:00',
        visitType: 'emergency',
        chiefComplaint: 'Emergency visit',
        presentIllness: 'Patient came for emergency treatment',
        physicalExamination: 'BP: 140/90, HR: 85, RR: 18, Temp: 36.5°C',
        diagnosis: 'Emergency visit',
        treatmentPlan: 'Emergency treatment',
        status: 'in_progress',
        priority: 'high',
        attendingDoctorId: drSomchai.id,
        assignedNurseId: nurses.rows[0].id
      });
    }

    for (const visit of visits) {
      await databaseManager.query(`
        INSERT INTO visits (
          patient_id, visit_number, visit_date, visit_time, visit_type,
          chief_complaint, present_illness, physical_examination, diagnosis,
          treatment_plan, status, priority, attending_doctor_id, assigned_nurse_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (visit_number) DO NOTHING
      `, [
        visit.patientId,
        visit.visitNumber,
        visit.visitDate,
        visit.visitTime,
        visit.visitType,
        visit.chiefComplaint,
        visit.presentIllness,
        visit.physicalExamination,
        visit.diagnosis,
        visit.treatmentPlan,
        visit.status,
        visit.priority,
        visit.attendingDoctorId,
        visit.assignedNurseId
      ]);
    }
  }

  /**
   * Seed vital signs
   */
  private async seedVitalSigns(): Promise<void> {
    const visits = await databaseManager.query('SELECT id, patient_id FROM visits LIMIT 2');
    const nurses = await databaseManager.query('SELECT id FROM users WHERE role = \'nurse\' LIMIT 1');

    if (visits.rows.length === 0) {
      return;
    }

    const vitalSigns = [
      {
        visitId: visits.rows[0].id,
        patientId: visits.rows[0].patient_id,
        weight: 75.5,
        height: 175,
        bmi: 24.7,
        systolicBp: 150,
        diastolicBp: 95,
        heartRate: 88,
        bodyTemperature: 36.8,
        respiratoryRate: 18,
        oxygenSaturation: 98,
        bloodSugar: 95,
        painLevel: 3,
        generalCondition: 'Stable',
        notes: 'Patient appears comfortable, no acute distress',
        measuredBy: nurses.rows[0].id
      },
      {
        visitId: visits.rows[1]?.id || visits.rows[0].id,
        patientId: visits.rows[0].patient_id,
        weight: 74.8,
        height: 175,
        bmi: 24.4,
        systolicBp: 135,
        diastolicBp: 85,
        heartRate: 82,
        bodyTemperature: 36.5,
        respiratoryRate: 16,
        oxygenSaturation: 99,
        bloodSugar: 88,
        painLevel: 0,
        generalCondition: 'Good',
        notes: 'Significant improvement in blood pressure',
        measuredBy: nurses.rows[0].id
      }
    ];

    for (const vital of vitalSigns) {
      await databaseManager.query(`
        INSERT INTO vital_signs (
          visit_id, patient_id, weight, height, bmi, systolic_bp, diastolic_bp,
          heart_rate, body_temperature, respiratory_rate, oxygen_saturation,
          blood_sugar, pain_level, general_condition, notes, measured_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `, [
        vital.visitId,
        vital.patientId,
        vital.weight,
        vital.height,
        vital.bmi,
        vital.systolicBp,
        vital.diastolicBp,
        vital.heartRate,
        vital.bodyTemperature,
        vital.respiratoryRate,
        vital.oxygenSaturation,
        vital.bloodSugar,
        vital.painLevel,
        vital.generalCondition,
        vital.notes,
        vital.measuredBy
      ]);
    }
  }

  /**
   * Seed lab orders
   */
  private async seedLabOrders(): Promise<void> {
    const visits = await databaseManager.query('SELECT id, patient_id FROM visits LIMIT 1');
    const doctors = await databaseManager.query('SELECT id FROM users WHERE role = \'doctor\' LIMIT 1');

    if (visits.rows.length === 0) {
      return;
    }

    const labOrders = [
      {
        visitId: visits.rows[0].id,
        patientId: visits.rows[0].patient_id,
        orderNumber: 'LAB-2025-001',
        Category: 'blood',
        Name: 'Complete Blood Count',
        Code: 'CBC',
        clinicalIndication: 'Routine check-up for hypertension',
        specimenType: 'blood',
        priority: 'routine',
        status: 'completed',
        orderedBy: doctors.rows[0].id
      }
    ];

    for (const order of labOrders) {
      await databaseManager.query(`
        INSERT INTO lab_orders (
          visit_id, patient_id, order_number, _category, _name,
          _code, clinical_indication, specimen_type, priority, status, ordered_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (order_number) DO NOTHING
      `, [
        order.visitId,
        order.patientId,
        order.orderNumber,
        order.Category,
        order.Name,
        order.Code,
        order.clinicalIndication,
        order.specimenType,
        order.priority,
        order.status,
        order.orderedBy
      ]);
    }
  }

  /**
   * Seed prescriptions
   */
  private async seedPrescriptions(): Promise<void> {
    const visits = await databaseManager.query('SELECT id, patient_id FROM visits LIMIT 1');
    const doctors = await databaseManager.query('SELECT id FROM users WHERE role = \'doctor\' LIMIT 1');

    if (visits.rows.length === 0) {
      return;
    }

    const prescriptions = [
      {
        visitId: visits.rows[0].id,
        patientId: visits.rows[0].patient_id,
        prescriptionNumber: 'RX-2025-001',
        prescribedBy: doctors.rows[0].id,
        diagnosisForPrescription: 'Hypertension',
        status: 'dispensed'
      }
    ];

    for (const prescription of prescriptions) {
      await databaseManager.query(`
        INSERT INTO prescriptions (
          visit_id, patient_id, prescription_number, prescribed_by,
          diagnosis_for_prescription, status
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (prescription_number) DO NOTHING
      `, [
        prescription.visitId,
        prescription.patientId,
        prescription.prescriptionNumber,
        prescription.prescribedBy,
        prescription.diagnosisForPrescription,
        prescription.status
      ]);
    }
  }

  /**
   * Seed appointments
   */
  private async seedAppointments(): Promise<void> {
    const patients = await databaseManager.query('SELECT id FROM patients LIMIT 2');
    const doctors = await databaseManager.query('SELECT id FROM users WHERE role = \'doctor\' LIMIT 1');

    if (patients.rows.length === 0) {
      return;
    }

    const appointments = [
      {
        patientId: patients.rows[0].id,
        physicianId: doctors.rows[0].id,
        title: 'Follow-up Visit',
        description: 'Blood pressure check and medication review',
        appointmentType: 'follow_up',
        status: 'scheduled',
        priority: 'normal',
        appointmentDate: '2025-01-29',
        appointmentTime: '10:00',
        durationMinutes: 30,
        location: JSON.stringify({
          hospital: 'HealthChain Hospital',
          building: 'Main Building',
          room: 'Cardiology Clinic Room 1',
          floor: '3rd Floor'
        }),
        notes: 'Blood pressure check and medication review',
        preparations: JSON.stringify(['Bring current medications', 'Fasting not required']),
        reminderSent: true
      }
    ];

    for (const appointment of appointments) {
      await databaseManager.query(`
        INSERT INTO appointments (
          patient_id, physician_id, title, description, appointment_type,
          status, priority, appointment_date, appointment_time, duration_minutes,
          location, notes, preparations, reminder_sent
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        appointment.patientId,
        appointment.physicianId,
        appointment.title,
        appointment.description,
        appointment.appointmentType,
        appointment.status,
        appointment.priority,
        appointment.appointmentDate,
        appointment.appointmentTime,
        appointment.durationMinutes,
        appointment.location,
        appointment.notes,
        appointment.preparations,
        appointment.reminderSent
      ]);
    }
  }

  /**
   * Seed risk assessments
   */
  private async seedRiskAssessments(): Promise<void> {
    const patients = await databaseManager.query('SELECT id FROM patients LIMIT 2');
    const doctors = await databaseManager.query('SELECT id FROM users WHERE role = \'doctor\' LIMIT 1');

    if (patients.rows.length === 0) {
      return;
    }

    const riskAssessments = [
      {
        patientId: patients.rows[0].id,
        assessmentType: 'diabetes',
        riskLevel: 'moderate',
        probability: 45.0,
        factors: JSON.stringify({
          age: 39,
          bmi: 24.7,
          familyHistory: false,
          physicalActivity: 'moderate',
          bloodPressure: 150,
          bloodSugar: 95
        }),
        recommendations: ['Maintain regular exercise', 'Continue healthy diet', 'Blood pressure management'],
        nextAssessmentDate: '2025-04-15',
        assessedBy: doctors.rows[0].id
      }
    ];

    for (const assessment of riskAssessments) {
      await databaseManager.query(`
        INSERT INTO risk_assessments (
          patient_id, assessment_type, risk_level, probability, factors,
          recommendations, next_assessment_date, assessed_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        assessment.patientId,
        assessment.assessmentType,
        assessment.riskLevel,
        assessment.probability,
        assessment.factors,
        assessment.recommendations,
        assessment.nextAssessmentDate,
        assessment.assessedBy
      ]);
    }
  }

  /**
   * Seed consent contracts
   */
  private async seedConsentContracts(): Promise<void> {
    const patients = await databaseManager.query('SELECT id FROM patients LIMIT 1');
    const users = await databaseManager.query('SELECT id FROM users WHERE role = \'admin\' LIMIT 1');

    if (patients.rows.length === 0) {
      return;
    }

    const consentContracts = [
      {
        contractId: 'CON-2025-001',
        patientId: patients.rows[0].id,
        requesterId: users.rows[0].id,
        dataTypes: ['medical_records', 'lab_results', 'prescriptions'],
        purpose: 'Medical Research on Diabetes Management',
        duration: '1 year',
        conditions: JSON.stringify({
          accessLevel: 'read_only',
          timeRestrictions: 'business_hours_only',
          purposeRestrictions: ['research', 'publication']
        }),
        status: 'approved',
        approvedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        smartContractRules: JSON.stringify({
          autoExpire: true,
          autoRevoke: {
            onSuspiciousActivity: true,
            onDataBreach: true,
            onPolicyViolation: true
          },
          auditLogging: true,
          encryptionRequired: true
        })
      }
    ];

    for (const contract of consentContracts) {
      await databaseManager.query(`
        INSERT INTO consent_contracts (
          contract_id, patient_id, requester_id, data_types, purpose,
          duration, conditions, status, approved_at, expires_at, smart_contract_rules
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (contract_id) DO NOTHING
      `, [
        contract.contractId,
        contract.patientId,
        contract.requesterId,
        contract.dataTypes,
        contract.purpose,
        contract.duration,
        contract.conditions,
        contract.status,
        contract.approvedAt,
        contract.expiresAt,
        contract.smartContractRules
      ]);
    }
  }
}

// Run seeding if called directly
if (require.main === module) {
  const seeder = DatabaseSeeder.getInstance();
  seeder.seed()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database seeding failed:', error);
      process.exit(1);
    });
}

export default DatabaseSeeder;
