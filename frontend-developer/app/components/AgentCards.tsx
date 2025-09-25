'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bot, MessageCircle, Edit, BarChart3, ExternalLink, Plus, RefreshCw, QrCode, Trash2, ChevronDown } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { agentConfigService } from '../../service/agentConfigService';

// QR Code Content Component
const QrCodeContent: React.FC<{ agent: Agent }> = ({ agent }) => {
  const [qrUrl, setQrUrl] = useState("");
  const [isQrLoading, setIsQrLoading] = useState(true);
  const qrCodeRef = useRef<HTMLDivElement>(null);

  // Generate QR code URL when component mounts
  useEffect(() => {
    const generateQrCodeUrl = async () => {
      setIsQrLoading(true);
      try {
        // Use the chatbot page URL with the agent ID
        const agentUrl = `${window.location.origin}/chatbot/${agent.id}`;
        setQrUrl(agentUrl);
      } catch (error) {
        console.error('Error creating QR code URL:', error);
        setQrUrl(window.location.origin);
      } finally {
        setIsQrLoading(false);
      }
    };

    generateQrCodeUrl();
  }, [agent]);

  // Render QR code when URL is available
  useEffect(() => {
    if (qrUrl && !isQrLoading && qrCodeRef.current) {
      // Clear any existing content
      qrCodeRef.current.innerHTML = '';

      // Create QR code using external API service
      const qrCodeImg = document.createElement('img');
      qrCodeImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qrUrl)}`;
      qrCodeImg.alt = `QR Code for ${agent.name}`;
      qrCodeImg.className = 'mx-auto rounded-lg shadow-sm';
      qrCodeImg.onload = () => {
        if (qrCodeRef.current) {
          qrCodeRef.current.innerHTML = '';
          qrCodeRef.current.appendChild(qrCodeImg);
        }
      };
      qrCodeImg.onerror = () => {
        if (qrCodeRef.current) {
          qrCodeRef.current.innerHTML = '<div class="text-center text-gray-500">Failed to load QR code</div>';
        }
      };
    }
  }, [qrUrl, isQrLoading, agent.name]);

  if (isQrLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div ref={qrCodeRef} className="flex items-center justify-center h-64">
        {/* QR code will be inserted here */}
      </div>
      <p className="text-xs text-gray-500 mt-2 break-all">
        {qrUrl}
      </p>
    </div>
  );
};

interface Agent {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'draft';
  model?: string;
  provider?: string;
  cost?: string;
  latency?: string;
  avatar?: string;
  description?: string;
  organization_id?: string;
  chatbot_api?: string;
  chatbot_key?: string;
  modelApiKey?: string;
  systemPrompt?: string;
  tts_config?: any;
  stt_config?: any;
  initial_message?: string;
  nudge_text?: string;
  nudge_interval?: number;
  max_nudges?: number;
  typing_volume?: number;
  max_call_duration?: number;
  created_at?: string;
  updated_at?: string;
  config?: Record<string, unknown>;
}

interface AgentCardsProps {
  agents: Agent[];
  onEditAgent: (agent: Agent) => void;
  onOpenAgent: (agent: Agent) => void;
  onCreateAgent: () => void;
  onRefreshAgents: () => void;
  isLoadingAgents: boolean;
  isRefreshingAgents: boolean;
  agentsError?: string;
}

export default function AgentCards({
  agents,
  onEditAgent,
  onOpenAgent,
  onCreateAgent,
  onRefreshAgents,
  isLoadingAgents,
  isRefreshingAgents,
  agentsError
}: AgentCardsProps) {
  const { isDarkMode } = useTheme();

  // QR code modal state
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrAgent, setQrAgent] = useState<Agent | null>(null);

  // Settings dropdown state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  const [isDeletingAgent, setIsDeletingAgent] = useState(false);

  // Function to show the QR code modal
  const showQrCodeModal = (agent: Agent) => {
    console.log('showQrCodeModal called with agent:', agent.name);
    setQrAgent(agent);
    setShowQrModal(true);
  };

  // Function to get the agent URL for QR code
  const getAgentUrl = async (agent: Agent): Promise<string> => {
    try {
      // For now, we'll use the chatbot page URL with the agent ID
      // In the future, we can create a session-based URL like in CHAT-APP
      return `${window.location.origin}/chatbot/${agent.id}`;
    } catch (error) {
      console.error('Error creating QR code URL:', error);
      return window.location.origin;
    }
  };

  // Function to show delete confirmation modal
  const showDeleteConfirmation = (agent: Agent) => {
    setAgentToDelete(agent);
    setShowDeleteModal(true);
  };

  // Function to handle agent deletion
  const handleDeleteAgent = async () => {
    if (!agentToDelete) return;

    setIsDeletingAgent(true);
    try {
      console.log('Deleting agent:', agentToDelete.name);

      // Use the deleteAgentByName service directly
      const result = await agentConfigService.deleteAgentByName(agentToDelete.name);

      if (result.success) {
        console.log(`Agent "${agentToDelete.name}" deleted successfully`);
        alert(`Agent "${agentToDelete.name}" deleted successfully`);

        // Call the parent component's refresh function to update the agents list
        onRefreshAgents();
      } else {
        console.error('Failed to delete agent:', result.message);
        alert(`Failed to delete agent: ${result.message}`);
      }

      // Close the modal
      setShowDeleteModal(false);
      setAgentToDelete(null);
    } catch (error) {
      console.error('Error deleting agent:', error);
      alert('Failed to delete agent. Please try again.');
    } finally {
      setIsDeletingAgent(false);
    }
  };


  // Generate avatar color based on agent name
  const getAvatarColor = (name: string) => {
    const colors = [
      '#4F46E5', '#059669', '#DC2626', '#7C3AED', '#EA580C', '#0891B2',
      '#BE185D', '#65A30D', '#CA8A04', '#9333EA', '#C2410C', '#0D9488'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (agentsError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-900/20 border border-red-700/50' : 'bg-red-50 border border-red-200'}`}>
          <p className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>{agentsError}</p>
          <button
            onClick={onRefreshAgents}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">

      {/* Agent Cards Grid */}
      <div className="flex-1 p-6 overflow-y-auto">
        {isLoadingAgents && agents.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-6 w-6 text-green-500 animate-spin" />
              <span className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Loading agents...
              </span>
            </div>
          </div>
        ) : agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
              <div className={`p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                <Bot className={`h-10 w-10 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                No agents found
              </h3>
              <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Create your first AI agent to get started!
              </p>
              <button
                onClick={onCreateAgent}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors shadow-md font-medium inline-flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Create First Agent
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create New Agent Card */}
            <div
              onClick={onCreateAgent}
              className={`rounded-2xl shadow-md hover:shadow-xl border overflow-hidden transition-all duration-300 transform hover:-translate-y-1 cursor-pointer ${isDarkMode
                ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
            >
              {/* Header with plus icon */}
              <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-medium shadow-md bg-gradient-to-r from-green-500 to-emerald-600">
                    <Plus className="h-8 w-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-xl font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Create New Agent
                    </h3>
                    <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Start building your AI assistant
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className={`p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Click here to create a new AI agent with custom configurations, voice settings, and chatbot capabilities.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className={`p-4 border-t ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                <div className="grid grid-cols-4 gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateAgent();
                    }}
                    className="col-span-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-2.5 px-4 rounded-xl transition-all duration-200 shadow-sm font-medium text-sm flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Agent
                  </button>
                </div>
              </div>
            </div>

            {agents.map((agent) => (
              <div
                key={agent.id}
                className={`rounded-2xl shadow-md hover:shadow-xl border overflow-hidden transition-all duration-300 transform hover:-translate-y-1 ${isDarkMode
                  ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                  : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
              >
                {/* Header with avatar and name */}
                <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-medium shadow-md overflow-hidden"
                      style={{ backgroundColor: getAvatarColor(agent.name) }}
                    >
                      {agent.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-xl font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {agent.name}
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(agent.status)}`}>
                          {agent.status}
                        </span>
                        {agent.chatbot_key && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDarkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-800'
                            }`}>
                            Custom API
                          </span>
                        )}
                        {agent.chatbot_api && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'
                            }`}>
                            Custom URL
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description preview */}
                <div className={`px-6 py-4 min-h-[100px] flex items-center ${isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50'
                  }`}>
                  <p className={`text-sm line-clamp-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {agent.initial_message || agent.description || "No description available."}
                  </p>
                </div>

                {/* Actions */}
                <div className={`p-4 border-t ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                  <div className="grid grid-cols-5 gap-2">
                    <button
                      onClick={() => onOpenAgent(agent)}
                      className="col-span-2 bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 text-white py-2.5 px-4 rounded-xl transition-all duration-200 shadow-sm font-medium text-sm flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Open Agent
                    </button>
                    <button
                      onClick={() => onEditAgent(agent)}
                      className={`p-2.5 rounded-xl transition-colors flex items-center justify-center ${isDarkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      title="Edit agent settings"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => showQrCodeModal(agent)}
                      className={`p-2.5 rounded-xl transition-colors flex items-center justify-center ${isDarkMode
                        ? 'bg-green-900/30 hover:bg-green-800/30 text-green-300'
                        : 'bg-green-100 hover:bg-green-200 text-green-700'
                        }`}
                      title="Generate QR code"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => showDeleteConfirmation(agent)}
                      className={`p-2.5 rounded-xl transition-colors flex items-center justify-center ${isDarkMode
                        ? 'bg-red-900/30 hover:bg-red-800/30 text-red-300'
                        : 'bg-red-100 hover:bg-red-200 text-red-700'
                        }`}
                      title="Delete Agent"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Footer links */}
                  <div className={`mt-4 pt-3 border-t flex justify-between items-center ${isDarkMode ? 'border-gray-700' : 'border-gray-100'
                    }`}>
                    <div className="flex items-center gap-2">
                      <button
                        className={`text-xs flex items-center gap-1.5 font-medium py-1 px-2 rounded hover:bg-opacity-20 transition-colors ${isDarkMode
                          ? 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500'
                          : 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50'
                          }`}
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        Analytics
                      </button>

                      {agent.chatbot_api && (
                        <button
                          className={`text-xs flex items-center gap-1.5 font-medium py-1 px-2 rounded hover:bg-opacity-20 transition-colors ${isDarkMode
                            ? 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500'
                            : 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50'
                            }`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          API endpoints
                        </button>
                      )}
                    </div>

                    <span className={`text-xs rounded-full px-2.5 py-1 font-mono ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                      }`}>
                      {agent.id.substring(0, 8)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && agentToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`p-6 rounded-xl shadow-xl max-w-md w-full mx-4 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              }`}>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Delete Agent
                </h3>
                <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Are you sure you want to delete <strong>"{agentToDelete.name}"</strong>? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setAgentToDelete(null);
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAgent}
                    disabled={isDeletingAgent}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${isDeletingAgent
                      ? 'bg-red-400 text-white cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                  >
                    {isDeletingAgent ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete Agent'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* QR Code Modal */}
        {showQrModal && qrAgent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`p-6 rounded-xl shadow-xl max-w-md w-full mx-4 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              }`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                QR Code for {qrAgent.name}
              </h3>
              <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Scan this QR code to open the agent on any device
              </p>

              <QrCodeContent agent={qrAgent} />

              <div className="flex justify-center gap-3 mt-6">
                <button
                  onClick={() => setShowQrModal(false)}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
