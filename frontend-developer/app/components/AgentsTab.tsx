'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Bot, Settings, Mic, Wrench, BarChart3, MessageSquare, Sparkles, Zap, Activity, Search, RefreshCw, Trash2, ChevronDown, Loader2, Code, CheckCircle, Phone, X, Send } from 'lucide-react';

import ModelConfig from './config/ModelConfig';
import VoiceConfig from './config/VoiceConfig';
import ToolsConfig from './config/ToolsConfig';
import WidgetConfig from './config/WidgetConfig';
import AgentCards from './AgentCards';
import LiveKitVoiceChat from './config/LiveKitVoiceChat';
import AutoSaveIndicator from './AutoSaveIndicator';

import { agentConfigService } from '../../service/agentConfigService';
import { difyAgentService } from '../../service/difyAgentService';
import { useAuthInfo } from '@propelauth/react';
import { useTheme } from '../contexts/ThemeContext';
import { useAgentConfig } from '../contexts/AgentConfigContext';
import { generateAgentUuid, extractAgentName, getDisplayName } from '../../lib/utils/agentUuid';
import { getAgentDisplayName } from '../../lib/utils/agentNameUtils';

interface Agent {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'draft';
  model?: string;
  provider?: string;
  cost?: string;
  latency?: string;
  avatar?: string;
  description?: string;

  organization_id?: string;
  chatbot_api?: string;
  chatbot_key?: string;
  modelApiKey?: string;
  systemPrompt?: string;
  tts_config?: any;
  stt_config?: any;
  initial_message?: string;
  nudge_text?: string;
  nudge_interval?: number;
  max_nudges?: number;
  typing_volume?: number;
  max_call_duration?: number;
  created_at?: string;
  updated_at?: string;

  config?: Record<string, unknown>;

}

// Fallback sample agents in case API fails
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

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface AgentsTabProps {

}

export default function AgentsTab({ }: AgentsTabProps) {
  const { isDarkMode } = useTheme();
  const { user, userClass } = useAuthInfo();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showAgentCards, setShowAgentCards] = useState(true);

  const [activeConfigTab, setActiveConfigTab] = useState('model');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showAgentPrefixModal, setShowAgentPrefixModal] = useState(false);
  const [agentPrefix, setAgentPrefix] = useState('');
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [deletingAgentId, setDeletingAgentId] = useState<string | null>(null);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Success modal state - removed
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const [agentsError, setAgentsError] = useState('');
  const [currentOrganizationId, setCurrentOrganizationId] = useState<string>('');
  const [organizationName, setOrganizationName] = useState<string>('');
  const [agentsLoaded, setAgentsLoaded] = useState(false);
  const loadedOrganizationRef = useRef<string>('');
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingRef = useRef<boolean>(false);
  const [generatedDifyApiKey, setGeneratedDifyApiKey] = useState<string>('');
  const [isRefreshingAgents, setIsRefreshingAgents] = useState(false);
  const [isUpdatingAgent, setIsUpdatingAgent] = useState(false);
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const [startVoiceCall, setStartVoiceCall] = useState(false);
  const [endVoiceCall, setEndVoiceCall] = useState(false);
  const [isConnectingToAgent, setIsConnectingToAgent] = useState(false);
  const [showChatSidebar, setShowChatSidebar] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ id: string, type: 'user' | 'bot', message: string, timestamp: Date }>>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const selectedAgentIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Use centralized configuration state
  const {
    configuration,
    hasUnsavedChanges,
    autoSaveStatus,
    updateConfiguration,
    loadConfigurationFromAgent,
    saveConfiguration,
    resetConfiguration
  } = useAgentConfig();

  // Initialize organization ID from user context
  useEffect(() => {
    console.log('🔍 Setting organization ID from user context:', { user, userClass });
    console.log('🔍 Full user object:', JSON.stringify(user, null, 2));
    console.log('🔍 User orgIdToOrgMemberInfo:', (user as any)?.orgIdToOrgMemberInfo);
    console.log('🔍 UserClass object:', JSON.stringify(userClass, null, 2));

    const orgId = (user as any)?.orgIdToOrgMemberInfo ?
      Object.keys((user as any).orgIdToOrgMemberInfo)[0] :
      null;

    if (orgId && orgId !== currentOrganizationId) {
      console.log('✅ Setting organization ID from user.orgIdToOrgMemberInfo:', orgId);
      setCurrentOrganizationId(orgId);
    } else if (userClass && !orgId) {
      // Fallback: get organization ID from userClass
      const orgs = userClass.getOrgs?.() || [];
      console.log('🔍 Available organizations from userClass:', orgs);
      console.log('🔍 Organization details:', orgs.map((org: any) => ({ orgId: org.orgId, id: org.id, name: org.name })));
      if ( orgs.length > 0) {
        const org = orgs[0] as any;
        const orgIdFromClass = org.orgId || org.id || '';
        console.log('🔍 First org details:', org);
        console.log('🔍 Extracted orgIdFromClass:', orgIdFromClass);
        if (orgIdFromClass && orgIdFromClass !== currentOrganizationId) {
          console.log('✅ Setting organization ID from userClass:', orgIdFromClass);
          setCurrentOrganizationId(orgIdFromClass);
        }
      }
    } else {
      console.log('❌ No organization ID found! OrgId:', orgId, 'UserClass:', userClass?.getOrgs?.());
      // Temporary workaround: use userId as organizationId for users without organizations
      if (user && (user as any).userId && !currentOrganizationId) {
        const userIdAsOrgId = (user as any).userId;
        console.log('🔧 Temporary workaround: using userId as organizationId:', userIdAsOrgId);
        setCurrentOrganizationId(userIdAsOrgId);
        setOrganizationName('Single User Workspace');
      }
    }
  }, [user, userClass, currentOrganizationId]);


  // Refs for scrolling to sections
  const modelSectionRef = useRef<any>(null);
  const voiceSectionRef = useRef<HTMLDivElement>(null);
  const widgetSectionRef = useRef<HTMLDivElement>(null);
  const toolsSectionRef = useRef<HTMLDivElement>(null);

  // Debug function to log current state
  const logCurrentState = useCallback(() => {
    console.log('=== Current AgentsTab State ===');
    console.log('Selected Agent:', selectedAgent);
    console.log('Configuration:', configuration);
    console.log('Has Unsaved Changes:', hasUnsavedChanges);
    console.log('Auto Save Status:', autoSaveStatus);
    console.log('Active Config Tab:', activeConfigTab);
    console.log('================================');
  }, [selectedAgent, configuration, hasUnsavedChanges, autoSaveStatus, activeConfigTab]);

  // Debug function to check localStorage state
  const logLocalStorageState = useCallback(() => {
    console.log('=== localStorage State ===');
    console.log('Agent Configuration:', localStorage.getItem('agentConfiguration'));
    console.log('Session Configuration:', sessionStorage.getItem('agentConfiguration'));
    console.log('==========================');
  }, []);
  // Removed analysis, advanced section refs

  // Fetch agents from backend with debouncing and duplicate call prevention
  const fetchAgents = useCallback(async (signal?: AbortSignal) => {
    // Prevent multiple simultaneous calls
    if (isFetchingRef.current) {
      console.log('🔄 fetchAgents already in progress, skipping...');
      return;
    }

    console.log('🔄 Starting fetchAgents...', { currentOrganizationId, organizationName });
    isFetchingRef.current = true;
    setAgentsError('');
    const shouldShowFullLoader = !(agents && agents.length > 0 && agentsLoaded);
    if (shouldShowFullLoader) {
      setIsLoadingAgents(true);
    } else {
      setIsRefreshingAgents(true);
    }

    try {
      const orgName = organizationName || currentOrganizationId || 'Unknown Organization';
      console.log('🔍 Using organization name for fetchAgents:', orgName);
      const result = await agentConfigService.getAllAgents(orgName, signal);
      console.log('📊 getAllAgents result:', result);

      if (result.success) {
        if (result.data && result.data.length > 0) {
          console.log('🔍 Raw agent data from API:', result.data);
          // Transform backend data to match our Agent interface
          const transformedAgents: Agent[] = result.data.map((agent: any) => {
            console.log('🔍 Processing agent:', agent.name, 'with data:', {
              initial_message: agent.initial_message,
              nudge_text: agent.nudge_text,
              nudge_interval: agent.nudge_interval,
              max_nudges: agent.max_nudges,
              typing_volume: agent.typing_volume,
              max_call_duration: agent.max_call_duration
            });
            return {
              id: agent.name || agent.id || `agent_${Date.now()}`, // Keep the full UUID as ID
              name: getDisplayName(agent.name || agent.id || 'Unnamed Agent'), // Display only the agent name
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

          // Preserve previously selected agent if still present
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
          // No agents found - normal for new setup
          setAgents([]);
          setSelectedAgent(null);
        }
      } else {
        // Don't show error for 405 Method Not Allowed - it's expected
        if (result.message.includes('405') || result.message.includes('Method Not Allowed')) {
          console.log('Backend does not support listing all agents. This is normal.');
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
      // Handle abort errors gracefully
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('Fetch aborted for fetchAgents');
        return;
      }
      // Don't show 405 errors as they are expected
      if (error instanceof Error && error.message.includes('405')) {
        console.log('Backend does not support listing all agents. This is normal.');
        setAgents([]);
        setSelectedAgent(null);
      } else {
        console.error('Error fetching agents:', error);
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
      console.log('🏁 fetchAgents completed');
    }
  }, [currentOrganizationId, organizationName]);

  // Load configuration from selected agent
  const loadAgentConfiguration = useCallback((agent: Agent) => {
    if (agent) {
      console.log('📥 Loading configuration from agent:', agent.name);
      loadConfigurationFromAgent(agent);
      console.log('📥 Loaded configuration from agent:', agent.name);
    }
  }, [loadConfigurationFromAgent]);

  // Load agent configuration when agent is selected
  useEffect(() => {
    if (selectedAgent) {
      console.log('🔄 selectedAgent changed, loading configuration:', selectedAgent.name);
      loadAgentConfiguration(selectedAgent);
    }
  }, [selectedAgent, loadAgentConfiguration]);

  // Initial fetch when component mounts and organization is available
  useEffect(() => {
    const currentOrg = currentOrganizationId || organizationName;
    if (currentOrg && !agentsLoaded && !isLoadingAgents) {
      console.log('🔄 Initial fetch for organization:', currentOrg);
      fetchAgents();
    }
  }, [currentOrganizationId, organizationName, agentsLoaded, isLoadingAgents, fetchAgents]);

  // Fetch agents when organization ID or name changes (only if not already loaded)
  useEffect(() => {
    const currentOrg = currentOrganizationId || organizationName;
    const loadedOrg = loadedOrganizationRef.current;

    if (currentOrg && !isLoadingAgents && currentOrg !== loadedOrg && agentsLoaded) {
      console.log('🔄 Organization changed, fetching agents:', { currentOrg, loadedOrg });
      setAgentsLoaded(false);
      fetchAgents();
    }
  }, [currentOrganizationId, organizationName, isLoadingAgents, agentsLoaded, fetchAgents]);

  // Get organization name from user context
  useEffect(() => {
    if (userClass) {
      const orgs = userClass.getOrgs?.() || [];
      console.log('🔍 Available organizations from userClass:', orgs);
      if (orgs.length > 0) {
        const org = orgs[0] as any;
        const orgName = org.orgName || org.name || '';
        if (orgName && orgName !== organizationName) {
          console.log('🔍 Setting organization name:', orgName);
          setOrganizationName(orgName);
        }
      } else {
        console.log('⚠️ No organizations found in userClass');
      }
    } else {
      console.log('⚠️ userClass is not available');
    }
  }, [userClass, organizationName]);

  // Refresh configuration when selectedAgent changes
  useEffect(() => {
    if (selectedAgent) {
      console.log('🔄 Selected agent changed, refreshing configuration:', selectedAgent);

      // Load configuration from selected agent using centralized state
      loadAgentConfiguration(selectedAgent);
    }
  }, [selectedAgent?.id]); // Only depend on the agent ID, not the entire object

  // Keep a ref of selected agent id to avoid fetch refetch ties
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
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    // Reset states and fetch
    setAgentsLoaded(false);
    loadedOrganizationRef.current = '';
    fetchAgents(abortControllerRef.current.signal);
  }, [fetchAgents]);

  // Handle creating a new agent
  const handleCreateNewAgent = useCallback(() => {
    console.log('🎯 Create New Agent clicked!');
    console.log('🎯 Current state:', { showAgentPrefixModal, agentPrefix, isCreatingAgent });
    // Show agent prefix modal first
    setShowAgentPrefixModal(true);
    setAgentPrefix('');
    setIsCreatingAgent(false); // Reset loading state when opening modal
    console.log('🎯 Modal should be opening now...');
  }, [showAgentPrefixModal, agentPrefix, isCreatingAgent]);

  // Handle agent prefix submission
  const handleAgentPrefixSubmit = useCallback(async () => {
    if (!agentPrefix.trim()) {
      alert('Please enter an agent prefix');
      return;
    }

    // Validate agent prefix format (lowercase, numbers, underscores only)
    const prefixRegex = /^[a-z0-9_]+$/;
    if (!prefixRegex.test(agentPrefix.trim())) {
      alert('Agent prefix can only contain lowercase letters, numbers, and underscores');
      return;
    }

    // Check if prefix is too short or too long
    if (agentPrefix.trim().length < 3) {
      alert('Agent prefix must be at least 3 characters long');
      return;
    }

    if (agentPrefix.trim().length > 50) {
      alert('Agent prefix must be less than 50 characters long');
      return;
    }

    // Start loading state
    setIsCreatingAgent(true);

    // Generate UUID for the agent
    const agentNameUuid = generateAgentUuid(agentPrefix.trim());
    console.log('🆔 Generated agent UUID:', agentNameUuid);
    console.log('🔍 Debug - currentOrganizationId:', currentOrganizationId);
    console.log('🔍 Debug - organizationName:', organizationName);

    // Create Dify agent and get API key immediately
    console.log('🚀 Creating Dify agent for new agent:', agentNameUuid);
    let difyApiKey = '';

    const orgId = currentOrganizationId || organizationName;
    console.log('🔍 Final organizationId being used:', orgId);

    if (!orgId) {
      alert('Organization ID is not available. Please refresh the page and try again.');
      setIsCreatingAgent(false);
      return;
    }

    try {
      const difyResult = await difyAgentService.createDifyAgent({
        agentName: agentNameUuid, // Use the UUID format for Dify
        organizationId: orgId,
        modelProvider: 'langgenius/openai/openai',
        modelName: 'gpt-4o'
      });

      console.log('📋 Dify creation result:', difyResult);

      if (difyResult.success && difyResult.data?.appKey) {
        difyApiKey = difyResult.data.appKey;
        const difyAppId = difyResult.data.appId; // Extract app ID
        setGeneratedDifyApiKey(difyApiKey);
        console.log('✅ Dify agent created successfully with API key:', difyApiKey.substring(0, 10) + '...');
        console.log('✅ Dify app ID:', difyAppId);
        
        // Store the app ID mapping in localStorage for later use
        if (difyAppId && difyApiKey) {
          localStorage.setItem(`dify_app_id_${difyApiKey}`, difyAppId);
          console.log('💾 Stored app ID mapping:', { apiKey: difyApiKey.substring(0, 10) + '...', appId: difyAppId });
        }
      } else {
        console.warn('⚠️ Dify agent creation failed, continuing with fallback:', difyResult.error);
      }
    } catch (difyError) {
      console.error('❌ Dify agent creation error:', difyError);
    }

    // Get organization name
    let orgName = organizationName || 'Unknown Organization';
    if (userClass) {
      const orgs = userClass.getOrgs?.() || [];
      if (orgs.length > 0) {
        const org = orgs[0] as any;
        const currentOrgName = org.orgName || org.name || '';
        if (currentOrgName) {
          orgName = currentOrgName;
          setOrganizationName(currentOrgName);
        }
      }
    }

    // Get current configuration from ModelConfig component
    const defaultSystemPrompt = `# Appointment Scheduling Agent Prompt

## Identity & Purpose
You are Riley, an appointment scheduling voice agent for Wellness Partners, a multi-specialty health clinic. Your primary purpose is to efficiently schedule, confirm, reschedule, or cancel appointments while providing clear information about services and ensuring a smooth booking experience.

## Voice & Persona
### Personality
- Sound friendly, organized, and efficient
- Project a helpful and patient demeanor, especially with elderly or confused callers
- Maintain a warm but professional tone throughout the conversation
- Convey confidence and competence in managing the scheduling system

### Speech Characteristics
- Speak clearly and at a moderate pace
- Use simple, direct language that's easy to understand
- Avoid medical jargon unless the caller uses it first
- Be concise but thorough in your responses

## Core Responsibilities
1. *Appointment Scheduling*: Help callers book new appointments
2. *Appointment Management*: Confirm, reschedule, or cancel existing appointments
3. *Service Information*: Provide details about available services and providers
4. *Calendar Navigation*: Check availability and suggest optimal time slots
5. *Patient Support*: Address questions about appointments, policies, and procedures

## Key Guidelines
- Always verify caller identity before accessing appointment information
- Confirm all appointment details (date, time, provider, service) before finalizing
- Be proactive in suggesting alternative times if preferred slots are unavailable
- Maintain patient confidentiality and follow HIPAA guidelines
- Escalate complex medical questions to appropriate staff members
- End calls with clear confirmation of next steps

## Service Areas
- Primary Care
- Cardiology
- Dermatology
- Orthopedics
- Pediatrics
- Women's Health
- Mental Health Services

## Operating Hours
- Monday-Friday: 8:00 AM - 6:00 PM
- Saturday: 9:00 AM - 2:00 PM
- Sunday: Closed

Remember: You are the first point of contact for many patients. Your professionalism and helpfulness directly impact their experience with Wellness Partners.`;

    let currentSystemPrompt = defaultSystemPrompt;
    let currentModelProvider = 'OpenAI';
    let currentModel = 'GPT-4o';
    let currentModelApiKey = process.env.NEXT_PUBLIC_MODEL_OPEN_AI_API_KEY || '';
    let currentChatbotApi = process.env.NEXT_PUBLIC_DIFY_BASE_URL || '';

    // Try to get current configuration from ModelConfig component
    console.log('🔍 modelSectionRef.current:', modelSectionRef.current);
    if (modelSectionRef.current) {
      try {
        const modelConfig = (modelSectionRef.current as any).getCurrentConfig?.();
        console.log('🔍 Retrieved modelConfig from ModelConfig component:', modelConfig);
        if (modelConfig) {
          currentSystemPrompt = modelConfig.systemPrompt || currentSystemPrompt;
          currentModelProvider = modelConfig.selectedModelProvider || currentModelProvider;
          currentModel = modelConfig.selectedModel || currentModel;
          currentModelApiKey = modelConfig.modelApiKey || currentModelApiKey;
          currentChatbotApi = modelConfig.modelLiveUrl || currentChatbotApi;
          console.log('✅ Updated configuration from ModelConfig component');
        } else {
          console.log('⚠️ No configuration returned from ModelConfig component');
        }
      } catch (error) {
        console.warn('⚠️ Could not get current configuration from ModelConfig:', error);
      }
    } else {
      console.log('⚠️ modelSectionRef.current is null - ModelConfig component not mounted');
    }

    console.log('🔍 Using current configuration for agent creation:');
    console.log('🔍 System Prompt:', currentSystemPrompt);
    console.log('🔍 Model Provider:', currentModelProvider);
    console.log('🔍 Model:', currentModel);
    console.log('🔍 Model API Key:', currentModelApiKey ? 'Present' : 'Missing');
    console.log('🔍 Chatbot API:', currentChatbotApi);

    const defaultConfig = {
      // Model Configuration
      modelConfig: {
        selectedModelProvider: currentModelProvider,
        selectedModel: currentModel,
        modelLiveUrl: currentChatbotApi,
        modelApiKey: difyApiKey || currentModelApiKey,
        systemPrompt: currentSystemPrompt
      },
      // Voice Configuration
      voiceConfig: {
        provider: 'openai' as const,
        openai: {
          api_key: process.env.NEXT_PUBLIC_OPEN_AI_API_KEY || '',
          model: 'tts-1', // Default OpenAI model
          response_format: 'mp3',
          voice: 'alloy',
          language: 'en',
          speed: 1.0
        }
      },
      // Transcriber Configuration
      transcriberConfig: {
        provider: 'deepgram' as const,
        deepgram: {
          api_key: process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY || '',
          model: 'nova-2',
          language: 'en-US',
          punctuate: true,
          smart_format: true,
          interim_results: false
        }
      },
      // Tools Configuration
      toolsConfig: {
        initialMessage: 'Hello! How can I help you today?',
        nudgeText: 'Hello, Are you still there?',
        nudgeInterval: 15,
        maxNudges: 3,
        typingVolume: 0.8,
        maxCallDuration: 300
      }
    };

    // Create the complete agent configuration
    const completeAgentConfig = {
      organization_id: orgName,
      initial_message: defaultConfig.toolsConfig.initialMessage,
      nudge_text: defaultConfig.toolsConfig.nudgeText,
      nudge_interval: defaultConfig.toolsConfig.nudgeInterval,
      max_nudges: defaultConfig.toolsConfig.maxNudges,
      typing_volume: defaultConfig.toolsConfig.typingVolume,
      max_call_duration: defaultConfig.toolsConfig.maxCallDuration,
      tts_config: defaultConfig.voiceConfig,
      stt_config: defaultConfig.transcriberConfig,
      chatbot_api: difyApiKey ? process.env.NEXT_PUBLIC_CHATBOT_API_URL : undefined,
      chatbot_key: difyApiKey || undefined,
      // Add system prompt and model configuration
      system_prompt: defaultConfig.modelConfig.systemPrompt,
      model_provider: defaultConfig.modelConfig.selectedModelProvider,
      model_name: defaultConfig.modelConfig.selectedModel,
      model_api_key: defaultConfig.modelConfig.modelApiKey,
      model_live_url: defaultConfig.modelConfig.modelLiveUrl
    };

    console.log('🔧 Creating agent with complete configuration:', completeAgentConfig);

    try {
      // Create the agent with all default configurations using UUID
      const result = await agentConfigService.configureAgent(agentNameUuid, completeAgentConfig);

      if (result.success) {
        console.log('✅ Agent created successfully with default configurations');

        // Now POST model and prompt configurations to Dify
        if (difyApiKey) {
          try {
            console.log('🔧 Posting model configuration to Dify...');
            const modelConfigResponse = await fetch('/api/model-config', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-API-Key': process.env.NEXT_PUBLIC_LIVE_API_KEY || '',
              },
              body: JSON.stringify({
                provider: 'langgenius/openai/openai',
                model: currentModel.toLowerCase(),
                api_key: currentModelApiKey,
                chatbot_api_key: difyApiKey
              })
            });

            if (modelConfigResponse.ok) {
              console.log('✅ Model configuration posted to Dify successfully');
            } else {
              console.warn('⚠️ Failed to post model configuration to Dify');
            }

            console.log('🔧 Posting prompt configuration to Dify...');
            const promptConfigResponse = await fetch('/api/prompt-config', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-API-Key': process.env.NEXT_PUBLIC_LIVE_API_KEY || '',
              },
              body: JSON.stringify({
                prompt: currentSystemPrompt,
                chatbot_api_key: difyApiKey
              })
            });

            if (promptConfigResponse.ok) {
              console.log('✅ Prompt configuration posted to Dify successfully');

              // Save the prompt to localStorage so it can be retrieved later
              try {
                const promptData = {
                  prompt: currentSystemPrompt,
                  timestamp: new Date().toISOString()
                };
                localStorage.setItem(`difyPrompt_${agentPrefix.trim()}`, JSON.stringify(promptData));
                console.log('✅ Prompt saved to localStorage for agent:', agentPrefix.trim());
              } catch (error) {
                console.warn('⚠️ Failed to save prompt to localStorage:', error);
              }
            } else {
              console.warn('⚠️ Failed to post prompt configuration to Dify');
            }
          } catch (configError) {
            console.error('❌ Error posting configurations to Dify:', configError);
          }
        }

        // Get Dify configuration from localStorage if available
        let difyConfig = null;
        try {
          const storedDifyConfig = localStorage.getItem(`difyConfig_${agentPrefix.trim()}`);
          if (storedDifyConfig) {
            difyConfig = JSON.parse(storedDifyConfig);
            console.log('✅ Retrieved Dify config for agent creation:', difyConfig);
          }
        } catch (error) {
          console.warn('⚠️ Failed to retrieve Dify config for agent creation:', error);
        }

        // Create the agent object for UI
        const newAgent: Agent = {
          id: agentNameUuid, // Use UUID as the ID
          name: getDisplayName(agentNameUuid), // Display only the agent name
          status: 'active',
          avatar: '🤖',
          description: 'AI Agent - Ready to use',
          model: currentModel,
          provider: currentModelProvider,
          cost: '~$0.15/min',
          latency: '~1050ms',
          organization_id: orgName,
          // Use Dify configuration if available, otherwise fallback to environment
          chatbot_api: difyConfig?.chatbot_api || currentChatbotApi,
          chatbot_key: difyConfig?.chatbot_key || difyApiKey || undefined,
          modelApiKey: difyConfig?.chatbot_key || difyApiKey || undefined,
          systemPrompt: currentSystemPrompt, // Set current prompt
          initial_message: defaultConfig.toolsConfig.initialMessage,
          nudge_text: defaultConfig.toolsConfig.nudgeText,
          nudge_interval: defaultConfig.toolsConfig.nudgeInterval,
          max_nudges: defaultConfig.toolsConfig.maxNudges,
          typing_volume: defaultConfig.toolsConfig.typingVolume,
          max_call_duration: defaultConfig.toolsConfig.maxCallDuration,
          tts_config: defaultConfig.voiceConfig,
          stt_config: defaultConfig.transcriberConfig
        };

        // Log the final agent configuration
        console.log('🔍 Final agent configuration for UI:', {
          chatbot_api: newAgent.chatbot_api,
          chatbot_key: newAgent.chatbot_key ? newAgent.chatbot_key.substring(0, 10) + '...' : 'NO KEY',
          difyConfig_used: !!difyConfig,
          difyApiKey_used: !!difyApiKey
        });

        // Get the actual prompt from localStorage (saved when posted to Dify)
        try {
          const savedPromptData = localStorage.getItem(`difyPrompt_${agentPrefix.trim()}`);
          if (savedPromptData) {
            const promptData = JSON.parse(savedPromptData);
            if (promptData.prompt) {
              console.log('✅ Actual prompt retrieved from localStorage:', promptData.prompt);
              // Update the agent's systemPrompt with the actual prompt
              newAgent.systemPrompt = promptData.prompt;
            }
          }
        } catch (error) {
          console.warn('⚠️ Failed to retrieve prompt from localStorage:', error);
        }

        // Add the new agent to the agents list
        setAgents(prev => [...prev, newAgent]);
        setSelectedAgent(newAgent);

        // Configuration will be loaded automatically by the centralized state

        // Refresh agents list to get the actual chatbot_key from backend
        setTimeout(async () => {
          try {
            console.log('🔄 Refreshing agents list to get updated chatbot_key...');
            await fetchAgents();
          } catch (error) {
            console.warn('⚠️ Failed to refresh agents after creation:', error);
          }
        }, 2000); // Wait 2 seconds for backend to process

        // Success - modal removed

        // Close modal and reset states
        setShowAgentPrefixModal(false);
        setAgentPrefix('');
        setIsCreating(false);
        setIsEditing(false);
        setActiveConfigTab('model');

      } else {
        console.error('❌ Failed to create agent:', result.message);
        alert(`❌ Failed to create agent: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Error creating agent:', error);
      alert(`❌ Error creating agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Reset loading state
    setIsCreatingAgent(false);
  }, [agentPrefix, currentOrganizationId, organizationName, userClass]);

  // Handle selecting an agent (view mode)
  const handleSelectAgent = useCallback((agent: Agent) => {
    console.log('Selecting agent for viewing:', agent);

    // Reset configuration context before loading new agent
    resetConfiguration();

    setSelectedAgent(agent);
    setIsEditing(false);
    setIsCreating(false);
    setActiveConfigTab('model');

    // Load configuration will happen automatically via useEffect
  }, [resetConfiguration]);

  // Handle editing an existing agent
  const handleEditAgent = useCallback((agent: Agent) => {
    console.log('Editing agent:', agent);
    setSelectedAgent(agent);
    setIsEditing(true);
    setIsCreating(false);
    setShowAgentCards(false); // Switch to configuration view

    // Configuration will be loaded automatically by the centralized state

    setActiveConfigTab('model'); // Start with model configuration
  }, []);

  // Handle opening agent in new tab
  const handleOpenAgent = useCallback((agent: Agent) => {
    console.log('Opening agent in new tab:', agent);
    console.log('Agent ID:', agent.id);
    console.log('Agent chatbot_key:', agent.chatbot_key);
    console.log('Agent chatbot_api:', agent.chatbot_api);

    // Pass agent configuration through URL parameters
    const params = new URLSearchParams();
    if (agent.chatbot_api) {
      params.set('api_url', agent.chatbot_api);
    }
    if (agent.chatbot_key) {
      params.set('api_key', agent.chatbot_key);
    }
    if (agent.initial_message) {
      params.set('initial_message', agent.initial_message);
    }
    if (agent.name) {
      params.set('name', agent.name);
    }

    const chatbotUrl = `/chatbot/${agent.id}?${params.toString()}`;
    console.log('Opening URL with config:', chatbotUrl);
    window.open(chatbotUrl, '_blank');
  }, []);

  // Chat functions
  const sendChatMessage = async () => {
    if (!currentMessage.trim() || !selectedAgent || isChatLoading) return;

    const messageToSend = currentMessage.trim();
    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      message: messageToSend,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/chatbot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          difyApiUrl: selectedAgent.chatbot_api || process.env.NEXT_PUBLIC_CHATBOT_API_URL || 'https://dlb20rrk0t1tl.cloudfront.net/v1/chat-messages',
          difyApiKey: selectedAgent.chatbot_key,
          message: messageToSend,
          conversationId: '', // Start new conversation
          useStreaming: true // Use streaming mode like the working chatbot
        }),
      });

      const data = await response.json();

      if (response.ok && data.answer) {
        const botMessage = {
          id: (Date.now() + 1).toString(),
          type: 'bot' as const,
          message: data.answer,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, botMessage]);
      } else {
        const errorMessage = {
          id: (Date.now() + 1).toString(),
          type: 'bot' as const,
          message: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot' as const,
        message: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  const clearChat = () => {
    setChatMessages([]);
  };

  // Helper function to convert UI voice config to backend format
  const convertUIVoiceConfigToBackend = useCallback((uiConfig: any) => {
    if (!uiConfig || !uiConfig.selectedVoiceProvider) return null;

    const provider = uiConfig.selectedVoiceProvider;
    const backendConfig = {
      provider: provider === 'Cartesia' ? 'cartesian' :
        provider === '11Labs' ? 'elevenlabs' : 'openai',
      cartesian: null,
      openai: null,
      elevenlabs: null
    };

    if (provider === 'Cartesia') {
      backendConfig.cartesian = {
        voice_id: uiConfig.voiceId || '',
        tts_api_key: uiConfig.apiKey || '',
        model: uiConfig.selectedModel || 'sonic-2', // Use selectedModel instead of selectedVoice
        speed: uiConfig.speedValue || 1.0,
        language: uiConfig.selectedLanguage === 'English' ? 'en' : 'en' // Add proper language mapping if needed
      };
    } else if (provider === 'OpenAI') {
      backendConfig.openai = {
        model: uiConfig.selectedModel || 'tts-1',
        speed: uiConfig.speedValue || 1.0,
        api_key: uiConfig.apiKey || '',
        voice: uiConfig.selectedVoice || 'alloy',
        response_format: uiConfig.responseFormat || 'mp3',
        language: uiConfig.selectedLanguage === 'English' ? 'en' : 'en' // Add proper language mapping if needed
      };
    } else if (provider === '11Labs') {
      backendConfig.elevenlabs = {
        voice_id: uiConfig.voiceId || 'pNInz6obpgDQGcFmaJgB',
        api_key: uiConfig.apiKey || '',
        model_id: uiConfig.selectedModel || 'eleven_v3', // Use selectedModel instead of hardcoded value
        speed: uiConfig.speedValue || 1.0,
        stability: uiConfig.stability || 0.5,
        similarity_boost: uiConfig.similarityBoost || 0.5
      };
    }

    return backendConfig;
  }, []);

  // Helper function to convert UI transcriber config to backend format
  const convertUITranscriberConfigToBackend = useCallback((uiConfig: any) => {
    if (!uiConfig || !uiConfig.selectedTranscriberProvider) return null;

    const provider = uiConfig.selectedTranscriberProvider;
    const backendConfig = {
      provider: provider === 'Deepgram' ? 'deepgram' : 'openai',
      deepgram: null,
      openai: null
    };

    if (provider === 'Deepgram') {
      backendConfig.deepgram = {
        api_key: uiConfig.transcriberApiKey || '',
        model: uiConfig.selectedTranscriberModel || 'nova-2',
        language: uiConfig.selectedTranscriberLanguage || 'en-US',
        punctuate: uiConfig.punctuateEnabled !== undefined ? uiConfig.punctuateEnabled : true,
        smart_format: uiConfig.smartFormatEnabled !== undefined ? uiConfig.smartFormatEnabled : true,
        interim_results: uiConfig.interimResultEnabled !== undefined ? uiConfig.interimResultEnabled : false
      };
    } else if (provider === 'OpenAI') {
      backendConfig.openai = {
        api_key: uiConfig.transcriberApiKey || '',
        model: uiConfig.selectedTranscriberModel || 'whisper-1', // Use whisper-1 for OpenAI STT
        language: uiConfig.selectedTranscriberLanguage === 'multi' ? null : (uiConfig.selectedTranscriberLanguage || 'en')
      };
    }

    return backendConfig;
  }, []);

  // Handle update agent using centralized configuration
  const handleUpdateAgent = useCallback(async () => {
    if (!selectedAgent) return;

    try {
      setIsUpdatingAgent(true);

      // Use centralized configuration
      const { model, voice, transcriber, tools } = configuration;

      // Convert UI configurations to backend format
      const backendVoiceConfig = voice ? convertUIVoiceConfigToBackend(voice) : undefined;
      const backendTranscriberConfig = transcriber ? convertUITranscriberConfigToBackend(transcriber) : undefined;

      // Convert configurations to backend format
      const completeConfig = {
        organization_id: selectedAgent.organization_id || currentOrganizationId || organizationName,
        initial_message: tools?.initialMessage || selectedAgent.initial_message || 'Hello! How can I help you today?',
        nudge_text: tools?.nudgeText || selectedAgent.nudge_text || 'Hello, Are you still there?',
        nudge_interval: tools?.nudgeInterval ?? selectedAgent.nudge_interval ?? 15,
        max_nudges: tools?.maxNudges ?? selectedAgent.max_nudges ?? 3,
        typing_volume: tools?.typingVolume ?? selectedAgent.typing_volume ?? 0.8,
        max_call_duration: tools?.maxCallDuration ?? selectedAgent.max_call_duration ?? 300,
        tts_config: backendVoiceConfig || undefined,
        stt_config: backendTranscriberConfig || undefined,
        chatbot_api: model?.chatbot_api || selectedAgent.chatbot_api,
        chatbot_key: model?.chatbot_key || selectedAgent.chatbot_key,
        system_prompt: model?.systemPrompt || model?.firstMessage || selectedAgent.systemPrompt || selectedAgent.initial_message
      } as any;

      console.log('💾 Updating agent with centralized config:', completeConfig);
      console.log('🔍 Configuration state:', configuration);
      console.log('🔍 Backend voice config:', backendVoiceConfig);
      console.log('🔍 Backend transcriber config:', backendTranscriberConfig);

      const result = await agentConfigService.configureAgent(selectedAgent.id, completeConfig);

      if (result.success) {
        console.log('✅ Agent updated successfully');
        // Save configuration to backend
        await saveConfiguration();
        // Refresh list to reflect latest server state
        await fetchAgents();
        console.log('✅ Agent updated successfully');
      } else {
        console.error('❌ Failed to update agent:', result.message);
      }
    } catch (err) {
      console.error('❌ Error updating agent:', err);
    } finally {
      setIsUpdatingAgent(false);
    }
  }, [selectedAgent, configuration, currentOrganizationId, organizationName, fetchAgents, saveConfiguration, convertUIVoiceConfigToBackend, convertUITranscriberConfigToBackend]);

  // Handle going back to agent cards view
  const handleBackToCards = useCallback(() => {
    setShowAgentCards(true);
    setSelectedAgent(null);
    setIsEditing(false);
    setIsCreating(false);
  }, []);

  // Handle successful agent creation/update - reset edit mode
  const handleAgentCreated = useCallback(async () => {
    console.log('Agent created/updated successfully, resetting edit mode');
    setIsEditing(false);
    setIsCreating(false);

    // Refresh the agents list to get the updated data
    try {
      await fetchAgents();
    } catch (error) {
      console.warn('Failed to refresh agents list:', error);
    }
  }, [fetchAgents]);

  // Update selected agent when agents list changes (after refresh)
  useEffect(() => {
    if (selectedAgent && agents.length > 0) {
      const updatedAgent = agents.find(agent => agent.id === selectedAgent.id);
      if (updatedAgent) {
        // Check if the agent data has actually changed by comparing key fields
        const hasChanges =
          updatedAgent.initial_message !== selectedAgent.initial_message ||
          updatedAgent.nudge_text !== selectedAgent.nudge_text ||
          updatedAgent.nudge_interval !== selectedAgent.nudge_interval ||
          updatedAgent.max_nudges !== selectedAgent.max_nudges ||
          updatedAgent.typing_volume !== selectedAgent.typing_volume ||
          updatedAgent.max_call_duration !== selectedAgent.max_call_duration ||
          JSON.stringify(updatedAgent.tts_config) !== JSON.stringify(selectedAgent.tts_config) ||
          JSON.stringify(updatedAgent.stt_config) !== JSON.stringify(selectedAgent.stt_config);

        if (hasChanges) {
          console.log('🔄 Updating selected agent with fresh data from agents list:', updatedAgent);
          setSelectedAgent(updatedAgent);

          // Configuration will be updated automatically by the centralized state
        } else {
          console.log('ℹ️ Selected agent data unchanged, no update needed');
        }
      }
    }
  }, [agents, selectedAgent]);

  // Refresh agent configuration after updates
  const refreshAgentConfiguration = useCallback((agent: Agent) => {
    console.log('🔄 Refreshing agent configuration:', agent);

    // Update the selected agent
    setSelectedAgent(agent);

    // Configuration will be updated automatically by the centralized state

    // Update agents list
    setAgents(prev => prev.map(a => a.id === agent.id ? agent : a));
  }, []); // Empty dependency array since this function doesn't depend on any state

  // Function to get agent configuration data for components
  const getAgentConfigData = useCallback((agent: Agent) => {
    // For new agents (no chatbot_key), return null to indicate no existing configuration
    if (!agent.chatbot_key) {
      return {
        modelConfig: null,
        voiceConfig: null,
        transcriberConfig: null,
        widgetConfig: null,
        toolsConfig: null
      };
    }

    return {
      // Model config data
      modelConfig: {
        firstMessage: agent.initial_message || '',
        systemPrompt: agent.initial_message || '',
        // Use the correct field names that ToolsConfig expects
        provider: agent.provider || 'langgenius/openai/openai',
        model: agent.model || 'gpt-4o',
        api_key: agent.modelApiKey || agent.chatbot_key || '',
        // Keep the old field names for backward compatibility with ModelConfig
        selectedModelProvider: agent.provider || 'OpenAI',
        selectedModel: agent.model || 'GPT-4o',
        modelApiKey: agent.modelApiKey || agent.chatbot_key || '',
        modelLiveUrl: agent.chatbot_api || process.env.NEXT_PUBLIC_MODEL_API_BASE_URL || '',
        chatbot_api: agent.chatbot_api || '', // Include chatbot_api for ModelConfig
        chatbot_key: agent.chatbot_key // Include chatbot_key for proper identification
      },
      // Voice config data - only pass if it has actual configuration data
      voiceConfig: agent.tts_config && (
        (agent.tts_config.cartesian && Object.values(agent.tts_config.cartesian).some(v => v !== null && v !== undefined)) ||
        (agent.tts_config.openai && Object.values(agent.tts_config.openai).some(v => v !== null && v !== undefined)) ||
        (agent.tts_config.elevenlabs && Object.values(agent.tts_config.elevenlabs).some(v => v !== null && v !== undefined))
      ) ? agent.tts_config : null,
      // Transcriber config data - pass the raw backend config directly
      transcriberConfig: agent.stt_config || null,
      // Widget config data
      widgetConfig: {
        difyApiUrl: agent.chatbot_api ? agent.chatbot_api.replace('/chat-messages', '') : process.env.NEXT_PUBLIC_DIFY_BASE_URL || process.env.NEXT_PUBLIC_CHATBOT_API_URL?.replace('/chat-messages', '') || 'https://dlb20rrk0t1tl.cloudfront.net/v1',
        difyApiKey: agent.chatbot_key || ''
      },
      // Tools config data
      toolsConfig: {
        initialMessage: agent.initial_message || '',
        nudgeText: agent.nudge_text || 'Hello, Are you still there?',
        nudgeInterval: agent.nudge_interval || 15,
        maxNudges: agent.max_nudges || 3,
        typingVolume: agent.typing_volume || 0.8,
        maxCallDuration: agent.max_call_duration || 300
      }
    };
  }, []);


  // Handle showing delete confirmation
  const handleDeleteAgent = useCallback((agent: Agent) => {
    setAgentToDelete(agent);
    setShowDeleteConfirmation(true);
  }, []);

  // Handle confirming agent deletion
  const handleConfirmDelete = useCallback(async () => {
    if (!agentToDelete) return;

    setDeletingAgentId(agentToDelete.id);
    setShowDeleteConfirmation(false);

    try {
      // First, try to delete the Dify agent if it has a chatbot_key
      if (agentToDelete.chatbot_key) {
        console.log('🗑️ Deleting Dify agent for:', agentToDelete.id);
        console.log('🔍 Agent chatbot_key:', agentToDelete.chatbot_key);
        console.log('🔍 Current organizationId:', currentOrganizationId);

        try {
          const difyResult = await difyAgentService.deleteDifyAgent({
            agentName: agentToDelete.id, // Use UUID for Dify deletion
            organizationId: currentOrganizationId,
            // Note: We don't have the appId stored, but the script can still attempt cleanup
          });

          console.log('🔍 Dify deletion result:', difyResult);

          if (difyResult.success) {
            console.log('✅ Dify agent deleted successfully');
          } else {
            console.warn('⚠️ Dify agent deletion failed, continuing with backend deletion:', difyResult.error);
          }
        } catch (difyError) {
          console.warn('⚠️ Dify agent deletion error, continuing with backend deletion:', difyError);
        }
      } else {
        console.log('⚠️ No chatbot_key found, skipping Dify deletion');
      }

      // Delete the agent from the backend
      const result = await agentConfigService.deleteAgentByName(agentToDelete.id);
      if (result.success) {
        // Remove agent from local state
        setAgents(prev => prev.filter(a => a.id !== agentToDelete.id));
        if (selectedAgent?.id === agentToDelete.id) {
          setSelectedAgent(null);
        }
        console.log(`Agent "${agentToDelete.name}" deleted successfully`);
      } else {
        console.error('Failed to delete agent:', result.message);
      }
    } catch (error) {
      console.error('Error deleting agent:', error);
    } finally {
      setDeletingAgentId(null);
      setAgentToDelete(null);
    }
  }, [agentToDelete, selectedAgent, currentOrganizationId]);

  // Handle canceling delete
  const handleCancelDelete = useCallback(() => {
    setShowDeleteConfirmation(false);
    setAgentToDelete(null);
  }, []);

  // Function to handle tab clicks and scroll to section
  const handleTabClick = useCallback((tabId: string) => {
    console.log('🔄 Switching to tab:', tabId, 'from:', activeConfigTab);

    setActiveConfigTab(tabId);
    setIsDropdownOpen(false); // Close dropdown on mobile

    // Scroll to the corresponding section
    setTimeout(() => {
      switch (tabId) {
        case 'model':
          modelSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          break;
        case 'voice':
          voiceSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          break;
        case 'widget':
          widgetSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          break;
        case 'tools':
          toolsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          break;
        default:
          break;
      }
    }, 100);
  }, [activeConfigTab]);


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isDropdownOpen && !target.closest('.dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  // Fallback timeout to prevent infinite loading
  useEffect(() => {
    if (isLoadingAgents) {
      const fallbackTimeout = setTimeout(() => {
        console.log('⚠️ Loading timeout reached, stopping loading state');
        setIsLoadingAgents(false);
        setAgentsLoaded(true);
        isFetchingRef.current = false;
      }, 200); // 10 second timeout

      return () => clearTimeout(fallbackTimeout);
    }
  }, [isLoadingAgents]);

  // Manual refresh function for agent configuration
  const refreshSelectedAgentConfig = useCallback(async () => {
    if (!selectedAgent) return;

    console.log('🔄 Manually refreshing selected agent configuration:', selectedAgent.name);
    setIsRefreshingAgents(true);

    try {
      const orgName = organizationName || currentOrganizationId || 'Unknown Organization';
      const result = await agentConfigService.getAllAgents(orgName);
      if (result.success && result.data) {
        const updatedAgent = result.data.find((a: any) => a.name === selectedAgent.name);
        if (updatedAgent) {
          console.log('✅ Found updated agent, refreshing configuration:', updatedAgent);

          // Transform the agent data
          const transformedAgent: Agent = {
            id: updatedAgent.name || updatedAgent.id || `agent_${Date.now()}`,
            name: updatedAgent.name || 'Unnamed Agent',
            status: updatedAgent.status || 'draft',
            model: updatedAgent.model || 'Unknown Model',
            provider: updatedAgent.provider || 'Unknown Provider',
            cost: updatedAgent.cost || '~$0.10/min',
            latency: updatedAgent.latency || '~1000ms',
            avatar: '🤖',
            description: updatedAgent.description || 'AI Agent',
            organization_id: updatedAgent.organization_id,
            chatbot_api: updatedAgent.chatbot_api,
            chatbot_key: updatedAgent.chatbot_key,
            tts_config: updatedAgent.tts_config,
            stt_config: updatedAgent.stt_config,
            initial_message: updatedAgent.initial_message,
            nudge_text: updatedAgent.nudge_text,
            nudge_interval: updatedAgent.nudge_interval,
            max_nudges: updatedAgent.max_nudges,
            typing_volume: updatedAgent.typing_volume,
            max_call_duration: updatedAgent.max_call_duration,
            created_at: updatedAgent.created_at,
            updated_at: updatedAgent.updated_at
          };

          // Update the selected agent with new configuration
          setSelectedAgent(transformedAgent);

          // Update the agents list in the sidebar with the updated agent
          setAgents(prev => prev.map(agent =>
            agent.id === transformedAgent.id ? transformedAgent : agent
          ));

          // Configuration will be updated automatically by the centralized state
        } else {
          console.warn('⚠️ Agent not found in refresh response:', selectedAgent.name);
        }
      } else {
        console.warn('⚠️ Failed to fetch agents for refresh:', result.message);
      }
    } catch (error) {
      console.error('Error manually refreshing agent configuration:', error);
    } finally {
      setIsRefreshingAgents(false);
    }
  }, [selectedAgent?.name, organizationName, currentOrganizationId]);

  const configTabs = useMemo(() => [
    { id: 'model', label: 'Model', icon: Bot, color: 'from-blue-500 to-purple-600' },
    { id: 'voice', label: 'Voice & Transcriber', icon: Mic, color: 'from-green-500 to-teal-600' },
    { id: 'tools', label: 'Configurations', icon: Wrench, color: 'from-gray-600 to-gray-800' },
    { id: 'widget', label: 'Widget', icon: Code, color: 'from-purple-500 to-pink-600' },
  ], []);

  if (showAgentCards) {
    return (
      <div className="w-full h-full max-w-full mx-auto p-2 sm:p-4 lg:p-6 min-h-0 overflow-hidden">
        <div className={`rounded-xl sm:rounded-2xl border shadow-xl backdrop-blur-sm h-full flex flex-col max-h-full ${isDarkMode ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-gray-700/50' : 'bg-gradient-to-br from-white via-gray-50 to-white border-gray-200/50'}`}>
          <AgentCards
            agents={agents}
            onEditAgent={handleEditAgent}
            onOpenAgent={handleOpenAgent}
            onCreateAgent={handleCreateNewAgent}
            onRefreshAgents={handleRefreshAgents}
            isLoadingAgents={isLoadingAgents}
            isRefreshingAgents={isRefreshingAgents}
            agentsError={agentsError}
          />
        </div>

        {/* Agent Prefix Modal */}
        {showAgentPrefixModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`p-6 rounded-xl shadow-xl max-w-md w-full mx-4 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              }`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Create New Agent
              </h3>
              <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Enter a unique prefix for your new agent. This will be used as the agent identifier.
              </p>
              <input
                type="text"
                value={agentPrefix}
                onChange={(e) => setAgentPrefix(e.target.value)}
                placeholder="e.g., customer-support, sales-bot"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAgentPrefixSubmit();
                  }
                }}
              />
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAgentPrefixModal(false);
                    setAgentPrefix('');
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAgentPrefixSubmit}
                  disabled={!agentPrefix.trim() || isCreatingAgent}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingAgent ? 'Creating...' : 'Create Agent'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal - removed */}
      </div>
    );
  }

  return (
    <div className="w-full h-full max-w-full mx-auto p-2 sm:p-4 lg:p-6 min-h-0 overflow-hidden">
      <div className={`rounded-xl sm:rounded-2xl border shadow-xl backdrop-blur-sm h-full flex flex-col max-h-full ${isDarkMode ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-gray-700/50' : 'bg-gradient-to-br from-white via-gray-50 to-white border-gray-200/50'}`}>
        {/* Back Button */}
        <div className={`px-4 sm:px-6 lg:px-8 py-3 border-b ${isDarkMode ? 'border-gray-700/50 bg-gray-800/50' : 'border-gray-200/50 bg-gray-50/50'}`}>
          <button
            onClick={handleBackToCards}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${isDarkMode
              ? 'text-gray-300 hover:text-white hover:bg-gray-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Agents
          </button>
        </div>

        {/* Main Content - Agent Configuration */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {selectedAgent ? (
            <div className="flex-1 min-h-0 flex flex-col">
              {/* Agent Header */}
              <div className={`px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b ${isDarkMode ? 'border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-900' : 'border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-white'}`}>
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 mb-3 sm:mb-4 text-center sm:text-left">
                  <div className={`text-2xl sm:text-3xl p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0 ${isDarkMode ? 'bg-gradient-to-r from-green-900/50 to-emerald-900/50' : 'bg-gradient-to-r from-green-100 to-emerald-100'}`}>
                    {selectedAgent.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-lg sm:text-xl lg:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{getAgentDisplayName(selectedAgent)}</h3>
                    <p className={`text-sm sm:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{selectedAgent.description}</p>
                    <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>ID: {selectedAgent.id}</p>
                  </div>
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 sm:gap-3 relative">
                    {selectedAgent && (
                      <button
                        onClick={() => setShowChatSidebar(true)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Chat
                      </button>
                    )}
                    {selectedAgent && (
                      <button
                        onClick={() => {
                          if (showVoiceChat) {
                            setEndVoiceCall(true);
                            setShowVoiceChat(false);
                            setIsConnectingToAgent(false);
                            // Reset end call flag after a brief delay
                            setTimeout(() => setEndVoiceCall(false), 100);
                          } else {
                            // Start voice chat immediately
                            setShowVoiceChat(true);
                            setStartVoiceCall(true);
                            // Reset start call flag after a brief delay
                            setTimeout(() => setStartVoiceCall(false), 100);

                            // Show connecting for 3 seconds while call is active
                            setIsConnectingToAgent(true);
                            setTimeout(() => setIsConnectingToAgent(false), 3000);
                          }
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${showVoiceChat && !isConnectingToAgent
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : isConnectingToAgent
                            ? 'bg-yellow-600 text-white cursor-wait'
                            : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                      >
                        <Phone className="h-4 w-4" />
                        {isConnectingToAgent ? 'Connecting...' : (showVoiceChat ? 'End Call' : 'Talk to Agent')}
                      </button>
                    )}
                    {/* Voice Chat Component - Hidden UI, only props */}
                    {showVoiceChat && selectedAgent && (
                      <LiveKitVoiceChat
                        agentName={selectedAgent.id}
                        isDarkMode={isDarkMode}
                        startCall={startVoiceCall}
                        endCall={endVoiceCall}
                      />
                    )}
                    {selectedAgent && (
                      <button
                        onClick={handleUpdateAgent}
                        disabled={isUpdatingAgent}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isUpdatingAgent
                          ? 'bg-gray-400 text-white opacity-60 cursor-not-allowed'
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                          }`}
                      >
                        {isUpdatingAgent ? 'Publishing...' : 'Publish Agent'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Auto-save Status Indicator */}
              <div className="px-4 sm:px-6 lg:px-8 py-2 border-b border-gray-200/50 dark:border-gray-700/50">
                <AutoSaveIndicator />
              </div>

              {/* Configuration Tabs */}
              <div className={`border-b flex-shrink-0 ${isDarkMode ? 'border-gray-700/50 bg-gray-900' : 'border-gray-200/50 bg-white'}`}>
                {/* Mobile: Dropdown (xs to md) */}
                <div className="block md:hidden px-2 sm:px-3 py-2 dropdown-container">
                  <div className="relative">
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      <span className="flex items-center gap-2">
                        {configTabs.find(tab => tab.id === activeConfigTab)?.icon && (
                          React.createElement(configTabs.find(tab => tab.id === activeConfigTab)!.icon, { className: 'h-4 w-4' })
                        )}
                        {configTabs.find(tab => tab.id === activeConfigTab)?.label}
                      </span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isDropdownOpen && (
                      <div className={`absolute top-full left-0 right-0 mt-1 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none z-10 ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}>
                        {configTabs.map((tab) => (
                          <a
                            key={tab.id}
                            href="#"
                            onClick={() => handleTabClick(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 text-sm ${activeConfigTab === tab.id
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600'
                              }`}
                          >
                            {React.createElement(tab.icon, { className: 'h-4 w-4' })}
                            {tab.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Desktop: Tabs (md and up) */}
                <div className="hidden md:block">
                  <nav className="-mb-px flex space-x-8 px-4 sm:px-6 lg:px-8" aria-label="Tabs">
                    {configTabs.map((tab) => (
                      <a
                        key={tab.id}
                        href="#"
                        onClick={() => handleTabClick(tab.id)}
                        className={`
                          ${activeConfigTab === tab.id
                            ? `border-purple-500 text-purple-600 ${isDarkMode ? 'dark:text-purple-400' : ''}`
                            : `border-transparent ${isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:border-gray-300/50' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`
                          }
                          whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors duration-200
                        `}
                        aria-current={activeConfigTab === tab.id ? 'page' : undefined}
                      >
                        {React.createElement(tab.icon, { className: 'h-5 w-5' })}
                        {tab.label}
                      </a>
                    ))}
                  </nav>
                </div>
              </div>

              {/* Debug Section - only show in development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="px-4 sm:px-6 lg:px-8 py-2 border-b border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      logCurrentState();
                      logLocalStorageState();
                    }}
                    className="px-3 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:hover:bg-yellow-900/50"
                  >
                    Debug State
                  </button>
                </div>
              )}

              {/* Configuration Content */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
                {activeConfigTab === 'model' && (
                  <>
                    {console.log('🔧 Passing agent data to ModelConfig:', {
                      agentId: selectedAgent.id,
                      agentName: selectedAgent.name,
                      chatbot_api: selectedAgent.chatbot_api,
                      chatbot_key: selectedAgent.chatbot_key ? selectedAgent.chatbot_key.substring(0, 10) + '...' : 'NO KEY'
                    })}
                    <ModelConfig
                      ref={modelSectionRef}
                      agentName={selectedAgent.name}
                      onConfigChange={(config) => updateConfiguration('model', config)}
                      existingConfig={configuration.model}
                      isEditing={isEditing}
                      onConfigUpdated={fetchAgents}
                      agentApiKey={selectedAgent.chatbot_key}
                      agentApiUrl={selectedAgent.chatbot_api}
                    />
                  </>
                )}
                {activeConfigTab === 'voice' && (
                  <VoiceConfig
                    ref={voiceSectionRef}
                    agentName={selectedAgent.name}
                    onConfigChange={(config) => updateConfiguration('voice', config)}
                    onTranscriberConfigChange={(config) => updateConfiguration('transcriber', config)}
                    isEditing={isEditing}
                    // Add these props to pass centralized configuration
                    voiceConfiguration={configuration.voice}
                    transcriberConfiguration={configuration.transcriber}
                  />
                )}
                {activeConfigTab === 'widget' && (
                  <>
                    {console.log('🔧 Passing agent data to WidgetConfig:', {
                      agentId: selectedAgent.id,
                      chatbot_api: selectedAgent.chatbot_api,
                      chatbot_key: selectedAgent.chatbot_key ? selectedAgent.chatbot_key.substring(0, 10) + '...' : 'NO KEY'
                    })}
                    <WidgetConfig
                      ref={widgetSectionRef}
                      agentName={selectedAgent.id}
                      onConfigChange={(config) => updateConfiguration('widget', config)}
                      existingConfig={configuration.widget}
                      isEditing={isEditing}
                      difyApiUrl={selectedAgent.chatbot_api}
                      difyApiKey={selectedAgent.chatbot_key}
                      onRefreshAgent={fetchAgents}
                    />
                  </>
                )}
                {activeConfigTab === 'tools' && (
                  <ToolsConfig
                    key={`tools-${selectedAgent.id}-${selectedAgent.updated_at || Date.now()}`}
                    ref={toolsSectionRef}
                    agentName={selectedAgent.name}
                    onConfigChange={(config) => updateConfiguration('tools', config)}
                    existingConfig={configuration.tools}
                    isEditing={isEditing}
                    selectedAgent={selectedAgent}
                    currentOrganizationId={currentOrganizationId}
                    modelConfig={configuration.model}
                    voiceConfig={configuration.voice}
                    transcriberConfig={configuration.transcriber}
                    // Add this prop to pass centralized configuration
                    toolsConfiguration={configuration.tools}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex items-center justify-center overflow-y-auto">
              <div className="p-4 sm:p-6 lg:p-8 xl:p-12 text-center max-w-md mx-auto">
                <div className={`p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl lg:rounded-2xl inline-block mb-3 sm:mb-4 lg:mb-6 ${isDarkMode ? 'bg-gradient-to-r from-gray-800 to-gray-700' : 'bg-gradient-to-r from-gray-100 to-gray-200'}`}>
                  <Bot className={`h-6 w-6 sm:h-8 sm:w-8 lg:h-12 lg:w-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                </div>
                <h3 className={`text-base sm:text-lg lg:text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {agents.length === 0 ? 'Welcome to AI Agents!' : 'Select an Agent'}
                </h3>
                <p className={`mb-3 sm:mb-4 lg:mb-6 text-xs sm:text-sm lg:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {agents.length === 0
                    ? 'Create your first AI agent to start building intelligent conversational experiences.'
                    : 'Choose an agent from the sidebar to configure its settings'
                  }
                </p>
                {agents.length === 0 && (
                  <button
                    onClick={handleCreateNewAgent}
                    className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg sm:rounded-xl hover:bg-green-700 transition-colors font-semibold text-xs sm:text-sm lg:text-base"
                  >
                    Create Your First Agent
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Success Modal - removed */}

      {/* Voice Chat Modal removed; Voice chat now toggled inline from header */}

      {/* Chat Sidebar */}
      {showChatSidebar && selectedAgent && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop with subtle blur effect */}
          <div
            className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm"
            onClick={() => setShowChatSidebar(false)}
          />

          {/* Chat Panel - Slides in from right */}
          <div className={`relative w-full max-w-md h-full transform transition-transform duration-300 ease-in-out ${isDarkMode ? 'bg-gray-900' : 'bg-white'} shadow-2xl border-l ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            {/* Chat Header */}
            <div className={`p-6 border-b ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gradient-to-r from-gray-50 to-white border-gray-200'} backdrop-blur-sm`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 shadow-lg">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-lg text-gray-900 dark:text-white">
                      {getAgentDisplayName(selectedAgent)} Assistant
                    </h5>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Powered by Agent
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={clearChat}
                    className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setShowChatSidebar(false)}
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 group"
                  >
                    <X className="h-5 w-5 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-200" />
                  </button>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 h-[calc(100vh-200px)] overflow-y-auto p-6 space-y-6">
              {chatMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 mb-4 inline-block">
                      <MessageSquare className="h-12 w-12 text-blue-500 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Start a conversation
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-xs">
                      Test your chatbot by sending a message below
                    </p>
                  </div>
                </div>
              ) : (
                chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} group`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-5 py-3 rounded-2xl shadow-sm transition-all duration-200 group-hover:shadow-md ${message.type === 'user'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-md'
                        : isDarkMode
                          ? 'bg-gray-800 text-gray-100 rounded-bl-md border border-gray-700'
                          : 'bg-gray-50 text-gray-900 rounded-bl-md border border-gray-200'
                        }`}
                    >
                      <p className="text-sm leading-relaxed">{message.message}</p>
                      <p className={`text-xs mt-2 ${message.type === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className={`max-w-xs px-5 py-3 rounded-2xl ${isDarkMode ? 'bg-gray-800 text-gray-100 border border-gray-700' : 'bg-gray-50 text-gray-900 border border-gray-200'
                    }`}>
                    <div className="flex items-center gap-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm font-medium">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className={`p-6 border-t ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gradient-to-r from-gray-50 to-white border-gray-200'} backdrop-blur-sm`}>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleChatKeyPress}
                  placeholder="Type your message here..."
                  disabled={isChatLoading}
                  className={`flex-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-white'
                    }`}
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!currentMessage.trim() || isChatLoading}
                  className={`px-5 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 font-medium ${currentMessage.trim() && !isChatLoading
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
