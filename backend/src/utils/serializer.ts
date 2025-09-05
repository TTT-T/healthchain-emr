/**
 * Database Serializer/Transformer
 * Handles conversion between snake_case (database) and camelCase (code)
 */

export class DatabaseSerializer {
  /**
   * Convert snake_case to camelCase
   */
  static toCamelCase(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.toCamelCase(item));
    }
    
    if (typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        result[camelKey] = this.toCamelCase(value);
      }
      return result;
    }
    
    return obj;
  }

  /**
   * Convert camelCase to snake_case
   */
  static toSnakeCase(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.toSnakeCase(item));
    }
    
    if (typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        result[snakeKey] = this.toSnakeCase(value);
      }
      return result;
    }
    
    return obj;
  }

  /**
   * Convert database result to API response format
   */
  static toApiResponse<T>(data: T, meta?: any): {
    data: T | null;
    meta: any;
    error: null;
    statusCode: number;
  } {
    return {
      data: data ? this.toCamelCase(data) : null,
      meta: meta || null,
      error: null,
      statusCode: 200
    };
  }

  /**
   * Convert error to API error format
   */
  static toApiError(error: any, statusCode: number = 500): {
    data: null;
    meta: null;
    error: {
      code: string;
      message: string;
      details?: any;
    };
    statusCode: number;
  } {
    return {
      data: null,
      meta: null,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Internal Server Error',
        details: error.details || null
      },
      statusCode
    };
  }
}

/**
 * Field mapping for specific transformations
 */
export const FieldMappings = {
  // Patient field mappings
  patient: {
    hospital_number: 'hospitalNumber',
    first_name: 'firstName',
    last_name: 'lastName',
    thai_name: 'thaiName',
    date_of_birth: 'dateOfBirth',
    blood_type: 'bloodType',
    emergency_contact_name: 'emergencyContactName',
    emergency_contact_phone: 'emergencyContactPhone',
    emergency_contact_relation: 'emergencyContactRelation',
    insurance_type: 'insuranceType',
    insurance_number: 'insuranceNumber',
    insurance_expiry_date: 'insuranceExpiryDate',
    medical_history: 'medicalHistory',
    current_medications: 'currentMedications',
    is_active: 'isActive',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
    created_by: 'createdBy',
    updated_by: 'updatedBy'
  },
  
  // Visit field mappings
  visit: {
    visit_number: 'visitNumber',
    visit_date: 'visitDate',
    visit_time: 'visitTime',
    visit_type: 'visitType',
    chief_complaint: 'chiefComplaint',
    present_illness: 'presentIllness',
    physical_examination: 'physicalExamination',
    treatment_plan: 'treatmentPlan',
    doctor_notes: 'doctorNotes',
    attending_doctor_id: 'attendingDoctorId',
    assigned_nurse_id: 'assignedNurseId',
    department_id: 'departmentId',
    follow_up_required: 'followUpRequired',
    follow_up_date: 'followUpDate',
    follow_up_notes: 'followUpNotes',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
    created_by: 'createdBy',
    updated_by: 'updatedBy'
  }
};

/**
 * Specific field transformers for complex cases
 */
export class FieldTransformer {
  /**
   * Transform patient data
   */
  static transformPatient(patient: any): any {
    if (!patient) return patient;
    
    const transformed = { ...patient };
    
    // Handle specific field transformations
    if (transformed.hospital_number) {
      transformed.hospitalNumber = transformed.hospital_number;
      delete transformed.hospital_number;
    }
    
    if (transformed.first_name) {
      transformed.firstName = transformed.first_name;
      delete transformed.first_name;
    }
    
    if (transformed.last_name) {
      transformed.lastName = transformed.last_name;
      delete transformed.last_name;
    }
    
    // Apply general camelCase transformation
    return DatabaseSerializer.toCamelCase(transformed);
  }

  /**
   * Transform visit data
   */
  static transformVisit(visit: any): any {
    if (!visit) return visit;
    
    const transformed = { ...visit };
    
    // Handle specific field transformations
    if (transformed.visit_number) {
      transformed.visitNumber = transformed.visit_number;
      delete transformed.visit_number;
    }
    
    if (transformed.visit_date) {
      transformed.visitDate = transformed.visit_date;
      delete transformed.visit_date;
    }
    
    if (transformed.visit_time) {
      transformed.visitTime = transformed.visit_time;
      delete transformed.visit_time;
    }
    
    // Apply general camelCase transformation
    return DatabaseSerializer.toCamelCase(transformed);
  }

  /**
   * Transform request data to database format
   */
  static transformRequestToDb(data: any, type: 'patient' | 'visit'): any {
    if (!data) return data;
    
    const transformed = { ...data };
    
    // Handle specific field transformations based on type
    if (type === 'patient') {
      if (transformed.hospitalNumber) {
        transformed.hospital_number = transformed.hospitalNumber;
        delete transformed.hospitalNumber;
      }
      
      if (transformed.firstName) {
        transformed.first_name = transformed.firstName;
        delete transformed.firstName;
      }
      
      if (transformed.lastName) {
        transformed.last_name = transformed.lastName;
        delete transformed.lastName;
      }
    }
    
    if (type === 'visit') {
      if (transformed.visitNumber) {
        transformed.visit_number = transformed.visitNumber;
        delete transformed.visitNumber;
      }
      
      if (transformed.visitDate) {
        transformed.visit_date = transformed.visitDate;
        delete transformed.visitDate;
      }
      
      if (transformed.visitTime) {
        transformed.visit_time = transformed.visitTime;
        delete transformed.visitTime;
      }
    }
    
    // Apply general snake_case transformation
    return DatabaseSerializer.toSnakeCase(transformed);
  }
}
