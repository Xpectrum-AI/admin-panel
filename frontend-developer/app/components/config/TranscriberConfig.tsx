'use client';

import React, { forwardRef, useState, useEffect, useRef } from 'react';
import { Mic, Settings, Zap, Loader2, MessageSquare, RefreshCw } from 'lucide-react';
import { agentConfigService, maskApiKey } from '../../../service/agentConfigService';
import { useTheme } from '../../contexts/ThemeContext';

interface TranscriberConfigProps {
  agentName?: string;
  onConfigChange?: (config: any) => void;
  existingConfig?: any;
  isEditing?: boolean;
}

const TranscriberConfig = forwardRef<HTMLDivElement, TranscriberConfigProps>(({ agentName = 'default', onConfigChange, existingConfig, isEditing = false }, ref) => {
  const { isDarkMode } = useTheme();
  // Local state for UI updates
  const [selectedTranscriberProvider, setSelectedTranscriberProvider] = useState('Deepgram');
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [selectedModel, setSelectedModel] = useState('nova-2');
  const [apiKey, setApiKey] = useState('');
  const [punctuateEnabled, setPunctuateEnabled] = useState(true);
  const [smartFormatEnabled, setSmartFormatEnabled] = useState(true);
  const [interimResultEnabled, setInterimResultEnabled] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [configStatus, setConfigStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isUserChangingProvider, setIsUserChangingProvider] = useState(false);
  const providerChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const transcriberProviders = {
    'Deepgram': ['nova-2', 'nova-2-general', 'nova-2-meeting', 'nova-2-phonecall', 'nova-2-finance', 'nova-2-conversationalai', 'nova-2-video', 'nova-2-medical', 'nova-2-drivethru', 'nova-2-automotivesales', 'nova-2-legal', 'nova-2-ppc', 'nova-2-government', 'nova-2-entertainment', 'nova-2-streaming', 'nova-2-restaurants'],
    'Whisper': ['whisper-1', 'whisper-large-v3'],
    'Groq': ['llama-3.1-8b', 'llama-3.1-70b', 'mixtral-8x7b']
  };

  // Load state from localStorage on component mount
  useEffect(() => {
    try {
      // Don't override user selections if they're actively changing the provider
      if (isUserChangingProvider) {
        console.log('🚫 Skipping initial config load - user is changing provider');
        return;
      }

      // Additional safety check - if we just changed the provider, don't override
      if (providerChangeTimeoutRef.current) {
        console.log('🚫 Skipping initial config load - provider change timeout still active');
        return;
      }

      // If we have existing config from agent, use that
      if (existingConfig) {
        console.log('Loading existing transcriber config:', existingConfig);

        // Handle STT config from backend
        if (existingConfig.provider) {
          // Set provider (convert backend format to UI format)
          let provider = existingConfig.provider;
          if (provider === 'deepgram') provider = 'Deepgram';
          if (provider === 'whisper') provider = 'Whisper';

          console.log('Backend transcriber provider:', existingConfig.provider, '-> UI provider:', provider);
          setSelectedTranscriberProvider(provider);

          // Set language - check provider-specific object first, then fallback to root level
          if (existingConfig[provider.toLowerCase()]?.language) {
            console.log('Backend language from provider object:', existingConfig[provider.toLowerCase()].language);
            setSelectedLanguage(existingConfig[provider.toLowerCase()].language);
          } else if (existingConfig.language) {
            console.log('Backend language from root:', existingConfig.language);
            setSelectedLanguage(existingConfig.language);
          }

          // Set model - check provider-specific object first, then fallback to root level
          if (existingConfig[provider.toLowerCase()]?.model) {
            console.log('Backend model from provider object:', existingConfig[provider.toLowerCase()].model);
            setSelectedModel(existingConfig[provider.toLowerCase()].model);
          } else if (existingConfig.model) {
            console.log('Backend model from root:', existingConfig.model);
            setSelectedModel(existingConfig.model);
          }

          // Set API key - check provider-specific object first, then fallback to root level
          if (existingConfig[provider.toLowerCase()]?.api_key) {
            console.log('Backend API key from provider object:', maskApiKey(existingConfig[provider.toLowerCase()].api_key));
            setApiKey(existingConfig[provider.toLowerCase()].api_key);
          } else if (existingConfig.api_key) {
            console.log('Backend API key from root:', maskApiKey(existingConfig.api_key));
            setApiKey(existingConfig.api_key);
          }

          // Set punctuate - check provider-specific object first, then fallback to root level
          if (existingConfig[provider.toLowerCase()]?.punctuate !== undefined) {
            console.log('Backend punctuate from provider object:', existingConfig[provider.toLowerCase()].punctuate);
            setPunctuateEnabled(existingConfig[provider.toLowerCase()].punctuate);
          } else if (existingConfig.punctuate !== undefined) {
            console.log('Backend punctuate from root:', existingConfig.punctuate);
            setPunctuateEnabled(existingConfig.punctuate);
          }

          // Set smart format - check provider-specific object first, then fallback to root level
          if (existingConfig[provider.toLowerCase()]?.smart_format !== undefined) {
            console.log('Backend smart_format from provider object:', existingConfig[provider.toLowerCase()].smart_format);
            setSmartFormatEnabled(existingConfig[provider.toLowerCase()].smart_format);
          } else if (existingConfig.smart_format !== undefined) {
            console.log('Backend smart_format from root:', existingConfig.smart_format);
            setSmartFormatEnabled(existingConfig.smart_format);
          }

          // Set interim results - check provider-specific object first, then fallback to root level
          if (existingConfig[provider.toLowerCase()]?.interim_results !== undefined) {
            console.log('Backend interim_results from provider object:', existingConfig[provider.toLowerCase()].interim_results);
            setInterimResultEnabled(existingConfig[provider.toLowerCase()].interim_results);
          } else if (existingConfig.interim_results !== undefined) {
            console.log('Backend interim_results from root:', existingConfig.interim_results);
            setInterimResultEnabled(existingConfig.interim_results);
          }

          console.log('Final UI state after loading backend config:', {
            provider: existingConfig.provider,
            language: existingConfig[provider.toLowerCase()]?.language || existingConfig.language || 'en-US',
            model: existingConfig[provider.toLowerCase()]?.model || existingConfig.model || 'nova-2',
            apiKey: maskApiKey(existingConfig[provider.toLowerCase()]?.api_key || existingConfig.api_key || ''),
            punctuate: existingConfig[provider.toLowerCase()]?.punctuate ?? existingConfig.punctuate ?? true,
            smartFormat: existingConfig[provider.toLowerCase()]?.smart_format ?? existingConfig.smart_format ?? true,
            interimResults: existingConfig[provider.toLowerCase()]?.interim_results ?? existingConfig.interim_results ?? false
          });
        }
      } else {
        // Otherwise load from localStorage
        const savedState = localStorage.getItem('transcriberConfigState');
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          setSelectedTranscriberProvider(parsedState.selectedTranscriberProvider || 'Deepgram');
          setSelectedLanguage(parsedState.selectedLanguage || 'en-US');
          setSelectedModel(parsedState.selectedModel || 'nova-2');
          setApiKey(parsedState.apiKey || '');
          setPunctuateEnabled(parsedState.punctuateEnabled !== undefined ? parsedState.punctuateEnabled : true);
          setSmartFormatEnabled(parsedState.smartFormatEnabled !== undefined ? parsedState.smartFormatEnabled : true);
          setInterimResultEnabled(parsedState.interimResultEnabled !== undefined ? parsedState.interimResultEnabled : false);
        }
      }
    } catch (error) {
      console.warn('Failed to load transcriber config state:', error);
    }
  }, [existingConfig, isUserChangingProvider]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (providerChangeTimeoutRef.current) {
        clearTimeout(providerChangeTimeoutRef.current);
      }
    };
  }, []);

  // Save state to localStorage whenever it changes
  const saveStateToLocalStorage = (updates: any) => {
    try {
      const currentState = {
        selectedTranscriberProvider,
        selectedLanguage,
        selectedModel,
        apiKey,
        punctuateEnabled,
        smartFormatEnabled,
        interimResultEnabled,
        ...updates
      };
      localStorage.setItem('transcriberConfigState', JSON.stringify(currentState));
    } catch (error) {
      console.warn('Failed to save transcriber config state to localStorage:', error);
    }
  };

  // Load default values on component mount
  useEffect(() => {
    const defaultApiKeys = agentConfigService.getFullApiKeys();

    // Set default API key based on selected provider
    switch (selectedTranscriberProvider) {
      case 'Deepgram':
        setApiKey(defaultApiKeys.deepgram || '');
        break;
      case 'Whisper':
        setApiKey(defaultApiKeys.whisper || '');
        break;
    }
  }, [selectedTranscriberProvider]);

  // Helper function to get display value for API key
  const getApiKeyDisplayValue = (actualKey: string) => {
    if (!actualKey) return '••••••••••••••••••••••••••••••••';
    return maskApiKey(actualKey);
  };

  // Notify parent component of configuration changes and save to localStorage
  React.useEffect(() => {
    // Get the actual API key from environment variables if the state is empty
    const defaultApiKeys = agentConfigService.getFullApiKeys();
    
    let actualApiKey = apiKey;
    
    // Use environment variable API key if the state is empty
    if (!actualApiKey) {
      switch (selectedTranscriberProvider) {
        case 'Deepgram':
          actualApiKey = defaultApiKeys.deepgram || '';
          break;
        case 'Whisper':
          actualApiKey = defaultApiKeys.whisper || '';
          break;
      }
    }

    // Convert UI format to backend format
    const backendConfig = {
      provider: selectedTranscriberProvider === 'Deepgram' ? 'deepgram' : 'whisper',
      deepgram: selectedTranscriberProvider === 'Deepgram' ? {
        api_key: actualApiKey,
        model: selectedModel,
        language: selectedLanguage,
        punctuate: punctuateEnabled,
        smart_format: smartFormatEnabled,
        interim_results: interimResultEnabled
      } : null,
      whisper: selectedTranscriberProvider === 'Whisper' ? {
        api_key: actualApiKey,
        model: selectedModel,
        language: selectedLanguage === 'multi' ? null : selectedLanguage
      } : null
    };

    // Save to localStorage in UI format
    const uiConfig = {
      transcriberProvider: selectedTranscriberProvider,
      model: selectedModel,
      language: selectedLanguage,
      apiKey,
      punctuate: punctuateEnabled,
      smartFormat: smartFormatEnabled,
      interimResults: interimResultEnabled
    };
    saveStateToLocalStorage(uiConfig);

    if (onConfigChange) {
      onConfigChange(backendConfig);
    }
  }, [selectedTranscriberProvider, selectedModel, selectedLanguage, apiKey, punctuateEnabled, smartFormatEnabled, interimResultEnabled, onConfigChange]);

  // Handle configure button click
  const handleConfigure = async () => {
    setIsConfiguring(true);
    setConfigStatus('idle');

    try {
      // Save current state to localStorage
      const config = {
        transcriberProvider: selectedTranscriberProvider,
        model: selectedModel,
        language: selectedLanguage,
        apiKey,
        punctuate: punctuateEnabled,
        smartFormat: smartFormatEnabled,
        interimResults: interimResultEnabled
      };

      saveStateToLocalStorage(config);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      setConfigStatus('success');
      console.log('Transcriber configuration saved to localStorage:', config);

      // Clear success message after 3 seconds
      setTimeout(() => setConfigStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to configure transcriber:', error);
      setConfigStatus('error');

      // Clear error message after 3 seconds
      setTimeout(() => setConfigStatus('idle'), 3000);
    } finally {
      setIsConfiguring(false);
    }
  };

  // Manual refresh function
  const handleRefreshConfig = () => {
    console.log('🔄 Manually refreshing transcriber configuration from existingConfig');
    if (existingConfig) {
      // Force a refresh by temporarily clearing the flag
      setIsUserChangingProvider(false);
      // The existingConfig useEffect will now run and update the state
    }
  };

  const handleProviderChange = (provider: string) => {
    console.log('🔄 Transcriber provider changing from', selectedTranscriberProvider, 'to', provider);

    // Set flag to prevent existingConfig from overriding user selection
    setIsUserChangingProvider(true);

    // Clear any pending timeouts
    if (providerChangeTimeoutRef.current) {
      clearTimeout(providerChangeTimeoutRef.current);
    }

    setSelectedTranscriberProvider(provider);

    // Reset model to first available model for the new provider
    const providerData = transcriberProviders[provider as keyof typeof transcriberProviders];
    if (providerData && providerData.length > 0) {
      setSelectedModel(providerData[0]);
      saveStateToLocalStorage({
        selectedTranscriberProvider: provider,
        selectedModel: providerData[0]
      });
    }

    console.log('✅ Transcriber provider changed to', provider, 'with reset model');

    // Reset the flag after a delay
    providerChangeTimeoutRef.current = setTimeout(() => {
      setIsUserChangingProvider(false);
    }, 300);
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
              disabled={!isEditing}
              className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${!isEditing
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : isDarkMode
                  ? 'bg-orange-800/50 hover:bg-orange-700/50 text-orange-400'
                  : 'bg-orange-100 hover:bg-orange-200 text-orange-600'
                }`}
              title={isEditing ? "Refresh configuration from agent" : "Enable edit mode to refresh configuration"}
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
        <p className={`max-w-2xl mx-auto text-sm sm:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {isEditing ? 'Configure speech-to-text settings for accurate transcription of conversations' : 'View your transcriber configuration settings'}
        </p>

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
                  saveStateToLocalStorage({ selectedLanguage: e.target.value });
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
                  saveStateToLocalStorage({ selectedModel: e.target.value });
                }}
                className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all duration-300 text-sm sm:text-base ${isDarkMode
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
                className={`w-full p-3 rounded-xl border transition-all duration-300 cursor-not-allowed text-sm sm:text-base ${isDarkMode
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
                  saveStateToLocalStorage({ punctuateEnabled: !punctuateEnabled });
                }}
                disabled={!isEditing}
                className={`relative inline-block w-12 h-6 transition-colors duration-200 ease-in-out rounded-full ${!isEditing
                  ? 'opacity-50 cursor-not-allowed'
                  : punctuateEnabled
                    ? (isDarkMode ? 'bg-green-600' : 'bg-green-500')
                    : (isDarkMode ? 'bg-gray-600' : 'bg-gray-300')
                  }`}
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
                  saveStateToLocalStorage({ smartFormatEnabled: !smartFormatEnabled });
                }}
                disabled={!isEditing}
                className={`relative inline-block w-12 h-6 transition-colors duration-200 ease-in-out rounded-full ${!isEditing
                  ? 'opacity-50 cursor-not-allowed'
                  : smartFormatEnabled
                    ? (isDarkMode ? 'bg-green-600' : 'bg-green-500')
                    : (isDarkMode ? 'bg-gray-600' : 'bg-gray-300')
                  }`}
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
                  saveStateToLocalStorage({ interimResultEnabled: !interimResultEnabled });
                }}
                disabled={!isEditing}
                className={`relative inline-block w-12 h-6 transition-colors duration-200 ease-in-out rounded-full ${!isEditing
                  ? 'opacity-50 cursor-not-allowed'
                  : interimResultEnabled
                    ? (isDarkMode ? 'bg-green-600' : 'bg-green-500')
                    : (isDarkMode ? 'bg-gray-600' : 'bg-gray-300')
                  }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${interimResultEnabled ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Configure Button */}
      <div className={`p-4 sm:p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'}`}>
        <div className="flex justify-end">
          <button
            onClick={handleConfigure}
            disabled={isConfiguring || !isEditing}
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
