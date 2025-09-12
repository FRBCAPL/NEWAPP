/**
 * Date utility functions for proper timezone handling
 * Mountain Time Zone (UTC-7 in summer, UTC-8 in winter)
 */

/**
 * Convert a date to Mountain Time and format it for display
 * @param {string|Date} dateString - The date to convert
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date string in Mountain Time
 */
export function formatDateForMountainTime(dateString, options = {}) {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    // Default options for date formatting
    const defaultOptions = {
      timeZone: 'America/Denver', // Mountain Time
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      ...options
    };
    
    return date.toLocaleDateString('en-US', defaultOptions);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
}

/**
 * Convert a date to Mountain Time and format it with time
 * @param {string|Date} dateString - The date to convert
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date and time string in Mountain Time
 */
export function formatDateTimeForMountainTime(dateString, options = {}) {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    // Default options for date and time formatting
    const defaultOptions = {
      timeZone: 'America/Denver', // Mountain Time
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      ...options
    };
    
    return date.toLocaleString('en-US', defaultOptions);
  } catch (error) {
    console.error('Error formatting date and time:', error);
    return 'Invalid Date';
  }
}

/**
 * Convert a date to Mountain Time and format it as time only
 * @param {string|Date} dateString - The date to convert
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted time string in Mountain Time
 */
export function formatTimeForMountainTime(dateString, options = {}) {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    // Default options for time formatting
    const defaultOptions = {
      timeZone: 'America/Denver', // Mountain Time
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      ...options
    };
    
    return date.toLocaleTimeString('en-US', defaultOptions);
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid Date';
  }
}

/**
 * Get the current date and time in Mountain Time
 * @returns {Date} - Current date in Mountain Time
 */
export function getCurrentMountainTime() {
  const now = new Date();
  const mountainTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Denver"}));
  return mountainTime;
}

/**
 * Check if a date is today in Mountain Time
 * @param {string|Date} dateString - The date to check
 * @returns {boolean} - True if the date is today in Mountain Time
 */
export function isTodayInMountainTime(dateString) {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return false;
    
    const today = new Date();
    const mountainToday = new Date(today.toLocaleString("en-US", {timeZone: "America/Denver"}));
    const mountainDate = new Date(date.toLocaleString("en-US", {timeZone: "America/Denver"}));
    
    return mountainDate.toDateString() === mountainToday.toDateString();
  } catch (error) {
    console.error('Error checking if date is today:', error);
    return false;
  }
}
