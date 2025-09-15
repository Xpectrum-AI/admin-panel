'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  Settings,
  BarChart3,
  Activity,
  Plus,
  Search,
  Filter,
  RefreshCw,
  User,
  Clock,
  AlertCircle,
  CheckCircle,
  MoreVertical,
  Send,
  Archive,
  Trash2,
  Star,
  StarOff,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Bot,
  Users,
  Calendar,
  Tag,
  MessageCircle,
  Edit,
  Loader2
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { GmailService, GmailAccount, GmailMessage, GmailAssignment, AgentMappingsResponse, AgentMapping, ConversationMappingsResponse, ConversationMapping, WebhookTestRequest, WebhookTestResponse } from '../../service/gmailService';
import { getAgentsByOrganization } from '../../service/phoneNumberService';
import { useOrganizationId, isAssigned } from './utils/phoneNumberUtils';
import { Agent, ApiResponse } from './types/phoneNumbers';

interface GmailTabProps { }

export default function GmailTab({ }: GmailTabProps) {
  const { isDarkMode } = useTheme();
  const getOrganizationId = useOrganizationId();

  const [activeTab, setActiveTab] = useState<'configuration' | 'analytics' | 'webhook'>('configuration');
  const [selectedAccount, setSelectedAccount] = useState<AgentMapping | null>(null);
  const [agentMappings, setAgentMappings] = useState<AgentMappingsResponse | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [showCreateMappingModal, setShowCreateMappingModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state for creating new agent mapping
  const [newMapping, setNewMapping] = useState({
    emailAddress: '',
    description: ''
  });

  // Agent assignment state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [assigningAgent, setAssigningAgent] = useState('');
  const [assigningEmail, setAssigningEmail] = useState('');
  const [editingMapping, setEditingMapping] = useState<AgentMapping | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Webhook conversations state
  const [webhookConversations, setWebhookConversations] = useState<WebhookTestResponse | null>(null);
  const [webhookLoading, setWebhookLoading] = useState(false);

  // Webhook message sending state
  const [webhookMessage, setWebhookMessage] = useState<WebhookTestRequest>({
    from: '',
    to: '',
    subject: '',
    email: ''
  });
  const [webhookMessageResponse, setWebhookMessageResponse] = useState<WebhookTestResponse | null>(null);
  const [showWebhookMessageModal, setShowWebhookMessageModal] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadData();
    loadAgents();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const mappingsData = await GmailService.getGmailAccounts();
      setAgentMappings(mappingsData);

      if (mappingsData.mappings.length > 0) {
        setSelectedAccount(mappingsData.mappings[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAgents = useCallback(async () => {
    setLoadingAgents(true);
    try {
      const orgId = getOrganizationId();

      if (!orgId) {
        setAgents([]);
        return;
      }

      const response: ApiResponse<{ agents: Record<string, unknown> }> = await getAgentsByOrganization(orgId);

      if (response.success && response.data) {
        const agentsData = response.data;

        // Extract agent_prefix from the agents object
        if (agentsData.agents && typeof agentsData.agents === 'object') {
          const agentList: Agent[] = Object.keys(agentsData.agents).map(agentPrefix => ({
            agent_prefix: agentPrefix,
            name: agentPrefix,
            organization_id: orgId,
            ...(agentsData.agents[agentPrefix] as Record<string, unknown>)
          }));

          setAgents(agentList);
        } else {
          setAgents([]);
        }
      } else {
        setAgents([]);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error loading agents:', errorMessage);
      setAgents([]);
    } finally {
      setLoadingAgents(false);
    }
  }, [getOrganizationId]);

  const handleAccountSelect = async (mapping: AgentMapping) => {
    setSelectedAccount(mapping);
  };

  const handleAssignAgent = async () => {
    if (!assigningEmail.trim()) {
      setError('Please enter an email address.');
      return;
    }

    if (!assigningAgent.trim()) {
      setError('Please select an agent.');
      return;
    }

    setAssigning(true);
    setError(null);
    setSuccess(null);

    try {
      // Get agent URL and API key from environment variables
      const agentUrl = process.env.NEXT_PUBLIC_AGENT_URL || '';
      const apiKey = process.env.NEXT_PUBLIC_AGENT_API_KEY || '';

      await GmailService.createAgentMapping(
        assigningEmail,
        agentUrl,
        apiKey,
        assigningAgent
      );

      setSuccess(`Email ${assigningEmail} assigned to agent ${assigningAgent} successfully!`);
      setShowAssignModal(false);
      setAssigningEmail('');
      setAssigningAgent('');

      // Refresh data
      await loadData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Error assigning agent: ${errorMessage}`);
      console.error('Error assigning agent:', err);
    } finally {
      setAssigning(false);
    }
  };

  const handleEditMapping = (mapping: AgentMapping) => {
    setEditingMapping(mapping);
    setAssigningAgent(mapping.description);
    setAssigningEmail(mapping.email_address);
    setShowEditModal(true);
  };

  const handleUpdateMapping = async () => {
    if (!editingMapping) return;

    if (!assigningEmail.trim()) {
      setError('Please enter an email address.');
      return;
    }

    if (!assigningAgent.trim()) {
      setError('Please select an agent.');
      return;
    }

    setAssigning(true);
    setError(null);
    setSuccess(null);

    try {
      // Get agent URL and API key from environment variables
      const agentUrl = process.env.NEXT_PUBLIC_AGENT_URL || '';
      const apiKey = process.env.NEXT_PUBLIC_AGENT_API_KEY || '';

      // For now, we'll create a new mapping (in a real app, you'd have an update endpoint)
      await GmailService.createAgentMapping(
        assigningEmail,
        agentUrl,
        apiKey,
        assigningAgent
      );

      setSuccess(`Email mapping updated successfully!`);
      setShowEditModal(false);
      setEditingMapping(null);
      setAssigningEmail('');
      setAssigningAgent('');

      // Refresh data
      await loadData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Error updating mapping: ${errorMessage}`);
      console.error('Error updating mapping:', err);
    } finally {
      setAssigning(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(clearMessages, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);


  const handleCreateMapping = async () => {
    try {
      // Get agent URL and API key from environment variables
      const agentUrl = process.env.NEXT_PUBLIC_AGENT_URL || '';
      const apiKey = process.env.NEXT_PUBLIC_AGENT_API_KEY || '';

      await GmailService.createAgentMapping(
        newMapping.emailAddress,
        agentUrl,
        apiKey,
        newMapping.description
      );
      setShowCreateMappingModal(false);
      setNewMapping({ emailAddress: '', description: '' });
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Error creating agent mapping:', error);
    }
  };

  const handleFetchWebhookConversations = async () => {
    try {
      setWebhookLoading(true);
      const response = await GmailService.getConversationsViaWebhook();
      setWebhookConversations(response);
    } catch (error) {
      console.error('Error fetching webhook conversations:', error);
      alert('Failed to fetch conversations via webhook. Please try again.');
    } finally {
      setWebhookLoading(false);
    }
  };

  const handleSendWebhookMessage = async () => {
    if (!webhookMessage.from || !webhookMessage.to || !webhookMessage.subject || !webhookMessage.email) {
      alert('Please fill in all message fields');
      return;
    }

    try {
      setWebhookLoading(true);
      const response = await GmailService.sendMessageViaWebhook(webhookMessage);
      setWebhookMessageResponse(response);
      setShowWebhookMessageModal(false);
      setWebhookMessage({ from: '', to: '', subject: '', email: '' });
      alert('Message sent via webhook successfully!');
    } catch (error) {
      console.error('Error sending webhook message:', error);
      alert('Failed to send message via webhook. Please try again.');
    } finally {
      setWebhookLoading(false);
    }
  };


  return (
    <div className="max-w-7xl mx-auto p-2 sm:p-4 lg:p-6">
      <div className={`rounded-xl sm:rounded-2xl border shadow-xl backdrop-blur-sm ${isDarkMode ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-gray-700/50' : 'bg-gradient-to-br from-white via-gray-50 to-white border-gray-200/50'}`}>
        {/* Header */}
        <div className={`px-3 sm:px-6 lg:px-8 py-4 sm:py-6 border-b ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl sm:rounded-2xl">
                <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className={`text-xl sm:text-2xl lg:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Gmail Management
                </h1>
                <p className={`text-sm sm:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Manage Gmail accounts, assign emails, and track conversations
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={loadData}
                disabled={loading}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Tabs */}
        <div className={`border-b ${isDarkMode ? 'border-gray-700/50 bg-gray-900' : 'border-gray-200/50 bg-white'}`}>
          <nav className="flex flex-wrap sm:flex-nowrap space-x-1 px-3 sm:px-6 lg:px-8 py-2 overflow-x-auto">

            <button
              onClick={() => setActiveTab('configuration')}
              className={`group relative px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg font-medium text-xs sm:text-sm transition-all duration-300 flex items-center gap-1 sm:gap-2 whitespace-nowrap ${activeTab === 'configuration'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                : isDarkMode
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Configuration</span>
              <span className="sm:hidden">Config</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`group relative px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg font-medium text-xs sm:text-sm transition-all duration-300 flex items-center gap-1 sm:gap-2 whitespace-nowrap ${activeTab === 'analytics'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg'
                : isDarkMode
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Stats</span>
            </button>

            <button
              onClick={() => setActiveTab('webhook')}
              className={`group relative px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg font-medium text-xs sm:text-sm transition-all duration-300 flex items-center gap-1 sm:gap-2 whitespace-nowrap ${activeTab === 'webhook'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                : isDarkMode
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <Send className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Webhook Test</span>
              <span className="sm:hidden">Webhook</span>
            </button>

          </nav>
        </div>

        {/* Content Area */}
        <div className="flex flex-col lg:flex-row h-[600px] sm:h-[700px]">
          {/* Sidebar - Gmail Accounts */}
          <div className={`w-full lg:w-80 border-r ${isDarkMode ? 'border-gray-700/50 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
            <div className="p-3 sm:p-4">
              {/* Header with Search and Assign Button */}
              <div className="space-y-4 mb-4">
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm sm:text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Agent Mappings
                  </h3>
                  <button
                    onClick={() => setShowCreateMappingModal(true)}
                    className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative group">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors ${isDarkMode ? 'text-gray-500 group-focus-within:text-blue-400' : 'text-gray-400 group-focus-within:text-blue-500'}`} />
                  <input
                    type="text"
                    placeholder="Search email addresses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    aria-label="Search email addresses"
                    className={`w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 backdrop-blur-sm transition-all duration-300 text-sm ${isDarkMode ? 'border-gray-600 bg-gray-700/80 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white/80 text-gray-900 placeholder-gray-400'}`}
                  />
                </div>

                {/* Assign Agent Button */}
                <button
                  onClick={() => {
                    setAssigningAgent('');
                    setAssigningEmail('');
                    setShowAssignModal(true);
                  }}
                  className="group relative w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-sm font-semibold">Assign Agent</span>
                </button>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="p-3 mb-4 rounded-lg bg-red-500/20 text-red-200 flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {success && (
                <div className="p-3 mb-4 rounded-lg bg-green-500/20 text-green-200 flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  <p>{success}</p>
                </div>
              )}

              {/* Agent Mappings List */}
              <div className="space-y-2">
                {agentMappings?.mappings
                  .filter(mapping =>
                    !searchTerm ||
                    mapping.email_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    mapping.description.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((mapping, index) => (
                    <div
                      key={mapping.email_address}
                      onClick={() => handleAccountSelect(mapping)}
                      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${selectedAccount?.email_address === mapping.email_address
                        ? isDarkMode
                          ? 'bg-red-500/20 border border-red-500/30'
                          : 'bg-red-50 border border-red-200'
                        : isDarkMode
                          ? 'hover:bg-gray-700/50'
                          : 'hover:bg-gray-100'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {mapping.description.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`text-xs text-green-500`}>
                            active
                          </span>
                        </div>
                      </div>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                        {mapping.email_address}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span className={isDarkMode ? 'text-gray-500' : 'text-gray-500'}>
                          Agent URL: {mapping.agent_url.split('/').pop()}
                        </span>
                        <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {new Date(mapping.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">




            {activeTab === 'configuration' && (
              <div className="flex-1 p-3 sm:p-4">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Gmail Agent Assignments
                    </h3>
                    <div className="flex items-center gap-3">
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {agentMappings?.mappings.length || 0} mappings
                      </div>
                    </div>
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                      <span className={`ml-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Loading Gmail mappings...
                      </span>
                    </div>
                  ) : agentMappings?.mappings.length === 0 ? (
                    <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">No Gmail mappings found</p>
                      <p className="text-sm">Gmail mappings will appear here when they are created.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className={`w-full ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                        <thead className={`sticky top-0 z-10 ${isDarkMode ? 'bg-gray-800 border-b border-gray-700' : 'bg-gray-50 border-b border-gray-200'}`}>
                          <tr>
                            <th className="text-left py-4 px-6 font-semibold text-sm">
                              Email Address
                            </th>
                            <th className="text-left py-4 px-6 font-semibold text-sm">
                              Agent
                            </th>
                            <th className="text-left py-4 px-6 font-semibold text-sm">
                              Status
                            </th>
                            <th className="text-left py-4 px-6 font-semibold text-sm">
                              Last Updated
                            </th>
                            <th className="text-left py-4 px-6 font-semibold text-sm">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {agentMappings?.mappings.map((mapping, index) => (
                            <tr
                              key={mapping.email_address}
                              className={`border-b transition-colors duration-200 ${isDarkMode
                                ? 'border-gray-700 hover:bg-gray-800/50'
                                : 'border-gray-200 hover:bg-gray-50'
                                } ${index % 2 === 0 ? (isDarkMode ? 'bg-gray-900/30' : 'bg-white') : (isDarkMode ? 'bg-gray-800/30' : 'bg-gray-50/50')}`}
                            >
                              {/* Email Address Column */}
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-2">
                                  <Mail className={`h-4 w-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                                  <div>
                                    <div className="font-medium text-sm">
                                      {mapping.email_address}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Agent Column */}
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-2">
                                  <User className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                  <span className="text-sm">
                                    {mapping.description.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </span>
                                  <CheckCircle className={`h-4 w-4 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                                </div>
                              </td>

                              {/* Status Column */}
                              <td className="py-4 px-6">
                                <span className={`text-xs px-2 py-1 rounded-full ${isDarkMode
                                  ? 'bg-green-900/30 text-green-400'
                                  : 'bg-green-100 text-green-700'
                                  }`}>
                                  Active
                                </span>
                              </td>

                              {/* Last Updated Column */}
                              <td className="py-4 px-6">
                                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {new Date(mapping.updated_at).toLocaleDateString()}
                                </span>
                              </td>

                              {/* Actions Column */}
                              <td className="py-4 px-6">
                                <button
                                  onClick={() => handleEditMapping(mapping)}
                                  className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${isDarkMode
                                    ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                                    }`}
                                  title="Edit mapping"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="flex-1 p-3 sm:p-4">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Gmail Analytics
                    </h3>
                  </div>

                  <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Analytics Coming Soon</p>
                    <p className="text-sm">Gmail analytics and metrics will be available here.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'webhook' && (
              <div className="flex-1 p-3 sm:p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Webhook Test
                    </h3>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowWebhookMessageModal(true)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                      >
                        <Send className="h-4 w-4" />
                        Send Message
                      </button>
                      <button
                        onClick={handleFetchWebhookConversations}
                        disabled={webhookLoading}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${isDarkMode ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'}`}
                      >
                        <RefreshCw className={`h-4 w-4 ${webhookLoading ? 'animate-spin' : ''}`} />
                        Fetch via Webhook
                      </button>
                    </div>
                  </div>

                  {/* Webhook Conversations Section */}
                  {webhookConversations && (
                    <div className="mt-8 p-4 rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-orange-500/10 rounded-lg">
                          <Activity className="h-4 w-4 text-orange-500" />
                        </div>
                        <h4 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          Webhook Response
                        </h4>
                      </div>

                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Status:</span>
                            <span className={`ml-2 px-2 py-1 rounded-full ${webhookConversations.status === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                              {webhookConversations.status}
                            </span>
                          </div>
                          <div>
                            <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>AI Generated:</span>
                            <span className={`ml-2 ${webhookConversations.email_info.ai_response_generated ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {webhookConversations.email_info.ai_response_generated ? 'Yes' : 'No'}
                            </span>
                          </div>
                          <div>
                            <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Response Sent:</span>
                            <span className={`ml-2 ${webhookConversations.email_info.automated_response_sent ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {webhookConversations.email_info.automated_response_sent ? 'Yes' : 'No'}
                            </span>
                          </div>
                          <div>
                            <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Parsed Content:</span>
                            <span className={`ml-2 ${webhookConversations.email_info.has_parsed_content ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {webhookConversations.email_info.has_parsed_content ? 'Yes' : 'No'}
                            </span>
                          </div>
                        </div>

                        <div className="text-xs">
                          <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Message:</span>
                          <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                            {webhookConversations.message}
                          </p>
                        </div>

                        <div className="text-xs">
                          <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Timestamp:</span>
                          <span className={`ml-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                            {new Date(webhookConversations.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Webhook Message Response Section */}
                  {webhookMessageResponse && (
                    <div className="mt-8 p-4 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-green-500/10 rounded-lg">
                          <Send className="h-4 w-4 text-green-500" />
                        </div>
                        <h4 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          Message Sent Response
                        </h4>
                      </div>

                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Status:</span>
                            <span className={`ml-2 px-2 py-1 rounded-full ${webhookMessageResponse.status === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                              {webhookMessageResponse.status}
                            </span>
                          </div>
                          <div>
                            <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>AI Generated:</span>
                            <span className={`ml-2 ${webhookMessageResponse.email_info.ai_response_generated ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {webhookMessageResponse.email_info.ai_response_generated ? 'Yes' : 'No'}
                            </span>
                          </div>
                          <div>
                            <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Response Sent:</span>
                            <span className={`ml-2 ${webhookMessageResponse.email_info.automated_response_sent ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {webhookMessageResponse.email_info.automated_response_sent ? 'Yes' : 'No'}
                            </span>
                          </div>
                          <div>
                            <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Parsed Content:</span>
                            <span className={`ml-2 ${webhookMessageResponse.email_info.has_parsed_content ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {webhookMessageResponse.email_info.has_parsed_content ? 'Yes' : 'No'}
                            </span>
                          </div>
                        </div>

                        <div className="text-xs">
                          <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Message:</span>
                          <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                            {webhookMessageResponse.message}
                          </p>
                        </div>

                        <div className="text-xs">
                          <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Timestamp:</span>
                          <span className={`ml-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                            {new Date(webhookMessageResponse.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}


          </div>
        </div>
      </div>


      {/* Create Agent Mapping Modal */}
      {showCreateMappingModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl ${isDarkMode
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
            }`}>
            <div className="p-6">
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Create Agent Mapping
              </h3>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newMapping.emailAddress}
                    onChange={(e) => setNewMapping({ ...newMapping, emailAddress: e.target.value })}
                    placeholder="karthik@inbound.xpectrum-ai.com"
                    className={`w-full px-3 py-2 rounded-lg border ${isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                      }`}
                  />
                </div>
                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <strong>Agent URL:</strong> {process.env.NEXT_PUBLIC_AGENT_URL || 'Not configured'}
                  </p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <strong>API Key:</strong> {process.env.NEXT_PUBLIC_AGENT_API_KEY ? '••••••••' : 'Not configured'}
                  </p>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Description
                  </label>
                  <input
                    type="text"
                    value={newMapping.description}
                    onChange={(e) => setNewMapping({ ...newMapping, description: e.target.value })}
                    placeholder="customer agent"
                    className={`w-full px-3 py-2 rounded-lg border ${isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                      }`}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateMappingModal(false)}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateMapping}
                  className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Create Mapping
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Webhook Message Modal */}
      {showWebhookMessageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl ${isDarkMode
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
            }`}>
            <div className="p-6">
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Send Message via Webhook
              </h3>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    From Email
                  </label>
                  <input
                    type="email"
                    value={webhookMessage.from}
                    onChange={(e) => setWebhookMessage({ ...webhookMessage, from: e.target.value })}
                    placeholder="karthik@inbound.xpectrum-ai.com"
                    className={`w-full px-3 py-2 rounded-lg border ${isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                      }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    To Email
                  </label>
                  <input
                    type="email"
                    value={webhookMessage.to}
                    onChange={(e) => setWebhookMessage({ ...webhookMessage, to: e.target.value })}
                    placeholder="karthikiiitk@gmail.com"
                    className={`w-full px-3 py-2 rounded-lg border ${isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                      }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Subject
                  </label>
                  <input
                    type="text"
                    value={webhookMessage.subject}
                    onChange={(e) => setWebhookMessage({ ...webhookMessage, subject: e.target.value })}
                    placeholder="Hello Karthik"
                    className={`w-full px-3 py-2 rounded-lg border ${isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                      }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Email Body
                  </label>
                  <textarea
                    value={webhookMessage.email}
                    onChange={(e) => setWebhookMessage({ ...webhookMessage, email: e.target.value })}
                    placeholder="This is the plain text body of the email."
                    rows={4}
                    className={`w-full px-3 py-2 rounded-lg border ${isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                      }`}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowWebhookMessageModal(false)}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendWebhookMessage}
                  disabled={webhookLoading}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {webhookLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agent Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAssignModal(false)}>
          <div className={`rounded-xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-gray-800/95 backdrop-blur-md' : 'bg-white/95 backdrop-blur-md'}`} onClick={(e) => e.stopPropagation()}>
            <h3 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Assign Agent
            </h3>

            <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Select an agent and email address to create a new assignment.
            </p>

            {error && (
              <div className="p-3 mb-4 rounded-lg bg-red-500/20 text-red-200 flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 mb-4 rounded-lg bg-green-500/20 text-green-200 flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <p>{success}</p>
              </div>
            )}

            <div className="space-y-6">
              <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-blue-900/20 border border-blue-700/30' : 'bg-blue-50 border border-blue-200'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <User className={`h-4 w-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <label className={`block text-sm font-semibold ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                    Agent
                  </label>
                </div>
                <select
                  value={assigningAgent}
                  onChange={(e) => setAssigningAgent(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${isDarkMode ? 'border-blue-600 bg-gray-700 text-gray-200' : 'border-blue-200 bg-white text-gray-900'}`}
                  disabled={loadingAgents}
                >
                  <option value="">Select an agent</option>
                  {agents.map((agent, index) => (
                    <option key={agent.id || agent.name || agent.agent_prefix || `agent-${index}`} value={agent.name || agent.agent_prefix}>
                      {agent.name || agent.agent_prefix}
                    </option>
                  ))}
                </select>
              </div>

              <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-green-900/20 border border-green-700/30' : 'bg-green-50 border border-green-200'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Mail className={`h-4 w-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                  <label className={`block text-sm font-semibold ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                    Email Address
                  </label>
                </div>
                <input
                  type="email"
                  value={assigningEmail}
                  onChange={(e) => setAssigningEmail(e.target.value)}
                  placeholder="karthik@inbound.xpectrum-ai.com"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${isDarkMode ? 'border-green-600 bg-gray-700 text-gray-200' : 'border-green-200 bg-white text-gray-900'}`}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setAssigningAgent('');
                  setAssigningEmail('');
                  setError(null);
                  setSuccess(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                disabled={assigning}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignAgent}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                disabled={assigning || !assigningAgent.trim() || !assigningEmail.trim()}
              >
                {assigning ? <Loader2 className="h-4 w-4 animate-spin mx-auto mr-2" /> : null}
                Assign Agent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Mapping Modal */}
      {showEditModal && editingMapping && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowEditModal(false)}>
          <div className={`rounded-xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-gray-800/95 backdrop-blur-md' : 'bg-white/95 backdrop-blur-md'}`} onClick={(e) => e.stopPropagation()}>
            <h3 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Edit Agent Assignment
            </h3>

            <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Update the agent assignment for this email address.
            </p>

            {error && (
              <div className="p-3 mb-4 rounded-lg bg-red-500/20 text-red-200 flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 mb-4 rounded-lg bg-green-500/20 text-green-200 flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <p>{success}</p>
              </div>
            )}

            <div className="space-y-6">
              <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-blue-900/20 border border-blue-700/30' : 'bg-blue-50 border border-blue-200'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <User className={`h-4 w-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <label className={`block text-sm font-semibold ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                    Agent
                  </label>
                </div>
                <select
                  value={assigningAgent}
                  onChange={(e) => setAssigningAgent(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${isDarkMode ? 'border-blue-600 bg-gray-700 text-gray-200' : 'border-blue-200 bg-white text-gray-900'}`}
                  disabled={loadingAgents}
                >
                  <option value="">Select an agent</option>
                  {agents.map((agent, index) => (
                    <option key={agent.id || agent.name || agent.agent_prefix || `agent-${index}`} value={agent.name || agent.agent_prefix}>
                      {agent.name || agent.agent_prefix}
                    </option>
                  ))}
                </select>
              </div>

              <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-green-900/20 border border-green-700/30' : 'bg-green-50 border border-green-200'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Mail className={`h-4 w-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                  <label className={`block text-sm font-semibold ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                    Email Address
                  </label>
                </div>
                <input
                  type="email"
                  value={assigningEmail}
                  onChange={(e) => setAssigningEmail(e.target.value)}
                  placeholder="karthik@inbound.xpectrum-ai.com"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${isDarkMode ? 'border-green-600 bg-gray-700 text-gray-200' : 'border-green-200 bg-white text-gray-900'}`}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingMapping(null);
                  setAssigningAgent('');
                  setAssigningEmail('');
                  setError(null);
                  setSuccess(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                disabled={assigning}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateMapping}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                disabled={assigning || !assigningAgent.trim() || !assigningEmail.trim()}
              >
                {assigning ? <Loader2 className="h-4 w-4 animate-spin mx-auto mr-2" /> : null}
                Update Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

