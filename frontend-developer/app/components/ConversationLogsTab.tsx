'use client';

import React, { useState, useEffect } from 'react';
import ConversationViewer from './ConversationViewer';
import MonitoringChart from './MonitoringChart';

interface ConversationLogsTabProps {
  organizationId?: string;
}

interface Agent {
  id?: string;
  name: string;
  chatbot_api?: string;
  chatbot_key?: string;
  agent_id?: string;
}

export default function ConversationLogsTab({ organizationId }: ConversationLogsTabProps) {
  // Navigation state
  const [view, setView] = useState<'agents' | 'conversations' | 'chat'>('agents');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  
  // Agents
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [loadingAgents, setLoadingAgents] = useState(false);
  
  // Conversations
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);

  // Monitoring data
  const [monitoringData, setMonitoringData] = useState<any>(null);
  const [loadingMonitoring, setLoadingMonitoring] = useState(false);
  const [lastMonitoringUpdate, setLastMonitoringUpdate] = useState<Date | null>(null);

  // Tab toggle: 'conversations' or 'monitoring'
  const [activeTab, setActiveTab] = useState<'conversations' | 'monitoring'>('conversations');

  // Fetch agents on mount
  useEffect(() => {
    fetchAgents();
  }, [organizationId]);

  // Fetch agents
  const fetchAgents = async () => {
    if (!organizationId) {
      setMessage('Organization ID is required');
      setMessageType('error');
      return;
    }

    try {
      setLoadingAgents(true);
      const response = await fetch(`/api/agents/by-org/${organizationId}`, {
        headers: {
          'X-API-Key': process.env.NEXT_PUBLIC_LIVE_API_KEY || '',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch agents: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📦 Raw API response:', data);
      
      let agentsList: Agent[] = [];
      
      // Handle backend response: {status: 'success', agents: {...}}
      if (data.agents) {
        if (Array.isArray(data.agents)) {
          agentsList = data.agents;
        } else if (typeof data.agents === 'object' && data.agents !== null) {
          // Backend returns agents as object with agent names as keys
          // Example: { "test1_uuid": { id: "uuid", chatbot_api: "...", ... } }
          console.log('📦 Agents data is object, converting to array...');
          
          // Use Object.entries to preserve the key (agent name) and extract it
          agentsList = Object.entries(data.agents).map(([key, value]: [string, any]) => {
            // Extract agent name from key (e.g., "test1_2f1c9c6e..." -> "test1")
            const namePart = key.split('_')[0];
            return {
              ...value,
              name: value.name || namePart, // Use existing name or extract from key
              id: value.id || key.split('_').slice(1).join('_'), // Extract ID from key if not present
              agent_id: value.agent_id || key,
            };
          });
        }
      } else if (data.success && data.data) {
        // Alternative format: {success: true, data: [...]}
        if (Array.isArray(data.data)) {
          agentsList = data.data;
        } else if (typeof data.data === 'object' && data.data !== null) {
          console.log('📦 Data is object, converting to array...');
          
          // Use Object.entries to preserve the key (agent name)
          agentsList = Object.entries(data.data).map(([key, value]: [string, any]) => {
            const namePart = key.split('_')[0];
            return {
              ...value,
              name: value.name || namePart,
              id: value.id || key.split('_').slice(1).join('_'),
              agent_id: value.agent_id || key,
            };
          });
        }
      } else if (Array.isArray(data)) {
        agentsList = data;
      }

      console.log('📦 Processed agents list:', agentsList);

      if (agentsList.length > 0) {
        console.log('📋 First agent details:', agentsList[0]);
        console.log('📋 Agent fields:', Object.keys(agentsList[0]));
        setAgents(agentsList);
        setMessage(`✅ Found ${agentsList.length} agent(s)`);
        setMessageType('success');
      } else {
        setMessage('No agents found. Create an agent first in the Agents tab.');
        setMessageType('info');
      }
    } catch (error) {
      console.error('❌ Error fetching agents:', error);
      setMessage(`Failed to fetch agents: ${error instanceof Error ? error.message : String(error)}`);
      setMessageType('error');
    } finally {
      setLoadingAgents(false);
    }
  };

  // Fetch conversations for selected agent
  const fetchConversations = async (agent: Agent) => {
    try {
      setLoading(true);
      setMessage('📡 Fetching conversations...');
      setMessageType('info');
      
      console.log('🎯 Agent clicked:', agent);
      console.log('🎯 Agent name:', agent.name);
      console.log('🎯 Agent chatbot_api:', agent.chatbot_api);
      console.log('🎯 Agent chatbot_key:', agent.chatbot_key ? '***' + agent.chatbot_key.slice(-4) : 'NOT SET');
      console.log('🎯 All agent keys:', Object.keys(agent));
      
      const apiKey = agent.chatbot_key || '';
      
      if (!apiKey) {
        console.error('❌ No API key found for agent:', agent);
        setMessage('❌ Agent does not have an API key configured.');
        setMessageType('error');
        return;
      }
      
      console.log('🔍 Fetching conversations via backend API (Console API for all users)...');
      
      // Use our backend API to get ALL conversations (uses Console API which doesn't filter by user)
      const response = await fetch('/api/dify/all-conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend API error response:', errorText);
        throw new Error(`Failed to fetch conversations: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Conversations response:', data);
      
      const convList = data.conversations || [];
      
      // Sort conversations by updated_at descending (latest first)
      const sortedConvList = convList.sort((a: any, b: any) => {
        return (b.updated_at || 0) - (a.updated_at || 0);
      });
      
      if (sortedConvList.length === 0) {
        setMessage('ℹ️ No conversations found for this agent.');
        setMessageType('info');
      } else {
        setConversations(sortedConvList);
        setView('conversations');
        setMessage(`✅ Found ${sortedConvList.length} conversations`);
        setMessageType('success');
        
        // Fetch monitoring data in parallel
        fetchMonitoringData(agent);
      }
    } catch (error) {
      console.error('❌ Error fetching conversations:', error);
      setMessage(`Failed to fetch conversations: ${error instanceof Error ? error.message : String(error)}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch monitoring data
  const fetchMonitoringData = async (agent: Agent, isRefresh = false) => {
    if (!agent.chatbot_key) {
      console.warn('⚠️ No API key for monitoring');
      return;
    }

    try {
      setLoadingMonitoring(true);
      console.log(isRefresh ? '🔄 Refreshing monitoring data...' : '📊 Fetching monitoring data...');

      const response = await fetch('/api/dify/monitoring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: agent.chatbot_key,
          period: 30 // Last 30 days (temporary for debugging)
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Monitoring API error:', errorText);
        throw new Error(`Failed to fetch monitoring data: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Monitoring data received:', {
        conversations: data.statistics?.total_conversations,
        users: data.statistics?.total_end_users,
        messages: data.statistics?.total_messages,
        tokens: data.statistics?.total_tokens,
        avgInteractions: data.statistics?.avg_session_interactions,
        tokenSpeed: data.statistics?.token_output_speed,
      });
      
      setMonitoringData(data);
      setLastMonitoringUpdate(new Date());
      
      if (isRefresh) {
        setMessage('✅ Monitoring data refreshed!');
        setMessageType('success');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('❌ Error fetching monitoring data:', error);
      if (isRefresh) {
        setMessage('⚠️ Failed to refresh monitoring data');
        setMessageType('error');
        setTimeout(() => setMessage(''), 3000);
      }
    } finally {
      setLoadingMonitoring(false);
    }
  };

  // Auto-refresh monitoring data every 30 seconds when monitoring tab is active
  useEffect(() => {
    if (activeTab === 'monitoring' && selectedAgent && view === 'conversations') {
      console.log('🔄 Starting auto-refresh for monitoring (every 30s)...');
      
      // Fetch immediately if no data exists
      if (!monitoringData) {
        console.log('📊 No monitoring data, fetching immediately...');
        fetchMonitoringData(selectedAgent, false);
      }
      
      const interval = setInterval(() => {
        console.log('⏰ Auto-refresh triggered');
        fetchMonitoringData(selectedAgent, true);
      }, 30000); // 30 seconds

      return () => {
        console.log('🛑 Stopping auto-refresh');
        clearInterval(interval);
      };
    }
  }, [activeTab, selectedAgent, view]);
  
  // View conversation details
  const viewConversation = async (conversation: any) => {
    try {
      setLoading(true);
      setMessage('📡 Loading conversation details...');
      setMessageType('info');
      
      const apiKey = selectedAgent?.chatbot_key || '';
      
      if (!apiKey) {
        setMessage('❌ Agent does not have an API key configured.');
        setMessageType('error');
        return;
      }
      
      console.log('🔍 Fetching messages via App API...');
      console.log('📝 Conversation user_id:', conversation.user_id);
      
      // Extract base URL from chatbot_api
      const baseUrl = selectedAgent?.chatbot_api?.replace(/\/chat-messages$/, '') || 'https://demos.xpectrum-ai.com/v1';
      console.log('🔗 Base URL:', baseUrl);
      
      // Use the user_id from the conversation (fetched via Console API)
      const userId = conversation.user_id || 'preview-user';
      console.log('👤 Using user ID:', userId);
      
      // Call App API directly: GET /v1/messages
      const response = await fetch(`${baseUrl}/messages?user=${encodeURIComponent(userId)}&conversation_id=${encodeURIComponent(conversation.id)}&limit=100`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API error response:', errorText);
        throw new Error(`Failed to fetch messages: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const messages = data.data || [];
      
      console.log('✅ Messages response:', data);
      console.log('✅ Messages array:', messages);
      console.log('✅ Messages count:', messages.length);
      console.log('✅ First message:', messages[0]);
      
      // Update conversation with messages
      const updatedConversation = {
        ...conversation,
        messages: messages,
        created_at: conversation.created_at * 1000, // Convert to milliseconds for Date
        updated_at: (conversation.updated_at || conversation.created_at) * 1000,
      };
      
      console.log('✅ Updated conversation:', updatedConversation);
      
      setSelectedConversation(updatedConversation);
      setView('chat');
      setMessage(`✅ Loaded ${messages.length} messages`);
      setMessageType('success');
    } catch (error) {
      console.error('❌ Error fetching conversation:', error);
      setMessage(`Failed to load conversation: ${error instanceof Error ? error.message : String(error)}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // Render based on current view
  const renderContent = () => {
    // View 1: Agents List
    if (view === 'agents') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-slate-800 mb-2">Conversation Logs</h1>
              <p className="text-slate-600 text-lg">Select an agent to view conversation history</p>
            </div>
            
            {/* Message Alert */}
            {message && (
              <div className={`mb-6 p-4 rounded-xl shadow-md backdrop-blur-sm border ${
                messageType === 'success' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : messageType === 'error' 
                  ? 'bg-red-50 border-red-200 text-red-800' 
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}>
                <div className="flex items-center gap-3">
                  {messageType === 'success' && (
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {messageType === 'error' && (
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {messageType === 'info' && (
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <span className="font-medium">{message}</span>
                </div>
              </div>
            )}
            
            {/* Loading State */}
            {loadingAgents ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <p className="mt-6 text-slate-600 font-medium text-lg">Loading agents...</p>
              </div>
            ) : agents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agents.map((agent) => (
                  <button
                    key={agent.id || agent.name || Math.random()}
                    onClick={() => {
                      setSelectedAgent(agent);
                      fetchConversations(agent);
                    }}
                    disabled={loading}
                    className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl border-2 border-slate-200 hover:border-blue-400 transition-all duration-300 text-left disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                  >
                    {/* Background Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Content */}
                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                          {agent.name ? agent.name.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-xl text-slate-800 group-hover:text-blue-600 transition-colors">
                            {agent.name || 'Unnamed Agent'}
                          </h3>
                          <p className="text-sm text-slate-500 mt-0.5">AI Assistant</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-600">
                          <span className={`w-2 h-2 rounded-full ${(agent as any).status === 'active' || !('status' in agent) ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                          <span className="font-medium">{(agent as any).status || 'Active'}</span>
                        </div>
                        
                        {agent.chatbot_api && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span>API Connected</span>
                          </div>
                        )}
                        
                        {agent.chatbot_key && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            <span className="font-mono">***{agent.chatbot_key.slice(-4)}</span>
                          </div>
                        )}
                        
                        {(agent as any).model && (
                          <div className="mt-3 px-3 py-1.5 bg-slate-100 rounded-lg inline-block">
                            <span className="text-xs font-semibold text-slate-700">{(agent as any).model}</span>
                          </div>
                        )}
                      </div>
                      
                      {(agent as any).description && (
                        <p className="mt-4 text-sm text-slate-600 italic line-clamp-2">
                          {(agent as any).description}
                        </p>
                      )}
                    </div>
                    
                    {/* Arrow Icon */}
                    <div className="absolute bottom-4 right-4 text-slate-300 group-hover:text-blue-500 transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-lg border-2 border-dashed border-slate-300">
                <div className="w-24 h-24 rounded-full bg-yellow-100 flex items-center justify-center mb-6">
                  <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">No Agents Found</h3>
                <p className="text-slate-600 text-center max-w-md">
                  Create an agent first in the Agents tab to start viewing conversation logs.
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    // View 2: Conversations List with Monitoring Toggle
    if (view === 'conversations') {
      // Calculate monitoring stats
      const totalConversations = conversations.length;
      const voiceConversations = conversations.filter(c => c.from_source === 'voice').length;
      const chatConversations = conversations.filter(c => c.from_source !== 'voice').length;
      const activeToday = conversations.filter(c => {
        const updatedDate = new Date((c.updated_at || c.created_at) * 1000);
        const today = new Date();
        return updatedDate.toDateString() === today.toDateString();
      }).length;
      
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50 p-8">
          <div className="max-w-[1800px] mx-auto">
            {/* Header with Back Button */}
            <div className="mb-6 flex items-center gap-6">
              <button
                onClick={() => {
                  setView('agents');
                  setConversations([]);
                  setActiveTab('conversations'); // Reset tab when going back
                }}
                className="group flex items-center gap-2 px-5 py-3 bg-white hover:bg-slate-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-slate-200"
              >
                <svg className="w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">Back to Agents</span>
              </button>
              
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-slate-800 mb-2">
                  {selectedAgent?.name}
                </h1>
                <p className="text-slate-600 text-lg flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {conversations.length} conversation{conversations.length !== 1 ? 's' : ''} found
                </p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="mb-8 flex items-center gap-4 bg-white rounded-xl shadow-md p-2 border border-slate-200 w-fit">
              <button
                onClick={() => setActiveTab('conversations')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  activeTab === 'conversations'
                    ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-lg shadow-purple-200'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Conversations
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === 'conversations'
                    ? 'bg-white text-purple-600'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {conversations.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('monitoring')}
                className={`relative flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  activeTab === 'monitoring'
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-200'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {/* Live indicator dot */}
                {activeTab === 'monitoring' && lastMonitoringUpdate && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                )}
                
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Monitoring
                
                {/* LIVE badge */}
                {activeTab === 'monitoring' && lastMonitoringUpdate && !loadingMonitoring && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-400 text-green-900 animate-pulse">
                    LIVE
                  </span>
                )}
                
                {loadingMonitoring && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
              </button>
            </div>
            
            {/* Message Alert */}
            {message && (
              <div className={`mb-6 p-4 rounded-xl shadow-md backdrop-blur-sm border ${
                messageType === 'success' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : messageType === 'error' 
                  ? 'bg-red-50 border-red-200 text-red-800' 
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}>
                <div className="flex items-center gap-3">
                  {messageType === 'success' && (
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {messageType === 'error' && (
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {messageType === 'info' && (
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <span className="font-medium">{message}</span>
                </div>
              </div>
            )}
            
            {/* Content Area - Conditional based on active tab */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                </div>
                <p className="mt-6 text-slate-600 font-medium text-lg">Loading conversations...</p>
              </div>
            ) : conversations.length > 0 ? (
              <>
                {/* CONVERSATIONS TAB */}
                {activeTab === 'conversations' && (
                  <div className="space-y-4 max-w-6xl mx-auto">
                {conversations.map((conv, idx) => (
                  <button
                    key={conv.id}
                    onClick={() => viewConversation(conv)}
                    className="group w-full bg-white rounded-2xl p-6 shadow-md hover:shadow-2xl border-2 border-slate-200 hover:border-purple-400 transition-all duration-300 text-left overflow-hidden relative"
                  >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Content */}
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex-1 pr-4">
                        {/* Title */}
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-md group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-xl text-slate-800 group-hover:text-purple-600 transition-colors mb-1">
                              {conv.name || 'Untitled Conversation'}
                            </h3>
                            <p className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded inline-block">
                              {conv.id}
                            </p>
                          </div>
                        </div>
                        
                        {/* Metadata */}
                        <div className="grid grid-cols-2 gap-3 mt-4">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">Updated:</span>
                            <span>{new Date((conv.updated_at || conv.created_at) * 1000).toLocaleDateString()}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium capitalize">{conv.status || 'Normal'}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{new Date((conv.created_at || 0) * 1000).toLocaleString([], { 
                              month: 'short', 
                              day: 'numeric', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                            <span className="capitalize">{conv.from_source || 'API'}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Arrow */}
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 group-hover:bg-purple-500 transition-colors duration-300 flex-shrink-0">
                        <svg className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </div>
                    </div>
                  </button>
                ))}
                  </div>
                )}

                {/* MONITORING TAB */}
                {activeTab === 'monitoring' && (
                  <div className={`space-y-6 transition-all duration-500 ${loadingMonitoring ? 'opacity-75' : 'opacity-100'}`}>
                    {/* Monitoring Dashboard Header */}
                    <div className={`bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 rounded-3xl p-8 shadow-2xl text-white transition-all duration-300 ${loadingMonitoring ? 'ring-4 ring-blue-300 ring-opacity-50' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </div>
                            <div>
                              <h2 className="text-3xl font-bold">Live Analytics Dashboard</h2>
                              {lastMonitoringUpdate && (
                                <p className="text-sm opacity-75 mt-1 flex items-center gap-2">
                                  <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                  Last updated: {lastMonitoringUpdate.toLocaleTimeString()} • Auto-refreshes every 30s
                                </p>
                              )}
                            </div>
                          </div>
                          <p className="text-lg opacity-90 ml-15">
                            {monitoringData ? 'Real-time Platform Analytics - Last 7 Days' : 'Loading analytics & insights...'}
                          </p>
                        </div>
                        
                        {/* Refresh Button & Loading Spinner */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => selectedAgent && fetchMonitoringData(selectedAgent, true)}
                            disabled={loadingMonitoring}
                            className="group relative px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-white/30"
                          >
                            <svg 
                              className={`w-5 h-5 transition-transform duration-500 ${loadingMonitoring ? 'animate-spin' : 'group-hover:rotate-180'}`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>{loadingMonitoring ? 'Refreshing...' : 'Refresh Now'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Charts Grid - ALL 7 CHARTS - 3 Column Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {monitoringData?.chartData ? (
                    <>
                      {/* 1. Total Conversations */}
                      <MonitoringChart
                        data={monitoringData.chartData.conversations}
                        title="Total Conversations"
                        total={monitoringData.statistics.total_conversations}
                        color="#06b6d4"
                        showArea={true}
                      />

                      {/* 2. Active Users */}
                      <MonitoringChart
                        data={monitoringData.chartData.activeUsers}
                        title="Active Users"
                        total={monitoringData.statistics.total_end_users}
                        color="#f97316"
                        showArea={true}
                      />

                      {/* 3. Avg. Session Interactions */}
                      <MonitoringChart
                        data={monitoringData.chartData.avgInteractions}
                        title="Avg. Session Interactions"
                        total={monitoringData.statistics.avg_session_interactions?.toFixed(1) || '0'}
                        color="#06b6d4"
                        showArea={true}
                      />

                      {/* 4. Token Output Speed */}
                      <MonitoringChart
                        data={monitoringData.chartData.tokenSpeed}
                        title="Token Output Speed"
                        total={`${monitoringData.statistics.token_output_speed?.toFixed(2) || '0'} Token/s`}
                        color="#06b6d4"
                        showArea={true}
                      />

                      {/* 5. User Satisfaction Rate */}
                      <MonitoringChart
                        data={monitoringData.chartData.userSatisfaction}
                        title="User Satisfaction Rate"
                        total={monitoringData.statistics.user_satisfaction_rate || '0'}
                        color="#f97316"
                        showArea={true}
                      />

                      {/* 6. Token Usage */}
                      <MonitoringChart
                        data={monitoringData.chartData.tokenUsage}
                        title="Token Usage"
                        subtitle={`CONSUMED TOKENS (-$${monitoringData.statistics.total_token_cost?.toFixed(4) || '0.0000'})`}
                        total={`${(monitoringData.statistics.total_tokens / 1000).toFixed(0)}k`}
                        color="#3b82f6"
                        showArea={true}
                      />

                      {/* 7. Total Messages */}
                      <MonitoringChart
                        data={monitoringData.chartData.totalMessages}
                        title="Total Messages"
                        total={monitoringData.statistics.total_messages}
                        color="#06b6d4"
                        showArea={true}
                      />
                    </>
                  ) : (
                    /* Fallback: Simple stat cards while loading */
                    <>
                      <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">Total Conversations</h3>
                        <div className="text-5xl font-bold text-slate-800">{totalConversations}</div>
                        <p className="text-sm text-slate-500 mt-2">Last 7 Days</p>
                      </div>
                      
                      <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">Channel Breakdown</h3>
                        <div className="space-y-3 mt-4">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Voice</span>
                              <span className="font-bold">{voiceConversations}</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-purple-500 rounded-full transition-all"
                                style={{ width: `${totalConversations > 0 ? (voiceConversations / totalConversations) * 100 : 0}%` }}
                              ></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Chat</span>
                              <span className="font-bold">{chatConversations}</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500 rounded-full transition-all"
                                style={{ width: `${totalConversations > 0 ? (chatConversations / totalConversations) * 100 : 0}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-lg border-2 border-dashed border-slate-300">
                <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                  <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">No Conversations Found</h3>
                <p className="text-slate-600 text-center max-w-md">
                  This agent doesn't have any conversation history yet.
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    // View 3: Chat UI
    if (view === 'chat' && selectedConversation) {
      return (
        <ConversationViewer
          conversations={[selectedConversation]}
          onClose={() => {
            setView('conversations');
            setSelectedConversation(null);
          }}
        />
      );
    }
    
    return null;
  };

  return <>{renderContent()}</>;
}
