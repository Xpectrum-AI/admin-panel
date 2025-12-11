'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Bot, Settings, Mic, Wrench, BarChart3, MessageSquare, Sparkles, Zap, Activity, Search, RefreshCw, Trash2, ChevronDown, Loader2, Code, CheckCircle, Phone, X, Send, VolumeX, Volume2 } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

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

// Import new components and hooks
import { useAgents } from './AgentsTab/hooks/useAgents';
import AgentConfigPanel from './AgentsTab/components/AgentConfigPanel';
import { Agent, AgentsTabProps } from './AgentsTab/types';
import dynamic from 'next/dynamic';

// Lazy load modals - only load when they're opened
const AgentPrefixModal = dynamic(() => import('./AgentsTab/components/AgentPrefixModal'), {
  ssr: false
});

const DeleteConfirmationModal = dynamic(() => import('./AgentsTab/components/DeleteConfirmationModal'), {
  ssr: false
});

export default function AgentsTab({ }: AgentsTabProps) {
  const { isDarkMode } = useTheme();
  const { user, userClass } = useAuthInfo();

  // Use the new useAgents hook for agent management
  const {
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
  } = useAgents();

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

  const [generatedDifyApiKey, setGeneratedDifyApiKey] = useState<string>('');
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


  // Ref for ModelConfig to get current config
  const modelSectionRef = useRef<any>(null);

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

  // Add welcome message when chat sidebar opens - optimized dependencies
  const selectedAgentInitialMessage = useMemo(() => selectedAgent?.initial_message, [selectedAgent?.initial_message]);
  useEffect(() => {
    if (showChatSidebar && selectedAgent && chatMessages.length === 0 && selectedAgentInitialMessage) {
      const welcomeMessage = {
        id: 'welcome',
        type: 'bot' as const,
        message: selectedAgentInitialMessage,
        timestamp: new Date()
      };
      setChatMessages([welcomeMessage]);
    }
  }, [showChatSidebar, selectedAgent, chatMessages.length, selectedAgentInitialMessage]);

  // Load configuration from selected agent
  const loadAgentConfiguration = useCallback((agent: Agent) => {
    if (agent) {
      loadConfigurationFromAgent(agent);
    }
  }, [loadConfigurationFromAgent]);

  // Load agent configuration when agent is selected - use ref to track previous agent ID
  const previousAgentIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (selectedAgent && selectedAgent.id !== previousAgentIdRef.current) {
      previousAgentIdRef.current = selectedAgent.id;
      loadAgentConfiguration(selectedAgent);
    }
  }, [selectedAgent?.id, loadAgentConfiguration]);

  // Handle creating a new agent - memoized
  const handleCreateNewAgent = useCallback(() => {
    // Show agent prefix modal first
    setShowAgentPrefixModal(true);
    setAgentPrefix('');
    setIsCreatingAgent(false); // Reset loading state when opening modal
  }, []);

  // Handle closing agent prefix modal - memoized
  const handleCloseAgentPrefixModal = useCallback(() => {
    setShowAgentPrefixModal(false);
    setAgentPrefix('');
    setIsCreatingAgent(false);
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

    // Create a placeholder bot message that we'll update as stream comes in
    const botMessageId = (Date.now() + 1).toString();
    const botMessage = {
      id: botMessageId,
      type: 'bot' as const,
      message: '',
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, botMessage]);

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

      if (!response.ok) {
        throw new Error('Failed to get response from server');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let currentConversationId = conversationId;

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        // Decode the chunk
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim() === '') continue;
          
          if (line.startsWith('data: ')) {
            const jsonStr = line.substring(6).trim();
            
            if (jsonStr === '[DONE]') {
              continue;
            }

            try {
              const data = JSON.parse(jsonStr);
              
              // Handle different event types
              if (data.type === 'done') {
                if (data.conversationId) {
                  setConversationId(data.conversationId);
                }
                continue;
              }
              
              if (data.type === 'error') {
                throw new Error(data.error || 'Stream error');
              }

              // Extract text from various event types
              let textChunk = '';
              
              if (data.event === 'message' || data.event === 'agent_message' || data.event === 'message_append') {
                textChunk = data.answer || data.text || '';
              } else if (data.event === 'message_replace') {
                // Replace the entire message
                accumulatedText = data.answer || '';
                textChunk = '';
              } else if (data.answer) {
                textChunk = data.answer;
              } else if (data.text) {
                textChunk = data.text;
              } else if (!data.event) {
                // Direct answer without event
                textChunk = data.answer || data.text || '';
              }

              // Update conversation ID if provided
              if (data.conversation_id) {
                currentConversationId = data.conversation_id;
              }

              // Accumulate text and update the message
              if (textChunk) {
                accumulatedText += textChunk;
                
                // Update the bot message in real-time
                setChatMessages(prev => prev.map(msg => 
                  msg.id === botMessageId 
                    ? { ...msg, message: accumulatedText }
                    : msg
                ));
              }
            } catch (parseError) {
              // Ignore parse errors for individual lines
              continue;
            }
          }
        }
      }

      // Final update with conversation ID
      if (currentConversationId && currentConversationId !== conversationId) {
        setConversationId(currentConversationId);
      }

      // Ensure final message is set
      if (accumulatedText) {
        setChatMessages(prev => prev.map(msg => 
          msg.id === botMessageId 
            ? { ...msg, message: accumulatedText }
            : msg
        ));
      } else {
        // If no text was accumulated, remove the empty message
        setChatMessages(prev => prev.filter(msg => msg.id !== botMessageId));
        const errorMessage = {
          id: botMessageId,
          type: 'bot' as const,
          message: 'Sorry, I received an empty response. Please try again.',
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      // Remove the placeholder message and add error message
      setChatMessages(prev => prev.filter(msg => msg.id !== botMessageId));
      const errorMessage = {
        id: botMessageId,
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


  // Manual refresh function for agent configuration - use hook's refresh function
  const refreshSelectedAgentConfig = useCallback(async () => {
    if (!selectedAgent) return;
    await handleRefreshAgents();
  }, [selectedAgent, handleRefreshAgents]);

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

        {/* Agent Prefix Modal - Using new component */}
        <AgentPrefixModal
          isOpen={showAgentPrefixModal}
          agentPrefix={agentPrefix}
          agentType={agentType}
          isCreating={isCreatingAgent}
          onClose={handleCloseAgentPrefixModal}
          onPrefixChange={setAgentPrefix}
          onTypeChange={setAgentType}
          onSubmit={handleAgentPrefixSubmit}
        />
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

      {/* Delete Confirmation Modal - Using new component */}
      <DeleteConfirmationModal
        isOpen={showDeleteConfirmation}
        agent={agentToDelete}
        isDeleting={deletingAgentId !== null}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />

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
                        <MarkdownRenderer>
                          {message.message || ''}
                        </MarkdownRenderer>
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