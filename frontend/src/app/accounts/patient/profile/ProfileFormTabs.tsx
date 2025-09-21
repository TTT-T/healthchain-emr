"use client";

import React from 'react';
import { 
  User, 
  Phone, 
  MapPin, 
  Heart, 
  Activity, 
  Briefcase, 
  GraduationCap, 
  Calendar,
  Shield,
  Trash2
} from 'lucide-react';

interface FormFieldProps {
  label: string;
  value: any;
  onChange: (value: any) => void;
  type?: 'text' | 'email' | 'tel' | 'date' | 'select' | 'textarea' | 'number';
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  min?: string;
  max?: string;
  onDelete?: () => void;
  deletable?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  options,
  required = false,
  disabled = false,
  placeholder,
  min,
  max,
  onDelete,
  deletable = false
}) => {
  const renderInput = () => {
    switch (type) {
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 transition-colors"
          >
            <option value="">เลือก{label}</option>
            {options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={placeholder}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 resize-vertical"
          />
        );
      default:
        return (
          <input
            type={type}
            value={value || ''}
            onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || null : e.target.value)}
            disabled={disabled}
            placeholder={placeholder}
            min={min}
            max={max}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 transition-colors"
          />
        );
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {deletable && onDelete && value && (
          <button
            type="button"
            onClick={onDelete}
            className="text-red-500 hover:text-red-700 p-1"
            title={`ลบ${label}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      {renderInput()}
    </div>
  );
};

interface ProfileFormTabsProps {
  activeTab: string;
  data: any;
  onChange: (field: string, value: any) => void;
  onDeleteField?: (fieldName: string) => void;
  isEditing: boolean;
}

export const ProfileFormTabs: React.FC<ProfileFormTabsProps> = ({
  activeTab,
  data,
  onChange,
  onDeleteField,
  isEditing
}) => {
  const bloodTypeOptions = [
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' }
  ];

  const genderOptions = [
    { value: 'male', label: 'ชาย' },
    { value: 'female', label: 'หญิง' },
    { value: 'other', label: 'อื่นๆ' }
  ];

  const maritalStatusOptions = [
    { value: 'single', label: 'โสด' },
    { value: 'married', label: 'แต่งงาน' },
    { value: 'divorced', label: 'หย่าร้าง' },
    { value: 'widowed', label: 'ม่าย' }
  ];

  const relationshipOptions = [
    { value: 'spouse', label: 'คู่สมรส' },
    { value: 'parent', label: 'บิดา/มารดา' },
    { value: 'child', label: 'บุตร' },
    { value: 'sibling', label: 'พี่น้อง' },
    { value: 'relative', label: 'ญาติ' },
    { value: 'friend', label: 'เพื่อน' },
    { value: 'other', label: 'อื่นๆ' }
  ];

  if (activeTab === 'personal') {
    return (
      <div className="space-y-6">
        {/* Names Section */}
        <div className="bg-slate-50 p-4 rounded-lg">
          <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
            <User className="h-5 w-5 mr-2" />
            ข้อมูลชื่อ-นามสกุล
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Thai Names */}
            <div className="space-y-3">
              <h5 className="text-sm font-medium text-gray-700">ชื่อภาษาไทย</h5>
              <FormField
                label="ชื่อ (ไทย)"
                value={data.thaiName}
                onChange={(value) => onChange('thaiName', value)}
                disabled={!isEditing}
                placeholder="ชื่อ"
              />
              <FormField
                label="นามสกุล (ไทย)"
                value={data.thaiLastName}
                onChange={(value) => onChange('thaiLastName', value)}
                disabled={!isEditing}
                placeholder="นามสกุล"
              />
            </div>

            {/* English Names */}
            <div className="space-y-3">
              <h5 className="text-sm font-medium text-gray-700">ชื่อภาษาอังกฤษ</h5>
              <FormField
                label="ชื่อ (อังกฤษ)"
                value={data.englishFirstName || data.firstName}
                onChange={(value) => onChange('englishFirstName', value)}
                disabled={!isEditing}
                placeholder="First Name"
              />
              <FormField
                label="นามสกุล (อังกฤษ)"
                value={data.englishLastName || data.lastName}
                onChange={(value) => onChange('englishLastName', value)}
                disabled={!isEditing}
                placeholder="Last Name"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="อีเมล"
            value={data.email}
            onChange={(value) => onChange('email', value)}
            type="email"
            required
            disabled={!isEditing}
          />
          <FormField
            label="เบอร์โทรศัพท์"
            value={data.phone}
            onChange={(value) => onChange('phone', value)}
            type="tel"
            disabled={!isEditing}
            placeholder="0xxxxxxxxx"
          />
        </div>

        <FormField
          label="เลขบัตรประชาชน"
          value={data.nationalId}
          onChange={(value) => onChange('nationalId', value)}
          disabled={!isEditing}
          placeholder="1234567890123"
          deletable
          onDelete={onDeleteField ? () => onDeleteField('national_id') : undefined}
        />

        {/* Birth Date as separate fields */}
        <div className="bg-slate-50 p-4 rounded-lg">
          <h5 className="text-sm font-medium text-gray-700 mb-3">วันเกิด</h5>
          
          {/* Display formatted birth date */}
          {data.birthDay && data.birthMonth && data.birthYear && 
           !(data.birthDay === 1 && data.birthMonth === 1 && data.birthYear === 2533) && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 text-blue-800">
                <Calendar size={16} />
                <span className="font-medium">
                  {(() => {
                    const dayNum = data.birthDay;
                    const monthNum = data.birthMonth;
                    const yearNum = data.birthYear;
                    
                    const monthNames = [
                      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
                    ];
                    
                    // data.birthYear is already in Buddhist Era (พ.ศ.)
                    return `${dayNum} ${monthNames[monthNum - 1]} ${yearNum}`;
                  })()}
                </span>
                {(() => {
                  // Convert Buddhist Era to Christian Era for age calculation
                  const christianYear = data.birthYear - 543;
                  const birthDate = new Date(christianYear, data.birthMonth - 1, data.birthDay);
                  const today = new Date();
                  const age = today.getFullYear() - birthDate.getFullYear();
                  const monthDiff = today.getMonth() - birthDate.getMonth();
                  const adjustedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
                  return (
                    <span className="text-blue-600">
                      (อายุ {adjustedAge} ปี)
                    </span>
                  );
                })()}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-3 gap-3">
            <FormField
              label="วัน"
              value={data.birthDay}
              onChange={(value) => onChange('birthDay', parseInt(value) || null)}
              type="number"
              disabled={!isEditing}
              placeholder="15"
              min="1"
              max="31"
            />
            <FormField
              label="เดือน"
              value={data.birthMonth}
              onChange={(value) => onChange('birthMonth', parseInt(value) || null)}
              type="select"
              disabled={!isEditing}
              options={[
                { value: '1', label: 'มกราคม' },
                { value: '2', label: 'กุมภาพันธ์' },
                { value: '3', label: 'มีนาคม' },
                { value: '4', label: 'เมษายน' },
                { value: '5', label: 'พฤษภาคม' },
                { value: '6', label: 'มิถุนายน' },
                { value: '7', label: 'กรกฎาคม' },
                { value: '8', label: 'สิงหาคม' },
                { value: '9', label: 'กันยายน' },
                { value: '10', label: 'ตุลาคม' },
                { value: '11', label: 'พฤศจิกายน' },
                { value: '12', label: 'ธันวาคม' }
              ]}
            />
            <FormField
              label="ปี (พ.ศ.)"
              value={data.birthYear || ''}
              onChange={(value) => onChange('birthYear', parseInt(value) || null)}
              type="number"
              disabled={!isEditing}
              placeholder="2543"
              min="2400"
              max="2700"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="เพศ"
            value={data.gender}
            onChange={(value) => onChange('gender', value)}
            type="select"
            options={genderOptions}
            disabled={!isEditing}
          />
          <FormField
            label="หมู่เลือด"
            value={data.bloodType}
            onChange={(value) => onChange('bloodType', value)}
            type="select"
            options={bloodTypeOptions}
            disabled={!isEditing}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="น้ำหนัก (กก.)"
            value={data.weight}
            onChange={(value) => onChange('weight', value)}
            type="number"
            disabled={!isEditing}
            placeholder="65.5"
          />
          <FormField
            label="ส่วนสูง (ซม.)"
            value={data.height}
            onChange={(value) => onChange('height', value)}
            type="number"
            disabled={!isEditing}
            placeholder="170"
          />
        </div>

        {data.bmi && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Activity className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-900">
                ดัชนีมวลกาย (BMI): {data.bmi}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'contact') {
    return (
      <div className="space-y-6">
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            ที่อยู่
          </h4>
          <div className="space-y-4">
            <FormField
              label="ที่อยู่ปัจจุบัน"
              value={data.address}
              onChange={(value) => onChange('address', value)}
              type="textarea"
              disabled={!isEditing}
              placeholder="บ้านเลขที่ ถนน ตำบล อำเภอ จังหวัด"
            />
            
            <FormField
              label="ที่อยู่ตามบัตรประชาชน"
              value={data.idCardAddress}
              onChange={(value) => onChange('idCardAddress', value)}
              type="textarea"
              disabled={!isEditing}
              placeholder="ที่อยู่ตามบัตรประชาชน"
              deletable
              onDelete={onDeleteField ? () => onDeleteField('id_card_address') : undefined}
            />
          </div>
        </div>

        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
            <Phone className="h-5 w-5 mr-2" />
            ผู้ติดต่อฉุกเฉิน
          </h4>
          <div className="space-y-4">
            <FormField
              label="ชื่อผู้ติดต่อฉุกเฉิน"
              value={data.emergencyContactName}
              onChange={(value) => onChange('emergencyContactName', value)}
              disabled={!isEditing}
              placeholder="ชื่อ-นามสกุล"
              deletable
              onDelete={onDeleteField ? () => onDeleteField('emergency_contact_name') : undefined}
            />
            
            <FormField
              label="เบอร์โทรศัพท์ผู้ติดต่อฉุกเฉิน"
              value={data.emergencyContactPhone}
              onChange={(value) => onChange('emergencyContactPhone', value)}
              type="tel"
              disabled={!isEditing}
              placeholder="0xxxxxxxxx"
              deletable
              onDelete={onDeleteField ? () => onDeleteField('emergency_contact_phone') : undefined}
            />
            
            <FormField
              label="ความสัมพันธ์"
              value={data.emergencyContactRelation}
              onChange={(value) => onChange('emergencyContactRelation', value)}
              type="select"
              options={relationshipOptions}
              disabled={!isEditing}
              deletable
              onDelete={onDeleteField ? () => onDeleteField('emergency_contact_relation') : undefined}
            />
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'medical') {
    return (
      <div className="space-y-6">
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
            <Heart className="h-5 w-5 mr-2" />
            ข้อมูลการแพ้
          </h4>
          <div className="space-y-4">
            <FormField
              label="การแพ้ยา"
              value={data.drugAllergies}
              onChange={(value) => onChange('drugAllergies', value)}
              type="textarea"
              disabled={!isEditing}
              placeholder="ระบุยาที่แพ้"
              deletable
              onDelete={onDeleteField ? () => onDeleteField('drug_allergies') : undefined}
            />
            
            <FormField
              label="การแพ้อาหาร"
              value={data.foodAllergies}
              onChange={(value) => onChange('foodAllergies', value)}
              type="textarea"
              disabled={!isEditing}
              placeholder="ระบุอาหารที่แพ้"
              deletable
              onDelete={onDeleteField ? () => onDeleteField('food_allergies') : undefined}
            />
            
            <FormField
              label="การแพ้สิ่งแวดล้อม"
              value={data.environmentAllergies}
              onChange={(value) => onChange('environmentAllergies', value)}
              type="textarea"
              disabled={!isEditing}
              placeholder="ระบุสิ่งแวดล้อมที่แพ้ เช่น ฝุ่น ขนสัตว์"
              deletable
              onDelete={onDeleteField ? () => onDeleteField('environment_allergies') : undefined}
            />
          </div>
        </div>

        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-4">ประวัติการรักษา</h4>
          <div className="space-y-4">
            <FormField
              label="ประวัติการเจ็บป่วย"
              value={data.medicalHistory}
              onChange={(value) => onChange('medicalHistory', value)}
              type="textarea"
              disabled={!isEditing}
              placeholder="ประวัติการเจ็บป่วยในอดีต"
              deletable
              onDelete={onDeleteField ? () => onDeleteField('medical_history') : undefined}
            />
            
            <FormField
              label="โรคประจำตัว"
              value={data.chronicDiseases}
              onChange={(value) => onChange('chronicDiseases', value)}
              type="textarea"
              disabled={!isEditing}
              placeholder="โรคประจำตัว เช่น เบาหวาน ความดันโลหิตสูง"
              deletable
              onDelete={onDeleteField ? () => onDeleteField('chronic_diseases') : undefined}
            />
            
            <FormField
              label="ยาที่ใช้ประจำ"
              value={data.currentMedications}
              onChange={(value) => onChange('currentMedications', value)}
              type="textarea"
              disabled={!isEditing}
              placeholder="ยาที่ใช้ประจำ"
              deletable
              onDelete={onDeleteField ? () => onDeleteField('current_medications') : undefined}
            />
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'additional') {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="อาชีพ"
            value={data.occupation}
            onChange={(value) => onChange('occupation', value)}
            disabled={!isEditing}
            placeholder="อาชีพปัจจุบัน"
            deletable
            onDelete={onDeleteField ? () => onDeleteField('occupation') : undefined}
          />
          <FormField
            label="การศึกษา"
            value={data.education}
            onChange={(value) => onChange('education', value)}
            disabled={!isEditing}
            placeholder="ระดับการศึกษาสูงสุด"
            deletable
            onDelete={onDeleteField ? () => onDeleteField('education') : undefined}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            label="สถานภาพสมรส"
            value={data.maritalStatus}
            onChange={(value) => onChange('maritalStatus', value)}
            type="select"
            options={maritalStatusOptions}
            disabled={!isEditing}
            deletable
            onDelete={onDeleteField ? () => onDeleteField('marital_status') : undefined}
          />
          <FormField
            label="ศาสนา"
            value={data.religion}
            onChange={(value) => onChange('religion', value)}
            disabled={!isEditing}
            placeholder="ศาสนา"
            deletable
            onDelete={onDeleteField ? () => onDeleteField('religion') : undefined}
          />
          <FormField
            label="เชื้อชาติ"
            value={data.race}
            onChange={(value) => onChange('race', value)}
            disabled={!isEditing}
            placeholder="เชื้อชาติ"
            deletable
            onDelete={onDeleteField ? () => onDeleteField('race') : undefined}
          />
        </div>
      </div>
    );
  }

  if (activeTab === 'insurance') {
    return (
      <div className="space-y-6">
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            ข้อมูลประกันสุขภาพ
          </h4>
          <div className="space-y-4">
            <FormField
              label="ประเภทประกัน"
              value={data.insuranceType}
              onChange={(value) => onChange('insuranceType', value)}
              disabled={!isEditing}
              placeholder="เช่น ประกันสังคม, ประกันสุขภาพถ้วนหน้า"
              deletable
              onDelete={onDeleteField ? () => onDeleteField('insurance_type') : undefined}
            />
            
            <FormField
              label="หมายเลขประกัน"
              value={data.insuranceNumber}
              onChange={(value) => onChange('insuranceNumber', value)}
              disabled={!isEditing}
              placeholder="หมายเลขประกัน"
              deletable
              onDelete={onDeleteField ? () => onDeleteField('insurance_number') : undefined}
            />
            
            {/* Insurance Expiry Date as separate fields */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <h5 className="text-sm font-medium text-gray-700 mb-3">วันหมดอายุประกัน</h5>
              
              {/* Display formatted insurance expiry date */}
              {data.insuranceExpiryDay && data.insuranceExpiryMonth && data.insuranceExpiryYear && 
               !(data.insuranceExpiryDay === 1 && data.insuranceExpiryMonth === 1 && data.insuranceExpiryYear === 2533) && (
                <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 text-green-800">
                    <Calendar size={16} />
                    <span className="font-medium">
                      {(() => {
                        const dayNum = data.insuranceExpiryDay;
                        const monthNum = data.insuranceExpiryMonth;
                        const yearNum = data.insuranceExpiryYear;
                        
                        const monthNames = [
                          'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                          'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
                        ];
                        
                        // data.insuranceExpiryYear is already in Buddhist Era (พ.ศ.)
                        return `${dayNum} ${monthNames[monthNum - 1]} ${yearNum}`;
                      })()}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-3 gap-3">
                <FormField
                  label="วัน"
                  value={data.insuranceExpiryDay}
                  onChange={(value) => onChange('insuranceExpiryDay', parseInt(value) || null)}
                  type="number"
                  disabled={!isEditing}
                  placeholder="15"
                  min="1"
                  max="31"
                />
                <FormField
                  label="เดือน"
                  value={data.insuranceExpiryMonth}
                  onChange={(value) => onChange('insuranceExpiryMonth', parseInt(value) || null)}
                  type="select"
                  disabled={!isEditing}
                  options={[
                    { value: '1', label: 'มกราคม' },
                    { value: '2', label: 'กุมภาพันธ์' },
                    { value: '3', label: 'มีนาคม' },
                    { value: '4', label: 'เมษายน' },
                    { value: '5', label: 'พฤษภาคม' },
                    { value: '6', label: 'มิถุนายน' },
                    { value: '7', label: 'กรกฎาคม' },
                    { value: '8', label: 'สิงหาคม' },
                    { value: '9', label: 'กันยายน' },
                    { value: '10', label: 'ตุลาคม' },
                    { value: '11', label: 'พฤศจิกายน' },
                    { value: '12', label: 'ธันวาคม' }
                  ]}
                />
                <FormField
                  label="ปี (พ.ศ.)"
                  value={data.insuranceExpiryYear || ''}
                  onChange={(value) => onChange('insuranceExpiryYear', parseInt(value) || null)}
                  type="number"
                  disabled={!isEditing}
                  placeholder="2570"
                  min="2400"
                  max="2700"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-8 text-gray-500">
      เลือกแท็บเพื่อแสดงข้อมูล
    </div>
  );
};
