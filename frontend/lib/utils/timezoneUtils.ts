// Timezone utility functions

export interface TimezoneInfo {
  offset: string;
  label: string;
  value: string;
}

// Get timezone label for display
export function getTimezoneLabel(timezone: string): string {
  const timezoneLabels: { [key: string]: string } = {
    'America/New_York': 'Eastern Time (ET)',
    'America/Los_Angeles': 'Pacific Time (PT)',
    'America/Chicago': 'Central Time (CT)',
    'America/Denver': 'Mountain Time (MT)',
    'Asia/Kolkata': 'India Standard Time (IST)',
    'Europe/London': 'Greenwich Mean Time (GMT)',
    'Europe/Paris': 'Central European Time (CET)',
    'Asia/Tokyo': 'Japan Standard Time (JST)',
    'Australia/Sydney': 'Australian Eastern Time (AET)',
    'Asia/Shanghai': 'China Standard Time (CST)',
    'Asia/Dubai': 'Gulf Standard Time (GST)',
    'Asia/Singapore': 'Singapore Time (SGT)',
    'UTC': 'Coordinated Universal Time (UTC)'
  };
  
  return timezoneLabels[timezone] || timezone;
}

// Format time in specific timezone for display
export function formatTimeInTimezone(dateTime: string, timezone: string): string {
  try {
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone
    });
  } catch (error) {
    console.error('Error formatting time in timezone:', error);
    // Fallback to local time
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

// Get timezone info object
export function getTimezoneInfo(timezone: string): TimezoneInfo {
  return {
    offset: '', // No longer calculating offset in frontend
    label: getTimezoneLabel(timezone),
    value: timezone
  };
}
