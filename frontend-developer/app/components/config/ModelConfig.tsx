'use client';

import React, { forwardRef, useState } from 'react';
import { Sparkles, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { modelConfigService } from '../../../service/modelConfigService';

interface ModelConfigProps {
  isDarkMode?: boolean;
}

const ModelConfig = forwardRef<HTMLDivElement, ModelConfigProps>(({ isDarkMode = false }, ref) => {
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
  const [modelConfigStatus, setModelConfigStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [promptConfigStatus, setPromptConfigStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

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
        setTimeout(() => setModelConfigStatus('idle'), 3000);
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
        setTimeout(() => setPromptConfigStatus('idle'), 3000);
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

  const handleProviderChange = (provider: string) => {
    setSelectedModelProvider(provider);
    // Reset model to first available model for the new provider
    const providerData = modelProviders[provider as keyof typeof modelProviders];
    if (providerData && providerData.models.length > 0) {
      setSelectedModel(providerData.models[0]);
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

  return (
    <div ref={ref}>
      <div className="space-y-6">
        {/* Error Message */}
        {errorMessage && (
          <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Provider and Model Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Provider
              <div className="w-4 h-4 rounded-full bg-gray-500 flex items-center justify-center">
                <span className="text-xs text-white">i</span>
              </div>
            </label>
            <select 
              value={selectedModelProvider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-900'}`}
            >
              {Object.keys(modelProviders).map((provider) => (
                <option key={provider} value={provider}>{provider}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Model
              <div className="w-4 h-4 rounded-full bg-gray-500 flex items-center justify-center">
                <span className="text-xs text-white">i</span>
              </div>
            </label>
            <div className="flex gap-2">
              <select 
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className={`flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-900'}`}
              >
                {modelProviders[selectedModelProvider as keyof typeof modelProviders]?.models.map((model) => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
              <button
                onClick={handleModelConfiguration}
                disabled={isLoadingModel}
                className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
                  isLoadingModel 
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isLoadingModel ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  getStatusIcon(modelConfigStatus)
                )}
                {isLoadingModel ? 'Configuring...' : 'Configure'}
              </button>
            </div>
          </div>
        </div>

        {/* First Message */}
        <div>
          <label className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            First Message
            <div className="w-4 h-4 rounded-full bg-gray-500 flex items-center justify-center">
              <span className="text-xs text-white">i</span>
            </div>
          </label>
          <div className="relative">
            <textarea
              rows={3}
              value={firstMessage}
              onChange={(e) => setFirstMessage(e.target.value)}
              className={`w-full px-4 py-3 pr-16 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 backdrop-blur-sm transition-all duration-300 resize-none ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white/80 text-gray-900 placeholder-gray-400'}`}
              placeholder="Enter the agent's first message..."
            />
            <button className={`absolute right-3 top-3 px-3 py-1 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center gap-1`}>
              <Sparkles className="h-3 w-3" />
              Generate
            </button>
          </div>
        </div>

        {/* System Prompt */}
        <div>
          <label className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            System Prompt
            <div className="w-4 h-4 rounded-full bg-gray-500 flex items-center justify-center">
              <span className="text-xs text-white">i</span>
            </div>
          </label>
          <div className="relative">
            <textarea
              rows={12}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className={`w-full px-4 py-3 pr-12 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 backdrop-blur-sm transition-all duration-300 resize-none ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white/80 text-gray-900 placeholder-gray-400'}`}
              placeholder="Enter system prompt..."
            />
            <div className="absolute right-3 top-3 flex gap-2">
              <button
                onClick={handlePromptConfiguration}
                disabled={isLoadingPrompt}
                className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${
                  isLoadingPrompt 
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isLoadingPrompt ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  getStatusIcon(promptConfigStatus)
                )}
                {isLoadingPrompt ? 'Saving...' : 'Save'}
              </button>
              <button className={`p-2 rounded-lg text-gray-400 hover:text-gray-600 transition-colors`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ModelConfig.displayName = 'ModelConfig';

export default ModelConfig;
