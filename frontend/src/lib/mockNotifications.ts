// Mock notifications for testing notification counter

export const mockNotifications = [
  {
    id: "1",
    patient_id: "c55259d7-6f83-4d5f-8155-69cd90233f40",
    title: "การนัดหมายใหม่",
    message: "คุณมีการนัดหมายกับแพทย์ในวันพรุ่งนี้ เวลา 14:00 น.",
    type: "appointment",
    priority: "high",
    read_status: false,
    isRead: false,
    actionRequired: true,
    created_at: "2025-01-07T10:30:00Z",
    updated_at: "2025-01-07T10:30:00Z"
  },
  {
    id: "2",
    patient_id: "c55259d7-6f83-4d5f-8155-69cd90233f40",
    title: "ผลตรวจเลือดพร้อมแล้ว",
    message: "ผลการตรวจเลือดของคุณพร้อมแล้ว กรุณาเข้าดูในระบบ",
    type: "lab_result",
    priority: "medium",
    read_status: false,
    isRead: false,
    actionRequired: false,
    created_at: "2025-01-06T15:45:00Z",
    updated_at: "2025-01-06T15:45:00Z"
  },
  {
    id: "3",
    patient_id: "c55259d7-6f83-4d5f-8155-69cd90233f40",
    title: "แจ้งเตือนการรับประทานยา",
    message: "ถึงเวลารับประทานยา Metformin 500mg แล้ว",
    type: "medication",
    priority: "high",
    read_status: false,
    isRead: false,
    actionRequired: true,
    created_at: "2025-01-07T08:00:00Z",
    updated_at: "2025-01-07T08:00:00Z"
  },
  {
    id: "4",
    patient_id: "c55259d7-6f83-4d5f-8155-69cd90233f40",
    title: "การอัพเดทระบบ",
    message: "ระบบจะมีการปรับปรุงในวันอาทิตย์ เวลา 02:00-04:00 น.",
    type: "system",
    priority: "low",
    read_status: true,
    isRead: true,
    actionRequired: false,
    created_at: "2025-01-05T12:00:00Z",
    updated_at: "2025-01-06T09:30:00Z"
  },
  {
    id: "5",
    patient_id: "c55259d7-6f83-4d5f-8155-69cd90233f40",
    title: "การตรวจสุขภาพประจำปี",
    message: "ได้เวลาการตรวจสุขภาพประจำปีแล้ว กรุณานัดหมายล่วงหน้า",
    type: "reminder",
    priority: "medium",
    read_status: false,
    isRead: false,
    actionRequired: true,
    created_at: "2025-01-07T07:00:00Z",
    updated_at: "2025-01-07T07:00:00Z"
  }
];

export const getUnreadNotificationCount = (notifications: any[]) => {
  return notifications.filter(notif => !notif.read_status && !notif.isRead && !notif.read_at).length;
};
