'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Bot, Send, Loader2, MessageCircle, Phone, PhoneOff, Mic, MicOff, MoreVertical, RotateCcw, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
          difyApiUrl: agentConfig.chatbot_api || process.env.NEXT_PUBLIC_CHATBOT_API_URL ,
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
    <>
      {/* Add CSS styles */}
      <style jsx>{`
        .markdown-content {
          overflow-wrap: break-word;
        }
        .markdown-content p {
          margin-bottom: 0.5rem;
        }
        .markdown-content h1 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        .markdown-content h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        .markdown-content h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        .markdown-content a {
          text-decoration: underline;
        }
        .markdown-content ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .markdown-content ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .markdown-content li {
          margin-bottom: 0.25rem;
        }
        .markdown-content pre {
          background-color: rgba(0, 0, 0, 0.1);
          padding: 0.5rem;
          border-radius: 60px;
          margin-bottom: 0.5rem;
          overflow-x: auto;
        }
        .markdown-content code {
          background-color: rgba(0, 0, 0, 0.1);
          padding: 0.125rem 0.25rem;
          border-radius: 60px;
          font-family: monospace;
          font-size: 0.875rem;
        }
        .markdown-content blockquote {
          border-left: 4px solid;
          padding-left: 0.5rem;
          margin-left: 0.5rem;
          font-style: italic;
          margin-bottom: 0.5rem;
          opacity: 0.8;
        }
        .markdown-content table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 0.5rem;
        }
        .markdown-content th, 
        .markdown-content td {
          border: 1px solid;
          padding: 0.25rem 0.5rem;
        }
        .text-white .markdown-content pre,
        .text-white .markdown-content code {
          background-color: rgba(0, 0, 0, 0.3);
        }
        .text-white .markdown-content a {
          color: #9dcdfb;
        }
        .typing-dots {
          display: inline-flex;
          align-items: center;
          height: 20px;
        }
        .typing-dots span {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 60px;
          background-color: #718096;
          margin: 0 2px;
          transform: translateY(0);
        }
        .typing-dots span:nth-child(1) {
          animation: dancing-dots 1.4s infinite 0s;
        }
        .typing-dots span:nth-child(2) {
          animation: dancing-dots 1.4s infinite 0.2s;
        }
        .typing-dots span:nth-child(3) {
          animation: dancing-dots 1.4s infinite 0.4s;
        }
        @keyframes dancing-dots {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.3s ease-out forwards;
        }
        textarea {
          color: #1f2937 !important;
          font-size: 14px;
        }
        textarea::placeholder {
          color: #6b7280 !important;
        }
      `}</style>

      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        {/* Background Image */}
        <div className="fixed top-0 left-0 w-full h-full z-0 overflow-hidden">
          <div
            className="w-full h-full object-cover"
            style={{
              background: 'linear-gradient(0deg, #1E88E5 0%, #64B5F6 30%, #BBDEFB 60%, #FFFFFF 100%)',
              opacity: 0.9,
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Chat Interface */}
        <div className="relative z-10">
          <div
            className="bg-white rounded-[30px] shadow-2xl w-[460px] flex flex-col animate-fade-in-up"
            style={{
              background: 'linear-gradient(0deg, #1E88E5 0%, #64B5F6 30%, #BBDEFB 60%, #FFFFFF 100%)',
              height: '720px',
              animation: 'fadeInUp 0.3s ease-out forwards',
            }}
          >
            {/* Header */}
            <div className="text-white p-4 rounded-t-[30px] flex justify-between items-center"
              style={{ backgroundColor: '#1E88E5' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-white font-medium">
                  {agentConfig.avatar ? (
                    <img src={agentConfig.avatar} alt={agentConfig.name || agentConfig.agent_prefix} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    (agentConfig.name || agentConfig.agent_prefix || 'A').charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex flex-col">
                  <h1 className="text-lg font-semibold text-white">{agentConfig.name || agentConfig.agent_prefix}</h1>
                  <p className="text-xs text-blue-100">AI Assistant</p>
                </div>
              </div>
              <div className="relative">
                <button
                  onClick={() => document.getElementById('menu-dropdown')?.classList.toggle('hidden')}
                  className="text-white hover:text-gray-200"
                >
                  <MoreVertical className="h-6 w-6" />
                </button>
                <div
                  id="menu-dropdown"
                  className="hidden absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-lg z-50"
                >
                  <div className="py-1">
                    <button
                      onClick={() => {
                        document.getElementById('menu-dropdown')?.classList.add('hidden');
                        clearChat();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <RotateCcw className="h-5 w-5 mr-2" />
                      Refresh Chat
                    </button>
                    <button
                      onClick={() => {
                        document.getElementById('menu-dropdown')?.classList.add('hidden');
                        window.close();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <X className="h-5 w-5 mr-2" />
                      Close Chat
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-3 ${message.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white bg-opacity-80 text-gray-800'
                      }`}
                  >
                    <div className={`markdown-content text-sm ${message.type === 'user' ? 'text-white' : 'text-gray-800'}`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.message}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl p-3 bg-white bg-opacity-80">
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4">
              <div className="flex gap-2 items-center">
                <textarea
                  value={currentMessage}
                  onChange={(e) => {
                    setCurrentMessage(e.target.value);
                    // Auto-resize textarea
                    e.target.style.height = 'auto';
                    const newHeight = Math.min(e.target.scrollHeight, 150);
                    e.target.style.height = `${newHeight}px`;
                  }}
                  className="flex-1 border border-gray-300 rounded-2xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none overflow-y-auto bg-white text-gray-900 placeholder-gray-500"
                  placeholder="Type your message..."
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (!isLoading) sendMessage();
                    }
                  }}
                  rows={2}
                  style={{ minHeight: '80px', maxHeight: '150px' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-2xl text-white ${isLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-500 hover:bg-blue-600"
                    } transition-colors duration-200`}
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin h-5 w-5" />
                  ) : (
                    <Send className="h-5 w-5" style={{ transform: 'rotate(45deg)' }} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
