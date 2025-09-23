'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Bot, Settings, Mic, Wrench, BarChart3, MessageSquare, Sparkles, Zap, Activity, Search, RefreshCw, Trash2, ChevronDown, Loader2, Code, CheckCircle } from 'lucide-react';

import ModelConfig from './config/ModelConfig';
import VoiceConfig from './config/VoiceConfig';
import ToolsConfig from './config/ToolsConfig';
import WidgetConfig from './config/WidgetConfig';
import AgentCards from './AgentCards';

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
  const [showAgentCards, setShowAgentCards] = useState(true);

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
  const [toolsConfig, setToolsConfig] = useState<any>(null);

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
  }, [currentOrganizationId, organizationName]);

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
    setShowAgentCards(false); // Switch to configuration view

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

  // Handle opening agent in new tab
  const handleOpenAgent = useCallback((agent: Agent) => {
    console.log('Opening agent in new tab:', agent);
    console.log('Agent ID:', agent.id);
    console.log('Agent chatbot_key:', agent.chatbot_key);
    console.log('Agent chatbot_api:', agent.chatbot_api);
    // Open the chatbot page in a new tab
    const chatbotUrl = `/chatbot/${agent.id}`;
    console.log('Opening URL:', chatbotUrl);
    window.open(chatbotUrl, '_blank');
  }, []);

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
    setToolsConfig(config);
    // Save to localStorage
    try {
      localStorage.setItem('toolsConfigState', JSON.stringify(config));
      console.log('Tools config saved to localStorage:', config);
    } catch (error) {
      console.warn('Failed to save tools config to localStorage:', error);
    }
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
  }, [activeConfigTab]); // Remove loadConfigurationsFromStorage from dependencies to prevent infinite loop


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
            <div className={`p-6 rounded-xl shadow-xl max-w-md w-full mx-4 ${
              isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
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
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                  isDarkMode
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
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    isDarkMode
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

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`p-6 rounded-xl shadow-xl max-w-md w-full mx-4 ${
              isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Agent Created Successfully!
                </h3>
                <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Your new agent has been created and is ready for configuration.
                </p>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}
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
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
              isDarkMode
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

                  {/* Configuration Content */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
                {activeConfigTab === 'model' && (
                        <ModelConfig
                          ref={modelSectionRef}
                    agentName={selectedAgent.name}
                          onConfigChange={handleModelConfigChange}
                    existingConfig={modelConfig}
                          isEditing={isEditing}
                          onConfigUpdated={fetchAgents}
                        />
                )}
                {activeConfigTab === 'voice' && (
                        <VoiceConfig
                          ref={voiceSectionRef}
                    agentName={selectedAgent.name}
                          onConfigChange={handleVoiceConfigChange}
                          onTranscriberConfigChange={handleTranscriberConfigChange}
                          existingConfig={selectedAgent ? getAgentConfigData(selectedAgent).voiceConfig : null}
                          existingTranscriberConfig={selectedAgent ? getAgentConfigData(selectedAgent).transcriberConfig : null}
                          isEditing={isEditing}
                        />
                )}
                {activeConfigTab === 'widget' && (
                  <WidgetConfig
                    ref={widgetSectionRef}
                    agentName={selectedAgent.name}
                    onConfigChange={handleWidgetConfigChange}
                    existingConfig={selectedAgent ? getAgentConfigData(selectedAgent).widgetConfig : null}
                    isEditing={isEditing}
                  />
                )}
                {activeConfigTab === 'tools' && (
                        <ToolsConfig
                          ref={toolsSectionRef}
                    agentName={selectedAgent.name}
                          onConfigChange={handleToolsConfigChange}
                    existingConfig={toolsConfig}
                          isEditing={isEditing}
                          selectedAgent={selectedAgent}
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
        </div>
  );
}
