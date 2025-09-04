'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Sparkles, Activity, Zap, MessageSquare, Users, Database, Settings, Bot, Phone, Clock, RefreshCw, Send, Menu, X } from 'lucide-react';

// Custom WhatsApp icon component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
  </svg>
);

// Backend-aligned interfaces
interface WhatsAppConversation {
  conversation_id: string;
  user_phone: string;
  last_message: string;
  ai_agent: string;
  status: 'active' | 'pending' | 'resolved';
  last_activity: string;
  message_count: number;
  agent_url: string;
  api_key: string;
}

interface WhatsAppMessage {
  type: 'user' | 'ai';
  message: string;
  timestamp: string;
  conversation_id: string;
}

interface WhatsAppConfig {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'pending';
  phone_number: string;
  provider: string;
  webhook_url: string;
  agent_url: string;
  api_key: string;
  description?: string;
}

// Sample data matching backend structure
const sampleWhatsAppConfigs: WhatsAppConfig[] = [
  {
    id: '1',
    name: 'Customer Support WhatsApp',
    status: 'active',
    phone_number: 'whatsapp:+15558207167',
    provider: 'Twilio WhatsApp Business API',
    webhook_url: '/whatsapp/webhook',
    agent_url: 'https://d22yt2oewbcglh.cloudfront.net/v1/chat-messages',
    api_key: 'app-y6KZcETrVIOgJTMIHb06UUFG',
    description: '24/7 customer support via WhatsApp'
  }
];

const sampleConversations: WhatsAppConversation[] = [
  {
    conversation_id: 'conv_abc123',
    user_phone: '+1234567890',
    last_message: 'Hello, how can you help me?',
    ai_agent: 'Riley',
    status: 'active',
    last_activity: '2024-01-15T10:30:00',
    message_count: 5,
    agent_url: 'https://d22yt2oewbcglh.cloudfront.net/v1/chat-messages',
    api_key: 'app-y6KZcETrVIOgJTMIHb06UUFG'
  },
  {
    conversation_id: 'conv_def456',
    user_phone: '+1987654321',
    last_message: 'I need help with my appointment',
    ai_agent: 'Elliot',
    status: 'pending',
    last_activity: '2024-01-15T09:15:00',
    message_count: 3,
    agent_url: 'https://d22yt2oewbcglh.cloudfront.net/v1/chat-messages',
    api_key: 'app-y6KZcETrVIOgJTMIHb06UUFG'
  }
];

const sampleMessages: WhatsAppMessage[] = [
  {
    type: 'user',
    message: 'Hello, how can you help me?',
    timestamp: '2024-01-15T10:30:00',
    conversation_id: 'conv_abc123'
  },
  {
    type: 'ai',
    message: 'Hi! I\'m here to help you with any questions or assistance you need. What can I do for you today?',
    timestamp: '2024-01-15T10:30:05',
    conversation_id: 'conv_abc123'
  }
];

interface WhatsAppTabProps {
  isDarkMode?: boolean;
}

export default function WhatsAppTab({ isDarkMode = false }: WhatsAppTabProps) {
  const [activeTab, setActiveTab] = useState<'conversations' | 'configuration' | 'analytics' | 'health'>('conversations');
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(sampleConversations[0]);
  const [selectedConfig, setSelectedConfig] = useState<WhatsAppConfig | null>(sampleWhatsAppConfigs[0]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleConversationSelect = (conversation: WhatsAppConversation) => {
    setSelectedConversation(conversation);
    setIsSidebarOpen(false); // Close sidebar when conversation is selected
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setIsStreaming(true);
    // Simulate AI response streaming
    setTimeout(() => {
      setIsStreaming(false);
      setNewMessage('');
    }, 2000);
  };

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <div className={`border shadow-xl backdrop-blur-sm ${isDarkMode ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-gray-700/50' : 'bg-gradient-to-br from-white via-gray-50 to-white border-gray-200/50'}`}>
        {/* Header */}
        <div className={`p-4 sm:p-6 lg:p-8 border-b ${isDarkMode ? 'border-gray-700/50 bg-gradient-to-r from-green-900/20 to-emerald-900/20' : 'border-gray-200/50 bg-gradient-to-r from-green-50 to-emerald-50'}`}>
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
            <div className="space-y-2 text-center sm:text-left">
              <div className="flex items-center gap-3 justify-center sm:justify-start">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                  <WhatsAppIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <h2 className={`text-xl sm:text-2xl lg:text-3xl font-bold bg-clip-text text-transparent ${isDarkMode ? 'bg-gradient-to-r from-white to-gray-300' : 'bg-gradient-to-r from-gray-900 to-gray-700'}`}>
                  WhatsApp Business
                </h2>
              </div>
              <p className={`text-sm sm:text-base lg:text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Conversational AI messaging with Dify integration</p>
            </div>
            <button className="group relative px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2 sm:gap-3 text-sm sm:text-base">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="font-semibold hidden sm:inline">New Conversation</span>
              <span className="font-semibold sm:hidden">New</span>
            </button>
          </div>
        </div>

        {/* Main Tabs */}
        <div className={`border-b ${isDarkMode ? 'border-gray-700/50 bg-gray-900' : 'border-gray-200/50 bg-white'}`}>
          <nav className="flex space-x-1 px-4 sm:px-8 py-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('conversations')}
              className={`group relative px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-medium text-xs sm:text-sm transition-all duration-300 flex items-center gap-1 sm:gap-2 flex-shrink-0 ${activeTab === 'conversations'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                : isDarkMode
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Conversations</span>
              <span className="sm:hidden">Chat</span>
            </button>
            <button
              onClick={() => setActiveTab('configuration')}
              className={`group relative px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-medium text-xs sm:text-sm transition-all duration-300 flex items-center gap-1 sm:gap-2 flex-shrink-0 ${activeTab === 'configuration'
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
              className={`group relative px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-medium text-xs sm:text-sm transition-all duration-300 flex items-center gap-1 sm:gap-2 flex-shrink-0 ${activeTab === 'analytics'
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                : isDarkMode
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Stats</span>
            </button>
            <button
              onClick={() => setActiveTab('health')}
              className={`group relative px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-medium text-xs sm:text-sm transition-all duration-300 flex items-center gap-1 sm:gap-2 flex-shrink-0 ${activeTab === 'health'
                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                : isDarkMode
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <Database className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">System Health</span>
              <span className="sm:hidden">Health</span>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className={`p-4 sm:p-6 lg:p-8 ${isDarkMode ? 'bg-gray-900' : ''} rounded-b-2xl`}>
          {activeTab === 'conversations' && (
            <div className="relative">
              {/* Sidebar Toggle - All Screens */}
              <div className="mb-4">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${isDarkMode
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-600'
                    : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200'
                    } shadow-sm hover:shadow-md`}
                >
                  <Menu className="h-4 w-4" />
                  <span className="text-sm">
                    {isSidebarOpen ? 'Hide Conversations' : 'Show Conversations'}
                  </span>
                </button>
              </div>

              {/* Backdrop */}
              {isSidebarOpen && (
                <div
                  className="fixed inset-0 bg-black/50 z-40"
                  onClick={() => setIsSidebarOpen(false)}
                />
              )}

              {/* Sliding Sidebar - All Screens */}
              <div className={`fixed top-0 bottom-0 left-0 z-50 w-64 sm:w-72 lg:w-80 xl:w-96 transform transition-all duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
                } ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r shadow-xl overflow-hidden`}>
                {/* Sidebar Header */}
                <div className={`flex items-center justify-between p-3 sm:p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h3 className={`font-semibold text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    WhatsApp Conversations
                  </h3>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className={`p-1 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                      }`}
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                </div>

                {/* Search */}
                <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="relative group">
                    <Search className={`absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 transition-colors ${isDarkMode ? 'text-gray-500 group-focus-within:text-green-400' : 'text-gray-400 group-focus-within:text-green-500'}`} />
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      className={`w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-xs sm:text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400'}`}
                    />
                  </div>
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-3">
                  {sampleConversations.map((conversation) => (
                    <button
                      key={conversation.conversation_id}
                      onClick={() => handleConversationSelect(conversation)}
                      className={`w-full p-2 sm:p-3 rounded-lg text-left transition-all duration-300 ${selectedConversation?.conversation_id === conversation.conversation_id
                        ? isDarkMode
                          ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-700/50 shadow-md'
                          : 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 shadow-md'
                        : isDarkMode
                          ? 'hover:bg-gray-700 border border-transparent hover:border-gray-600'
                          : 'hover:bg-gray-50 border border-transparent hover:border-gray-200'
                        }`}
                    >
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className={`text-sm sm:text-lg p-1 sm:p-1.5 rounded ${conversation.status === 'active'
                          ? isDarkMode ? 'bg-green-900/50' : 'bg-green-100'
                          : conversation.status === 'pending'
                            ? isDarkMode ? 'bg-yellow-900/50' : 'bg-yellow-100'
                            : isDarkMode ? 'bg-gray-900/50' : 'bg-gray-100'
                          }`}>
                          <WhatsAppIcon className={`h-3 w-3 sm:h-5 sm:w-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                            <h4 className={`font-medium text-xs sm:text-sm truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {conversation.user_phone}
                            </h4>
                            <div className={`px-1 sm:px-1.5 py-0.5 rounded text-xs font-medium ${conversation.status === 'active'
                              ? isDarkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800'
                              : conversation.status === 'pending'
                                ? isDarkMode ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                                : isDarkMode ? 'bg-gray-900/50 text-gray-300' : 'bg-gray-100 text-gray-800'
                              }`}>
                              {conversation.status}
                            </div>
                          </div>
                          <p className={`text-xs mb-0.5 sm:mb-1 truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {conversation.last_message}
                          </p>
                          <div className="flex items-center justify-between text-xs">
                            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {conversation.message_count} msgs
                            </span>
                            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {new Date(conversation.last_activity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Interface */}
              <div className="flex-1">
                {selectedConversation ? (
                  <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 border h-[400px] sm:h-[500px] lg:h-[600px] flex flex-col ${isDarkMode ? 'bg-gradient-to-br from-gray-800/30 to-gray-900 border-gray-700/50' : 'bg-gradient-to-br from-gray-50/30 to-white border-gray-200/50'}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`text-xl sm:text-2xl p-2 rounded-lg ${isDarkMode ? 'bg-green-900/50' : 'bg-green-100'}`}>
                        <WhatsAppIcon className={`h-6 w-6 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                      </div>
                      <div>
                        <h3 className={`text-lg sm:text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {selectedConversation.user_phone}
                        </h3>
                        <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          AI Agent: {selectedConversation.ai_agent}
                        </p>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 mb-4">
                      {sampleMessages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-xs sm:max-w-sm lg:max-w-md px-3 sm:px-4 py-2 rounded-lg ${message.type === 'user'
                            ? isDarkMode ? 'bg-green-600 text-white' : 'bg-green-500 text-white'
                            : isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-900'
                            }`}>
                            <p className="text-xs sm:text-sm">{message.message}</p>
                            <p className={`text-xs mt-1 ${message.type === 'user' ? 'text-green-100' : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))}
                      {isStreaming && (
                        <div className="flex justify-start">
                          <div className={`max-w-xs sm:max-w-sm lg:max-w-md px-3 sm:px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-900'}`}>
                            <div className="flex items-center gap-2">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                              <span className="text-xs sm:text-sm">AI is typing...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type your message..."
                        className={`w-full pl-3 sm:pl-4 pr-12 sm:pr-14 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 ${isDarkMode ? 'border-gray-600 bg-gray-800 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400'}`}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || isStreaming}
                        className={`absolute right-1 top-1/2 transform -translate-y-1/2 p-2 rounded-md transition-colors ${newMessage.trim() && !isStreaming
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : isDarkMode ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                      >
                        <Send className="h-3 w-3 sm:h-4 sm:w-4" strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <div className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl inline-block mb-4 sm:mb-6 ${isDarkMode ? 'bg-gradient-to-r from-green-900/50 to-emerald-900/50' : 'bg-gradient-to-r from-green-100 to-emerald-100'}`}>
                      <WhatsAppIcon className={`h-8 w-8 sm:h-12 sm:w-12 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                    </div>
                    <h3 className={`text-lg sm:text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Select a Conversation</h3>
                    <p className={`text-sm sm:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Choose a conversation from the list to start messaging</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'configuration' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Phone Number Configuration */}
                <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 border ${isDarkMode ? 'bg-gradient-to-br from-gray-800/30 to-gray-900 border-gray-700/50' : 'bg-gradient-to-br from-gray-50/30 to-white border-gray-200/50'}`}>
                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <Phone className={`h-5 w-5 sm:h-6 sm:w-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    <h3 className={`text-lg sm:text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Phone Number Configuration</h3>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className={`block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>WhatsApp Number</label>
                      <input
                        type="text"
                        value="whatsapp:+15558207167"
                        readOnly
                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border rounded-lg sm:rounded-xl bg-gray-100 ${isDarkMode ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-600'}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Webhook URL</label>
                      <input
                        type="text"
                        value="/whatsapp/webhook"
                        readOnly
                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border rounded-lg sm:rounded-xl bg-gray-100 ${isDarkMode ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-600'}`}
                      />
                    </div>
                  </div>
                </div>

                {/* AI Agent Configuration */}
                <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 border ${isDarkMode ? 'bg-gradient-to-br from-gray-800/30 to-gray-900 border-gray-700/50' : 'bg-gradient-to-br from-gray-50/30 to-white border-gray-200/50'}`}>
                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <Bot className={`h-5 w-5 sm:h-6 sm:w-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                    <h3 className={`text-lg sm:text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Dify AI Agent</h3>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className={`block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Agent URL</label>
                      <input
                        type="text"
                        value="https://d22yt2oewbcglh.cloudfront.net/v1/chat-messages"
                        readOnly
                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border rounded-lg sm:rounded-xl bg-gray-100 ${isDarkMode ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-600'}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>API Key</label>
                      <input
                        type="password"
                        value="app-y6KZcETrVIOgJTMIHb06UUFG"
                        readOnly
                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border rounded-lg sm:rounded-xl bg-gray-100 ${isDarkMode ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-600'}`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 border ${isDarkMode ? 'bg-gradient-to-br from-gray-800/30 to-gray-900 border-gray-700/50' : 'bg-gradient-to-br from-gray-50/30 to-white border-gray-200/50'}`}>
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <MessageSquare className={`h-5 w-5 sm:h-6 sm:w-6 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                  <h3 className={`text-lg sm:text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Active Conversations</h3>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-green-600">12</div>
                <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Currently active</p>
              </div>

              <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 border ${isDarkMode ? 'bg-gradient-to-br from-gray-800/30 to-gray-900 border-gray-700/50' : 'bg-gradient-to-br from-gray-50/30 to-white border-gray-200/50'}`}>
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <Activity className={`h-5 w-5 sm:h-6 sm:w-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <h3 className={`text-lg sm:text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Response Time</h3>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-blue-600">2.3s</div>
                <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Average AI response</p>
              </div>

              <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 border sm:col-span-2 lg:col-span-1 ${isDarkMode ? 'bg-gradient-to-br from-gray-800/30 to-gray-900 border-gray-700/50' : 'bg-gradient-to-br from-gray-50/30 to-white border-gray-200/50'}`}>
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <Users className={`h-5 w-5 sm:h-6 sm:w-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                  <h3 className={`text-lg sm:text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Total Users</h3>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-purple-600">1,247</div>
                <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Unique conversations</p>
              </div>
            </div>
          )}

          {activeTab === 'health' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Redis Connection */}
                <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 border ${isDarkMode ? 'bg-gradient-to-br from-gray-800/30 to-gray-900 border-gray-700/50' : 'bg-gradient-to-br from-gray-50/30 to-white border-gray-200/50'}`}>
                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <Database className={`h-5 w-5 sm:h-6 sm:w-6 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                    <h3 className={`text-lg sm:text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Redis Connection</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className={`font-medium text-sm sm:text-base ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>Connected</span>
                  </div>
                  <p className={`text-xs sm:text-sm mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Conversation data storage active</p>
                </div>

                {/* API Health */}
                <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 border ${isDarkMode ? 'bg-gradient-to-br from-gray-800/30 to-gray-900 border-gray-700/50' : 'bg-gradient-to-br from-gray-50/30 to-white border-gray-200/50'}`}>
                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <Activity className={`h-5 w-5 sm:h-6 sm:w-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    <h3 className={`text-lg sm:text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Dify API</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className={`font-medium text-sm sm:text-base ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>Healthy</span>
                  </div>
                  <p className={`text-xs sm:text-sm mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>AI agent responding normally</p>
                </div>
              </div>

              {/* System Endpoints */}
              <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 border ${isDarkMode ? 'bg-gradient-to-br from-gray-800/30 to-gray-900 border-gray-700/50' : 'bg-gradient-to-br from-gray-50/30 to-white border-gray-200/50'}`}>
                <h3 className={`text-lg sm:text-xl font-semibold mb-3 sm:mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>System Endpoints</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Health Check</p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>/whatsapp/health</p>
                  </div>
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Statistics</p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>/whatsapp/stats</p>
                  </div>
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Conversations</p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>/whatsapp/conversations</p>
                  </div>
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Data Cleanup</p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>/whatsapp/cleanup</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
