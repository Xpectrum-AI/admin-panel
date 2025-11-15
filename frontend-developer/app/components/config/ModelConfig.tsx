'use client';

import React, { forwardRef, useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, CheckCircle, AlertCircle, Loader2, Copy, Check, BookOpen, Plus, X, Search, Trash2 } from 'lucide-react';
import { useAuthInfo } from '@propelauth/react';
import { modelConfigService } from '../../../service/modelConfigService';
import { useTheme } from '../../contexts/ThemeContext';
import { maskApiKey } from '../../../service/agentConfigService';
import { KnowledgeBase } from '../knowledge-base/types';

// Simple debounce function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

interface ModelConfigProps {
  agentName?: string;
  onConfigChange?: (config: any) => void;
  existingConfig?: any;
  isEditing?: boolean;
  onConfigUpdated?: () => void; // Add callback to refresh agent data
  agentApiKey?: string;
  agentApiUrl?: string;
}

const ModelConfig = forwardRef<HTMLDivElement, ModelConfigProps>(({ agentName = 'default', onConfigChange, existingConfig, isEditing = true, onConfigUpdated, agentApiKey, agentApiUrl }, ref) => {
  const { isDarkMode } = useTheme();

  // Helper function to get masked display value for API keys
  const getApiKeyDisplayValue = (actualKey: string) => {
    if (!actualKey) return '••••••••••••••••••••••••••••••••';
    return maskApiKey(actualKey);
  };
  
  // Get PropelAuth access token
  const { accessToken } = useAuthInfo();
  
  const [selectedModelProvider, setSelectedModelProvider] = useState('OpenAI');
  const [selectedModel, setSelectedModel] = useState('GPT-4o');
  const [modelLiveUrl, setModelLiveUrl] = useState(process.env.NEXT_PUBLIC_DIFY_BASE_URL || '');
  const [modelApiKey, setModelApiKey] = useState(process.env.NEXT_PUBLIC_MODEL_OPEN_AI_API_KEY || '');
  const [agentUrl, setAgentUrl] = useState(agentApiUrl || process.env.NEXT_PUBLIC_CHATBOT_API_URL || '');
  const [localAgentApiKey, setLocalAgentApiKey] = useState(agentApiKey || '');
  const [copiedAgentApiKey, setCopiedAgentApiKey] = useState(false);

  // Knowledge Base State
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [selectedKnowledgeBases, setSelectedKnowledgeBases] = useState<string[]>([]);
  const [loadingKnowledgeBases, setLoadingKnowledgeBases] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);
  const [publishingAgent, setPublishingAgent] = useState(false);

  // Helper function to get localStorage key for agent
  const getAgentStorageKey = (agentId: string) => `agent_knowledge_bases_${agentId}`;

  const [systemPrompt, setSystemPrompt] = useState(`# Appointment Scheduling Agent Prompt

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

Remember: You are the first point of contact for many patients. Your professionalism and helpfulness directly impact their experience with Wellness Partners.`);

  // Keep only essential state variables
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isUsingModelApiKey, setIsUsingModelApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState(0);
  const [saveInProgress, setSaveInProgress] = useState(false);

  // Track if we've initialized the config to prevent overriding user changes
  const [hasInitializedConfig, setHasInitializedConfig] = React.useState(false);

  // User change tracking flags to prevent state conflicts
  const [isUserChangingProvider, setIsUserChangingProvider] = useState(false);
  const [isUserChangingModel, setIsUserChangingModel] = useState(false);
  const providerChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const modelChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save timeout refs
  const promptSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const modelSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add storage key generator
  const getStorageKey = useCallback((type: 'config' | 'prompt') => {
    return `modelConfig_${type}_${agentName}`;
  }, [agentName]);

  // Add load from storage function
  const loadFromStorage = useCallback(() => {
    try {
      const configKey = getStorageKey('config');
      const promptKey = getStorageKey('prompt');

      const savedConfig = localStorage.getItem(configKey);
      const savedPrompt = localStorage.getItem(promptKey);

      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        setSelectedModelProvider(config.selectedModelProvider || 'OpenAI');
        setSelectedModel(config.selectedModel || 'GPT-4o');
        setModelApiKey(config.modelApiKey || process.env.NEXT_PUBLIC_MODEL_OPEN_AI_API_KEY || '');
        setModelLiveUrl(config.modelLiveUrl || process.env.NEXT_PUBLIC_DIFY_BASE_URL || '');
        // Don't load agentUrl and agentApiKey from localStorage - keep them from existingConfig only
      }

      if (savedPrompt) {
        const promptData = JSON.parse(savedPrompt);
        setSystemPrompt(promptData.prompt || systemPrompt);
      }
    } catch (error) {
    }
  }, [agentName, getStorageKey, systemPrompt]);

  // Add save to storage function
  const saveToStorage = useCallback((type: 'config' | 'prompt', data: any) => {
    try {
      const key = getStorageKey(type);
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
    }
  }, [getStorageKey]);

  // Load state from centralized configuration when component mounts or when configuration changes
  useEffect(() => {
    // Reset user change flags when existingConfig changes (tab switch)
    if (existingConfig) {
      setIsUserChangingProvider(false);
      setIsUserChangingModel(false);
    }

    // Load from centralized configuration
    if (existingConfig && !isUserChangingProvider && !isUserChangingModel) {
      if (existingConfig.selectedModelProvider) {
        setSelectedModelProvider(existingConfig.selectedModelProvider);
      }
      if (existingConfig.selectedModel) {
        setSelectedModel(existingConfig.selectedModel);
      }
      if (existingConfig.modelLiveUrl) {
        setModelLiveUrl(existingConfig.modelLiveUrl);
      }
      if (existingConfig.modelApiKey) {
        setModelApiKey(existingConfig.modelApiKey);
      }
      if (existingConfig.chatbot_api) {
        setAgentUrl(existingConfig.chatbot_api);
      } else if (existingConfig.agentUrl) {
        setAgentUrl(existingConfig.agentUrl);
      }
      if (existingConfig.chatbot_key) {
        setLocalAgentApiKey(existingConfig.chatbot_key);
      } else if (existingConfig.agentApiKey) {
        setLocalAgentApiKey(existingConfig.agentApiKey);
      }
      if (existingConfig.systemPrompt) {
        setSystemPrompt(existingConfig.systemPrompt);
      }

      // Check if this agent is using a custom model API key
      const modelKey = existingConfig.modelApiKey || existingConfig.model_api_key;
      const hasModelApiKey = modelKey &&
        modelKey !== process.env.NEXT_PUBLIC_MODEL_OPEN_AI_API_KEY &&
        (modelKey.startsWith('sk-') || modelKey.startsWith('gsk_') || modelKey.startsWith('sk-ant-'));
      setIsUsingModelApiKey(hasModelApiKey);
    } else {
      // Load from localStorage if no existing config
      loadFromStorage();
    }
  }, [existingConfig, isUserChangingProvider, isUserChangingModel, loadFromStorage]);

  // Update state when props change
  useEffect(() => {
    if (agentApiKey) {
setLocalAgentApiKey(agentApiKey);
    } else {
    }
    if (agentApiUrl) {
      setAgentUrl(agentApiUrl);
    }
  }, [agentApiKey, agentApiUrl]);

  // Debug: Watch for changes to agentApiKey
  useEffect(() => {
  }, [localAgentApiKey]);

  // Debug: Watch for changes to agentUrl
  useEffect(() => {
  }, [agentUrl]);

  // Debug: Watch for changes to selectedModelProvider
  useEffect(() => {
  }, [selectedModelProvider]);

  // Consolidated auto-save configuration when values change
  useEffect(() => {
    // Clear any existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set a new timeout for debounced save
    autoSaveTimeoutRef.current = setTimeout(() => {
      // Only save model-related config to localStorage, not agent URL/API key
      const modelConfig = {
        selectedModelProvider,
        selectedModel,
        modelApiKey,
        modelLiveUrl,
        timestamp: new Date().toISOString()
      };

      saveToStorage('config', modelConfig);

      // Also notify parent component with all fields
      if (onConfigChange) {
        onConfigChange({
          selectedModelProvider,
          selectedModel,
          modelApiKey,
          modelLiveUrl,
          agentUrl,
          agentApiKey: localAgentApiKey,
          systemPrompt,
          // Include the field names that AgentsTab expects
          chatbot_api: agentUrl,
          chatbot_key: localAgentApiKey
        });
      }
    }, 1000); // Increased to 1 second to reduce conflicts with debouncedModelSave

    // Cleanup timeout on unmount or dependency change
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [selectedModelProvider, selectedModel, modelApiKey, modelLiveUrl, agentUrl, localAgentApiKey, systemPrompt, saveToStorage, onConfigChange]);

  // Auto-clear success and error messages with longer delays to prevent flickering
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 4000); // Increased from 3000ms to 4000ms
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage('');
      }, 6000); // Increased from 5000ms to 6000ms
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (providerChangeTimeoutRef.current) {
        clearTimeout(providerChangeTimeoutRef.current);
      }
      if (modelChangeTimeoutRef.current) {
        clearTimeout(modelChangeTimeoutRef.current);
      }
      if (promptSaveTimeoutRef.current) {
        clearTimeout(promptSaveTimeoutRef.current);
      }
      if (modelSaveTimeoutRef.current) {
        clearTimeout(modelSaveTimeoutRef.current);
      }
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Save state to centralized state whenever it changes
  const saveStateToCentralized = useCallback((updates: any = {}) => {
    try {
      const currentState = {
        selectedModelProvider,
        selectedModel,
        modelLiveUrl,
        modelApiKey,
        agentUrl,
        agentApiKey: localAgentApiKey,
        systemPrompt,
        // Include the field names that AgentsTab expects
        chatbot_api: agentUrl,
        chatbot_key: localAgentApiKey,
        ...updates
      };
      if (onConfigChange) {
        onConfigChange(currentState);
      }
    } catch (error) {
    }
  }, [selectedModelProvider, selectedModel, modelLiveUrl, modelApiKey, agentUrl, localAgentApiKey, systemPrompt, onConfigChange]);

  // Debounced prompt save function
  const debouncedPromptSave = useCallback((promptValue: string) => {
    if (promptSaveTimeoutRef.current) {
      clearTimeout(promptSaveTimeoutRef.current);
    }

    promptSaveTimeoutRef.current = setTimeout(async () => {
      // Prevent multiple simultaneous saves
      if (saveInProgress) {
        return;
      }

      try {
        setSaveInProgress(true);
        setIsSaving(true);
        setErrorMessage('');

        // Save to localStorage first (always works)
        saveToStorage('prompt', { prompt: promptValue, timestamp: new Date().toISOString() });

        const chatbotApiKey = agentApiKey || existingConfig?.chatbot_key || process.env.NEXT_PUBLIC_CHATBOT_API_KEY;

        // Use the same API endpoint as the original function
        const response = await fetch('/api/prompt-config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.NEXT_PUBLIC_LIVE_API_KEY || 'xpectrum-ai@123',
          },
          body: JSON.stringify({
            prompt: promptValue,
            chatbot_api_key: chatbotApiKey
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        if (result.success) {
          // Only show success message if enough time has passed since last save
          const now = Date.now();
          if (now - lastSaveTime > 2000) { // 2 second cooldown
            setSuccessMessage('Prompt saved successfully');
            setLastSaveTime(now);
          }
        } else {
          setErrorMessage(`Failed to save prompt: ${result.message}`);
        }
      } catch (error) {
        setErrorMessage(`Failed to save prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsSaving(false);
        setSaveInProgress(false);
      }
    }, 2000); // 2 second delay
  }, [agentApiKey, existingConfig, saveToStorage, saveInProgress]);

  // Debounced model save function with current state capture
  const debouncedModelSave = useCallback((currentState?: {
    selectedModelProvider?: string;
    selectedModel?: string;
    modelApiKey?: string;
    modelLiveUrl?: string;
    agentApiKey?: string;
  }) => {
    if (modelSaveTimeoutRef.current) {
      clearTimeout(modelSaveTimeoutRef.current);
    }

    modelSaveTimeoutRef.current = setTimeout(async () => {
      // Prevent multiple simultaneous saves
      if (saveInProgress) {
        return;
      }

      try {
        setSaveInProgress(true);
        setIsSaving(true);
        setErrorMessage('');

        // Use current state if provided, otherwise fall back to component state
        const stateToUse = currentState || {
          selectedModelProvider,
          selectedModel,
          modelApiKey,
          modelLiveUrl,
          agentApiKey: localAgentApiKey
        };
        // Save to localStorage first (always works) - only model config, not agent URL/API key
        const modelConfig = {
          selectedModelProvider: stateToUse.selectedModelProvider,
          selectedModel: stateToUse.selectedModel,
          modelApiKey: stateToUse.modelApiKey,
          modelLiveUrl: stateToUse.modelLiveUrl,
          timestamp: new Date().toISOString()
        };
        saveToStorage('config', modelConfig);

        const provider = modelProviders[stateToUse.selectedModelProvider as keyof typeof modelProviders];
        const apiModel = modelApiMapping[stateToUse.selectedModel] || stateToUse.selectedModel.toLowerCase().replace(/\s+/g, '-');
        const chatbotApiKey = stateToUse.agentApiKey || existingConfig?.chatbot_key || process.env.NEXT_PUBLIC_CHATBOT_API_KEY;
        // Get app_id from localStorage using the chatbot API key
        let appId: string | null = null;
        if (chatbotApiKey) {
          appId = localStorage.getItem(`dify_app_id_${chatbotApiKey}`);
}

        // If not found in localStorage, try to get from existingConfig
        if (!appId && existingConfig?.dify_app_id) {
          appId = existingConfig.dify_app_id;
// Store for future use
          if (chatbotApiKey && appId) {
            localStorage.setItem(`dify_app_id_${chatbotApiKey}`, appId);
          }
        }

        if (!appId) {
          setErrorMessage('App ID not found. Please ensure the agent was created properly.');
          return;
        }

        // Use the same API endpoint as the original function
        const response = await fetch('/api/model-config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.NEXT_PUBLIC_LIVE_API_KEY || 'xpectrum-ai@123',
          },
          body: JSON.stringify({
            provider: provider.apiProvider,
            model: apiModel,
            api_key: stateToUse.modelApiKey,
            chatbot_api_key: chatbotApiKey,
            app_id: appId
          }),
        });

        if (!response.ok) {
          // Handle 401 specifically
          if (response.status === 401) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Unauthorized: Please check your Dify API key configuration');
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        if (result.success) {
          // Only show success message if enough time has passed since last save
          const now = Date.now();
          if (now - lastSaveTime > 2000) { // 2 second cooldown
            if (result.warning) {
              setSuccessMessage(`Model configuration saved locally: ${result.message}`);
            } else {
              setSuccessMessage('Model configuration saved successfully');
            }
            setLastSaveTime(now);
          }
        } else {
          setErrorMessage(`Failed to save model config: ${result.message}`);
        }
      } catch (error) {
        setErrorMessage(`Failed to save model config: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsSaving(false);
        setSaveInProgress(false);
      }
    }, 2000); // 2 second delay
  }, [selectedModelProvider, selectedModel, modelApiKey, modelLiveUrl, agentUrl, localAgentApiKey, existingConfig, saveToStorage, saveInProgress]);

  // fetchCurrentPrompt function removed - no longer needed with auto-save functionality

  // Note: Dify API doesn't support GET requests for model configuration
  // Model configuration is managed through localStorage only

  // fetchModelConfigFromLocalStorage function removed - no longer needed with auto-save functionality

  // checkConfigurationStatus function removed - no longer needed with auto-save functionality

  // resetConfigurationStatus function removed - no longer needed with auto-save functionality

  // Model data structure with API provider mappings
  const modelProviders = {
    'OpenAI': {
      models: ['GPT-4o', 'GPT-4o Mini', 'GPT-4 Turbo', 'GPT-4', 'GPT-3.5 Turbo'],
      apiProvider: 'langgenius/openai/openai'
    },
    'Anthropic': {
      models: [
        'claude-opus-4-20250514',
        'claude-sonnet-4-20250514',
        'claude-3-5-haiku-20241022',
        'claude-3-5-sonnet-20241022',
        'claude-3-5-sonnet-20240620',
        'claude-3-7-sonnet-20250219',
        'claude-3-haiku-20240307',
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-opus-4-1-20250805'
      ],
      apiProvider: 'langgenius/anthropic/anthropic'
    },
    'DeepSeek': {
      models: ['DeepSeek Coder', 'DeepSeek Chat', 'DeepSeek Math'],
      apiProvider: 'langgenius/deepseek/deepseek'
    },
    'Groq': {
      models: ['Llama 3.1 8B', 'Llama 3.1 70B', 'Mixtral 8x7B', 'Gemma 2 9B', 'Gemma 2 27B'],
      apiProvider: 'langgenius/groq/groq'
    },
    'XAI': {
      models: ['Grok-1', 'Grok-1.5', 'Grok-2'],
      apiProvider: 'langgenius/xai/xai'
    },
    'Google': {
      models: ['Gemini 1.5 Pro', 'Gemini 1.5 Flash', 'Gemini 1.0 Pro', 'PaLM 2'],
      apiProvider: 'langgenius/google/google'
    }
  };

  // Track if we've already loaded the prompt for this agent to prevent overriding user edits
  const [hasLoadedPromptForAgent, setHasLoadedPromptForAgent] = React.useState<string | null>(null);

  // Reset initialization state when agent changes
  React.useEffect(() => {
    setHasInitializedConfig(false);
    setHasLoadedPromptForAgent(null);
  }, [agentName]);

  // Auto-load useEffect calls removed - no longer needed with auto-save functionality

  // Persistent status loading useEffect removed - no longer needed with auto-save functionality

  // Model mapping for API calls
  const modelApiMapping: { [key: string]: string } = {
    'GPT-4o': 'gpt-4o',
    'GPT-4o Mini': 'gpt-4o-mini',
    'GPT-4 Turbo': 'gpt-4-turbo',
    'GPT-4': 'gpt-4',
    'GPT-3.5 Turbo': 'gpt-3.5-turbo',
    'Claude 3.5 Sonnet': 'claude-3-5-sonnet',
    'Claude 3.5 Haiku': 'claude-3-5-haiku',
    'Claude 3 Opus': 'claude-3-opus',
    'Claude 3 Sonnet': 'claude-3-sonnet',
    'Claude 3 Haiku': 'claude-3-haiku',
    'DeepSeek Coder': 'deepseek-coder',
    'DeepSeek Chat': 'deepseek-chat',
    'DeepSeek Math': 'deepseek-math',
    'Llama 3.1 8B': 'llama-3.1-8b',
    'Llama 3.1 70B': 'llama-3.1-70b',
    'Mixtral 8x7B': 'mixtral-8x7b',
    'Gemma 2 9B': 'gemma-2-9b',
    'Gemma 2 27B': 'gemma-2-27b',
    'Grok-1': 'grok-1',
    'Grok-1.5': 'grok-1.5',
    'Grok-2': 'grok-2',
    'Gemini 1.5 Pro': 'gemini-1.5-pro',
    'Gemini 1.5 Flash': 'gemini-1.5-flash',
    'Gemini 1.0 Pro': 'gemini-1.0-pro',
    'PaLM 2': 'palm-2'
  };

  const handleProviderChange = (provider: string) => {
    // Set flag to prevent existingConfig from overriding user selection
    setIsUserChangingProvider(true);

    // Clear any pending timeouts
    if (providerChangeTimeoutRef.current) {
      clearTimeout(providerChangeTimeoutRef.current);
    }

    // Cancel any pending model saves to prevent conflicts
    if (modelSaveTimeoutRef.current) {
      clearTimeout(modelSaveTimeoutRef.current);
    }

    // Update the model API key based on the selected provider
    let newApiKey = '';
    switch (provider) {
      case 'OpenAI':
        newApiKey = process.env.NEXT_PUBLIC_MODEL_OPEN_AI_API_KEY || '';
        break;
      case 'Groq':
        newApiKey = process.env.NEXT_PUBLIC_MODEL_GROQ_API_KEY || '';
        break;
      case 'Anthropic':
        newApiKey = process.env.NEXT_PUBLIC_MODEL_ANTHROPIC_API_KEY || '';
        break;
      case 'DeepSeek':
        newApiKey = ''; // DeepSeek requires custom API key
        break;
      default:
        newApiKey = ''; // Fallback to empty for custom providers
    }

    // Reset model to first available model for the new provider
    const providerData = modelProviders[provider as keyof typeof modelProviders];
    let defaultModel = '';
    if (providerData && providerData.models.length > 0) {
      defaultModel = providerData.models[0];
    }
    // Update state with new values
    setSelectedModelProvider(provider);
    setModelApiKey(newApiKey);
    setSelectedModel(defaultModel);

    // Create current state object to pass to debounced function
    const currentState = {
      selectedModelProvider: provider,
      selectedModel: defaultModel,
      modelApiKey: newApiKey,
      modelLiveUrl,
      agentApiKey: localAgentApiKey
    };

    // Save to centralized state
    saveStateToCentralized({
      selectedModelProvider: provider,
      selectedModel: defaultModel,
      modelApiKey: newApiKey
    });

    // Trigger auto-save with current state to avoid stale closure
    debouncedModelSave(currentState);

    // Reset the flag after a delay
    providerChangeTimeoutRef.current = setTimeout(() => {
      setIsUserChangingProvider(false);
    }, 300);
  };

  // handleModelConfiguration function removed - replaced with auto-save functionality

  // handlePromptConfiguration function removed - replaced with auto-save functionality

  // getStatusIcon function removed - no longer needed with auto-save functionality

  // handleSaveConfig function removed - no longer needed with auto-save functionality


  // Note: Removed problematic useEffect that was causing state conflicts
  // State changes are now handled by saveStateToCentralized function called from user interactions

  // Fetch knowledge bases
  const fetchKnowledgeBases = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    setLoadingKnowledgeBases(true);
    try {
      const response = await fetch('/api/knowledge-bases', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setKnowledgeBases(data || []);
      } else {
      }
    } catch (error) {
    } finally {
      setLoadingKnowledgeBases(false);
    }
  }, [accessToken]);

  // Load knowledge bases when modal is opened
  useEffect(() => {
    if (showKnowledgeModal) {
      fetchKnowledgeBases();
    }
  }, [showKnowledgeModal, fetchKnowledgeBases]);

  // Load knowledge bases on component mount to validate selections
  useEffect(() => {
    fetchKnowledgeBases();
  }, [fetchKnowledgeBases]);

  // Validate and clean up invalid knowledge base selections
  useEffect(() => {
    if (knowledgeBases.length > 0 && selectedKnowledgeBases.length > 0) {
      const validKnowledgeBaseIds = knowledgeBases.map(kb => kb.id);
      const invalidSelections = selectedKnowledgeBases.filter(id => !validKnowledgeBaseIds.includes(id));
      
      if (invalidSelections.length > 0) {
        const validSelections = selectedKnowledgeBases.filter(id => validKnowledgeBaseIds.includes(id));
        setSelectedKnowledgeBases(validSelections);
        saveStateToCentralized({ selectedKnowledgeBases: validSelections });
        
        // Update localStorage with cleaned selections
        if (typeof window !== 'undefined' && localAgentApiKey) {
          const storageKey = getAgentStorageKey(localAgentApiKey);
          localStorage.setItem(storageKey, JSON.stringify(validSelections));
        }
        
        // Save cleaned configuration to Dify if we have valid selections or if clearing all
        if (validSelections.length >= 0) {
          debouncedKnowledgeBaseSave(validSelections);
        }
      }
    }
  }, [knowledgeBases, selectedKnowledgeBases, localAgentApiKey]);

  // Load current agent configuration from centralized config to restore knowledge base selections
  const loadAgentConfig = useCallback(() => {
    // Load knowledge base selections from existing config if available
    if (existingConfig && existingConfig.selectedKnowledgeBases) {
      setSelectedKnowledgeBases(existingConfig.selectedKnowledgeBases);
    } else {
      // Fallback: load from localStorage using agent API key as ID
      if (localAgentApiKey && typeof window !== 'undefined') {
        const storageKey = getAgentStorageKey(localAgentApiKey);
        try {
          const savedKnowledgeBases = localStorage.getItem(storageKey);
          if (savedKnowledgeBases) {
            const knowledgeBaseIds = JSON.parse(savedKnowledgeBases);
            setSelectedKnowledgeBases(knowledgeBaseIds);
            saveStateToCentralized({ selectedKnowledgeBases: knowledgeBaseIds });
          }
        } catch (error) {
        }
      }
    }
  }, [existingConfig, localAgentApiKey]);

  // Load agent configuration when component mounts or relevant data changes
  useEffect(() => {
    if ((existingConfig || localAgentApiKey) && !selectedKnowledgeBases.length) {
      loadAgentConfig();
    }
  }, [existingConfig, localAgentApiKey, selectedKnowledgeBases.length, loadAgentConfig]);

  // Save knowledge base configuration to Dify via model-config API
  const saveKnowledgeBaseConfig = useCallback(async (knowledgeBaseIds: string[]) => {
    try {
      // Get the correct API provider string
      const apiProvider = modelProviders[selectedModelProvider as keyof typeof modelProviders]?.apiProvider || 'langgenius/openai/openai';
      
      // Get the correct model API name
      const apiModel = modelApiMapping[selectedModel] || 'gpt-4o';
      // Get the app ID from localStorage
      let appId = localStorage.getItem(`dify_app_id_${localAgentApiKey}`);
if (!appId) {
        // Fallback: Try to get the app ID from the current agent list
        // Try to get from existingConfig if available
        if (existingConfig && existingConfig.dify_app_id) {
          appId = existingConfig.dify_app_id;
          // Store for future use
          localStorage.setItem(`dify_app_id_${localAgentApiKey}`, appId);
        } else {
          // Last resort: Search Dify for the app by API key
          try {
            const searchResponse = await fetch('/api/dify/get-app-by-key', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ apiKey: localAgentApiKey })
            });
            
            if (searchResponse.ok) {
              const searchData = await searchResponse.json();
              appId = searchData.appId;
              // Store for future use
              localStorage.setItem(`dify_app_id_${localAgentApiKey}`, appId);
            } else {
              alert('⚠️ App ID not found in storage. This agent might have been created before the app ID tracking was implemented. Please create a new agent or contact support.');
              return false;
            }
          } catch (searchError) {
            alert('⚠️ App ID not found in storage. This agent might have been created before the app ID tracking was implemented. Please create a new agent or contact support.');
            return false;
          }
        }
      }
      
      // Validate app ID format (should be a UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(appId)) {
// Try to fetch the correct app ID from Dify by searching with API key
        try {
          const searchResponse = await fetch('/api/dify/get-app-by-key', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: localAgentApiKey })
          });
          
          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            appId = searchData.appId;
            // Store the corrected app ID
            localStorage.setItem(`dify_app_id_${localAgentApiKey}`, appId);
            alert(`✅ App ID Fixed!\n\nFound the correct App ID: ${appId}\n\nThe configuration will now be saved.`);
          } else {
            alert(`⚠️ Invalid App ID Detected\n\nStored App ID: ${appId}\n\nThis agent was created with an incorrect App ID format. The App ID should be a UUID (e.g., 661d95ae-77ee-4cfd-88e3-e6f3ef8d638b).\n\n✅ Solution: Delete this agent and create a new one. The app ID tracking has been fixed in the latest version.`);
            return false;
          }
        } catch (searchError) {
          alert(`⚠️ Invalid App ID Detected\n\nStored App ID: ${appId}\n\nThis agent was created with an incorrect App ID format. The App ID should be a UUID (e.g., 661d95ae-77ee-4cfd-88e3-e6f3ef8d638b).\n\n✅ Solution: Delete this agent and create a new one. The app ID tracking has been fixed in the latest version.`);
          return false;
        }
      }
      
      const response = await fetch('/api/model-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: apiProvider,
          model: apiModel,
          api_key: modelApiKey,
          chatbot_api_key: localAgentApiKey,
          app_id: appId, // Pass the app ID
          dataset_configs: {
            retrieval_model: "single",
            datasets: {
              datasets: knowledgeBaseIds.map(datasetId => ({ 
                dataset: {
                  enabled: true,
                  id: datasetId
                }
              }))
            },
            top_k: 4,
            reranking_enable: false
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        // If we get a 404 "app_not_found", try to find the correct app ID
        if (response.status === 404 && errorText.includes('app_not_found')) {
          try {
            const searchResponse = await fetch('/api/dify/get-app-by-key', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ apiKey: localAgentApiKey })
            });
            
            if (searchResponse.ok) {
              const searchData = await searchResponse.json();
              const correctAppId = searchData.appId;
              // Update localStorage with correct app ID
              localStorage.setItem(`dify_app_id_${localAgentApiKey}`, correctAppId);
              
              alert(`✅ App ID has been corrected!\n\nOld (incorrect): ${appId}\nNew (correct): ${correctAppId}\n\nPlease try adding the knowledge base again.`);
              
              // Return false to let user retry
              return false;
            } else {
              alert(`❌ App Not Found\n\nThe agent with App ID "${appId}" does not exist.\n\nThis might happen if:\n• The agent was deleted\n• The App ID was incorrectly stored\n\n✅ Solution: Delete this agent and create a new one.`);
              return false;
            }
          } catch (searchError) {
            alert(`Failed to save: ${response.status} ${response.statusText}\n${errorText.substring(0, 200)}`);
            return false;
          }
        } else {
          alert(`Failed to save: ${response.status} ${response.statusText}\n${errorText.substring(0, 200)}`);
          return false;
        }
      }

      const data = await response.json();
      // Also save to localStorage for persistence across refreshes
      if (typeof window !== 'undefined' && localAgentApiKey) {
        const storageKey = getAgentStorageKey(localAgentApiKey);
        localStorage.setItem(storageKey, JSON.stringify(knowledgeBaseIds));
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }, [selectedModelProvider, selectedModel, modelApiKey, localAgentApiKey]);

  // Debounced save function for knowledge base changes
  const debouncedKnowledgeBaseSave = useCallback(
    debounce(async (knowledgeBaseIds: string[]) => {
      await saveKnowledgeBaseConfig(knowledgeBaseIds);
    }, 500),
    [saveKnowledgeBaseConfig]
  );

  return (
    <div ref={ref} className="space-y-6 p-6">

      {/* System Prompt Container */}
      <div className={`p-4 sm:p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-900/50' : 'bg-green-100'}`}>
              <Sparkles className={`h-4 w-4 sm:h-5 sm:w-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <div>
              <h4 className={`font-bold text-sm sm:text-base ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>System Prompt</h4>
            </div>
          </div>

          {/* System Prompt button removed - changes are now saved automatically via debouncedPromptSave */}
        </div>

        <div className="space-y-4">
          {errorMessage && (
            <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Error</span>
              </div>
              <p className="text-sm mt-1">{errorMessage}</p>
            </div>
          )}

          {successMessage && (
            <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-green-900/20 border-green-700 text-green-300' : 'bg-green-50 border-green-200 text-green-700'}`}>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Success</span>
              </div>
              <p className="text-sm mt-1">{successMessage}</p>
            </div>
          )}

          {isSaving && (
            <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-blue-900/20 border-blue-700 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Saving...</span>
              </div>
              <p className="text-sm mt-1">Configuration is being saved to localStorage and Dify API</p>
            </div>
          )}

          <div>
            <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              System Prompt
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => {
                setSystemPrompt(e.target.value);
                saveStateToCentralized({ systemPrompt: e.target.value });
                // Add auto-save to Dify with debouncing
                debouncedPromptSave(e.target.value);
              }}
              disabled={!isEditing}
              placeholder="Enter the system prompt that defines your agent's behavior..."
              rows={12}
              className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all duration-300 text-sm sm:text-base resize-none leading-normal ${!isEditing
                ? isDarkMode
                  ? 'bg-gray-800/30 border-gray-700 text-gray-400 placeholder-gray-500 cursor-not-allowed'
                  : 'bg-gray-100 border-gray-300 text-gray-500 placeholder-gray-400 cursor-not-allowed'
                : isDarkMode
                  ? 'bg-gray-700/50 border-gray-600 text-gray-200 placeholder-gray-400'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
                }`}
            />
          </div>
        </div>
      </div>

      {/* Knowledge Base Container */}
      <div className={`p-4 sm:p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
              <BookOpen className={`h-4 w-4 sm:h-5 sm:w-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
            <div>
              <h4 className={`font-bold text-sm sm:text-base ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Agent Knowledge Base</h4>
              <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Select knowledge bases to provide context to your agent
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {selectedKnowledgeBases.length > 0 ? (
            <div className="space-y-2">
              <label className={`block text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Selected Knowledge Bases ({selectedKnowledgeBases.length})
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedKnowledgeBases.map(kbId => {
                  const kb = knowledgeBases.find(k => k.id === kbId);
                  return (
                    <div key={kbId} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${isDarkMode 
                      ? 'bg-purple-900/30 border-purple-700 text-purple-300' 
                      : 'bg-purple-50 border-purple-200 text-purple-700'
                    }`}>
                      <BookOpen className="h-4 w-4" />
                      <span className="text-sm">{kb?.name || 'Unknown (deleted)'}</span>
                      {kb ? (
                        <span className={`text-xs px-2 py-1 rounded-full ${kb.indexingTechnique === 'high_quality' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-blue-100 text-blue-600'
                        }`}>
                          {kb.indexingTechnique === 'high_quality' ? 'HQ • VECTOR' : 'ECONOMY'}
                        </span>
                      ) : (
                        <span className={`text-xs px-2 py-1 rounded-full ${isDarkMode 
                          ? 'bg-orange-900/30 border-orange-700 text-orange-300' 
                          : 'bg-orange-100 border-orange-200 text-orange-700'
                        }`}>
                          DELETED
                        </span>
                      )}
                      <button
                        onClick={() => {
                          const newSelected = selectedKnowledgeBases.filter(id => id !== kbId);
                          setSelectedKnowledgeBases(newSelected);
                          saveStateToCentralized({ selectedKnowledgeBases: newSelected });
                          // Save to backend
                          debouncedKnowledgeBaseSave(newSelected);
                        }}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                          isDarkMode 
                            ? 'bg-red-900/30 text-red-300 hover:bg-red-900/50' 
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <BookOpen className="h-4 w-4" />
                <span>No knowledge bases selected yet</span>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setShowKnowledgeModal(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200 ${isDarkMode 
                ? 'bg-purple-900/20 border-purple-700 text-purple-300 hover:bg-purple-800/30' 
                : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
              }`}
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm font-medium">Add Knowledge Base</span>
            </button>
            
            {selectedKnowledgeBases.some(id => !knowledgeBases.find(kb => kb.id === id)) && (
              <button
                onClick={() => {
                  const validSelections = selectedKnowledgeBases.filter(id => knowledgeBases.find(kb => kb.id === id));
                  setSelectedKnowledgeBases(validSelections);
                  saveStateToCentralized({ selectedKnowledgeBases: validSelections });
                  debouncedKnowledgeBaseSave(validSelections);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200 ${isDarkMode 
                  ? 'bg-orange-900/20 border-orange-700 text-orange-300 hover:bg-orange-800/30' 
                  : 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'
                }`}
              >
                <X className="h-4 w-4" />
                <span className="text-sm font-medium">Clear Invalid</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Model Selection Container */}
      <div className={`p-4 sm:p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
              <Sparkles className={`h-4 w-4 sm:h-5 sm:w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div>
              <h4 className={`font-bold text-sm sm:text-base ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Model Selection</h4>
            </div>
          </div>

          {/* Model Configuration button removed - changes are now saved automatically via debouncedModelSave */}
        </div>

        <div className="space-y-4">
          <div>
            <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Model Provider
            </label>
            <select
              value={selectedModelProvider}
              onChange={(e) => {
                handleProviderChange(e.target.value);
                // Note: handleProviderChange already triggers debouncedModelSave with current state
              }}
              disabled={!isEditing}
              className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 text-sm sm:text-base ${!isEditing
                ? isDarkMode
                  ? 'bg-gray-800/30 border-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                : isDarkMode
                  ? 'bg-gray-700/50 border-gray-600 text-gray-200'
                  : 'bg-gray-50 border-gray-200 text-gray-900'
                }`}
            >
              {Object.keys(modelProviders).map((provider) => (
                <option key={provider} value={provider}>{provider}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => {
                const newModel = e.target.value;
                setSelectedModel(newModel);
                saveStateToCentralized({ selectedModel: newModel });

                // Create current state object to pass to debounced function
                const currentState = {
                  selectedModelProvider,
                  selectedModel: newModel,
                  modelApiKey,
                  modelLiveUrl,
                  agentApiKey: localAgentApiKey
                };

                debouncedModelSave(currentState); // Pass current state to avoid stale closure
              }}
              disabled={!isEditing}
              className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 text-sm sm:text-base ${!isEditing
                ? isDarkMode
                  ? 'bg-gray-800/30 border-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                : isDarkMode
                  ? 'bg-gray-700/50 border-gray-600 text-gray-200'
                  : 'bg-gray-50 border-gray-200 text-gray-900'
                }`}
            >
              {modelProviders[selectedModelProvider as keyof typeof modelProviders]?.models.map((model) => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Model API Key
            </label>
            <div className="relative">
              <input
                type={!isEditing || isUsingModelApiKey ? "text" : "password"}
                value={!isEditing || isUsingModelApiKey ? getApiKeyDisplayValue(modelApiKey) : modelApiKey}
                onChange={(e) => {
                  setModelApiKey(e.target.value);
                  saveStateToCentralized({ modelApiKey: e.target.value });
                }}
                disabled={!isEditing || isUsingModelApiKey}
                placeholder={isUsingModelApiKey ? `Using configured ${selectedModelProvider} API key` : `Enter your ${selectedModelProvider} API key`}
                className={`w-full p-3 pr-10 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 text-sm sm:text-base ${!isEditing || isUsingModelApiKey
                  ? isDarkMode
                    ? 'bg-gray-800/30 border-gray-700 text-gray-400 placeholder-gray-500 cursor-not-allowed'
                    : 'bg-gray-100 border-gray-300 text-gray-500 placeholder-gray-400 cursor-not-allowed'
                  : isDarkMode
                    ? 'bg-gray-700/50 border-gray-600 text-gray-200 placeholder-gray-400'
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
                  }`}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {isUsingModelApiKey ? '🔄' : '🔒'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dify API Configuration Container */}
      <div className={`p-4 sm:p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
              <Sparkles className={`h-4 w-4 sm:h-5 sm:w-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
            <div>
              <h4 className={`font-bold text-sm sm:text-base ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Agent API Configuration</h4>
            </div>
          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Agent URL
            </label>
            <input
              type="url"
              value={agentUrl}
              onChange={(e) => {
                setAgentUrl(e.target.value);
                saveStateToCentralized({
                  agentUrl: e.target.value,
                  chatbot_api: e.target.value
                });
              }}
              placeholder="https://your-agent-api-url.com/v1"
              className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300 text-sm sm:text-base ${isDarkMode
                ? 'bg-gray-700/50 border-gray-600 text-gray-200 placeholder-gray-400'
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
                }`}
            />
          </div>

          <div>
            <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Agent API Key
            </label>
            <div className="relative">
              <input
                type="text"
                value={localAgentApiKey}
                onChange={(e) => {
                  setLocalAgentApiKey(e.target.value);
                  saveStateToCentralized({
                    agentApiKey: e.target.value,
                    chatbot_key: e.target.value
                  });
                }}
                placeholder="Enter your Agent chatbot API key"
                className={`w-full p-3 pr-10 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300 text-sm sm:text-base ${isDarkMode
                  ? 'bg-gray-700/50 border-gray-600 text-gray-200 placeholder-gray-400'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
                  }`}
              />
              {/* Lock icon removed - field is now editable */}
            </div>
            {!localAgentApiKey && (
              <div className={`mt-2 p-3 rounded-lg border ${isDarkMode ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                <div className="text-sm">
                  <p className="mb-2">
                    ⚠️ <strong>API Key Missing:</strong> No API key found for this agent. This might be due to:
                  </p>
                  <ul className="mt-2 ml-4 list-disc">
                    <li>Session timeout - try refreshing the page</li>
                    <li>Agent not properly configured - check agent settings</li>
                    <li>Backend issue - contact support</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Note: Save Config Button removed - changes are now saved automatically via saveStateToCentralized */}
      </div>

      {/* Knowledge Base Selection Modal */}
      {showKnowledgeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-2xl max-h-[80vh] rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            {/* Modal Header */}
            <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className={`h-6 w-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                  <h3 className={`text-lg font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                    Select Reference Knowledge
                  </h3>
                </div>
                <button
                  onClick={() => setShowKnowledgeModal(false)}
                  className={`p-2 rounded-full hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-700' : ''}`}
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search knowledge bases..."
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>

              {/* Knowledge Bases List */}
              <div className="max-h-64 overflow-y-auto space-y-2 mb-6">
                {loadingKnowledgeBases ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <span className={`ml-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading...</span>
                  </div>
                ) : knowledgeBases.filter(kb => 
                  kb.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  kb.description.toLowerCase().includes(searchTerm.toLowerCase())
                ).length === 0 ? (
                  <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No knowledge bases found</p>
                  </div>
                ) : (
                  knowledgeBases.filter(kb => 
                    kb.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    kb.description.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map(kb => (
                    <div
                      key={kb.id}
                      onClick={() => {
                        const isSelected = selectedKnowledgeBases.includes(kb.id);
                        if (isSelected) {
                          const newSelected = selectedKnowledgeBases.filter(id => id !== kb.id);
                          setSelectedKnowledgeBases(newSelected);
                          saveStateToCentralized({ selectedKnowledgeBases: newSelected });
                          // Save to backend
                          debouncedKnowledgeBaseSave(newSelected);
                        } else {
                          const newSelected = [...selectedKnowledgeBases, kb.id];
                          setSelectedKnowledgeBases(newSelected);
                          saveStateToCentralized({ selectedKnowledgeBases: newSelected });
                          // Save to backend
                          debouncedKnowledgeBaseSave(newSelected);
                        }
                      }}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedKnowledgeBases.includes(kb.id)
                          ? isDarkMode 
                            ? 'bg-purple-900/30 border-purple-700' 
                            : 'bg-purple-50 border-purple-200'
                          : isDarkMode 
                            ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-600/50' 
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <BookOpen className={`h-4 w-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                          <div>
                            <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{kb.name}</h4>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {kb.documentCount} documents
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            kb.indexingTechnique === 'high_quality' 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-blue-100 text-blue-600'
                          }`}>
                            {kb.indexingTechnique === 'high_quality' ? 'HQ • VECTOR' : 'ECONOMY'}
                          </span>
                          {selectedKnowledgeBases.includes(kb.id) && (
                            <CheckCircle className="h-4 w-4 text-purple-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {selectedKnowledgeBases.length} Knowledge selected
                </span>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowKnowledgeModal(false)}
                    className={`px-4 py-2 rounded-lg border ${isDarkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (publishingAgent) return; // Prevent multiple clicks
                      
                      setShowKnowledgeModal(false);
                      setPublishingAgent(true);
                      
                      // Trigger publish after knowledge base configuration is saved
                      if (localAgentApiKey) {
                        try {
                          // Get the app ID from localStorage
                          const appId = localStorage.getItem(`dify_app_id_${localAgentApiKey}`);
                          if (!appId) {
                            alert('⚠️ Could not find app ID. The configuration has been saved but may require manual publishing.');
                            setPublishingAgent(false);
                            return;
                          }
                          
                          const response = await fetch('/api/publish-agent', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              chatbot_api_key: localAgentApiKey,
                              app_id: appId
                            })
                          });
                          
                          if (response.ok) {
                            const result = await response.json();
                          } else {
                            const error = await response.json();
                            alert('❌ Failed to publish agent: ' + (error.error || error.message || 'Unknown error'));
                          }
                        } catch (error) {
                          alert('❌ Error publishing agent: ' + (error instanceof Error ? error.message : 'Unknown error'));
                        }
                      }
                      
                      setPublishingAgent(false);
                    }}
                    disabled={publishingAgent}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      publishingAgent
                        ? 'bg-purple-400 cursor-not-allowed text-white'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    {publishingAgent ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      'Add & Publish'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

ModelConfig.displayName = 'ModelConfig';

export default ModelConfig;
