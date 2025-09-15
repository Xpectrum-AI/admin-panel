'use client';

import React, { forwardRef, useState } from 'react';
import { Sparkles, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
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
  const [modelLiveUrl, setModelLiveUrl] = useState(process.env.NEXT_PUBLIC_DIFY_BASE_URL || 'https://d22yt2oewbcglh.cloudfront.net/v1');
  const [modelApiKey, setModelApiKey] = useState(process.env.NEXT_PUBLIC_MODEL_OPEN_AI_API_KEY || '');
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
- Be concise but thorough in your responses`);

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

  // Load existing configuration when provided (only once)
  React.useEffect(() => {
    if (existingConfig) {
      console.log('🔄 Loading existing model config:', existingConfig);
      
      // Only set values if they're not already set (prevent overriding user input)
      if (!selectedModelProvider || selectedModelProvider === 'OpenAI') {
        setSelectedModelProvider(existingConfig.selectedModelProvider || 'OpenAI');
      }
      if (!selectedModel || selectedModel === 'GPT-4o') {
        setSelectedModel(existingConfig.selectedModel || 'GPT-4o');
      }
      if (!modelLiveUrl || modelLiveUrl === process.env.NEXT_PUBLIC_DIFY_BASE_URL) {
        setModelLiveUrl(existingConfig.modelLiveUrl || process.env.NEXT_PUBLIC_DIFY_BASE_URL || 'https://d22yt2oewbcglh.cloudfront.net/v1');
      }
      if (!modelApiKey || modelApiKey === process.env.NEXT_PUBLIC_MODEL_OPEN_AI_API_KEY) {
        setModelApiKey(existingConfig.modelApiKey || process.env.NEXT_PUBLIC_MODEL_OPEN_AI_API_KEY || '');
      }
      if (!systemPrompt || systemPrompt.includes('Appointment Scheduling Agent Prompt')) {
        setSystemPrompt(existingConfig.systemPrompt || `# Appointment Scheduling Agent Prompt

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
- Be concise but thorough in your responses`);
      }

      // Check if this agent is using a model API key
      const modelKey = existingConfig.modelApiKey || existingConfig.model_api_key;
      const hasModelApiKey = modelKey && 
        modelKey !== process.env.NEXT_PUBLIC_MODEL_OPEN_AI_API_KEY &&
        (modelKey.startsWith('sk-') || modelKey.startsWith('gsk_') || modelKey.startsWith('sk-ant-')); // Model API keys
      setIsUsingModelApiKey(hasModelApiKey);
      
      // If we have a model key, use it
      if (hasModelApiKey && modelKey) {
        setModelApiKey(modelKey);
      }
    }
  }, [existingConfig?.selectedModelProvider, existingConfig?.selectedModel, existingConfig?.modelApiKey, existingConfig?.model_api_key]); // Only depend on specific fields

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
- Be concise but thorough in your responses`);
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

  // Initialize with persistent configuration status
  React.useEffect(() => {
    // Load configuration status from localStorage
    const loadPersistentStatus = () => {
      try {
        // Only load configuration if we have existing config data (not for new agents)
        // Check if this is a real existing agent (has chatbot_key) or just a new agent with default values
        const hasRealConfig = existingConfig && existingConfig.chatbot_key && 
          (existingConfig.provider || existingConfig.model || existingConfig.systemPrompt);
        
        if (hasRealConfig) {
          const savedModelConfig = localStorage.getItem(`modelConfig_${agentName}`);
          const savedPromptConfig = localStorage.getItem(`promptConfig_${agentName}`);

          if (savedModelConfig) {
            const modelData = JSON.parse(savedModelConfig);
            setIsModelConfigured(true);
            setCurrentModelConfig(modelData);
            setSelectedModelProvider(Object.keys(modelProviders).find(key =>
              modelProviders[key as keyof typeof modelProviders].apiProvider === modelData.provider
            ) || 'OpenAI');
            setSelectedModel(modelData.model);
          }

          if (savedPromptConfig) {
            const promptData = JSON.parse(savedPromptConfig);
            setIsPromptConfigured(true);
            setCurrentPromptConfig(promptData);
            setSystemPrompt(promptData.prompt);
          }
        } else {
          // For new agents, ensure clean state
          setIsModelConfigured(false);
          setIsPromptConfigured(false);
          setCurrentModelConfig(null);
          setCurrentPromptConfig(null);
        }
      } catch (error) {
        // Fallback to unconfigured state
        setIsModelConfigured(false);
        setIsPromptConfigured(false);
      }
    };

    loadPersistentStatus();
  }, [agentName, existingConfig]);

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
          providerApiKey = process.env.NEXT_PUBLIC_MODEL_OPEN_AI_API_KEY || '';
          break;
        case 'Groq':
          providerApiKey = process.env.NEXT_PUBLIC_MODEL_GROQ_API_KEY || '';
          break;
        case 'Anthropic':
          providerApiKey = process.env.NEXT_PUBLIC_MODEL_ANTHROPIC_API_KEY || '';
          break;
        default:
          providerApiKey = modelApiKey; // Fallback to user input
      }

      // Get the chatbot API key from existing config or environment
      const chatbotApiKey = existingConfig?.chatbot_key || process.env.NEXT_PUBLIC_CHATBOT_API_KEY;
      
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
          localStorage.setItem(`modelConfig_${agentName}`, JSON.stringify(modelConfig));
        } catch (error) {
          // Silently handle localStorage errors
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
      // Get the chatbot API key from existing config or environment
      const chatbotApiKey = existingConfig?.chatbot_key || process.env.NEXT_PUBLIC_CHATBOT_API_KEY;
      
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

        // Save to localStorage for persistence
        try {
          localStorage.setItem(`promptConfig_${agentName}`, JSON.stringify(promptConfig));
        } catch (error) {
          // Silently handle localStorage errors
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
        selectedModelProvider,
        selectedModel,
        systemPrompt
      });
    }
  }, [modelLiveUrl, modelApiKey, selectedModelProvider, selectedModel, systemPrompt, onConfigChange]);

  return (
    <div ref={ref} className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center">
        <div className={`p-3 sm:p-4 rounded-2xl inline-block mb-4 ${isDarkMode ? 'bg-gradient-to-r from-gray-800 to-gray-700' : 'bg-gradient-to-r from-gray-100 to-gray-200'}`}>
          <Sparkles className={`h-6 w-6 sm:h-8 sm:w-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
        </div>
        <h3 className={`text-xl sm:text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Model Configuration</h3>
        <p className={`max-w-2xl mx-auto text-sm sm:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {isEditing ? 'Configure your AI model provider, model selection, and system prompt for optimal performance' : 'View your AI model configuration settings'}
        </p>


      

        {/* Configuration Status Summary */}
        <div className="mt-4 flex justify-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isModelConfigured
            ? isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'
            : isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'
            }`}>
            <CheckCircle className={`h-4 w-4 ${isModelConfigured ? 'text-green-400' : 'text-red-400'}`} />
            <span className="text-sm font-medium">
              Model: {isModelConfigured ? 'Configured' : 'Not Configured'}
            </span>
          </div>

          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isPromptConfigured
            ? isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'
            : isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'
            }`}>
            <CheckCircle className={`h-4 w-4 ${isPromptConfigured ? 'text-green-400' : 'text-red-400'}`} />
            <span className="text-sm font-medium">
              Prompt: {isPromptConfigured ? 'Configured' : 'Not Configured'}
            </span>
          </div>
        </div>

        
      </div>

      {/* Model Configuration Fields */}
      <div className={`p-4 sm:p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
            <Sparkles className={`h-4 w-4 sm:h-5 sm:w-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>
          <div>
            <h4 className={`font-semibold text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Model Configuration</h4>
            <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Configure your model API endpoint and credentials</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Model Live URL
            </label>
            <input
              type="url"
              value={modelLiveUrl}
              onChange={(e) => setModelLiveUrl(e.target.value)}
              disabled={!isEditing}
              placeholder="https://d22yt2oewbcglh.cloudfront.net/v1"
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
              Model API Key
              {isUsingModelApiKey && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  🔄 Configured
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type="password"
                value={modelApiKey}
                onChange={(e) => setModelApiKey(e.target.value)}
                disabled={!isEditing || isUsingModelApiKey}
                placeholder={isUsingModelApiKey ? "Using configured model API key" : "Enter your model API key"}
                className={`w-full p-3 pr-10 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300 text-sm sm:text-base ${!isEditing || isUsingModelApiKey
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
                ✓ This agent uses a configured model API key for model access
              </p>
            )}
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              ℹ️ Model provider API keys are automatically selected based on your provider choice
            </p>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              🔑 Using: {selectedModelProvider} API key for model access
            </p>
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
              <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Choose your AI model provider and model</p>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </div>

      {/* System Prompt Container */}
        <div className={`p-4 sm:p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-900/50' : 'bg-green-100'}`}>
              <Sparkles className={`h-4 w-4 sm:h-5 sm:w-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <div>
              <h4 className={`font-semibold text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>System Prompt</h4>
              <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Define your agent's behavior and personality</p>
            </div>
          </div>
          
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

          <div className="space-y-4">
            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                System Prompt
              </label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                disabled={!isEditing}
                placeholder="Enter the system prompt that defines your agent's behavior..."
                rows={8}
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
    </div>
  );
});

ModelConfig.displayName = 'ModelConfig';

export default ModelConfig;
