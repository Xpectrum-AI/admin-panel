import { useAuthInfo } from '@propelauth/react';
import { useCallback } from 'react';

// Helper function to get organization ID from user context
export const useOrganizationId = () => {
  const { user, userClass } = useAuthInfo();
  
  return useCallback((): string => {
    if (!user) return '';
    
    // Get current organization name from user context
    const orgIdToOrgMemberInfo = (user as { orgIdToOrgMemberInfo?: Record<string, unknown> }).orgIdToOrgMemberInfo;
    let orgId = orgIdToOrgMemberInfo ? Object.keys(orgIdToOrgMemberInfo)[0] : '';
    
    // Fallback: get organization name from userClass
    if (!orgId && userClass) {
      const orgs = userClass.getOrgs?.() || [];
      if (orgs.length > 0) {
        const org = orgs[0] as { orgName?: string; name?: string; orgId?: string };
        orgId = org.orgName || org.name || org.orgId || '';
      }
    }
    
    return orgId;
  }, [user, userClass]);
};

// Helper function to check if a phone number is assigned
export const isAssigned = (phoneNumber: { agent_id?: string | null }) => {
  return phoneNumber.agent_id && phoneNumber.agent_id !== 'unassigned' && phoneNumber.agent_id !== '';
};

// Helper function to clear messages after timeout
export const useMessageTimeout = (timeout: number = 5000) => {
  return useCallback((clearFunction: () => void) => {
    return setTimeout(clearFunction, timeout);
  }, [timeout]);
};
