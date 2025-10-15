// types.ts
export interface UpdateOrgInput {
    name?: string;
    description?: string;
    displayName?: string;
    domain?: string;
    extraDomains?: string[];
    enableAutoJoiningByDomain?: boolean;
    membersMustHaveMatchingDomain?: boolean;
    maxUsers?: number;
    canSetupSaml?: boolean;
    legacyOrgId?: string;
  }

// Phone Number Types
export interface PhoneNumberRequest {
  phone_number: string;
}

export interface PhoneNumberResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export interface AgentPhoneNumber {
  prefix: string;
  phone_number: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BulkDeleteResponse {
  success: boolean;
  message?: string;
  deleted_count?: number;
  failed_deletions?: string[];
}

// Conversation Log Types
export interface ConversationMessage {
  id: string;
  conversation_id: string;
  query: string;
  answer: string;
  created_at: string;
  message_tokens: number;
  answer_tokens: number;
  provider_response_latency: number;
  from_source: string;
  from_end_user_id?: string;
  from_account_id?: string;
}

export interface Conversation {
  id: string;
  app_id: string;
  name: string;
  status: string;
  from_source: string;
  created_at: string;
  updated_at: string;
  dialogue_count: number;
  messages: ConversationMessage[];
}

export interface ConversationLogFilter {
  app_id?: string;
  from_source?: string;
  start_date?: string;
  end_date?: string;
  user_id?: string;
}

export interface ConversationLogResponse {
  success: boolean;
  total_conversations?: number;
  saved_count?: number;
  failed_count?: number;
  file_paths?: string[];
  message?: string;
}

export interface LogsSummary {
  success: boolean;
  total_files: number;
  total_size_bytes: number;
  directories: string[];
}
  