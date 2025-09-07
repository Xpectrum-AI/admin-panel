'use client';

import React, { forwardRef, useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Settings, Loader2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { agentConfigService, maskApiKey } from '../../../service/agentConfigService';
import { useTheme } from '../../contexts/ThemeContext';

interface VoiceConfigProps {
  agentName?: string;
  onConfigChange?: (config: Record<string, unknown>) => void;
  existingConfig?: Record<string, unknown>;
  isEditing?: boolean;
}

const VoiceConfig = forwardRef<HTMLDivElement, VoiceConfigProps>(({ agentName = 'default', onConfigChange, existingConfig, isEditing = false }, ref) => {
  // Use theme with fallback to prevent errors
  let isDarkMode = false;
  try {
    const theme = useTheme();
    isDarkMode = theme?.isDarkMode || false;
  } catch {
    isDarkMode = false;
  }
  // Local state for UI updates
  const [selectedVoiceProvider, setSelectedVoiceProvider] = useState('OpenAI');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [speedValue, setSpeedValue] = useState(1.0);
  const [apiKey, setApiKey] = useState('');
  const [voiceId, setVoiceId] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('Alloy');
  const [stability, setStability] = useState(0.5);
  const [similarityBoost, setSimilarityBoost] = useState(0.5);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [configStatus, setConfigStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const providerChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Configuration status states
  const [isVoiceConfigured, setIsVoiceConfigured] = useState(false);
  const [currentVoiceConfig, setCurrentVoiceConfig] = useState<Record<string, unknown> | null>(null);

  const [voiceProviders, setVoiceProviders] = useState({
    'OpenAI': ['Alloy', 'Echo', 'Fable', 'Onyx', 'Nova', 'Shimmer'],
    '11Labs': ['Rachel', 'Domi', 'Bella', 'Antoni', 'Elli', 'Josh', 'Arnold', 'Adam', 'Sam'],
    'Cartesia': ['sonic-2', 'sonic-english', 'sonic-multilingual', 'sonic-ultra'],
    'Groq': ['llama-3.1-8b', 'llama-3.1-70b', 'mixtral-8x7b']
  });

  const languageMapping = {
    'english': 'English',
    'spanish': 'Spanish',
    'french': 'French',
    'german': 'German',
    'italian': 'Italian',
    'portuguese': 'Portuguese',
    'russian': 'Russian',
    'japanese': 'Japanese',
    'korean': 'Korean',
    'chinese': 'Chinese',
    'hindi': 'Hindi',
  };

  const reverseLanguageMapping = {
    'English': 'english',
    'Spanish': 'spanish',
    'French': 'french',
    'German': 'german',
    'Italian': 'italian',
    'Portuguese': 'portuguese',
    'Russian': 'russian',
    'Japanese': 'japanese',
    'Korean': 'korean',
    'Chinese': 'chinese',
    'Hindi': 'hindi',
  };

  // Load current configuration from API
  const loadCurrentConfiguration = useCallback(async () => {
    setIsLoadingConfig(true);

    try {
      const result = await agentConfigService.getCurrentVoiceConfig(agentName);
      if (result.success && result.data) {
        setIsVoiceConfigured(true);
        setCurrentVoiceConfig(result.data);
        
        // Update form fields with current configuration
        const ttsConfig = result.data;
        
        // Set provider (convert backend format to UI format)
        let provider = ttsConfig.provider;
        if (provider === 'cartesian') provider = 'Cartesia';
        if (provider === 'elevenlabs') provider = '11Labs';
        if (provider === 'openai') provider = 'OpenAI';
        
        setSelectedVoiceProvider(provider);
        
        // Set language (convert backend format to UI format)
        if (ttsConfig.cartesian?.language) {
          const backendLang = ttsConfig.cartesian.language;
          const uiLang = languageMapping[backendLang as keyof typeof languageMapping] || 'English';
          setSelectedLanguage(uiLang);
        }
        
        // Set speed
        if (ttsConfig.cartesian?.speed !== undefined) {
          setSpeedValue(ttsConfig.cartesian.speed);
        }
        
        // Set voice ID
        if (ttsConfig.cartesian?.voice_id) {
          setVoiceId(ttsConfig.cartesian.voice_id);
        }
        
        // Set API key
        if (ttsConfig.cartesian?.tts_api_key) {
          setApiKey(ttsConfig.cartesian.tts_api_key);
        }
        
        // Set voice model
        if (ttsConfig.cartesian?.model) {
          setSelectedVoice(ttsConfig.cartesian.model);
          
          // Update Cartesia voice options to include the backend model if it's not already there
          if (ttsConfig.provider === 'cartesian' && ttsConfig.cartesian.model) {
            setVoiceProviders(prev => ({
              ...prev,
              'Cartesia': [...new Set([...prev.Cartesia, ttsConfig.cartesian.model])]
            }));
          }
        }
        
        // Handle OpenAI config if present
        if (ttsConfig.openai) {
          if (ttsConfig.openai.voice) {
            setSelectedVoice(ttsConfig.openai.voice);
          }
          if (ttsConfig.openai.speed !== undefined) {
            setSpeedValue(ttsConfig.openai.speed);
          }
          if (ttsConfig.openai.api_key) {
            setApiKey(ttsConfig.openai.api_key);
          }
        }
        
        // Handle 11Labs config if present
        if (ttsConfig.elevenlabs) {
          if (ttsConfig.elevenlabs.voice_id) {
            setVoiceId(ttsConfig.elevenlabs.voice_id);
          }
          if (ttsConfig.elevenlabs.speed !== undefined) {
            setSpeedValue(ttsConfig.elevenlabs.speed);
          }
          if (ttsConfig.elevenlabs.api_key) {
            setApiKey(ttsConfig.elevenlabs.api_key);
          }
          if (ttsConfig.elevenlabs.stability !== undefined) {
            setStability(ttsConfig.elevenlabs.stability);
          }
          if (ttsConfig.elevenlabs.similarity_boost !== undefined) {
            setSimilarityBoost(ttsConfig.elevenlabs.similarity_boost);
          }
        }
      } else {
        setIsVoiceConfigured(false);
        setCurrentVoiceConfig(null);
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
      
      // Handle TTS config from backend - existingConfig is already the TTS config
      const ttsConfig = existingConfig;
      
      // Set provider (convert backend format to UI format)
      let provider = ttsConfig.provider;
      if (provider === 'cartesian') provider = 'Cartesia';
      if (provider === 'elevenlabs') provider = '11Labs';
      if (provider === 'openai') provider = 'OpenAI';
      
      setSelectedVoiceProvider(provider as string);
      
      // Set language (convert backend format to UI format)
      if ((ttsConfig as any).cartesian?.language) {
        const backendLang = (ttsConfig as any).cartesian.language;
        const uiLang = languageMapping[backendLang as keyof typeof languageMapping] || 'English';
        setSelectedLanguage(uiLang);
      }
      
      // Set speed
      if ((ttsConfig as any).cartesian?.speed !== undefined) {
        setSpeedValue((ttsConfig as any).cartesian.speed);
      }
      
      // Set voice ID
      if ((ttsConfig as any).cartesian?.voice_id) {
        setVoiceId((ttsConfig as any).cartesian.voice_id);
      }
      
      // Set API key
      if ((ttsConfig as any).cartesian?.tts_api_key) {
        setApiKey((ttsConfig as any).cartesian.tts_api_key);
      }
      
      // Set voice model
      if ((ttsConfig as any).cartesian?.model) {
        setSelectedVoice((ttsConfig as any).cartesian.model);
        
        // Update Cartesia voice options to include the backend model if it's not already there
        if ((ttsConfig as any).provider === 'cartesian' && (ttsConfig as any).cartesian.model) {
          setVoiceProviders(prev => ({
            ...prev,
            'Cartesia': [...new Set([...prev.Cartesia, (ttsConfig as any).cartesian.model])]
          }));
        }
      }
      
      // Handle OpenAI config if present
      if ((ttsConfig as any).openai) {
        if ((ttsConfig as any).openai.voice) {
          setSelectedVoice((ttsConfig as any).openai.voice);
        }
        if ((ttsConfig as any).openai.speed !== undefined) {
          setSpeedValue((ttsConfig as any).openai.speed);
        }
        if ((ttsConfig as any).openai.api_key) {
          setApiKey((ttsConfig as any).openai.api_key);
        }
      }
      
      // Handle 11Labs config if present
      if ((ttsConfig as any).elevenlabs) {
        if ((ttsConfig as any).elevenlabs.voice_id) {
          setVoiceId((ttsConfig as any).elevenlabs.voice_id);
        }
        if ((ttsConfig as any).elevenlabs.speed !== undefined) {
          setSpeedValue((ttsConfig as any).elevenlabs.speed);
        }
        if ((ttsConfig as any).elevenlabs.api_key) {
          setApiKey((ttsConfig as any).elevenlabs.api_key);
        }
        if ((ttsConfig as any).elevenlabs.stability !== undefined) {
          setStability((ttsConfig as any).elevenlabs.stability);
        }
        if ((ttsConfig as any).elevenlabs.similarity_boost !== undefined) {
          setSimilarityBoost((ttsConfig as any).elevenlabs.similarity_boost);
        }
      }
    }
  }, [existingConfig, isEditing]);

  // Load default values on component mount
  useEffect(() => {
    const defaultApiKeys = agentConfigService.getFullApiKeys();
    const defaultVoiceIds = agentConfigService.getDefaultVoiceIds();
    
    // Set default API key based on selected provider
    switch (selectedVoiceProvider) {
      case 'OpenAI':
        setApiKey(defaultApiKeys.openai || '');
        break;
      case '11Labs':
        setApiKey(defaultApiKeys.elevenlabs || '');
        setVoiceId(defaultVoiceIds.elevenlabs || '');
        break;
      case 'Cartesia':
        setApiKey(defaultApiKeys.cartesia || '');
        setVoiceId(defaultVoiceIds.cartesia || '');
        break;
    }
  }, [selectedVoiceProvider]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (providerChangeTimeoutRef.current) {
        clearTimeout(providerChangeTimeoutRef.current);
      }
    };
  }, []);

  // Helper function to get display value for API key
  const getApiKeyDisplayValue = (actualKey: string) => {
    if (!actualKey) return '••••••••••••••••••••••••••••••••';
    return maskApiKey(actualKey);
  };

  const handleSpeedChange = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (!isNaN(numValue)) {
      setSpeedValue(numValue);
    }
  };

  // Handle configure button click
  const handleConfigure = async () => {
    setIsConfiguring(true);
    setConfigStatus('idle');
    
    try {
      // Convert UI format to backend format
      const backendConfig = {
        provider: selectedVoiceProvider === 'Cartesia' ? 'cartesian' : 
                 selectedVoiceProvider === '11Labs' ? 'elevenlabs' : 'openai',
        cartesian: selectedVoiceProvider === 'Cartesia' ? {
          voice_id: voiceId,
          tts_api_key: apiKey,
          model: selectedVoice,
          speed: speedValue,
          language: reverseLanguageMapping[selectedLanguage as keyof typeof reverseLanguageMapping] || 'en'
        } : null,
        openai: selectedVoiceProvider === 'OpenAI' ? {
          voice: selectedVoice,
          speed: speedValue,
          api_key: apiKey
        } : null,
        elevenlabs: selectedVoiceProvider === '11Labs' ? {
          voice_id: voiceId,
          api_key: apiKey,
          speed: speedValue,
          stability,
          similarity_boost: similarityBoost
        } : null
      };

      const result = await agentConfigService.configureVoice(agentName, backendConfig);

      if (result.success) {
        setConfigStatus('success');
        setIsVoiceConfigured(true);
        setCurrentVoiceConfig(backendConfig);
        
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

  // Notify parent component of configuration changes
  React.useEffect(() => {
    if (onConfigChange) {
      // Convert UI format to backend format
      const backendConfig = {
        provider: selectedVoiceProvider === 'Cartesia' ? 'cartesian' : 
                 selectedVoiceProvider === '11Labs' ? 'elevenlabs' : 'openai',
        cartesian: selectedVoiceProvider === 'Cartesia' ? {
          voice_id: voiceId,
          tts_api_key: apiKey,
          model: selectedVoice,
          speed: speedValue,
          language: reverseLanguageMapping[selectedLanguage as keyof typeof reverseLanguageMapping] || 'en'
        } : null,
        openai: selectedVoiceProvider === 'OpenAI' ? {
          voice: selectedVoice,
          speed: speedValue,
          api_key: apiKey
        } : null,
        elevenlabs: selectedVoiceProvider === '11Labs' ? {
          voice_id: voiceId,
          api_key: apiKey,
          speed: speedValue,
          stability,
          similarity_boost: similarityBoost
        } : null
      };

      onConfigChange(backendConfig);
    }
  }, [selectedVoiceProvider, selectedVoice, selectedLanguage, speedValue, apiKey, voiceId, stability, similarityBoost, onConfigChange, reverseLanguageMapping]);

  // Handle provider changes with proper state management
  const handleProviderChange = (newProvider: string) => {
    
    // Clear any pending timeouts
    if (providerChangeTimeoutRef.current) {
      clearTimeout(providerChangeTimeoutRef.current);
    }
    
    // Reset related state when provider changes
    let defaultVoice = 'Alloy';
    if (newProvider === 'OpenAI') {
      defaultVoice = 'Alloy';
    } else if (newProvider === 'Cartesia') {
      defaultVoice = 'sonic-2';
    } else if (newProvider === '11Labs') {
      defaultVoice = 'Rachel';
    }
    
    // Update the provider and voice state
    setSelectedVoiceProvider(newProvider);
    setSelectedVoice(defaultVoice);
  };

  // Manual refresh function
  const handleRefreshConfig = () => {
    if (existingConfig) {
      // Force a refresh by temporarily clearing the flag
      // The existingConfig useEffect will now run and update the state
    }
  };

  const renderProviderSpecificFields = () => {
    switch (selectedVoiceProvider) {
      case 'OpenAI':
        return (
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
        );
      case '11Labs':
        return (
          <div className="space-y-4 ">
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
            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Voice ID
              </label>
              <input
                type="password"
                value={voiceId ? maskApiKey(voiceId) : '••••••••••••••••••••••••••••••••'}
                readOnly
                className={`w-full p-3 rounded-xl border transition-all duration-300 cursor-not-allowed text-sm sm:text-base ${
                  isDarkMode 
                    ? 'border-gray-600 bg-gray-700/50 text-gray-400' 
                    : 'border-gray-200 bg-gray-100/50 text-gray-500'
                }`}
                placeholder="Default voice ID loaded"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Stability: {stability}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={stability}
                  onChange={(e) => setStability(parseFloat(e.target.value))}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>0.5</span>
                  <span>1</span>
                </div>
              </div>
              <div>
                <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Similarity Boost: {similarityBoost}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={similarityBoost}
                  onChange={(e) => setSimilarityBoost(parseFloat(e.target.value))}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>0.5</span>
                  <span>1</span>
                </div>
              </div>
            </div>
          </div>
        );
      case 'Cartesia':
        return (
          <div className="space-y-4 ">
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
            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Voice ID
              </label>
              <input
                type="password"
                value={voiceId ? maskApiKey(voiceId) : '••••••••••••••••••••••••••••••••'}
                readOnly
                className={`w-full p-3 rounded-xl border transition-all duration-300 cursor-not-allowed text-sm sm:text-base ${
                  isDarkMode 
                    ? 'border-gray-600 bg-gray-700/50 text-gray-400' 
                    : 'border-gray-200 bg-gray-100/50 text-gray-500'
                }`}
                placeholder="Default voice ID loaded"
              />
            </div>
          </div>
        );
      default:
        return (
          <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'}`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              No additional configuration required for {selectedVoiceProvider}.
            </p>
          </div>
        );
    }
  };

  return (
    <div ref={ref} className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
            <Mic className={`h-6 w-6 sm:h-8 sm:w-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <div className="flex items-center gap-2">
            <h3 className={`text-xl sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Voice Configuration</h3>
            <button
              onClick={handleRefreshConfig}
              className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                isDarkMode 
                  ? 'bg-blue-800/50 hover:bg-blue-700/50 text-blue-400' 
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
              }`}
              title="Refresh configuration from agent"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
        <p className={`max-w-2xl mx-auto text-sm sm:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Select a voice from the list, or sync your voice library if it&apos;s missing. If errors persist, enable custom voice and add a voice ID.
        </p>
      </div>

      {/* Configuration Status */}
      <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Configuration Status</h4>
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Current voice configuration status
            </p>
          </div>
          <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <Mic className={`h-5 w-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
          </div>
        </div>
        
        <div className={`p-3 rounded-lg border ${isVoiceConfigured ? (isDarkMode ? 'bg-green-900/20 border-green-700 text-green-300' : 'bg-green-50 border-green-200 text-green-700') : (isDarkMode ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700')}`}>
          <div className="flex items-center gap-2">
            {isVoiceConfigured ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">
              {isVoiceConfigured ? 'Voice Config Ready' : 'Voice Config Missing'}
            </span>
          </div>
          {isVoiceConfigured && currentVoiceConfig && (
            <p className="text-xs mt-1 opacity-80">
              Provider: {(currentVoiceConfig.provider as string) || 'Unknown'}
            </p>
          )}
        </div>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Provider and Voice Selection */}
        <div className={`p-4 sm:p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
              <Mic className={`h-4 w-4 sm:h-5 sm:w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div>
              <h4 className={`font-semibold text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Voice Selection</h4>
              <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Choose your voice provider and voice</p>
            </div>
          </div>
          
          <div className="space-y-4 ">
            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Provider
              </label>
              <select
                value={selectedVoiceProvider}
                onChange={(e) => {
                  handleProviderChange(e.target.value);
                }}
                className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 text-sm sm:text-base ${
                  isDarkMode 
                    ? 'bg-gray-700/50 border-gray-600 text-gray-200' 
                    : 'bg-gray-100/50 border-gray-200 text-gray-900'
                }`}
              >
                {Object.keys(voiceProviders).map((provider) => (
                  <option key={provider} value={provider}>{provider}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Voice
              </label>
              <select
                value={selectedVoice}
                onChange={(e) => {
                  setSelectedVoice(e.target.value);
                }}
                className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 text-sm sm:text-base ${
                  isDarkMode 
                    ? 'bg-gray-700/50 border-gray-600 text-gray-200' 
                    : 'bg-gray-50 border-gray-200 text-gray-900'
                }`}
              >
                {voiceProviders[selectedVoiceProvider as keyof typeof voiceProviders]?.map((voice) => (
                  <option key={voice} value={voice}>{voice}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Language and Speed */}
        <div className={`p-4 sm:p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-900/50' : 'bg-green-100'}`}>
              <Mic className={`h-4 w-4 sm:h-5 sm:w-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <div>
              <h4 className={`font-semibold text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Voice Settings</h4>
              <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Configure language and speed</p>
            </div>
          </div>
          
          <div className="space-y-4 ">
            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Language
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => {
                  setSelectedLanguage(e.target.value);
                }}
                className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all duration-300 text-sm sm:text-base ${
                  isDarkMode 
                    ? 'bg-gray-700/50 border-gray-600 text-gray-200' 
                    : 'bg-gray-50 border-gray-200 text-gray-900'
                }`}
              >
                {Object.keys(languageMapping).map((key) => (
                  <option key={key} value={languageMapping[key as keyof typeof languageMapping]}>{languageMapping[key as keyof typeof languageMapping]}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Speed: {speedValue}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0.25"
                  max="4.0"
                  step="0.25"
                  value={speedValue}
                  onChange={(e) => {
                    handleSpeedChange(e.target.value);
                  }}
                  className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}
                />
                <input
                  type="number"
                  min="0.25"
                  max="4.0"
                  step="0.25"
                  value={speedValue}
                  onChange={(e) => {
                    handleSpeedChange(e.target.value);
                  }}
                  className={`w-16 p-2 rounded-lg border text-center text-sm ${
                    isDarkMode 
                      ? 'bg-gray-700/50 border-gray-600 text-gray-200' 
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0.25x</span>
                <span>2.0x</span>
                <span>4.0x</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Provider-specific Configuration */}
      <div className={`p-4 sm:p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
            <Mic className={`h-4 w-4 sm:h-5 sm:w-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>
          <div>
            <h4 className={`font-semibold text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {selectedVoiceProvider} Configuration
            </h4>
            <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Configure {selectedVoiceProvider} specific settings
            </p>
          </div>
        </div>
        
        {renderProviderSpecificFields()}
      </div>

      {/* Configure Button */}
      <div className={`p-4 sm:p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className={`font-semibold text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Save Configuration
            </h4>
            <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Save your voice configuration to the API
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
                Voice configuration saved successfully!
              </span>
            </div>
          </div>
        )}

        {configStatus === 'error' && (
          <div className={`mt-4 p-3 rounded-xl border ${isDarkMode ? 'bg-red-900/20 border-red-700/50' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-800'}`}>
                Failed to save voice configuration. Please try again.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

VoiceConfig.displayName = 'VoiceConfig';

export default VoiceConfig;