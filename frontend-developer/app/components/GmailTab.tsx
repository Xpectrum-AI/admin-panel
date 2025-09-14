'use client';

import React, { useState, useEffect } from 'react';
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
  MessageCircle
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { GmailService, GmailAccount, GmailMessage, GmailAssignment, AgentMappingsResponse, AgentMapping, ConversationMappingsResponse, ConversationMapping, WebhookTestRequest, WebhookTestResponse } from '../../service/gmailService';

interface GmailTabProps { }

export default function GmailTab({ }: GmailTabProps) {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<'configuration' | 'analytics' | 'conversations' | 'webhook'>('conversations');
  const [selectedAccount, setSelectedAccount] = useState<AgentMapping | null>(null);
  const [agentMappings, setAgentMappings] = useState<AgentMappingsResponse | null>(null);
  const [conversationMappings, setConversationMappings] = useState<ConversationMappingsResponse | null>(null);
  const [availableAgents, setAvailableAgents] = useState<Array<{ id: string, name: string, status: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateMappingModal, setShowCreateMappingModal] = useState(false);

  // Form state for creating new agent mapping
  const [newMapping, setNewMapping] = useState({
    emailAddress: '',
    description: ''
  });

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
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mappingsData, conversationMappingsData, agentsData] = await Promise.all([
        GmailService.getGmailAccounts(),
        GmailService.getConversationMappings(),
        GmailService.getAvailableAgents()
      ]);
      setAgentMappings(mappingsData);
      setConversationMappings(conversationMappingsData);
      setAvailableAgents(agentsData);

      if (mappingsData.mappings.length > 0) {
        setSelectedAccount(mappingsData.mappings[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSelect = async (mapping: AgentMapping) => {
    setSelectedAccount(mapping);
  };


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
              onClick={() => setActiveTab('conversations')}
              className={`group relative px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg font-medium text-xs sm:text-sm transition-all duration-300 flex items-center gap-1 sm:gap-2 whitespace-nowrap ${activeTab === 'conversations'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg'
                : isDarkMode
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Conversations</span>
              <span className="sm:hidden">Chats</span>
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
              <div className="flex items-center justify-between mb-3 sm:mb-4">
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

              <div className="space-y-2">
                {agentMappings?.mappings.map((mapping, index) => (
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




            {activeTab === 'conversations' && (
              <div className="flex-1 p-3 sm:p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Conversation Mappings
                    </h3>
                    <div className="flex items-center gap-3">
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {conversationMappings?.count || 0} conversations
                      </div>
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

                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <RefreshCw className="h-6 w-6 animate-spin text-gray-500" />
                    </div>
                  ) : conversationMappings?.mappings.length === 0 ? (
                    <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">No conversation mappings found</p>
                      <p className="text-sm">Conversation mappings will appear here when they are created.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {conversationMappings?.mappings.map((mapping, index) => (
                        <div
                          key={mapping.id || index}
                          className={`p-4 rounded-lg border ${isDarkMode
                            ? 'bg-gray-700/50 border-gray-600'
                            : 'bg-white border-gray-200'
                            }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-500/10 rounded-lg">
                                <MessageCircle className="h-5 w-5 text-purple-500" />
                              </div>
                              <div>
                                <h4 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  Conversation {mapping.conversation_id || `#${index + 1}`}
                                </h4>
                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {mapping.email_address || 'No email address'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${isDarkMode
                                ? 'bg-green-900/30 text-green-400'
                                : 'bg-green-100 text-green-700'
                                }`}>
                                Active
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className={isDarkMode ? 'text-gray-500' : 'text-gray-500'}>
                              Created: {mapping.created_at ? new Date(mapping.created_at).toLocaleDateString() : 'Unknown'}
                            </span>
                            <span className={isDarkMode ? 'text-gray-500' : 'text-gray-500'}>
                              Updated: {mapping.updated_at ? new Date(mapping.updated_at).toLocaleDateString() : 'Unknown'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

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
    </div>
  );
}

