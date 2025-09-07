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

const ModelConfig = forwardRef<HTMLDivElement, ModelConfigProps>(({ agentName = 'default', onConfigChange, existingConfig, isEditing = false }, ref) => {
  const { isDarkMode } = useTheme();
  const [selectedModelProvider, setSelectedModelProvider] = useState('OpenAI');
  const [selectedModel, setSelectedModel] = useState('GPT-4o');
  const [firstMessage, setFirstMessage] = useState('Thank you for calling Wellness Partners. This is Riley, your scheduling agent. How may I help you today?');
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

  // Load existing configuration when provided
  React.useEffect(() => {
    if (existingConfig && isEditing) {
      setSelectedModelProvider(existingConfig.selectedModelProvider || 'OpenAI');
      setSelectedModel(existingConfig.selectedModel || 'GPT-4o');
      setFirstMessage(existingConfig.firstMessage || 'Thank you for calling Wellness Partners. This is Riley, your scheduling agent. How may I help you today?');
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
  }, [existingConfig, isEditing]);

  // Check current configuration status (local state only)
  const checkConfigurationStatus = () => {
    setIsCheckingStatus(true);
    setErrorMessage('');
    
    // Simulate checking status (since we can't GET from the API)
    setTimeout(() => {
      setIsCheckingStatus(false);
      // Show current local status
      console.log('Current configuration status:', {
        modelConfigured: isModelConfigured,
        promptConfigured: isPromptConfigured,
        currentModelConfig,
        currentPromptConfig
      });
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
      console.log('Configuration status cleared from localStorage');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
    
    // Also reset the form fields to defaults
    setSelectedModelProvider('OpenAI');
    setSelectedModel('GPT-4o');
    setFirstMessage('Thank you for calling Wellness Partners. This is Riley, your scheduling agent. How may I help you today?');
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
      } catch (error) {
        console.error('Error loading persistent configuration status:', error);
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

      const result = await modelConfigService.configureModel({
        provider: provider.apiProvider,
        model: apiModel
      });

      if (result.success) {
        setModelConfigStatus('success');
        // Mark model as configured when successful
        setIsModelConfigured(true);
        const modelConfig = {
          provider: provider.apiProvider,
          model: apiModel
        };
        setCurrentModelConfig(modelConfig);
        
        // Save to localStorage for persistence
        try {
          localStorage.setItem(`modelConfig_${agentName}`, JSON.stringify(modelConfig));
          console.log('Model configuration saved to localStorage');
        } catch (error) {
          console.error('Error saving model configuration to localStorage:', error);
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
      const result = await modelConfigService.configurePrompt({
        prompt: systemPrompt
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
          console.log('Prompt configuration saved to localStorage');
        } catch (error) {
          console.error('Error saving prompt configuration to localStorage:', error);
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

  // Notify parent component of configuration changes (for first message only)
  React.useEffect(() => {
    if (onConfigChange) {
      onConfigChange({
        firstMessage
      });
    }
  }, [firstMessage, onConfigChange]);

  return (
    <div ref={ref} className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className={`p-3 sm:p-4 rounded-2xl inline-block mb-4 ${isDarkMode ? 'bg-gradient-to-r from-gray-800 to-gray-700' : 'bg-gradient-to-r from-gray-100 to-gray-200'}`}>
          <Sparkles className={`h-6 w-6 sm:h-8 sm:w-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
        </div>
        <h3 className={`text-xl sm:text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Model Configuration</h3>
        <p className={`max-w-2xl mx-auto text-sm sm:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Configure your AI model provider, model selection, and system prompt for optimal performance
        </p>
        
        {/* Status Management Buttons */}
        <div className="mt-4 flex justify-center gap-3">
          <button
            onClick={checkConfigurationStatus}
            disabled={isCheckingStatus}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              isCheckingStatus
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700 transform hover:scale-105'
            }`}
          >
            {isCheckingStatus ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            {isCheckingStatus ? 'Checking Status...' : 'Check Status'}
          </button>
          
          <button
            onClick={resetConfigurationStatus}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 bg-red-600 text-white hover:bg-red-700 transform hover:scale-105"
          >
            <AlertCircle className="h-4 w-4" />
            Reset Status
          </button>
        </div>
        
        {/* Configuration Status Summary */}
        <div className="mt-4 flex justify-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            isModelConfigured 
              ? isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'
              : isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'
          }`}>
            <CheckCircle className={`h-4 w-4 ${isModelConfigured ? 'text-green-400' : 'text-red-400'}`} />
            <span className="text-sm font-medium">
              Model: {isModelConfigured ? 'Configured' : 'Not Configured'}
            </span>
          </div>
          
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            isPromptConfigured 
              ? isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'
              : isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'
          }`}>
            <CheckCircle className={`h-4 w-4 ${isPromptConfigured ? 'text-green-400' : 'text-red-400'}`} />
            <span className="text-sm font-medium">
              Prompt: {isPromptConfigured ? 'Configured' : 'Not Configured'}
            </span>
          </div>
        </div>
        
        {/* Help Text */}
        <div className="text-center">
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            💡 Configuration status is now persistent and will be remembered even after navigation. Use "Reset Status" if you need to clear the configuration state.
          </p>
        </div>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Selection */}
        <div className={`p-4 sm:p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
              <Sparkles className={`h-4 w-4 sm:h-5 sm:w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div>
              <h4 className={`font-semibold text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Model Selection</h4>
              <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Choose your AI model provider and model</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Model Provider
              </label>
              <select
                value={selectedModelProvider}
                onChange={(e) => handleProviderChange(e.target.value)}
                className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 text-sm sm:text-base ${
                  isDarkMode 
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
                className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 text-sm sm:text-base ${
                  isDarkMode 
                    ? 'bg-gray-700/50 border-gray-600 text-gray-200' 
                    : 'bg-gray-50 border-gray-200 text-gray-900'
                }`}
              >
                {modelProviders[selectedModelProvider as keyof typeof modelProviders]?.models.map((model) => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={handleModelConfiguration}
              disabled={isLoadingModel}
              className={`w-full p-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base ${
                isLoadingModel 
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
              {isLoadingModel ? 'Configuring...' : isModelConfigured ? 'Model Configured ✓' : 'Configure Model'}
            </button>
          </div>
        </div>

        {/* System Prompt */}
        <div className={`p-4 sm:p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-900/50' : 'bg-green-100'}`}>
              <Sparkles className={`h-4 w-4 sm:h-5 sm:w-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <div>
              <h4 className={`font-semibold text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>System Prompt</h4>
              <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Define your agent's behavior and personality</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                First Message
              </label>
              <textarea
                value={firstMessage}
                onChange={(e) => setFirstMessage(e.target.value)}
                placeholder="Enter the first message your agent will say..."
                rows={3}
                className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all duration-300 text-sm sm:text-base resize-none ${
                  isDarkMode 
                    ? 'bg-gray-700/50 border-gray-600 text-gray-200 placeholder-gray-400' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
            
            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                System Prompt
              </label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Enter the system prompt that defines your agent's behavior..."
                rows={8}
                className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all duration-300 text-sm sm:text-base resize-none ${
                  isDarkMode 
                    ? 'bg-gray-700/50 border-gray-600 text-gray-200 placeholder-gray-400' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
            
            <button
              onClick={handlePromptConfiguration}
              disabled={isLoadingPrompt}
              className={`w-full p-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base ${
                isLoadingPrompt 
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
              {isLoadingPrompt ? 'Saving...' : isPromptConfigured ? 'Prompt Saved ✓' : 'Save Prompt'}
            </button>
          </div>
        </div>
      </div>

      {/* Current Configuration Display */}
      <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/30 border-gray-200/50'}`}>
        <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Current Configuration Status
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Model Configuration Status */}
            <div className={`p-4 rounded-xl border ${
              isModelConfigured 
                ? isDarkMode ? 'bg-green-900/20 border-green-700/30' : 'bg-green-50 border-green-200'
                : isDarkMode ? 'bg-red-900/20 border-red-700/30' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className={`h-5 w-5 ${isModelConfigured ? 'text-green-500' : 'text-red-500'}`} />
                <h5 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Model Configuration
                </h5>
              </div>
              
              {isModelConfigured && currentModelConfig ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Provider:</span>
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {Object.keys(modelProviders).find(key => 
                        modelProviders[key as keyof typeof modelProviders].apiProvider === currentModelConfig.provider
                      ) || currentModelConfig.provider}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Model:</span>
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {currentModelConfig.model}
                    </span>
                  </div>
                </div>
              ) : (
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No model configuration found
                </p>
              )}
            </div>
            
            {/* Prompt Configuration Status */}
            <div className={`p-4 rounded-xl border ${
              isPromptConfigured 
                ? isDarkMode ? 'bg-green-900/20 border-green-700/30' : 'bg-green-50 border-green-200'
                : isDarkMode ? 'bg-red-900/20 border-red-700/30' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className={`h-5 w-5 ${isPromptConfigured ? 'text-green-500' : 'text-red-500'}`} />
                <h5 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  System Prompt
                </h5>
              </div>
              
              {isPromptConfigured && currentPromptConfig ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Status:</span>
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Configured
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Length:</span>
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {currentPromptConfig.prompt?.length || 0} characters
                    </span>
                  </div>
                </div>
              ) : (
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No system prompt configured
                </p>
              )}
            </div>
          </div>
        </div>

      {/* Status Messages */}
      {(modelConfigStatus === 'success' || modelConfigStatus === 'error' || promptConfigStatus === 'success' || promptConfigStatus === 'error') && (
        <div className={`p-4 rounded-xl border ${
          (modelConfigStatus === 'success' || promptConfigStatus === 'success')
            ? isDarkMode 
              ? 'bg-green-900/20 border-green-700/50' 
              : 'bg-green-50 border-green-200'
            : isDarkMode 
              ? 'bg-red-900/20 border-red-700/50' 
              : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-3">
            {(modelConfigStatus === 'success' || promptConfigStatus === 'success') ? (
              <CheckCircle className={`h-5 w-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
            ) : (
              <AlertCircle className={`h-5 w-5 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
            )}
            <span className={`text-sm sm:text-base ${
              (modelConfigStatus === 'success' || promptConfigStatus === 'success')
                ? isDarkMode ? 'text-green-300' : 'text-green-800'
                : isDarkMode ? 'text-red-300' : 'text-red-800'
            }`}>
              {modelConfigStatus === 'success' && 'Model configured successfully!'}
              {promptConfigStatus === 'success' && 'System prompt saved successfully!'}
              {modelConfigStatus === 'error' && 'Failed to configure model'}
              {promptConfigStatus === 'error' && 'Failed to save system prompt'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

ModelConfig.displayName = 'ModelConfig';

export default ModelConfig;
