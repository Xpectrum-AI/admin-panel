'use client';

import React, { forwardRef, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Mic, Settings, Zap, Loader2, MessageSquare, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { agentConfigService } from '../../../service/agentConfigService';
import { maskApiKey, getFullApiKeys } from '../../../config/environment';
import { useTheme } from '../../contexts/ThemeContext';

interface TranscriberConfigProps {
  agentName?: string;
  onConfigChange?: (config: Record<string, unknown>) => void;
  existingConfig?: Record<string, unknown>;
  isEditing?: boolean;
}

const TranscriberConfig = forwardRef<HTMLDivElement, TranscriberConfigProps>(({ agentName = 'default', onConfigChange, existingConfig, isEditing = false }, ref) => {
  // Use theme with fallback to prevent errors
  let isDarkMode = false;
  try {
    const theme = useTheme();
    isDarkMode = theme?.isDarkMode || false;
  } catch {
    isDarkMode = false;
  }
  // Local state for UI updates
  const [selectedTranscriberProvider, setSelectedTranscriberProvider] = useState('Deepgram');
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [selectedModel, setSelectedModel] = useState('nova-2');
  const [apiKey, setApiKey] = useState('');
  const [punctuateEnabled, setPunctuateEnabled] = useState(true);
  const [smartFormatEnabled, setSmartFormatEnabled] = useState(true);
  const [interimResultEnabled, setInterimResultEnabled] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [configStatus, setConfigStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const providerChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Configuration status states
  const [isTranscriberConfigured, setIsTranscriberConfigured] = useState(false);
  const [currentTranscriberConfig, setCurrentTranscriberConfig] = useState<Record<string, unknown> | null>(null);

  const transcriberProviders = {
    'Deepgram': ['nova-2', 'nova-2-general', 'nova-2-meeting', 'nova-2-phonecall', 'nova-2-finance', 'nova-2-conversationalai', 'nova-2-video', 'nova-2-medical', 'nova-2-drivethru', 'nova-2-automotivesales', 'nova-2-legal', 'nova-2-ppc', 'nova-2-government', 'nova-2-entertainment', 'nova-2-streaming', 'nova-2-restaurants'],
    'Whisper': ['whisper-1', 'whisper-large-v3'],
    'Groq': ['llama-3.1-8b', 'llama-3.1-70b', 'mixtral-8x7b']
  };

  // Load current configuration from API
  const loadCurrentConfiguration = useCallback(async () => {
    setIsLoadingConfig(true);

    try {
      const result = await agentConfigService.getAgentConfig(agentName);
      if (result.success && result.data) {
        setIsTranscriberConfigured(true);
        setCurrentTranscriberConfig(result.data);
        
        // Update form fields with current configuration
        const sttConfig = result.data;
        
        // Set provider (convert backend format to UI format)
        let provider = sttConfig.provider;
        if (provider === 'deepgram') provider = 'Deepgram';
        if (provider === 'whisper') provider = 'Whisper';
        
        setSelectedTranscriberProvider(provider);
        
        // Set language - check provider-specific object first, then fallback to root level
        if (sttConfig[provider.toLowerCase()]?.language) {
          setSelectedLanguage(sttConfig[provider.toLowerCase()].language);
        } else if (sttConfig.language) {
          setSelectedLanguage(sttConfig.language);
        }
        
        // Set model - check provider-specific object first, then fallback to root level
        if (sttConfig[provider.toLowerCase()]?.model) {
          setSelectedModel(sttConfig[provider.toLowerCase()].model);
        } else if (sttConfig.model) {
          setSelectedModel(sttConfig.model);
        }
        
        // Set API key - check provider-specific object first, then fallback to root level
        if (sttConfig[provider.toLowerCase()]?.api_key) {
          setApiKey(sttConfig[provider.toLowerCase()].api_key);
        } else if (sttConfig.api_key) {
          setApiKey(sttConfig.api_key);
        }
        
        // Set punctuate - check provider-specific object first, then fallback to root level
        if (sttConfig[provider.toLowerCase()]?.punctuate !== undefined) {
          setPunctuateEnabled(sttConfig[provider.toLowerCase()].punctuate);
        } else if (sttConfig.punctuate !== undefined) {
          setPunctuateEnabled(sttConfig.punctuate);
        }
        
        // Set smart format - check provider-specific object first, then fallback to root level
        if (sttConfig[provider.toLowerCase()]?.smart_format !== undefined) {
          setSmartFormatEnabled(sttConfig[provider.toLowerCase()].smart_format);
        } else if (sttConfig.smart_format !== undefined) {
          setSmartFormatEnabled(sttConfig.smart_format);
        }
        
        // Set interim results - check provider-specific object first, then fallback to root level
        if (sttConfig[provider.toLowerCase()]?.interim_results !== undefined) {
          setInterimResultEnabled(sttConfig[provider.toLowerCase()].interim_results);
        } else if (sttConfig.interim_results !== undefined) {
          setInterimResultEnabled(sttConfig.interim_results);
        }
      } else {
        setIsTranscriberConfigured(false);
        setCurrentTranscriberConfig(null);
      }
    } catch {
      // Error handled by service layer
    } finally {
      setIsLoadingConfig(false);
    }
  }, [agentName]);

  // Load current configuration from API on component mount
  useEffect(() => {
    if (isEditing) {
      loadCurrentConfiguration();
    }
  }, [isEditing, agentName, loadCurrentConfiguration]);

  // Load existing configuration when provided
  useEffect(() => {
    if (existingConfig && isEditing) {
      
      // Handle STT config from backend
      if (existingConfig.provider) {
        // Set provider (convert backend format to UI format)
        let provider = existingConfig.provider;
        if (provider === 'deepgram') provider = 'Deepgram';
        if (provider === 'whisper') provider = 'Whisper';
        
        setSelectedTranscriberProvider(provider as string);
        
        // Set language - check provider-specific object first, then fallback to root level
        if ((existingConfig as any)[(provider as string).toLowerCase()]?.language) {
          setSelectedLanguage((existingConfig as any)[(provider as string).toLowerCase()].language);
        } else if (existingConfig.language) {
          setSelectedLanguage(existingConfig.language as string);
        }
        
        // Set model - check provider-specific object first, then fallback to root level
        if ((existingConfig as any)[(provider as string).toLowerCase()]?.model) {
          setSelectedModel((existingConfig as any)[(provider as string).toLowerCase()].model);
        } else if (existingConfig.model) {
          setSelectedModel(existingConfig.model as string);
        }
        
        // Set API key - check provider-specific object first, then fallback to root level
        if ((existingConfig as any)[(provider as string).toLowerCase()]?.api_key) {
          setApiKey((existingConfig as any)[(provider as string).toLowerCase()].api_key);
        } else if (existingConfig.api_key) {
          setApiKey(existingConfig.api_key as string);
        }
        
        // Set punctuate - check provider-specific object first, then fallback to root level
        if ((existingConfig as any)[(provider as string).toLowerCase()]?.punctuate !== undefined) {
          setPunctuateEnabled((existingConfig as any)[(provider as string).toLowerCase()].punctuate);
        } else if (existingConfig.punctuate !== undefined) {
          setPunctuateEnabled(existingConfig.punctuate as boolean);
        }
        
        // Set smart format - check provider-specific object first, then fallback to root level
        if ((existingConfig as any)[(provider as string).toLowerCase()]?.smart_format !== undefined) {
          setSmartFormatEnabled((existingConfig as any)[(provider as string).toLowerCase()].smart_format);
        } else if (existingConfig.smart_format !== undefined) {
          setSmartFormatEnabled(existingConfig.smart_format as boolean);
        }
        
        // Set interim results - check provider-specific object first, then fallback to root level
        if ((existingConfig as any)[(provider as string).toLowerCase()]?.interim_results !== undefined) {
          setInterimResultEnabled((existingConfig as any)[(provider as string).toLowerCase()].interim_results);
        } else if (existingConfig.interim_results !== undefined) {
          setInterimResultEnabled(existingConfig.interim_results as boolean);
        }
      }
    }
  }, [existingConfig, isEditing]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (providerChangeTimeoutRef.current) {
        clearTimeout(providerChangeTimeoutRef.current);
      }
    };
  }, []);

  // Memoize default values to prevent infinite re-renders
  const defaultApiKeys = useMemo(() => getFullApiKeys(), []);

  // Load default values on component mount
  useEffect(() => {
    // Set default API key based on selected provider
    switch (selectedTranscriberProvider) {
      case 'Deepgram':
        setApiKey(defaultApiKeys.deepgram || '');
        break;
      case 'Whisper':
        setApiKey(defaultApiKeys.whisper || '');
        break;
    }
  }, [selectedTranscriberProvider, defaultApiKeys]);

  // Helper function to get display value for API key
  const getApiKeyDisplayValue = (actualKey: string) => {
    if (!actualKey) return '••••••••••••••••••••••••••••••••';
    return maskApiKey(actualKey);
  };

  // Notify parent component of configuration changes
  React.useEffect(() => {
    // Convert UI format to backend format
    const backendConfig = {
      provider: selectedTranscriberProvider === 'Deepgram' ? 'deepgram' : 'whisper',
      deepgram: selectedTranscriberProvider === 'Deepgram' ? {
        api_key: apiKey,
        model: selectedModel,
        language: selectedLanguage,
        punctuate: punctuateEnabled,
        smart_format: smartFormatEnabled,
        interim_results: interimResultEnabled
      } : null,
      whisper: selectedTranscriberProvider === 'Whisper' ? {
        api_key: apiKey,
        model: selectedModel,
        language: selectedLanguage === 'multi' ? null : selectedLanguage
      } : null
    };

    if (onConfigChange) {
      onConfigChange(backendConfig);
    }
  }, [selectedTranscriberProvider, selectedModel, selectedLanguage, apiKey, punctuateEnabled, smartFormatEnabled, interimResultEnabled]); // Removed onConfigChange to prevent infinite loops

  // Handle configure button click
  const handleConfigure = async () => {
    setIsConfiguring(true);
    setConfigStatus('idle');
    
    try {
      // Convert UI format to backend format
      const backendConfig = {
        provider: selectedTranscriberProvider === 'Deepgram' ? 'deepgram' : 'whisper',
        deepgram: selectedTranscriberProvider === 'Deepgram' ? {
          api_key: apiKey,
          model: selectedModel,
          language: selectedLanguage,
          punctuate: punctuateEnabled,
          smart_format: smartFormatEnabled,
          interim_results: interimResultEnabled
        } : null,
        whisper: selectedTranscriberProvider === 'Whisper' ? {
          api_key: apiKey,
          model: selectedModel,
          language: selectedLanguage === 'multi' ? null : selectedLanguage
        } : null
      };

      const result = await agentConfigService.configureAgent(agentName, backendConfig as any);

      if (result.success) {
        setConfigStatus('success');
        setIsTranscriberConfigured(true);
        setCurrentTranscriberConfig(backendConfig);
        
        // Clear success message after 3 seconds
        setTimeout(() => setConfigStatus('idle'), 3000);
      } else {
        setConfigStatus('error');
      }
    } catch {
      setConfigStatus('error');
      
      // Clear error message after 3 seconds
      setTimeout(() => setConfigStatus('idle'), 3000);
    } finally {
      setIsConfiguring(false);
    }
  };

  // Manual refresh function
  const handleRefreshConfig = () => {
    if (existingConfig) {
      // Force a refresh by temporarily clearing the flag
      // The existingConfig useEffect will now run and update the state
    }
  };

  const handleProviderChange = (provider: string) => {
    
    // Clear any pending timeouts
    if (providerChangeTimeoutRef.current) {
      clearTimeout(providerChangeTimeoutRef.current);
    }
    
    setSelectedTranscriberProvider(provider);
    
    // Reset model to first available model for the new provider
    const providerData = transcriberProviders[provider as keyof typeof transcriberProviders];
    if (providerData && providerData.length > 0) {
      setSelectedModel(providerData[0]);
    }
  };

  return (
    <div ref={ref} className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-orange-900/50' : 'bg-orange-100'}`}>
            <MessageSquare className={`h-6 w-6 sm:h-8 sm:w-8 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
          </div>
          <div className="flex items-center gap-2">
            <h3 className={`text-xl sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Transcriber Configuration</h3>
            <button
              onClick={handleRefreshConfig}
              className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                isDarkMode 
                  ? 'bg-orange-800/50 hover:bg-orange-700/50 text-orange-400' 
                  : 'bg-orange-100 hover:bg-orange-200 text-orange-600'
              }`}
              title="Refresh configuration from agent"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
        <p className={`max-w-2xl mx-auto text-sm sm:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Configure speech-to-text settings for accurate transcription of conversations
        </p>
      </div>

      {/* Configuration Status */}
      <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Configuration Status</h4>
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Current transcriber configuration status
              </p>
            </div>
          <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <MessageSquare className={`h-5 w-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
          </div>
        </div>
        
        <div className={`p-3 rounded-lg border ${isTranscriberConfigured ? (isDarkMode ? 'bg-green-900/20 border-green-700 text-green-300' : 'bg-green-50 border-green-200 text-green-700') : (isDarkMode ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700')}`}>
          <div className="flex items-center gap-2">
            {isTranscriberConfigured ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">
              {isTranscriberConfigured ? 'Transcriber Config Ready' : 'Transcriber Config Missing'}
            </span>
          </div>
          {isTranscriberConfigured && currentTranscriberConfig && (
            <p className="text-xs mt-1 opacity-80">
              Provider: {(currentTranscriberConfig.provider as string) || 'Unknown'}
            </p>
          )}
        </div>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Provider and Language Selection */}
        <div className={`p-4 sm:p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
              <Mic className={`h-4 w-4 sm:h-5 sm:w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div>
              <h4 className={`font-semibold text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Provider & Language</h4>
              <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Choose your transcription provider and language</p>
            </div>
          </div>

          <div className="space-y-4">
              <div>
              <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Provider
                </label>
                <select
                  value={selectedTranscriberProvider}
                onChange={(e) => handleProviderChange(e.target.value)}
                className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 text-sm sm:text-base ${
                  isDarkMode 
                    ? 'bg-gray-700/50 border-gray-600 text-gray-200' 
                    : 'bg-gray-50 border-gray-200 text-gray-900'
                }`}
              >
                  <option value="Deepgram">Deepgram</option>
                <option value="Whisper">Whisper</option>
                  <option value="Groq">Groq</option>
                </select>
              </div>

              <div>
              <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Language
                </label>
              <select
                value={selectedLanguage}
                onChange={(e) => {
                  setSelectedLanguage(e.target.value);
                }}
                className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 text-sm sm:text-base ${
                  isDarkMode 
                    ? 'bg-gray-700/50 border-gray-600 text-gray-200' 
                    : 'bg-gray-50 border-gray-200 text-gray-900'
                }`}
              >
                <option value="en-US">English (US)</option>
                <option value="multi">Multi-language</option>
                <option value="es-ES">Spanish</option>
                <option value="fr-FR">French</option>
                <option value="de-DE">German</option>
                <option value="hi">Hindi</option>
                </select>
            </div>
              </div>
            </div>

        {/* Model and API Key */}
        <div className={`p-4 sm:p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-900/50' : 'bg-green-100'}`}>
              <Settings className={`h-4 w-4 sm:h-5 sm:w-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <div>
              <h4 className={`font-semibold text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Model & API</h4>
              <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Select model and configure API access</p>
            </div>
            </div>

          <div className="space-y-4">
            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => {
                  setSelectedModel(e.target.value);
                }}
                className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all duration-300 text-sm sm:text-base ${
                  isDarkMode 
                    ? 'bg-gray-700/50 border-gray-600 text-gray-200' 
                    : 'bg-gray-50 border-gray-200 text-gray-900'
                }`}
              >
                {transcriberProviders[selectedTranscriberProvider as keyof typeof transcriberProviders]?.map((model) => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                API Key
              </label>
              <input
                type="password"
                value={getApiKeyDisplayValue(apiKey)}
                readOnly
                className={`w-full p-3 rounded-xl border transition-all duration-300 cursor-not-allowed text-sm sm:text-base ${
                  isDarkMode 
                    ? 'border-gray-600 bg-gray-700/50 text-gray-400' 
                    : 'border-gray-200 bg-gray-100/50 text-gray-500'
                }`}
                placeholder="Default API key loaded"
              />
            </div>
            </div>
          </div>
        </div>

      {/* Pro Tip */}
      <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-blue-900/20 border-blue-700/50' : 'bg-blue-50 border-blue-200'}`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
            <Zap className={`h-4 w-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <div>
            <h4 className={`font-semibold text-sm sm:text-base mb-1 ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>Pro Tip</h4>
            <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-blue-200' : 'text-blue-700'}`}>
              For multi-language support, set language to <strong>multi</strong> and use <strong>ElevenLabs Turbo 2.5</strong> in the Voice tab for optimal results.
              </p>
            </div>
        </div>
      </div>

      {/* Additional Configuration */}
      <div className={`p-4 sm:p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
            <Settings className={`h-4 w-4 sm:h-5 sm:w-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>
          <div>
            <h4 className={`font-semibold text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Additional Settings</h4>
            <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Configure advanced transcription options</p>
          </div>
          </div>

        <div className="space-y-4">
            {/* Punctuate Toggle */}
          <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                  </div>
                <div>
                  <h5 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Punctuate</h5>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Add punctuation to the transcription output</p>
                  </div>
                </div>
                <button
                onClick={() => {
                  setPunctuateEnabled(!punctuateEnabled);
                }}
                className={`relative inline-block w-12 h-6 transition-colors duration-200 ease-in-out rounded-full ${punctuateEnabled ? (isDarkMode ? 'bg-green-600' : 'bg-green-500') : (isDarkMode ? 'bg-gray-600' : 'bg-gray-300')}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${punctuateEnabled ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>
            </div>

            {/* Smart Format Toggle */}
          <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                <div>
                  <h5 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Smart Format</h5>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Apply smart formatting to the transcription</p>
                  </div>
                </div>
                <button
                onClick={() => {
                  setSmartFormatEnabled(!smartFormatEnabled);
                }}
                className={`relative inline-block w-12 h-6 transition-colors duration-200 ease-in-out rounded-full ${smartFormatEnabled ? (isDarkMode ? 'bg-green-600' : 'bg-green-500') : (isDarkMode ? 'bg-gray-600' : 'bg-gray-300')}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${smartFormatEnabled ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>
            </div>

            {/* Interim Result Toggle */}
          <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                <div>
                  <h5 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Interim Results</h5>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Show interim transcription results as they come in</p>
                  </div>
                </div>
                <button
                onClick={() => {
                  setInterimResultEnabled(!interimResultEnabled);
                }}
                className={`relative inline-block w-12 h-6 transition-colors duration-200 ease-in-out rounded-full ${interimResultEnabled ? (isDarkMode ? 'bg-green-600' : 'bg-green-500') : (isDarkMode ? 'bg-gray-600' : 'bg-gray-300')}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${interimResultEnabled ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>
            </div>
          </div>
        </div>

      {/* Configure Button */}
      <div className={`p-4 sm:p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className={`font-semibold text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Save Configuration
            </h4>
            <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Save your transcriber configuration to the API
            </p>
          </div>
        </div>
        
        <div className="flex justify-end gap-3">
          {/* Check Configuration Status Button */}
          <button
            onClick={loadCurrentConfiguration}
            disabled={isLoadingConfig}
            className={`px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
          >
            {isLoadingConfig ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Settings className="h-5 w-5" />
            )}
            <span className="font-semibold">{isLoadingConfig ? 'Loading...' : 'Check Status'}</span>
          </button>
          
          {/* Save Configuration Button */}
          <button
            onClick={handleConfigure}
            disabled={isConfiguring}
            className={`group relative px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            {isConfiguring ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Settings className="h-5 w-5" />
            )}
            <span className="font-semibold">{isConfiguring ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>

        {/* Status Messages */}
        {configStatus === 'success' && (
          <div className={`mt-4 p-3 rounded-xl border ${isDarkMode ? 'bg-green-900/20 border-green-700/50' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className={`text-sm ${isDarkMode ? 'text-green-300' : 'text-green-800'}`}>
                Transcriber configuration saved successfully!
              </span>
            </div>
          </div>
        )}

        {configStatus === 'error' && (
          <div className={`mt-4 p-3 rounded-xl border ${isDarkMode ? 'bg-red-900/20 border-red-700/50' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-800'}`}>
                Failed to save transcriber configuration. Please try again.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

TranscriberConfig.displayName = 'TranscriberConfig';

export default TranscriberConfig;
