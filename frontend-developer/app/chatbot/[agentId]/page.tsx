'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Bot, Send, Loader2, MessageCircle, Phone, PhoneOff, Mic, MicOff, MoreVertical, RotateCcw, X } from 'lucide-react';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import { useTheme } from '../../contexts/ThemeContext';
import { logger } from '../../../lib/utils/logger';

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
  const { isDarkMode } = useTheme();

  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAgent, setIsLoadingAgent] = useState(true);
  const [conversationId, setConversationId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
          logger.log('🎯 Using agent config from URL parameters:', { apiUrl, apiKey: apiKey.substring(0, 10) + '...', name });
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
              logger.log('🎯 Found real agent for chatbot:', realAgent.agent_prefix);
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
          logger.log('⚠️ Could not fetch real agent data, using fallback:', fetchError);
        }

        // Fallback to chatbot agent API
        const response = await fetch(`/api/chatbot/agent/${agentId}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch agent: ${response.status}`);
        }

        const responseData = await response.json();
        logger.log('API Response:', responseData);
        const data = responseData.data || responseData; // Handle both wrapped and direct responses
        logger.log('Agent Config Data:', data);
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
        logger.error('Error fetching agent config:', err);
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
      logger.error('Error sending message:', error);
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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  if (isLoadingAgent) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-50'}`}>
        <div className="text-center">
          <Loader2 className={`h-12 w-12 animate-spin mx-auto mb-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading chatbot...</p>
        </div>
      </div>
    );
  }

  if (error || !agentConfig) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-50'}`}>
        <div className={`text-center p-8 rounded-2xl shadow-xl border max-w-md ${isDarkMode ? 'bg-gray-800/50 border-red-700/50' : 'bg-white border-red-200'}`}>
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>Error Loading Chatbot</h2>
          <p className={`mb-6 ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>{error || 'Agent not found'}</p>
          <a
            href="/"
            className={`inline-block px-6 py-3 rounded-xl font-medium transition-colors ${isDarkMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
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
        .dark .markdown-content pre,
        .dark .markdown-content code {
          background-color: rgba(0, 0, 0, 0.3);
        }
        .dark .markdown-content a {
          color: #60a5fa;
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

      <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-50'}`}>
        {/* Chat Interface */}
        <div className="relative z-10 w-full max-w-2xl mx-4">
          <div
            className={`rounded-2xl shadow-2xl w-full flex flex-col animate-fade-in-up border ${isDarkMode 
              ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-gray-700/50' 
              : 'bg-gradient-to-br from-white via-gray-50 to-white border-gray-200/50'
            }`}
            style={{
              height: '85vh',
              maxHeight: '800px',
              minHeight: '600px',
              animation: 'fadeInUp 0.3s ease-out forwards',
            }}
          >
            {/* Header */}
            <div className={`p-4 sm:p-6 rounded-t-2xl flex justify-between items-center border-b ${isDarkMode 
              ? 'bg-gradient-to-r from-gray-800/50 to-gray-900 border-gray-700/50' 
              : 'bg-gradient-to-r from-gray-50/50 to-white border-gray-200/50'
            }`}>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-md ${isDarkMode 
                  ? 'bg-gradient-to-br from-green-600 to-emerald-600 text-white' 
                  : 'bg-gradient-to-br from-green-500 to-emerald-500 text-white'
                }`}>
                  {agentConfig.avatar ? (
                    <img src={agentConfig.avatar} alt={agentConfig.name || agentConfig.agent_prefix} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <Bot className="w-6 h-6" />
                  )}
                </div>
                <div className="flex flex-col">
                  <h1 className={`text-base sm:text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {agentConfig.name || agentConfig.agent_prefix}
                  </h1>
                  <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    AI Assistant
                  </p>
                </div>
              </div>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className={`p-2 rounded-lg transition-colors ${isDarkMode 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
                {menuOpen && (
                  <div
                    className={`absolute right-0 mt-2 w-48 rounded-xl shadow-xl border z-50 ${isDarkMode 
                      ? 'bg-gray-800 border-gray-700' 
                      : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          clearChat();
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors ${isDarkMode 
                          ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        <RotateCcw className="h-4 w-4" />
                        Refresh Chat
                      </button>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          window.close();
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors ${isDarkMode 
                          ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        <X className="h-4 w-4" />
                        Close Chat
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Messages */}
            <div className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 ${isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50/50'}`}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} group`}
                >
                  <div
                    className={`max-w-[80%] sm:max-w-[75%] rounded-2xl p-3 sm:p-4 shadow-sm transition-all duration-200 group-hover:shadow-md ${message.type === 'user'
                        ? isDarkMode
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-br-md'
                          : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-br-md'
                        : isDarkMode
                          ? 'bg-gray-800 text-gray-100 rounded-bl-md border border-gray-700'
                          : 'bg-white text-gray-900 rounded-bl-md border border-gray-200'
                      }`}
                  >
                    <div className={`markdown-content text-sm sm:text-base leading-relaxed ${message.type === 'user' ? 'text-white' : isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      <MarkdownRenderer>
                        {message.message || ''}
                      </MarkdownRenderer>
                    </div>
                    <p className={`text-xs mt-2 ${message.type === 'user' 
                      ? 'text-green-100' 
                      : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className={`max-w-[80%] sm:max-w-[75%] rounded-2xl p-3 sm:p-4 ${isDarkMode 
                    ? 'bg-gray-800 text-gray-100 border border-gray-700' 
                    : 'bg-white text-gray-900 border border-gray-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="typing-dots">
                        <span className={isDarkMode ? 'bg-gray-400' : 'bg-gray-400'}></span>
                        <span className={isDarkMode ? 'bg-gray-400' : 'bg-gray-400'}></span>
                        <span className={isDarkMode ? 'bg-gray-400' : 'bg-gray-400'}></span>
                      </div>
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className={`p-4 sm:p-6 border-t ${isDarkMode 
              ? 'bg-gray-800/50 border-gray-700/50' 
              : 'bg-gradient-to-r from-gray-50 to-white border-gray-200/50'
            }`}>
              <div className="flex gap-3 items-end">
                <textarea
                  value={currentMessage}
                  onChange={(e) => {
                    setCurrentMessage(e.target.value);
                    // Auto-resize textarea
                    e.target.style.height = 'auto';
                    const newHeight = Math.min(e.target.scrollHeight, 150);
                    e.target.style.height = `${newHeight}px`;
                  }}
                  className={`flex-1 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent resize-none overflow-y-auto transition-all duration-200 leading-normal ${isDarkMode
                    ? 'bg-gray-700/50 border border-gray-600 text-gray-200 placeholder-gray-400 focus:bg-gray-700'
                    : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-white'
                  }`}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (!isLoading) sendMessage();
                    }
                  }}
                  rows={2}
                  style={{ minHeight: '48px', maxHeight: '150px' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !currentMessage.trim()}
                  className={`px-4 py-3 rounded-xl text-white transition-all duration-200 flex items-center justify-center flex-shrink-0 ${isLoading || !currentMessage.trim()
                      ? isDarkMode
                        ? "bg-gray-700 cursor-not-allowed text-gray-500"
                        : "bg-gray-300 cursor-not-allowed text-gray-500"
                      : isDarkMode
                        ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/20"
                        : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg shadow-green-500/30"
                    }`}
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin h-5 w-5" />
                  ) : (
                    <Send className="h-5 w-5" />
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
