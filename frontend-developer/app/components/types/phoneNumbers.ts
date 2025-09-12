// Shared TypeScript interfaces for phone number management components

export interface Agent {
  agent_prefix: string;
  name: string;
  organization_id: string;
  id?: string;
}

export interface PhoneNumber {
  phone_number: string;
  agent_id: string | null;
  organization_id: string;
  status: string;
  phone_id?: string;
  voice_enabled?: boolean;
  sms_enabled?: boolean;
  whatsapp_enabled?: boolean;
  inbound_enabled?: boolean;
  outbound_enabled?: boolean;
  agent_name?: string;
  created_at?: string;
  updated_at?: string;
  // Alternative field names for backward compatibility
  number?: string;
  phone?: string;
}

export interface ScheduledEvent {
  _id?: string;
  scheduled_id: string;
  organization_id: string;
  agent_id: string;
  call_type: string;
  status: string;
  recipient_phone: string;
  scheduled_time: string;
  flexible_time_minutes: number;
  retry_count?: number;
  max_retries: number;
  message_template?: string;
  execution_history?: any[];
  last_execution_time?: string | null;
  next_execution_time?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface OrganizationData {
  phone_numbers?: PhoneNumber[];
  agents?: Record<string, unknown>;
  status?: string;
  count?: number;
}

export interface SchedulerFormData {
  organization_id: string;
  agent_prefix: string;
  recipient_phone: string;
  scheduled_time: string;
  flexible_time_minutes: number;
  max_retries: number;
}

export interface FormErrors {
  [key: string]: string;
}

// Constants for magic numbers
export const TIMEOUTS = {
  MESSAGE_DISPLAY: 5000,
  REFRESH_DELAY: 1000,
} as const;

export const VALIDATION_LIMITS = {
  FLEXIBLE_TIME_MAX: 60,
  MAX_RETRIES_MIN: 1,
  MAX_RETRIES_MAX: 10,
} as const;
