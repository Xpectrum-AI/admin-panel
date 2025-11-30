'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';

interface AgentPrefixModalProps {
  isOpen: boolean;
  agentPrefix: string;
  agentType: 'Knowledge Agent (RAG)' | 'Action Agent (AI Employee)';
  isCreating: boolean;
  onClose: () => void;
  onPrefixChange: (prefix: string) => void;
  onTypeChange: (type: 'Knowledge Agent (RAG)' | 'Action Agent (AI Employee)') => void;
  onSubmit: () => void;
}

export default function AgentPrefixModal({
  isOpen,
  agentPrefix,
  agentType,
  isCreating,
  onClose,
  onPrefixChange,
  onTypeChange,
  onSubmit
}: AgentPrefixModalProps) {
  const { isDarkMode } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`p-8 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'}`}>
            <svg className={`w-6 h-6 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Create New Agent
          </h2>
          <button
            onClick={onClose}
            className={`ml-auto p-2 rounded-lg hover:bg-opacity-10 ${isDarkMode ? 'hover:bg-white text-gray-400 hover:text-white' : 'hover:bg-gray-900 text-gray-500 hover:text-gray-900'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Agent Prefix
            </label>
            <input
              type="text"
              value={agentPrefix}
              onChange={(e) => onPrefixChange(e.target.value)}
              placeholder="e.g., riley, elliot, assistant"
              disabled={isCreating}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${isDarkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-white'
                }`}
            />
            <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Lowercase letters, numbers, and underscores only. This will be used as the agent identifier.
            </p>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Agent Type
            </label>
            <select
              value={agentType}
              onChange={(e) => onTypeChange(e.target.value as 'Knowledge Agent (RAG)' | 'Action Agent (AI Employee)')}
              disabled={isCreating}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${isDarkMode
                ? 'bg-gray-700 border-gray-600 text-white focus:bg-gray-600'
                : 'bg-white border-gray-300 text-gray-900 focus:bg-white'
                }`}
            >
              <option value="Knowledge Agent (RAG)">Knowledge Agent (RAG)</option>
              <option value="Action Agent (AI Employee)">Action Agent (AI Employee)</option>
            </select>
            <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Choose the type of agent you want to create.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            disabled={isCreating}
            className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${isDarkMode
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!agentPrefix.trim() || isCreating}
            className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${agentPrefix.trim() && !isCreating
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
              : isDarkMode
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
          >
            {isCreating ? 'Creating...' : 'Create Agent'}
          </button>
        </div>
      </div>
    </div>
  );
}

