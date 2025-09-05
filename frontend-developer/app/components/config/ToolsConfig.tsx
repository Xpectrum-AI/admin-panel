'use client';

import React, { forwardRef, useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Loader2, Volume2, Clock, MessageSquare, Zap, Bot, Settings } from 'lucide-react';
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
  // Use theme with fallback to prevent errors
  let isDarkMode = false;
  try {
    const theme = useTheme();
    isDarkMode = theme?.isDarkMode || false;
  } catch (error) {
    console.warn('ThemeProvider not found, using light mode as fallback');
    isDarkMode = false;
  }
  const [initialMessage, setInitialMessage] = useState('Hello! How can I help you today?');
  const [nudgeText, setNudgeText] = useState('Hello, Are you still there?');
  const [nudgeInterval, setNudgeInterval] = useState(15);
  const [maxNudges, setMaxNudges] = useState(3);
  const [typingVolume, setTypingVolume] = useState(0.8);
  const [maxCallDuration, setMaxCallDuration] = useState(300);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [configStatus, setConfigStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Configuration status states
  const [isAgentConfigured, setIsAgentConfigured] = useState(false);
  const [currentAgentConfig, setCurrentAgentConfig] = useState<any>(null);

  // Load current configuration from API on component mount
  useEffect(() => {
    if (isEditing) {
      loadCurrentConfiguration();
    }
  }, [isEditing, agentName]);

  // Load current configuration from API
  const loadCurrentConfiguration = async () => {
    setIsLoadingConfig(true);
    setErrorMessage('');

    try {
      const result = await agentConfigService.getCurrentAgentConfig(agentName);
      if (result.success && result.data) {
        setIsAgentConfigured(true);
        setCurrentAgentConfig(result.data);
        
        // Update form fields with current configuration
        if (result.data.initial_message) {
          setInitialMessage(result.data.initial_message);
        }
        if (result.data.nudge_text) {
          setNudgeText(result.data.nudge_text);
        }
        if (result.data.nudge_interval) {
          setNudgeInterval(result.data.nudge_interval);
        }
        if (result.data.max_nudges) {
          setMaxNudges(result.data.max_nudges);
        }
        if (result.data.typing_volume) {
          setTypingVolume(result.data.typing_volume);
        }
        if (result.data.max_call_duration) {
          setMaxCallDuration(result.data.max_call_duration);
        }
      } else {
        setIsAgentConfigured(false);
        setCurrentAgentConfig(null);
      }
    } catch (error) {
      console.error('Error loading current configuration:', error);
      setErrorMessage('Failed to load current configuration');
    } finally {
      setIsLoadingConfig(false);
    }
  };

  // Update initial message when modelConfig changes
  useEffect(() => {
    if (modelConfig?.firstMessage) {
      setInitialMessage(modelConfig.firstMessage);
    }
  }, [modelConfig]);

  // Populate form fields when editing an existing agent
  useEffect(() => {
    if (isEditing && existingConfig) {
      // Use existingConfig if available (from getAgentConfigData)
      setInitialMessage(existingConfig.initialMessage || 'Hello! How can I help you today?');
      setNudgeText(existingConfig.nudgeText || 'Hello, Are you still there?');
      setNudgeInterval(existingConfig.nudgeInterval || 15);
      setMaxNudges(existingConfig.maxNudges || 3);
      setTypingVolume(existingConfig.typingVolume || 0.8);
      setMaxCallDuration(existingConfig.maxCallDuration || 300);
    } else if (isEditing && existingAgent) {
      // Fallback to existingAgent if existingConfig is not available
      setInitialMessage(existingAgent.initial_message || 'Hello! How can I help you today?');
      setNudgeText(existingAgent.nudge_text || 'Hello, Are you still there?');
      setNudgeInterval(existingAgent.nudge_interval || 15);
      setMaxNudges(existingAgent.max_nudges || 3);
      setTypingVolume(existingAgent.typing_volume || 0.8);
      setMaxCallDuration(existingAgent.max_call_duration || 300);
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

  const handleCreateAgent = async () => {
    setIsLoading(true);
    setConfigStatus('idle');
    setErrorMessage('');

    try {
      console.log('=== Creating/Updating Agent ===');
      console.log('Initial voiceConfig:', voiceConfig);
      console.log('Initial transcriberConfig:', transcriberConfig);
      
      // Validate configurations
      if (!voiceConfig) {
        throw new Error('Voice configuration is required. Please configure in the Voice tab.');
      }
      
      if (!transcriberConfig) {
        throw new Error('Transcriber configuration is required. Please configure in the Transcriber tab.');
      }
      
      // Build TTS configuration
      let ttsConfig: any = {};
      if (voiceConfig) {
        // Check if voiceConfig is already in backend format
        if (voiceConfig.tts_config) {
          // Already in backend format, use as is
          ttsConfig = voiceConfig.tts_config;
          console.log('Using existing TTS config from backend:', ttsConfig);
        } else if (voiceConfig.provider) {
          // Already in backend format, use as is
          ttsConfig = voiceConfig;
          console.log('Using existing TTS config with provider:', ttsConfig);
        } else {
          // Convert from UI format to backend format
          console.log('Converting UI format to backend format for TTS');
          switch (voiceConfig.voiceProvider) {
            case 'OpenAI':
              ttsConfig = {
                provider: 'openai',
                openai: {
                  api_key: voiceConfig.apiKey,
                  voice: voiceConfig.voice.toLowerCase(),
                  response_format: 'mp3',
                  quality: 'standard',
                  speed: voiceConfig.speed
                }
              };
              break;
            case '11Labs':
              ttsConfig = {
                provider: 'elevenlabs',
                elevenlabs: {
                  api_key: voiceConfig.apiKey,
                  voice_id: voiceConfig.voiceId,
                  model_id: 'eleven_monolingual_v1',
                  stability: voiceConfig.stability,
                  similarity_boost: voiceConfig.similarityBoost,
                  speed: voiceConfig.speed
                }
              };
              break;
            case 'Cartesia':
              ttsConfig = {
                provider: 'cartesian',
                cartesian: {
                  voice_id: voiceConfig.voiceId,
                  tts_api_key: voiceConfig.apiKey,
                  model: voiceConfig.voice,
                  speed: voiceConfig.speed,
                  language: voiceConfig.language.toLowerCase()
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
      if (transcriberConfig) {
        // Check if transcriberConfig is already in backend format
        if (transcriberConfig.provider) {
          // Already in backend format, use as is
          sttConfig = transcriberConfig;
          console.log('Using existing STT config from backend:', sttConfig);
        } else {
          // Convert from UI format to backend format
          console.log('Converting UI format to backend format for STT');
          switch (transcriberConfig.transcriberProvider) {
            case 'Deepgram':
              sttConfig = {
                provider: 'deepgram',
                deepgram: {
                  api_key: transcriberConfig.apiKey,
                  model: transcriberConfig.model,
                  language: transcriberConfig.language,
                  punctuate: transcriberConfig.punctuate,
                  smart_format: transcriberConfig.smartFormat,
                  interim_results: transcriberConfig.interimResults
                }
              };
              break;
            case 'Whisper':
              sttConfig = {
                provider: 'whisper',
                whisper: {
                  api_key: transcriberConfig.apiKey,
                  model: transcriberConfig.model,
                  language: transcriberConfig.language === 'multi' ? null : transcriberConfig.language
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
        setIsAgentConfigured(true);
        setCurrentAgentConfig(completeConfig);
        
        setTimeout(() => {
          setConfigStatus('idle');
          setSuccessMessage('');
        }, 3000);
        
        // Call the callback but don't wait for it to complete
        if (onAgentCreated) {
          try {
            // Add a small delay to ensure the backend has processed the creation
            setTimeout(async () => {
              console.log('🔄 Refreshing agents list after creation...');
              await onAgentCreated();
            }, 1000);
          } catch (error) {
            // Ignore errors from refresh since backend doesn't support listing agents
            console.log('Agent created successfully. Refresh may not work due to backend limitations.');
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

        {/* Configuration Status */}
        <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Configuration Status</h4>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Check the status of your voice and transcriber configurations
              </p>
            </div>
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <Bot className={`h-5 w-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Voice Configuration Status */}
            <div className={`p-3 rounded-lg border ${voiceConfig ? (isDarkMode ? 'bg-green-900/20 border-green-700 text-green-300' : 'bg-green-50 border-green-200 text-green-700') : (isDarkMode ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700')}`}>
              <div className="flex items-center gap-2">
                {voiceConfig ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {voiceConfig ? 'Voice Config Ready' : 'Voice Config Missing'}
                </span>
              </div>
              {voiceConfig && (
                <p className="text-xs mt-1 opacity-80">
                  Provider: {voiceConfig.provider || 'Unknown'}
                </p>
              )}
            </div>

            {/* Transcriber Configuration Status */}
            <div className={`p-3 rounded-lg border ${transcriberConfig ? (isDarkMode ? 'bg-green-900/20 border-green-700 text-green-300' : 'bg-green-50 border-green-200 text-green-700') : (isDarkMode ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700')}`}>
              <div className="flex items-center gap-2">
                {transcriberConfig ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {transcriberConfig ? 'Transcriber Config Ready' : 'Transcriber Config Missing'}
                </span>
              </div>
              {transcriberConfig && (
                <p className="text-xs mt-1 opacity-80">
                  Provider: {transcriberConfig.provider || 'Unknown'}
                </p>
              )}
            </div>

            {/* Agent Configuration Status */}
            <div className={`p-3 rounded-lg border ${isAgentConfigured ? (isDarkMode ? 'bg-green-900/20 border-green-700 text-green-300' : 'bg-green-50 border-green-200 text-green-700') : (isDarkMode ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700')}`}>
              <div className="flex items-center gap-2">
                {isAgentConfigured ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {isAgentConfigured ? 'Agent Configured' : 'Agent Not Configured'}
                </span>
              </div>
              {isAgentConfigured && (
                <p className="text-xs mt-1 opacity-80">
                  Status: Active
                </p>
              )}
            </div>
          </div>
          
          {(!voiceConfig || !transcriberConfig) && (
            <div className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-yellow-900/20 border border-yellow-700 text-yellow-300' : 'bg-yellow-50 border border-yellow-200 text-yellow-700'}`}>
              <p className="text-sm">
                <strong>Note:</strong> Please configure both Voice and Transcriber settings before creating the agent.
                {!voiceConfig && ' Visit the Voice tab to configure TTS settings.'}
                {!transcriberConfig && ' Visit the Transcriber tab to configure STT settings.'}
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
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 backdrop-blur-sm transition-all duration-300 resize-none ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white/80 text-gray-900 placeholder-gray-400'}`}
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
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 backdrop-blur-sm transition-all duration-300 resize-none ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white/80 text-gray-900 placeholder-gray-400'}`}
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
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-900'}`}
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
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-900'}`}
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
                    className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}
                  />
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={typingVolume}
                    onChange={(e) => setTypingVolume(parseFloat(e.target.value) || 0.8)}
                    className={`w-20 px-3 py-2 border rounded-lg text-center ${isDarkMode ? 'border-gray-600 bg-gray-800 text-gray-200' : 'border-gray-200 bg-white text-gray-900'}`}
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
                    className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}
                  />
                  <input
                    type="text"
                    value={formatDuration(maxCallDuration)}
                    onChange={(e) => setMaxCallDuration(parseDuration(e.target.value) || 300)}
                    className={`w-24 px-3 py-2 border rounded-lg text-center ${isDarkMode ? 'border-gray-600 bg-gray-800 text-gray-200' : 'border-gray-200 bg-white text-gray-900'}`}
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
            
            {/* Create/Update Agent Button */}
            <button
              onClick={handleCreateAgent}
              disabled={isLoading || !voiceConfig || !transcriberConfig}
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
