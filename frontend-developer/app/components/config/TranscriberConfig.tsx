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
  const lastTranscriberConfigRef = useRef<string>('');

  const transcriberProviders = {
    'Deepgram': ['nova-2', 'nova-2-general', 'nova-2-meeting', 'nova-2-phonecall', 'nova-2-finance', 'nova-2-conversationalai', 'nova-2-video', 'nova-2-medical', 'nova-2-drivethru', 'nova-2-automotivesales', 'nova-2-legal', 'nova-2-ppc', 'nova-2-government', 'nova-2-entertainment', 'nova-2-streaming', 'nova-2-restaurants']
  };

  // Load state from localStorage on component mount
  useEffect(() => {
    try {
      // Don't override user selections if they're actively changing the provider
      if (isUserChangingProvider) {
        return;
      }

      // Additional safety check - if we just changed the provider, don't override
      if (providerChangeTimeoutRef.current) {
        return;
      }

      // If we have existing config from agent, use that
      if (existingConfig) {
        // Handle STT config from backend
        if (existingConfig.provider) {
          // Set provider (convert backend format to UI format)
          let provider = existingConfig.provider;
          if (provider === 'deepgram') provider = 'Deepgram';
          if (provider === 'whisper') provider = 'Whisper';
          setSelectedTranscriberProvider(provider);

          // Set language - check provider-specific object first, then fallback to root level
          if (existingConfig[provider.toLowerCase()]?.language) {
setSelectedLanguage(existingConfig[provider.toLowerCase()].language);
          } else if (existingConfig.language) {
            setSelectedLanguage(existingConfig.language);
          }

          // Set model - check provider-specific object first, then fallback to root level
          if (existingConfig[provider.toLowerCase()]?.model) {
setSelectedModel(existingConfig[provider.toLowerCase()].model);
          } else if (existingConfig.model) {
            setSelectedModel(existingConfig.model);
          }

          // Set API key - check provider-specific object first, then fallback to root level
          if (existingConfig[provider.toLowerCase()]?.api_key) {
setApiKey(existingConfig[provider.toLowerCase()].api_key);
          } else if (existingConfig.api_key) {
setApiKey(existingConfig.api_key);
          }

          // Set punctuate - check provider-specific object first, then fallback to root level
          if (existingConfig[provider.toLowerCase()]?.punctuate !== undefined) {
setPunctuateEnabled(existingConfig[provider.toLowerCase()].punctuate);
          } else if (existingConfig.punctuate !== undefined) {
            setPunctuateEnabled(existingConfig.punctuate);
          }

          // Set smart format - check provider-specific object first, then fallback to root level
          if (existingConfig[provider.toLowerCase()]?.smart_format !== undefined) {
setSmartFormatEnabled(existingConfig[provider.toLowerCase()].smart_format);
          } else if (existingConfig.smart_format !== undefined) {
            setSmartFormatEnabled(existingConfig.smart_format);
          }

          // Set interim results - check provider-specific object first, then fallback to root level
          if (existingConfig[provider.toLowerCase()]?.interim_results !== undefined) {
setInterimResultEnabled(existingConfig[provider.toLowerCase()].interim_results);
          } else if (existingConfig.interim_results !== undefined) {
            setInterimResultEnabled(existingConfig.interim_results);
          }
}
      } else {
        // Load from centralized state if available
        // Note: TranscriberConfig should use centralized state through parent component
      }
    } catch (error) {
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

  // Note: Removed localStorage usage - now uses centralized state only

  // Load default values on component mount
  useEffect(() => {
    const defaultApiKeys = agentConfigService.getFullApiKeys();

    // Set default API key for Deepgram (only supported provider)
    setApiKey(defaultApiKeys.deepgram || '');
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
    
    // Use environment variable API key if the state is empty (Deepgram only)
    if (!actualApiKey) {
      actualApiKey = defaultApiKeys.deepgram || '';
    }

    // Convert UI format to backend format (only Deepgram supported)
    const backendConfig = {
      provider: 'deepgram',
      deepgram: {
        api_key: actualApiKey,
        model: selectedModel,
        language: selectedLanguage,
        punctuate: punctuateEnabled,
        smart_format: smartFormatEnabled,
        interim_results: interimResultEnabled
      }
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
    // Note: Removed localStorage usage - now uses centralized state only

    const configString = JSON.stringify(backendConfig);
    if (onConfigChange && configString !== lastTranscriberConfigRef.current) {
      lastTranscriberConfigRef.current = configString;
      onConfigChange(backendConfig);
    }
  }, [selectedTranscriberProvider, selectedModel, selectedLanguage, apiKey, punctuateEnabled, smartFormatEnabled, interimResultEnabled]);

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

      // Note: Removed localStorage usage - now uses centralized state only

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      setConfigStatus('success');
      // Clear success message after 3 seconds
      setTimeout(() => setConfigStatus('idle'), 3000);
    } catch (error) {
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
      setIsUserChangingProvider(false);
      // The existingConfig useEffect will now run and update the state
    }
  };

  const handleProviderChange = (provider: string) => {
    // Set flag to prevent existingConfig from overriding user selection
    setIsUserChangingProvider(true);

    // Clear any pending timeouts
    if (providerChangeTimeoutRef.current) {
      clearTimeout(providerChangeTimeoutRef.current);
    }

    setSelectedTranscriberProvider(provider);

    // Reset model to first available model for Deepgram
    const providerData = transcriberProviders['Deepgram'];
    if (providerData && providerData.length > 0) {
      setSelectedModel(providerData[0]);
      // Note: Removed localStorage usage - now uses centralized state only
    }
    // Reset the flag after a delay
    providerChangeTimeoutRef.current = setTimeout(() => {
      setIsUserChangingProvider(false);
    }, 300);
  };

  return (
    <div ref={ref} className="space-y-6">

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Provider and Language Selection */}
        <div className={`p-4 sm:p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-900/50' : 'bg-green-100'}`}>
              <Mic className={`h-4 w-4 sm:h-5 sm:w-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <div>
              <h4 className={`font-semibold text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Provider & Language</h4>
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
                disabled={true}
                className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all duration-300 text-sm sm:text-base ${isDarkMode
                  ? 'bg-gray-800/30 border-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <option value="Deepgram">Deepgram</option>
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
                  // Note: Removed localStorage usage - now uses centralized state only
                }}
                disabled={!isEditing}
                className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all duration-300 text-sm sm:text-base ${!isEditing
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
                  // Note: Removed localStorage usage - now uses centralized state only 
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
                type="text"
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


      {/* Additional Configuration - Only show for Deepgram */}
      {selectedTranscriberProvider === 'Deepgram' && (
        <div className={`p-4 sm:p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-900/50' : 'bg-green-100'}`}>
              <Settings className={`h-4 w-4 sm:h-5 sm:w-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <div>
              <h4 className={`font-semibold text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Additional Settings</h4>
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
                  </div>
                </div>
                <button
                  onClick={() => {
                    setPunctuateEnabled(!punctuateEnabled);
                    // Note: Removed localStorage usage - now uses centralized state only
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
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSmartFormatEnabled(!smartFormatEnabled);
                    // Note: Removed localStorage usage - now uses centralized state only
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
                  </div>
                </div>
                <button
                  onClick={() => {
                    setInterimResultEnabled(!interimResultEnabled);
                    // Note: Removed localStorage usage - now uses centralized state only       
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
      )}

    </div>
  );
});

TranscriberConfig.displayName = 'TranscriberConfig';

export default TranscriberConfig;
