'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Bot, Settings, Mic, Wrench, BarChart3, MessageSquare, Sparkles, Zap, Activity, Search, RefreshCw, Trash2, ChevronDown, Loader2, Code, CheckCircle, Phone, X, Send, VolumeX, Volume2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  agent_prefix?: string; // Add agent_prefix field for backend compatibility

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
  const [agentType, setAgentType] = useState<'Knowledge Agent (RAG)' | 'Action Agent (AI Employee)'>('Knowledge Agent (RAG)');
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [deletingAgentId, setDeletingAgentId] = useState<string | null>(null);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Success modal state - removed
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
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

  // Call controls state
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [showChatSidebar, setShowChatSidebar] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ id: string, type: 'user' | 'bot', message: string, timestamp: Date }>>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [conversationId, setConversationId] = useState('');
  const selectedAgentIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    const orgId = (user as any)?.orgIdToOrgMemberInfo ?
      Object.keys((user as any).orgIdToOrgMemberInfo)[0] :
      null;

    if (orgId && orgId !== currentOrganizationId) {
      setCurrentOrganizationId(orgId);
    } else if (userClass && !orgId) {
      // Fallback: get organization ID from userClass
      const orgs = userClass.getOrgs?.() || [];
      if (orgs.length > 0) {
        const org = orgs[0] as any;
        const orgIdFromClass = org.orgId || org.id || '';
        if (orgIdFromClass && orgIdFromClass !== currentOrganizationId) {
          setCurrentOrganizationId(orgIdFromClass);
        }
      }
    } else {
      // Temporary workaround: use userId as organizationId for users without organizations
      if (user && (user as any).userId && !currentOrganizationId) {
        const userIdAsOrgId = (user as any).userId;
        setCurrentOrganizationId(userIdAsOrgId);
        setOrganizationName('Single User Workspace');
      }
    }
  }, [user, userClass, currentOrganizationId]);


  // Ref for ModelConfig to get current config
  const modelSectionRef = useRef<any>(null);

  // Debug function to log current state
  const logCurrentState = useCallback(() => {
    // State logging removed
  }, [selectedAgent, configuration, hasUnsavedChanges, autoSaveStatus, activeConfigTab]);

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (showVoiceChat && callStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const duration = Math.floor((now.getTime() - callStartTime.getTime()) / 1000);
        setCallDuration(duration);
      }, 1000);
    } else {
      setCallDuration(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [showVoiceChat, callStartTime]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, scrollToBottom]);

  // Add welcome message when chat sidebar opens
  useEffect(() => {
    if (showChatSidebar && selectedAgent && chatMessages.length === 0) {
      if (selectedAgent.initial_message) {
        const welcomeMessage = {
          id: 'welcome',
          type: 'bot' as const,
          message: selectedAgent.initial_message,
          timestamp: new Date()
        };
        setChatMessages([welcomeMessage]);
      }
    }
  }, [showChatSidebar, selectedAgent, chatMessages.length]);

  // Debug function to check localStorage state
  const logLocalStorageState = useCallback(() => {
}, []);
  // Removed analysis, advanced section refs

  // Fetch agents from backend with debouncing and duplicate call prevention
  const fetchAgents = useCallback(async (signal?: AbortSignal) => {
    // Prevent multiple simultaneous calls
    if (isFetchingRef.current) {
      return;
    }
    isFetchingRef.current = true;
    setAgentsError('');
    // Better check for initial load: only show full loader if we haven't loaded yet AND have no agents
    const isInitialLoad = !agentsLoaded && agents.length === 0;
    if (isInitialLoad) {
      setIsLoadingAgents(true); // Full screen spinner on initial load only
    } else {
      setIsRefreshingAgents(true); // Small spinner on refresh button
    }

    try {
      const orgName = organizationName || currentOrganizationId || 'Unknown Organization';
      const result = await agentConfigService.getAllAgents(orgName, signal);
      if (result.success) {
        if (result.data && result.data.length > 0) {
          // Transform backend data to match our Agent interface
          const transformedAgents: Agent[] = result.data.map((agent: any) => {
            // Get agent_prefix from backend (could be in name, agent_prefix, or id field)
            const agentPrefix = agent.agent_prefix || agent.name || agent.id || '';
            return {
              id: agentPrefix || `agent_${Date.now()}`, // Use agent_prefix as ID (full UUID format)
              name: getDisplayName(agent.name || agent.agent_prefix || agent.id || 'Unnamed Agent'), // Display only the agent name
              agent_prefix: agentPrefix, // Store agent_prefix for backend API calls
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
          // No agents found - update agents array to match backend
          // The loading state will prevent flickering by keeping loading spinner visible
          setAgents([]);
          setSelectedAgent(null);
        }
      } else {
        // Don't show error for 405 Method Not Allowed - it's expected
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
      // Handle abort errors gracefully
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      // Don't show 405 errors as they are expected
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
      // Clear loading states immediately - React batches state updates so agents will be set first
      setIsLoadingAgents(false);
      setIsRefreshingAgents(false);
      setAgentsLoaded(true);
      loadedOrganizationRef.current = currentOrganizationId || organizationName || '';
      isFetchingRef.current = false;
    }
  }, [currentOrganizationId, organizationName]);

  // Load configuration from selected agent
  const loadAgentConfiguration = useCallback((agent: Agent) => {
    if (agent) {
      loadConfigurationFromAgent(agent);
    }
  }, [loadConfigurationFromAgent]);

  // Load agent configuration when agent is selected
  useEffect(() => {
    if (selectedAgent) {
      loadAgentConfiguration(selectedAgent);
    }
  }, [selectedAgent, loadAgentConfiguration]);

  // Initial fetch when component mounts and organization is available
  useEffect(() => {
    const currentOrg = currentOrganizationId || organizationName;
    if (currentOrg && !agentsLoaded && !isLoadingAgents) {
      fetchAgents();
    }
  }, [currentOrganizationId, organizationName, agentsLoaded, isLoadingAgents, fetchAgents]);

  // Fetch agents when organization ID or name changes (only if not already loaded)
  useEffect(() => {
    const currentOrg = currentOrganizationId || organizationName;
    const loadedOrg = loadedOrganizationRef.current;

    if (currentOrg && !isLoadingAgents && currentOrg !== loadedOrg && agentsLoaded) {
      setAgentsLoaded(false);
      fetchAgents();
    }
  }, [currentOrganizationId, organizationName, isLoadingAgents, agentsLoaded, fetchAgents]);

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
      } else {
      }
    } else {
    }
  }, [userClass, organizationName]);

  // Refresh configuration when selectedAgent changes
  useEffect(() => {
    if (selectedAgent) {
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

    // Don't reset agentsLoaded or clear agents - just trigger refresh
    // This keeps existing agents visible during refresh (no flickering)
    fetchAgents(abortControllerRef.current.signal);
  }, [fetchAgents]);

  // Handle creating a new agent
  const handleCreateNewAgent = useCallback(() => {
    // Show agent prefix modal first
    setShowAgentPrefixModal(true);
    setAgentPrefix('');
    setIsCreatingAgent(false); // Reset loading state when opening modal
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
    // Create Dify agent and get API key immediately
    let difyApiKey = '';

    const orgId = currentOrganizationId || organizationName;
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
        modelName: 'gpt-4o',
        agentType: agentType
      });
      if (difyResult.success && difyResult.data?.appKey) {
        difyApiKey = difyResult.data.appKey;
        const difyAppId = difyResult.data.appId; // Extract app ID
        setGeneratedDifyApiKey(difyApiKey);
// Store the app ID mapping in localStorage for later use
        if (difyAppId && difyApiKey) {
          localStorage.setItem(`dify_app_id_${difyApiKey}`, difyAppId);
}
      } else {
      }
    } catch (difyError) {
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
    if (modelSectionRef.current) {
      try {
        const modelConfig = (modelSectionRef.current as any).getCurrentConfig?.();
        if (modelConfig) {
          currentSystemPrompt = modelConfig.systemPrompt || currentSystemPrompt;
          currentModelProvider = modelConfig.selectedModelProvider || currentModelProvider;
          currentModel = modelConfig.selectedModel || currentModel;
          currentModelApiKey = modelConfig.modelApiKey || currentModelApiKey;
          currentChatbotApi = modelConfig.modelLiveUrl || currentChatbotApi;
        } else {
        }
      } catch (error) {
      }
    } else {
    }
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
          api_key: '',
          model: 'gpt-4o-mini-tts',
          response_format: 'mp3',
          voice: 'alloy',
          language: 'en',
          speed: 1
        },
        elevenlabs: null
      },
      // Transcriber Configuration
      transcriberConfig: {
        provider: 'openai' as const,
        deepgram: null,
        openai: {
          api_key: '',
          model: 'gpt-4o-mini-transcribe',
          language: 'en'
        }
      },
      // Tools Configuration
      toolsConfig: {
        initialMessage: 'Hello! this is Emma, How can I help you today?',
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
    try {
      // Create the agent with all default configurations using UUID
      const result = await agentConfigService.configureAgent(agentNameUuid, completeAgentConfig);

      if (result.success) {
        // Now POST model and prompt configurations to Dify
        if (difyApiKey) {
          try {
            // Get app_id from localStorage (stored earlier when Dify agent was created)
            const appId = localStorage.getItem(`dify_app_id_${difyApiKey}`);
            if (!appId) {
            }
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
                chatbot_api_key: difyApiKey,
                app_id: appId || undefined
              })
            });

            if (modelConfigResponse.ok) {
            } else {
            }
            const promptConfigResponse = await fetch('/api/prompt-config', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-API-Key': process.env.NEXT_PUBLIC_LIVE_API_KEY || '',
              },
              body: JSON.stringify({
                prompt: currentSystemPrompt,
                chatbot_api_key: difyApiKey,
                app_id: appId || undefined
              })
            });

            if (promptConfigResponse.ok) {
              // Save the prompt to localStorage so it can be retrieved later
              try {
                const promptData = {
                  prompt: currentSystemPrompt,
                  timestamp: new Date().toISOString()
                };
                localStorage.setItem(`difyPrompt_${agentPrefix.trim()}`, JSON.stringify(promptData));
} catch (error) {
              }
            } else {
            }
          } catch (configError) {
          }
        }

        // Get Dify configuration from localStorage if available
        let difyConfig = null;
        try {
          const storedDifyConfig = localStorage.getItem(`difyConfig_${agentPrefix.trim()}`);
          if (storedDifyConfig) {
            difyConfig = JSON.parse(storedDifyConfig);
          }
        } catch (error) {
        }

        // Create the agent object for UI
        const newAgent: Agent = {
          id: agentNameUuid, // Use UUID as the ID
          name: getDisplayName(agentNameUuid), // Display only the agent name
          agent_prefix: agentNameUuid, // Store agent_prefix for backend API calls
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
// Get the actual prompt from localStorage (saved when posted to Dify)
        try {
          const savedPromptData = localStorage.getItem(`difyPrompt_${agentPrefix.trim()}`);
          if (savedPromptData) {
            const promptData = JSON.parse(savedPromptData);
            if (promptData.prompt) {
              // Update the agent's systemPrompt with the actual prompt
              newAgent.systemPrompt = promptData.prompt;
            }
          }
        } catch (error) {
        }

        // Add the new agent to the agents list
        setAgents(prev => [...prev, newAgent]);
        setSelectedAgent(newAgent);

        // Configuration will be loaded automatically by the centralized state

        // Refresh agents list to get the actual chatbot_key from backend
        setTimeout(async () => {
          try {
            await fetchAgents();
          } catch (error) {
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
        alert(`❌ Failed to create agent: ${result.message}`);
      }
    } catch (error) {
      alert(`❌ Error creating agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Reset loading state
    setIsCreatingAgent(false);
  }, [agentPrefix, currentOrganizationId, organizationName, userClass]);

  // Handle selecting an agent (view mode)
  const handleSelectAgent = useCallback((agent: Agent) => {
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
    setSelectedAgent(agent);
    setIsEditing(true);
    setIsCreating(false);
    setShowAgentCards(false); // Switch to configuration view

    // Configuration will be loaded automatically by the centralized state

    setActiveConfigTab('model'); // Start with model configuration
  }, []);

  // Handle opening agent in new tab
  const handleOpenAgent = useCallback((agent: Agent) => {
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
          difyApiUrl: selectedAgent.chatbot_api || process.env.NEXT_PUBLIC_CHATBOT_API_URL ,
          difyApiKey: selectedAgent.chatbot_key,
          message: messageToSend,
          conversationId: conversationId, // Use existing conversation ID for context
          useStreaming: true // Use streaming mode like the working chatbot
        }),
      });

      const data = await response.json();

      if (response.ok && data.answer) {
        // Update conversation ID if provided
        if (data.conversationId) {
          setConversationId(data.conversationId);
        }

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
          message: data.error || 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot' as const,
        message: error instanceof Error ? error.message : 'Sorry, there was an error connecting to the chatbot. Please check your API configuration.',
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
    setConversationId('');

    // Add welcome message if available
    if (selectedAgent?.initial_message) {
      const welcomeMessage = {
        id: 'welcome',
        type: 'bot' as const,
        message: selectedAgent.initial_message,
        timestamp: new Date()
      };
      setChatMessages([welcomeMessage]);
    }
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
      // Convert language name to code (same logic as 11Labs)
      const cartesiaReverseLanguageMapping: { [key: string]: string } = {
        'Arabic': 'ar',
        'Bengali': 'bn',
        'Bulgarian': 'bg',
        'Chinese': 'zh',
        'Croatian': 'hr',
        'Czech': 'cs',
        'Danish': 'da',
        'Dutch': 'nl',
        'English': 'en',
        'Finnish': 'fi',
        'French': 'fr',
        'German': 'de',
        'Greek': 'el',
        'Gujarati': 'gu',
        'Hebrew': 'he',
        'Hindi': 'hi',
        'Hungarian': 'hu',
        'Indonesian': 'id',
        'Italian': 'it',
        'Japanese': 'ja',
        'Kannada': 'kn',
        'Korean': 'ko',
        'Malay': 'ms',
        'Malayalam': 'ml',
        'Marathi': 'mr',
        'Norwegian': 'no',
        'Polish': 'pl',
        'Portuguese': 'pt',
        'Punjabi': 'pa',
        'Romanian': 'ro',
        'Russian': 'ru',
        'Slovak': 'sk',
        'Spanish': 'es',
        'Swedish': 'sv',
        'Tagalog': 'tl',
        'Tamil': 'ta',
        'Telugu': 'te',
        'Thai': 'th',
        'Turkish': 'tr',
        'Ukrainian': 'uk',
        'Vietnamese': 'vi'
      };
      const languageCode = cartesiaReverseLanguageMapping[uiConfig.selectedLanguage] || 'en';
      
      backendConfig.cartesian = {
        voice_id: uiConfig.voiceId || '',
        tts_api_key: uiConfig.apiKey || '',
        model: uiConfig.selectedModel || 'sonic-2',
        speed: uiConfig.speedValue || 1.0,
        language: languageCode,
        gender: uiConfig.cartesiaSelectedGender || ''
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
        voice_id: uiConfig.voiceId || '',
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
        initial_message: tools?.initialMessage || selectedAgent.initial_message || 'Hello! this is Emma, How can I help you today?',
        nudge_text: tools?.nudgeText || selectedAgent.nudge_text || 'Hello, Are you still there?',
        nudge_interval: tools?.nudgeInterval ?? selectedAgent.nudge_interval ?? 15,
        max_nudges: tools?.maxNudges ?? selectedAgent.max_nudges ?? 3,
        typing_volume: tools?.typingVolume ?? selectedAgent.typing_volume ?? 0.8,
        max_call_duration: tools?.maxCallDuration ?? selectedAgent.max_call_duration ?? 1200,
        tts_config: backendVoiceConfig || undefined,
        stt_config: backendTranscriberConfig || undefined,
        chatbot_api: model?.chatbot_api || selectedAgent.chatbot_api,
        chatbot_key: model?.chatbot_key || selectedAgent.chatbot_key,
        system_prompt: model?.systemPrompt || model?.firstMessage || selectedAgent.systemPrompt || selectedAgent.initial_message
      } as any;
      const result = await agentConfigService.configureAgent(selectedAgent.id, completeConfig);

      if (result.success) {
        // Save configuration to backend
        await saveConfiguration();
        // Refresh list to reflect latest server state
        await fetchAgents();
      } else {
      }
    } catch (err) {
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
    setIsEditing(false);
    setIsCreating(false);

    // Refresh the agents list to get the updated data
    try {
      await fetchAgents();
    } catch (error) {
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
          setSelectedAgent(updatedAgent);

          // Configuration will be updated automatically by the centralized state
        } else {
        }
      }
    }
  }, [agents, selectedAgent]);

  // Refresh agent configuration after updates
  const refreshAgentConfiguration = useCallback((agent: Agent) => {
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
      // Preserve API keys from MongoDB - they should be loaded if user saved them
      voiceConfig: agent.tts_config && (
        (agent.tts_config.cartesian && Object.values(agent.tts_config.cartesian).some(v => v !== null && v !== undefined)) ||
        (agent.tts_config.openai && Object.values(agent.tts_config.openai).some(v => v !== null && v !== undefined)) ||
        (agent.tts_config.elevenlabs && Object.values(agent.tts_config.elevenlabs).some(v => v !== null && v !== undefined))
      ) ? agent.tts_config : null,
      // Transcriber config data - preserve API keys from MongoDB
      transcriberConfig: agent.stt_config || null,
      // Widget config data
      widgetConfig: {
        difyApiUrl: agent.chatbot_api ? agent.chatbot_api.replace('/chat-messages', '') : (process.env.NEXT_PUBLIC_DIFY_BASE_URL || process.env.NEXT_PUBLIC_CHATBOT_API_URL?.replace('/chat-messages', '') || ''),
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
        try {
          const difyResult = await difyAgentService.deleteDifyAgent({
            agentName: agentToDelete.id, // Use UUID for Dify deletion
            organizationId: currentOrganizationId,
            // Note: We don't have the appId stored, but the script can still attempt cleanup
          });
          if (difyResult.success) {
          } else {
          }
        } catch (difyError) {
        }
      } else {
      }

      // Delete the agent from the backend
      const result = await agentConfigService.deleteAgentByName(agentToDelete.id);
      if (result.success) {
        // Remove agent from local state
        setAgents(prev => prev.filter(a => a.id !== agentToDelete.id));
        if (selectedAgent?.id === agentToDelete.id) {
          setSelectedAgent(null);
        }
      } else {
      }
    } catch (error) {
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

  // Function to handle tab clicks
  const handleTabClick = useCallback((tabId: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    setActiveConfigTab(tabId);
    setIsDropdownOpen(false); // Close dropdown on mobile
  }, []);


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

  // Fallback timeout to prevent infinite loading (increased to prevent premature clearing)
  useEffect(() => {
    if (isLoadingAgents) {
      const fallbackTimeout = setTimeout(() => {
        setIsLoadingAgents(false);
        setAgentsLoaded(true);
        isFetchingRef.current = false;
      }, 10000); // 10 second timeout - increased from 200ms to prevent flickering

      return () => clearTimeout(fallbackTimeout);
    }
  }, [isLoadingAgents]);

  // Manual refresh function for agent configuration
  const refreshSelectedAgentConfig = useCallback(async () => {
    if (!selectedAgent) return;
    setIsRefreshingAgents(true);

    try {
      const orgName = organizationName || currentOrganizationId || 'Unknown Organization';
      const result = await agentConfigService.getAllAgents(orgName);
      if (result.success && result.data) {
        const updatedAgent = result.data.find((a: any) => a.name === selectedAgent.name);
        if (updatedAgent) {
          // Transform the agent data
          const agentPrefix = updatedAgent.agent_prefix || updatedAgent.name || updatedAgent.id || '';
          const transformedAgent: Agent = {
            id: agentPrefix || `agent_${Date.now()}`,
            name: getDisplayName(updatedAgent.name || updatedAgent.agent_prefix || updatedAgent.id || 'Unnamed Agent'),
            agent_prefix: agentPrefix, // Store agent_prefix for backend API calls
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
        }
      } else {
      }
    } catch (error) {
    } finally {
      setIsRefreshingAgents(false);
    }
  }, [selectedAgent?.name, organizationName, currentOrganizationId]);

  const configTabs = useMemo(() => [
    { id: 'model', label: 'Model', icon: Bot, color: 'from-green-500 to-emerald-600' },
    { id: 'voice', label: 'Voice & Transcriber', icon: Mic, color: 'from-green-500 to-teal-600' },
    { id: 'tools', label: 'Configurations', icon: Wrench, color: 'from-gray-600 to-gray-800' },
    { id: 'widget', label: 'Widget', icon: Code, color: 'from-green-500 to-emerald-600' },
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
            agentsLoaded={agentsLoaded}
            organizationId={organizationName || currentOrganizationId || undefined}
          />
        </div>

        {/* Agent Prefix Modal */}
        {showAgentPrefixModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`p-8 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              }`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'}`}>
                  <svg className={`w-6 h-6 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Create New Agent
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Configure your AI agent for optimal performance
                  </p>
                </div>
              </div>

              {/* Agent Type Selection */}
              <div className="mb-6">
                <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Agent Configuration
                </label>
                <div className="space-y-3">
                  <div className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${agentType === 'Knowledge Agent (RAG)'
                    ? isDarkMode
                      ? 'border-green-500 bg-green-900/20'
                      : 'border-green-500 bg-green-50'
                    : isDarkMode
                      ? 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                    }`} onClick={() => setAgentType('Knowledge Agent (RAG)')}>
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${agentType === 'Knowledge Agent (RAG)'
                        ? 'border-green-500 bg-green-500'
                        : isDarkMode ? 'border-gray-500' : 'border-gray-300'
                        }`}>
                        {agentType === 'Knowledge Agent (RAG)' && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Knowledge Agent
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'
                            }`}>
                            RAG
                          </span>
                        </div>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Specialized for information retrieval, document analysis, and knowledge-based Q&A with advanced search capabilities
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <span className={`flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Document Search
                          </span>
                          <span className={`flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Q&A Engine
                          </span>
                          <span className={`flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Blocking Mode
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${agentType === 'Action Agent (AI Employee)'
                    ? isDarkMode
                      ? 'border-green-500 bg-green-900/20'
                      : 'border-green-500 bg-green-50'
                    : isDarkMode
                      ? 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                    }`} onClick={() => setAgentType('Action Agent (AI Employee)')}>
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${agentType === 'Action Agent (AI Employee)'
                        ? 'border-green-500 bg-green-500'
                        : isDarkMode ? 'border-gray-500' : 'border-gray-300'
                        }`}>
                        {agentType === 'Action Agent (AI Employee)' && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Action Agent
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'
                            }`}>
                            AI Employee
                          </span>
                        </div>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Intelligent assistant capable of task execution, tool integration, and complex workflow automation
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <span className={`flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Function Calling
                          </span>
                          <span className={`flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Tool Integration
                          </span>
                          <span className={`flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Streaming Mode
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Agent Identifier Input */}
              <div className="mb-6">
                <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Agent Identifier
                </label>
                <div className="relative">
                  <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none`}>
                    <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={agentPrefix}
                    onChange={(e) => setAgentPrefix(e.target.value)}
                    placeholder="e.g., customer-support, sales-automation"
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-gray-50'
                      }`}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAgentPrefixSubmit();
                      }
                    }}
                  />
                </div>
                <div className="mt-2 flex items-start gap-2">
                  <svg className={`w-4 h-4 mt-0.5 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className={`text-xs ${isDarkMode ? 'text-amber-200' : 'text-amber-700'}`}>
                    <span className="font-medium">Requirements:</span> 3-50 characters, lowercase letters, numbers, and underscores only. This will be used as your agent's unique identifier.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowAgentPrefixModal(false);
                    setAgentPrefix('');
                    setAgentType('Knowledge Agent (RAG)');
                  }}
                  className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                    }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAgentPrefixSubmit}
                  disabled={!agentPrefix.trim() || isCreatingAgent}
                  className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${isCreatingAgent
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                    }`}
                >
                  {isCreatingAgent ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Agent...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create Agent
                    </>
                  )}
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
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-green-600 text-white hover:bg-green-700"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Chat
                      </button>
                    )}
                    {/* Call Controls - Time Counter and Mute */}
                    {showVoiceChat && !isConnectingToAgent && (
                      <>
                        {/* Time Counter */}
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                          <span className="font-mono">
                            {Math.floor(callDuration / 60).toString().padStart(2, '0')}:
                            {(callDuration % 60).toString().padStart(2, '0')}
                          </span>
                        </div>

                        {/* Mute Button */}
                        <button
                          onClick={() => setIsMuted(!isMuted)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isMuted
                            ? 'bg-red-100 text-red-800 border border-red-200 hover:bg-red-200'
                            : 'bg-green-100 text-green-800 border border-green-200 hover:bg-green-200'
                            }`}
                        >
                          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                          {isMuted ? 'Unmute' : 'Mute'}
                        </button>
                      </>
                    )}

                    {selectedAgent && (
                      <button
                        onClick={() => {
                          if (showVoiceChat) {
                            setEndVoiceCall(true);
                            setShowVoiceChat(false);
                            setIsConnectingToAgent(false);
                            setCallStartTime(null);
                            setCallDuration(0);
                            setIsMuted(false);
                            // Reset end call flag after a brief delay
                            setTimeout(() => setEndVoiceCall(false), 100);
                          } else {
                            // Start voice chat immediately
                            setShowVoiceChat(true);
                            setStartVoiceCall(true);
                            setCallStartTime(new Date());
                            setIsMuted(false);
                            // Reset start call flag after a longer delay to ensure useEffect catches it
                            setTimeout(() => setStartVoiceCall(false), 500);

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
                        agentName={selectedAgent.agent_prefix || selectedAgent.id}
                        isDarkMode={isDarkMode}
                        startCall={startVoiceCall}
                        endCall={endVoiceCall}
                        isMuted={isMuted}
                      />
                    )}
                    {selectedAgent && (
                      <button
                        onClick={handleUpdateAgent}
                        disabled={isUpdatingAgent}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isUpdatingAgent
                          ? 'bg-gray-400 text-white opacity-60 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
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
                            href="javascript:void(0)"
                            onClick={(e) => handleTabClick(tab.id, e)}
                            className={`flex items-center gap-2 px-4 py-2 text-sm ${activeConfigTab === tab.id
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
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
                        href="javascript:void(0)"
                        onClick={(e) => handleTabClick(tab.id, e)}
                        className={`
                          ${activeConfigTab === tab.id
                            ? `border-green-500 text-green-600 ${isDarkMode ? 'dark:text-green-400' : ''}`
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
                    agentName={selectedAgent.name}
                    onConfigChange={(config) => updateConfiguration('voice', config)}
                    onTranscriberConfigChange={(config) => updateConfiguration('transcriber', config)}
                    isEditing={isEditing}
                    // Add these props to pass centralized configuration
                    voiceConfiguration={configuration.voice}
                    transcriberConfiguration={configuration.transcriber}
                    // Pass agent's MongoDB config to check for saved API keys
                    agentTtsConfig={selectedAgent.tts_config}
                    agentSttConfig={selectedAgent.stt_config}
                  />
                )}
                {activeConfigTab === 'widget' && (
                  <>
                    <WidgetConfig
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
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 via-emerald-600 to-emerald-600 shadow-lg">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h5 className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
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
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-700 mb-4 inline-block">
                      <MessageSquare className="h-12 w-12 text-green-500 dark:text-green-400" />
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
                      className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-xl shadow-sm transition-all duration-200 group-hover:shadow-md ${message.type === 'user'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-br-md'
                        : isDarkMode
                          ? 'bg-gray-800 text-gray-100 rounded-bl-md border border-gray-700'
                          : 'bg-gray-50 text-gray-900 rounded-bl-md border border-gray-200'
                        }`}
                    >
                      <div className={`text-sm leading-relaxed ${message.type === 'user' ? 'text-white' : isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.message}
                        </ReactMarkdown>
                      </div>
                      <p className={`text-xs mt-1.5 ${message.type === 'user' ? 'text-green-100' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className={`max-w-xs px-4 py-2.5 rounded-xl ${isDarkMode ? 'bg-gray-800 text-gray-100 border border-gray-700' : 'bg-gray-50 text-gray-900 border border-gray-200'
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
              <div ref={messagesEndRef} />
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
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:scale-105'
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