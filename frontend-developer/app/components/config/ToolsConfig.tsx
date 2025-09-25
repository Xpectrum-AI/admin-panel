'use client';

import React, { forwardRef, useState, useEffect } from 'react';
import { Wrench, CheckCircle, AlertCircle, Clock, Volume2, MessageSquare, Timer, Settings, RefreshCw, Zap } from 'lucide-react';
import { difyAgentService } from '../../../service/difyAgentService';
import { useTheme } from '../../contexts/ThemeContext';

interface ToolsConfigProps {
  agentName?: string;
  modelConfig?: any;
  voiceConfig?: any;
  transcriberConfig?: any;
  isEditing?: boolean;
  isCreating?: boolean;
  existingAgent?: any;
  onConfigChange?: (config: any) => void;
  existingConfig?: any;
  currentOrganizationId?: string;
  selectedAgent?: any;
}

const ToolsConfig = forwardRef<HTMLDivElement, ToolsConfigProps>(({
  agentName = 'default',
  modelConfig,
  voiceConfig,
  transcriberConfig,
  isEditing = false,
  isCreating = false,
  existingAgent,
  existingConfig,
  currentOrganizationId,
  selectedAgent
}, ref) => {
  const { isDarkMode } = useTheme();

  // Debug logging for props
  console.log('🔍 ToolsConfig received props:', {
    modelConfig,
    voiceConfig,
    transcriberConfig,
    isEditing,
    selectedAgent: selectedAgent?.name,
    existingConfig
  });

  // Debug modelConfig specifically
  if (modelConfig) {
    console.log('🔍 ToolsConfig modelConfig details:', {
      provider: modelConfig.provider,
      model: modelConfig.model,
      selectedModelProvider: modelConfig.selectedModelProvider,
      selectedModel: modelConfig.selectedModel,
      api_key: modelConfig.api_key,
      modelApiKey: modelConfig.modelApiKey
    });
  }

  // Debug selectedAgent tools data specifically
  if (selectedAgent) {
    console.log('🔍 SelectedAgent tools data:', {
      initial_message: selectedAgent.initial_message,
      nudge_text: selectedAgent.nudge_text,
      nudge_interval: selectedAgent.nudge_interval,
      max_nudges: selectedAgent.max_nudges,
      typing_volume: selectedAgent.typing_volume,
      max_call_duration: selectedAgent.max_call_duration
    });
  }

  // Track when component mounts and props change
  useEffect(() => {
    console.log('🔄 ToolsConfig component mounted or props changed');
    console.log('🔄 Current modelConfig:', modelConfig);
  }, [modelConfig, voiceConfig, transcriberConfig, isEditing]);

  // Tools configuration state
  const [initialMessage, setInitialMessage] = useState('Hello! How can I help you today?');
  const [nudgeText, setNudgeText] = useState('Hello, Are you still there?');
  const [nudgeInterval, setNudgeInterval] = useState(15);
  const [maxNudges, setMaxNudges] = useState(3);
  const [typingVolume, setTypingVolume] = useState(0.8);
  const [maxCallDuration, setMaxCallDuration] = useState(300);

  // Debug current state values
  useEffect(() => {
    console.log('🔍 Current ToolsConfig state values:', {
      initialMessage,
      nudgeText,
      nudgeInterval,
      maxNudges,
      typingVolume,
      maxCallDuration
    });
  }, [initialMessage, nudgeText, nudgeInterval, maxNudges, typingVolume, maxCallDuration]);

  // Loading and error states
  const [configStatus, setConfigStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isTestingDify, setIsTestingDify] = useState(false);

  // Configuration status from localStorage
  const [localVoiceConfig, setLocalVoiceConfig] = useState<any>(null);
  const [localModelConfig, setLocalModelConfig] = useState<any>(null);
  const [localTranscriberConfig, setLocalTranscriberConfig] = useState<any>(null);

  // Update form fields when modelConfig changes (only if no agent data available)
  useEffect(() => {
    console.log('🔄 ToolsConfig - modelConfig changed:', modelConfig);
    console.log('🔄 ToolsConfig - modelConfig type:', typeof modelConfig);
    console.log('🔄 ToolsConfig - modelConfig keys:', modelConfig ? Object.keys(modelConfig) : 'null');

    if (modelConfig) {
      // Only update initial message from modelConfig if we don't have agent data
      // Agent data (selectedAgent/existingConfig) should take priority
      if (!selectedAgent && !existingConfig) {
        if (modelConfig.firstMessage) {
          console.log('✅ Using firstMessage from modelConfig:', modelConfig.firstMessage);
          setInitialMessage(modelConfig.firstMessage);
        } else if (modelConfig.systemPrompt) {
          // If no firstMessage, use systemPrompt as initial message
          console.log('✅ Using systemPrompt as initial message:', modelConfig.systemPrompt);
          setInitialMessage(modelConfig.systemPrompt);
        }
      } else {
        console.log('ℹ️ Agent data available, skipping modelConfig initial message update');
      }

      // Note: Other form fields (nudgeText, nudgeInterval, etc.) are not provided by ModelConfig
      // They should come from existingConfig or selectedAgent
      console.log('ℹ️ ModelConfig only provides model-related fields, tools fields come from existingConfig');
    } else {
      console.log('⚠️ No modelConfig provided');
    }
  }, [modelConfig, selectedAgent, existingConfig]);

  // Populate form fields when editing an existing agent
  useEffect(() => {
    console.log('🔄 ToolsConfig - existingConfig changed:', existingConfig);
    console.log('🔄 ToolsConfig - isEditing:', isEditing);
    console.log('🔄 ToolsConfig - modelConfig present:', !!modelConfig);
    console.log('🔄 ToolsConfig - selectedAgent:', selectedAgent);

    // Always populate form fields when we have data, regardless of editing state
    if (selectedAgent) {
      console.log('🔄 ToolsConfig: Loading form with selectedAgent data:', selectedAgent);

      // Always update initial message from selectedAgent (it has priority over modelConfig)
      setInitialMessage(selectedAgent.initial_message || 'Hello! How can I help you today?');

      // Update other tools configuration fields from selectedAgent
      console.log('🔧 Setting form fields from selectedAgent:', {
        nudge_text: selectedAgent.nudge_text,
        nudge_interval: selectedAgent.nudge_interval,
        max_nudges: selectedAgent.max_nudges,
        typing_volume: selectedAgent.typing_volume,
        max_call_duration: selectedAgent.max_call_duration
      });

      setNudgeText(selectedAgent.nudge_text || 'Hello, Are you still there?');
      setNudgeInterval(selectedAgent.nudge_interval || 15);
      setMaxNudges(selectedAgent.max_nudges || 3);
      setTypingVolume(selectedAgent.typing_volume || 0.8);
      setMaxCallDuration(selectedAgent.max_call_duration || 300);

      console.log('✅ ToolsConfig form fields updated from selectedAgent:', {
        initialMessage: selectedAgent.initial_message || 'Hello! How can I help you today?',
        nudgeText: selectedAgent.nudge_text || 'Hello, Are you still there?',
        nudgeInterval: selectedAgent.nudge_interval || 15,
        maxNudges: selectedAgent.max_nudges || 3,
        typingVolume: selectedAgent.typing_volume || 0.8,
        maxCallDuration: selectedAgent.max_call_duration || 300
      });
    } else if (existingConfig) {
      // Fallback to existingConfig if selectedAgent is not available
      console.log('🔄 ToolsConfig: Loading form with existing config:', existingConfig);

      // Always update initial message from existingConfig (it has priority over modelConfig)
      setInitialMessage(existingConfig.initialMessage || 'Hello! How can I help you today?');

      setNudgeText(existingConfig.nudgeText || 'Hello, Are you still there?');
      setNudgeInterval(existingConfig.nudgeInterval || 15);
      setMaxNudges(existingConfig.maxNudges || 3);
      setTypingVolume(existingConfig.typingVolume || 0.8);
      setMaxCallDuration(existingConfig.maxCallDuration || 300);

      console.log('✅ ToolsConfig form fields updated from existingConfig:', {
        initialMessage: existingConfig.initialMessage || 'Hello! How can I help you today?',
        nudgeText: existingConfig.nudgeText || 'Hello, Are you still there?',
        nudgeInterval: existingConfig.nudgeInterval || 15,
        maxNudges: existingConfig.maxNudges || 3,
        typingVolume: existingConfig.typingVolume || 0.8,
        maxCallDuration: existingConfig.maxCallDuration || 300
      });
    }
  }, [selectedAgent, existingConfig, modelConfig]);

  // Notify parent component of configuration changes
  React.useEffect(() => {
    const config = {
      initialMessage,
      nudgeText,
      nudgeInterval,
      maxNudges,
      typingVolume,
      maxCallDuration
    };

    // Save to localStorage
    try {
      localStorage.setItem('toolsConfigState', JSON.stringify(config));
      console.log('✅ Tools config saved to localStorage:', config);
    } catch (error) {
      console.warn('Failed to save tools config to localStorage:', error);
    }
  }, [initialMessage, nudgeText, nudgeInterval, maxNudges, typingVolume, maxCallDuration]);

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
  // Only load from localStorage if we don't have selectedAgent data
  useEffect(() => {
    // Skip localStorage loading if we have selectedAgent data (it takes priority)
    if (selectedAgent) {
      console.log('🔄 Skipping localStorage load - selectedAgent data takes priority');
      return;
    }

    try {
      // Load tools config
      const savedToolsConfig = localStorage.getItem('toolsConfigState');
      if (savedToolsConfig) {
        const parsedConfig = JSON.parse(savedToolsConfig);
        console.log('Loading saved tools config from localStorage:', parsedConfig);

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
  }, [selectedAgent]); // Re-run when selectedAgent changes

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


  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Test Dify integration manually
  const testDifyIntegration = async () => {
    setIsTestingDify(true);
    setSuccessMessage('Testing Dify integration...');
    setErrorMessage('');

    try {
      console.log('🧪 Testing Dify integration for agent:', agentName);

      // Use model configuration from ModelConfig if available, otherwise use defaults
      const testModelProvider = modelConfig?.provider || 'langgenius/openai/openai';
      const testModelName = modelConfig?.model || 'gpt-4o';

      const difyResult = await difyAgentService.createDifyAgent({
        agentName: `${agentName}_test_${Date.now()}`,
        organizationId: selectedAgent?.organization_id || currentOrganizationId,
        modelProvider: testModelProvider,
        modelName: testModelName
      });

      console.log('📋 Dify test result:', difyResult);

      if (difyResult.success && difyResult.data?.appKey) {
        setSuccessMessage(`✅ Dify integration test successful! Generated API key: ${difyResult.data.appKey.substring(0, 10)}...`);
        setConfigStatus('success');
      } else {
        setErrorMessage(`❌ Dify integration test failed: ${difyResult.error || difyResult.details || 'Unknown error'}`);
        setConfigStatus('error');
      }
    } catch (error) {
      console.error('❌ Dify test error:', error);
      setErrorMessage(`❌ Dify integration test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setConfigStatus('error');
    } finally {
      setIsTestingDify(false);
      setTimeout(() => {
        setConfigStatus('idle');
        setSuccessMessage('');
        setErrorMessage('');
      }, 5000);
    }
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


        {/* Initial Message Configuration */}
        <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Initial Message</h4>
            </div>
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <MessageSquare className={`h-5 w-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            </div>
          </div>

          <div>
            <label className={`text-sm font-semibold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
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
          </div>
        </div>

        {/* Call Behavior Configuration */}
        <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Call Behavior</h4>
            </div>
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <Zap className={`h-5 w-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            </div>
          </div>

          <div className="space-y-6">
            {/* Nudge Text */}
            <div>
              <label className={`text-sm font-semibold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
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
            </div>

            {/* Nudge Interval and Max Nudges */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className={`text-sm font-semibold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
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
              </div>

              <div>
                <label className={`text-sm font-semibold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
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
              </div>
            </div>
          </div>
        </div>

        {/* Audio and Duration Settings */}
        <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Audio & Duration</h4>
            </div>
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <Volume2 className={`h-5 w-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            </div>
          </div>

          <div className="space-y-6">
            {/* Typing Volume */}
            <div>
              <label className={`text-sm font-semibold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
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
            </div>

            {/* Max Call Duration */}
            <div>
              <label className={`text-sm font-semibold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
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
            </div>
          </div>
        </div>

        {/* Save Configuration Button */}
        <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Save Configuration</h4>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Save your changes to localStorage. Use the "Update Agent" button in the header to apply changes to the server.
              </p>
            </div>
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <Settings className={`h-5 w-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            </div>
          </div>

          <div className="flex justify-end">
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
          </div>
        </div>
      </div>
    </div>
  );
});

ToolsConfig.displayName = 'ToolsConfig';

export default ToolsConfig;