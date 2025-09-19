'use client';

import React, { forwardRef, useState } from 'react';
import { Sparkles, CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { modelConfigService } from '../../../service/modelConfigService';
import { useTheme } from '../../contexts/ThemeContext';

interface ModelConfigProps {
  agentName?: string;
  onConfigChange?: (config: any) => void;
  existingConfig?: any;
  isEditing?: boolean;
}

const ModelConfig = forwardRef<HTMLDivElement, ModelConfigProps>(({ agentName = 'default', onConfigChange, existingConfig, isEditing = true }, ref) => {
  const { isDarkMode } = useTheme();
  const [selectedModelProvider, setSelectedModelProvider] = useState('OpenAI');
  const [selectedModel, setSelectedModel] = useState('GPT-4o');
  const [modelLiveUrl, setModelLiveUrl] = useState(process.env.NEXT_PUBLIC_DIFY_BASE_URL || '');
  const [modelApiKey, setModelApiKey] = useState(process.env.NEXT_PUBLIC_MODEL_OPEN_AI_API_KEY || '');
  const [agentApiKey, setAgentApiKey] = useState('');
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

Remember: You are the first point of contact for many patients. Your professionalism and helpfulness directly impact their experience with Wellness Partners.`);

  // Loading and error states
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [modelConfigStatus, setModelConfigStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [promptConfigStatus, setPromptConfigStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Configuration status states
  const [isModelConfigured, setIsModelConfigured] = useState(false);
  const [isPromptConfigured, setIsPromptConfigured] = useState(false);
  const [currentModelConfig, setCurrentModelConfig] = useState<any>(null);
  const [currentPromptConfig, setCurrentPromptConfig] = useState<any>(null);
  const [isUsingModelApiKey, setIsUsingModelApiKey] = useState(false);

  // Track if we've initialized the config to prevent overriding user changes
  const [hasInitializedConfig, setHasInitializedConfig] = React.useState(false);

  // Load existing configuration when provided (only once per agent)
  React.useEffect(() => {
    if (existingConfig && !hasInitializedConfig) {
      console.log('🔄 Loading existing model config:', existingConfig);
      
      // Set model provider and model from existing config
      if (existingConfig.selectedModelProvider) {
        setSelectedModelProvider(existingConfig.selectedModelProvider);
      }
      if (existingConfig.selectedModel) {
        setSelectedModel(existingConfig.selectedModel);
      }
      if (existingConfig.modelLiveUrl) {
        setModelLiveUrl(existingConfig.modelLiveUrl);
      }
      // Set model API key from existing config
      if (existingConfig.modelApiKey) {
        setModelApiKey(existingConfig.modelApiKey);
      }
      
      // Set agent API key from existing config (Dify chatbot key)
      if (existingConfig.chatbot_key) {
        setAgentApiKey(existingConfig.chatbot_key);
      }
      
      // Set system prompt from existing config
      if (existingConfig.systemPrompt) {
        setSystemPrompt(existingConfig.systemPrompt);
      }

      // Check if this agent is using a custom model API key
      const modelKey = existingConfig.modelApiKey || existingConfig.model_api_key;
      const hasModelApiKey = modelKey && 
        modelKey !== process.env.NEXT_PUBLIC_MODEL_OPEN_AI_API_KEY &&
        (modelKey.startsWith('sk-') || modelKey.startsWith('gsk_') || modelKey.startsWith('sk-ant-')); // Model API keys
      setIsUsingModelApiKey(hasModelApiKey);
      
      setHasInitializedConfig(true);
    }
  }, [existingConfig, hasInitializedConfig]);

  // Fetch current prompt from localStorage (stored when prompt was saved to Dify)
  const fetchCurrentPrompt = async (forceLoad = false) => {
    setIsLoadingPrompt(true);
    setErrorMessage('');

    try {
      console.log('🔍 Fetching current prompt from localStorage...');
      
      // Try to get the prompt from localStorage
      try {
        const savedPromptData = localStorage.getItem(`difyPrompt_${agentName}`);
        if (savedPromptData) {
          const promptData = JSON.parse(savedPromptData);
          const prompt = promptData.systemPrompt || promptData.prompt;
          if (prompt) {
            console.log('✅ Current prompt fetched from localStorage:', prompt);
            setSystemPrompt(prompt);
            setCurrentPromptConfig(promptData);
            setIsPromptConfigured(true);
            setIsLoadingPrompt(false);
            return;
          }
        }
      } catch (error) {
        console.warn('⚠️ Error reading from localStorage:', error);
      }

      // Also try the alternative localStorage key
      try {
        const savedPromptData = localStorage.getItem(`promptConfig_${agentName}`);
        if (savedPromptData) {
          const promptData = JSON.parse(savedPromptData);
          const prompt = promptData.systemPrompt || promptData.prompt;
          if (prompt) {
            console.log('✅ Current prompt fetched from localStorage (alt key):', prompt);
            setSystemPrompt(prompt);
            setCurrentPromptConfig(promptData);
            setIsPromptConfigured(true);
            setIsLoadingPrompt(false);
            return;
          }
        }
      } catch (error) {
        console.warn('⚠️ Error reading from localStorage (alt key):', error);
      }

      // If no prompt found in localStorage, keep current prompt
      console.log('ℹ️ No prompt found in localStorage, keeping current prompt');
      
    } catch (error) {
      console.error('❌ Error fetching prompt from localStorage:', error);
      setErrorMessage(`Error fetching prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoadingPrompt(false);
    }
  };

  // Check current configuration status (local state only)
  const checkConfigurationStatus = () => {
    setIsCheckingStatus(true);
    setErrorMessage('');

    // Simulate checking status (since we can't GET from the API)
    setTimeout(() => {
      setIsCheckingStatus(false);
      // Show current local status
    }, 500);
  };

  // Reset configuration status
  const resetConfigurationStatus = () => {
    setIsModelConfigured(false);
    setIsPromptConfigured(false);
    setCurrentModelConfig(null);
    setCurrentPromptConfig(null);
    setModelConfigStatus('idle');
    setPromptConfigStatus('idle');
    setErrorMessage('');

    // Clear localStorage
    try {
      localStorage.removeItem(`modelConfig_${agentName}`);
      localStorage.removeItem(`promptConfig_${agentName}`);
    } catch (error) {
      // Silently handle localStorage errors
    }

    // Also reset the form fields to defaults
    setSelectedModelProvider('OpenAI');
    setSelectedModel('GPT-4o');
    setModelApiKey(process.env.NEXT_PUBLIC_MODEL_OPEN_AI_API_KEY || '');
    setAgentApiKey('');
    setSystemPrompt(`# Appointment Scheduling Agent Prompt

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

Remember: You are the first point of contact for many patients. Your professionalism and helpfulness directly impact their experience with Wellness Partners.`);
  };

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

  // Auto-load current prompt from localStorage when agent changes (only once per agent)
  React.useEffect(() => {
    if (agentName !== 'default' && hasLoadedPromptForAgent !== agentName) {
      console.log('🔄 Agent changed, loading current prompt from localStorage...');
      // Use setTimeout to ensure the component is fully mounted
      setTimeout(() => {
        fetchCurrentPrompt(true); // Force load when agent changes
      }, 100);
      setHasLoadedPromptForAgent(agentName);
    }
  }, [agentName, hasLoadedPromptForAgent]);

  // Initialize with persistent configuration status
  React.useEffect(() => {
    // Load configuration status from localStorage
    const loadPersistentStatus = () => {
      try {
        const savedModelConfig = localStorage.getItem(`modelConfig_${agentName}`);
        const savedPromptConfig = localStorage.getItem(`promptConfig_${agentName}`);

        if (savedModelConfig) {
          const modelData = JSON.parse(savedModelConfig);
          setIsModelConfigured(true);
          setCurrentModelConfig(modelData);
          
          // Load the saved UI state
          if (modelData.selectedModelProvider) {
            setSelectedModelProvider(modelData.selectedModelProvider);
          } else {
            // Fallback: Find the provider that matches the API provider
            const providerKey = Object.keys(modelProviders).find(key =>
              modelProviders[key as keyof typeof modelProviders].apiProvider === modelData.provider
            );
            if (providerKey) {
              setSelectedModelProvider(providerKey);
            }
          }
          
          if (modelData.selectedModel) {
            setSelectedModel(modelData.selectedModel);
          } else if (modelData.model) {
            setSelectedModel(modelData.model);
          }
          
          if (modelData.modelLiveUrl) {
            setModelLiveUrl(modelData.modelLiveUrl);
          }
          
          if (modelData.modelApiKey) {
            setModelApiKey(modelData.modelApiKey);
          }
          
          if (modelData.agentApiKey) {
            setAgentApiKey(modelData.agentApiKey);
          }
        }

        if (savedPromptConfig) {
          const promptData = JSON.parse(savedPromptConfig);
          setIsPromptConfigured(true);
          setCurrentPromptConfig(promptData);
          if (promptData.systemPrompt) {
            setSystemPrompt(promptData.systemPrompt);
          } else if (promptData.prompt) {
            setSystemPrompt(promptData.prompt);
          }
        } else {
          // If no saved prompt config, try to load from difyPrompt key
          const difyPromptConfig = localStorage.getItem(`difyPrompt_${agentName}`);
          if (difyPromptConfig) {
            try {
              const promptData = JSON.parse(difyPromptConfig);
              const prompt = promptData.systemPrompt || promptData.prompt;
              if (prompt) {
                console.log('✅ Auto-loaded prompt from difyPrompt localStorage:', prompt);
                setSystemPrompt(prompt);
                setCurrentPromptConfig(promptData);
                setIsPromptConfigured(true);
              }
            } catch (error) {
              console.warn('⚠️ Error loading difyPrompt config:', error);
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ Error loading persistent status:', error);
        // Fallback to unconfigured state
        setIsModelConfigured(false);
        setIsPromptConfigured(false);
      }
    };

    loadPersistentStatus();
  }, [agentName]);

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
    setSelectedModelProvider(provider);
    // Reset model to first available model for the new provider
    const providerData = modelProviders[provider as keyof typeof modelProviders];
    if (providerData && providerData.models.length > 0) {
      setSelectedModel(providerData.models[0]);
    }
  };

  const handleModelConfiguration = async () => {
    setIsLoadingModel(true);
    setModelConfigStatus('idle');
    setErrorMessage('');

    try {
      const provider = modelProviders[selectedModelProvider as keyof typeof modelProviders];
      const apiModel = modelApiMapping[selectedModel] || selectedModel.toLowerCase().replace(/\s+/g, '-');

      // Get the correct model provider API key based on the selected provider
      let providerApiKey = '';
      switch (selectedModelProvider) {
        case 'OpenAI':
          providerApiKey = modelApiKey || process.env.NEXT_PUBLIC_MODEL_OPEN_AI_API_KEY || '';
          break;
        case 'Groq':
          providerApiKey = modelApiKey || process.env.NEXT_PUBLIC_MODEL_GROQ_API_KEY || '';
          break;
        case 'Anthropic':
          providerApiKey = modelApiKey || process.env.NEXT_PUBLIC_MODEL_ANTHROPIC_API_KEY || '';
          break;
        case 'DeepSeek':
          providerApiKey = modelApiKey; // DeepSeek requires custom API key
          break;
        default:
          providerApiKey = modelApiKey; // Fallback to user input
      }

      // Use the agent API key (Dify chatbot key)
      const chatbotApiKey = agentApiKey || existingConfig?.chatbot_key || process.env.NEXT_PUBLIC_CHATBOT_API_KEY;
      
      const result = await modelConfigService.configureModel({
        provider: provider.apiProvider,
        model: apiModel,
        api_key: providerApiKey,
        chatbot_api_key: chatbotApiKey
      });

      if (result.success) {
        setModelConfigStatus('success');
        // Mark model as configured when successful
        setIsModelConfigured(true);
        const modelConfig = {
          provider: provider.apiProvider,
          model: apiModel,
          api_key: providerApiKey
        };
        setCurrentModelConfig(modelConfig);

        // Save to localStorage for persistence
        try {
          const fullModelConfig = {
            ...modelConfig,
            selectedModelProvider,
            selectedModel,
            modelLiveUrl,
            modelApiKey,
            agentApiKey
          };
          localStorage.setItem(`modelConfig_${agentName}`, JSON.stringify(fullModelConfig));
        } catch (error) {
          console.warn('⚠️ Error saving model config to localStorage:', error);
        }

        setTimeout(() => setModelConfigStatus('idle'), 5000);
      } else {
        setModelConfigStatus('error');
        setErrorMessage(result.message || 'Failed to configure model');
      }
    } catch (error) {
      setModelConfigStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to configure model');
    } finally {
      setIsLoadingModel(false);
    }
  };

  const handlePromptConfiguration = async () => {
    setIsLoadingPrompt(true);
    setPromptConfigStatus('idle');
    setErrorMessage('');

    try {
      // Use the agent API key (Dify chatbot key)
      const chatbotApiKey = agentApiKey || existingConfig?.chatbot_key || process.env.NEXT_PUBLIC_CHATBOT_API_KEY;
      
      const result = await modelConfigService.configurePrompt({
        prompt: systemPrompt,
        chatbot_api_key: chatbotApiKey
      });

      if (result.success) {
        setPromptConfigStatus('success');
        // Mark prompt as configured when successful
        setIsPromptConfigured(true);
        const promptConfig = {
          prompt: systemPrompt
        };
        setCurrentPromptConfig(promptConfig);

        // Save to localStorage for persistence (both keys for compatibility)
        try {
          const fullPromptConfig = {
            ...promptConfig,
            systemPrompt,
            timestamp: new Date().toISOString()
          };
          localStorage.setItem(`promptConfig_${agentName}`, JSON.stringify(fullPromptConfig));
          // Also save with difyPrompt key for the fetchCurrentPrompt function
          localStorage.setItem(`difyPrompt_${agentName}`, JSON.stringify(fullPromptConfig));
        } catch (error) {
          console.warn('⚠️ Error saving prompt config to localStorage:', error);
        }

        setTimeout(() => setPromptConfigStatus('idle'), 5000);
      } else {
        setPromptConfigStatus('error');
        setErrorMessage(result.message || 'Failed to configure prompt');
      }
    } catch (error) {
      setPromptConfigStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to configure prompt');
    } finally {
      setIsLoadingPrompt(false);
    }
  };

  const getStatusIcon = (status: 'idle' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  // Notify parent component of configuration changes
  React.useEffect(() => {
    if (onConfigChange) {
      onConfigChange({
        modelLiveUrl,
        modelApiKey,
        agentApiKey,
        selectedModelProvider,
        selectedModel,
        systemPrompt
      });
    }
  }, [modelLiveUrl, modelApiKey, agentApiKey, selectedModelProvider, selectedModel, systemPrompt, onConfigChange]);

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

          <div className="flex gap-2">
            <button
              onClick={handlePromptConfiguration}
              disabled={isLoadingPrompt || !isEditing}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base ${isLoadingPrompt || !isEditing
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : isPromptConfigured
                  ? 'bg-green-600 text-white hover:bg-green-700 transform hover:scale-105'
                  : 'bg-green-600 text-white hover:bg-green-700 transform hover:scale-105'
                }`}
            >
              {isLoadingPrompt ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isPromptConfigured ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{isLoadingPrompt ? 'Saving...' : isPromptConfigured ? 'Prompt Saved ✓' : 'Save Prompt'}</span>
              <span className="sm:hidden">{isLoadingPrompt ? 'Saving...' : isPromptConfigured ? 'Saved ✓' : 'Save'}</span>
            </button>
          </div>
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
          
          <div>
            <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              System Prompt
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
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

          <button
            onClick={handleModelConfiguration}
            disabled={isLoadingModel || !isEditing}
            className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base ${isLoadingModel || !isEditing
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : isModelConfigured
                ? 'bg-green-600 text-white hover:bg-green-700 transform hover:scale-105'
                : 'bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105'
              }`}
          >
            {isLoadingModel ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isModelConfigured ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">{isLoadingModel ? 'Configuring...' : isModelConfigured ? 'Model Configured ✓' : 'Configure Model'}</span>
            <span className="sm:hidden">{isLoadingModel ? 'Configuring...' : isModelConfigured ? 'Configured ✓' : 'Configure'}</span>
          </button>
        </div>

        <div className="space-y-4">
            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Model Provider
              </label>
              <select
                value={selectedModelProvider}
                onChange={(e) => handleProviderChange(e.target.value)}
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
                onChange={(e) => setSelectedModel(e.target.value)}
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
                  type="password"
                  value={modelApiKey}
                  onChange={(e) => setModelApiKey(e.target.value)}
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
              {isUsingModelApiKey && (
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                ✓ This agent uses a configured {selectedModelProvider} API key for model access
                </p>
              )}
            </div>
          </div>
        </div>

      {/* Dify API Configuration Container */}
        <div className={`p-4 sm:p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
            <Sparkles className={`h-4 w-4 sm:h-5 sm:w-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
            <div>
            <h4 className={`font-semibold text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Agent API Configuration</h4>
            </div>
          </div>
          
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Agent URL
              </label>
            <input
              type="url"
              value={modelLiveUrl}
              onChange={(e) => setModelLiveUrl(e.target.value)}
                disabled={!isEditing}
              placeholder="https://your-agent-api-url.com/v1"
              className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300 text-sm sm:text-base ${!isEditing
                  ? isDarkMode
                    ? 'bg-gray-800/30 border-gray-700 text-gray-400 placeholder-gray-500 cursor-not-allowed'
                    : 'bg-gray-100 border-gray-300 text-gray-500 placeholder-gray-400 cursor-not-allowed'
                  : isDarkMode
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
                type="password"
                value={agentApiKey}
                onChange={(e) => setAgentApiKey(e.target.value)}
                disabled={!isEditing}
                placeholder="Enter your Dify chatbot API key"
                className={`w-full p-3 pr-10 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300 text-sm sm:text-base ${!isEditing
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
                  🔒
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
    </div>
  );
});

ModelConfig.displayName = 'ModelConfig';

export default ModelConfig;
