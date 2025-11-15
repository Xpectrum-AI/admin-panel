'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
// import { agentConfigService } from '../service/agentConfigService';

// Configuration types
export interface ModelConfig {
  provider?: string;
  model?: string;
  api_key?: string;
  selectedModelProvider?: string;
  selectedModel?: string;
  modelLiveUrl?: string;
  modelApiKey?: string;
  agentApiKey?: string;
  chatbot_api?: string;
  chatbot_key?: string;
  systemPrompt?: string;
  firstMessage?: string;
}

export interface VoiceConfig {
  provider?: string;
  model?: string;
  api_key?: string;
  voice_id?: string;
  language?: string;
  speed?: number;
  stability?: number;
  similarity_boost?: number;
  response_format?: string;
  selectedVoiceProvider?: string;
  selectedLanguage?: string;
  speedValue?: number;
  apiKey?: string;
  voiceId?: string;
  selectedVoice?: string;
  similarityBoost?: number;
  responseFormat?: string;
}

export interface TranscriberConfig {
  provider?: string;
  model?: string;
  api_key?: string;
  language?: string;
  punctuate?: boolean;
  smart_format?: boolean;
  interim_results?: boolean;
  selectedTranscriberProvider?: string;
  selectedLanguage?: string;
  selectedModel?: string;
  apiKey?: string;
  punctuateEnabled?: boolean;
  smartFormatEnabled?: boolean;
  interimResultEnabled?: boolean;
}

export interface ToolsConfig {
  initialMessage?: string;
  nudgeText?: string;
  nudgeInterval?: number;
  maxNudges?: number;
  typingVolume?: number;
  maxCallDuration?: number;
}

export interface WidgetConfig {
  // Add widget config properties as needed
  [key: string]: any;
}

export interface AgentConfiguration {
  model: ModelConfig | null;
  voice: VoiceConfig | null;
  transcriber: TranscriberConfig | null;
  tools: ToolsConfig | null;
  widget: WidgetConfig | null;
}

export interface AutoSaveStatus {
  status: 'saved' | 'saving' | 'error' | 'idle';
  lastSaved?: Date;
  error?: string;
}

export interface AgentConfigContextType {
  // Configuration state
  configuration: AgentConfiguration;
  hasUnsavedChanges: boolean;
  autoSaveStatus: AutoSaveStatus;
  currentAgentId: string | null;

  // Actions
  updateConfiguration: (section: keyof AgentConfiguration, data: Partial<any>) => void;
  resetConfiguration: () => void;
  loadConfigurationFromAgent: (agent: any) => void;
  saveConfiguration: () => Promise<boolean>;

  // Auto-save
  enableAutoSave: boolean;
  setEnableAutoSave: (enabled: boolean) => void;

  // Debug
  getConfigurationSnapshot: () => AgentConfiguration;
}

const AgentConfigContext = createContext<AgentConfigContextType | undefined>(undefined);

export const useAgentConfig = () => {
  const context = useContext(AgentConfigContext);
  if (!context) {
    throw new Error('useAgentConfig must be used within an AgentConfigProvider');
  }
  return context;
};

interface AgentConfigProviderProps {
  children: React.ReactNode;
}

export const AgentConfigProvider: React.FC<AgentConfigProviderProps> = ({ children }) => {
  // Configuration state - now agent-specific
  const [configuration, setConfiguration] = useState<AgentConfiguration>({
    model: null,
    voice: null,
    transcriber: null,
    tools: null,
    widget: null
  });

  // Track current agent ID for agent-specific storage
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>({ status: 'idle' });
  const [enableAutoSave, setEnableAutoSave] = useState(true);

  // Refs for auto-save
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<AgentConfiguration | null>(null);

  // Auto-save functionality with backend-first strategy and current state capture
  const performAutoSave = useCallback(async (currentConfig?: AgentConfiguration) => {
    const configToSave = currentConfig || configuration;

    if (!enableAutoSave || !hasUnsavedChanges || !currentAgentId) return;

    setAutoSaveStatus({ status: 'saving' });

    try {
      // Primary: Save to backend (if available)
      try {
        // Here you would call your backend API to save the configuration
        // const result = await agentConfigService.saveConfiguration(configToSave);
        // For now, we'll simulate this with a timeout
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (backendError) {
      }

      // Secondary: Save to sessionStorage for persistence across page reloads (agent-specific)
      if (currentAgentId) {
        sessionStorage.setItem(`agentConfiguration_${currentAgentId}`, JSON.stringify(configToSave));
      }

      // Tertiary: Save to localStorage as fallback (agent-specific)
      if (currentAgentId) {
        localStorage.setItem(`agentConfiguration_${currentAgentId}`, JSON.stringify(configToSave));
      }

      setAutoSaveStatus({
        status: 'saved',
        lastSaved: new Date()
      });

      setHasUnsavedChanges(false);
      lastSavedRef.current = configToSave;
    } catch (error) {
      setAutoSaveStatus({
        status: 'error',
        error: error instanceof Error ? error.message : 'Auto-save failed'
      });
    }
  }, [configuration, enableAutoSave, hasUnsavedChanges, currentAgentId]);

  // Note: Debounced auto-save removed - now handled directly in updateConfiguration
  // to avoid race conditions and stale state issues

  // Load configuration with improved persistence strategy
  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        // Primary: Try to load from backend first
        try {
          // Here you would call your backend API to load the configuration
          // const backendConfig = await agentConfigService.loadConfiguration();
          // if (backendConfig) {
          //   setConfiguration(backendConfig);
          //   lastSavedRef.current = backendConfig;
          //   
          //   return;
          // }
        } catch (backendError) {
        }

        // Secondary: Try sessionStorage (agent-specific)
        if (currentAgentId) {
          const sessionConfig = sessionStorage.getItem(`agentConfiguration_${currentAgentId}`);
          if (sessionConfig) {
            const parsedConfig = JSON.parse(sessionConfig);
            setConfiguration(parsedConfig);
            lastSavedRef.current = parsedConfig;
            return;
          }
        }

        // Tertiary: Try localStorage as fallback (agent-specific)
        if (currentAgentId) {
          const localConfig = localStorage.getItem(`agentConfiguration_${currentAgentId}`);
          if (localConfig) {
            const parsedConfig = JSON.parse(localConfig);
            setConfiguration(parsedConfig);
            lastSavedRef.current = parsedConfig;
          }
        }
      } catch (error) {
      }
    };

    loadConfiguration();
  }, [currentAgentId]);

  // Update configuration with current state capture
  const updateConfiguration = useCallback((section: keyof AgentConfiguration, data: Partial<any>) => {
    setConfiguration(prev => {
      const newConfig = {
        ...prev,
        [section]: {
          ...prev[section],
          ...data
        }
      };
      // Check if configuration has actually changed
      const hasChanged = JSON.stringify(newConfig) !== JSON.stringify(lastSavedRef.current);
      setHasUnsavedChanges(hasChanged);

      // Trigger auto-save with current state to avoid stale closure
      if (hasChanged && enableAutoSave) {
        setTimeout(() => {
          performAutoSave(newConfig);
        }, 100); // Small delay to ensure state is updated
      }

      return newConfig;
    });
  }, [enableAutoSave, performAutoSave]);

  // Reset configuration
  const resetConfiguration = useCallback(() => {
    setConfiguration({
      model: null,
      voice: null,
      transcriber: null,
      tools: null,
      widget: null
    });
    setHasUnsavedChanges(false);
    setAutoSaveStatus({ status: 'idle' });
    lastSavedRef.current = null;

    // Clear agent-specific sessionStorage
    if (currentAgentId) {
      sessionStorage.removeItem(`agentConfiguration_${currentAgentId}`);
      localStorage.removeItem(`agentConfiguration_${currentAgentId}`);
    }
  }, []);

  // Helper function to convert backend voice config to UI format
  const convertBackendVoiceConfigToUI = useCallback((backendConfig: any) => {
    if (!backendConfig || !backendConfig.provider) return null;

    const provider = backendConfig.provider;
    const providerConfig = backendConfig[provider];

    if (!providerConfig) return null;

    // Map backend provider names to UI provider names
    const providerMapping: { [key: string]: string } = {
      'openai': 'OpenAI',
      'elevenlabs': '11Labs',
      'cartesian': 'Cartesia'
    };

    const uiProvider = providerMapping[provider] || provider;

    // Map language codes to display names (includes all Cartesia languages)
    const languageMapping: { [key: string]: string } = {
      'en': 'English',
      'en-US': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese',
      'hi': 'Hindi',
      'ar': 'Arabic',
      'nl': 'Dutch',
      'sv': 'Swedish',
      'da': 'Danish',
      'no': 'Norwegian',
      'fi': 'Finnish',
      'pl': 'Polish',
      'tr': 'Turkish',
      'th': 'Thai',
      'vi': 'Vietnamese',
      // Additional Cartesia languages
      'bn': 'Bengali',
      'bg': 'Bulgarian',
      'hr': 'Croatian',
      'cs': 'Czech',
      'el': 'Greek',
      'gu': 'Gujarati',
      'he': 'Hebrew',
      'hu': 'Hungarian',
      'id': 'Indonesian',
      'ka': 'Kannada',
      'kn': 'Kannada',
      'ml': 'Malayalam',
      'mr': 'Marathi',
      'ms': 'Malay',
      'pa': 'Punjabi',
      'ro': 'Romanian',
      'sk': 'Slovak',
      'ta': 'Tamil',
      'te': 'Telugu',
      'tl': 'Tagalog',
      'uk': 'Ukrainian'
    };

    const languageCode = providerConfig.language || 'en';
    const displayLanguage = languageMapping[languageCode] || 'English';

    const selectedModel = providerConfig.model || providerConfig.model_id || 'tts-1';
    return {
      selectedVoiceProvider: uiProvider,
      selectedLanguage: displayLanguage,
      speedValue: providerConfig.speed || 1.0,
      apiKey: providerConfig.api_key || providerConfig.tts_api_key || '',
      voiceId: providerConfig.voice_id || '',
      selectedVoice: providerConfig.voice || providerConfig.model || 'alloy',
      stability: providerConfig.stability || 0.5,
      similarityBoost: providerConfig.similarity_boost || 0.5,
      responseFormat: providerConfig.response_format || 'mp3',
      selectedModel: selectedModel, // Support both model and model_id fields
      cartesiaSelectedGender: providerConfig.gender || '',
      selectedGender: providerConfig.gender || '' // For 11Labs, gender might be in labels, but we'll use this for consistency
    };
  }, []);

  // Helper function to convert backend transcriber config to UI format
  const convertBackendTranscriberConfigToUI = useCallback((backendConfig: any) => {
    if (!backendConfig || !backendConfig.provider) return null;

    const provider = backendConfig.provider;
    const providerConfig = backendConfig[provider];

    if (!providerConfig) return null;

    // Map backend provider names to UI provider names
    const providerMapping: { [key: string]: string } = {
      'deepgram': 'Deepgram',
      'openai': 'OpenAI'
    };

    const uiProvider = providerMapping[provider] || provider;

    return {
      selectedTranscriberProvider: uiProvider,
      selectedTranscriberLanguage: providerConfig.language || 'en-US',
      selectedTranscriberModel: providerConfig.model || 'nova-2',
      transcriberApiKey: providerConfig.api_key || '',
      punctuateEnabled: providerConfig.punctuate !== undefined ? providerConfig.punctuate : true,
      smartFormatEnabled: providerConfig.smart_format !== undefined ? providerConfig.smart_format : true,
      interimResultEnabled: providerConfig.interim_results !== undefined ? providerConfig.interim_results : false
    };
  }, []);

  // Load configuration from existing agent
  const loadConfigurationFromAgent = useCallback((agent: any) => {
    // Set current agent ID for agent-specific storage
    setCurrentAgentId(agent.id);

    // Clear any existing configuration first
    resetConfiguration();

    // Load agent-specific configuration
    setConfiguration(prev => {
      const systemPromptValue = agent.systemPrompt || agent.initial_message;
      const newConfig = {
        model: agent.modelApiKey ? {
          provider: agent.provider,
          model: agent.model,
          api_key: agent.modelApiKey,
          chatbot_api: agent.chatbot_api,
          chatbot_key: agent.chatbot_key,
          systemPrompt: systemPromptValue
        } : null,

        voice: agent.tts_config ? convertBackendVoiceConfigToUI(agent.tts_config) : null,
        transcriber: agent.stt_config ? convertBackendTranscriberConfigToUI(agent.stt_config) : null,

        tools: {
          initialMessage: agent.initial_message,
          nudgeText: agent.nudge_text,
          nudgeInterval: agent.nudge_interval,
          maxNudges: agent.max_nudges,
          typingVolume: agent.typing_volume,
          maxCallDuration: agent.max_call_duration
        },

        widget: null
      };

      setHasUnsavedChanges(false);
      setAutoSaveStatus({ status: 'idle' });
      lastSavedRef.current = newConfig;

      return newConfig;
    });
  }, [convertBackendVoiceConfigToUI, convertBackendTranscriberConfigToUI, resetConfiguration]);

  // Save configuration to backend
  const saveConfiguration = useCallback(async (): Promise<boolean> => {
    try {
      setAutoSaveStatus({ status: 'saving' });

      // Convert configuration to backend format
      const backendConfig = {
        model: configuration.model,
        voice: configuration.voice,
        transcriber: configuration.transcriber,
        tools: configuration.tools,
        widget: configuration.widget
      };

      // Here you would call your backend API
      // const result = await agentConfigService.saveConfiguration(backendConfig);

      setAutoSaveStatus({
        status: 'saved',
        lastSaved: new Date()
      });

      setHasUnsavedChanges(false);
      lastSavedRef.current = configuration;
      return true;
    } catch (error) {
      setAutoSaveStatus({
        status: 'error',
        error: error instanceof Error ? error.message : 'Save failed'
      });
      return false;
    }
  }, [configuration]);

  // Get configuration snapshot for debugging
  const getConfigurationSnapshot = useCallback(() => {
    return { ...configuration };
  }, [configuration]);

  // Warn before page unload if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const contextValue: AgentConfigContextType = {
    configuration,
    hasUnsavedChanges,
    autoSaveStatus,
    currentAgentId,
    updateConfiguration,
    resetConfiguration,
    loadConfigurationFromAgent,
    saveConfiguration,
    enableAutoSave,
    setEnableAutoSave,
    getConfigurationSnapshot
  };

  return (
    <AgentConfigContext.Provider value={contextValue}>
      {children}
    </AgentConfigContext.Provider>
  );
};
