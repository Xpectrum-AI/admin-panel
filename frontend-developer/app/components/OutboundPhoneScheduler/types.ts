// Re-export types from phoneNumbers types file
export type {
  Agent,
  ScheduledEvent,
  ApiResponse,
  SchedulerFormData,
  CallFormData,
  FormErrors,
} from '../types/phoneNumbers';

export type { TIMEOUTS, VALIDATION_LIMITS } from '../types/phoneNumbers';

export interface OutboundSchedulerProps {
  // No props needed
}

export type OutboundTab = 'trunk' | 'scheduler' | 'call';

export interface TrunkFormData {
  phone_number: string;
  transport: 'udp' | 'tcp';
}

