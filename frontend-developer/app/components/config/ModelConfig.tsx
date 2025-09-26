'use client';

import React, { forwardRef, useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, CheckCircle, AlertCircle, Loader2, Copy, Check } from 'lucide-react';
import { modelConfigService } from '../../../service/modelConfigService';
import { useTheme } from '../../contexts/ThemeContext';
import { maskApiKey } from '../../../service/agentConfigService';

interface ModelConfigProps {
  agentName?: string;
  onConfigChange?: (config: any) => void;
  existingConfig?: any;
  isEditing?: boolean;
  onConfigUpdated?: () => void; // Add callback to refresh agent data
}

const ModelConfig = forwardRef<HTMLDivElement, ModelConfigProps>(({ agentName = 'default', onConfigChange, existingConfig, isEditing = true, onConfigUpdated }, ref) => {
  const { isDarkMode } = useTheme();

  // Helper function to get masked display value for API keys
  const getApiKeyDisplayValue = (actualKey: string) => {
    if (!actualKey) return '••••••••••••••••••••••••••••••••';
    return maskApiKey(actualKey);
  };
  const [selectedModelProvider, setSelectedModelProvider] = useState('OpenAI');
  const [selectedModel, setSelectedModel] = useState('GPT-4o');
  const [modelLiveUrl, setModelLiveUrl] = useState(process.env.NEXT_PUBLIC_DIFY_BASE_URL || '');
  const [modelApiKey, setModelApiKey] = useState(process.env.NEXT_PUBLIC_MODEL_OPEN_AI_API_KEY || '');
  const [agentUrl, setAgentUrl] = useState(process.env.NEXT_PUBLIC_CHATBOT_API_URL || '');
  const [agentApiKey, setAgentApiKey] = useState('');
  const [copiedAgentApiKey, setCopiedAgentApiKey] = useState(false);
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
        console.log('✅ Loaded model config from localStorage:', config);
      }
      
      if (savedPrompt) {
        const promptData = JSON.parse(savedPrompt);
        setSystemPrompt(promptData.prompt || systemPrompt);
        console.log('✅ Loaded prompt from localStorage:', promptData);
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
    }
  }, [agentName, getStorageKey, systemPrompt]);

  // Add save to storage function
  const saveToStorage = useCallback((type: 'config' | 'prompt', data: any) => {
    try {
      const key = getStorageKey(type);
      localStorage.setItem(key, JSON.stringify(data));
      console.log('✅ Saved to localStorage:', key, data);
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }, [getStorageKey]);

  // Load state from centralized configuration when component mounts or when configuration changes
  useEffect(() => {
    console.log('🔄 ModelConfig useEffect triggered:', {
      existingConfig,
      isUserChangingProvider,
      isUserChangingModel
    });
    
    // Reset user change flags when existingConfig changes (tab switch)
    if (existingConfig) {
      setIsUserChangingProvider(false);
      setIsUserChangingModel(false);
    }
    
    // Load from centralized configuration
    if (existingConfig && !isUserChangingProvider && !isUserChangingModel) {
      console.log('🔄 Loading model state from centralized configuration:', existingConfig);
      console.log('🔍 existingConfig.chatbot_api:', existingConfig.chatbot_api);
      console.log('🔍 existingConfig.chatbot_key:', existingConfig.chatbot_key);
      console.log('🔍 existingConfig.agentUrl:', existingConfig.agentUrl);
      console.log('🔍 existingConfig.agentApiKey:', existingConfig.agentApiKey);
      
      if (existingConfig.selectedModelProvider) {
        console.log('🔄 Setting model provider:', existingConfig.selectedModelProvider);
        setSelectedModelProvider(existingConfig.selectedModelProvider);
      }
      if (existingConfig.selectedModel) {
        console.log('🔄 Setting selected model:', existingConfig.selectedModel);
        setSelectedModel(existingConfig.selectedModel);
      }
      if (existingConfig.modelLiveUrl) {
        console.log('🔄 Setting model live URL:', existingConfig.modelLiveUrl);
        setModelLiveUrl(existingConfig.modelLiveUrl);
      }
      if (existingConfig.modelApiKey) {
        console.log('🔄 Setting model API key');
        setModelApiKey(existingConfig.modelApiKey);
      }
      if (existingConfig.chatbot_api) {
        console.log('🔄 Setting agent URL from chatbot_api:', existingConfig.chatbot_api);
        setAgentUrl(existingConfig.chatbot_api);
      } else if (existingConfig.agentUrl) {
        console.log('🔄 Setting agent URL from agentUrl:', existingConfig.agentUrl);
        setAgentUrl(existingConfig.agentUrl);
      }
      if (existingConfig.chatbot_key) {
        console.log('🔄 Setting agent API key from chatbot_key:', existingConfig.chatbot_key);
        setAgentApiKey(existingConfig.chatbot_key);
      } else if (existingConfig.agentApiKey) {
        console.log('🔄 Setting agent API key from agentApiKey:', existingConfig.agentApiKey);
        setAgentApiKey(existingConfig.agentApiKey);
      }
      if (existingConfig.systemPrompt) {
        console.log('🔄 Setting system prompt');
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

  // Debug: Watch for changes to agentApiKey
  useEffect(() => {
    console.log('🔍 agentApiKey state changed to:', agentApiKey);
  }, [agentApiKey]);

  // Debug: Watch for changes to agentUrl
  useEffect(() => {
    console.log('🔍 agentUrl state changed to:', agentUrl);
  }, [agentUrl]);

  // Debug: Watch for changes to selectedModelProvider
  useEffect(() => {
    console.log('🔍 selectedModelProvider state changed to:', selectedModelProvider);
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
          agentApiKey,
          systemPrompt,
          // Include the field names that AgentsTab expects
          chatbot_api: agentUrl,
          chatbot_key: agentApiKey
        });
      }
    }, 1000); // Increased to 1 second to reduce conflicts with debouncedModelSave
    
    // Cleanup timeout on unmount or dependency change
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [selectedModelProvider, selectedModel, modelApiKey, modelLiveUrl, agentUrl, agentApiKey, systemPrompt, saveToStorage, onConfigChange]);

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
        agentApiKey,
        systemPrompt,
        // Include the field names that AgentsTab expects
        chatbot_api: agentUrl,
        chatbot_key: agentApiKey,
        ...updates
      };
      
      console.log('📤 ModelConfig: Saving state to centralized config:', currentState);
      console.log('🔍 agentUrl being saved:', agentUrl);
      console.log('🔍 agentApiKey being saved:', agentApiKey);
      console.log('🔍 chatbot_api being saved:', agentUrl);
      console.log('🔍 chatbot_key being saved:', agentApiKey);
      
      if (onConfigChange) {
        onConfigChange(currentState);
      }
    } catch (error) {
      console.error('❌ Error saving state to centralized config:', error);
    }
  }, [selectedModelProvider, selectedModel, modelLiveUrl, modelApiKey, agentUrl, agentApiKey, systemPrompt, onConfigChange]);

  // Debounced prompt save function
  const debouncedPromptSave = useCallback((promptValue: string) => {
    if (promptSaveTimeoutRef.current) {
      clearTimeout(promptSaveTimeoutRef.current);
    }
    
    promptSaveTimeoutRef.current = setTimeout(async () => {
      // Prevent multiple simultaneous saves
      if (saveInProgress) {
        console.log('🔄 Prompt save already in progress, skipping...');
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
          console.log('✅ Prompt auto-saved to Dify');
          // Only show success message if enough time has passed since last save
          const now = Date.now();
          if (now - lastSaveTime > 2000) { // 2 second cooldown
            setSuccessMessage('Prompt saved successfully');
            setLastSaveTime(now);
          }
        } else {
          console.error('❌ Failed to auto-save prompt:', result.message);
          setErrorMessage(`Failed to save prompt: ${result.message}`);
        }
      } catch (error) {
        console.error('❌ Failed to auto-save prompt:', error);
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
        console.log('🔄 Save already in progress, skipping...');
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
          agentApiKey
        };
        
        console.log('🔄 Starting model save with provider:', stateToUse.selectedModelProvider);
        
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
        
        console.log('🔍 Debug Model Save:');
        console.log('🔍 selectedModelProvider:', stateToUse.selectedModelProvider);
        console.log('🔍 provider object:', provider);
        console.log('🔍 provider.apiProvider:', provider?.apiProvider);
        console.log('🔍 selectedModel:', stateToUse.selectedModel);
        console.log('🔍 apiModel:', apiModel);
        
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
            chatbot_api_key: chatbotApiKey
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
          console.log('✅ Model config auto-saved to Dify');
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
          console.error('❌ Failed to auto-save model config:', result.message);
          setErrorMessage(`Failed to save model config: ${result.message}`);
        }
      } catch (error) {
        console.error('❌ Failed to auto-save model config:', error);
        setErrorMessage(`Failed to save model config: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsSaving(false);
        setSaveInProgress(false);
      }
    }, 2000); // 2 second delay
  }, [selectedModelProvider, selectedModel, modelApiKey, modelLiveUrl, agentUrl, agentApiKey, existingConfig, saveToStorage, saveInProgress]);

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
      models: ['Claude 3.5 Sonnet', 'Claude 3.5 Haiku', 'Claude 3 Opus', 'Claude 3 Sonnet', 'Claude 3 Haiku'],
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
    console.log('🔄 Provider changing from', selectedModelProvider, 'to', provider);
    console.log('🔍 Provider change debug - new provider:', provider);
    console.log('🔍 Provider change debug - modelProviders[provider]:', modelProviders[provider as keyof typeof modelProviders]);

    // Set flag to prevent existingConfig from overriding user selection
    setIsUserChangingProvider(true);

    // Clear any pending timeouts
    if (providerChangeTimeoutRef.current) {
      clearTimeout(providerChangeTimeoutRef.current);
    }

    // Cancel any pending model saves to prevent conflicts
    if (modelSaveTimeoutRef.current) {
      clearTimeout(modelSaveTimeoutRef.current);
      console.log('🔄 Cancelled pending model save due to provider change');
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

    console.log('✅ Provider changed to', provider, 'with reset model and API key');

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
      agentApiKey
    };

    // Save to centralized state
    saveStateToCentralized({
      selectedModelProvider: provider,
      selectedModel: defaultModel,
      modelApiKey: newApiKey
    });

    // Trigger auto-save with current state to avoid stale closure
    console.log('🔄 Triggering model save with current state:', currentState);
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
              <h4 className={`font-semibold text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>System Prompt</h4>
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
              className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all duration-300 text-sm sm:text-base resize-none ${!isEditing
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

      {/* Model Selection Container */}
      <div className={`p-4 sm:p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
              <Sparkles className={`h-4 w-4 sm:h-5 sm:w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div>
              <h4 className={`font-semibold text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Model Selection</h4>
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
                  agentApiKey
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
              <h4 className={`font-semibold text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Agent API Configuration</h4>
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
                value={agentApiKey}
                onChange={(e) => {
                  setAgentApiKey(e.target.value);
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
          </div>
        </div>

        {/* Note: Save Config Button removed - changes are now saved automatically via saveStateToCentralized */}
      </div>
    </div>
  );
});

ModelConfig.displayName = 'ModelConfig';

export default ModelConfig;