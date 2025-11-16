'use client';

import React, { forwardRef, useState, useEffect, useCallback, useRef } from 'react';
import { Wrench, CheckCircle, AlertCircle, Clock, Volume2, MessageSquare, Zap, Phone } from 'lucide-react';
import { difyAgentService } from '../../../service/difyAgentService';
import { agentConfigService } from '../../../service/agentConfigService';
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
        maxCallDuration: selectedAgent.max_call_duration,
        transferPhoneNumber: selectedAgent.transfer_phonenumber || '',
        transferPlatform: selectedAgent.transfer_phonenumber_platform || 'phone'
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
      transferPhoneNumber: configToLoad?.transferPhoneNumber ?? '',
      transferPlatform: configToLoad?.transferPlatform ?? 'phone',
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
  const [transferPhoneNumber, setTransferPhoneNumber] = useState(initialValues.transferPhoneNumber);
  const [transferPlatform, setTransferPlatform] = useState(initialValues.transferPlatform);
  const [agentPhoneNumber, setAgentPhoneNumber] = useState<string | null>(null);

  // Status states
  const [configStatus, setConfigStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isTestingDify, setIsTestingDify] = useState(false);
  const [saveInProgress, setSaveInProgress] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState(0);

  // Refs for debouncing transfer settings
  const transferPhoneNumberTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const transferPlatformTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialTransferPlatformRef = useRef<string | null>(null);
  const hasAutoSavedPlatformRef = useRef(false);
  const lastAutoSavedAgentPrefixRef = useRef<string | null>(null);

  // Ref to track if synchronization has occurred to prevent continuous resets
  const isSynchronizedRef = useRef(false);

  // Fetch agent's phone number when agent is selected
  useEffect(() => {
    const fetchAgentPhoneNumber = async () => {
      if (!selectedAgent?.agent_prefix) {
        setAgentPhoneNumber(null);
        return;
      }

      try {
        const result = await agentConfigService.getAgentPhoneNumber(selectedAgent.agent_prefix);
        if (result.success && result.phoneNumber) {
          setAgentPhoneNumber(result.phoneNumber);
        } else {
          setAgentPhoneNumber(null);
        }
      } catch (error) {
        setAgentPhoneNumber(null);
      }
    };

    fetchAgentPhoneNumber();
  }, [selectedAgent?.agent_prefix]);

  // Store initial transfer platform value and auto-save if needed
  useEffect(() => {
    if (!selectedAgent?.agent_prefix) {
      return;
    }

    const currentAgentPrefix = selectedAgent.agent_prefix;
    const initialPlatform = selectedAgent.transfer_phonenumber_platform || 'phone';
    
    // Only reset flag when agent actually changes
    if (lastAutoSavedAgentPrefixRef.current !== currentAgentPrefix) {
      initialTransferPlatformRef.current = initialPlatform;
      hasAutoSavedPlatformRef.current = false;
      lastAutoSavedAgentPrefixRef.current = currentAgentPrefix;
    }

    // Auto-save "phone" if agent doesn't have transfer_phonenumber_platform set
    // Only if we haven't already auto-saved for this agent
    if (
      !selectedAgent.transfer_phonenumber_platform && 
      agentPhoneNumber && 
      isEditing && 
      transferPlatform === 'phone' &&
      !hasAutoSavedPlatformRef.current
    ) {
      // Delay auto-save slightly to ensure agent phone number is loaded
      const autoSaveTimer = setTimeout(() => {
        // Double-check conditions before saving
        if (
          hasAutoSavedPlatformRef.current ||
          !selectedAgent?.agent_prefix ||
          !agentPhoneNumber ||
          !isEditing ||
          selectedAgent.transfer_phonenumber_platform // Check again in case it was updated
        ) {
          return;
        }

        hasAutoSavedPlatformRef.current = true;
        
        // Call the debounced function directly
        if (transferPlatformTimeoutRef.current) {
          clearTimeout(transferPlatformTimeoutRef.current);
        }
        
        transferPlatformTimeoutRef.current = setTimeout(async () => {
          // Capture values at the time of execution
          const currentAgentPrefixAtSave = selectedAgent?.agent_prefix;
          const currentAgentPhoneAtSave = agentPhoneNumber;
          const currentIsEditingAtSave = isEditing;
          
          if (saveInProgress || !currentAgentPrefixAtSave || !currentIsEditingAtSave) {
            return;
          }
          if (!currentAgentPhoneAtSave) {
            return;
          }
          
          try {
            setSaveInProgress(true);
            const platformResult = await agentConfigService.addTransferPhoneNumberPlatform(currentAgentPhoneAtSave, 'phone');
            if (platformResult.success) {
              initialTransferPlatformRef.current = 'phone';
            }
          } catch (error) {
            // Silent fail for auto-save
            hasAutoSavedPlatformRef.current = false; // Reset on error so it can retry
          } finally {
            setSaveInProgress(false);
          }
        }, 2000);
      }, 1000);
      
      return () => clearTimeout(autoSaveTimer);
    }
  }, [selectedAgent?.agent_prefix, selectedAgent?.transfer_phonenumber_platform, agentPhoneNumber, isEditing, transferPlatform]);

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
      setTransferPhoneNumber(latestConfig.transferPhoneNumber);
      setTransferPlatform(latestConfig.transferPlatform);
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
          im: initialMessage, nt: nudgeText, ni: nudgeInterval, mn: maxNudges, tv: typingVolume, mcd: maxCallDuration, tpn: transferPhoneNumber, tp: transferPlatform
        });
        const latestKey = JSON.stringify({
          im: latestConfig.initialMessage, nt: latestConfig.nudgeText, ni: latestConfig.nudgeInterval, mn: latestConfig.maxNudges, tv: latestConfig.typingVolume, mcd: latestConfig.maxCallDuration, tpn: latestConfig.transferPhoneNumber, tp: latestConfig.transferPlatform
        });

        if (currentKey !== latestKey) {
          setInitialMessage(latestConfig.initialMessage);
          setNudgeText(latestConfig.nudgeText);
          setNudgeInterval(latestConfig.nudgeInterval);
          setMaxNudges(latestConfig.maxNudges);
          setTypingVolume(latestConfig.typingVolume);
          setMaxCallDuration(latestConfig.maxCallDuration);
          setTransferPhoneNumber(latestConfig.transferPhoneNumber);
          setTransferPlatform(latestConfig.transferPlatform);
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
          transferPhoneNumber,
          transferPlatform,
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

  // Debounced transfer phone number save function
  const debouncedTransferPhoneNumberSave = useCallback((phoneNumber: string) => {
    if (transferPhoneNumberTimeoutRef.current) {
      clearTimeout(transferPhoneNumberTimeoutRef.current);
    }

    transferPhoneNumberTimeoutRef.current = setTimeout(async () => {
      if (saveInProgress || !selectedAgent?.agent_prefix || !isEditing) {
        return;
      }

      if (!agentPhoneNumber) {
        setErrorMessage('Agent does not have an assigned phone number. Please assign a phone number to this agent first.');
        setConfigStatus('error');
        setTimeout(() => {
          setConfigStatus('idle');
          setErrorMessage('');
        }, 5000);
        return;
      }

      // Skip if empty
      if (!phoneNumber || !phoneNumber.trim()) {
        return;
      }

      try {
        setSaveInProgress(true);
        setErrorMessage('');

        const phoneResult = await agentConfigService.addTransferPhoneNumber(agentPhoneNumber, phoneNumber.trim());
        
        if (phoneResult.success) {
          const now = Date.now();
          if (now - lastSaveTime > 2000) {
            setSuccessMessage('Transfer phone number saved successfully');
            setLastSaveTime(now);
            setConfigStatus('success');
            setTimeout(() => {
              setConfigStatus('idle');
              setSuccessMessage('');
            }, 3000);
          }
        } else {
          setErrorMessage(`Failed to save transfer phone number: ${phoneResult.message}`);
          setConfigStatus('error');
          setTimeout(() => {
            setConfigStatus('idle');
            setErrorMessage('');
          }, 5000);
        }
      } catch (error) {
        setErrorMessage(`Failed to save transfer phone number: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setConfigStatus('error');
        setTimeout(() => {
          setConfigStatus('idle');
          setErrorMessage('');
        }, 5000);
      } finally {
        setSaveInProgress(false);
      }
    }, 2000); // 2 second delay
  }, [selectedAgent?.agent_prefix, agentPhoneNumber, isEditing, saveInProgress, lastSaveTime]);

  // Debounced transfer platform save function
  const debouncedTransferPlatformSave = useCallback((platform: string, isAutoSave: boolean = false) => {
    if (transferPlatformTimeoutRef.current) {
      clearTimeout(transferPlatformTimeoutRef.current);
    }

    transferPlatformTimeoutRef.current = setTimeout(async () => {
      if (saveInProgress || !selectedAgent?.agent_prefix || !isEditing) {
        return;
      }

      if (!agentPhoneNumber) {
        if (!isAutoSave) {
          setErrorMessage('Agent does not have an assigned phone number. Please assign a phone number to this agent first.');
          setConfigStatus('error');
          setTimeout(() => {
            setConfigStatus('idle');
            setErrorMessage('');
          }, 5000);
        }
        return;
      }

      // Skip if value hasn't changed from initial (unless it's auto-save)
      if (!isAutoSave && platform === initialTransferPlatformRef.current) {
        return;
      }

      try {
        setSaveInProgress(true);
        if (!isAutoSave) {
          setErrorMessage('');
        }

        const platformResult = await agentConfigService.addTransferPhoneNumberPlatform(agentPhoneNumber, platform);
        
        if (platformResult.success) {
          const now = Date.now();
          if (now - lastSaveTime > 2000) {
            if (!isAutoSave) {
              setSuccessMessage('Transfer platform saved successfully');
              setLastSaveTime(now);
              setConfigStatus('success');
              setTimeout(() => {
                setConfigStatus('idle');
                setSuccessMessage('');
              }, 3000);
            }
            // Update initial value after successful save
            initialTransferPlatformRef.current = platform;
          }
        } else {
          if (!isAutoSave) {
            setErrorMessage(`Failed to save transfer platform: ${platformResult.message}`);
            setConfigStatus('error');
            setTimeout(() => {
              setConfigStatus('idle');
              setErrorMessage('');
            }, 5000);
          }
        }
      } catch (error) {
        if (!isAutoSave) {
          setErrorMessage(`Failed to save transfer platform: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setConfigStatus('error');
          setTimeout(() => {
            setConfigStatus('idle');
            setErrorMessage('');
          }, 5000);
        }
      } finally {
        setSaveInProgress(false);
      }
    }, 2000); // 2 second delay
  }, [selectedAgent?.agent_prefix, agentPhoneNumber, isEditing, saveInProgress, lastSaveTime]);

  // Transfer phone number handlers
  const handleTransferPhoneNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTransferPhoneNumber(value);
    saveStateToCentralized({ transferPhoneNumber: value });
    debouncedTransferPhoneNumberSave(value);
  }, [saveStateToCentralized, debouncedTransferPhoneNumberSave]);

  const handleTransferPlatformChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setTransferPlatform(value);
    saveStateToCentralized({ transferPlatform: value });
    debouncedTransferPlatformSave(value, false);
  }, [saveStateToCentralized, debouncedTransferPlatformSave]);

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

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (transferPhoneNumberTimeoutRef.current) {
        clearTimeout(transferPhoneNumberTimeoutRef.current);
      }
      if (transferPlatformTimeoutRef.current) {
        clearTimeout(transferPlatformTimeoutRef.current);
      }
    };
  }, []);

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

        {/* Call Transfer Settings */}
        <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className={`text-lg font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Call Transfer Settings</h4>
            </div>
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <Phone className={`h-5 w-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            </div>
          </div>

          <div className="space-y-6">
            {/* Transfer Phone Number */}
            <div>
              <label className={`text-sm font-semibold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <Phone className="h-4 w-4" />
                Transfer Phone Number
              </label>
              <input
                type="text"
                value={transferPhoneNumber}
                onChange={handleTransferPhoneNumberChange}
                disabled={!isEditing}
                placeholder="+15551234567"
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 backdrop-blur-sm transition-all duration-300 ${!isEditing
                  ? isDarkMode
                    ? 'border-gray-700 bg-gray-800/30 text-gray-400 placeholder-gray-500 cursor-not-allowed'
                    : 'border-gray-300 bg-gray-100 text-gray-500 placeholder-gray-400 cursor-not-allowed'
                  : isDarkMode
                    ? 'border-gray-600 bg-gray-800/80 text-gray-200 placeholder-gray-500'
                    : 'border-gray-200 bg-white/80 text-gray-900 placeholder-gray-400'
                  }`}
              />
            </div>

            {/* Transfer Platform */}
            <div>
              <label className={`text-sm font-semibold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <Phone className="h-4 w-4" />
                Transfer Platform
              </label>
              <select
                value={transferPlatform}
                onChange={handleTransferPlatformChange}
                disabled={!isEditing}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 backdrop-blur-sm transition-all duration-300 ${!isEditing
                  ? isDarkMode
                    ? 'border-gray-700 bg-gray-800/30 text-gray-400 cursor-not-allowed'
                    : 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed'
                  : isDarkMode
                    ? 'border-gray-600 bg-gray-800/80 text-gray-200'
                    : 'border-gray-200 bg-white/80 text-gray-900'
                  }`}
              >
                <option value="phone">Phone</option>
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
});

ToolsConfig.displayName = 'ToolsConfig';

export default ToolsConfig;