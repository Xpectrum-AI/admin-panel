'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Bot, Send, Loader2, MessageCircle, Phone, PhoneOff, Mic, MicOff } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'bot';
  message: string;
  timestamp: Date;
}

interface AgentConfig {
  id?: string;
  _id?: string;
  name?: string;
  agent_prefix?: string;
  chatbot_key?: string;
  chatbot_api?: string;
  initial_message?: string;
  avatar?: string;
  description?: string;
}

export default function ChatbotPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const agentId = params.agentId as string;

  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAgent, setIsLoadingAgent] = useState(true);
  const [conversationId, setConversationId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch agent configuration
  useEffect(() => {
    const fetchAgentConfig = async () => {
      try {
        setIsLoadingAgent(true);

        // First try to get configuration from URL parameters (passed from AgentsTab)
        const apiUrl = searchParams.get('api_url');
        const apiKey = searchParams.get('api_key');
        const initialMessage = searchParams.get('initial_message');
        const name = searchParams.get('name');

        if (apiUrl && apiKey) {
          console.log('🎯 Using agent config from URL parameters:', { apiUrl, apiKey: apiKey.substring(0, 10) + '...', name });
          const configFromUrl: AgentConfig = {
            _id: agentId,
            agent_prefix: agentId,
            name: name || agentId,
            chatbot_api: apiUrl,
            chatbot_key: apiKey,
            initial_message: initialMessage || 'Hello! How can I help you today?'
          };

          setAgentConfig(configFromUrl);

          // Add welcome message if available
          if (configFromUrl.initial_message) {
            const welcomeMessage: Message = {
              id: 'welcome',
              type: 'bot',
              message: configFromUrl.initial_message,
              timestamp: new Date()
            };
            setMessages([welcomeMessage]);
          }

          // Set page title
          document.title = `${configFromUrl.name || configFromUrl.agent_prefix} | Chat`;
          return;
        }

        // Fallback: try to get the agent from the agents API (same as widget preview)
        try {
          const agentsResponse = await fetch('/api/agents/by-org/default_org');
          if (agentsResponse.ok) {
            const agentsData = await agentsResponse.json();
            const realAgent = agentsData.data?.find((agent: any) =>
              agent.agent_prefix === agentId || agent.name === agentId || agent._id === agentId
            );

            if (realAgent) {
              console.log('🎯 Found real agent for chatbot:', realAgent.agent_prefix);
              setAgentConfig(realAgent);

              // Add welcome message if available
              if (realAgent.initial_message) {
                const welcomeMessage: Message = {
                  id: 'welcome',
                  type: 'bot',
                  message: realAgent.initial_message,
                  timestamp: new Date()
                };
                setMessages([welcomeMessage]);
              }

              // Set page title
              document.title = `${realAgent.name || realAgent.agent_prefix} | Chat`;
              return;
            }
          }
        } catch (fetchError) {
          console.log('⚠️ Could not fetch real agent data, using fallback:', fetchError);
        }

        // Fallback to chatbot agent API
        const response = await fetch(`/api/chatbot/agent/${agentId}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch agent: ${response.status}`);
        }

        const responseData = await response.json();
        console.log('API Response:', responseData);
        const data = responseData.data || responseData; // Handle both wrapped and direct responses
        console.log('Agent Config Data:', data);
        setAgentConfig(data);

        // Add welcome message if available
        if (data.initial_message) {
          const welcomeMessage: Message = {
            id: 'welcome',
            type: 'bot',
            message: data.initial_message,
            timestamp: new Date()
          };
          setMessages([welcomeMessage]);
        }

        // Set page title
        document.title = `${data.name || data.agent_prefix} | Chat`;

      } catch (err) {
        console.error('Error fetching agent config:', err);
        setError(err instanceof Error ? err.message : 'Failed to load agent');
      } finally {
        setIsLoadingAgent(false);
      }
    };

    if (agentId) {
      fetchAgentConfig();
    }
  }, [agentId, searchParams]);

  const sendMessage = async () => {
    if (!currentMessage.trim() || !agentConfig?.chatbot_key || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      message: currentMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          difyApiUrl: agentConfig.chatbot_api || process.env.NEXT_PUBLIC_CHATBOT_API_URL || 'https://d22yt2oewbcglh.cloudfront.net/v1',
          difyApiKey: agentConfig.chatbot_key,
          message: currentMessage,
          conversationId: conversationId,
          useStreaming: true // Use streaming mode for full chatbot page (agent supports streaming)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Update conversation ID if provided
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        message: data.answer || 'Sorry, I could not process your request.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        message: error instanceof Error ? error.message : 'Sorry, there was an error connecting to the chatbot. Please check your API configuration.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setConversationId('');

    // Re-add welcome message if available
    if (agentConfig?.initial_message) {
      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'bot',
        message: agentConfig.initial_message,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  };

  if (isLoadingAgent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading chatbot...</p>
        </div>
      </div>
    );
  }

  if (error || !agentConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center bg-red-100 dark:bg-red-900/20 p-6 rounded-lg max-w-md">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-red-700 dark:text-red-400 text-xl mb-2">Error Loading Chatbot</h2>
          <p className="text-red-600 dark:text-red-300 mb-4">{error || 'Agent not found'}</p>
          <a
            href="/"
            className="inline-block bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
              {agentConfig.avatar ? (
                <img src={agentConfig.avatar} alt={agentConfig.name || agentConfig.agent_prefix} className="w-full h-full object-cover rounded-full" />
              ) : (
                (agentConfig.name || agentConfig.agent_prefix || 'A').charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{agentConfig.name || agentConfig.agent_prefix}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">AI Assistant</p>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            Clear Chat
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.type === 'user'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                  }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                <p className={`text-xs mt-1 ${message.type === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-xs px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat Input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            <button
              onClick={sendMessage}
              disabled={!currentMessage.trim() || isLoading}
              className={`px-6 py-3 rounded-lg transition-colors flex items-center gap-2 ${currentMessage.trim() && !isLoading
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
                : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
