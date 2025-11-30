'use client';

import React from 'react';
import { Bot, Mic, Wrench, Code } from 'lucide-react';
import ModelConfig from '../../config/ModelConfig';
import VoiceConfig from '../../config/VoiceConfig';
import ToolsConfig from '../../config/ToolsConfig';
import WidgetConfig from '../../config/WidgetConfig';
import { useTheme } from '../../../contexts/ThemeContext';
import { Agent } from '../types';

interface AgentConfigPanelProps {
  selectedAgent: Agent | null;
  activeConfigTab: string;
  onTabChange: (tabId: string) => void;
  modelSectionRef: React.RefObject<any>;
}

const configTabs = [
  { id: 'model', label: 'Model', icon: Bot, color: 'from-green-500 to-emerald-600' },
  { id: 'voice', label: 'Voice & Transcriber', icon: Mic, color: 'from-green-500 to-teal-600' },
  { id: 'tools', label: 'Configurations', icon: Wrench, color: 'from-gray-600 to-gray-800' },
  { id: 'widget', label: 'Widget', icon: Code, color: 'from-green-500 to-emerald-600' },
];

export default function AgentConfigPanel({
  selectedAgent,
  activeConfigTab,
  onTabChange,
  modelSectionRef
}: AgentConfigPanelProps) {
  const { isDarkMode } = useTheme();

  if (!selectedAgent) {
    return (
      <div className={`flex items-center justify-center h-full ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        <p>Select an agent to configure</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex overflow-x-auto scrollbar-hide">
          {configTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeConfigTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? `bg-gradient-to-r ${tab.color} text-white`
                    : isDarkMode
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeConfigTab === 'model' && (
          <ModelConfig ref={modelSectionRef} />
        )}
        {activeConfigTab === 'voice' && (
          <VoiceConfig />
        )}
        {activeConfigTab === 'tools' && (
          <ToolsConfig />
        )}
        {activeConfigTab === 'widget' && (
          <WidgetConfig />
        )}
      </div>
    </div>
  );
}

