'use client';

import React from 'react';
import { X, Check } from 'lucide-react';
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

  const isKnowledgeAgent = agentType === 'Knowledge Agent (RAG)';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
        {/* Header */}
        <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'}`}>
              <svg className={`w-6 h-6 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Create New Agent
              </h2>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Configure your AI agent for optimal performance.
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg hover:bg-opacity-10 transition-colors ${isDarkMode ? 'hover:bg-white text-gray-400 hover:text-white' : 'hover:bg-gray-900 text-gray-500 hover:text-gray-900'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Agent Type Selection */}
          <div>
            <label className={`block text-sm font-semibold mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Agent Configuration
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Knowledge Agent Card */}
              <button
                type="button"
                onClick={() => onTypeChange('Knowledge Agent (RAG)')}
                disabled={isCreating}
                className={`relative p-5 rounded-xl border-2 transition-all text-left ${
                  isKnowledgeAgent
                    ? isDarkMode
                      ? 'border-green-500 bg-green-900/20'
                      : 'border-green-500 bg-green-50'
                    : isDarkMode
                    ? 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                } ${isCreating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isKnowledgeAgent
                      ? 'border-green-500 bg-green-500'
                      : isDarkMode
                      ? 'border-gray-500 bg-transparent'
                      : 'border-gray-400 bg-transparent'
                  }`}>
                    {isKnowledgeAgent && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Knowledge Agent (RAG)
                    </h3>
                    <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Specialized for information retrieval, document analysis, and knowledge-based Q&A with advanced search capabilities.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Check className={`w-4 h-4 flex-shrink-0 ${isKnowledgeAgent ? 'text-green-500' : isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Document Search</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className={`w-4 h-4 flex-shrink-0 ${isKnowledgeAgent ? 'text-green-500' : isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Q&A Engine</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className={`w-4 h-4 flex-shrink-0 ${isKnowledgeAgent ? 'text-green-500' : isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Blocking Mode</span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>

              {/* Action Agent Card */}
              <button
                type="button"
                onClick={() => onTypeChange('Action Agent (AI Employee)')}
                disabled={isCreating}
                className={`relative p-5 rounded-xl border-2 transition-all text-left ${
                  !isKnowledgeAgent
                    ? isDarkMode
                      ? 'border-green-500 bg-green-900/20'
                      : 'border-green-500 bg-green-50'
                    : isDarkMode
                    ? 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                } ${isCreating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    !isKnowledgeAgent
                      ? 'border-green-500 bg-green-500'
                      : isDarkMode
                      ? 'border-gray-500 bg-transparent'
                      : 'border-gray-400 bg-transparent'
                  }`}>
                    {!isKnowledgeAgent && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Action Agent (AI Employee)
                    </h3>
                    <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Intelligent assistant capable of task execution, tool integration, and complex workflow automation.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Check className={`w-4 h-4 flex-shrink-0 ${!isKnowledgeAgent ? 'text-green-500' : isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Function Calling</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className={`w-4 h-4 flex-shrink-0 ${!isKnowledgeAgent ? 'text-green-500' : isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Tool Integration</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className={`w-4 h-4 flex-shrink-0 ${!isKnowledgeAgent ? 'text-green-500' : isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Streaming Mode</span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Agent Identifier */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Agent Identifier
            </label>
            <input
              type="text"
              value={agentPrefix}
              onChange={(e) => onPrefixChange(e.target.value)}
              placeholder="e.g., customer-support, sales-automation"
              disabled={isCreating}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-white'
              }`}
            />
            <div className="flex items-start gap-2 mt-2">
              <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Requirements: 3-50 characters, lowercase letters, numbers, and underscores only. This will be used as your agent's unique identifier.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-6 border-t flex gap-3 ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
          <button
            onClick={onClose}
            disabled={isCreating}
            className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${
              isDarkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!agentPrefix.trim() || agentPrefix.length < 3 || agentPrefix.length > 50 || isCreating}
            className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${
              agentPrefix.trim() && agentPrefix.length >= 3 && agentPrefix.length <= 50 && !isCreating
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg'
                : isDarkMode
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isCreating ? 'Creating...' : '+ Create Agent'}
          </button>
        </div>
      </div>
    </div>
  );
}

