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
  