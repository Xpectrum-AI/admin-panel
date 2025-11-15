'use client';

import React, { forwardRef, useState, useEffect, useCallback, useRef } from 'react';
import { Wrench, CheckCircle, AlertCircle, Clock, Volume2, MessageSquare, Zap } from 'lucide-react';
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
  isEditing = false,
  existingConfig,
  currentOrganizationId,
  selectedAgent,
  toolsConfiguration,
  onConfigChange
}, ref) => {
  const { isDarkMode } = useTheme();
  const { config: toolsConfigFromHook, updateConfig } = useToolsConfig();

  // Helper to determine the initial configuration source
  const getInitialConfig = useCallback(() => {
    let configToLoad = null;

    if (toolsConfiguration) {
      configToLoad = toolsConfiguration;
    } else if (selectedAgent) {
      configToLoad = {
        initialMessage: selectedAgent.initial_message,
        nudgeText: selectedAgent.nudge_text,
        nudgeInterval: selectedAgent.nudge_interval,
        maxNudges: selectedAgent.max_nudges,
        typingVolume: selectedAgent.typing_volume,
        maxCallDuration: selectedAgent.max_call_duration
      };
    } else if (existingConfig) {
      configToLoad = existingConfig;
    } else if (modelConfig) {
      configToLoad = {
        initialMessage: modelConfig.firstMessage || modelConfig.systemPrompt || '',
        nudgeText: '',
        nudgeInterval: '',
        maxNudges: '',
        typingVolume: 0.5,
        maxCallDuration: 1200,
      };
    }

    return {
      initialMessage: configToLoad?.initialMessage ?? '',
      nudgeText: configToLoad?.nudgeText ?? '',
      nudgeInterval: configToLoad?.nudgeInterval ?? '',
      maxNudges: configToLoad?.maxNudges ?? '',
      typingVolume: (configToLoad?.typingVolume !== undefined && configToLoad.typingVolume >= 0 && configToLoad.typingVolume <= 1) ? configToLoad.typingVolume : 0.5,
      maxCallDuration: configToLoad?.maxCallDuration ?? 1200,
    };
  }, [toolsConfiguration, selectedAgent, existingConfig, modelConfig]);

  const initialValues = getInitialConfig();

  // State variables (unified - no more separate buffers)
  const [initialMessage, setInitialMessage] = useState(initialValues.initialMessage);
  const [nudgeText, setNudgeText] = useState(initialValues.nudgeText);
  const [nudgeInterval, setNudgeInterval] = useState<string | number>(initialValues.nudgeInterval);
  const [maxNudges, setMaxNudges] = useState<string | number>(initialValues.maxNudges);
  const [typingVolume, setTypingVolume] = useState(initialValues.typingVolume);
  const [maxCallDuration, setMaxCallDuration] = useState(initialValues.maxCallDuration);

  // Status states
  const [configStatus, setConfigStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isTestingDify, setIsTestingDify] = useState(false);

  // Ref to track if synchronization has occurred to prevent continuous resets
  const isSynchronizedRef = useRef(false);

  // Prop Synchronization Effect (The Fix for Flickering)
  useEffect(() => {
    const latestConfig = getInitialConfig();

    // Only sync on initial load or when external props actually change
    // Don't sync if user has manually cleared fields (empty strings)
    if (!isSynchronizedRef.current) {
      setInitialMessage(latestConfig.initialMessage);
      setNudgeText(latestConfig.nudgeText);
      setNudgeInterval(latestConfig.nudgeInterval);
      setMaxNudges(latestConfig.maxNudges);
      setTypingVolume(latestConfig.typingVolume);
      setMaxCallDuration(latestConfig.maxCallDuration);
      isSynchronizedRef.current = true;
    } else {
      // Only sync if the external source has actually changed (e.g., different agent selected)
      // and the current values are not user-modified empty values
      const hasUserModifiedEmptyValues = (
        (initialMessage === '' && latestConfig.initialMessage !== '') ||
        (nudgeText === '' && latestConfig.nudgeText !== '') ||
        (nudgeInterval === '' && latestConfig.nudgeInterval !== '') ||
        (maxNudges === '' && latestConfig.maxNudges !== '')
      );

      if (!hasUserModifiedEmptyValues) {
        const currentKey = JSON.stringify({
          im: initialMessage, nt: nudgeText, ni: nudgeInterval, mn: maxNudges, tv: typingVolume, mcd: maxCallDuration
        });
        const latestKey = JSON.stringify({
          im: latestConfig.initialMessage, nt: latestConfig.nudgeText, ni: latestConfig.nudgeInterval, mn: latestConfig.maxNudges, tv: latestConfig.typingVolume, mcd: latestConfig.maxCallDuration
        });

        if (currentKey !== latestKey) {
          setInitialMessage(latestConfig.initialMessage);
          setNudgeText(latestConfig.nudgeText);
          setNudgeInterval(latestConfig.nudgeInterval);
          setMaxNudges(latestConfig.maxNudges);
          setTypingVolume(latestConfig.typingVolume);
          setMaxCallDuration(latestConfig.maxCallDuration);
        }
      }
    }
  }, [toolsConfiguration, selectedAgent, existingConfig, modelConfig, getInitialConfig]);

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
        // Get current state values at the time of save
        const currentState = {
          initialMessage,
          nudgeText,
          nudgeInterval,
          maxNudges,
          typingVolume,
          maxCallDuration,
          ...updates
        };
        // Call parent's onConfigChange
        if (onConfigChange) {
          onConfigChange(currentState);
        }
      } catch (error) {
      }
    }, 2000); // 2 seconds debounce - enough time to write a full sentence
  }, [onConfigChange]); // Only depend on onConfigChange, not the state values

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Unified Change Handlers (No more buffers)

  const handleMessageChange = useCallback((setter: React.Dispatch<React.SetStateAction<any>>, updates: any) => (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const value = e.target.value;
    setter(value); // Update the state immediately for responsive UI
    // Debounce the save to prevent excessive calls during typing
    saveStateToCentralized(updates(value));
  }, [saveStateToCentralized]);

  const handleNumberChange = useCallback((setter: React.Dispatch<React.SetStateAction<string | number>>, updates: any) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;

    if (rawValue === '') {
      // Allow empty string - keep it empty
      setter('');
      saveStateToCentralized(updates(null)); // Save null for empty values
    } else {
      const numberValue = parseInt(rawValue);
      if (!isNaN(numberValue)) {
        setter(numberValue);
        saveStateToCentralized(updates(numberValue));
      } else {
        // Invalid input, keep the raw value for user to correct
        setter(rawValue);
      }
    }
  }, [saveStateToCentralized]);

  const handleRangeChange = useCallback((setter: React.Dispatch<React.SetStateAction<number>>, updates: any) => (value: number) => {
    setter(value);
    saveStateToCentralized(updates(value));
  }, [saveStateToCentralized]);

  const handleInitialMessageChange = useCallback(handleMessageChange(setInitialMessage, (value: string) => ({ initialMessage: value })), [handleMessageChange]);
  const handleNudgeTextChange = useCallback(handleMessageChange(setNudgeText, (value: string) => ({ nudgeText: value })), [handleMessageChange]);

  // Number input handlers that allow empty values
  const handleNudgeIntervalChange = useCallback(handleNumberChange(setNudgeInterval, (value: number | null) => ({ nudgeInterval: value })), [handleNumberChange]);
  const handleMaxNudgesChange = useCallback(handleNumberChange(setMaxNudges, (value: number | null) => ({ maxNudges: value })), [handleNumberChange]);

  const handleTypingVolumeChange = useCallback(handleRangeChange(setTypingVolume, (value: number) => ({ typingVolume: value })), [handleRangeChange]);
  const handleMaxCallDurationChange = useCallback(handleRangeChange(setMaxCallDuration, (value: number) => ({ maxCallDuration: value })), [handleRangeChange]);

  // Utility for time formatting
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const parseDuration = (duration: string): number => {
    const parts = duration.split(':').map(Number);
    if (parts.length === 2) {
      return (parts[0] * 60) + (parts[1] || 0);
    }
    // Fallback if user types an invalid duration string, try to parse it as seconds
    return parseInt(duration) || 1200;
  };

  // Test Dify integration manually
  const testDifyIntegration = async () => {
    setIsTestingDify(true);
    setSuccessMessage('Testing Dify integration...');
    setErrorMessage('');

    try {
      const testModelProvider = modelConfig?.provider || 'langgenius/openai/openai';
      const testModelName = modelConfig?.model || 'gpt-4o';

      const difyResult = await difyAgentService.createDifyAgent({
        agentName: `${agentName}_test_${Date.now()}`,
        organizationId: selectedAgent?.organization_id || currentOrganizationId,
        modelProvider: testModelProvider,
        modelName: testModelName
      });

      if (difyResult.success && difyResult.data?.appKey) {
        setSuccessMessage(`✅ Dify integration test successful! Generated API key: ${difyResult.data.appKey.substring(0, 10)}...`);
        setConfigStatus('success');
      } else {
        setErrorMessage(`❌ Dify integration test failed: ${difyResult.error || difyResult.details || 'Unknown error'}`);
        setConfigStatus('error');
      }
    } catch (error) {
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
              <h4 className={`text-lg font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Initial Message</h4>
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
              onChange={handleInitialMessageChange}
              disabled={!isEditing}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 backdrop-blur-sm transition-all duration-300 resize-none ${!isEditing
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
              <h4 className={`text-lg font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Call Behavior</h4>
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
                onChange={handleNudgeTextChange}
                disabled={!isEditing}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 backdrop-blur-sm transition-all duration-300 resize-none ${!isEditing
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
                  onChange={handleNudgeIntervalChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 backdrop-blur-sm transition-all duration-300 ${!isEditing
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
                  onChange={handleMaxNudgesChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 backdrop-blur-sm transition-all duration-300 ${!isEditing
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
              <h4 className={`text-lg font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Audio & Duration</h4>
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
                    step="0.01"
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
                    min="0"
                    max="1"
                    step="0.01"
                    value={typingVolume}
                    onChange={(e) => handleTypingVolumeChange(parseFloat(e.target.value) || 0)}
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
                  <span>0 (Min)</span>
                  <span>1 (Max)</span>
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
                    onChange={(e) => {
                      const newDuration = parseDuration(e.target.value);
                      // Only save if it's a valid duration string, otherwise just update the displayed value
                      if (newDuration >= 60 && newDuration <= 1200) {
                        handleMaxCallDurationChange(newDuration);
                      } else {
                        // Allow temporary invalid display in text field
                        setMaxCallDuration(newDuration);
                      }
                    }}
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