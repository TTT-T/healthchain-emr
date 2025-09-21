/**
 * Thailand Time Utilities for Backend
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
 * Get current time string in Thailand format
 */
export function getCurrentThailandTimeString(): string {
  return formatThailandDateTime(getThailandTime());
}

/**
 * Get current date string in Thailand format (YYYY-MM-DD)
 */
export function getCurrentThailandDateString(): string {
  const thaiDate = getThailandTime();
  const year = thaiDate.getFullYear();
  const month = String(thaiDate.getMonth() + 1).padStart(2, '0');
  const day = String(thaiDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get current time string in Thailand format (HH:MM:SS)
 */
export function getCurrentThailandTimeOnlyString(): string {
  return formatThailandTime(getThailandTime());
}
