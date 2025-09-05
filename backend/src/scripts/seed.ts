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
      console.log('🌱 Starting database seeding...');

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

      console.log('✅ Database seeding completed successfully!');
      
    } catch (error) {
      console.error('❌ Database seeding failed:', error);
      throw error;
    }
  }

  /**
   * Seed users
   */
  private async seedUsers(): Promise<void> {
    console.log('👥 Seeding users...');

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

    console.log(`✅ Seeded ${users.length} users`);
  }

  /**
   * Seed patients
   */
  private async seedPatients(): Promise<void> {
    console.log('🏥 Seeding patients...');

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
        district: 'Watthana',
        province: 'Bangkok',
        postalCode: '10110',
        emergencyContactName: 'Jane Doe',
        emergencyContactPhone: '082-345-6789',
        emergencyContactRelationship: 'Wife',
        bloodType: 'O+',
        allergies: JSON.stringify(['Penicillin', 'Shellfish']),
        chronicConditions: JSON.stringify(['Hypertension']),
        currentMedications: JSON.stringify(['Amlodipine 5mg daily']),
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
        district: 'วัฒนา',
        province: 'กรุงเทพฯ',
        postalCode: '10110',
        emergencyContactName: 'นางสมใจ ใจดี',
        emergencyContactPhone: '082-345-6790',
        emergencyContactRelationship: 'ภรรยา',
        bloodType: 'A+',
        allergies: JSON.stringify([]),
        chronicConditions: JSON.stringify(['Diabetes Type 2']),
        currentMedications: JSON.stringify(['Metformin 500mg twice daily']),
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
        district: 'Bang Rak',
        province: 'Bangkok',
        postalCode: '10500',
        emergencyContactName: 'Robert Smith',
        emergencyContactPhone: '082-345-6791',
        emergencyContactRelationship: 'Husband',
        bloodType: 'B+',
        allergies: JSON.stringify(['Latex']),
        chronicConditions: JSON.stringify([]),
        currentMedications: JSON.stringify([]),
        insuranceProvider: 'Private Insurance',
        insurancePolicyNumber: 'PI-345678901'
      }
    ];

    for (const patient of patients) {
      await databaseManager.query(`
        INSERT INTO patients (
          hospital_number, national_id, first_name, last_name, thai_name,
          gender, date_of_birth, phone, email, address, district, province,
          postal_code, emergency_contact_name, emergency_contact_phone,
          emergency_contact_relationship, blood_type, allergies, chronic_conditions,
          current_medications, insurance_provider, insurance_policy_number
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
        ON CONFLICT (hospital_number) DO NOTHING
      `, [
        patient.hospitalNumber,
        patient.nationalId,
        patient.firstName,
        patient.lastName,
        patient.thaiName,
        patient.gender,
        patient.birthDate,
        patient.phone,
        patient.email,
        patient.address,
        patient.district,
        patient.province,
        patient.postalCode,
        patient.emergencyContactName,
        patient.emergencyContactPhone,
        patient.emergencyContactRelationship,
        patient.bloodType,
        patient.allergies,
        patient.chronicConditions,
        patient.currentMedications,
        patient.insuranceProvider,
        patient.insurancePolicyNumber
      ]);
    }

    console.log(`✅ Seeded ${patients.length} patients`);
  }

  /**
   * Seed departments
   */
  private async seedDepartments(): Promise<void> {
    console.log('🏢 Seeding departments...');

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

    console.log(`✅ Seeded ${departments.length} departments`);
  }

  /**
   * Seed visits
   */
  private async seedVisits(): Promise<void> {
    console.log('📋 Seeding visits...');

    // Get patient and doctor IDs
    const patients = await databaseManager.query('SELECT id FROM patients LIMIT 2');
    const doctors = await databaseManager.query('SELECT id FROM users WHERE role = \'doctor\' LIMIT 1');
    const nurses = await databaseManager.query('SELECT id FROM users WHERE role = \'nurse\' LIMIT 1');

    if (patients.rows.length === 0 || doctors.rows.length === 0) {
      console.log('⚠️ No patients or doctors found, skipping visits');
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

    console.log(`✅ Seeded ${visits.length} visits`);
  }

  /**
   * Seed vital signs
   */
  private async seedVitalSigns(): Promise<void> {
    console.log('📊 Seeding vital signs...');

    const visits = await databaseManager.query('SELECT id, patient_id FROM visits LIMIT 2');
    const nurses = await databaseManager.query('SELECT id FROM users WHERE role = \'nurse\' LIMIT 1');

    if (visits.rows.length === 0) {
      console.log('⚠️ No visits found, skipping vital signs');
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

    console.log(`✅ Seeded ${vitalSigns.length} vital signs records`);
  }

  /**
   * Seed lab orders
   */
  private async seedLabOrders(): Promise<void> {
    console.log('🧪 Seeding lab orders...');

    const visits = await databaseManager.query('SELECT id, patient_id FROM visits LIMIT 1');
    const doctors = await databaseManager.query('SELECT id FROM users WHERE role = \'doctor\' LIMIT 1');

    if (visits.rows.length === 0) {
      console.log('⚠️ No visits found, skipping lab orders');
      return;
    }

    const labOrders = [
      {
        visitId: visits.rows[0].id,
        patientId: visits.rows[0].patient_id,
        orderNumber: 'LAB-2025-001',
        testCategory: 'blood',
        testName: 'Complete Blood Count',
        testCode: 'CBC',
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
          visit_id, patient_id, order_number, test_category, test_name,
          test_code, clinical_indication, specimen_type, priority, status, ordered_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (order_number) DO NOTHING
      `, [
        order.visitId,
        order.patientId,
        order.orderNumber,
        order.testCategory,
        order.testName,
        order.testCode,
        order.clinicalIndication,
        order.specimenType,
        order.priority,
        order.status,
        order.orderedBy
      ]);
    }

    console.log(`✅ Seeded ${labOrders.length} lab orders`);
  }

  /**
   * Seed prescriptions
   */
  private async seedPrescriptions(): Promise<void> {
    console.log('💊 Seeding prescriptions...');

    const visits = await databaseManager.query('SELECT id, patient_id FROM visits LIMIT 1');
    const doctors = await databaseManager.query('SELECT id FROM users WHERE role = \'doctor\' LIMIT 1');

    if (visits.rows.length === 0) {
      console.log('⚠️ No visits found, skipping prescriptions');
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

    console.log(`✅ Seeded ${prescriptions.length} prescriptions`);
  }

  /**
   * Seed appointments
   */
  private async seedAppointments(): Promise<void> {
    console.log('📅 Seeding appointments...');

    const patients = await databaseManager.query('SELECT id FROM patients LIMIT 2');
    const doctors = await databaseManager.query('SELECT id FROM users WHERE role = \'doctor\' LIMIT 1');

    if (patients.rows.length === 0) {
      console.log('⚠️ No patients found, skipping appointments');
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

    console.log(`✅ Seeded ${appointments.length} appointments`);
  }

  /**
   * Seed risk assessments
   */
  private async seedRiskAssessments(): Promise<void> {
    console.log('🤖 Seeding risk assessments...');

    const patients = await databaseManager.query('SELECT id FROM patients LIMIT 2');
    const doctors = await databaseManager.query('SELECT id FROM users WHERE role = \'doctor\' LIMIT 1');

    if (patients.rows.length === 0) {
      console.log('⚠️ No patients found, skipping risk assessments');
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

    console.log(`✅ Seeded ${riskAssessments.length} risk assessments`);
  }

  /**
   * Seed consent contracts
   */
  private async seedConsentContracts(): Promise<void> {
    console.log('🔒 Seeding consent contracts...');

    const patients = await databaseManager.query('SELECT id FROM patients LIMIT 1');
    const users = await databaseManager.query('SELECT id FROM users WHERE role = \'admin\' LIMIT 1');

    if (patients.rows.length === 0) {
      console.log('⚠️ No patients found, skipping consent contracts');
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

    console.log(`✅ Seeded ${consentContracts.length} consent contracts`);
  }
}

// Run seeding if called directly
if (require.main === module) {
  const seeder = DatabaseSeeder.getInstance();
  seeder.seed()
    .then(() => {
      console.log('🎉 Database seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database seeding failed:', error);
      process.exit(1);
    });
}

export default DatabaseSeeder;
