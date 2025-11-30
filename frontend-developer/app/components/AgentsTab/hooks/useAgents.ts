import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuthInfo } from '@propelauth/react';
import { agentConfigService } from '../../../../service/agentConfigService';
import { getDisplayName } from '../../../../lib/utils/agentUuid';
import { Agent } from '../types';

const fallbackAgents: Agent[] = [
  {
    id: 'riley-001',
    name: 'Riley',
    status: 'active',
    model: 'GPT 4o Cluster',
    provider: 'OpenAI',
    cost: '~$0.15/min',
    latency: '~1050ms',
    avatar: '🤖',
    description: 'Your intelligent scheduling agent'
  },
  {
    id: 'elliot-002',
    name: 'Elliot',
    status: 'draft',
    model: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    cost: '~$0.12/min',
    latency: '~980ms',
    avatar: '🧠',
    description: 'Advanced conversation specialist'
  }
];

export function useAgents() {
  const { user, userClass } = useAuthInfo();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [agentsError, setAgentsError] = useState('');
  const [isRefreshingAgents, setIsRefreshingAgents] = useState(false);
  const [currentOrganizationId, setCurrentOrganizationId] = useState<string>('');
  const [organizationName, setOrganizationName] = useState<string>('');
  const [agentsLoaded, setAgentsLoaded] = useState(false);
  
  const loadedOrganizationRef = useRef<string>('');
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingRef = useRef<boolean>(false);
  const selectedAgentIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize organization ID from user context
  useEffect(() => {
    const orgId = (user as any)?.orgIdToOrgMemberInfo ?
      Object.keys((user as any).orgIdToOrgMemberInfo)[0] :
      null;

    if (orgId && orgId !== currentOrganizationId) {
      setCurrentOrganizationId(orgId);
    } else if (userClass && !orgId) {
      const orgs = userClass.getOrgs?.() || [];
      if (orgs.length > 0) {
        const org = orgs[0] as any;
        const orgIdFromClass = org.orgId || org.id || '';
        if (orgIdFromClass && orgIdFromClass !== currentOrganizationId) {
          setCurrentOrganizationId(orgIdFromClass);
        }
      }
    } else {
      if (user && (user as any).userId && !currentOrganizationId) {
        const userIdAsOrgId = (user as any).userId;
        setCurrentOrganizationId(userIdAsOrgId);
        setOrganizationName('Single User Workspace');
      }
    }
  }, [user, userClass, currentOrganizationId]);

  // Get organization name from user context
  useEffect(() => {
    if (userClass) {
      const orgs = userClass.getOrgs?.() || [];
      if (orgs.length > 0) {
        const org = orgs[0] as any;
        const orgName = org.orgName || org.name || '';
        if (orgName && orgName !== organizationName) {
          setOrganizationName(orgName);
        }
      }
    }
  }, [userClass, organizationName]);

  // Fetch agents from backend with debouncing and duplicate call prevention
  const fetchAgents = useCallback(async (signal?: AbortSignal) => {
    if (isFetchingRef.current) {
      return;
    }
    isFetchingRef.current = true;
    setAgentsError('');
    const isInitialLoad = !agentsLoaded && agents.length === 0;
    if (isInitialLoad) {
      setIsLoadingAgents(true);
    } else {
      setIsRefreshingAgents(true);
    }

    try {
      const orgName = organizationName || currentOrganizationId || 'Unknown Organization';
      const result = await agentConfigService.getAllAgents(orgName, signal);
      if (result.success) {
        if (result.data && result.data.length > 0) {
          const transformedAgents: Agent[] = result.data.map((agent: any) => {
            const agentPrefix = agent.agent_prefix || agent.name || agent.id || '';
            return {
              id: agentPrefix || `agent_${Date.now()}`,
              name: getDisplayName(agent.name || agent.agent_prefix || agent.id || 'Unnamed Agent'),
              agent_prefix: agentPrefix,
              status: agent.status || 'draft',
              model: agent.model || 'GPT-4o',
              provider: agent.provider || 'OpenAI',
              cost: agent.cost || '~$0.10/min',
              latency: agent.latency || '~1000ms',
              avatar: '🤖',
              description: agent.description || 'AI Agent',
              organization_id: agent.organization_id,
              chatbot_api: agent.chatbot_api,
              chatbot_key: agent.chatbot_key,
              tts_config: agent.tts_config,
              stt_config: agent.stt_config,
              initial_message: agent.initial_message,
              nudge_text: agent.nudge_text,
              nudge_interval: agent.nudge_interval,
              max_nudges: agent.max_nudges,
              typing_volume: agent.typing_volume,
              max_call_duration: agent.max_call_duration,
              created_at: agent.created_at,
              updated_at: agent.updated_at
            };
          });

          setAgents(transformedAgents);

          const previouslySelectedId = selectedAgentIdRef.current;
          if (transformedAgents.length > 0) {
            const match = transformedAgents.find(a => a.id === previouslySelectedId);
            if (match) {
              setSelectedAgent(match);
            } else if (!previouslySelectedId) {
              setSelectedAgent(transformedAgents[0]);
            }
          }
        } else {
          setAgents([]);
          setSelectedAgent(null);
        }
      } else {
        if (result.message.includes('405') || result.message.includes('Method Not Allowed')) {
          setAgents([]);
          setSelectedAgent(null);
        } else {
          setAgentsError(result.message);
          setAgents(fallbackAgents);
          if (fallbackAgents.length > 0 && !selectedAgentIdRef.current) {
            setSelectedAgent(fallbackAgents[0]);
          }
        }
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      if (error instanceof Error && error.message.includes('405')) {
        setAgents([]);
        setSelectedAgent(null);
      } else {
        setAgentsError('Failed to load agents from server');
        setAgents(fallbackAgents);
        if (fallbackAgents.length > 0 && !selectedAgentIdRef.current) {
          setSelectedAgent(fallbackAgents[0]);
        }
      }
    } finally {
      setIsLoadingAgents(false);
      setIsRefreshingAgents(false);
      setAgentsLoaded(true);
      loadedOrganizationRef.current = currentOrganizationId || organizationName || '';
      isFetchingRef.current = false;
    }
  }, [currentOrganizationId, organizationName, agentsLoaded, agents.length]);

  // Initial fetch when component mounts and organization is available
  useEffect(() => {
    const currentOrg = currentOrganizationId || organizationName;
    if (currentOrg && !agentsLoaded && !isLoadingAgents) {
      fetchAgents();
    }
  }, [currentOrganizationId, organizationName, agentsLoaded, isLoadingAgents, fetchAgents]);

  // Fetch agents when organization ID or name changes
  useEffect(() => {
    const currentOrg = currentOrganizationId || organizationName;
    const loadedOrg = loadedOrganizationRef.current;

    if (currentOrg && !isLoadingAgents && currentOrg !== loadedOrg && agentsLoaded) {
      setAgentsLoaded(false);
      fetchAgents();
    }
  }, [currentOrganizationId, organizationName, isLoadingAgents, agentsLoaded, fetchAgents]);

  // Keep a ref of selected agent id
  useEffect(() => {
    selectedAgentIdRef.current = selectedAgent ? selectedAgent.id : null;
  }, [selectedAgent?.id]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Handle refresh button click with abort signal
  const handleRefreshAgents = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    fetchAgents(abortControllerRef.current.signal);
  }, [fetchAgents]);

  return {
    agents,
    setAgents,
    selectedAgent,
    setSelectedAgent,
    isLoadingAgents,
    agentsError,
    isRefreshingAgents,
    currentOrganizationId,
    organizationName,
    agentsLoaded,
    handleRefreshAgents,
    fetchAgents
  };
}

