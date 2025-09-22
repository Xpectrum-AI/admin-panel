'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Bot, Settings, Mic, Wrench, BarChart3, MessageSquare, Sparkles, Zap, Activity, Search, RefreshCw, Trash2, ChevronDown, Loader2, Code, CheckCircle } from 'lucide-react';

import ModelConfig from './config/ModelConfig';
import VoiceConfig from './config/VoiceConfig';
import ToolsConfig from './config/ToolsConfig';
import WidgetConfig from './config/WidgetConfig';

import { agentConfigService } from '../../service/agentConfigService';
import { difyAgentService } from '../../service/difyAgentService';
import { useAuthInfo } from '@propelauth/react';
import { useTheme } from '../contexts/ThemeContext';

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

  const [activeConfigTab, setActiveConfigTab] = useState('model');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showAgentPrefixModal, setShowAgentPrefixModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [agentPrefix, setAgentPrefix] = useState('');
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [deletingAgentId, setDeletingAgentId] = useState<string | null>(null);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
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
  const selectedAgentIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Configuration state for all components
  const [modelConfig, setModelConfig] = useState<any>(null);
  const [voiceConfig, setVoiceConfig] = useState<any>(null);
  const [transcriberConfig, setTranscriberConfig] = useState<any>(null);
  const [widgetConfig, setWidgetConfig] = useState<any>(null);

  // Initialize organization ID from user context
  useEffect(() => {
    console.log('🔍 Setting organization ID from user context:', { user, userClass });

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
      if (orgs.length > 0) {
        const org = orgs[0] as any;
        const orgIdFromClass = org.orgId || org.id || '';
        if (orgIdFromClass && orgIdFromClass !== currentOrganizationId) {
          console.log('✅ Setting organization ID from userClass:', orgIdFromClass);
          setCurrentOrganizationId(orgIdFromClass);
        }
      }
    }
  }, [user, userClass, currentOrganizationId]);


  // Refs for scrolling to sections
  const modelSectionRef = useRef<HTMLDivElement>(null);
  const voiceSectionRef = useRef<HTMLDivElement>(null);
  const widgetSectionRef = useRef<HTMLDivElement>(null);
  const toolsSectionRef = useRef<HTMLDivElement>(null);
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
          // Transform backend data to match our Agent interface
          const transformedAgents: Agent[] = result.data.map((agent: any) => ({
            id: agent.name || agent.id || `agent-${Date.now()}`,
            name: agent.name || 'Unnamed Agent',
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
          }));

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
  }, [currentOrganizationId, organizationName, agents, agentsLoaded]);

  // Load configurations from localStorage
  const loadConfigurationsFromStorage = useCallback(() => {
    try {
      // Load voice config
      const savedVoiceConfig = localStorage.getItem('voiceConfigState');
      if (savedVoiceConfig) {
        const parsedVoiceConfig = JSON.parse(savedVoiceConfig);
        setVoiceConfig(parsedVoiceConfig);
        console.log('Loaded voice config from localStorage:', parsedVoiceConfig);
      }

      // Load transcriber config
      const savedTranscriberConfig = localStorage.getItem('transcriberConfigState');
      if (savedTranscriberConfig) {
        const parsedTranscriberConfig = JSON.parse(savedTranscriberConfig);
        setTranscriberConfig(parsedTranscriberConfig);
        console.log('Loaded transcriber config from localStorage:', parsedTranscriberConfig);
      }

      // Load model config
      const savedModelConfig = localStorage.getItem('modelConfigState');
      if (savedModelConfig) {
        const parsedModelConfig = JSON.parse(savedModelConfig);
        setModelConfig(parsedModelConfig);
        console.log('Loaded model config from localStorage:', parsedModelConfig);
      }

      // Load widget config
      const savedWidgetConfig = localStorage.getItem('widgetConfigState');
      if (savedWidgetConfig) {
        const parsedWidgetConfig = JSON.parse(savedWidgetConfig);
        setWidgetConfig(parsedWidgetConfig);
        console.log('Loaded widget config from localStorage:', parsedWidgetConfig);
      }
    } catch (error) {
      console.warn('Failed to load configurations from localStorage:', error);
    }
  }, []);

  // Load configurations from localStorage on mount
  useEffect(() => {
    loadConfigurationsFromStorage();
  }, [loadConfigurationsFromStorage]);

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

      // Only update if the configurations are actually different to prevent loops
      if (selectedAgent.initial_message && (!modelConfig || modelConfig.firstMessage !== selectedAgent.initial_message)) {
        const modelConfigData = { firstMessage: selectedAgent.initial_message };
        setModelConfig(modelConfigData);
        console.log('Updated model config:', modelConfigData);
      }

      if (selectedAgent.tts_config && JSON.stringify(voiceConfig) !== JSON.stringify(selectedAgent.tts_config)) {
        console.log('Updated voice config:', selectedAgent.tts_config);
        setVoiceConfig(selectedAgent.tts_config);
      }

      if (selectedAgent.stt_config && JSON.stringify(transcriberConfig) !== JSON.stringify(selectedAgent.stt_config)) {
        console.log('Updated transcriber config:', selectedAgent.stt_config);
        setTranscriberConfig(selectedAgent.stt_config);
      }
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
    // Show agent prefix modal first
    setShowAgentPrefixModal(true);
    setAgentPrefix('');
    setIsCreatingAgent(false); // Reset loading state when opening modal
  }, []);

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

    // Create Dify agent and get API key immediately
    console.log('🚀 Creating Dify agent for new agent:', agentPrefix.trim());
    let difyApiKey = '';

    try {
      const difyResult = await difyAgentService.createDifyAgent({
        agentName: agentPrefix.trim(),
        organizationId: currentOrganizationId || organizationName,
        modelProvider: 'langgenius/openai/openai',
        modelName: 'gpt-4o'
      });

      console.log('📋 Dify creation result:', difyResult);

      if (difyResult.success && difyResult.data?.appKey) {
        difyApiKey = difyResult.data.appKey;
        setGeneratedDifyApiKey(difyApiKey);
        console.log('✅ Dify agent created successfully with API key:', difyApiKey.substring(0, 10) + '...');
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

    // Create agent with default configurations
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
1. **Appointment Scheduling**: Help callers book new appointments
2. **Appointment Management**: Confirm, reschedule, or cancel existing appointments
3. **Service Information**: Provide details about available services and providers
4. **Calendar Navigation**: Check availability and suggest optimal time slots
5. **Patient Support**: Address questions about appointments, policies, and procedures

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

    const defaultConfig = {
      // Model Configuration
      modelConfig: {
        selectedModelProvider: 'OpenAI',
        selectedModel: 'GPT-4o',
        modelLiveUrl: process.env.NEXT_PUBLIC_DIFY_BASE_URL || '',
        modelApiKey: difyApiKey || process.env.NEXT_PUBLIC_MODEL_OPEN_AI_API_KEY || '',
        systemPrompt: defaultSystemPrompt
      },
      // Voice Configuration
      voiceConfig: {
        provider: 'openai' as const,
        openai: {
          api_key: process.env.NEXT_PUBLIC_OPEN_AI_API_KEY || '',
          voice: 'alloy',
          response_format: 'mp3',
          quality: 'standard',
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
      // Create the agent with all default configurations
      const result = await agentConfigService.configureAgent(agentPrefix.trim(), completeAgentConfig);

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
                model: 'gpt-4o',
                api_key: process.env.NEXT_PUBLIC_MODEL_OPEN_AI_API_KEY || '',
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
                prompt: defaultSystemPrompt,
                chatbot_api_key: difyApiKey
              })
            });

            if (promptConfigResponse.ok) {
              console.log('✅ Prompt configuration posted to Dify successfully');

              // Save the prompt to localStorage so it can be retrieved later
              try {
                const promptData = {
                  prompt: defaultSystemPrompt,
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

        // Create the agent object for UI
        const newAgent: Agent = {
          id: agentPrefix.trim(),
          name: agentPrefix.trim(),
          status: 'active',
          avatar: '🤖',
          description: 'AI Agent - Ready to use',
          model: 'GPT-4o',
          provider: 'OpenAI',
          cost: '~$0.15/min',
          latency: '~1050ms',
          organization_id: orgName,
          chatbot_api: difyApiKey ? process.env.NEXT_PUBLIC_CHATBOT_API_URL : undefined,
          chatbot_key: difyApiKey || undefined,
          modelApiKey: difyApiKey || undefined,
          systemPrompt: defaultSystemPrompt, // Set initial prompt
          initial_message: defaultConfig.toolsConfig.initialMessage,
          nudge_text: defaultConfig.toolsConfig.nudgeText,
          nudge_interval: defaultConfig.toolsConfig.nudgeInterval,
          max_nudges: defaultConfig.toolsConfig.maxNudges,
          typing_volume: defaultConfig.toolsConfig.typingVolume,
          max_call_duration: defaultConfig.toolsConfig.maxCallDuration,
          tts_config: defaultConfig.voiceConfig,
          stt_config: defaultConfig.transcriberConfig
        };

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

        // Set the configurations for the UI
        setModelConfig(defaultConfig.modelConfig);
        setVoiceConfig(defaultConfig.voiceConfig);
        setTranscriberConfig(defaultConfig.transcriberConfig);

        // Show success message
        setShowSuccessModal(true);

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
    setSelectedAgent(agent);
    setIsEditing(false); // Always start in view mode when selecting
    setIsCreating(false);

    // Pre-populate configuration with existing agent data
    if (agent.initial_message) {
      const modelConfigData = { firstMessage: agent.initial_message };
      setModelConfig(modelConfigData);
      console.log('Set model config:', modelConfigData);
    }

    if (agent.tts_config) {
      console.log('Setting voice config from agent:', agent.tts_config);
      setVoiceConfig(agent.tts_config);
    }

    if (agent.stt_config) {
      console.log('Setting transcriber config from agent:', agent.stt_config);
      setTranscriberConfig(agent.stt_config);
    }

    setActiveConfigTab('model'); // Start with model configuration
  }, []);

  // Handle editing an existing agent
  const handleEditAgent = useCallback((agent: Agent) => {
    console.log('Editing agent:', agent);
    setSelectedAgent(agent);
    setIsEditing(true);
    setIsCreating(false);

    // Pre-populate configuration with existing agent data
    if (agent.initial_message) {
      const modelConfigData = { firstMessage: agent.initial_message };
      setModelConfig(modelConfigData);
      console.log('Set model config:', modelConfigData);
    }

    if (agent.tts_config) {
      console.log('Setting voice config from agent:', agent.tts_config);
      setVoiceConfig(agent.tts_config);
    }

    if (agent.stt_config) {
      console.log('Setting transcriber config from agent:', agent.stt_config);
      setTranscriberConfig(agent.stt_config);
    }

    setActiveConfigTab('model'); // Start with model configuration
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
      if (updatedAgent && updatedAgent !== selectedAgent) {
        console.log('🔄 Updating selected agent with fresh data from agents list:', updatedAgent);
        setSelectedAgent(updatedAgent);

        // Update configuration state with fresh data
        if (updatedAgent.initial_message) {
          const modelConfigData = { firstMessage: updatedAgent.initial_message };
          setModelConfig(modelConfigData);
          console.log('Updated model config:', modelConfigData);
        }

        if (updatedAgent.tts_config) {
          console.log('Updated voice config:', updatedAgent.tts_config);
          setVoiceConfig(updatedAgent.tts_config);
        }

        if (updatedAgent.stt_config) {
          console.log('Updated transcriber config:', updatedAgent.stt_config);
          setTranscriberConfig(updatedAgent.stt_config);
        }
      }
    }
  }, [agents, selectedAgent]);

  // Refresh agent configuration after updates
  const refreshAgentConfiguration = useCallback((agent: Agent) => {
    console.log('🔄 Refreshing agent configuration:', agent);

    // Update the selected agent
    setSelectedAgent(agent);

    // Update configuration state
    if (agent.initial_message) {
      const modelConfigData = { firstMessage: agent.initial_message };
      setModelConfig(modelConfigData);
      console.log('Updated model config:', modelConfigData);
    }

    if (agent.tts_config) {
      console.log('Updated voice config:', agent.tts_config);
      setVoiceConfig(agent.tts_config);
    }

    if (agent.stt_config) {
      console.log('Updated transcriber config:', agent.stt_config);
      setTranscriberConfig(agent.stt_config);
    }

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
        selectedModelProvider: agent.provider || 'OpenAI',
        selectedModel: agent.model || 'GPT-4o',
        modelApiKey: agent.modelApiKey || agent.chatbot_key || '',
        modelLiveUrl: agent.chatbot_api || process.env.NEXT_PUBLIC_MODEL_API_BASE_URL || '',
        chatbot_api: agent.chatbot_api || '', // Include chatbot_api for ModelConfig
        chatbot_key: agent.chatbot_key // Include chatbot_key for proper identification
      },
      // Voice config data - pass the raw backend config directly
      voiceConfig: agent.tts_config || null,
      // Transcriber config data - pass the raw backend config directly
      transcriberConfig: agent.stt_config || null,
      // Widget config data
      widgetConfig: {
        difyApiUrl: agent.chatbot_api ? agent.chatbot_api.replace('/chat-messages', '') : process.env.NEXT_PUBLIC_DIFY_BASE_URL || 'https://d22yt2oewbcglh.cloudfront.net/v1',
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

  // Handle configuration changes from child components
  const handleModelConfigChange = useCallback((config: any) => {
    setModelConfig(config);
    // Save to localStorage
    try {
      localStorage.setItem('modelConfigState', JSON.stringify(config));
      console.log('Model config saved to localStorage:', config);
    } catch (error) {
      console.warn('Failed to save model config to localStorage:', error);
    }
    // Don't update selectedAgent here to avoid infinite loops
    console.log('Model config changed:', config);
  }, []);

  const handleVoiceConfigChange = useCallback((config: any) => {
    setVoiceConfig(config);
    // Save to localStorage
    try {
      localStorage.setItem('voiceConfigState', JSON.stringify(config));
      console.log('Voice config saved to localStorage:', config);
    } catch (error) {
      console.warn('Failed to save voice config to localStorage:', error);
    }
    // Don't update selectedAgent here to avoid infinite loops
    console.log('Voice config changed:', config);
  }, []);

  const handleTranscriberConfigChange = useCallback((config: any) => {
    setTranscriberConfig(config);
    // Save to localStorage
    try {
      localStorage.setItem('transcriberConfigState', JSON.stringify(config));
      console.log('Transcriber config saved to localStorage:', config);
    } catch (error) {
      console.warn('Failed to save transcriber config to localStorage:', error);
    }
    // Don't update selectedAgent here to avoid infinite loops
    console.log('Transcriber config changed:', config);
  }, []);

  const handleWidgetConfigChange = useCallback((config: any) => {
    setWidgetConfig(config);
    // Save to localStorage
    try {
      localStorage.setItem('widgetConfigState', JSON.stringify(config));
      console.log('Widget config saved to localStorage:', config);
    } catch (error) {
      console.warn('Failed to save widget config to localStorage:', error);
    }
    // Don't update selectedAgent here to avoid infinite loops
    console.log('Widget config changed:', config);
  }, []);

  const handleToolsConfigChange = useCallback((config: any) => {
    // Don't update selectedAgent here to avoid infinite loops
    console.log('Tools config changed:', config);
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
        console.log('🗑️ Deleting Dify agent for:', agentToDelete.name);
        try {
          const difyResult = await difyAgentService.deleteDifyAgent({
            agentName: agentToDelete.name,
            organizationId: currentOrganizationId,
            // Note: We don't have the appId stored, but the script can still attempt cleanup
          });

          if (difyResult.success) {
            console.log('✅ Dify agent deleted successfully');
          } else {
            console.warn('⚠️ Dify agent deletion failed, continuing with backend deletion:', difyResult.error);
          }
        } catch (difyError) {
          console.warn('⚠️ Dify agent deletion error, continuing with backend deletion:', difyError);
        }
      }

      // Delete the agent from the backend
      const result = await agentConfigService.deleteAgent(agentToDelete.name, currentOrganizationId);
      if (result.success) {
        // Remove agent from local state
        setAgents(prev => prev.filter(a => a.id !== agentToDelete.id));
        if (selectedAgent?.id === agentToDelete.id) {
          setSelectedAgent(null);
        }
        console.log(`Agent "${agentToDelete.name}" deleted successfully`);
        alert(`Agent "${agentToDelete.name}" deleted successfully`);
      } else {
        console.error('Failed to delete agent:', result.message);
        alert(`Failed to delete agent: ${result.message}`);
      }
    } catch (error) {
      console.error('Error deleting agent:', error);
      alert('Error deleting agent. Please try again.');
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
    // Save current configurations before switching tabs
    if (activeConfigTab === 'voice' && voiceConfig) {
      // Ensure voice config is saved
      console.log('Saving voice config before tab switch:', voiceConfig);
    }

    setActiveConfigTab(tabId);
    setIsDropdownOpen(false); // Close dropdown on mobile

    // Refresh configurations from localStorage when switching tabs
    setTimeout(() => {
      loadConfigurationsFromStorage();
    }, 50);

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
  }, [activeConfigTab, loadConfigurationsFromStorage]); // Add loadConfigurationsFromStorage to dependencies


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

    try {
      const result = await agentConfigService.getAllAgents(currentOrganizationId);
      if (result.success && result.data) {
        const updatedAgent = result.data.find((a: any) => a.name === selectedAgent.name);
        if (updatedAgent) {
          console.log('✅ Found updated agent, refreshing configuration:', updatedAgent);

          // Transform the agent data
          const transformedAgent: Agent = {
            id: updatedAgent.name || updatedAgent.id || `agent-${Date.now()}`,
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

          // Update configuration state with new values
          if (transformedAgent.initial_message) {
            const modelConfigData = { firstMessage: transformedAgent.initial_message };
            setModelConfig(modelConfigData);
            console.log('🔄 Updated model config:', modelConfigData);
          }

          if (transformedAgent.tts_config) {
            console.log('🔄 Updated voice config:', transformedAgent.tts_config);
            setVoiceConfig(transformedAgent.tts_config);
          }

          if (transformedAgent.stt_config) {
            console.log('🔄 Updated transcriber config:', transformedAgent.stt_config);
            setTranscriberConfig(transformedAgent.stt_config);
          }
        }
      }
    } catch (error) {
      console.error('Error manually refreshing agent configuration:', error);
    }
  }, [selectedAgent?.name]);

  const configTabs = useMemo(() => [
    { id: 'model', label: 'Model', icon: Bot, color: 'from-blue-500 to-purple-600' },
    { id: 'voice', label: 'Voice & Transcriber', icon: Mic, color: 'from-green-500 to-teal-600' },
    { id: 'tools', label: 'Configurations', icon: Wrench, color: 'from-gray-600 to-gray-800' },
    { id: 'widget', label: 'Widget', icon: Code, color: 'from-purple-500 to-pink-600' },
  ], []);

  return (
    <>
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="w-full h-full max-w-full mx-auto p-2 sm:p-4 lg:p-6 min-h-0 overflow-hidden">
        <div className={`rounded-xl sm:rounded-2xl border shadow-xl backdrop-blur-sm h-full flex flex-col max-h-full ${isDarkMode ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-gray-700/50' : 'bg-gradient-to-br from-white via-gray-50 to-white border-gray-200/50'}`}>
          {/* Header */}
          <div className={`p-3 sm:p-4 lg:p-6 xl:p-8 border-b rounded-t-xl sm:rounded-t-2xl flex-shrink-0 ${isDarkMode ? 'border-gray-700/50 bg-gradient-to-r from-green-900/20 to-emerald-900/20' : 'border-gray-200/50 bg-gradient-to-r from-green-50 to-emerald-50'}`}>
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="space-y-1 sm:space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg sm:rounded-xl flex-shrink-0">
                      <Bot className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                    </div>
                    <h2 className={`text-xl sm:text-2xl lg:text-3xl font-bold bg-clip-text text-transparent truncate ${isDarkMode ? 'bg-gradient-to-r from-white to-gray-300' : 'bg-gradient-to-r from-gray-900 to-gray-700'}`}>
                      AI Agents
                    </h2>
                  </div>
                </div>
                {organizationName && (
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <span className={`text-sm sm:text-base font-medium px-2 sm:px-3 py-1 sm:py-2 rounded-lg ${isDarkMode
                      ? 'bg-gray-700 text-gray-200 border border-gray-600'
                      : 'bg-gray-100 text-gray-700 border border-gray-300'
                      }`}>
                      {organizationName}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  <button
                    onClick={handleRefreshAgents}
                    disabled={isLoadingAgents || isRefreshingAgents}
                    className={`group relative px-2 sm:px-3 lg:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-1 sm:gap-2 text-xs sm:text-sm lg:text-base ${isDarkMode
                      ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-gray-300 hover:from-gray-600 hover:to-gray-700'
                      : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300'
                      }`}
                  >
                    <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 ${(isLoadingAgents || isRefreshingAgents) ? 'animate-spin' : ''}`} />
                    <span className="font-semibold hidden sm:inline">Refresh</span>
                  </button>
                  <button
                    onClick={handleCreateNewAgent}
                    className="group relative px-3 sm:px-4 lg:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg sm:rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-1 sm:gap-2 lg:gap-3 text-xs sm:text-sm lg:text-base"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-lg sm:rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                    <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                    <span className="font-semibold">Create Agent</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
            {/* Left Sidebar - Agent List */}
            <div className={`w-full lg:w-80 xl:w-96 border-b lg:border-b-0 lg:border-r flex flex-col min-h-0 ${isDarkMode ? 'border-gray-700/50 bg-gradient-to-b from-gray-800/50 to-gray-900' : 'border-gray-200/50 bg-gradient-to-b from-gray-50/50 to-white'}`}>
              <div className="p-3 sm:p-4 lg:p-6 flex-1 min-h-0 flex flex-col">
                <div className="mb-3 sm:mb-4 lg:mb-6">
                  <div className="relative group">
                    <Search className={`absolute left-2 sm:left-3 lg:left-4 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 transition-colors ${isDarkMode ? 'text-gray-500 group-focus-within:text-green-400' : 'text-gray-400 group-focus-within:text-green-500'}`} />
                    <input
                      type="text"
                      placeholder="Search your agents..."
                      className={`w-full pl-8 sm:pl-10 lg:pl-12 pr-3 sm:pr-4 py-2 sm:py-2.5 lg:py-3 border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 backdrop-blur-sm transition-all duration-300 text-xs sm:text-sm lg:text-base ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white/80 text-gray-900 placeholder-gray-400'}`}
                    />
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3 flex-1 min-h-0 overflow-y-auto">
                  {isLoadingAgents && agents.length === 0 ? (
                    <div className="flex justify-center items-center py-6 sm:py-8">
                      <RefreshCw className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 animate-spin" />
                      <span className="ml-2 text-gray-500 text-xs sm:text-sm lg:text-base">Loading agents...</span>
                    </div>
                  ) : agentsError ? (
                    <div className="text-center py-6 sm:py-8 text-red-500">
                      <p className="text-xs sm:text-sm lg:text-base">{agentsError}</p>
                      <button onClick={handleRefreshAgents} className="mt-3 sm:mt-4 px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm">
                        Retry
                      </button>
                    </div>
                  ) : agents.length === 0 ? (
                    <div className="text-center py-6 sm:py-8">
                      <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl inline-block mb-3 sm:mb-4 ${isDarkMode ? 'bg-gradient-to-r from-gray-800 to-gray-700' : 'bg-gradient-to-r from-gray-100 to-gray-200'}`}>
                        <Bot className={`h-6 w-6 sm:h-8 sm:w-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                      </div>
                      <h4 className={`text-base sm:text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>No Agents Found</h4>
                      <p className={`text-xs sm:text-sm mb-3 sm:mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Create your first AI agent to get started!
                      </p>
                      <button
                        onClick={handleCreateNewAgent}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm"
                      >
                        Create First Agent
                      </button>
                    </div>
                  ) : (
                    agents.map((agent) => (
                      <div
                        key={agent.id}
                        onClick={() => handleSelectAgent(agent)}
                        className={`w-full p-2 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl text-left transition-all duration-300 transform hover:scale-[1.02] cursor-pointer ${selectedAgent?.id === agent.id
                          ? isDarkMode
                            ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-2 border-green-700/50 shadow-lg'
                            : 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 shadow-lg'
                          : isDarkMode
                            ? 'hover:bg-gray-800/80 border-2 border-transparent hover:border-gray-600 shadow-sm'
                            : 'hover:bg-white/80 border-2 border-transparent hover:border-gray-200 shadow-sm'
                          }`}
                      >
                        <div className="flex items-start gap-2 sm:gap-3 lg:gap-4">
                          <div className={`text-lg sm:text-xl lg:text-2xl p-1.5 sm:p-2 rounded-lg ${agent.status === 'active'
                            ? isDarkMode ? 'bg-green-900/50' : 'bg-green-100'
                            : agent.status === 'draft'
                              ? isDarkMode ? 'bg-yellow-900/50' : 'bg-yellow-100'
                              : isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                            }`}>
                            {agent.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className={`font-semibold truncate text-xs sm:text-sm lg:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{agent.name}</h3>
                              <div className={`px-1.5 sm:px-2 lg:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium ${agent.status === 'active'
                                ? isDarkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800'
                                : agent.status === 'draft'
                                  ? isDarkMode ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                                  : isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-800'
                                }`}>
                                {agent.status}
                              </div>
                            </div>
                            <p className={`text-xs sm:text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{agent.description}</p>
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{agent.provider} • {agent.model}</p>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditAgent(agent);
                              }}
                              className={`p-1 sm:p-1.5 lg:p-2 rounded-lg transition-colors ${isDarkMode
                                ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-800'
                                : 'text-gray-500 hover:text-blue-600 hover:bg-gray-100'
                                }`}
                              title="Edit Agent"
                            >
                              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAgent(agent);
                              }}
                              disabled={deletingAgentId === agent.id}
                              className={`p-1 sm:p-1.5 lg:p-2 rounded-lg transition-colors ${deletingAgentId === agent.id
                                ? isDarkMode
                                  ? 'text-gray-600 cursor-not-allowed'
                                  : 'text-gray-400 cursor-not-allowed'
                                : isDarkMode
                                  ? 'text-red-400 hover:text-red-300 hover:bg-gray-800'
                                  : 'text-red-500 hover:text-red-600 hover:bg-gray-100'
                                }`}
                              title={deletingAgentId === agent.id ? "Deleting agent..." : "Delete Agent"}
                            >
                              {deletingAgentId === agent.id ? (
                                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
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
                        <h3 className={`text-lg sm:text-xl lg:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedAgent.name}</h3>
                        <p className={`text-sm sm:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{selectedAgent.description}</p>
                        <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>ID: {selectedAgent.id}</p>
                      </div>
                    </div>
                  </div>

                  {/* Configuration Tabs */}
                  <div className={`border-b flex-shrink-0 ${isDarkMode ? 'border-gray-700/50 bg-gray-900' : 'border-gray-200/50 bg-white'}`}>
                    {/* Mobile: Dropdown (xs to md) */}
                    <div className="block md:hidden px-2 sm:px-3 py-2 dropdown-container">
                      <div className="relative">
                        <button
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          className={`w-full flex items-center justify-between px-3 py-3 rounded-lg font-medium text-sm transition-all duration-300 min-h-[44px] ${activeConfigTab
                            ? `bg-gradient-to-r ${configTabs.find(tab => tab.id === activeConfigTab)?.color} text-white shadow-lg`
                            : isDarkMode
                              ? 'text-gray-400 bg-gray-800 border border-gray-600'
                              : 'text-gray-600 bg-white border border-gray-200'
                            }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {(() => {
                              const activeTab = configTabs.find(tab => tab.id === activeConfigTab);
                              const Icon = activeTab?.icon || Bot;
                              return <Icon className="h-4 w-4 flex-shrink-0" />;
                            })()}
                            <span className="truncate">{configTabs.find(tab => tab.id === activeConfigTab)?.label || 'Select Tab'}</span>
                          </div>
                          <ChevronDown className={`h-4 w-4 transition-transform duration-200 flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isDropdownOpen && (
                          <div className={`absolute top-full left-0 right-0 mt-1 rounded-lg shadow-lg border z-50 max-h-60 overflow-y-auto ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
                            {configTabs.map((tab) => {
                              const Icon = tab.icon;
                              return (
                                <button
                                  key={tab.id}
                                  onClick={() => handleTabClick(tab.id)}
                                  className={`w-full flex items-center gap-3 px-3 py-3 text-left text-sm transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg min-h-[44px] ${activeConfigTab === tab.id
                                    ? isDarkMode
                                      ? 'bg-gray-700 text-white'
                                      : 'bg-gray-100 text-gray-900'
                                    : isDarkMode
                                      ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                                >
                                  <Icon className="h-4 w-4 flex-shrink-0" />
                                  <span className="truncate flex-1">{tab.label}</span>
                                  {activeConfigTab === tab.id && (
                                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tablet & Desktop: Horizontal Tabs */}
                    <nav className="hidden md:flex justify-start px-2 lg:px-4 xl:px-8 py-2">
                      <div className="flex w-full overflow-x-auto scroll-smooth hide-scrollbar">
                        <div className="flex space-x-1 min-w-max">
                          {configTabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                              <button
                                key={tab.id}
                                onClick={() => handleTabClick(tab.id)}
                                className={`group relative px-3 md:px-4 lg:px-5 xl:px-6 py-2.5 md:py-3 lg:py-3.5 rounded-lg font-medium text-sm md:text-sm lg:text-base transition-all duration-300 flex items-center gap-2 md:gap-2.5 lg:gap-3 whitespace-nowrap flex-shrink-0 min-h-[44px] ${activeConfigTab === tab.id
                                  ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                                  : isDarkMode
                                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                  }`}
                              >
                                <Icon className="h-4 w-4 md:h-4 md:w-4 lg:h-5 lg:w-5 flex-shrink-0" />
                                <span className="hidden md:inline lg:inline truncate max-w-[120px]">{tab.label}</span>
                                {activeConfigTab === tab.id && (
                                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3 bg-white rounded-full"></div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </nav>
                  </div>

                  {/* Configuration Content */}
                  <div className={`flex-1 min-h-0 overflow-y-auto ${isDarkMode ? 'bg-gradient-to-br from-gray-800/30 to-gray-900' : 'bg-gradient-to-br from-gray-50/30 to-white'}`}>
                    <div className="max-w-4xl mx-auto lg:max-w-none p-3 sm:p-4 lg:p-6 xl:p-8">
                      {/* Keep all components mounted but only show the active one */}
                      <div style={{ display: activeConfigTab === 'model' ? 'block' : 'none' }}>
                        <ModelConfig
                          ref={modelSectionRef}
                          agentName={selectedAgent?.name || 'default'}
                          onConfigChange={handleModelConfigChange}
                          existingConfig={selectedAgent ? getAgentConfigData(selectedAgent).modelConfig : null}
                          isEditing={isEditing}
                          onConfigUpdated={fetchAgents}
                        />
                      </div>

                      <div style={{ display: activeConfigTab === 'voice' ? 'block' : 'none' }}>
                        <VoiceConfig
                          ref={voiceSectionRef}
                          agentName={selectedAgent?.name || 'default'}
                          onConfigChange={handleVoiceConfigChange}
                          onTranscriberConfigChange={handleTranscriberConfigChange}
                          existingConfig={selectedAgent ? getAgentConfigData(selectedAgent).voiceConfig : null}
                          existingTranscriberConfig={selectedAgent ? getAgentConfigData(selectedAgent).transcriberConfig : null}
                          isEditing={isEditing}
                        />
                      </div>

                      <div style={{ display: activeConfigTab === 'widget' ? 'block' : 'none' }}>
                        <WidgetConfig
                          ref={widgetSectionRef}
                          agentName={selectedAgent?.name || 'default'}
                          onConfigChange={handleWidgetConfigChange}
                          existingConfig={selectedAgent ? getAgentConfigData(selectedAgent).widgetConfig : null}
                          isEditing={isEditing}
                        />
                      </div>

                      <div style={{ display: activeConfigTab === 'tools' ? 'block' : 'none' }}>
                        <ToolsConfig
                          ref={toolsSectionRef}
                          agentName={selectedAgent?.name || 'default'}
                          onConfigChange={handleToolsConfigChange}
                          existingConfig={selectedAgent ? getAgentConfigData(selectedAgent).toolsConfig : null}
                          isEditing={isEditing}
                          isCreating={isCreating}
                          onAgentCreated={handleAgentCreated}
                          // Pass saved configurations from localStorage
                          modelConfig={modelConfig}
                          voiceConfig={voiceConfig}
                          transcriberConfig={transcriberConfig}
                          currentOrganizationId={organizationName || currentOrganizationId}
                          selectedAgent={selectedAgent}
                        />
                      </div>

                    </div>
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
        </div>

        {/* Agent Prefix Modal */}
        {showAgentPrefixModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
              <div className="text-center mb-4 sm:mb-6">
                <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl inline-block mb-3 sm:mb-4 ${isDarkMode ? 'bg-green-900/50' : 'bg-green-100'}`}>
                  <Bot className={`h-6 w-6 sm:h-8 sm:w-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                </div>
                <h3 className={`text-lg sm:text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Create New Agent</h3>
                <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Enter a unique identifier for your new AI agent. This will be used as the agent's name and ID.
                </p>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className={`block text-xs sm:text-sm font-medium mb-1 sm:mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Agent Prefix (Agent ID/Name)
                  </label>
                  <input
                    type="text"
                    value={agentPrefix}
                    onChange={(e) => setAgentPrefix(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && agentPrefix.trim() && !isCreatingAgent) {
                        handleAgentPrefixSubmit();
                      }
                    }}
                    disabled={isCreatingAgent}
                    placeholder="e.g., customer_support, sales_agent, helpdesk"
                    className={`w-full p-2.5 sm:p-3 rounded-lg sm:rounded-xl border focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all duration-300 text-xs sm:text-sm ${isCreatingAgent
                      ? isDarkMode
                        ? 'bg-gray-800/30 border-gray-700 text-gray-400 placeholder-gray-500 cursor-not-allowed'
                        : 'bg-gray-100 border-gray-300 text-gray-500 placeholder-gray-400 cursor-not-allowed'
                      : isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
                      }`}
                    autoFocus
                  />
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Use lowercase letters, numbers, and underscores only
                  </p>

                  {/* Loading status message */}
                  {isCreatingAgent && (
                    <div className={`mt-3 p-3 rounded-lg border ${isDarkMode ? 'bg-blue-900/20 border-blue-700/50' : 'bg-blue-50 border-blue-200'}`}>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        <div>
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                            Creating Dify Agent...
                          </p>
                          <p className={`text-xs ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                            Generating API key and setting up your agent. This may take a few moments.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 sm:gap-3">
                  <button
                    onClick={() => {
                      setShowAgentPrefixModal(false);
                      setIsCreatingAgent(false); // Reset loading state when closing modal
                    }}
                    disabled={isCreatingAgent}
                    className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl border transition-all duration-300 text-xs sm:text-sm font-medium ${isCreatingAgent
                      ? isDarkMode
                        ? 'border-gray-700 bg-gray-800 text-gray-500 cursor-not-allowed'
                        : 'border-gray-300 bg-gray-200 text-gray-400 cursor-not-allowed'
                      : isDarkMode
                        ? 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAgentPrefixSubmit}
                    disabled={!agentPrefix.trim() || isCreatingAgent}
                    className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 ${!agentPrefix.trim() || isCreatingAgent
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                  >
                    {isCreatingAgent ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Creating Agent...</span>
                      </>
                    ) : (
                      'Create Agent'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirmation && agentToDelete && (
          <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
              <div className="text-center mb-4 sm:mb-6">
                <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl inline-block mb-3 sm:mb-4 ${isDarkMode ? 'bg-red-900/50' : 'bg-red-100'}`}>
                  <Trash2 className={`h-6 w-6 sm:h-8 sm:w-8 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                </div>
                <h3 className={`text-lg sm:text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Delete Agent</h3>
                <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Are you sure you want to delete agent <span className="font-semibold">"{agentToDelete.name}"</span>? This action cannot be undone.
                </p>
              </div>

              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={handleCancelDelete}
                  disabled={deletingAgentId === agentToDelete?.id}
                  className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl border transition-all duration-300 text-xs sm:text-sm font-medium ${deletingAgentId === agentToDelete?.id
                    ? isDarkMode
                      ? 'border-gray-700 bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'border-gray-300 bg-gray-200 text-gray-400 cursor-not-allowed'
                    : isDarkMode
                      ? 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deletingAgentId === agentToDelete?.id}
                  className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 ${deletingAgentId === agentToDelete?.id
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                >
                  {deletingAgentId === agentToDelete?.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    'Delete Agent'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
              <div className="text-center mb-4 sm:mb-6">
                <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl inline-block mb-3 sm:mb-4 ${isDarkMode ? 'bg-green-900/50' : 'bg-green-100'}`}>
                  <CheckCircle className={`h-6 w-6 sm:h-8 sm:w-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                </div>
                <h3 className={`text-lg sm:text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Success!</h3>
                <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Agent was created successfully
                </p>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className={`px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 text-xs sm:text-sm font-medium ${isDarkMode
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
