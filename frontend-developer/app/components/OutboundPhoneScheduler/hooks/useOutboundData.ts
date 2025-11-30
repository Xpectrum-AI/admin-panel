import { useState, useCallback, useEffect, useMemo } from 'react';
import { getAgentsByOrganization, getPhoneNumbersByOrganization } from '../../../../service/phoneNumberService';
import { Agent, ApiResponse } from '../types';
import { useOrganizationId } from '../../utils/phoneNumberUtils';

export function useOutboundData() {
  const getOrganizationId = useOrganizationId();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [phoneNumbers, setPhoneNumbers] = useState<any[]>([]);
  const [loadingPhoneNumbers, setLoadingPhoneNumbers] = useState(false);

  const getPhoneNumberValue = useCallback((phone: any) => {
    if (!phone) return '';
    return (
      phone.phone_number ||
      phone.number ||
      phone.phone ||
      phone.recipient_phone ||
      phone.to_number ||
      ''
    );
  }, []);

  const availableCallerNumbers = useMemo(() => {
    const uniqueNumbers = new Set<string>();
    phoneNumbers.forEach((phone) => {
      const value = getPhoneNumberValue(phone);
      if (value) {
        uniqueNumbers.add(value);
      }
    });
    return Array.from(uniqueNumbers);
  }, [phoneNumbers, getPhoneNumberValue]);

  const loadAgents = useCallback(async () => {
    setLoadingAgents(true);
    try {
      const orgId = getOrganizationId();
      
      if (!orgId) {
        setAgents([]);
        return;
      }
      
      const response: ApiResponse<{ agents: Record<string, unknown> }> = await getAgentsByOrganization(orgId);
      
      if (response.success && response.data) {
        const agentsData = response.data;
        
        if (agentsData.agents && typeof agentsData.agents === 'object') {
          const agentList: Agent[] = Object.keys(agentsData.agents).map(agentPrefix => ({
            agent_prefix: agentPrefix,
            name: agentPrefix,
            organization_id: orgId,
            ...(agentsData.agents[agentPrefix] as Record<string, unknown>)
          }));
          
          setAgents(agentList);
        } else {
          setAgents([]);
        }
      } else {
        setAgents([]);
      }
    } catch (err: unknown) {
      setAgents([]);
    } finally {
      setLoadingAgents(false);
    }
  }, [getOrganizationId]);

  const loadPhoneNumbers = useCallback(async () => {
    setLoadingPhoneNumbers(true);
    try {
      const orgId = getOrganizationId();
      
      if (!orgId) {
        setPhoneNumbers([]);
        return;
      }
      const response: ApiResponse<any> = await getPhoneNumbersByOrganization(orgId);
      
      if (response.success && response.data) {
        let phoneNumbersList = [];
        if (Array.isArray(response.data)) {
          phoneNumbersList = response.data;
        } else if (response.data.phone_numbers && Array.isArray(response.data.phone_numbers)) {
          phoneNumbersList = response.data.phone_numbers;
        } else if (response.data.assigned && Array.isArray(response.data.assigned)) {
          phoneNumbersList = response.data.assigned;
        }
        setPhoneNumbers(phoneNumbersList);
      } else {
        setPhoneNumbers([]);
      }
    } catch (err: unknown) {
      setPhoneNumbers([]);
    } finally {
      setLoadingPhoneNumbers(false);
    }
  }, [getOrganizationId]);

  useEffect(() => {
    loadAgents();
    loadPhoneNumbers();
  }, [loadAgents, loadPhoneNumbers]);

  return {
    agents,
    phoneNumbers,
    availableCallerNumbers,
    loadingAgents,
    loadingPhoneNumbers,
    loadAgents,
    loadPhoneNumbers
  };
}

