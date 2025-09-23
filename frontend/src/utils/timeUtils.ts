/**
 * Time utility functions for consistent time handling across the application
 */

/**
 * Get the current local timezone
 */
export const getLocalTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Create a local datetime string in YYYY-MM-DDTHH:MM format
 */
export const createLocalDateTimeString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Format date to Buddhist Era (DD/MM/YYYY HH:MM:SS)
 */
export const formatToBuddhistEra = (date: Date): string => {
  const buddhistYear = date.getFullYear() + 543;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${buddhistYear} ${hours}:${minutes}:${seconds}`;
};

/**
 * Format time to local timezone with Thai locale
 */
export const formatLocalTime = (date: Date): string => {
  return date.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: getLocalTimezone()
  });
};

/**
 * Format datetime to local timezone with Thai locale
 */
export const formatLocalDateTime = (date: Date): string => {
  return date.toLocaleString('th-TH', {
    timeZone: getLocalTimezone()
  });
};

/**
 * Get current time in local timezone
 */
export const getCurrentLocalTime = (): Date => {
  return new Date();
};

/**
 * Debug time information for troubleshooting
 */
export const debugTimeInfo = (date: Date = new Date()) => {
  console.log('🕐 Time Debug Info:', {
    localTime: date.toString(),
    localTimeString: date.toLocaleString('th-TH'),
    localTimeStringUTC: date.toLocaleString('th-TH', { timeZone: 'UTC' }),
    isoString: date.toISOString(),
    localDateTimeString: createLocalDateTimeString(date),
    buddhistEra: formatToBuddhistEra(date),
    localTimeFormatted: formatLocalTime(date),
    localDateTimeFormatted: formatLocalDateTime(date),
    timezoneOffset: date.getTimezoneOffset(),
    timezone: getLocalTimezone(),
    hours: date.getHours(),
    minutes: date.getMinutes(),
    utcHours: date.getUTCHours(),
    utcMinutes: date.getUTCMinutes()
  });
};
