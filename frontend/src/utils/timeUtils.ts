/**
 * Time utility functions for consistent time handling across the application
 * All times are displayed in Thailand timezone (Asia/Bangkok, GMT+7)
 */

/**
 * Get Thailand timezone (Asia/Bangkok)
 */
export const getThailandTimezone = (): string => {
  return 'Asia/Bangkok';
};

/**
 * Get the current local timezone (deprecated - use getThailandTimezone instead)
 */
export const getLocalTimezone = (): string => {
  return getThailandTimezone();
};

/**
 * Create a Thailand datetime string in YYYY-MM-DDTHH:MM format
 */
export const createThailandDateTimeString = (date: Date): string => {
  const thailandDate = new Date(date.toLocaleString("en-US", {timeZone: getThailandTimezone()}));
  const year = thailandDate.getFullYear();
  const month = String(thailandDate.getMonth() + 1).padStart(2, '0');
  const day = String(thailandDate.getDate()).padStart(2, '0');
  const hours = String(thailandDate.getHours()).padStart(2, '0');
  const minutes = String(thailandDate.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Create a local datetime string in YYYY-MM-DDTHH:MM format (deprecated - use createThailandDateTimeString)
 */
export const createLocalDateTimeString = (date: Date): string => {
  return createThailandDateTimeString(date);
};

/**
 * Format date to Buddhist Era in Thailand timezone (DD/MM/YYYY HH:MM:SS)
 */
export const formatToBuddhistEra = (date: Date): string => {
  const thailandDate = new Date(date.toLocaleString("en-US", {timeZone: getThailandTimezone()}));
  const buddhistYear = thailandDate.getFullYear() + 543;
  const month = String(thailandDate.getMonth() + 1).padStart(2, '0');
  const day = String(thailandDate.getDate()).padStart(2, '0');
  const hours = String(thailandDate.getHours()).padStart(2, '0');
  const minutes = String(thailandDate.getMinutes()).padStart(2, '0');
  const seconds = String(thailandDate.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${buddhistYear} ${hours}:${minutes}:${seconds}`;
};

/**
 * Format time to Thailand timezone with Thai locale
 */
export const formatThailandTime = (date: Date): string => {
  return date.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: getThailandTimezone()
  });
};

/**
 * Format datetime to Thailand timezone with Thai locale
 */
export const formatThailandDateTime = (date: Date): string => {
  return date.toLocaleString('th-TH', {
    timeZone: getThailandTimezone(),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

/**
 * Format time to local timezone with Thai locale (deprecated - use formatThailandTime)
 */
export const formatLocalTime = (date: Date): string => {
  return formatThailandTime(date);
};

/**
 * Format datetime to local timezone with Thai locale (deprecated - use formatThailandDateTime)
 */
export const formatLocalDateTime = (date: Date): string => {
  return formatThailandDateTime(date);
};

/**
 * Get current time in Thailand timezone
 */
export const getCurrentThailandTime = (): Date => {
  return new Date();
};

/**
 * Get current time in local timezone (deprecated - use getCurrentThailandTime)
 */
export const getCurrentLocalTime = (): Date => {
  return getCurrentThailandTime();
};

/**
 *  time information for troubleshooting
 */
export const TimeInfo = (date: Date = new Date()) => {
};

/**
 * Format date to Thailand timezone with custom format
 */
export const formatThailandDate = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: getThailandTimezone(),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  
  return date.toLocaleString('th-TH', { ...defaultOptions, ...options });
};

/**
 * Format timestamp string to Thailand timezone
 */
export const formatTimestampToThailand = (timestamp: string): string => {
  const date = new Date(timestamp);
  return formatThailandDateTime(date);
};

/**
 * Get current Thailand time as string
 */
export const getCurrentThailandTimeString = (): string => {
  return formatThailandDateTime(new Date());
};

/**
 * Convert any date to Thailand timezone Date object
 */
export const toThailandTime = (date: Date): Date => {
  return new Date(date.toLocaleString("en-US", {timeZone: getThailandTimezone()}));
};

