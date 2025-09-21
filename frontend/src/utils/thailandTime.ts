/**
 * Thailand Time Utilities
 * จัดการเวลาในประเทศไทย (UTC+7)
 */

// Thailand timezone offset (UTC+7)
export const THAILAND_TIMEZONE_OFFSET = 7 * 60; // 7 hours in minutes

/**
 * Get current time in Thailand
 */
export function getThailandTime(): Date {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const thailandTime = new Date(utc + (THAILAND_TIMEZONE_OFFSET * 60000));
  return thailandTime;
}

/**
 * Convert UTC time to Thailand time
 */
export function toThailandTime(utcDate: Date | string): Date {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const thailandTime = new Date(utc + (THAILAND_TIMEZONE_OFFSET * 60000));
  return thailandTime;
}

/**
 * Format date to Thailand format (DD/MM/YYYY)
 */
export function formatThailandDate(date: Date | string): string {
  const thaiDate = typeof date === 'string' ? toThailandTime(date) : date;
  const day = String(thaiDate.getDate()).padStart(2, '0');
  const month = String(thaiDate.getMonth() + 1).padStart(2, '0');
  const year = thaiDate.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format time to Thailand format (HH:MM:SS)
 */
export function formatThailandTime(date: Date | string): string {
  const thaiDate = typeof date === 'string' ? toThailandTime(date) : date;
  const hours = String(thaiDate.getHours()).padStart(2, '0');
  const minutes = String(thaiDate.getMinutes()).padStart(2, '0');
  const seconds = String(thaiDate.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Format date and time to Thailand format (DD/MM/YYYY HH:MM:SS)
 */
export function formatThailandDateTime(date: Date | string): string {
  const thaiDate = typeof date === 'string' ? toThailandTime(date) : date;
  const dateStr = formatThailandDate(thaiDate);
  const timeStr = formatThailandTime(thaiDate);
  return `${dateStr} ${timeStr}`;
}

/**
 * Format date to Buddhist calendar (DD/MM/YYYY + 543)
 */
export function formatBuddhistDate(date: Date | string): string {
  const thaiDate = typeof date === 'string' ? toThailandTime(date) : date;
  const day = String(thaiDate.getDate()).padStart(2, '0');
  const month = String(thaiDate.getMonth() + 1).padStart(2, '0');
  const buddhistYear = thaiDate.getFullYear() + 543;
  return `${day}/${month}/${buddhistYear}`;
}

/**
 * Format date and time to Buddhist calendar (DD/MM/YYYY + 543 HH:MM:SS)
 */
export function formatBuddhistDateTime(date: Date | string): string {
  const thaiDate = typeof date === 'string' ? toThailandTime(date) : date;
  const dateStr = formatBuddhistDate(thaiDate);
  const timeStr = formatThailandTime(thaiDate);
  return `${dateStr} ${timeStr}`;
}

/**
 * Create a new Date object with Thailand timezone
 */
export function createThailandDate(year: number, month: number, day: number, hours: number = 0, minutes: number = 0, seconds: number = 0): Date {
  const date = new Date();
  date.setFullYear(year, month - 1, day);
  date.setHours(hours, minutes, seconds, 0);
  
  // Convert to Thailand time
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const thailandTime = new Date(utc + (THAILAND_TIMEZONE_OFFSET * 60000));
  return thailandTime;
}

/**
 * Get current time string in Thailand format
 */
export function getCurrentThailandTimeString(): string {
  return formatThailandDateTime(getThailandTime());
}

/**
 * Parse time string and return Thailand time
 */
export function parseThailandTime(timeString: string): Date {
  const [hours, minutes, seconds] = timeString.split(':').map(Number);
  const now = getThailandTime();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, seconds || 0);
}

/**
 * Parse date string and return Thailand time
 */
export function parseThailandDate(dateString: string): Date {
  const [day, month, year] = dateString.split('/').map(Number);
  return createThailandDate(year, month, day);
}

/**
 * Parse date and time string and return Thailand time
 */
export function parseThailandDateTime(dateTimeString: string): Date {
  const [datePart, timePart] = dateTimeString.split(' ');
  const [day, month, year] = datePart.split('/').map(Number);
  const [hours, minutes, seconds] = timePart.split(':').map(Number);
  return createThailandDate(year, month, day, hours, minutes, seconds || 0);
}
