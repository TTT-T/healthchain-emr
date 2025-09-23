/**
 * Thailand Time Utilities for Backend
 * จัดการเวลาในประเทศไทย (UTC+7) - Asia/Bangkok
 * All times are displayed in Thailand timezone only
 */

// Thailand timezone offset (UTC+7)
export const THAILAND_TIMEZONE_OFFSET = 7 * 60; // 7 hours in minutes
export const THAILAND_TIMEZONE = 'Asia/Bangkok';

/**
 * Get current time in Thailand
 */
export function getThailandTime(): Date {
  const now = new Date();
  // Convert to UTC first, then add Thailand timezone offset
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const thailandTime = new Date(utc + (THAILAND_TIMEZONE_OFFSET * 60000));
  return thailandTime;
}

/**
 * Get current time in Thailand using Intl API (more accurate)
 */
export function getThailandTimeIntl(): Date {
  const now = new Date();
  const thailandTimeString = now.toLocaleString('en-US', { timeZone: THAILAND_TIMEZONE });
  return new Date(thailandTimeString);
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

/**
 * Format timestamp to Thailand timezone with custom options
 */
export function formatThailandTimestamp(timestamp: string | Date, options?: {
  includeTime?: boolean;
  includeSeconds?: boolean;
  buddhistYear?: boolean;
}): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const thaiDate = toThailandTime(date);
  
  const defaultOptions = {
    includeTime: true,
    includeSeconds: false,
    buddhistYear: false,
    ...options
  };
  
  const day = String(thaiDate.getDate()).padStart(2, '0');
  const month = String(thaiDate.getMonth() + 1).padStart(2, '0');
  const year = defaultOptions.buddhistYear ? thaiDate.getFullYear() + 543 : thaiDate.getFullYear();
  
  let result = `${day}/${month}/${year}`;
  
  if (defaultOptions.includeTime) {
    const hours = String(thaiDate.getHours()).padStart(2, '0');
    const minutes = String(thaiDate.getMinutes()).padStart(2, '0');
    result += ` ${hours}:${minutes}`;
    
    if (defaultOptions.includeSeconds) {
      const seconds = String(thaiDate.getSeconds()).padStart(2, '0');
      result += `:${seconds}`;
    }
  }
  
  return result;
}

/**
 * Get current Thailand time for database operations
 */
export function getCurrentThailandTimeForDB(): Date {
  return getThailandTimeIntl();
}
