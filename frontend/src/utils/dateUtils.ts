/**
 * Date Utilities for Thailand Timezone
 * ฟังก์ชันสำหรับจัดการวันที่และเวลาในประเทศไทย
 */

/**
 * Get current Thailand time
 * ดึงเวลาปัจจุบันของประเทศไทย
 */
export const getThailandTime = (): Date => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
};

/**
 * Format date to Thailand locale string
 * แปลงวันที่เป็นรูปแบบภาษาไทย
 */
export const formatThailandDate = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };
  
  return dateObj.toLocaleString('th-TH', defaultOptions);
};

/**
 * Format date to Thailand date only (no time)
 * แปลงวันที่เป็นรูปแบบภาษาไทย (เฉพาะวันที่)
 */
export const formatThailandDateOnly = (date: Date | string): string => {
  return formatThailandDate(date, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format date to Thailand time only (no date)
 * แปลงวันที่เป็นรูปแบบภาษาไทย (เฉพาะเวลา)
 */
export const formatThailandTimeOnly = (date: Date | string): string => {
  return formatThailandDate(date, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

/**
 * Format date to Thailand short format
 * แปลงวันที่เป็นรูปแบบสั้นภาษาไทย
 */
export const formatThailandShort = (date: Date | string): string => {
  return formatThailandDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format date to Thailand long format
 * แปลงวันที่เป็นรูปแบบยาวภาษาไทย
 */
export const formatThailandLong = (date: Date | string): string => {
  return formatThailandDate(date, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

/**
 * Get relative time in Thai
 * ดึงเวลาสัมพัทธ์เป็นภาษาไทย
 */
export const getRelativeTimeThai = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = getThailandTime();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'เมื่อสักครู่';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} นาทีที่แล้ว`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ชั่วโมงที่แล้ว`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} วันที่แล้ว`;
  } else if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} เดือนที่แล้ว`;
  } else {
    const years = Math.floor(diffInSeconds / 31536000);
    return `${years} ปีที่แล้ว`;
  }
};

/**
 * Check if date is today in Thailand timezone
 * ตรวจสอบว่าเป็นวันนี้หรือไม่ในเขตเวลาประเทศไทย
 */
export const isToday = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = getThailandTime();
  
  return dateObj.toDateString() === today.toDateString();
};

/**
 * Check if date is yesterday in Thailand timezone
 * ตรวจสอบว่าเป็นเมื่อวานหรือไม่ในเขตเวลาประเทศไทย
 */
export const isYesterday = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const yesterday = new Date(getThailandTime());
  yesterday.setDate(yesterday.getDate() - 1);
  
  return dateObj.toDateString() === yesterday.toDateString();
};

/**
 * Get Thailand timezone offset
 * ดึงค่า offset ของเขตเวลาประเทศไทย
 */
export const getThailandTimezoneOffset = (): number => {
  const now = new Date();
  const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
  const thailand = new Date(utc.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  
  return (thailand.getTime() - utc.getTime()) / (1000 * 60 * 60);
};

/**
 * Convert UTC date to Thailand timezone
 * แปลงวันที่ UTC เป็นเขตเวลาประเทศไทย
 */
export const convertUTCToThailand = (utcDate: Date | string): Date => {
  const dateObj = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  return new Date(dateObj.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
};

/**
 * Convert Thailand date to UTC
 * แปลงวันที่ประเทศไทยเป็น UTC
 */
export const convertThailandToUTC = (thailandDate: Date | string): Date => {
  const dateObj = typeof thailandDate === 'string' ? new Date(thailandDate) : thailandDate;
  const utc = new Date(dateObj.getTime() - (7 * 60 * 60 * 1000)); // Thailand is UTC+7
  return utc;
};

/**
 * Get current Thailand date string
 * ดึงวันที่ปัจจุบันของประเทศไทยเป็น string
 */
export const getCurrentThailandDateString = (): string => {
  return getThailandTime().toISOString();
};

/**
 * Format date for API requests (ISO string with Thailand timezone)
 * แปลงวันที่สำหรับการส่ง API (ISO string พร้อมเขตเวลาประเทศไทย)
 */
export const formatDateForAPI = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('sv-SE', { timeZone: 'Asia/Bangkok' });
};

/**
 * Parse date from API response (assuming Thailand timezone)
 * แปลงวันที่จาก API response (สมมติว่าเป็นเขตเวลาประเทศไทย)
 */
export const parseDateFromAPI = (dateString: string): Date => {
  return new Date(dateString + '+07:00'); // Add Thailand timezone offset
};
