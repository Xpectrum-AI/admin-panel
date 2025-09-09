'use client';

import React, { forwardRef, useState, useEffect } from 'react';
import { Wrench, CheckCircle, AlertCircle, Loader2, Clock, Volume2, MessageSquare, Timer, Zap, Bot, Settings, RefreshCw } from 'lucide-react';
import { agentConfigService } from '../../../service/agentConfigService';
import { useTheme } from '../../contexts/ThemeContext';

interface ToolsConfigProps {
  agentName?: string;
  modelConfig?: any;
  voiceConfig?: any;
  transcriberConfig?: any;
  onAgentCreated?: () => void;
  isEditing?: boolean;
  existingAgent?: any;
  onConfigChange?: (config: any) => void;
  existingConfig?: any;
}

const ToolsConfig = forwardRef<HTMLDivElement, ToolsConfigProps>(({
  agentName = 'default',
  modelConfig,
  voiceConfig,
  transcriberConfig,
  onAgentCreated,
  isEditing = false,
  existingAgent,
  existingConfig
}, ref) => {
  const { isDarkMode } = useTheme();

  // Tools configuration state
  const [initialMessage, setInitialMessage] = useState('Hello! How can I help you today?');
  const [nudgeText, setNudgeText] = useState('Hello, Are you still there?');
  const [nudgeInterval, setNudgeInterval] = useState(15);
  const [maxNudges, setMaxNudges] = useState(3);
  const [typingVolume, setTypingVolume] = useState(0.8);
  const [maxCallDuration, setMaxCallDuration] = useState(300);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [configStatus, setConfigStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Configuration status from localStorage
  const [localVoiceConfig, setLocalVoiceConfig] = useState<any>(null);
  const [localModelConfig, setLocalModelConfig] = useState<any>(null);
  const [localTranscriberConfig, setLocalTranscriberConfig] = useState<any>(null);

  // Update initial message when modelConfig changes
  useEffect(() => {
    if (modelConfig?.firstMessage) {
      setInitialMessage(modelConfig.firstMessage);
    }
  }, [modelConfig]);

  // Populate form fields when editing an existing agent
  useEffect(() => {
    if (isEditing) {
      if (existingConfig) {
        // Use existingConfig if available (from getAgentConfigData)
        console.log('🔄 ToolsConfig: Loading form with existing config:', existingConfig);
        setInitialMessage(existingConfig.initialMessage || 'Hello! How can I help you today?');
        setNudgeText(existingConfig.nudgeText || 'Hello, Are you still there?');
        setNudgeInterval(existingConfig.nudgeInterval || 15);
        setMaxNudges(existingConfig.maxNudges || 3);
        setTypingVolume(existingConfig.typingVolume || 0.8);
        setMaxCallDuration(existingConfig.maxCallDuration || 300);
      } else if (existingAgent) {
        // Fallback to existingAgent if existingConfig is not available
        console.log('🔄 ToolsConfig: Loading form with existing agent:', existingAgent);
        setInitialMessage(existingAgent.initial_message || 'Hello! How can I help you today?');
        setNudgeText(existingAgent.nudge_text || 'Hello, Are you still there?');
        setNudgeInterval(existingAgent.nudge_interval || 15);
        setMaxNudges(existingAgent.max_nudges || 3);
        setTypingVolume(existingAgent.typing_volume || 0.8);
        setMaxCallDuration(existingAgent.max_call_duration || 300);
      }
    }
  }, [isEditing, existingAgent, existingConfig]);

  // Debug logging for configuration data
  useEffect(() => {
    console.log('=== ToolsConfig Debug Info ===');
    console.log('voiceConfig:', voiceConfig);
    console.log('transcriberConfig:', transcriberConfig);
    console.log('existingAgent:', existingAgent);
    console.log('existingConfig:', existingConfig);
    console.log('isEditing:', isEditing);
    console.log('agentName:', agentName);
    console.log('=== End Debug Info ===');
  }, [voiceConfig, transcriberConfig, existingAgent, existingConfig, isEditing, agentName]);

  // Load saved configuration from localStorage on component mount
  useEffect(() => {
    try {
      // Load tools config
      const savedToolsConfig = localStorage.getItem('toolsConfigState');
      if (savedToolsConfig) {
        const parsedConfig = JSON.parse(savedToolsConfig);
        console.log('Loading saved tools config:', parsedConfig);

        if (parsedConfig.initialMessage) setInitialMessage(parsedConfig.initialMessage);
        if (parsedConfig.nudgeText) setNudgeText(parsedConfig.nudgeText);
        if (parsedConfig.nudgeInterval) setNudgeInterval(parsedConfig.nudgeInterval);
        if (parsedConfig.maxNudges) setMaxNudges(parsedConfig.maxNudges);
        if (parsedConfig.typingVolume) setTypingVolume(parsedConfig.typingVolume);
        if (parsedConfig.maxCallDuration) setMaxCallDuration(parsedConfig.maxCallDuration);
      }

      // Load voice and model configs using the same comprehensive approach
      refreshConfigurations();
    } catch (error) {
      console.warn('Failed to load saved configs:', error);
    }
  }, []); // Load once on mount

  // Function to refresh configurations from localStorage
  const refreshConfigurations = () => {
    try {
      // Check all possible localStorage keys for voice config
      let voiceConfigFound = null;
      let modelConfigFound = null;
      let transcriberConfigFound = null;

      // Look for voice config in various possible keys
      const possibleVoiceKeys = ['voiceConfigState', 'voiceConfig', 'selectedVoiceProvider'];
      for (const key of possibleVoiceKeys) {
        const savedVoiceConfig = localStorage.getItem(key);
        if (savedVoiceConfig) {
          try {
            const parsedVoiceConfig = JSON.parse(savedVoiceConfig);
            if (parsedVoiceConfig && (
              parsedVoiceConfig.voiceProvider ||
              parsedVoiceConfig.selectedVoiceProvider ||
              parsedVoiceConfig.selectedVoice ||
              parsedVoiceConfig.voiceId
            )) {
              voiceConfigFound = parsedVoiceConfig;
              console.log(`Found voice config in localStorage key "${key}":`, parsedVoiceConfig);
              break;
            }
          } catch (e) {
            console.log(`Could not parse voice config from key "${key}":`, e);
          }
        }
      }

      // Look for model config in various possible keys
      const possibleModelKeys = ['modelConfigState', 'modelConfig', 'selectedModelProvider', 'modelProvider'];
      for (const key of possibleModelKeys) {
        const savedModelConfig = localStorage.getItem(key);
        if (savedModelConfig) {
          try {
            const parsedModelConfig = JSON.parse(savedModelConfig);
            if (parsedModelConfig && (
              parsedModelConfig.selectedModelProvider ||
              parsedModelConfig.provider ||
              parsedModelConfig.model ||
              parsedModelConfig.selectedModel
            )) {
              modelConfigFound = parsedModelConfig;
              console.log(`Found model config in localStorage key "${key}":`, parsedModelConfig);
              break;
            }
          } catch (e) {
            console.log(`Could not parse model config from key "${key}":`, e);
          }
        }
      }

      // Look for transcriber config in various possible keys
      const possibleTranscriberKeys = ['transcriberConfigState', 'transcriberConfig', 'selectedTranscriberProvider'];
      for (const key of possibleTranscriberKeys) {
        const savedTranscriberConfig = localStorage.getItem(key);
        if (savedTranscriberConfig) {
          try {
            const parsedTranscriberConfig = JSON.parse(savedTranscriberConfig);
            if (parsedTranscriberConfig && (
              parsedTranscriberConfig.transcriberProvider ||
              parsedTranscriberConfig.selectedTranscriberProvider ||
              parsedTranscriberConfig.provider
            )) {
              transcriberConfigFound = parsedTranscriberConfig;
              console.log(`Found transcriber config in localStorage key "${key}":`, parsedTranscriberConfig);
              break;
            }
          } catch (e) {
            console.log(`Could not parse transcriber config from key "${key}"`);
          }
        }
      }

      // Also check if there's a direct voice config object in localStorage
      // (This handles the case where the voice config is stored directly)
      if (!voiceConfigFound) {
        // Check all localStorage keys for voice-related data
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            const value = localStorage.getItem(key);
            // Look for voice config by checking if the value contains voice-related data
            if (value && (
              value.includes('11Labs') ||
              value.includes('OpenAI') ||
              value.includes('voiceProvider') ||
              value.includes('selectedVoiceProvider') ||
              value.includes('voiceId') ||
              value.includes('Rachel')
            )) {
              try {
                const parsed = JSON.parse(value);
                if (parsed && (
                  parsed.voiceProvider ||
                  parsed.selectedVoiceProvider ||
                  parsed.voiceId ||
                  parsed.selectedVoice
                )) {
                  voiceConfigFound = parsed;
                  console.log(`Found voice config in localStorage key "${key}":`, parsed);
                  break;
                }
              } catch (e) {
                console.log(`Could not parse voice config from key "${key}":`, e);
              }
            }
          }
        }
      }

      // Also check for model config in a similar way
      if (!modelConfigFound) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            const value = localStorage.getItem(key);
            if (value && (
              value.includes('GPT') ||
              value.includes('Claude') ||
              value.includes('gpt-4o') ||
              value.includes('gpt-4') ||
              value.includes('selectedModelProvider') ||
              value.includes('modelProvider') ||
              value.includes('OpenAI') ||
              value.includes('Anthropic')
            )) {
              try {
                const parsed = JSON.parse(value);
                if (parsed && (
                  parsed.selectedModelProvider ||
                  parsed.modelProvider ||
                  parsed.provider ||
                  parsed.model ||
                  parsed.selectedModel
                )) {
                  modelConfigFound = parsed;
                  console.log(`Found model config in localStorage key "${key}":`, parsed);
                  break;
                }
              } catch (e) {
                console.log(`Could not parse model config from key "${key}":`, e);
              }
            }
          }
        }
      }

      // If still no model config found, try to construct it from individual keys
      if (!modelConfigFound) {
        const modelProvider = localStorage.getItem('selectedModelProvider') || localStorage.getItem('modelProvider');
        const model = localStorage.getItem('selectedModel') || localStorage.getItem('model');

        if (modelProvider || model) {
          modelConfigFound = {
            selectedModelProvider: modelProvider,
            modelProvider: modelProvider,
            provider: modelProvider,
            selectedModel: model,
            model: model
          };
          console.log('Constructed model config from individual keys:', modelConfigFound);
        }
      }

      setLocalVoiceConfig(voiceConfigFound);
      setLocalModelConfig(modelConfigFound);
      setLocalTranscriberConfig(transcriberConfigFound);

      console.log('Final voice config found:', voiceConfigFound);
      console.log('Final model config found:', modelConfigFound);
      console.log('Final transcriber config found:', transcriberConfigFound);
    } catch (error) {
      console.warn('Failed to refresh configurations:', error);
    }
  };

  // Refresh configurations when component becomes visible or when props change
  useEffect(() => {
    refreshConfigurations();
  }, [voiceConfig, modelConfig]); // Refresh when props change

  const handleCreateAgent = async () => {
    setIsLoading(true);
    setConfigStatus('idle');
    setErrorMessage('');

    try {
      console.log('=== Creating/Updating Agent ===');
      console.log('Initial voiceConfig:', voiceConfig);
      console.log('Initial transcriberConfig:', transcriberConfig);

      // Validate configurations - check both props and localStorage
      const effectiveVoiceConfig = voiceConfig || localVoiceConfig;
      const effectiveModelConfig = modelConfig || localModelConfig;
      const effectiveTranscriberConfig = transcriberConfig || localTranscriberConfig;

      if (!effectiveVoiceConfig) {
        throw new Error('Voice configuration is required. Please configure in the Voice tab.');
      }

      if (!effectiveTranscriberConfig) {
        throw new Error('Transcriber configuration is required. Please configure in the Transcriber tab.');
      }

      // Build TTS configuration
      let ttsConfig: any = {};
      if (effectiveVoiceConfig) {
        // Check if voiceConfig is already in backend format
        if (effectiveVoiceConfig.tts_config) {
          // Already in backend format, use as is
          ttsConfig = effectiveVoiceConfig.tts_config;
          console.log('Using existing TTS config from backend:', ttsConfig);
        } else if (effectiveVoiceConfig.provider) {
          // Already in backend format, use as is
          ttsConfig = effectiveVoiceConfig;
          console.log('Using existing TTS config with provider:', ttsConfig);
        } else {
          // Convert from UI format to backend format
          console.log('Converting UI format to backend format for TTS');
          switch (effectiveVoiceConfig.voiceProvider) {
            case 'OpenAI':
              ttsConfig = {
                provider: 'openai',
                openai: {
                  api_key: effectiveVoiceConfig.apiKey,
                  voice: effectiveVoiceConfig.voice.toLowerCase(),
                  response_format: 'mp3',
                  quality: 'standard',
                  speed: effectiveVoiceConfig.speed
                }
              };
              break;
            case '11Labs':
              ttsConfig = {
                provider: 'elevenlabs',
                elevenlabs: {
                  api_key: effectiveVoiceConfig.apiKey,
                  voice_id: effectiveVoiceConfig.voiceId,
                  model_id: 'eleven_monolingual_v1',
                  stability: effectiveVoiceConfig.stability,
                  similarity_boost: effectiveVoiceConfig.similarityBoost,
                  speed: effectiveVoiceConfig.speed
                }
              };
              break;
            case 'Cartesia':
              ttsConfig = {
                provider: 'cartesian',
                cartesian: {
                  voice_id: effectiveVoiceConfig.voiceId,
                  tts_api_key: effectiveVoiceConfig.apiKey,
                  model: effectiveVoiceConfig.voice,
                  speed: effectiveVoiceConfig.speed,
                  language: effectiveVoiceConfig.language.toLowerCase()
                }
              };
              break;
          }
          console.log('Converted TTS config:', ttsConfig);
        }
      } else {
        console.log('No voiceConfig provided');
      }

      // Build STT configuration
      let sttConfig: any = {};
      if (effectiveTranscriberConfig) {
        // Check if transcriberConfig is already in backend format
        if (effectiveTranscriberConfig.provider) {
          // Already in backend format, use as is
          sttConfig = effectiveTranscriberConfig;
          console.log('Using existing STT config from backend:', sttConfig);
        } else {
          // Convert from UI format to backend format
          console.log('Converting UI format to backend format for STT');
          switch (effectiveTranscriberConfig.transcriberProvider || effectiveTranscriberConfig.selectedTranscriberProvider) {
            case 'Deepgram':
              sttConfig = {
                provider: 'deepgram',
                deepgram: {
                  api_key: effectiveTranscriberConfig.apiKey,
                  model: effectiveTranscriberConfig.model,
                  language: effectiveTranscriberConfig.language,
                  punctuate: effectiveTranscriberConfig.punctuate,
                  smart_format: effectiveTranscriberConfig.smartFormat,
                  interim_results: effectiveTranscriberConfig.interimResults
                }
              };
              break;
            case 'Whisper':
              sttConfig = {
                provider: 'whisper',
                whisper: {
                  api_key: effectiveTranscriberConfig.apiKey,
                  model: effectiveTranscriberConfig.model,
                  language: effectiveTranscriberConfig.language === 'multi' ? null : effectiveTranscriberConfig.language
                }
              };
              break;
          }
          console.log('Converted STT config:', sttConfig);
        }
      } else {
        console.log('No transcriberConfig provided');
      }

      // Validate final configurations
      if (!ttsConfig.provider) {
        throw new Error('Invalid TTS configuration: missing provider');
      }

      if (!sttConfig.provider) {
        throw new Error('Invalid STT configuration: missing provider');
      }

      // Complete agent configuration
      const completeConfig = {
        organization_id: 'developer', // Set default organization ID for developer dashboard
        initial_message: initialMessage,
        nudge_text: nudgeText,
        nudge_interval: nudgeInterval,
        max_nudges: maxNudges,
        typing_volume: typingVolume,
        max_call_duration: maxCallDuration,
        tts_config: ttsConfig,
        stt_config: sttConfig
      };

      console.log('Complete config to send:', completeConfig);

      const result = await agentConfigService.configureAgent(agentName, completeConfig);

      if (result.success) {
        setConfigStatus('success');
        setSuccessMessage(isEditing ? `Agent "${agentName}" updated successfully!` : `Agent "${agentName}" created successfully!`);
        setErrorMessage('');
        setTimeout(() => {
          setConfigStatus('idle');
          setSuccessMessage('');
        }, 3000);

        // Call the callback to reset edit mode and refresh agents list
        if (onAgentCreated) {
          try {
            // Add a small delay to ensure the backend has processed the creation/update
            setTimeout(async () => {
              console.log('🔄 Calling onAgentCreated callback to reset edit mode...');
              await onAgentCreated();
            }, 1000);
          } catch (error) {
            console.warn('Error calling onAgentCreated callback:', error);
          }
        }
      } else {
        setConfigStatus('error');
        setErrorMessage(result.message || (isEditing ? 'Failed to update agent' : 'Failed to create agent'));
      }
    } catch (error) {
      setConfigStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create agent');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const parseDuration = (duration: string): number => {
    const [minutes, seconds] = duration.split(':').map(Number);
    return (minutes * 60) + (seconds || 0);
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

        {/* Success Message */}
        {successMessage && (
          <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-green-900/20 border-green-700 text-green-300' : 'bg-green-50 border-green-200 text-green-700'}`}>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">{successMessage}</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <Wrench className={`h-6 w-6 sm:h-8 sm:w-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            </div>
            <h3 className={`text-xl sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Tools Configuration</h3>
          </div>
          <p className={`max-w-2xl mx-auto text-sm sm:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {isEditing ? 'Configure agent behavior, call settings, and advanced options' : 'View your agent tools configuration settings'}
          </p>

          {/* Mode Indicator */}
          <div className="mt-4 flex justify-center">
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${isEditing
              ? 'bg-gray-100 text-gray-800 border border-gray-200'
              : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}>
              {isEditing ? '✏️ Edit Mode' : '👁️ View Mode'}
            </div>
          </div>
        </div>

        {/* Configuration Status */}
        <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Configuration Status</h4>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Check the status of your voice and transcriber configurations
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <Bot className={`h-5 w-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
              </div>
              <button
                onClick={() => {
                  // Debug: Log all localStorage contents
                  console.log('=== localStorage Debug ===');
                  for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key) {
                      const value = localStorage.getItem(key);
                      console.log(`Key: "${key}"`, 'Value:', value);
                    }
                  }
                  console.log('=== End localStorage Debug ===');
                  refreshConfigurations();
                }}
                disabled={!isEditing}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${!isEditing
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                title={isEditing ? "Debug localStorage and refresh configurations" : "Enable edit mode to refresh configurations"}
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Voice Configuration Status */}
            <div className={`p-3 rounded-lg border ${(voiceConfig || localVoiceConfig) ? (isDarkMode ? 'bg-green-900/20 border-green-700 text-green-300' : 'bg-green-50 border-green-200 text-green-700') : (isDarkMode ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700')}`}>
              <div className="flex items-center gap-2">
                {(voiceConfig || localVoiceConfig) ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {(voiceConfig || localVoiceConfig) ? 'Voice Config Ready' : 'Voice Config Missing'}
                </span>
              </div>
              {(voiceConfig || localVoiceConfig) && (
                <p className="text-xs mt-1 opacity-80">
                  Provider: {(voiceConfig || localVoiceConfig)?.provider || (voiceConfig || localVoiceConfig)?.voiceProvider || 'Unknown'}
                </p>
              )}
            </div>

            {/* Model Configuration Status */}
            <div className={`p-3 rounded-lg border ${(modelConfig || localModelConfig) ? (isDarkMode ? 'bg-green-900/20 border-green-700 text-green-300' : 'bg-green-50 border-green-200 text-green-700') : (isDarkMode ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700')}`}>
              <div className="flex items-center gap-2">
                {(modelConfig || localModelConfig) ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {(modelConfig || localModelConfig) ? 'Model Config Ready' : 'Model Config Missing'}
                </span>
              </div>
              {(modelConfig || localModelConfig) && (
                <div className="text-xs mt-1 opacity-80">
                  <p>Provider: {(modelConfig || localModelConfig)?.selectedModelProvider || (modelConfig || localModelConfig)?.provider || 'Unknown'}</p>
                  {(modelConfig || localModelConfig)?.model && (
                    <p>Model: {(modelConfig || localModelConfig)?.model}</p>
                  )}
                </div>
              )}
            </div>

            {/* Transcriber Configuration Status */}
            <div className={`p-3 rounded-lg border ${(transcriberConfig || localTranscriberConfig) ? (isDarkMode ? 'bg-green-900/20 border-green-700 text-green-300' : 'bg-green-50 border-green-200 text-green-700') : (isDarkMode ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700')}`}>
              <div className="flex items-center gap-2">
                {(transcriberConfig || localTranscriberConfig) ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {(transcriberConfig || localTranscriberConfig) ? 'Transcriber Config Ready' : 'Transcriber Config Missing'}
                </span>
              </div>
              {(transcriberConfig || localTranscriberConfig) && (
                <p className="text-xs mt-1 opacity-80">
                  Provider: {(transcriberConfig || localTranscriberConfig)?.provider || (transcriberConfig || localTranscriberConfig)?.transcriberProvider || (transcriberConfig || localTranscriberConfig)?.selectedTranscriberProvider || 'Unknown'}
                </p>
              )}
            </div>
          </div>

          {(!(voiceConfig || localVoiceConfig) || !(transcriberConfig || localTranscriberConfig)) && (
            <div className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-yellow-900/20 border border-yellow-700 text-yellow-300' : 'bg-yellow-50 border border-yellow-200 text-yellow-700'}`}>
              <p className="text-sm">
                <strong>Note:</strong> Please configure both Voice and Transcriber settings before creating the agent.
                {!(voiceConfig || localVoiceConfig) && ' Visit the Voice tab to configure TTS settings.'}
                {!(transcriberConfig || localTranscriberConfig) && ' Visit the Transcriber tab to configure STT settings.'}
              </p>
            </div>
          )}
        </div>

        {/* Initial Message Configuration */}
        <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Initial Message</h4>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Configure the first message your agent will say when a call starts.
              </p>
            </div>
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <MessageSquare className={`h-5 w-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <MessageSquare className="h-4 w-4" />
              Initial Message
            </label>
            <textarea
              rows={3}
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              disabled={!isEditing}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 backdrop-blur-sm transition-all duration-300 resize-none ${!isEditing
                ? isDarkMode
                  ? 'border-gray-700 bg-gray-800/30 text-gray-400 placeholder-gray-500 cursor-not-allowed'
                  : 'border-gray-300 bg-gray-100 text-gray-500 placeholder-gray-400 cursor-not-allowed'
                : isDarkMode
                  ? 'border-gray-600 bg-gray-800/80 text-gray-200 placeholder-gray-500'
                  : 'border-gray-200 bg-white/80 text-gray-900 placeholder-gray-400'
                }`}
              placeholder="Enter the agent's first message..."
            />
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              This message will be automatically populated from the Model tab, but you can customize it here.
            </p>
          </div>
        </div>

        {/* Call Behavior Configuration */}
        <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Call Behavior</h4>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Configure how your agent behaves during calls, including nudges and timeouts.
              </p>
            </div>
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <Zap className={`h-5 w-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            </div>
          </div>

          <div className="space-y-6">
            {/* Nudge Text */}
            <div>
              <label className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <MessageSquare className="h-4 w-4" />
                Nudge Text
              </label>
              <textarea
                rows={2}
                value={nudgeText}
                onChange={(e) => setNudgeText(e.target.value)}
                disabled={!isEditing}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 backdrop-blur-sm transition-all duration-300 resize-none ${!isEditing
                  ? isDarkMode
                    ? 'border-gray-700 bg-gray-800/30 text-gray-400 placeholder-gray-500 cursor-not-allowed'
                    : 'border-gray-300 bg-gray-100 text-gray-500 placeholder-gray-400 cursor-not-allowed'
                  : isDarkMode
                    ? 'border-gray-600 bg-gray-800/80 text-gray-200 placeholder-gray-500'
                    : 'border-gray-200 bg-white/80 text-gray-900 placeholder-gray-400'
                  }`}
                placeholder="Message to send when user is silent..."
              />
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                This message will be sent to keep the conversation active when the user is silent.
              </p>
            </div>

            {/* Nudge Interval and Max Nudges */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Clock className="h-4 w-4" />
                  Nudge Interval (seconds)
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={nudgeInterval}
                  onChange={(e) => setNudgeInterval(parseInt(e.target.value) || 15)}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 backdrop-blur-sm transition-all duration-300 ${!isEditing
                    ? isDarkMode
                      ? 'border-gray-700 bg-gray-800/30 text-gray-400 cursor-not-allowed'
                      : 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed'
                    : isDarkMode
                      ? 'border-gray-600 bg-gray-800/80 text-gray-200'
                      : 'border-gray-200 bg-white/80 text-gray-900'
                    }`}
                />
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Time to wait before sending a nudge message.
                </p>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <MessageSquare className="h-4 w-4" />
                  Max Nudges
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={maxNudges}
                  onChange={(e) => setMaxNudges(parseInt(e.target.value) || 3)}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 backdrop-blur-sm transition-all duration-300 ${!isEditing
                    ? isDarkMode
                      ? 'border-gray-700 bg-gray-800/30 text-gray-400 cursor-not-allowed'
                      : 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed'
                    : isDarkMode
                      ? 'border-gray-600 bg-gray-800/80 text-gray-200'
                      : 'border-gray-200 bg-white/80 text-gray-900'
                    }`}
                />
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Maximum number of nudges per call.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Audio and Duration Settings */}
        <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Audio & Duration</h4>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Configure audio settings and call duration limits.
              </p>
            </div>
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <Volume2 className={`h-5 w-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            </div>
          </div>

          <div className="space-y-6">
            {/* Typing Volume */}
            <div>
              <label className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <Volume2 className="h-4 w-4" />
                Typing Volume
              </label>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={typingVolume}
                    onChange={(e) => setTypingVolume(parseFloat(e.target.value))}
                    disabled={!isEditing}
                    className={`flex-1 h-2 rounded-lg appearance-none ${!isEditing
                      ? 'cursor-not-allowed opacity-50'
                      : 'cursor-pointer'
                      } ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}
                  />
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={typingVolume}
                    onChange={(e) => setTypingVolume(parseFloat(e.target.value) || 0.8)}
                    disabled={!isEditing}
                    className={`w-20 px-3 py-2 border rounded-lg text-center ${!isEditing
                      ? isDarkMode
                        ? 'border-gray-700 bg-gray-800/30 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed'
                      : isDarkMode
                        ? 'border-gray-600 bg-gray-800 text-gray-200'
                        : 'border-gray-200 bg-white text-gray-900'
                      }`}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0 (Muted)</span>
                  <span>1 (Full Volume)</span>
                </div>
              </div>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Volume level for typing sounds during the call.
              </p>
            </div>

            {/* Max Call Duration */}
            <div>
              <label className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <Clock className="h-4 w-4" />
                Max Call Duration
              </label>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="600"
                    step="30"
                    value={maxCallDuration}
                    onChange={(e) => setMaxCallDuration(parseInt(e.target.value))}
                    disabled={!isEditing}
                    className={`flex-1 h-2 rounded-lg appearance-none ${!isEditing
                      ? 'cursor-not-allowed opacity-50'
                      : 'cursor-pointer'
                      } ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}
                  />
                  <input
                    type="text"
                    value={formatDuration(maxCallDuration)}
                    onChange={(e) => setMaxCallDuration(parseDuration(e.target.value) || 300)}
                    disabled={!isEditing}
                    className={`w-24 px-3 py-2 border rounded-lg text-center ${!isEditing
                      ? isDarkMode
                        ? 'border-gray-700 bg-gray-800/30 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed'
                      : isDarkMode
                        ? 'border-gray-600 bg-gray-800 text-gray-200'
                        : 'border-gray-200 bg-white text-gray-900'
                      }`}
                    placeholder="5:00"
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0:00</span>
                  <span>10:00</span>
                </div>
              </div>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Maximum duration for each call before automatic termination (0 = no limit).
              </p>
            </div>
          </div>
        </div>

        {/* Create Agent Button */}
        <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Ready to Create Agent</h4>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                All configurations are set. Click the button below to create your agent.
              </p>
            </div>
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <Bot className={`h-5 w-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            {/* Save Configuration Button */}
            <button
              onClick={() => {
                // Save current configuration to localStorage
                const configToSave = {
                  initialMessage,
                  nudgeText,
                  nudgeInterval,
                  maxNudges,
                  typingVolume,
                  maxCallDuration,
                  voiceConfig,
                  transcriberConfig
                };
                localStorage.setItem('toolsConfigState', JSON.stringify(configToSave));
                setSuccessMessage('Configuration saved successfully!');
                setTimeout(() => setSuccessMessage(''), 3000);
              }}
              disabled={!isEditing}
              className={`px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
            >
              <Settings className="h-5 w-5" />
              <span className="font-semibold">Save Config</span>
            </button>

            {/* Create/Update Agent Button */}
            <button
              onClick={handleCreateAgent}
              disabled={isLoading || !isEditing || !(voiceConfig || localVoiceConfig) || !(transcriberConfig || localTranscriberConfig)}
              className={`group relative px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Zap className="h-5 w-5" />
              )}
              <span className="font-semibold">{isLoading ? 'Processing...' : (isEditing ? 'Update Agent' : 'Create Agent')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

ToolsConfig.displayName = 'ToolsConfig';

export default ToolsConfig;