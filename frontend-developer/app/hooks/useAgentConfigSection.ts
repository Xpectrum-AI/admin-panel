'use client';

import { useAgentConfig, AgentConfiguration } from '../contexts/AgentConfigContext';
import { useCallback } from 'react';

export const useAgentConfigSection = <T extends keyof AgentConfiguration>(
  section: T
) => {
  const { configuration, updateConfiguration, hasUnsavedChanges, autoSaveStatus } = useAgentConfig();

  const sectionConfig = configuration[section];
  const hasChanges = hasUnsavedChanges;

  const updateSection = useCallback((data: Partial<NonNullable<AgentConfiguration[T]>>) => {
    updateConfiguration(section, data);
  }, [section, updateConfiguration]);

  const resetSection = useCallback(() => {
    updateConfiguration(section, null);
  }, [section, updateConfiguration]);

  return {
    config: sectionConfig,
    updateConfig: updateSection,
    resetConfig: resetSection,
    hasChanges,
    autoSaveStatus,
    isConfigured: sectionConfig !== null
  };
};

// Specific hooks for each configuration section
export const useModelConfig = () => useAgentConfigSection('model');
export const useVoiceConfig = () => useAgentConfigSection('voice');
export const useTranscriberConfig = () => useAgentConfigSection('transcriber');
export const useToolsConfig = () => useAgentConfigSection('tools');
export const useWidgetConfig = () => useAgentConfigSection('widget');
