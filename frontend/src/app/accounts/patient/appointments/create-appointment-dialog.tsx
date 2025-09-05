'use client';

import { useState, useEffect } from 'react';
import { format, startOfDay } from 'date-fns';
import { th } from 'date-fns/locale';
import { DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AppointmentService } from '@/services/appointmentService';
import type { AppointmentType, Doctor, TimeSlot } from '@/types/appointment';

interface CreateAppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateAppointmentDialog({
  isOpen,
  onClose,
  onSuccess,
}: CreateAppointmentDialogProps) {
  const [step, setStep] = useState(1);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedType, setSelectedType] = useState<AppointmentType | undefined>();
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | undefined>();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | undefined>();
  const [reason, setReason] = useState('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset เมื่อปิด dialog
  const handleClose = () => {
    setStep(1);
    setSelectedDate(undefined);
    setSelectedType(undefined);
    setSelectedDoctor(undefined);
    setSelectedTimeSlot(undefined);
    setReason('');
    setAvailableTimeSlots([]);
    setError(null);
    onClose();
  };

  // โหลดชนิดนัดหมายและรายชื่อแพทย์เมื่อเปิด dialog
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      try {
        const [typesResponse, doctorsResponse] = await Promise.all([
          AppointmentService.getAppointmentTypes(),
          AppointmentService.getDoctors(),
        ]);

        if (!typesResponse.success) throw new Error(typesResponse.message);
        if (!doctorsResponse.success) throw new Error(doctorsResponse.message);

        if (!cancelled) {
          setAppointmentTypes(typesResponse.data || []);
          setDoctors(doctorsResponse.data || []);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // โหลด time slots เมื่อมี date/doctor/type ครบ
  useEffect(() => {
    if (!selectedDate || !selectedDoctor || !selectedType) {
      setAvailableTimeSlots([]);
      setSelectedTimeSlot(undefined);
      return;
    }
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      try {
        const response = await AppointmentService.getAvailableTimeSlots({
          doctorId: selectedDoctor.id,
          date: format(selectedDate, 'yyyy-MM-dd'),
          typeId: selectedType.id,
        });

        if (!response.success) throw new Error(response.message);

        if (!cancelled) {
          const slots = response.data || [];
          setAvailableTimeSlots(slots);
          setError(slots.length === 0 ? 'ไม่มีช่วงเวลาว่างในวันที่เลือก' : null);
          setSelectedTimeSlot(undefined);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'ไม่สามารถโหลดช่วงเวลาว่างได้ กรุณาลองใหม่อีกครั้ง');
          setAvailableTimeSlots([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedDate, selectedDoctor, selectedType]);

  // สร้างนัดหมาย
  const handleCreate = async () => {
    if (!selectedTimeSlot || !selectedDoctor || !selectedType || !reason.trim()) return;

    try {
      setIsLoading(true);
      const response = await AppointmentService.createAppointment({
        doctorId: selectedDoctor.id.toString(),
        appointmentTypeId: selectedType.id.toString(),
        startTime: selectedTimeSlot.startTime,
        endTime: selectedTimeSlot.endTime,
        reasonForVisit: reason.trim(),
      });

      if (!response.success) throw new Error(response.message);

      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error creating appointment:', error);
      setError('เกิดข้อผิดพลาดระหว่างสร้างนัดหมาย');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
      {/* card */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">นัดหมายใหม่</h2>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center p-4">
            <LoadingSpinner />
          </div>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">เลือกประเภทการนัดหมาย</label>
              <Select
                value={selectedType?.id?.toString()}
                onValueChange={(value) => {
                  const type = appointmentTypes.find((t) => t.id === parseInt(value));
                  setSelectedType(type);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกประเภทการนัดหมาย" />
                </SelectTrigger>
                <SelectContent>
                  {appointmentTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name} ({type.durationMinutes} นาที)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">เลือกแพทย์</label>
              <Select
                value={selectedDoctor?.id?.toString()}
                onValueChange={(value) => {
                  const doctor = doctors.find((d) => d.id === parseInt(value));
                  setSelectedDoctor(doctor);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกแพทย์" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id.toString()}>
                      {doctor.firstName} {doctor.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full" onClick={() => setStep(2)} disabled={!selectedType || !selectedDoctor}>
              ถัดไป
            </Button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">เลือกวันที่</label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                }}
                locale={th}
                className="rounded-md border"
                disabled={(date) => startOfDay(date) < startOfDay(new Date())}
              />
            </div>

            {selectedDate && availableTimeSlots.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">เลือกเวลา</label>
                <div className="grid grid-cols-3 gap-2">
                  {availableTimeSlots.map((slot, index) => {
                    const label = format(new Date(slot.startTime), 'HH:mm');
                    const isActive =
                      selectedTimeSlot?.startTime === slot.startTime &&
                      selectedTimeSlot?.endTime === slot.endTime;
                    return (
                      <Button
                        key={`${slot.startTime}-${index}`}
                        variant={isActive ? 'default' : 'outline'}
                        onClick={() => setSelectedTimeSlot(slot)}
                        className="text-sm"
                      >
                        {label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">เหตุผลการนัดหมาย</label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="กรุณาระบุเหตุผลการนัดหมาย"
                rows={3}
              />
            </div>

            <div className="flex justify-between gap-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                ย้อนกลับ
              </Button>
              <Button onClick={handleCreate} disabled={!selectedTimeSlot || !reason.trim() || isLoading}>
                {isLoading ? 'กำลังบันทึก...' : 'บันทึกนัดหมาย'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
