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
  