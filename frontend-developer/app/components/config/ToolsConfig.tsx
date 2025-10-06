'use client';

import React, { forwardRef, useState, useEffect, useCallback, useRef } from 'react';
import { Wrench, CheckCircle, AlertCircle, Clock, Volume2, MessageSquare, Timer, Settings, RefreshCw, Zap } from 'lucide-react';
import { difyAgentService } from '../../../service/difyAgentService';
import { useTheme } from '../../contexts/ThemeContext';
import { useToolsConfig } from '../../hooks/useAgentConfigSection';

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
  toolsConfiguration?: any;
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
  selectedAgent,
  toolsConfiguration,  // Add this
  onConfigChange  // Add this
}, ref) => {
  const { isDarkMode } = useTheme();
  const { config: toolsConfig, updateConfig } = useToolsConfig();

  // Debug logging for props
  console.log('🔍 ToolsConfig received props:', {
    modelConfig,
    voiceConfig,
    transcriberConfig,
    isEditing,
    selectedAgent: selectedAgent?.name,
    existingConfig
  });

  // Debug isEditing specifically
  console.log('🔍 isEditing value:', isEditing, typeof isEditing);

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
  const [initialMessage, setInitialMessage] = useState('Hello! this is Emma, How can I help you today?');
  const [nudgeText, setNudgeText] = useState('Hello, Are you still there?');
  const [nudgeInterval, setNudgeInterval] = useState(15);
  const [maxNudges, setMaxNudges] = useState(3);
  const [typingVolume, setTypingVolume] = useState(0.8);
  const [maxCallDuration, setMaxCallDuration] = useState(1200);

  // Buffer states for text inputs to prevent flickering
  const [isEditingInitialMessage, setIsEditingInitialMessage] = useState(false);
  const [isEditingNudgeText, setIsEditingNudgeText] = useState(false);
  const [initialMessageBuffer, setInitialMessageBuffer] = useState('');
  const [nudgeTextBuffer, setNudgeTextBuffer] = useState('');

  // Buffer states for number inputs to prevent flickering
  const [isEditingNudgeInterval, setIsEditingNudgeInterval] = useState(false);
  const [isEditingMaxNudges, setIsEditingMaxNudges] = useState(false);
  const [nudgeIntervalBuffer, setNudgeIntervalBuffer] = useState(15);
  const [maxNudgesBuffer, setMaxNudgesBuffer] = useState(3);

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

  // SINGLE CONSOLIDATED EFFECT: Load configuration from the highest priority source
  useEffect(() => {
    // Check if any field is being actively edited - if so, don't update anything
    const isAnyFieldBeingEdited = isEditingInitialMessage || isEditingNudgeText ||
      isEditingNudgeInterval || isEditingMaxNudges;

    if (isAnyFieldBeingEdited) {
      console.log('🔄 Fields being edited, skipping configuration load');
      return;
    }

    console.log('🔄 ToolsConfig - Loading configuration from priority sources:', {
      toolsConfiguration: !!toolsConfiguration,
      selectedAgent: !!selectedAgent,
      existingConfig: !!existingConfig,
      modelConfig: !!modelConfig
    });

    // Priority order: toolsConfiguration > selectedAgent > existingConfig > modelConfig
    let configToLoad = null;
    let source = '';

    if (toolsConfiguration) {
      configToLoad = toolsConfiguration;
      source = 'centralized';
    } else if (selectedAgent) {
      configToLoad = {
        initialMessage: selectedAgent.initial_message,
        nudgeText: selectedAgent.nudge_text,
        nudgeInterval: selectedAgent.nudge_interval,
        maxNudges: selectedAgent.max_nudges,
        typingVolume: selectedAgent.typing_volume,
        maxCallDuration: selectedAgent.max_call_duration
      };
      source = 'selectedAgent';
    } else if (existingConfig) {
      configToLoad = existingConfig;
      source = 'existingConfig';
    } else if (modelConfig) {
      // Only use modelConfig for initialMessage, other fields use defaults
      configToLoad = {
        initialMessage: modelConfig.firstMessage || modelConfig.systemPrompt || 'Hello! this is Emma, How can I help you today?',
        nudgeText: 'Hello, Are you still there?',
        nudgeInterval: 15,
        maxNudges: 3,
        typingVolume: 0.8,
        maxCallDuration: 1200
      };
      source = 'modelConfig';
    }

    if (configToLoad) {
      console.log(`🔄 Loading configuration from ${source}:`, configToLoad);
      console.log(`🔍 Typing volume from ${source}:`, configToLoad.typingVolume);

      // Update all fields at once to prevent flickering
      setInitialMessage(configToLoad.initialMessage || 'Hello! this is Emma, How can I help you today?');
      setNudgeText(configToLoad.nudgeText || 'Hello, Are you still there?');
      setNudgeInterval(configToLoad.nudgeInterval ?? 15);
      setMaxNudges(configToLoad.maxNudges ?? 3);

      // Ensure typing volume is within the new valid range (0.1-10)
      const validTypingVolume = configToLoad.typingVolume && configToLoad.typingVolume >= 0.1 ? configToLoad.typingVolume : 0.8;
      console.log(`🔍 Setting typing volume to:`, validTypingVolume);
      setTypingVolume(validTypingVolume);
      setMaxCallDuration(configToLoad.maxCallDuration ?? 1200);
    }
  }, [toolsConfiguration, selectedAgent, existingConfig, modelConfig, isEditingInitialMessage, isEditingNudgeText, isEditingNudgeInterval, isEditingMaxNudges]);

  // Debounced save function to prevent excessive calls
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Save state to centralized state whenever it changes
  const saveStateToCentralized = useCallback((updates: any = {}) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce the save operation
    saveTimeoutRef.current = setTimeout(() => {
      try {
        const currentState = {
          initialMessage,
          nudgeText,
          nudgeInterval,
          maxNudges,
          typingVolume,
          maxCallDuration,
          ...updates
        };

        console.log('📤 ToolsConfig: Saving state to centralized config:', currentState);

        // Call parent's onConfigChange
        if (onConfigChange) {
          onConfigChange(currentState);
        }
      } catch (error) {
        console.warn('Failed to save tools config state to centralized state:', error);
      }
    }, 100); // 100ms debounce
  }, [initialMessage, nudgeText, nudgeInterval, maxNudges, typingVolume, maxCallDuration, onConfigChange]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Buffer-based change handlers for text inputs
  const handleInitialMessageChange = useCallback((value: string) => {
    setInitialMessageBuffer(value); // Update buffer instead of main state
  }, []);

  const handleNudgeTextChange = useCallback((value: string) => {
    setNudgeTextBuffer(value); // Update buffer instead of main state
  }, []);

  const handleInitialMessageFocus = useCallback(() => {
    setIsEditingInitialMessage(true);
    setInitialMessageBuffer(initialMessage); // Initialize buffer with current value
    console.log('🎯 Started editing initial message');
  }, [initialMessage]);

  const handleNudgeTextFocus = useCallback(() => {
    setIsEditingNudgeText(true);
    setNudgeTextBuffer(nudgeText); // Initialize buffer with current value
    console.log('🎯 Started editing nudge text');
  }, [nudgeText]);

  const handleInitialMessageBlur = useCallback(() => {
    console.log('📤 Finished editing initial message, auto-saving');
    setInitialMessage(initialMessageBuffer); // Update main state
    saveStateToCentralized({ initialMessage: initialMessageBuffer });
    setIsEditingInitialMessage(false);
  }, [initialMessageBuffer, saveStateToCentralized]);

  const handleNudgeTextBlur = useCallback(() => {
    console.log('📤 Finished editing nudge text, auto-saving');
    setNudgeText(nudgeTextBuffer); // Update main state
    saveStateToCentralized({ nudgeText: nudgeTextBuffer });
    setIsEditingNudgeText(false);
  }, [nudgeTextBuffer, saveStateToCentralized]);

  // Buffer-based change handlers for number inputs
  const handleNudgeIntervalChange = useCallback((value: string) => {
    setNudgeIntervalBuffer(parseInt(value) || 15); // Update buffer instead of main state
  }, []);

  const handleMaxNudgesChange = useCallback((value: string) => {
    setMaxNudgesBuffer(parseInt(value) || 3); // Update buffer instead of main state
  }, []);

  const handleNudgeIntervalFocus = useCallback(() => {
    setIsEditingNudgeInterval(true);
    setNudgeIntervalBuffer(nudgeInterval); // Initialize buffer with current value
    console.log('🎯 Started editing nudge interval');
  }, [nudgeInterval]);

  const handleMaxNudgesFocus = useCallback(() => {
    setIsEditingMaxNudges(true);
    setMaxNudgesBuffer(maxNudges); // Initialize buffer with current value
    console.log('🎯 Started editing max nudges');
  }, [maxNudges]);

  const handleNudgeIntervalBlur = useCallback(() => {
    console.log('📤 Finished editing nudge interval, auto-saving');
    setNudgeInterval(nudgeIntervalBuffer); // Update main state
    saveStateToCentralized({ nudgeInterval: nudgeIntervalBuffer });
    setIsEditingNudgeInterval(false);
  }, [nudgeIntervalBuffer, saveStateToCentralized]);

  const handleMaxNudgesBlur = useCallback(() => {
    console.log('📤 Finished editing max nudges, auto-saving');
    setMaxNudges(maxNudgesBuffer); // Update main state
    saveStateToCentralized({ maxNudges: maxNudgesBuffer });
    setIsEditingMaxNudges(false);
  }, [maxNudgesBuffer, saveStateToCentralized]);

  const handleTypingVolumeChange = useCallback((value: number) => {
    setTypingVolume(value);
    saveStateToCentralized({ typingVolume: value });
  }, [saveStateToCentralized]);

  const handleMaxCallDurationChange = useCallback((value: number) => {
    setMaxCallDuration(value);
    saveStateToCentralized({ maxCallDuration: value });
  }, [saveStateToCentralized]);

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
      // Note: Removed localStorage usage - now uses centralized state only
      console.log('📂 ToolsConfig: Using centralized state only');

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
              value={isEditingInitialMessage ? initialMessageBuffer : initialMessage}
              onChange={(e) => handleInitialMessageChange(e.target.value)}
              onFocus={handleInitialMessageFocus}
              onBlur={handleInitialMessageBlur}
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
                value={isEditingNudgeText ? nudgeTextBuffer : nudgeText}
                onChange={(e) => handleNudgeTextChange(e.target.value)}
                onFocus={handleNudgeTextFocus}
                onBlur={handleNudgeTextBlur}
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
                  value={isEditingNudgeInterval ? nudgeIntervalBuffer : nudgeInterval}
                  onChange={(e) => handleNudgeIntervalChange(e.target.value)}
                  onFocus={handleNudgeIntervalFocus}
                  onBlur={handleNudgeIntervalBlur}
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
                  value={isEditingMaxNudges ? maxNudgesBuffer : maxNudges}
                  onChange={(e) => handleMaxNudgesChange(e.target.value)}
                  onFocus={handleMaxNudgesFocus}
                  onBlur={handleMaxNudgesBlur}
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
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={typingVolume}
                    onChange={(e) => handleTypingVolumeChange(parseFloat(e.target.value))}
                    disabled={!isEditing}
                    className={`flex-1 h-2 rounded-lg appearance-none ${!isEditing
                      ? 'cursor-not-allowed opacity-50'
                      : 'cursor-pointer'
                      } ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}
                  />
                  <input
                    type="number"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={typingVolume}
                    onChange={(e) => handleTypingVolumeChange(parseFloat(e.target.value) || 0.8)}
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
                  <span>0.1 (Min)</span>
                  <span>10 (Max)</span>
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
                    min="60"
                    max="1200"
                    step="30"
                    value={maxCallDuration}
                    onChange={(e) => handleMaxCallDurationChange(parseInt(e.target.value))}
                    disabled={!isEditing}
                    className={`flex-1 h-2 rounded-lg appearance-none ${!isEditing
                      ? 'cursor-not-allowed opacity-50'
                      : 'cursor-pointer'
                      } ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}
                  />
                  <input
                    type="text"
                    value={formatDuration(maxCallDuration)}
                    onChange={(e) => handleMaxCallDurationChange(parseDuration(e.target.value) || 300)}
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
                  <span>1:00</span>
                  <span>20:00</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
});

ToolsConfig.displayName = 'ToolsConfig';

export default ToolsConfig;