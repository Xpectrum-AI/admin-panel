'use client';

import React, { useState, useEffect } from 'react';
import ConversationViewer from './ConversationViewer';

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
      setMessage('📡 Fetching conversations from Dify...');
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
      
      console.log('🔍 Fetching conversations via Dify App API...');
      
      // Extract base URL from chatbot_api
      // Example: https://demos.xpectrum-ai.com/v1/chat-messages -> https://demos.xpectrum-ai.com/v1
      const baseUrl = agent.chatbot_api?.replace(/\/chat-messages$/, '') || 'https://demos.xpectrum-ai.com/v1';
      console.log('🔗 Base URL:', baseUrl);
      
      // Call Dify App API directly: GET /v1/conversations
      // Note: Dify requires a 'user' parameter. Using 'preview-user' which is the default in Dify UI
      const response = await fetch(`${baseUrl}/conversations?user=preview-user&limit=100`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Dify API error response:', errorText);
        throw new Error(`Failed to fetch conversations: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Conversations response:', data);
      
      const convList = data.data || [];
      
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
      }
    } catch (error) {
      console.error('❌ Error fetching conversations:', error);
      setMessage(`Failed to fetch conversations: ${error instanceof Error ? error.message : String(error)}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };
  
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
      
      console.log('🔍 Fetching messages via Dify App API...');
      
      // Extract base URL from chatbot_api
      const baseUrl = selectedAgent?.chatbot_api?.replace(/\/chat-messages$/, '') || 'https://demos.xpectrum-ai.com/v1';
      console.log('🔗 Base URL:', baseUrl);
      
      // Call Dify App API directly: GET /v1/messages
      // Note: Using 'preview-user' which is the default in Dify UI
      const response = await fetch(`${baseUrl}/messages?user=preview-user&conversation_id=${encodeURIComponent(conversation.id)}&limit=100`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Dify API error response:', errorText);
        throw new Error(`Failed to fetch messages: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const messages = data.data || [];
      
      console.log('✅ Messages response:', messages);
      
      setSelectedConversation({ ...conversation, messages });
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
        <div className="p-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Select an Agent</h2>
            
            {message && (
              <div className={`mb-4 p-4 rounded ${
                messageType === 'success' ? 'bg-green-100 text-green-800' :
                messageType === 'error' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {message}
              </div>
            )}
            
            {loadingAgents ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading agents...</p>
              </div>
            ) : agents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agent) => (
                  <button
                    key={agent.id || agent.name || Math.random()}
                    onClick={() => {
                      setSelectedAgent(agent);
                      fetchConversations(agent);
                    }}
                    disabled={loading}
                    className="p-6 border-2 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all text-left disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-xl">
                        {agent.name ? agent.name.charAt(0).toUpperCase() : 'A'}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{agent.name || 'Unnamed Agent'}</h3>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p className="font-medium">🤖 {agent.name || 'Unnamed Agent'}</p>
                      <p>📊 Status: <span className="font-semibold">{(agent as any).status || 'active'}</span></p>
                      <p>🔗 API: {agent.chatbot_api ? '✓ Connected' : '✗ Not configured'}</p>
                      <p>🔑 Key: {agent.chatbot_key ? '✓ ***' + agent.chatbot_key.slice(-4) : '✗ Not set'}</p>
                      {(agent as any).model && <p>🎯 Model: {(agent as any).model}</p>}
                      {(agent as any).description && <p className="text-xs italic mt-1">{(agent as any).description}</p>}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-yellow-50 rounded-lg">
                <p className="text-yellow-800">No agents found. Create an agent first in the Agents tab.</p>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    // View 2: Conversations List
    if (view === 'conversations') {
      return (
        <div className="p-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => {
                  setView('agents');
                  setConversations([]);
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
              >
                ← Back to Agents
              </button>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">Conversations for {selectedAgent?.name}</h2>
                <p className="text-sm text-gray-600">{conversations.length} conversations found</p>
              </div>
            </div>
            
            {message && (
              <div className={`mb-4 p-4 rounded ${
                messageType === 'success' ? 'bg-green-100 text-green-800' :
                messageType === 'error' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {message}
              </div>
            )}
            
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading conversations...</p>
              </div>
            ) : conversations.length > 0 ? (
              <div className="space-y-3">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => viewConversation(conv)}
                    className="w-full p-4 border-2 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{conv.name || 'Untitled Conversation'}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Updated: {new Date((conv.updated_at || conv.created_at) * 1000).toLocaleString()}
                        </p>
                        <div className="flex gap-4 mt-2 text-sm text-gray-500">
                          <span>📊 {conv.status || 'normal'}</span>
                          <span>🕒 {new Date((conv.created_at || 0) * 1000).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="text-blue-500 text-2xl">→</div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No conversations found</p>
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
