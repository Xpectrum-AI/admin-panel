'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Bot, MessageCircle, Edit, BarChart3, ExternalLink, Plus, RefreshCw, QrCode, Trash2, ChevronDown, CheckCircle, Link2, Search, Loader2, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { agentConfigService } from '../../service/agentConfigService';
import { getAgentDisplayName } from '../../lib/utils/agentNameUtils';

// QR Code Content Component - memoized to prevent unnecessary re-renders
const QrCodeContent: React.FC<{ agent: Agent }> = React.memo(({ agent }) => {
  const [qrUrl, setQrUrl] = useState("");
  const [isQrLoading, setIsQrLoading] = useState(true);
  const qrCodeRef = useRef<HTMLDivElement>(null);

  // Generate QR code URL when component mounts - memoized agent.id
  const agentId = useMemo(() => agent.id, [agent.id]);
  
  useEffect(() => {
    const generateQrCodeUrl = async () => {
      setIsQrLoading(true);
      try {
        // Use the chatbot page URL with the agent ID
        const agentUrl = `${window.location.origin}/chatbot/${agentId}`;
        setQrUrl(agentUrl);
      } catch (error) {
        setQrUrl(window.location.origin);
      } finally {
        setIsQrLoading(false);
      }
    };

    generateQrCodeUrl();
  }, [agentId]);

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
});

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
  onAssociateAgent?: () => void;
  isLoadingAgents: boolean;
  isRefreshingAgents: boolean;
  agentsError?: string;
  agentsLoaded?: boolean;
  organizationId?: string;
}

function AgentCards({
  agents,
  onEditAgent,
  onOpenAgent,
  onCreateAgent,
  onRefreshAgents,
  onAssociateAgent,
  isLoadingAgents,
  isRefreshingAgents,
  agentsError,
  agentsLoaded = false,
  organizationId
}: AgentCardsProps) {
  const { isDarkMode } = useTheme();

  // QR code modal state
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrAgent, setQrAgent] = useState<Agent | null>(null);

  // Settings dropdown state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  const [isDeletingAgent, setIsDeletingAgent] = useState(false);

  // Associate agent modal state
  const [showAssociateModal, setShowAssociateModal] = useState(false);
  const [availableAgents, setAvailableAgents] = useState<Array<{ appId: string; appName: string; workspaceId: string; workspaceName?: string }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingAgentsList, setIsLoadingAgentsList] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<{ appId: string; appName: string; workspaceId: string; workspaceName?: string } | null>(null);
  const [isAssociating, setIsAssociating] = useState(false);
  const [associateError, setAssociateError] = useState<string | null>(null);

  // Success modal state
  // const [showSuccessModal, setShowSuccessModal] = useState(false);
  // const [successMessage, setSuccessMessage] = useState('');

  // Function to show the QR code modal - memoized with useCallback
  const showQrCodeModal = useCallback((agent: Agent) => {
    setQrAgent(agent);
    setShowQrModal(true);
  }, []);

  // Function to get the agent URL for QR code - memoized with useCallback
  const getAgentUrl = useCallback(async (agent: Agent): Promise<string> => {
    try {
      // For now, we'll use the chatbot page URL with the agent ID
      // In the future, we can create a session-based URL like in CHAT-APP
      return `${window.location.origin}/chatbot/${agent.id}`;
    } catch (error) {
      return window.location.origin;
    }
  }, []);

  // Function to show delete confirmation modal - memoized with useCallback
  const showDeleteConfirmation = useCallback((agent: Agent) => {
    setAgentToDelete(agent);
    setShowDeleteModal(true);
  }, []);

  // Function to open associate agent modal - memoized with useCallback
  const handleOpenAssociateModal = useCallback(async () => {
    setShowAssociateModal(true);
    setSearchQuery('');
    setSelectedAgent(null);
    setAssociateError(null);
    setIsLoadingAgentsList(true);

    try {
      const response = await fetch('/api/dify/get-all-agents', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_LIVE_API_KEY || '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch agents from Main App');
      }

      const result = await response.json();
      if (result.success && result.agents) {
        setAvailableAgents(result.agents);
      } else {
        setAvailableAgents([]);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      setAssociateError('Failed to load agents from Main App');
      setAvailableAgents([]);
    } finally {
      setIsLoadingAgentsList(false);
    }
  }, []);

  // Function to handle agent association - memoized with useCallback
  const handleAssociateAgent = useCallback(async () => {
    if (!selectedAgent || !organizationId) {
      setAssociateError('Please select an agent and ensure organization ID is set');
      return;
    }

    setIsAssociating(true);
    setAssociateError(null);

    try {
      const response = await fetch('/api/dify/associate-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_LIVE_API_KEY || '',
        },
        body: JSON.stringify({
          appId: selectedAgent.appId,
          appName: selectedAgent.appName,
          workspaceId: selectedAgent.workspaceId,
          organizationId: organizationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || 'Failed to associate agent');
      }

      const result = await response.json();
      if (result.success) {
        setShowAssociateModal(false);
        setSelectedAgent(null);
        setSearchQuery('');
        onRefreshAgents();
        if (onAssociateAgent) {
          onAssociateAgent();
        }
      } else {
        throw new Error(result.error || 'Failed to associate agent');
      }
    } catch (error) {
      console.error('Error associating agent:', error);
      setAssociateError(error instanceof Error ? error.message : 'Failed to associate agent');
    } finally {
      setIsAssociating(false);
    }
  }, [selectedAgent, organizationId, onRefreshAgents, onAssociateAgent]);

  // Filter agents based on search query - memoized to avoid recalculation
  const filteredAgents = useMemo(() => {
    if (!searchQuery.trim()) return availableAgents;
    const queryLower = searchQuery.toLowerCase();
    return availableAgents.filter((agent) =>
      agent.appName.toLowerCase().includes(queryLower) ||
      agent.workspaceName?.toLowerCase().includes(queryLower)
    );
  }, [availableAgents, searchQuery]);

  // Function to handle agent deletion - memoized with useCallback
  const handleDeleteAgent = useCallback(async () => {
    if (!agentToDelete) return;

    setIsDeletingAgent(true);
    try {
      // Optimistic UI: close the modal immediately
      setShowDeleteModal(false);
      const deletedAgentName = agentToDelete.name;
      const agentId = agentToDelete.id;
      setAgentToDelete(null);

      // Helper: fire-and-forget Dify deletion with timeout, do not block UX
      const difyCleanup = (async () => {
        if (!agentToDelete.chatbot_key) {
          return { success: true } as { success: boolean; error?: unknown };
        }
        try {
          const { difyAgentService } = await import('../../service/difyAgentService');
          const organizationId = agentToDelete.organization_id || agentId.split('_')[0] || 'default';

          // 5s timeout wrapper to avoid long hangs
          const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T> => new Promise<T>((resolve, reject) => {
            const t = setTimeout(() => reject(new Error('Dify cleanup timeout')), ms);
            p
              .then((v) => { clearTimeout(t); resolve(v); })
              .catch((e) => { clearTimeout(t); reject(e); });
          });

          const res = await withTimeout(
            difyAgentService.deleteDifyAgent({ agentName: agentId, organizationId }),
            5000
          );
          return res as { success: boolean; error?: unknown };
        } catch (e) {
return { success: false, error: e } as { success: boolean; error?: unknown };
        }
      })();

      // Backend deletion (authoritative) — run in parallel
      const backendDeletion = agentConfigService.deleteAgentByName(agentId);

      const [backendResult] = await Promise.allSettled([backendDeletion, difyCleanup]);

      if (backendResult.status === 'fulfilled' && backendResult.value?.success) {
        onRefreshAgents();
      } else {
        const message = backendResult.status === 'fulfilled'
          ? backendResult.value?.message || 'Unknown error'
          : (backendResult.reason as Error)?.message || 'Unknown error';
      }
    } catch (error) {
    } finally {
      setIsDeletingAgent(false);
    }
  }, [agentToDelete, onRefreshAgents]);

  // Generate avatar color - using website's green theme (same color for all agents) - memoized
  const getAvatarColor = useCallback((name: string) => {
    // Using the same green color as the website (green-600 to match from-green-600)
    return '#16A34A'; // green-600
  }, []);

  // Get status badge styling - memoized
  const getStatusBadge = useCallback((status: string) => {
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
  }, []);

  // Combined loading state: show loading if either initial load or refresh is in progress - memoized
  const isLoading = useMemo(() => isLoadingAgents || isRefreshingAgents, [isLoadingAgents, isRefreshingAgents]);

  // 1. Error State (show first, before loading check)
  if (agentsError) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="flex-1 p-6 overflow-y-auto">
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
        </div>
      </div>
    );
  }

  // 2. Loading State (show loading spinner when loading AND no agents to display)
  // OR when we haven't loaded yet (agentsLoaded is false) and have no agents
  if ((isLoading && agents.length === 0) || (!agentsLoaded && agents.length === 0)) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-6 w-6 text-green-500 animate-spin" />
              <span className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Loading agents...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. No Agents Found (only show when loading is complete AND agents array is empty)
  // This prevents flickering by ensuring we've actually finished loading
  if (agentsLoaded && !isLoading && agents.length === 0) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="flex-1 p-6 overflow-y-auto">
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
        </div>
      </div>
    );
  }

  // 4. Normal View (show agents - during refresh, old agents remain visible until new ones load)
  return (
    <div className="w-full h-full flex flex-col">
        <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Associate Agent Card - First */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleOpenAssociateModal();
            }}
            className={`group rounded-xl shadow-md hover:shadow-lg border overflow-hidden transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col ${isDarkMode
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:border-green-500/50'
              : 'bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:border-green-300'
              }`}
          >
            {/* Header with professional icon */}
            <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white shadow-md bg-gradient-to-br from-green-600 to-emerald-600 group-hover:from-green-700 group-hover:to-emerald-700 transition-all duration-300 flex-shrink-0">
                  <Link2 className="h-8 w-8" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-xl font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Associate Agent
                  </h3>
                  <p className={`text-sm mt-1.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Link existing agent from Main App
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className={`p-6 flex-1 ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/50'}`}>
              <div className={`p-5 rounded-lg ${isDarkMode ? 'bg-gray-700/30 border border-gray-600/50' : 'bg-gray-50 border border-gray-200'}`}>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isDarkMode ? 'bg-green-400' : 'bg-green-600'}`}></div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Connect agents from Main App
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isDarkMode ? 'bg-green-400' : 'bg-green-600'}`}></div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Use existing configurations
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className={`p-5 border-t ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenAssociateModal();
                }}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-2.5 px-4 rounded-lg transition-all duration-200 shadow-sm font-medium text-sm flex items-center justify-center gap-2"
              >
                <Link2 className="w-4 h-4" />
                Associate Agent
              </button>
            </div>
          </div>

          {/* Create New Agent Card - Second */}
          <div
            onClick={onCreateAgent}
            className={`group rounded-xl shadow-md hover:shadow-lg border overflow-hidden transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col ${isDarkMode
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:border-blue-500/50'
              : 'bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:border-blue-300'
              }`}
          >
            {/* Header with professional icon */}
            <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white shadow-md bg-gradient-to-br from-green-600 to-emerald-600 group-hover:from-green-700 group-hover:to-emerald-700 transition-all duration-300 flex-shrink-0">
                  <Plus className="h-8 w-8" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-xl font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Create New Agent
                  </h3>
                  <p className={`text-sm mt-1.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Deploy intelligent AI assistants
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className={`p-6 flex-1 ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/50'}`}>
              <div className={`p-5 rounded-lg ${isDarkMode ? 'bg-gray-700/30 border border-gray-600/50' : 'bg-gray-50 border border-gray-200'}`}>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isDarkMode ? 'bg-green-400' : 'bg-green-600'}`}></div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Choose from Knowledge or Action agents
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isDarkMode ? 'bg-green-400' : 'bg-green-600'}`}></div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Configure advanced AI capabilities
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className={`p-5 border-t ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateAgent();
                }}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-2.5 px-4 rounded-lg transition-all duration-200 shadow-sm font-medium text-sm flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Agent
              </button>
            </div>
          </div>

          {/* Render actual agents */}
          {agents.map((agent) => (
              <div
                key={agent.id}
                className={`rounded-xl shadow-md hover:shadow-lg border overflow-hidden transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full ${isDarkMode
                  ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                  : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
              >
                {/* Header with avatar and name */}
                <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-semibold shadow-md overflow-hidden flex-shrink-0"
                      style={{ backgroundColor: getAvatarColor(agent.name) }}
                    >
                      {agent.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-lg font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {getAgentDisplayName(agent)}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Description preview */}
                <div className={`px-6 py-5 flex-1 min-h-[100px] flex items-start ${isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50'
                  }`}>
                  <p className={`text-sm line-clamp-3 leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {agent.initial_message || agent.description || "No description available."}
                  </p>
                </div>

                {/* Actions */}
                <div className={`p-5 border-t ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                  {/* Primary Action - Full Width */}
                  <button
                    onClick={() => onOpenAgent(agent)}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 px-4 rounded-lg transition-all duration-200 shadow-sm font-medium text-sm flex items-center justify-center gap-2 mb-3"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Open Agent
                  </button>
                  
                  {/* Secondary Actions - Icon Buttons with Hover Labels */}
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onEditAgent(agent)}
                      className={`group relative px-3 py-2 rounded-lg transition-all duration-300 ease-in-out flex items-center justify-center gap-1.5 ${isDarkMode
                        ? 'bg-gray-700/50 hover:bg-gray-600 text-gray-300 hover:text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      <Edit className="w-4 h-4 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
                      <span className={`text-xs font-medium whitespace-nowrap transition-all duration-300 ease-in-out ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      } ${
                        'max-w-0 opacity-0 overflow-hidden group-hover:max-w-[50px] group-hover:opacity-100 group-hover:ml-1'
                      }`}>
                        Edit
                      </span>
                    </button>
                    <button
                      onClick={() => showQrCodeModal(agent)}
                      className={`group relative px-3 py-2 rounded-lg transition-all duration-300 ease-in-out flex items-center justify-center gap-1.5 ${isDarkMode
                        ? 'bg-gray-700/50 hover:bg-gray-600 text-gray-300 hover:text-green-400'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-green-600'
                        }`}
                    >
                      <QrCode className="w-4 h-4 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
                      <span className={`text-xs font-medium whitespace-nowrap transition-all duration-300 ease-in-out ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      } ${
                        'max-w-0 opacity-0 overflow-hidden group-hover:max-w-[40px] group-hover:opacity-100 group-hover:ml-1'
                      }`}>
                        QR
                      </span>
                    </button>
                    <button
                      onClick={() => showDeleteConfirmation(agent)}
                      className={`group relative px-3 py-2 rounded-lg transition-all duration-300 ease-in-out flex items-center justify-center gap-1.5 ${isDarkMode
                        ? 'bg-gray-700/50 hover:bg-gray-600 text-gray-300 hover:text-red-400'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-red-600'
                        }`}
                    >
                      <Trash2 className="w-4 h-4 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
                      <span className={`text-xs font-medium whitespace-nowrap transition-all duration-300 ease-in-out ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      } ${
                        'max-w-0 opacity-0 overflow-hidden group-hover:max-w-[60px] group-hover:opacity-100 group-hover:ml-1'
                      }`}>
                        Delete
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

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

        {/* Success modal removed */}

        {/* Associate Agent Modal */}
        {showAssociateModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
            <div
              className={`relative p-6 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col ${isDarkMode
                ? 'bg-gray-800 border border-gray-700'
                : 'bg-white border border-gray-200'
                }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'}`}>
                    <Link2 className={`w-6 h-6 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                  </div>
                  <div>
                    <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Associate Agent from Main App
                    </h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Select an agent to link to your organization
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!isAssociating) {
                      setShowAssociateModal(false);
                      setSelectedAgent(null);
                      setSearchQuery('');
                      setAssociateError(null);
                    }
                  }}
                  disabled={isAssociating}
                  className={`p-1.5 rounded-lg transition-all ${isDarkMode
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-white disabled:opacity-50'
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700 disabled:opacity-50'
                    }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Input */}
              <div className="mb-4">
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    type="text"
                    placeholder="Search agents by name or workspace..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:outline-none focus:ring-2 focus:ring-green-500`}
                  />
                </div>
              </div>

              {/* Error Message */}
              {associateError && (
                <div className={`mb-4 p-3 rounded-lg ${isDarkMode ? 'bg-red-900/20 border border-red-800/50' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>{associateError}</p>
                </div>
              )}

              {/* Agents List */}
              <div className="flex-1 overflow-y-auto mb-6">
                {isLoadingAgentsList ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
                    <span className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Loading agents from Main App...
                    </span>
                  </div>
                ) : filteredAgents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Bot className={`w-12 h-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                    <p className={`mt-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {searchQuery ? 'No agents found matching your search' : 'No agents available in Main App'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredAgents.map((agent) => (
                      <div
                        key={agent.appId}
                        onClick={() => setSelectedAgent(agent)}
                        className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${selectedAgent?.appId === agent.appId
                          ? isDarkMode
                            ? 'border-green-500 bg-green-900/20'
                            : 'border-green-500 bg-green-50'
                          : isDarkMode
                            ? 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {agent.appName}
                            </h4>
                            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              Workspace: {agent.workspaceName || agent.workspaceId.substring(0, 8) + '...'}
                            </p>
                          </div>
                          {selectedAgent?.appId === agent.appId && (
                            <CheckCircle className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Agent Info */}
              {selectedAgent && (
                <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50 border border-gray-600' : 'bg-gray-50 border border-gray-200'}`}>
                  <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Selected Agent:
                  </p>
                  <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {selectedAgent.appName}
                  </p>
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Workspace ID: {selectedAgent.workspaceId}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (!isAssociating) {
                      setShowAssociateModal(false);
                      setSelectedAgent(null);
                      setSearchQuery('');
                      setAssociateError(null);
                    }
                  }}
                  disabled={isAssociating}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${isDarkMode
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssociateAgent}
                  disabled={!selectedAgent || isAssociating}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${isAssociating || !selectedAgent
                    ? 'bg-green-400 text-white cursor-not-allowed'
                    : isDarkMode
                      ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-500/20'
                      : 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-500/30'
                    }`}
                >
                  {isAssociating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Associating...
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4" />
                      Associate Agent
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && agentToDelete && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[9999] p-4"
          onClick={() => {
            if (!isDeletingAgent) {
              setShowDeleteModal(false);
              setAgentToDelete(null);
            }
          }}
        >
          <div 
            className={`relative p-6 rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 ${isDarkMode
              ? 'bg-gray-800 border border-gray-700'
              : 'bg-white border border-gray-200'
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => {
                if (!isDeletingAgent) {
                  setShowDeleteModal(false);
                  setAgentToDelete(null);
                }
              }}
              disabled={isDeletingAgent}
              className={`absolute top-4 right-4 p-1.5 rounded-lg transition-all ${isDarkMode
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white disabled:opacity-50'
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700 disabled:opacity-50'
                }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center pt-2">
              {/* Warning icon */}
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDarkMode
                ? 'bg-red-900/30 border-2 border-red-800/50'
                : 'bg-red-50 border-2 border-red-200'
                }`}>
                <Trash2 className={`w-7 h-7 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
              </div>

              {/* Title */}
              <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Delete Agent?
              </h3>

              {/* Warning message */}
              <div className={`p-4 rounded-lg mb-6 text-left ${isDarkMode
                ? 'bg-gray-900/50 border border-gray-700'
                : 'bg-gray-50 border border-gray-200'
                }`}>
                <p className={`text-sm leading-relaxed mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  You are about to delete <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>"{getAgentDisplayName(agentToDelete)}"</span>. This action cannot be undone.
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                  ⚠️ All agent data, configurations, and conversations will be permanently removed.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setAgentToDelete(null);
                  }}
                  disabled={isDeletingAgent}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${isDarkMode
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAgent}
                  disabled={isDeletingAgent}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${isDeletingAgent
                    ? 'bg-red-400 text-white cursor-not-allowed'
                    : isDarkMode
                    ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/20'
                    : 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/30'
                    }`}
                >
                  {isDeletingAgent ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
  );
}

// Export memoized component to prevent unnecessary re-renders
export default React.memo(AgentCards);
